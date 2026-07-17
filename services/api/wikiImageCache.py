import hashlib
import hmac
import io
import ipaddress
import os
import re
import secrets
import socket
import tempfile
from contextlib import contextmanager
from pathlib import Path
from urllib.parse import parse_qs, urlencode, urljoin, urlparse, urlunparse

import requests
from flask import request, send_file
from PIL import Image

from logger import get_logger

log = get_logger(__name__)


if os.name == "nt":
  import msvcrt

  def _lock_file(lock_file):
    lock_file.seek(0)
    if lock_file.read(1) == b"":
      lock_file.write(b"\0")
      lock_file.flush()
    lock_file.seek(0)
    msvcrt.locking(lock_file.fileno(), msvcrt.LK_LOCK, 1)

  def _unlock_file(lock_file):
    lock_file.seek(0)
    msvcrt.locking(lock_file.fileno(), msvcrt.LK_UNLCK, 1)
else:
  import fcntl

  def _lock_file(lock_file):
    fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX)

  def _unlock_file(lock_file):
    fcntl.flock(lock_file.fileno(), fcntl.LOCK_UN)


class WikiImageRequestError(ValueError):
  """The client supplied an invalid or unauthorized cache request."""


class WikiImageUpstreamError(ValueError):
  """The approved upstream did not provide a safe, usable image."""


class WikiImageCapacityError(ValueError):
  """The shared cache has reached its fixed capacity."""


@contextmanager
def exclusive_file_lock(lock_file):
  """Hold an advisory exclusive lock on Linux or Windows."""
  _lock_file(lock_file)
  try:
    yield
  finally:
    _unlock_file(lock_file)


def atomic_write(destination, data, prefix):
  with tempfile.NamedTemporaryFile(
    dir=destination.parent,
    prefix=prefix,
    delete=False,
  ) as temporary:
    temporary.write(data)
    temporary_path = Path(temporary.name)
  try:
    os.replace(temporary_path, destination)
  finally:
    temporary_path.unlink(missing_ok=True)


