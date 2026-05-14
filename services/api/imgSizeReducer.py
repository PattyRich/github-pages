"""
reduce_image_size.py

Accepts a base64-encoded PNG or JPEG (data:image/png;base64,... or data:image/jpeg;base64,...) and compresses it
down to a target file size in kilobytes using Pillow.
"""

import base64
import io
from PIL import Image


def reduce_image_size(
    data_uri: str,
    target_kb: float,
    output_format: str = "WEBP",
    min_quality: int = 5,
    max_quality: int = 95,
    allow_resize: bool = True,
    resize_step: float = 0.9,
) -> str:
    """
    Reduce a base64-encoded image to approximately the target file size.

    Args:
        data_uri:      The full data URI string (data:image/png;base64,<data>)
                       or just the raw base64 string.
        target_kb:     Desired maximum file size in kilobytes.
        output_format: Pillow format to save as. "WEBP" gives the best
                       compression; "JPEG" is widely compatible; "PNG" uses
                       lossless compression (quality param is ignored for PNG).
        min_quality:   Lowest quality level to try before falling back to
                       resizing (1-95).
        max_quality:   Starting quality level (1-95).
        allow_resize:  If True, scale the image down when quality alone cannot
                       hit the target size.
        resize_step:   Fraction to multiply dimensions by on each resize pass
                       (e.g. 0.9 = shrink by 10% each step).

    Returns:
        A data URI string containing the compressed image.
    """
    # ── 1. Decode the data URI ────────────────────────────────────────────────
    if data_uri.startswith("data:"):
        header, b64_data = data_uri.split(",", 1)
        # Detect original media type (unused here but kept for reference)
        # media_type = header.split(";")[0].split(":")[1]
    else:
        b64_data = data_uri

    image_bytes = base64.b64decode(b64_data)
    target_bytes = int(target_kb * 1024)

    # ── 2. Open with Pillow ───────────────────────────────────────────────────
    img = Image.open(io.BytesIO(image_bytes))

    # Convert RGBA → RGB for JPEG (JPEG has no alpha channel)
    if output_format.upper() == "JPEG" and img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    # ── 3. Binary-search on quality (lossy formats) ───────────────────────────
    fmt = output_format.upper()

    def encode(image: Image.Image, quality: int) -> bytes:
        buf = io.BytesIO()
        if fmt == "PNG":
            # PNG: quality maps to compress_level (0-9); we derive it from quality
            compress_level = max(0, min(9, 9 - quality // 10))
            image.save(buf, format="PNG", compress_level=compress_level, optimize=True)
        elif fmt == "WEBP":
            image.save(buf, format="WEBP", quality=quality, method=6)
        else:  # JPEG / JPG
            image.save(buf, format="JPEG", quality=quality, optimize=True)
        return buf.getvalue()

    lo, hi = min_quality, max_quality
    best_bytes: bytes = encode(img, hi)

    if len(best_bytes) <= target_bytes:
        # Already small enough at max quality — return as-is
        compressed = best_bytes
    else:
        # Binary search for the highest quality that still fits
        compressed = encode(img, lo)
        while lo < hi - 1:
            mid = (lo + hi) // 2
            candidate = encode(img, mid)
            if len(candidate) <= target_bytes:
                lo = mid
                compressed = candidate
            else:
                hi = mid

        # ── 4. Resize if quality alone wasn't enough ──────────────────────────
        if len(compressed) > target_bytes and allow_resize:
            work_img = img.copy()
            while len(compressed) > target_bytes:
                new_w = max(1, int(work_img.width * resize_step))
                new_h = max(1, int(work_img.height * resize_step))
                work_img = work_img.resize((new_w, new_h), Image.LANCZOS)
                compressed = encode(work_img, lo)

                if work_img.width <= 1 or work_img.height <= 1:
                    break  # Can't shrink any further

    # ── 5. Re-encode as data URI ──────────────────────────────────────────────
    mime_map = {"WEBP": "webp", "JPEG": "jpeg", "JPG": "jpeg", "PNG": "png"}
    mime = mime_map.get(fmt, fmt.lower())
    result_b64 = base64.b64encode(compressed).decode("ascii")
    result_uri = f"data:image/{mime};base64,{result_b64}"

    original_kb = len(image_bytes) / 1024
    final_kb = len(compressed) / 1024
    print(
        f"Original: {original_kb:.1f} KB  →  "
        f"Compressed: {final_kb:.1f} KB  "
        f"(target: {target_kb} KB, format: {fmt})"
    )

    return result_uri
