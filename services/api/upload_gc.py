"""Reference-aware cleanup for uploaded Bingo proof and board images."""

import argparse
import os
import time
from pathlib import Path
from urllib.parse import urlparse

import pymongo


UPLOAD_PREFIXES = (
  "/static/uploads/proofs",
  "/static/uploads/board-images",
)
IMAGE_SUFFIXES = {".gif", ".jpg", ".jpeg", ".png", ".webp"}


def collect_upload_references(value, references=None):
  """Collect stored upload URLs from an arbitrarily nested board document."""
  if references is None:
    references = {prefix: set() for prefix in UPLOAD_PREFIXES}

  if isinstance(value, dict):
    for child in value.values():
      collect_upload_references(child, references)
  elif isinstance(value, (list, tuple)):
    for child in value:
      collect_upload_references(child, references)
  elif isinstance(value, str):
    path = urlparse(value).path
    for prefix in UPLOAD_PREFIXES:
      if path.startswith(prefix + "/"):
        references[prefix].add(path)
        break
  return references


def load_upload_references(collection):
  references = {prefix: set() for prefix in UPLOAD_PREFIXES}
  board_count = 0
  # Password fields are unnecessary for reference discovery. Dynamic team
  # password keys cannot be projected individually, so documents stay in
  # process memory and are never logged.
  for board in collection.find({}, {"adminPassword": 0, "generalPassword": 0}):
    board_count += 1
    collect_upload_references(board, references)
  return references, board_count


def prune_upload_directory(directory, url_prefix, references, cutoff_timestamp, dry_run=False):
  """Delete old direct-child image files that no board document references."""
  directory = Path(directory)
  if not directory.exists():
    return 0
  if not directory.is_dir() or directory.is_symlink():
    raise ValueError(f"Upload path is not a safe directory: {directory}")

  removed = 0
  for candidate in directory.iterdir():
    if candidate.is_symlink() or not candidate.is_file():
      continue
    if candidate.suffix.lower() not in IMAGE_SUFFIXES:
      continue
    if f"{url_prefix}/{candidate.name}" in references:
      continue
    if candidate.stat().st_mtime > cutoff_timestamp:
      continue
    if not dry_run:
      candidate.unlink()
    removed += 1
  return removed


def main(argv=None):
  parser = argparse.ArgumentParser(description=__doc__)
  parser.add_argument(
    "--grace-hours",
    type=float,
    default=float(os.environ.get("UPLOAD_ORPHAN_GRACE_HOURS", 168)),
    help="Minimum age of an unreferenced file before deletion (default: 168).",
  )
  parser.add_argument("--dry-run", action="store_true", help="Report without deleting files.")
  args = parser.parse_args(argv)
  if args.grace_hours < 1:
    parser.error("--grace-hours must be at least 1")

  uploads_root = Path(__file__).parent / "static" / "uploads"
  directories = {
    "/static/uploads/proofs": Path(os.environ.get("PROOF_UPLOAD_DIR", uploads_root / "proofs")),
    "/static/uploads/board-images": Path(
      os.environ.get("BOARD_IMAGE_UPLOAD_DIR", uploads_root / "board-images")
    ),
  }

  client = pymongo.MongoClient(os.environ.get("MONGO_URI", "mongodb://localhost:27017/"))
  try:
    references, board_count = load_upload_references(client["bingo"]["bingo"])
    cutoff = time.time() - (args.grace_hours * 60 * 60)
    removed = sum(
      prune_upload_directory(
        directory,
        prefix,
        references[prefix],
        cutoff,
        dry_run=args.dry_run,
      )
      for prefix, directory in directories.items()
    )
  finally:
    client.close()

  action = "would remove" if args.dry_run else "removed"
  print(f"Scanned {board_count} board(s); {action} {removed} orphaned upload(s).")
  return 0


if __name__ == "__main__":
  raise SystemExit(main())