class WikiImageCache:
  """Shared, persistent, download-on-first-use cache for approved Wiki images."""

  CACHE_ROOT = Path(__file__).parent / "static" / "wiki-images"
  ALLOWED_HOSTS = frozenset(("oldschool.runescape.wiki", "runescape.wiki"))
  FORMAT_EXTENSIONS = {
    "GIF": "gif",
    "PNG": "png",
    "JPEG": "jpg",
    "WEBP": "webp",
  }
  REDIRECT_STATUS_CODES = frozenset((301, 302, 303, 307, 308))
  CACHE_BUSTER_PATTERN = re.compile(r"^[0-9a-f]{5,16}$", re.IGNORECASE)
  MAX_SOURCE_BYTES = 8 * 1024 * 1024
  MAX_PIXELS = 16_000_000
  CONNECT_TIMEOUT = 5
  READ_TIMEOUT = 30
  MAX_REDIRECTS = 3
  MAX_CACHE_BYTES = 2 * 1024 * 1024 * 1024
  MAX_CACHE_ENTRIES = 10_000
  REQUEST_HEADERS = {
    "User-Agent": "Praynr OSRS shared image cache (contact: patrickrich95@gmail.com)",
    "Accept": "image/gif,image/webp,image/png,image/jpeg",
  }

  def __init__(self, cache_root=None, signing_key=None):
    self.cache_root = Path(cache_root or self.CACHE_ROOT)
    self._signing_key = (
      signing_key.encode("utf-8")
      if signing_key
      else None
    )

  @property
  def signing_key(self):
    if self._signing_key is None:
      self._signing_key = self._load_or_create_signing_key()
    return self._signing_key

  def _load_or_create_signing_key(self):
    self.cache_root.mkdir(parents=True, exist_ok=True)
    key_path = self.cache_root / ".signing-key"
    lock_path = self.cache_root / ".signing-key.lock"
    with lock_path.open("a+b") as lock_file:
      with exclusive_file_lock(lock_file):
        if key_path.is_file():
          key = key_path.read_bytes()
          if len(key) == 32:
            return key
        key = secrets.token_bytes(32)
        atomic_write(key_path, key, ".signing-key-")
        return key

  def normalize_url(self, source_url):
    if not isinstance(source_url, str) or not source_url.strip():
      raise WikiImageRequestError("Expected a Wiki image URL")

    try:
      parsed = urlparse(source_url.strip())
      hostname = (parsed.hostname or "").lower().rstrip(".")
    except ValueError as exc:
      raise WikiImageRequestError("Expected a valid Wiki image URL") from exc
    if parsed.scheme != "https":
      raise WikiImageRequestError("Only HTTPS Wiki image URLs are supported")
    if parsed.username or parsed.password:
      raise WikiImageRequestError("Wiki image URLs cannot contain credentials")
    if hostname not in self.ALLOWED_HOSTS:
      raise WikiImageRequestError("Image URL is not from an approved Wiki host")
    if parsed.params:
      raise WikiImageRequestError("Wiki image URLs cannot contain parameters")
    if parsed.query and not self.CACHE_BUSTER_PATTERN.fullmatch(parsed.query):
      raise WikiImageRequestError("Wiki image URL contains an unsupported query string")
    if not parsed.path.startswith("/images/"):
      raise WikiImageRequestError("Wiki image URLs must use the Wiki image path")

    return urlunparse(("https", hostname, parsed.path, "", "", ""))

  def is_allowed_url(self, source_url):
    try:
      self.normalize_url(source_url)
      return True
    except WikiImageRequestError:
      return False

  @staticmethod
  def cache_key(normalized_url):
    return hashlib.sha256(normalized_url.encode("utf-8")).hexdigest()

  def signature(self, normalized_url):
    return hmac.new(
      self.signing_key,
      normalized_url.encode("utf-8"),
      hashlib.sha256,
    ).hexdigest()

  def verify_signature(self, normalized_url, signature):
    if not isinstance(signature, str) or not hmac.compare_digest(
      self.signature(normalized_url),
      signature,
    ):
      raise WikiImageRequestError("Invalid Wiki image cache signature")

  @staticmethod
  def _validate_public_host(source_url):
    hostname = urlparse(source_url).hostname
    try:
      results = socket.getaddrinfo(hostname, 443, type=socket.SOCK_STREAM)
    except socket.gaierror as exc:
      raise WikiImageUpstreamError("Wiki image host could not be resolved") from exc

    for result in results:
      address = ipaddress.ip_address(result[4][0])
      if (
        address.is_private
        or address.is_loopback
        or address.is_link_local
        or address.is_reserved
        or address.is_multicast
        or address.is_unspecified
      ):
        raise WikiImageUpstreamError("Wiki image host resolved to a non-public address")

  def _find_existing(self, cache_key):
    for extension in self.FORMAT_EXTENSIONS.values():
      candidate = self.cache_root / f"{cache_key}.{extension}"
      if candidate.is_file():
        return candidate
    return None

  def _cache_files(self):
    for extension in self.FORMAT_EXTENSIONS.values():
      yield from self.cache_root.glob(f"*.{extension}")

  def _ensure_capacity(self, incoming_bytes):
    cache_files = list(self._cache_files())
    if len(cache_files) >= self.MAX_CACHE_ENTRIES:
      raise WikiImageCapacityError("Wiki image cache entry limit reached")
    current_bytes = sum(path.stat().st_size for path in cache_files)
    if current_bytes + incoming_bytes > self.MAX_CACHE_BYTES:
      raise WikiImageCapacityError("Wiki image cache size limit reached")

  def _validate_image(self, image_bytes):
    try:
      with Image.open(io.BytesIO(image_bytes)) as image:
        if image.width * image.height > self.MAX_PIXELS:
          raise WikiImageUpstreamError("Wiki image dimensions are too large")
        extension = self.FORMAT_EXTENSIONS.get(image.format)
        if not extension:
          raise WikiImageUpstreamError("Unsupported Wiki image format")
        image.verify()
        return extension
    except WikiImageUpstreamError:
      raise
    except Exception as exc:
      raise WikiImageUpstreamError("Downloaded resource is not a readable image") from exc

  def _read_response(self, response):
    try:
      content_length = int(response.headers.get("Content-Length", 0))
    except (TypeError, ValueError):
      content_length = 0
    if content_length > self.MAX_SOURCE_BYTES:
      raise WikiImageUpstreamError("Wiki image is too large")

    image_bytes = bytearray()
    for chunk in response.iter_content(chunk_size=64 * 1024):
      image_bytes.extend(chunk)
      if len(image_bytes) > self.MAX_SOURCE_BYTES:
        raise WikiImageUpstreamError("Wiki image is too large")
    return bytes(image_bytes)

  def _download_bytes(self, normalized_url):
    current_url = normalized_url
    for redirect_count in range(self.MAX_REDIRECTS + 1):
      self._validate_public_host(current_url)
      try:
        with requests.get(
          current_url,
          headers=self.REQUEST_HEADERS,
          stream=True,
          timeout=(self.CONNECT_TIMEOUT, self.READ_TIMEOUT),
          allow_redirects=False,
        ) as response:
          if response.status_code in self.REDIRECT_STATUS_CODES:
            if redirect_count >= self.MAX_REDIRECTS:
              raise WikiImageUpstreamError("Wiki image redirected too many times")
            location = response.headers.get("Location")
            if not location:
              raise WikiImageUpstreamError("Wiki image redirect had no destination")
            try:
              current_url = self.normalize_url(urljoin(current_url, location))
            except WikiImageRequestError as exc:
              raise WikiImageUpstreamError("Wiki image redirect was rejected") from exc
            continue

          response.raise_for_status()
          return self._read_response(response)
      except requests.RequestException as exc:
        raise WikiImageUpstreamError("Unable to download Wiki image") from exc

    raise WikiImageUpstreamError("Wiki image redirected too many times")

  def _download(self, normalized_url, cache_key):
    self._ensure_capacity(0)
    image_bytes = self._download_bytes(normalized_url)
    extension = self._validate_image(image_bytes)
    self._ensure_capacity(len(image_bytes))
    destination = self.cache_root / f"{cache_key}.{extension}"
    atomic_write(destination, image_bytes, f".{cache_key}-")

    log.info(
      "wiki image cached  host=%s  key=%s  bytes=%d",
      urlparse(normalized_url).hostname,
      cache_key,
      len(image_bytes),
    )
    return destination

  def get_or_download(self, source_url, signature):
    normalized_url = self.normalize_url(source_url)
    self.verify_signature(normalized_url, signature)
    cache_key = self.cache_key(normalized_url)
    self.cache_root.mkdir(parents=True, exist_ok=True)

    existing = self._find_existing(cache_key)
    if existing:
      log.info("wiki image cache hit  key=%s", cache_key)
      return existing

    lock_path = self.cache_root / f".wiki-cache-{cache_key[:2]}.lock"
    with lock_path.open("a+b") as lock_file:
      with exclusive_file_lock(lock_file):
        existing = self._find_existing(cache_key)
        if existing:
          log.info("wiki image cache hit after lock  key=%s", cache_key)
          return existing
        log.info("wiki image cache miss  key=%s", cache_key)
        return self._download(normalized_url, cache_key)

  def public_url(self, source_url, route_prefix):
    normalized_url = self.normalize_url(source_url)
    query = urlencode({
      "url": normalized_url,
      "sig": self.signature(normalized_url),
    })
    return f"{request.host_url.rstrip('/')}{route_prefix}/wiki-cache?{query}"

  def source_url_from_cache_url(self, cache_url, route_prefix):
    if not isinstance(cache_url, str):
      return None
    parsed = urlparse(cache_url)
    if parsed.path != f"{route_prefix}/wiki-cache":
      return None
    query = parse_qs(parsed.query, keep_blank_values=True)
    source_urls = query.get("url", [])
    signatures = query.get("sig", [])
    if len(source_urls) != 1 or len(signatures) != 1:
      return None
    try:
      normalized_url = self.normalize_url(source_urls[0])
      self.verify_signature(normalized_url, signatures[0])
    except WikiImageRequestError:
      return None
    return normalized_url

  def serve(self, source_url, signature):
    path = self.get_or_download(source_url, signature)
    response = send_file(path, conditional=True)
    response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response
