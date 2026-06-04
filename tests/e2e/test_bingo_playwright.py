import base64
import os
import re
import shutil
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import urlopen

import pytest

try:
    from playwright.sync_api import Error, expect, sync_playwright
except ImportError:
    Error = Exception
    expect = None
    sync_playwright = None

try:
    from pymongo import MongoClient
    from pymongo.errors import PyMongoError
except ImportError:
    MongoClient = None
    PyMongoError = Exception

try:
    from PIL import Image, ImageChops
except ImportError:
    Image = None
    ImageChops = None

ROOT = Path(__file__).resolve().parents[2]
API_DIR = ROOT / "services" / "api"
BOARD_PREFIX = os.environ.get("PLAYWRIGHT_E2E_BOARD_PREFIX", "__playwright_e2e__")
FRONTEND_URL = os.environ.get("PLAYWRIGHT_FRONTEND_URL", "http://localhost:3000")
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
TMP_ROOT = Path(os.environ.get("PLAYWRIGHT_E2E_TMP_DIR", ROOT / ".tmp" / "playwright-e2e"))
IMAGE_REGRESSION_ENABLED = os.environ.get("PLAYWRIGHT_IMAGE_REGRESSION", "1").lower() not in (
    "0",
    "false",
    "no",
)
IMAGE_REGRESSION_ROOT = Path(
    os.environ.get("PLAYWRIGHT_IMAGE_REGRESSION_DIR", TMP_ROOT / "image-regression")
)
IMAGE_REGRESSION_MAX_DIFF = float(os.environ.get("PLAYWRIGHT_IMAGE_REGRESSION_MAX_DIFF", "0.002"))
IMAGE_REGRESSION_PIXEL_TOLERANCE = int(
    os.environ.get("PLAYWRIGHT_IMAGE_REGRESSION_PIXEL_TOLERANCE", "10")
)

TINY_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII="
)


