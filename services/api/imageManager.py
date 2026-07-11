import base64
import fcntl
import hashlib
import io
import ipaddress
import os
import socket
import tempfile
import uuid
from pathlib import Path
from urllib.parse import quote, urlparse, urlunparse

import requests
from flask import request, send_file, send_from_directory
from PIL import Image

from imgSizeReducer import reduce_image_size
from logger import get_logger

log = get_logger(__name__)


class WikiImageCache:
  """Shared, persistent, download-on-first-use cache for approved Wiki images."""

  FORMAT_EXTENSIONS = {
    "GIF": "gif",
    "PNG": "png",
    "JPEG": "jpg",
    "WEBP": "webp",
  }

  def __init__(
    self,
    cache_root,
    allowed_hosts=None,
    max_source_bytes=8 * 1024 * 1024,
    max_pixels=16_000_000,
    connect_timeout=5,
    read_timeout=30,
  ):
    self.cache_root = Path(cache_root)
    self.allowed_hosts = frozenset(
      host.lower().rstrip(".")
      for host in (allowed_hosts or ("oldschool.runescape.wiki", "runescape.wiki"))
    )
    self.max_source_bytes = max_source_bytes
    self.max_pixels = max_pixels
    self.connect_timeout = connect_timeout
    self.read_timeout = read_timeout

  def normalize_url(self, source_url):
    if not isinstance(source_url, str) or not source_url.strip():
      raise ValueError("Expected a Wiki image URL")

    parsed = urlparse(source_url.strip())
    hostname = (parsed.hostname or "").lower().rstrip(".")
    if parsed.scheme != "https":
      raise ValueError("Only HTTPS Wiki image URLs are supported")
    if parsed.username or parsed.password:
      raise ValueError("Wiki image URLs cannot contain credentials")
    if hostname not in self.allowed_hosts:
      raise ValueError("Image URL is not from an approved Wiki host")

    return urlunparse(("https", hostname, parsed.path, parsed.params, parsed.query, ""))

  def is_allowed_url(self, source_url):
    try:
      self.normalize_url(source_url)
      return True
    except ValueError:
      return False

  def cache_key(self, normalized_url):
    return hashlib.sha256(normalized_url.encode("utf-8")).hexdigest()

  def _validate_public_host(self, source_url):
    hostname = urlparse(source_url).hostname
    try:
      results = socket.getaddrinfo(hostname, 443, type=socket.SOCK_STREAM)
    except socket.gaierror as exc:
      raise ValueError("Wiki image host could not be resolved") from exc

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
        raise ValueError("Wiki image host resolved to a non-public address")

  def _find_existing(self, cache_key):
    matches = sorted(self.cache_root.glob(f"{cache_key}.*"))
    return matches[0] if matches else None

  def _validate_image(self, image_bytes):
    try:
      with Image.open(io.BytesIO(image_bytes)) as image:
        if image.width * image.height > self.max_pixels:
          raise ValueError("Wiki image dimensions are too large")
        extension = self.FORMAT_EXTENSIONS.get(image.format)
        if not extension:
          raise ValueError("Unsupported Wiki image format")
        image.verify()
        return extension
    except ValueError:
      raise
    except Exception as exc:
      raise ValueError("Downloaded resource is not a readable image") from exc

  def _download(self, normalized_url, cache_key):
    self._validate_public_host(normalized_url)
    headers = {
      "User-Agent": "Praynr OSRS shared image cache (contact: patrickrich95@gmail.com)",
      "Accept": "image/gif,image/webp,image/png,image/jpeg",
    }

    try:
      with requests.get(
        normalized_url,
        headers=headers,
        stream=True,
        timeout=(self.connect_timeout, self.read_timeout),
        allow_redirects=True,
      ) as response:
        response.raise_for_status()
        final_url = self.normalize_url(response.url)
        self._validate_public_host(final_url)

        content_length = response.headers.get("Content-Length")
        if content_length:
          try:
            if int(content_length) > self.max_source_bytes:
              raise ValueError("Wiki image is too large")
          except ValueError as exc:
            if str(exc) == "Wiki image is too large":
              raise

        image_bytes = bytearray()
        for chunk in response.iter_content(chunk_size=64 * 1024):
          if not chunk:
            continue
          image_bytes.extend(chunk)
          if len(image_bytes) > self.max_source_bytes:
            raise ValueError("Wiki image is too large")
    except ValueError:
      raise
    except requests.RequestException as exc:
      raise ValueError("Unable to download Wiki image") from exc

    extension = self._validate_image(bytes(image_bytes))
    destination = self.cache_root / f"{cache_key}.{extension}"

    with tempfile.NamedTemporaryFile(
      dir=self.cache_root,
      prefix=f".{cache_key}-",
      delete=False,
    ) as temporary:
      temporary.write(image_bytes)
      temporary_path = Path(temporary.name)

    try:
      os.replace(temporary_path, destination)
    finally:
      if temporary_path.exists():
        temporary_path.unlink()

    log.info(
      "wiki image cached  host=%s  key=%s  bytes=%d",
      urlparse(normalized_url).hostname,
      cache_key,
      len(image_bytes),
    )
    return destination

  def get_or_download(self, source_url):
    normalized_url = self.normalize_url(source_url)
    cache_key = self.cache_key(normalized_url)
    self.cache_root.mkdir(parents=True, exist_ok=True)

    existing = self._find_existing(cache_key)
    if existing:
      log.info("wiki image cache hit  key=%s", cache_key)
      return existing

    lock_path = self.cache_root / f".{cache_key}.lock"
    with lock_path.open("a+b") as lock_file:
      fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX)
      existing = self._find_existing(cache_key)
      if existing:
        log.info("wiki image cache hit after lock  key=%s", cache_key)
        return existing
      log.info("wiki image cache miss  key=%s", cache_key)
      return self._download(normalized_url, cache_key)

  def public_url(self, source_url, route_prefix):
    normalized_url = self.normalize_url(source_url)
    return (
      request.host_url.rstrip("/")
      + route_prefix
      + "/wiki-cache?url="
      + quote(normalized_url, safe="")
    )

  def serve(self, source_url):
    path = self.get_or_download(source_url)
    response = send_file(path, conditional=True)
    response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


