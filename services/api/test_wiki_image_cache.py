import io
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

import requests
from flask import Flask
from PIL import Image

import wikiImageCache as wiki_image_cache_module
from imageManager import ImageStore
from wikiImageCache import (
  WikiImageCapacityError,
  WikiImageCache,
  WikiImageRequestError,
  WikiImageUpstreamError,
  exclusive_file_lock,
)


SOURCE_URL = "https://oldschool.runescape.wiki/images/Test.png"
PUBLIC_DNS_RESULT = [(2, 1, 6, "", ("104.20.1.1", 443))]


def image_bytes(format_name="PNG", animated=False):
  buffer = io.BytesIO()
  frames = [
    Image.new("RGB", (2, 2), (255, 0, 0)),
    Image.new("RGB", (2, 2), (0, 255, 0)),
  ]
  save_options = {"format": format_name}
  if animated:
    save_options.update({
      "save_all": True,
      "append_images": frames[1:],
      "duration": [50, 50],
      "loop": 0,
    })
  frames[0].save(buffer, **save_options)
  return buffer.getvalue()


class FakeResponse:
  def __init__(self, body=b"", status_code=200, headers=None):
    self.body = body
    self.status_code = status_code
    self.headers = dict(headers or {})
    if body and "Content-Length" not in self.headers:
      self.headers["Content-Length"] = str(len(body))

  def __enter__(self):
    return self

  def __exit__(self, exc_type, exc, traceback):
    return False

  def raise_for_status(self):
    if self.status_code >= 400:
      raise requests.HTTPError(f"HTTP {self.status_code}")

  def iter_content(self, chunk_size):
    for offset in range(0, len(self.body), chunk_size):
      yield self.body[offset:offset + chunk_size]


class TestExclusiveFileLock(unittest.TestCase):
  def test_waits_without_using_a_blocking_lock(self):
    with tempfile.TemporaryFile() as lock_file:
      with (
        patch.object(
          wiki_image_cache_module,
          "_try_lock_file",
          side_effect=(False, False, True),
        ),
        patch.object(wiki_image_cache_module, "_unlock_file") as unlock,
        patch.object(wiki_image_cache_module.time, "sleep") as sleep,
      ):
        with exclusive_file_lock(lock_file):
          pass

    self.assertEqual(sleep.call_count, 2)
    sleep.assert_called_with(0.05)
    unlock.assert_called_once_with(lock_file)


