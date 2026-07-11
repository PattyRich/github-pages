import io
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

from flask import Flask
from PIL import Image

from imageManager import WikiImageCache


def png_bytes():
  buffer = io.BytesIO()
  Image.new("RGB", (2, 2), (255, 0, 0)).save(buffer, format="PNG")
  return buffer.getvalue()


class FakeResponse:
  def __init__(self, body, url="https://oldschool.runescape.wiki/images/Test.png"):
    self.body = body
    self.url = url
    self.headers = {
      "Content-Type": "image/png",
      "Content-Length": str(len(body)),
    }

  def __enter__(self):
    return self

  def __exit__(self, exc_type, exc, traceback):
    return False

  def raise_for_status(self):
    return None

  def iter_content(self, chunk_size):
    yield self.body


class TestWikiImageCache(unittest.TestCase):
  def make_cache(self, root):
    return WikiImageCache(
      cache_root=root,
      max_source_bytes=1024 * 1024,
      max_pixels=10_000,
    )

  def test_normalizes_approved_https_url(self):
    with tempfile.TemporaryDirectory() as tmp:
      cache = self.make_cache(tmp)
      normalized = cache.normalize_url(
        " https://OLDschool.Runescape.Wiki/images/Test.png#preview "
      )
      self.assertEqual(
        normalized,
        "https://oldschool.runescape.wiki/images/Test.png",
      )

  def test_rejects_http_and_unapproved_hosts(self):
    with tempfile.TemporaryDirectory() as tmp:
      cache = self.make_cache(tmp)
      with self.assertRaisesRegex(ValueError, "HTTPS"):
        cache.normalize_url("http://oldschool.runescape.wiki/images/Test.png")
      with self.assertRaisesRegex(ValueError, "approved Wiki host"):
        cache.normalize_url("https://example.com/Test.png")

  def test_same_url_uses_same_cache_key(self):
    with tempfile.TemporaryDirectory() as tmp:
      cache = self.make_cache(tmp)
      first = cache.normalize_url(
        "https://oldschool.runescape.wiki/images/Test.png#one"
      )
      second = cache.normalize_url(
        "https://OLDSCHOOL.RUNESCAPE.WIKI/images/Test.png#two"
      )
      self.assertEqual(cache.cache_key(first), cache.cache_key(second))

  def test_cache_hit_does_not_download(self):
    with tempfile.TemporaryDirectory() as tmp:
      cache = self.make_cache(tmp)
      source_url = "https://oldschool.runescape.wiki/images/Test.png"
      key = cache.cache_key(cache.normalize_url(source_url))
      expected = Path(tmp) / f"{key}.png"
      expected.write_bytes(png_bytes())

      with patch.object(cache, "_download") as download:
        result = cache.get_or_download(source_url)

      self.assertEqual(result, expected)
      download.assert_not_called()

  @patch("imageManager.socket.getaddrinfo")
  @patch("imageManager.requests.get")
  def test_cache_miss_downloads_once(self, requests_get, getaddrinfo):
    getaddrinfo.return_value = [
      (2, 1, 6, "", ("104.20.1.1", 443)),
    ]
    requests_get.return_value = FakeResponse(png_bytes())

    with tempfile.TemporaryDirectory() as tmp:
      cache = self.make_cache(tmp)
      source_url = "https://oldschool.runescape.wiki/images/Test.png"

      first = cache.get_or_download(source_url)
      second = cache.get_or_download(source_url)

      self.assertEqual(first, second)
      self.assertTrue(first.exists())
      self.assertEqual(requests_get.call_count, 1)

  @patch("imageManager.socket.getaddrinfo")
  def test_rejects_private_resolved_address(self, getaddrinfo):
    getaddrinfo.return_value = [
      (2, 1, 6, "", ("127.0.0.1", 443)),
    ]

    with tempfile.TemporaryDirectory() as tmp:
      cache = self.make_cache(tmp)
      with self.assertRaisesRegex(ValueError, "non-public"):
        cache.get_or_download(
          "https://oldschool.runescape.wiki/images/Test.png"
        )

  def test_public_url_uses_existing_board_image_route(self):
    app = Flask(__name__)
    with tempfile.TemporaryDirectory() as tmp:
      cache = self.make_cache(tmp)
      with app.test_request_context(base_url="https://praynr.com"):
        result = cache.public_url(
          "https://oldschool.runescape.wiki/images/Test.png",
          "/static/uploads/board-images",
        )

    self.assertTrue(
      result.startswith(
        "https://praynr.com/static/uploads/board-images/wiki-cache?url="
      )
    )
    self.assertIn("oldschool.runescape.wiki", result)


if __name__ == "__main__":
  unittest.main()