def test_bingo_board_create_edit_images_layers_and_cleanup():
    if sync_playwright is None:
        pytest.skip("Playwright is not installed. Install tests/e2e/requirements.txt.")
    if MongoClient is None:
        pytest.skip("pymongo is not installed. Install tests/e2e/requirements.txt.")
    if IMAGE_REGRESSION_ENABLED and Image is None:
        pytest.skip("Pillow is not installed. Install tests/e2e/requirements.txt.")

    require_frontend()
    collection = mongo_collection()
    board_name = f"{BOARD_PREFIX}{int(time.time())}"
    admin_password = "adminpw"
    general_password = "generalpw"
    run_dir = TMP_ROOT / board_name
    run_dir.mkdir(parents=True, exist_ok=True)
    board_image = run_dir / "board.png"
    proof_image = run_dir / "proof.png"
    board_image.write_bytes(TINY_PNG)
    proof_image.write_bytes(TINY_PNG)

    cleanup_board(collection, board_name)

    try:
        with sync_playwright() as p:
            browser = launch_browser(p)
            context = browser.new_context(**browser_context_options())
            page = context.new_page()

            page.goto(f"{FRONTEND_URL}/#/bingo/create")
            fill_input_group(page, "Board Name", board_name)
            fill_input_group(page, "Admin Password", admin_password)
            fill_input_group(page, "General Password", general_password)
            page.get_by_role("button", name="Create Board").click()

            expect(page).to_have_url(re.compile(r"#/bingo/"))
            expect(page.get_by_role("button", name="Edit Board")).to_be_visible()

            open_tile(page, "Example Tile")
            fill_input_group(page, "Title", "E2E Tile")
            fill_input_group(page, "Description", "Created by Playwright E2E")
            page.get_by_label("Total Points").fill("75")
            page.get_by_role("button", name="Remove Tile Background Image").click()
            page.get_by_role("button", name="Set Tile Background Image").click()
            select_wiki_image(page, "Dragon med", "Dragon med helm")
            expect(page.get_by_role("button", name="Remove Tile Background Image")).to_be_visible()
            page.get_by_role("button", name="Save").click()
            expect(page.get_by_text("Board Successfully Updated!")).to_be_visible()
            expect_tile_image_loaded(page, 0)

            open_tile_by_index(page, 1)
            fill_input_group(page, "Title", "Asset Tile")
            page.get_by_role("button", name="Set Tile Background Image").click()
            select_asset_image(page, "Elder maul")
            expect(page.get_by_role("button", name="Remove Tile Background Image")).to_be_visible()
            page.get_by_role("button", name="Save").click()
            expect(page.get_by_text("Board Successfully Updated!")).to_be_visible()
            expect_tile_image_loaded(page, 1)

            open_tile_by_index(page, 2)
            fill_input_group(page, "Title", "Upload Tile")
            page.get_by_role("button", name="Set Tile Background Image").click()
            page.locator('input[type="file"][accept=".png,.jpeg"]').set_input_files(str(board_image))
            expect(page.get_by_role("button", name="Remove Tile Background Image")).to_be_visible()
            page.get_by_role("button", name="Save").click()
            expect(page.get_by_text("Board Successfully Updated!")).to_be_visible()
            expect_tile_image_loaded(page, 2)

            open_tile_by_index(page, 3)
            fill_input_group(page, "Title", "Pixel Asset Tile")
            page.get_by_role("button", name="Set Tile Background Image").click()
            select_asset_image(page, "Twisted bow")
            page.get_by_label("Use pixel image?").check()
            expect(page.get_by_label("Use pixel image?")).to_be_checked()
            page.get_by_role("button", name="Save").click()
            expect(page.get_by_text("Board Successfully Updated!")).to_be_visible()
            expect_tile_image_loaded(page, 3)

            open_tile_by_index(page, 10)
            fill_input_group(page, "Title", "Hidden Row Tile")
            page.get_by_role("button", name="Save").click()
            expect(page.get_by_text("Board Successfully Updated!")).to_be_visible()

            edit_board(page)
            page.get_by_role("tab", name="Teams").click()
            expect(page.get_by_text("# of Teams: 5")).to_be_visible()
            page.locator(".edit-team-count").get_by_role("button", name="-").click()
            expect(page.get_by_text("# of Teams: 4")).to_be_visible()
            page.get_by_role("tab", name="Board").click()
            select_by_form_label(page, "Rows (up and down)", "4")
            page.get_by_label("Layered board").check()
            set_range(page, "2")
            expect(page.get_by_text(re.compile(r"Visible rows:\s*2\s*/\s*4"))).to_be_visible()
            page.get_by_role("button", name="Save").click()
            expect(page.get_by_text("Teams Successfully Updated!")).to_be_visible()

            page.get_by_role("button", name="Admin Mode").click()
            expect(page.get_by_role("heading", name=re.compile(r"team-0"))).to_be_visible()
            expect_board_tile_count(page, 10)
            expect(page.get_by_text("Hidden Row Tile", exact=True)).not_to_be_visible()

            observer = context.new_page()
            observer.goto(f"{FRONTEND_URL}/#/bingo/{board_name}?password={general_password}")
            expect(observer.get_by_role("heading", name=re.compile(r"team-0"))).to_be_visible()
            expect(observer.get_by_text(re.compile(r"Points:\s*0"))).to_be_visible()
            expect_board_tile_count(observer, 10)
            expect(observer.get_by_text("Hidden Row Tile", exact=True)).not_to_be_visible()
            for index in range(4):
                expect_tile_image_loaded(observer, index)
            compare_visual_snapshot(observer, "visible-board-images", ".center-board")

            open_tile(page, "E2E Tile")
            fill_input_group(page, "Proof", "Proof from Playwright")
            page.locator(
                'input[type="file"][accept="image/png,image/jpeg,image/webp,image/gif"]'
            ).set_input_files(str(proof_image))
            expect(page.locator('img[alt="proof"]')).to_be_visible()
            page.get_by_label("Completed?").check()
            page.get_by_role("button", name="Save").click()
            expect(page.get_by_text("Board Successfully Updated!")).to_be_visible()
            expect(observer.get_by_text(re.compile(r"Points:\s*75"))).to_be_visible(timeout=15000)
            expect(observer.get_by_role("tab", name=re.compile(r"team-0:\s*\(75\)"))).to_be_visible()
            open_tile(observer, "E2E Tile")
            expect_proof_image_loaded(observer)
            compare_visual_snapshot(observer, "proof-modal", ".modal-content")
            observer.locator(".modal-footer").get_by_role("button", name="Close").click()
            expect(observer.get_by_role("dialog")).not_to_be_visible()
            open_tile(page, "E2E Tile")
            expect_proof_image_loaded(page)
            page.locator(".modal-footer").get_by_role("button", name="Close").click()
            expect(page.get_by_role("dialog")).not_to_be_visible()

            page.get_by_role("button", name="General Mode").click()
            expect(page.get_by_role("button", name="Edit Board")).to_be_visible()
            edit_board(page)
            set_range(page, "4")
            expect(page.get_by_label("Layered board")).to_be_checked()
            page.get_by_role("button", name="Save").click()
            expect(page.get_by_text("Teams Successfully Updated!")).to_be_visible()
            expect_board_tile_count(page, 20)
            expect(page.get_by_text("Hidden Row Tile", exact=True)).to_be_visible()
            compare_visual_snapshot(page, "revealed-board", ".center-board")

            open_tile(page, "E2E Tile")
            page.locator(".modal-header").get_by_role("button", name="Close").click()
            expect(page.get_by_role("dialog")).not_to_be_visible()

            open_tile(page, "Asset Tile")
            expect_input_group_value(page, "Title", "Asset Tile")
            expect_tile_image_loaded(page, 1)
            page.locator(".modal-footer").get_by_role("button", name="Close").click()
            expect(page.get_by_role("dialog")).not_to_be_visible()

            open_tile(page, "Pixel Asset Tile")
            expect(page.get_by_label("Use pixel image?")).to_be_checked()
            expect_tile_image_loaded(page, 3)
            page.locator(".modal-footer").get_by_role("button", name="Close").click()
            expect(page.get_by_role("dialog")).not_to_be_visible()

            open_tile(page, "E2E Tile")
            fill_input_group(page, "Title", "E2E Tile Max Visible")
            page.get_by_role("button", name="Save").click()
            expect(page.get_by_text("Board Successfully Updated!")).to_be_visible()

            context.close()
            browser.close()

        board = collection.find_one({"boardName": board_name})
        assert board is not None
        artifact_urls = collect_artifact_urls(board)
        assert any("/static/uploads/board-images/" in url for url in artifact_urls)
        assert any("oldschool.runescape.wiki/images/" in url for url in artifact_urls)
        assert any("/static/uploads/proofs/" in url for url in artifact_urls)
        assert_saved_artifacts_exist(artifact_urls)
        assert any(image.get("usePixel") is True for image in collect_tile_images(board))
    finally:
        cleanup_board(collection, board_name)
        shutil.rmtree(run_dir, ignore_errors=True)