class TestWikiImageCache(unittest.TestCase):
  def make_cache(self, root, **overrides):
    cache = WikiImageCache(root, signing_key="test-signing-key")
    settings = {
      "MAX_SOURCE_BYTES": 1024 * 1024,
      "MAX_PIXELS": 10_000,
      "MAX_CACHE_BYTES": 4 * 1024 * 1024,
      "MAX_CACHE_ENTRIES": 100,
    }
    settings.update({name.upper(): value for name, value in overrides.items()})
    for name, value in settings.items():
      setattr(cache, name, value)
    return cache

  def signed_request(self, cache, source_url=SOURCE_URL):
    normalized = cache.normalize_url(source_url)
    return normalized, cache.signature(normalized)

  def test_normalizes_approved_https_image_url(self):
    with tempfile.TemporaryDirectory() as tmp:
      cache = self.make_cache(tmp)
      normalized = cache.normalize_url(
        " https://OLDSCHOOL.RUNESCAPE.WIKI/images/Test.png#preview "
      )
    self.assertEqual(normalized, SOURCE_URL)

  def test_strips_wiki_cache_buster(self):
    source_url = (
      "https://oldschool.runescape.wiki/images/thumb/"
      "Red_d%27hide_body_detail.png/180px-Red_d%27hide_body_detail.png?42f5b"
    )
    with tempfile.TemporaryDirectory() as tmp:
      cache = self.make_cache(tmp)
      normalized = cache.normalize_url(source_url)

    self.assertEqual(
      normalized,
      (
        "https://oldschool.runescape.wiki/images/thumb/"
        "Red_d%27hide_body_detail.png/180px-Red_d%27hide_body_detail.png"
      ),
    )

  def test_rejects_unsafe_or_non_image_urls(self):
    rejected_urls = (
      "http://oldschool.runescape.wiki/images/Test.png",
      "https://example.com/images/Test.png",
      "https://user:pass@oldschool.runescape.wiki/images/Test.png",
      "https://oldschool.runescape.wiki/w/Test.png",
      "https://oldschool.runescape.wiki/images/Test.png?variant=1",
      "https://[invalid/images/Test.png",
    )
    with tempfile.TemporaryDirectory() as tmp:
      cache = self.make_cache(tmp)
      for source_url in rejected_urls:
        with self.subTest(source_url=source_url):
          with self.assertRaises(WikiImageRequestError):
            cache.normalize_url(source_url)

  def test_public_url_is_signed(self):
    app = Flask(__name__)
    with tempfile.TemporaryDirectory() as tmp:
      cache = self.make_cache(tmp)
      with app.test_request_context(base_url="https://praynr.com"):
        result = cache.public_url(
          SOURCE_URL,
          "/static/uploads/board-images",
        )

    parsed = urlparse(result)
    query = parse_qs(parsed.query)
    self.assertEqual(parsed.path, "/static/uploads/board-images/wiki-cache")
    self.assertEqual(query["url"], [SOURCE_URL])
    self.assertEqual(query["sig"], [cache.signature(SOURCE_URL)])

  def test_invalid_signature_is_rejected_before_download(self):
    with tempfile.TemporaryDirectory() as tmp:
      cache = self.make_cache(tmp)
      with patch.object(cache, "_download") as download:
        with self.assertRaisesRegex(WikiImageRequestError, "signature"):
          cache.get_or_download(SOURCE_URL, "invalid")
      download.assert_not_called()

  def test_cache_hit_does_not_download(self):
    with tempfile.TemporaryDirectory() as tmp:
      cache = self.make_cache(tmp)
      normalized, signature = self.signed_request(cache)
      key = cache.cache_key(normalized)
      expected = Path(tmp) / f"{key}.png"
      expected.write_bytes(image_bytes())

      with patch.object(cache, "_download") as download:
        result = cache.get_or_download(normalized, signature)

      self.assertEqual(result, expected)
      download.assert_not_called()

  @patch("wikiImageCache.socket.getaddrinfo", return_value=PUBLIC_DNS_RESULT)
  @patch("wikiImageCache.requests.get")
  def test_cache_miss_downloads_once(self, requests_get, _getaddrinfo):
    requests_get.return_value = FakeResponse(image_bytes())
    with tempfile.TemporaryDirectory() as tmp:
      cache = self.make_cache(tmp)
      normalized, signature = self.signed_request(cache)

      first = cache.get_or_download(normalized, signature)
      second = cache.get_or_download(normalized, signature)

      self.assertEqual(first, second)
      self.assertTrue(first.exists())
      self.assertEqual(requests_get.call_count, 1)

  @patch("wikiImageCache.socket.getaddrinfo", return_value=PUBLIC_DNS_RESULT)
  @patch("wikiImageCache.requests.get")
  def test_redirects_are_followed_manually(self, requests_get, _getaddrinfo):
    redirected_url = "https://runescape.wiki/images/Test.png"
    requests_get.side_effect = [
      FakeResponse(status_code=302, headers={"Location": redirected_url}),
      FakeResponse(image_bytes()),
    ]
    with tempfile.TemporaryDirectory() as tmp:
      cache = self.make_cache(tmp)
      normalized, signature = self.signed_request(cache)
      result = cache.get_or_download(normalized, signature)

    self.assertTrue(result.name.endswith(".png"))
    self.assertEqual(requests_get.call_count, 2)
    for call in requests_get.call_args_list:
      self.assertFalse(call.kwargs["allow_redirects"])

  @patch("wikiImageCache.socket.getaddrinfo")
  @patch("wikiImageCache.requests.get")
  def test_private_redirect_is_rejected_before_second_request(
    self,
    requests_get,
    getaddrinfo,
  ):
    getaddrinfo.side_effect = [
      PUBLIC_DNS_RESULT,
      [(2, 1, 6, "", ("127.0.0.1", 443))],
    ]
    requests_get.return_value = FakeResponse(
      status_code=302,
      headers={"Location": "https://runescape.wiki/images/Private.png"},
    )
    with tempfile.TemporaryDirectory() as tmp:
      cache = self.make_cache(tmp)
      normalized, signature = self.signed_request(cache)
      with self.assertRaisesRegex(WikiImageUpstreamError, "non-public"):
        cache.get_or_download(normalized, signature)

    self.assertEqual(requests_get.call_count, 1)

  @patch("wikiImageCache.socket.getaddrinfo")
  def test_rejects_private_initial_address(self, getaddrinfo):
    getaddrinfo.return_value = [(2, 1, 6, "", ("127.0.0.1", 443))]
    with tempfile.TemporaryDirectory() as tmp:
      cache = self.make_cache(tmp)
      normalized, signature = self.signed_request(cache)
      with self.assertRaisesRegex(WikiImageUpstreamError, "non-public"):
        cache.get_or_download(normalized, signature)

  @patch("wikiImageCache.socket.getaddrinfo", return_value=PUBLIC_DNS_RESULT)
  @patch("wikiImageCache.requests.get")
  def test_rejects_oversized_response(self, requests_get, _getaddrinfo):
    requests_get.return_value = FakeResponse(
      image_bytes(),
      headers={"Content-Length": "2048"},
    )
    with tempfile.TemporaryDirectory() as tmp:
      cache = self.make_cache(tmp, max_source_bytes=1024)
      normalized, signature = self.signed_request(cache)
      with self.assertRaisesRegex(WikiImageUpstreamError, "too large"):
        cache.get_or_download(normalized, signature)

  @patch("wikiImageCache.socket.getaddrinfo", return_value=PUBLIC_DNS_RESULT)
  @patch("wikiImageCache.requests.get")
  def test_rejects_invalid_image_content(self, requests_get, _getaddrinfo):
    requests_get.return_value = FakeResponse(b"not an image")
    with tempfile.TemporaryDirectory() as tmp:
      cache = self.make_cache(tmp)
      normalized, signature = self.signed_request(cache)
      with self.assertRaisesRegex(WikiImageUpstreamError, "readable image"):
        cache.get_or_download(normalized, signature)

  @patch("wikiImageCache.socket.getaddrinfo", return_value=PUBLIC_DNS_RESULT)
  @patch("wikiImageCache.requests.get")
  def test_preserves_animated_gif(self, requests_get, _getaddrinfo):
    requests_get.return_value = FakeResponse(image_bytes("GIF", animated=True))
    with tempfile.TemporaryDirectory() as tmp:
      cache = self.make_cache(tmp)
      normalized, signature = self.signed_request(cache)
      result = cache.get_or_download(normalized, signature)
      with Image.open(result) as image:
        self.assertEqual(image.format, "GIF")
        self.assertTrue(getattr(image, "is_animated", False))
        self.assertGreater(image.n_frames, 1)

  @patch("wikiImageCache.socket.getaddrinfo", return_value=PUBLIC_DNS_RESULT)
  @patch("wikiImageCache.requests.get")
  def test_rejects_new_entry_when_cache_is_full(self, requests_get, _getaddrinfo):
    requests_get.return_value = FakeResponse(image_bytes())
    with tempfile.TemporaryDirectory() as tmp:
      cache = self.make_cache(tmp, max_cache_entries=1)
      (Path(tmp) / ("a" * 64 + ".png")).write_bytes(image_bytes())
      normalized, signature = self.signed_request(cache)
      with self.assertRaisesRegex(WikiImageCapacityError, "entry limit"):
        cache.get_or_download(normalized, signature)