class ImageStore:
  def __init__(
    self,
    url_prefix,
    upload_root,
    max_source_bytes,
    max_pixels,
    target_kb,
    allowed_media_types=None,
    allow_animated=False,
    animated_target_kb=None,
    max_animation_frames=120,
    max_animation_total_pixels=120_000_000,
    animation_workers=None,
    animated_webp_method=4,
    remote_cache=None,
  ):
    self.url_prefix = url_prefix
    self.upload_root = Path(upload_root)
    self.max_source_bytes = max_source_bytes
    self.max_pixels = max_pixels
    self.target_kb = target_kb
    if allowed_media_types is None:
      allowed_media_types = ("image/png", "image/jpeg", "image/webp", "image/gif")
    self.allowed_media_types = tuple(allowed_media_types)
    self.allow_animated = allow_animated
    self.animated_target_kb = animated_target_kb or target_kb
    self.max_animation_frames = max_animation_frames
    self.max_animation_total_pixels = max_animation_total_pixels
    self.animation_workers = animation_workers
    self.animated_webp_method = max(0, min(6, animated_webp_method))
    self.remote_cache = remote_cache

  def decode_data_uri(self, data_uri):
    if not isinstance(data_uri, str) or not data_uri.startswith("data:"):
      raise ValueError("Expected an image data URI")
    try:
      header, b64_data = data_uri.split(",", 1)
    except ValueError as exc:
      raise ValueError("Expected a valid data URI") from exc
    if ";base64" not in header:
      raise ValueError("Expected a base64 data URI")
    media_type = header.split(";", 1)[0].split(":", 1)[1].lower()
    if media_type not in self.allowed_media_types:
      raise ValueError("Expected an image data URI")
    try:
      image_bytes = base64.b64decode(b64_data, validate=True)
    except Exception as exc:
      raise ValueError("Expected valid base64 image data") from exc
    if len(image_bytes) > self.max_source_bytes:
      raise ValueError("Image file is too large")
    return media_type, image_bytes

  def validate_data_uri(self, data_uri):
    _media_type, image_bytes = self.decode_data_uri(data_uri)
    try:
      with Image.open(io.BytesIO(image_bytes)) as image:
        if image.width * image.height > self.max_pixels:
          raise ValueError("Image dimensions are too large")
        is_animated = bool(getattr(image, "is_animated", False) or getattr(image, "n_frames", 1) > 1)
        if is_animated:
          if not self.allow_animated:
            raise ValueError("Animated images are only supported for tile cover images")
          frame_count = getattr(image, "n_frames", 1)
          if frame_count > self.max_animation_frames:
            raise ValueError(f"Animated images are limited to {self.max_animation_frames} frames")
          if image.width * image.height * frame_count > self.max_animation_total_pixels:
            raise ValueError("Animated image dimensions are too large")
        image.verify()
        return is_animated
    except ValueError:
      raise
    except Exception as exc:
      raise ValueError("Expected a readable image file") from exc

  def save(self, data_uri):
    is_animated = self.validate_data_uri(data_uri)
    target_kb = self.animated_target_kb if is_animated else self.target_kb
    reduced_data_uri = reduce_image_size(
      data_uri,
      target_kb,
      max_pixels=self.max_pixels,
      allow_animated=self.allow_animated,
      max_animation_frames=self.max_animation_frames,
      max_animation_total_pixels=self.max_animation_total_pixels,
      animation_workers=self.animation_workers,
      animated_webp_method=self.animated_webp_method,
    )
    media_type, image_bytes = self.decode_data_uri(reduced_data_uri)
    extension = media_type.split("/", 1)[1].replace("jpeg", "jpg")
    if extension not in ("webp", "png", "jpg", "gif"):
      extension = "webp"

    self.upload_root.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.{extension}"
    path = self.upload_root / filename
    path.write_bytes(image_bytes)
    return f"{self.url_prefix}/{filename}"

  def public_url(self, image):
    if isinstance(image, str) and image.startswith(self.url_prefix + "/"):
      return request.host_url.rstrip("/") + image
    if self.remote_cache and self.remote_cache.is_allowed_url(image):
      return self.remote_cache.public_url(image, self.url_prefix)
    return image

  def storage_url(self, image):
    if not isinstance(image, str):
      return image
    if image.startswith(self.url_prefix + "/"):
      return image
    parsed = urlparse(image)
    if parsed.path.startswith(self.url_prefix + "/"):
      return parsed.path
    return image

  def delete(self, image):
    image = self.storage_url(image)
    if not isinstance(image, str) or not image.startswith(self.url_prefix + "/"):
      return
    filename = image.rsplit("/", 1)[-1]
    path = self.upload_root / filename
    try:
      if path.exists() and path.is_file():
        path.unlink()
    except Exception as e:
      log.warning("image delete failed  store=%s  image=%s  error=%s", self.url_prefix, image, e)

  def cleanup_removed(self, previous_images, next_images):
    previous = {self.storage_url(image) for image in (previous_images or [])}
    current = {self.storage_url(image) for image in (next_images or [])}
    for image in previous - current:
      self.delete(image)

  def serve(self, filename):
    if filename == "wiki-cache" and self.remote_cache:
      source_url = request.args.get("url", "").strip()
      if not source_url:
        raise ValueError("Missing Wiki image URL")
      return self.remote_cache.serve(source_url)
    response = send_from_directory(self.upload_root, filename)
    response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    return response