def fill_input_group(page, label, value):
    group = page.locator(".input-group").filter(has_text=label).first
    group.locator("input, textarea").first.fill(value)


def expect_input_group_value(page, label, value):
    group = page.locator(".input-group").filter(has_text=label).first
    expect(group.locator("input, textarea").first).to_have_value(value)


def select_by_form_label(page, label, value):
    page.locator("label").filter(has_text=label).locator("xpath=../select").select_option(value)


def set_range(page, value):
    page.locator('input[type="range"]').evaluate(
        """(el, value) => {
            const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
            setter.call(el, value);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }""",
        value,
    )


def select_wiki_image(page, search_text, result_text):
    fill_input_group(page, "Item Search", search_text)
    wiki_result = page.locator(".list-group-item").filter(has_text=result_text).first
    expect(wiki_result).to_be_visible(timeout=15000)
    expect_loaded_image(page, wiki_result.locator("img").first)
    wiki_result.click()


def select_asset_image(page, title):
    asset_icon = page.locator(f'img[title="{title}"]').first
    expect(asset_icon).to_be_visible()
    expect_loaded_image(page, asset_icon)
    asset_icon.click()


def expect_loaded_image(page, image):
    handle = image.element_handle()
    page.wait_for_function(
        "(img) => img.complete && img.naturalWidth > 0 && img.naturalHeight > 0",
        arg=handle,
        timeout=15000,
    )


