import base64
import os
import uuid
from pathlib import Path
from urllib.parse import urlparse

from flask import request, send_from_directory

from imgSizeReducer import reduce_image_size
from logger import get_logger

log = get_logger(__name__)

PROOF_UPLOAD_ROOT = Path(os.environ.get("PROOF_UPLOAD_DIR", Path(__file__).parent / "static" / "uploads" / "proofs"))
PROOF_UPLOAD_URL_PREFIX = "/static/uploads/proofs"


def decode_data_uri(data_uri):
  if not isinstance(data_uri, str) or not data_uri.startswith("data:"):
    raise ValueError("Expected an image data URI")
  header, b64_data = data_uri.split(",", 1)
  if ";base64" not in header:
    raise ValueError("Expected a base64 data URI")
  media_type = header.split(";", 1)[0].split(":", 1)[1].lower()
  if not media_type.startswith("image/"):
    raise ValueError("Expected an image data URI")
  return media_type, base64.b64decode(b64_data)


def save_proof_image(data_uri):
  reduced_data_uri = reduce_image_size(data_uri, 50)
  media_type, image_bytes = decode_data_uri(reduced_data_uri)
  extension = media_type.split("/", 1)[1].replace("jpeg", "jpg")
  if extension not in ("webp", "png", "jpg", "gif"):
    extension = "webp"

  PROOF_UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
  filename = f"{uuid.uuid4().hex}.{extension}"
  path = PROOF_UPLOAD_ROOT / filename
  path.write_bytes(image_bytes)
  return f"{PROOF_UPLOAD_URL_PREFIX}/{filename}"


def proof_image_public_url(image):
  if isinstance(image, str) and image.startswith(PROOF_UPLOAD_URL_PREFIX + "/"):
    return request.host_url.rstrip("/") + image
  return image


def proof_image_storage_url(image):
  if not isinstance(image, str):
    return image
  if image.startswith(PROOF_UPLOAD_URL_PREFIX + "/"):
    return image
  parsed = urlparse(image)
  if parsed.path.startswith(PROOF_UPLOAD_URL_PREFIX + "/"):
    return parsed.path
  return image


def delete_local_proof_image(image):
  image = proof_image_storage_url(image)
  if not isinstance(image, str) or not image.startswith(PROOF_UPLOAD_URL_PREFIX + "/"):
    return
  filename = image.rsplit("/", 1)[-1]
  path = PROOF_UPLOAD_ROOT / filename
  try:
    if path.exists() and path.is_file():
      path.unlink()
  except Exception as e:
    log.warning("proof image delete failed  image=%s  error=%s", image, e)


def cleanup_removed_proof_images(previous_images, next_images):
  previous = {proof_image_storage_url(image) for image in (previous_images or [])}
  current = {proof_image_storage_url(image) for image in (next_images or [])}
  for image in previous - current:
    delete_local_proof_image(image)


def serve_uploaded_proof_image(filename):
  response = send_from_directory(PROOF_UPLOAD_ROOT, filename)
  response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
  return response