_static = Path(__file__).parent / "static" / "uploads"
_max_source_bytes = int(os.environ.get("IMAGE_UPLOAD_MAX_SOURCE_BYTES", 8 * 1024 * 1024))
_max_pixels = int(os.environ.get("IMAGE_UPLOAD_MAX_PIXELS", 16_000_000))
_target_kb = int(os.environ.get("IMAGE_UPLOAD_TARGET_KB", 50))
_animated_board_target_kb = int(os.environ.get("BOARD_IMAGE_UPLOAD_ANIMATION_TARGET_KB", 300))
_max_animation_frames = int(os.environ.get("IMAGE_UPLOAD_MAX_ANIMATION_FRAMES", 200))
_max_animation_total_pixels = int(os.environ.get("IMAGE_UPLOAD_MAX_ANIMATION_TOTAL_PIXELS", 120_000_000))
_animation_workers = int(os.environ.get("IMAGE_UPLOAD_ANIMATION_WORKERS", min(4, os.cpu_count() or 1)))
_animated_webp_method = int(os.environ.get("IMAGE_UPLOAD_ANIMATION_WEBP_METHOD", 4))

wiki_image_cache = WikiImageCache(
  cache_root=Path(os.environ.get("WIKI_IMAGE_CACHE_DIR", Path(__file__).parent / "static" / "wiki-images")),
  max_source_bytes=int(os.environ.get("WIKI_IMAGE_MAX_SOURCE_BYTES", _max_source_bytes)),
  max_pixels=int(os.environ.get("WIKI_IMAGE_MAX_PIXELS", _max_pixels)),
  connect_timeout=float(os.environ.get("WIKI_IMAGE_CONNECT_TIMEOUT", 5)),
  read_timeout=float(os.environ.get("WIKI_IMAGE_READ_TIMEOUT", 30)),
)

proof_images = ImageStore(
  url_prefix="/static/uploads/proofs",
  upload_root=Path(os.environ.get("PROOF_UPLOAD_DIR", _static / "proofs")),
  max_source_bytes=_max_source_bytes,
  max_pixels=_max_pixels,
  target_kb=_target_kb,
  allowed_media_types=("image/png", "image/jpeg", "image/webp"),
  allow_animated=False,
  max_animation_frames=_max_animation_frames,
  max_animation_total_pixels=_max_animation_total_pixels,
  animation_workers=_animation_workers,
  animated_webp_method=_animated_webp_method,
)

board_images = ImageStore(
  url_prefix="/static/uploads/board-images",
  upload_root=Path(os.environ.get("BOARD_IMAGE_UPLOAD_DIR", _static / "board-images")),
  max_source_bytes=_max_source_bytes,
  max_pixels=_max_pixels,
  target_kb=_target_kb,
  allowed_media_types=("image/png", "image/jpeg", "image/webp", "image/gif"),
  allow_animated=True,
  animated_target_kb=_animated_board_target_kb,
  max_animation_frames=_max_animation_frames,
  max_animation_total_pixels=_max_animation_total_pixels,
  animation_workers=_animation_workers,
  animated_webp_method=_animated_webp_method,
  remote_cache=wiki_image_cache,
)
