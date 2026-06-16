import base64
import io
import logging
import os
from concurrent.futures import ThreadPoolExecutor
from collections.abc import Callable, Iterable
from typing import TypeVar
from PIL import Image, ImageOps, ImageSequence

log = logging.getLogger(__name__)
T = TypeVar("T")


def _decode_data_uri(data_uri: str) -> bytes:
    if data_uri.startswith("data:"):
        _header, b64_data = data_uri.split(",", 1)
    else:
        b64_data = data_uri
    return base64.b64decode(b64_data, validate=True)


def _is_animated(image: Image.Image) -> bool:
    return bool(getattr(image, "is_animated", False) or getattr(image, "n_frames", 1) > 1)


def _format_mime(output_format: str) -> str:
    mime_map = {"WEBP": "webp", "JPEG": "jpeg", "JPG": "jpeg", "PNG": "png"}
    return mime_map.get(output_format.upper(), output_format.lower())


def _parallel_map(
    func: Callable[[T], T],
    items: Iterable[T],
    max_workers: int | None,
) -> list[T]:
    item_list = list(items)
    if not item_list:
        return []

    if max_workers is None:
        max_workers = os.cpu_count() or 1
    max_workers = max(1, min(max_workers, len(item_list)))
    if max_workers == 1 or len(item_list) == 1:
        return [func(item) for item in item_list]

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        return list(executor.map(func, item_list))


def _resize_dimensions(
    width: int,
    height: int,
    current_bytes: int,
    target_bytes: int,
    resize_step: float,
) -> tuple[int, int]:
    scale = resize_step
    if current_bytes > target_bytes > 0:
        estimated_scale = (target_bytes / current_bytes) ** 0.5 * 0.96
        scale = min(resize_step, max(0.35, estimated_scale))

    new_w = max(1, int(width * scale))
    new_h = max(1, int(height * scale))
    if new_w == width and width > 1:
        new_w -= 1
    if new_h == height and height > 1:
        new_h -= 1
    return new_w, new_h


def _normalise_static_image(image: Image.Image, output_format: str) -> Image.Image:
    image = ImageOps.exif_transpose(image)
    fmt = output_format.upper()
    if fmt == "JPEG" and image.mode in ("RGBA", "LA", "P"):
        return image.convert("RGB")
    if fmt == "WEBP" and image.mode not in ("RGB", "RGBA"):
        has_alpha = image.mode in ("LA", "PA") or "transparency" in image.info
        return image.convert("RGBA" if has_alpha else "RGB")
    return image.copy()