class TestImageStoreWikiCache(unittest.TestCase):
  def make_store(self, cache):
    return ImageStore(
      url_prefix="/static/uploads/board-images",
      upload_root=cache.cache_root / "uploads",
      max_source_bytes=1024 * 1024,
      max_pixels=10_000,
      target_kb=50,
      remote_cache=cache,
    )

  def test_rewrites_approved_url_when_cache_is_configured(self):
    app = Flask(__name__)
    with tempfile.TemporaryDirectory() as tmp:
      cache = WikiImageCache(tmp, signing_key="test-signing-key")
      store = self.make_store(cache)
      with app.test_request_context(base_url="https://praynr.com"):
        result = store.public_url(SOURCE_URL)
    self.assertIn("/wiki-cache?url=", result)
    self.assertIn("&sig=", result)

  def test_signed_cache_url_round_trips_to_storage_source(self):
    app = Flask(__name__)
    with tempfile.TemporaryDirectory() as tmp:
      cache = WikiImageCache(tmp, signing_key="test-signing-key")
      store = self.make_store(cache)
      with app.test_request_context(base_url="https://praynr.com"):
        public_url = store.public_url(SOURCE_URL)

      self.assertEqual(store.storage_url(public_url), SOURCE_URL)

  def test_tampered_cache_url_is_not_unwrapped(self):
    with tempfile.TemporaryDirectory() as tmp:
      cache = WikiImageCache(tmp, signing_key="test-signing-key")
      store = self.make_store(cache)
      tampered_url = (
        "https://praynr.com/static/uploads/board-images/wiki-cache"
        f"?url={SOURCE_URL}&sig=invalid"
      )

      self.assertEqual(store.storage_url(tampered_url), tampered_url)

  def test_generated_signing_key_persists_and_rewrites_url(self):
    app = Flask(__name__)
    with tempfile.TemporaryDirectory() as tmp:
      first_cache = WikiImageCache(tmp)
      first_key = first_cache.signing_key
      second_cache = WikiImageCache(tmp)
      store = self.make_store(second_cache)
      with app.test_request_context(base_url="https://praynr.com"):
        result = store.public_url(SOURCE_URL)
      second_key = second_cache.signing_key

    self.assertEqual(len(first_key), 32)
    self.assertEqual(first_key, second_key)
    self.assertIn("/wiki-cache?url=", result)


if __name__ == "__main__":
  unittest.main()
