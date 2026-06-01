import base64
import os
import uuid
from pathlib import Path
from urllib.parse import urlparse

from flask import request, send_from_directory

from imgSizeReducer import reduce_image_size
from logger import get_logger

log = get_logger(__name__)


class ImageStore:
  def __init__(self, url_prefix, upload_root):
    self.url_prefix = url_prefix
    self.upload_root = Path(upload_root)

  def decode_data_uri(self, data_uri):
    if not isinstance(data_uri, str) or not data_uri.startswith("data:"):
      raise ValueError("Expected an image data URI")
    header, b64_data = data_uri.split(",", 1)
    if ";base64" not in header:
      raise ValueError("Expected a base64 data URI")
    media_type = header.split(";", 1)[0].split(":", 1)[1].lower()
    if not media_type.startswith("image/"):
      raise ValueError("Expected an image data URI")
    return media_type, base64.b64decode(b64_data)

  def save(self, data_uri):
    reduced_data_uri = reduce_image_size(data_uri, 50)
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
    response = send_from_directory(self.upload_root, filename)
    response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    return response


_static = Path(__file__).parent / "static" / "uploads"

proof_images = ImageStore(
  url_prefix="/static/uploads/proofs",
  upload_root=Path(os.environ.get("PROOF_UPLOAD_DIR", _static / "proofs")),
)

board_images = ImageStore(
  url_prefix="/static/uploads/board-images",
  upload_root=Path(os.environ.get("BOARD_IMAGE_UPLOAD_DIR", _static / "board-images")),
)
