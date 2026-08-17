import argparse
import json
import os
import re
import shutil
import sys
import tempfile
import uuid
from pathlib import Path

from flask import abort, send_from_directory


_uploads_root = Path(__file__).parent / "static" / "uploads"
PROOF_DIR = Path(os.environ.get("PROOF_UPLOAD_DIR", _uploads_root / "proofs"))
SHOWCASE_DIR = Path(os.environ.get("SHOWCASE_UPLOAD_DIR", _uploads_root / "showcase"))
MANIFEST_NAME = "manifest.json"
_WEBP_FILENAME = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]*\.webp$")


def validate_webp_filename(filename):
  if not isinstance(filename, str) or not _WEBP_FILENAME.fullmatch(filename):
    raise ValueError(f"Invalid proof image filename: {filename!r}")
  return filename


def parse_showcase_list(lines):
  filenames = []
  seen = set()

  for line_number, raw_line in enumerate(lines, start=1):
    filename = raw_line.strip()
    if not filename or filename.startswith("#"):
      continue
    try:
      validate_webp_filename(filename)
    except ValueError as exc:
      raise ValueError(f"Line {line_number}: {exc}") from exc
    if filename in seen:
      raise ValueError(f"Line {line_number}: duplicate filename {filename!r}")
    seen.add(filename)
    filenames.append(filename)

  return filenames


def load_showcase_filenames(showcase_dir=SHOWCASE_DIR):
  manifest_path = Path(showcase_dir) / MANIFEST_NAME
  if not manifest_path.exists():
    return []

  try:
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
  except (OSError, json.JSONDecodeError) as exc:
    raise ValueError("Showcase manifest is unreadable") from exc

  images = manifest.get("images") if isinstance(manifest, dict) else None
  if not isinstance(images, list):
    raise ValueError("Showcase manifest must contain an images list")

  filenames = []
  for image in images:
    filename = validate_webp_filename(image)
    if (Path(showcase_dir) / filename).is_file():
      filenames.append(filename)
  return filenames


def replace_showcase(filenames, proof_dir=PROOF_DIR, showcase_dir=SHOWCASE_DIR):
  proof_dir = Path(proof_dir)
  showcase_dir = Path(showcase_dir)
  filenames = list(filenames)

  for filename in filenames:
    validate_webp_filename(filename)
    source = proof_dir / filename
    if not source.is_file():
      raise FileNotFoundError(f"Proof image does not exist: {filename}")

  showcase_parent = showcase_dir.parent
  showcase_parent.mkdir(parents=True, exist_ok=True)
  stage_dir = Path(tempfile.mkdtemp(prefix=".showcase-stage-", dir=showcase_parent))
  backup_dir = showcase_parent / f".showcase-backup-{uuid.uuid4().hex}"

  try:
    for filename in filenames:
      shutil.copy2(proof_dir / filename, stage_dir / filename)
    (stage_dir / MANIFEST_NAME).write_text(
      json.dumps({"version": 1, "images": filenames}, indent=2) + "\n",
      encoding="utf-8",
    )

    had_existing_showcase = showcase_dir.exists()
    if had_existing_showcase:
      if not showcase_dir.is_dir():
        raise ValueError(f"Showcase path is not a directory: {showcase_dir}")
      showcase_dir.replace(backup_dir)

    try:
      stage_dir.replace(showcase_dir)
    except Exception:
      if had_existing_showcase and backup_dir.exists() and not showcase_dir.exists():
        backup_dir.replace(showcase_dir)
      raise

    if backup_dir.exists():
      shutil.rmtree(backup_dir, ignore_errors=True)
  finally:
    if stage_dir.exists():
      shutil.rmtree(stage_dir)


def serve_showcase_image(filename):
  try:
    validate_webp_filename(filename)
  except ValueError:
    abort(404)
  response = send_from_directory(SHOWCASE_DIR, filename)
  response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
  return response


def main(argv=None, stdin=None):
  parser = argparse.ArgumentParser(
    description="Replace the homepage showcase with proof image filenames from a newline-delimited list."
  )
  parser.add_argument(
    "list_file",
    nargs="?",
    help="List file inside the container. Reads standard input when omitted.",
  )
  args = parser.parse_args(argv)

  try:
    if args.list_file:
      with open(args.list_file, encoding="utf-8") as list_file:
        filenames = parse_showcase_list(list_file)
    else:
      filenames = parse_showcase_list(stdin or sys.stdin)
    replace_showcase(filenames)
  except (OSError, ValueError) as exc:
    parser.error(str(exc))

  print(f"Published {len(filenames)} showcase image(s).")
  return 0


if __name__ == "__main__":
  raise SystemExit(main())
