"""
transform_copy.py

Copies a source file to a destination file, applying specific line
transformations along the way. Stops writing when it hits
`if __name__ == "__main__":`.

Rules applied:
  1. Lines equal to `data = json.loads(request.data)`
       → replaced with `data = json.loads(request.data.decode(), parse_float=float)`
  2. Lines equal to `CORS(app)` → skipped (not written)
  3. Lines equal to `app = Flask(__name__, static_folder='build')`
       → replaced with `from server import app`
  4. Writing stops (exclusive) when line equals `if __name__ == "__main__":`

Usage:
    python transform_copy.py <source_file> <destination_file>
"""

import sys


STOP_LINE          = 'if __name__ == "__main__":'

REPLACEMENTS = {
    "data = json.loads(request.data)":
        "data = json.loads(request.data.decode(), parse_float=float)",
    "app = Flask(__name__, static_folder='build')":
        "from server import app",
}

SKIP_LINES = {
    "CORS(app)",
}


def transform_copy(src_path: str, dst_path: str) -> None:
    with open(src_path, "r", encoding="utf-8") as src, \
         open(dst_path, "w", encoding="utf-8") as dst:

        for line in src:
            stripped = line.rstrip("\n").rstrip("\r")

            # Stop before __main__ block
            if stripped.strip() == STOP_LINE:
                break

            # Skip unwanted lines
            if stripped.strip() in SKIP_LINES:
                continue

            # Apply replacements (match on stripped content, preserve indentation)
            content = stripped.strip()
            if (content in REPLACEMENTS):
                print(f"  → Replacing with: '{REPLACEMENTS[content]}'")
            if content == 'data = json.loads(request.data)':
                print('here')
            if content in REPLACEMENTS:
                indent = stripped[: len(stripped) - len(stripped.lstrip())]
                dst.write(indent + REPLACEMENTS[content] + "\n")
                continue

            # Write line unchanged
            dst.write(line if line.endswith("\n") else line + "\n")

    print(f"Done: '{src_path}' → '{dst_path}'")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python transform_copy.py <source_file> <destination_file>")
        sys.exit(1)

    transform_copy(sys.argv[1], sys.argv[2])