def _encode_static_image(image: Image.Image, output_format: str, quality: int) -> bytes:
    fmt = output_format.upper()
    buf = io.BytesIO()
    if fmt == "PNG":
        compress_level = max(0, min(9, 9 - quality // 10))
        image.save(buf, format="PNG", compress_level=compress_level, optimize=True)
    elif fmt == "WEBP":
        image.save(buf, format="WEBP", quality=quality, method=6)
    else:
        image.save(buf, format="JPEG", quality=quality, optimize=True)
    return buf.getvalue()


def _compress_static_image(
    image: Image.Image,
    target_bytes: int,
    output_format: str,
    min_quality: int,
    max_quality: int,
    allow_resize: bool,
    resize_step: float,
) -> bytes:
    fmt = output_format.upper()
    image = _normalise_static_image(image, fmt)

    lo, hi = min_quality, max_quality
    best_bytes = _encode_static_image(image, fmt, hi)

    if len(best_bytes) <= target_bytes:
        return best_bytes

    compressed = _encode_static_image(image, fmt, lo)
    if len(compressed) <= target_bytes:
        while lo < hi - 1:
            mid = (lo + hi) // 2
            candidate = _encode_static_image(image, fmt, mid)
            if len(candidate) <= target_bytes:
                lo = mid
                compressed = candidate
            else:
                hi = mid

    if len(compressed) > target_bytes and allow_resize:
        work_img = image.copy()
        while len(compressed) > target_bytes:
            new_w, new_h = _resize_dimensions(
                work_img.width,
                work_img.height,
                len(compressed),
                target_bytes,
                resize_step,
            )
            work_img = work_img.resize((new_w, new_h), Image.LANCZOS)
            compressed = _encode_static_image(work_img, fmt, lo)

            if work_img.width <= 1 or work_img.height <= 1:
                break

    return compressed


def _animation_frames(
    image: Image.Image,
    max_animation_frames: int,
    animation_workers: int | None,
) -> tuple[list[Image.Image], list[int], int]:
    frame_count = getattr(image, "n_frames", 1)
    if frame_count > max_animation_frames:
        raise ValueError(f"Animated images are limited to {max_animation_frames} frames")

    loop = int(image.info.get("loop", 0) or 0)
    default_duration = int(image.info.get("duration", 100) or 100)
    raw_frames: list[Image.Image] = []
    durations: list[int] = []

    for frame in ImageSequence.Iterator(image):
        frame_duration = int(frame.info.get("duration", default_duration) or default_duration)
        durations.append(max(20, frame_duration))
        raw_frames.append(frame.copy())

    def normalise_frame(frame: Image.Image) -> Image.Image:
        frame = ImageOps.exif_transpose(frame)
        if frame.mode != "RGBA":
            frame = frame.convert("RGBA")
        return frame

    frames = _parallel_map(normalise_frame, raw_frames, animation_workers)
    if not frames:
        raise ValueError("Expected a readable animated image")

    return frames, durations, loop


def _encode_animated_webp(
    frames: list[Image.Image],
    durations: list[int],
    loop: int,
    quality: int,
    webp_method: int,
) -> bytes:
    buf = io.BytesIO()
    first_frame, *remaining_frames = frames
    first_frame.save(
        buf,
        format="WEBP",
        save_all=True,
        append_images=remaining_frames,
        duration=durations,
        loop=loop,
        quality=quality,
        method=webp_method,
        lossless=False,
        exact=False,
    )
    return buf.getvalue()


def _resize_frames(
    frames: list[Image.Image],
    width: int,
    height: int,
    animation_workers: int | None,
) -> list[Image.Image]:
    def resize_frame(frame: Image.Image) -> Image.Image:
        return frame.resize((width, height), Image.LANCZOS)

    return _parallel_map(resize_frame, frames, animation_workers)


def _compress_animated_image(
    image: Image.Image,
    target_bytes: int,
    min_quality: int,
    max_quality: int,
    allow_resize: bool,
    resize_step: float,
    max_animation_frames: int,
    animation_workers: int | None,
    animated_webp_method: int,
) -> bytes:
    frames, durations, loop = _animation_frames(image, max_animation_frames, animation_workers)

    lo, hi = min_quality, max_quality
    best_bytes = _encode_animated_webp(frames, durations, loop, hi, animated_webp_method)

    if len(best_bytes) <= target_bytes:
        return best_bytes

    compressed = _encode_animated_webp(frames, durations, loop, lo, animated_webp_method)
    if len(compressed) <= target_bytes:
        while lo < hi - 1:
            mid = (lo + hi) // 2
            candidate = _encode_animated_webp(frames, durations, loop, mid, animated_webp_method)
            if len(candidate) <= target_bytes:
                lo = mid
                compressed = candidate
            else:
                hi = mid

    if len(compressed) > target_bytes and allow_resize:
        work_frames = frames
        while len(compressed) > target_bytes:
            new_w, new_h = _resize_dimensions(
                work_frames[0].width,
                work_frames[0].height,
                len(compressed),
                target_bytes,
                resize_step,
            )
            work_frames = _resize_frames(work_frames, new_w, new_h, animation_workers)
            compressed = _encode_animated_webp(
                work_frames,
                durations,
                loop,
                lo,
                animated_webp_method,
            )

            if new_w <= 1 or new_h <= 1:
                break

    return compressed


def reduce_image_size(
    data_uri: str,
    target_kb: float,
    output_format: str = "WEBP",
    min_quality: int = 5,
    max_quality: int = 95,
    allow_resize: bool = True,
    resize_step: float = 0.9,
    max_pixels: int | None = None,
    allow_animated: bool = False,
    max_animation_frames: int = 120,
    max_animation_total_pixels: int | None = None,
    animation_workers: int | None = None,
    animated_webp_method: int = 4,
) -> str:
    """
    Reduce a base64-encoded image to approximately the target file size.

    Static images are encoded to `output_format`. Animated images are only
    preserved when `allow_animated` is true, and are encoded as animated WebP.
    """
    image_bytes = _decode_data_uri(data_uri)
    target_bytes = int(target_kb * 1024)

    img = Image.open(io.BytesIO(image_bytes))
    if max_pixels is not None and img.width * img.height > max_pixels:
        raise ValueError("Image dimensions are too large")

    fmt = output_format.upper()
    is_animated = _is_animated(img)
    if is_animated:
        if not allow_animated:
            raise ValueError("Animated images are only supported for tile cover images")
        if max_animation_total_pixels is not None:
            frame_count = getattr(img, "n_frames", 1)
            if img.width * img.height * frame_count > max_animation_total_pixels:
                raise ValueError("Animated image dimensions are too large")
        compressed = _compress_animated_image(
            img,
            target_bytes,
            min_quality,
            max_quality,
            allow_resize,
            resize_step,
            max_animation_frames,
            animation_workers,
            animated_webp_method,
        )
        mime = "webp"
        log_format = "ANIMATED_WEBP"
    else:
        compressed = _compress_static_image(
            img,
            target_bytes,
            fmt,
            min_quality,
            max_quality,
            allow_resize,
            resize_step,
        )
        mime = _format_mime(fmt)
        log_format = fmt

    result_b64 = base64.b64encode(compressed).decode("ascii")
    result_uri = f"data:image/{mime};base64,{result_b64}"

    original_kb = len(image_bytes) / 1024
    final_kb = len(compressed) / 1024
    log.debug(
        "imgSizeReducer: %.1f KB -> %.1f KB  (target: %s KB, format: %s)",
        original_kb,
        final_kb,
        target_kb,
        log_format,
    )

    return result_uri