def expect_tile_image_loaded(page, index):
    image = page.locator(".center-board .tile-wrapper").nth(index).locator("img.bg-img").first
    expect(image).to_be_visible(timeout=15000)
    expect_loaded_image(page, image)


def expect_proof_image_loaded(page):
    image = page.locator('img[alt="proof"]').first
    expect(image).to_be_visible(timeout=15000)
    expect_loaded_image(page, image)


def compare_visual_snapshot(page, name, selector):
    if not IMAGE_REGRESSION_ENABLED:
        return

    snapshot_name = visual_snapshot_name(name)
    baseline = IMAGE_REGRESSION_ROOT / "last" / f"{snapshot_name}.png"
    current = IMAGE_REGRESSION_ROOT / "current" / f"{snapshot_name}.png"
    diff = IMAGE_REGRESSION_ROOT / "diffs" / f"{snapshot_name}.png"

    for path in (baseline.parent, current.parent, diff.parent):
        path.mkdir(parents=True, exist_ok=True)

    locator = page.locator(selector).first
    expect(locator).to_be_visible(timeout=15000)
    locator.screenshot(path=str(current))

    if not baseline.exists():
        shutil.copyfile(current, baseline)
        return

    diff_ratio = image_diff_ratio(baseline, current, diff)
    if diff_ratio > IMAGE_REGRESSION_MAX_DIFF:
        failure_dir = save_visual_failure(snapshot_name, baseline, current, diff)
        pytest.fail(
            f"Visual snapshot changed for {snapshot_name}: "
            f"{diff_ratio:.3%} pixels differ. "
            f"Baseline: {baseline}; Current: {current}; Diff: {diff}; "
            f"Failure artifacts: {failure_dir}"
        )

    shutil.copyfile(current, baseline)


def visual_snapshot_name(name):
    browser = os.environ.get("PLAYWRIGHT_BROWSER", "chromium")
    viewport = "mobile" if os.environ.get("PLAYWRIGHT_MOBILE", "0").lower() in (
        "1",
        "true",
        "yes",
    ) else "desktop"
    return f"{name}-{browser}-{viewport}"


def save_visual_failure(snapshot_name, baseline, current, diff):
    timestamp = time.strftime("%Y%m%d-%H%M%S")
    failure_dir = IMAGE_REGRESSION_ROOT / "failures" / f"{timestamp}-{snapshot_name}"
    failure_dir.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(baseline, failure_dir / "baseline.png")
    shutil.copyfile(current, failure_dir / "current.png")
    shutil.copyfile(diff, failure_dir / "diff.png")
    return failure_dir


def image_diff_ratio(baseline, current, diff):
    baseline_image = Image.open(baseline).convert("RGBA")
    current_image = Image.open(current).convert("RGBA")
    if baseline_image.size != current_image.size:
        diff_image = ImageChops.difference(
            baseline_image.resize(current_image.size),
            current_image,
        )
        changed_mask = changed_pixel_mask(diff_image)
        save_visual_diff(current_image, changed_mask, diff)
        return 1.0

    diff_image = ImageChops.difference(baseline_image, current_image)
    total_pixels = baseline_image.size[0] * baseline_image.size[1]
    changed_mask = changed_pixel_mask(diff_image)
    save_visual_diff(current_image, changed_mask, diff)
    changed_pixels = total_pixels - changed_mask.histogram()[0]
    return changed_pixels / total_pixels


def changed_pixel_mask(diff_image):
    changed_mask = diff_image.split()[0].point(
        lambda value: 255 if value > IMAGE_REGRESSION_PIXEL_TOLERANCE else 0
    )
    for channel in diff_image.split()[1:]:
        channel_mask = channel.point(
            lambda value: 255 if value > IMAGE_REGRESSION_PIXEL_TOLERANCE else 0
        )
        changed_mask = ImageChops.lighter(changed_mask, channel_mask)
    return changed_mask


def save_visual_diff(current_image, changed_mask, diff):
    base = current_image.copy()
    overlay = Image.new("RGBA", current_image.size, (255, 0, 0, 190))
    highlighted = Image.composite(overlay, base, changed_mask)
    highlighted.save(diff)


def open_tile(page, title):
    page.get_by_text(title, exact=True).first.click()
    expect(page.get_by_role("dialog")).to_be_visible()


def open_tile_by_index(page, index):
    page.locator(".center-board .box-flex").nth(index).click()
    expect(page.get_by_role("dialog")).to_be_visible()


def expect_board_tile_count(page, count):
    expect(page.locator(".center-board .box-flex")).to_have_count(count)


def edit_board(page):
    page.get_by_role("button", name="Edit Board").click()
    expect(page.get_by_role("dialog", name="Edit Board")).to_be_visible()


def launch_browser(p):
    browser_name = os.environ.get("PLAYWRIGHT_BROWSER", "chromium")
    headless = os.environ.get("PLAYWRIGHT_HEADLESS", "1").lower() not in ("0", "false", "no")
    slow_mo = int(os.environ.get("PLAYWRIGHT_SLOW_MO", "0") or "0")
    browser_type = getattr(p, browser_name, None)
    if browser_type is None:
        pytest.skip(f"Unsupported PLAYWRIGHT_BROWSER={browser_name!r}")
    try:
        return browser_type.launch(headless=headless, slow_mo=slow_mo)
    except Error as exc:
        pytest.skip(f"Playwright browser is not installed or cannot launch: {exc}")


def browser_context_options():
    mobile = os.environ.get("PLAYWRIGHT_MOBILE", "0").lower() in ("1", "true", "yes")
    if mobile:
        return {
            "viewport": {"width": 390, "height": 844},
            "is_mobile": True,
            "has_touch": True,
        }
    return {
        "viewport": {"width": 1280, "height": 900},
    }


def require_frontend():
    try:
        with urlopen(FRONTEND_URL, timeout=3):
            return
    except HTTPError:
        return
    except URLError as exc:
        pytest.skip(f"Frontend is not reachable at {FRONTEND_URL}: {exc}")


def mongo_collection():
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
        client.admin.command("ping")
        return client["bingo"]["bingo"]
    except PyMongoError as exc:
        pytest.skip(f"MongoDB is not reachable at {MONGO_URI}: {exc}")


def cleanup_board(collection, board_name):
    board = collection.find_one({"boardName": board_name})
    if board:
        for image_url in collect_artifact_urls(board):
            delete_artifact(image_url)
    collection.delete_many({"boardName": board_name})


def collect_artifact_urls(board):
    urls = []
    for image in collect_tile_images(board):
        if image.get("url"):
            urls.append(image["url"])

    for team_index in range(int(board.get("teams", 0))):
        team = board.get(f"team-{team_index}", {})
        for row in team.get("teamData", []):
            for tile in row:
                urls.extend(tile.get("proofImages") or [])
    return urls


def collect_tile_images(board):
    images = []
    for row in board.get("boardData", []):
        for tile in row:
            image = tile.get("image")
            if isinstance(image, dict):
                images.append(image)
    return images


def delete_artifact(image_url):
    path = artifact_path(image_url)
    if not path:
        return
    try:
        path.unlink(missing_ok=True)
    except OSError:
        pass


def assert_saved_artifacts_exist(image_urls):
    artifact_paths = [artifact_path(url) for url in image_urls]
    artifact_paths = [path for path in artifact_paths if path]
    assert artifact_paths, "Expected at least one uploaded image artifact"
    for path in artifact_paths:
        assert path.exists(), f"Expected uploaded image artifact to exist: {path}"
        assert path.is_file(), f"Expected uploaded image artifact to be a file: {path}"
        assert path.stat().st_size > 0, f"Expected uploaded image artifact to have bytes: {path}"


def artifact_path(image_url):
    if not isinstance(image_url, str):
        return None
    parsed_path = urlparse(image_url).path
    stores = {
        "/static/uploads/board-images/": Path(
            os.environ.get("BOARD_IMAGE_UPLOAD_DIR", API_DIR / "static" / "uploads" / "board-images")
        ),
        "/static/uploads/proofs/": Path(
            os.environ.get("PROOF_UPLOAD_DIR", API_DIR / "static" / "uploads" / "proofs")
        ),
    }
    for prefix, root in stores.items():
        if parsed_path.startswith(prefix):
            return root / parsed_path.rsplit("/", 1)[-1]
    return None
