import json
import os
import re
import shutil
import struct
import time
import zlib
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
GENERIC_COMMONS_IMAGE_TITLE = "Lionel Messi Commons Test Image"
GENERIC_COMMONS_IMAGE_URL = (
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/"
    "Lionel_Messi_31mar2007.jpg/250px-Lionel_Messi_31mar2007.jpg"
)
GENERIC_COMMONS_SOURCE_URL = (
    "https://commons.wikimedia.org/wiki/File:Lionel_Messi_31mar2007.jpg"
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
    write_fake_board_image(board_image)
    write_fake_proof_image(proof_image)

    cleanup_board(collection, board_name)

    try:
        with sync_playwright() as p:
            browser = launch_browser(p)
            context = browser.new_context(**browser_context_options())
            browser_failures = attach_browser_failure_guards(context)
            page = context.new_page()

            # Reset onboarding local state before creating a fresh board
            page.goto(f"{FRONTEND_URL}")
            page.evaluate("localStorage.removeItem('tile-hint')")

            # Snapshot the empty join page before any board exists
            page.goto(f"{FRONTEND_URL}/#/bingo/join")
            expect(page.locator(".join-board-shell")).to_be_visible()
            compare_visual_snapshot(page, "join-page-empty", ".join-board-grid")

            page.goto(f"{FRONTEND_URL}/#/bingo/create")
            compare_visual_snapshot(page, "create-bingo-page", ".create-board-shell")
            fill_input_group(page, "Board Name", board_name)
            fill_input_group(page, "Admin Password", admin_password)
            fill_input_group(page, "General Password", general_password)
            click_and_expect_api(
                page,
                "POST",
                "/createBoard",
                lambda: page.get_by_role("button", name="Create Board").click(),
            )

            expect(page).to_have_url(re.compile(r"#/bingo/"))
            expect(page.get_by_role("button", name="Edit Board")).to_be_visible()

            # Created boards start with the admin onboarding guide instead of the generic toast
            mode_guide = page.locator(".board-guide-popover")
            expect(mode_guide).to_be_visible()
            expect(mode_guide).to_contain_text("Admin and General Mode")
            expect(page.locator(".board-guide-mode-target")).to_be_visible()
            mode_guide.get_by_role("button", name="Next: tile").click()

            tile_guide = page.locator(".board-guide-banner")
            expect(tile_guide).to_be_visible()
            expect(tile_guide).to_contain_text("Click a bingo tile")
            expect(page.locator(".center-board.board-guide-tile-step")).to_be_visible()
            open_tile_by_index(page, 0)
            expect(tile_guide).not_to_be_visible()
            close_modal(page)
            expect(page.get_by_role("dialog")).not_to_be_visible()

            # Settings: toggle a setting, close and reopen — verify it persists
            page.get_by_role("button", name="Settings").click()
            expect(page.get_by_role("dialog")).to_be_visible()
            hide_points_cb = page.get_by_label("Hide current points on bingo board?")
            expect(hide_points_cb).not_to_be_checked()
            hide_points_cb.click()
            expect(hide_points_cb).to_be_checked()
            close_modal(page)
            expect(page.get_by_role("dialog")).not_to_be_visible()
            page.get_by_role("button", name="Settings").click()
            expect(page.get_by_label("Hide current points on bingo board?")).to_be_checked()
            # Restore the setting before continuing
            page.get_by_label("Hide current points on bingo board?").click()
            close_modal(page)

            open_tile(page, "Example Tile")
            fill_input_group(page, "Title", "E2E Tile")
            fill_input_group(page, "Description", "Created by Playwright E2E")
            page.get_by_label("Total Points").fill("75")
            page.get_by_role("button", name="Remove Tile Background Image").click()
            page.get_by_role("button", name="Set Tile Background Image").click()
            select_wiki_image(page, "Dragon med", "Dragon med helm")
            expect(page.get_by_role("button", name="Remove Tile Background Image")).to_be_visible()
            save_board_tile(page)
            expect(page.get_by_text("Board Successfully Updated!")).to_be_visible()
            expect_tile_image_loaded(page, 0)

            open_tile_by_index(page, 1)
            fill_input_group(page, "Title", "Asset Tile")
            page.get_by_role("button", name="Set Tile Background Image").click()
            select_asset_image(page, "Elder maul")
            expect(page.get_by_role("button", name="Remove Tile Background Image")).to_be_visible()
            save_board_tile(page)
            expect(page.get_by_text("Board Successfully Updated!")).to_be_visible()
            expect_tile_image_loaded(page, 1)

            open_tile_by_index(page, 2)
            fill_input_group(page, "Title", "Upload Tile")
            page.get_by_role("button", name="Set Tile Background Image").click()
            page.locator(
                'input[type="file"][accept="image/png,image/jpeg,image/webp,image/gif"]'
            ).set_input_files(str(board_image))
            expect(page.get_by_role("button", name="Remove Tile Background Image")).to_be_visible()
            save_board_tile(page)
            expect(page.get_by_text("Board Successfully Updated!")).to_be_visible()
            expect_tile_image_loaded(page, 2)

            open_tile_by_index(page, 3)
            fill_input_group(page, "Title", "Pixel Asset Tile")
            page.get_by_role("button", name="Set Tile Background Image").click()
            select_asset_image(page, "Twisted bow")
            page.get_by_label("Use pixel image?").check()
            expect(page.get_by_label("Use pixel image?")).to_be_checked()
            save_board_tile(page)
            expect(page.get_by_text("Board Successfully Updated!")).to_be_visible()
            expect_tile_image_loaded(page, 3)

            open_tile_by_index(page, 10)
            fill_input_group(page, "Title", "Hidden Row Tile")
            save_board_tile(page)
            expect(page.get_by_text("Board Successfully Updated!")).to_be_visible()

            edit_board(page)
            page.get_by_role("tab", name="Teams").click()
            expect(page.get_by_text("# of Teams: 5")).to_be_visible()
            page.locator(".edit-team-count").get_by_role("button", name="-").click()
            expect(page.get_by_text("# of Teams: 4")).to_be_visible()
            page.get_by_role("tab", name="Board").click()
            select_by_form_label(page, "Rows (up and down)", "4")
            page.locator("label.et-switch").filter(has_text="Layered board").click()
            set_range(page, "2")
            expect(page.get_by_text(re.compile(r"Visible rows:\s*2\s*/\s*4"))).to_be_visible()
            save_team_settings(page)
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
                'input[type="file"][accept="image/png,image/jpeg,image/webp"]'
            ).set_input_files(str(proof_image))
            expect(page.locator('img[alt="proof"]')).to_be_visible()
            page.get_by_label("Completed?").check()
            save_board_tile(page)
            expect(page.get_by_text("Board Successfully Updated!")).to_be_visible()
            expect(observer.get_by_text(re.compile(r"Points:\s*75"))).to_be_visible(timeout=15000)
            expect(observer.get_by_role("tab", name=re.compile(r"team-0:\s*\(75\)"))).to_be_visible()
            open_tile(observer, "E2E Tile")
            expect_proof_image_loaded(observer)
            compare_visual_snapshot(observer, "proof-modal", ".osrs-modal-panel")
            close_modal(observer)
            expect(observer.get_by_role("dialog")).not_to_be_visible()
            open_tile(page, "E2E Tile")
            expect_proof_image_loaded(page)
            close_modal(page)
            expect(page.get_by_role("dialog")).not_to_be_visible()

            page.get_by_role("button", name="General Mode").click()
            expect(page.get_by_role("button", name="Edit Board")).to_be_visible()
            edit_board(page)
            set_range(page, "4")
            expect(page.locator("#layered-board-switch")).to_be_checked()
            save_team_settings(page)
            expect(page.get_by_text("Teams Successfully Updated!")).to_be_visible()
            expect_board_tile_count(page, 20)
            expect(page.get_by_text("Hidden Row Tile", exact=True)).to_be_visible()
            compare_visual_snapshot(page, "revealed-board", ".center-board")

            open_tile(page, "E2E Tile")
            close_modal(page)
            expect(page.get_by_role("dialog")).not_to_be_visible()

            open_tile(page, "Asset Tile")
            expect_input_group_value(page, "Title", "Asset Tile")
            expect_tile_image_loaded(page, 1)
            close_modal(page)
            expect(page.get_by_role("dialog")).not_to_be_visible()

            open_tile(page, "Pixel Asset Tile")
            expect(page.get_by_label("Use pixel image?")).to_be_checked()
            expect_tile_image_loaded(page, 3)
            close_modal(page)
            expect(page.get_by_role("dialog")).not_to_be_visible()

            open_tile(page, "E2E Tile")
            fill_input_group(page, "Title", "E2E Tile Max Visible")
            save_board_tile(page)
            expect(page.get_by_text("Board Successfully Updated!")).to_be_visible()

            # Navigate to join page and verify recent board entry appears and can be joined
            page.goto(f"{FRONTEND_URL}/#/bingo/join")
            recent_section = page.locator(".recent-board-list")
            expect(recent_section).to_be_visible()
            recent_row = recent_section.locator(".recent-board-row").filter(has_text=board_name).filter(has_text="admin").first
            expect(recent_row).to_be_visible()
            expect(recent_row.locator("strong")).to_have_text(board_name)
            recent_row.get_by_role("button", name="Join").click()
            expect(page).to_have_url(re.compile(rf"#/bingo/{re.escape(board_name)}"))
            expect(page.get_by_role("button", name="Edit Board")).to_be_visible()
            assert_no_browser_failures(browser_failures)

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


def test_generic_bingo_board_commons_image_visual_regression():
    if sync_playwright is None:
        pytest.skip("Playwright is not installed. Install tests/e2e/requirements.txt.")
    if MongoClient is None:
        pytest.skip("pymongo is not installed. Install tests/e2e/requirements.txt.")
    if IMAGE_REGRESSION_ENABLED and Image is None:
        pytest.skip("Pillow is not installed. Install tests/e2e/requirements.txt.")

    require_frontend()
    collection = mongo_collection()
    board_name = f"{BOARD_PREFIX}generic-{int(time.time() * 1000)}"
    admin_password = "adminpw"
    general_password = "generalpw"

    cleanup_board(collection, board_name)

    try:
        with sync_playwright() as p:
            browser = launch_browser(p)
            context = browser.new_context(**browser_context_options())
            browser_failures = attach_browser_failure_guards(context)
            page = context.new_page()
            stub_commons_search(page)

            page.goto(f"{FRONTEND_URL}/#/bingo/create")
            fill_input_group(page, "Board Name", board_name)
            fill_input_group(page, "Admin Password", admin_password)
            fill_input_group(page, "General Password", general_password)
            generic_radio = page.get_by_role("radio", name=re.compile(r"Generic"))
            generic_radio.click()
            expect(generic_radio).to_be_checked()
            click_and_expect_api(
                page,
                "POST",
                "/createBoard",
                lambda: page.get_by_role("button", name="Create Board").click(),
            )

            expect(page).to_have_url(re.compile(r"#/bingo/"))
            expect(page.get_by_text("Example Tile", exact=True)).not_to_be_visible()
            expect_board_tile_count(page, 25)

            open_tile_by_index(page, 0)
            fill_input_group(page, "Title", "Generic Commons Tile")
            page.get_by_role("button", name="Set Tile Background Image").click()
            expect(page.get_by_text("Search Wikimedia Commons")).to_be_visible()
            expect(page.locator('img[title="Twisted bow"]')).to_have_count(0)
            expect(page.get_by_label("Use pixel image?")).to_have_count(0)
            select_commons_image(page, "messi", GENERIC_COMMONS_IMAGE_TITLE)
            expect(page.get_by_role("button", name="Remove Tile Background Image")).to_be_visible()
            expect(page.get_by_text("Source:")).to_be_visible()
            expect(page.get_by_text("Wikimedia Commons")).to_be_visible()
            expect(page.get_by_label("Use pixel image?")).to_have_count(0)
            save_board_tile(page)
            expect(page.get_by_text("Board Successfully Updated!")).to_be_visible()
            expect_tile_image_loaded(page, 0)
            compare_visual_snapshot(page, "generic-board-commons-image", ".center-board")
            assert_no_browser_failures(browser_failures)

            context.close()
            browser.close()

        board = collection.find_one({"boardName": board_name})
        assert board is not None
        assert board.get("boardType") == "generic"
        tile = board["boardData"][0][0]
        assert tile["title"] == "Generic Commons Tile"
        assert tile["image"]["url"] == GENERIC_COMMONS_IMAGE_URL
        assert tile["image"]["sourceName"] == "Wikimedia Commons"
        assert not any("oldschool.runescape.wiki" in url for url in collect_artifact_urls(board))
    finally:
        cleanup_board(collection, board_name)


def fill_input_group(page, label, value):
    group = page.locator(".editable-input").filter(has_text=label).first
    group.locator("input, textarea").first.fill(value)


def write_fake_board_image(path):
    path.write_bytes(fake_osrs_screenshot_png(width=640, height=640))


def write_fake_proof_image(path):
    path.write_bytes(fake_osrs_screenshot_png())


def fake_osrs_screenshot_png(width=960, height=540):
    pixels = bytearray(width * height * 3)

    def set_pixel(x, y, color):
        if x < 0 or x >= width or y < 0 or y >= height:
            return
        idx = (y * width + x) * 3
        pixels[idx : idx + 3] = bytes(color)

    def rect(x0, y0, x1, y1, color):
        x0 = max(0, x0)
        y0 = max(0, y0)
        x1 = min(width, x1)
        y1 = min(height, y1)
        for y in range(y0, y1):
            start = (y * width + x0) * 3
            pixels[start : start + (x1 - x0) * 3] = bytes(color) * (x1 - x0)

    def border(x0, y0, x1, y1, color, size=3):
        rect(x0, y0, x1, y0 + size, color)
        rect(x0, y1 - size, x1, y1, color)
        rect(x0, y0, x0 + size, y1, color)
        rect(x1 - size, y0, x1, y1, color)

    def circle(cx, cy, radius, color):
        radius_sq = radius * radius
        for y in range(cy - radius, cy + radius + 1):
            for x in range(cx - radius, cx + radius + 1):
                if (x - cx) * (x - cx) + (y - cy) * (y - cy) <= radius_sq:
                    set_pixel(x, y, color)

    def diamond(cx, cy, radius, color):
        for y in range(cy - radius, cy + radius + 1):
            span = radius - abs(y - cy)
            rect(cx - span, y, cx + span + 1, y + 1, color)

    for y in range(height):
        for x in range(width):
            noise = ((x * 13 + y * 7) % 17) - 8
            r = max(0, min(255, 35 + x // 80 + noise))
            g = max(0, min(255, 31 + y // 96 + noise // 2))
            b = max(0, min(255, 25 + noise // 3))
            set_pixel(x, y, (r, g, b))

    rect(28, 24, 712, 512, (47, 41, 32))
    border(28, 24, 712, 512, (29, 24, 19), 5)
    border(34, 30, 706, 506, (93, 80, 63), 2)

    for y in range(48, 410, 18):
        for x in range(48, 690, 36):
            color = (61, 54, 43) if ((x // 36 + y // 18) % 2) else (69, 60, 48)
            rect(x, y, x + 36, y + 18, color)

    rect(64, 64, 300, 92, (78, 56, 28))
    rect(76, 72, 214, 78, (247, 230, 193))
    rect(76, 82, 274, 87, (219, 206, 180))

    circle(368, 248, 26, (36, 70, 28))
    circle(368, 248, 15, (112, 148, 66))
    rect(356, 274, 380, 328, (89, 62, 43))
    rect(338, 328, 398, 340, (33, 27, 20))

    circle(512, 214, 38, (92, 33, 30))
    circle(512, 214, 24, (133, 51, 42))
    rect(462, 176, 562, 184, (116, 24, 22))
    rect(462, 176, 528, 184, (45, 112, 34))

    for offset, color in ((0, (255, 152, 31)), (9, (255, 226, 74)), (17, (247, 230, 193))):
        diamond(444, 304 - offset, 20 - offset // 2, color)
    rect(402, 332, 486, 342, (255, 152, 31))
    rect(416, 350, 470, 358, (247, 230, 193))
    rect(390, 368, 498, 376, (219, 206, 180))

    rect(48, 418, 692, 494, (38, 32, 24))
    border(48, 418, 692, 494, (29, 24, 19), 3)
    for i, line_width in enumerate((292, 456, 338, 520)):
        y = 432 + i * 14
        rect(66, y, 66 + line_width, y + 6, (219, 206, 180))
    rect(66, 480, 222, 486, (255, 152, 31))

    rect(734, 24, 932, 512, (54, 46, 35))
    border(734, 24, 932, 512, (29, 24, 19), 5)
    border(740, 30, 926, 506, (93, 80, 63), 2)
    rect(760, 52, 904, 60, (255, 152, 31))
    for row in range(7):
        for col in range(4):
            x = 760 + col * 38
            y = 86 + row * 38
            rect(x, y, x + 32, y + 32, (43, 37, 30))
            border(x, y, x + 32, y + 32, (29, 24, 19), 2)
            if (row + col) % 3 == 0:
                diamond(x + 16, y + 16, 9, (255, 152, 31))
            elif (row + col) % 3 == 1:
                circle(x + 16, y + 16, 8, (112, 148, 66))
            else:
                rect(x + 9, y + 9, x + 23, y + 23, (156, 54, 45))

    rect(760, 382, 904, 454, (38, 32, 24))
    border(760, 382, 904, 454, (29, 24, 19), 3)
    rect(778, 402, 886, 410, (247, 230, 193))
    rect(778, 420, 864, 427, (219, 206, 180))
    rect(778, 438, 836, 445, (255, 152, 31))

    scanlines = bytearray()
    for y in range(height):
        scanlines.append(0)
        row_start = y * width * 3
        scanlines.extend(pixels[row_start : row_start + width * 3])

    def chunk(kind, data):
        return (
            struct.pack(">I", len(data))
            + kind
            + data
            + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
        )

    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(bytes(scanlines), level=9))
        + chunk(b"IEND", b"")
    )


def click_and_expect_api(page, method, path_fragment, click):
    with page.expect_response(
        lambda response: response_matches_api(response, method, path_fragment),
        timeout=15000,
    ) as response_info:
        click()

    response = response_info.value
    assert get_playwright_value(response, "ok"), (
        f"Expected {method} {path_fragment} to succeed, "
        f"got {get_playwright_value(response, 'status')} "
        f"from {get_playwright_value(response, 'url')}"
    )


def response_matches_api(response, method, path_fragment):
    request = get_playwright_value(response, "request")
    return (
        get_playwright_value(request, "method") == method
        and path_fragment in get_playwright_value(response, "url")
    )


def save_board_tile(page):
    click_and_expect_api(
        page,
        "PUT",
        "/updateBoard/",
        lambda: page.get_by_role("button", name="Save").click(),
    )


def save_team_settings(page):
    click_and_expect_api(
        page,
        "PUT",
        "/updateTeams/",
        lambda: page.get_by_role("button", name="Save").click(),
    )


def close_modal(page):
    page.get_by_role("button", name="Close").last.click()


def attach_browser_failure_guards(context):
    failures = []

    def attach_page(page):
        page.on(
            "pageerror",
            lambda exc: failures.append(
                f"Page error on {get_playwright_value(page, 'url')}: {exc}"
            ),
        )
        page.on("console", lambda msg: record_console_failure(failures, page, msg))
        page.on("requestfailed", lambda request: record_request_failure(failures, request))

    for page in context.pages:
        attach_page(page)
    context.on("page", attach_page)
    return failures


def record_console_failure(failures, page, msg):
    if get_playwright_value(msg, "type") != "error":
        return
    failures.append(
        f"Console error on {get_playwright_value(page, 'url')}: "
        f"{get_playwright_value(msg, 'text')}"
    )


def record_request_failure(failures, request):
    if ignored_failed_request(request):
        return

    failure = get_playwright_value(request, "failure") or "unknown failure"
    failures.append(
        f"Request failed: {get_playwright_value(request, 'method')} "
        f"{get_playwright_value(request, 'url')} ({failure})"
    )


def ignored_failed_request(request):
    failure = get_playwright_value(request, "failure") or ""
    if get_playwright_value(request, "resource_type") == "eventsource":
        return True
    if "ERR_ABORTED" in failure:
        return True
    return False


def get_playwright_value(obj, name):
    value = getattr(obj, name)
    if callable(value):
        return value()
    return value


def assert_no_browser_failures(failures):
    assert not failures, "Unexpected browser failures:\n" + "\n".join(failures)


def expect_input_group_value(page, label, value):
    group = page.locator(".editable-input").filter(has_text=label).first
    expect(group.locator("input, textarea").first).to_have_value(value)


def select_by_form_label(page, label, value):
    page.locator("label.et-field").filter(has_text=label).locator("select").select_option(value)


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
    wiki_result = page.locator(".tm-suggestion-item").filter(has_text=result_text).first
    expect(wiki_result).to_be_visible(timeout=15000)
    expect_loaded_image(page, wiki_result.locator("img").first)
    wiki_result.click()


def select_commons_image(page, search_text, result_text):
    fill_input_group(page, "Image Search", search_text)
    commons_result = page.locator(".tm-suggestion-item").filter(has_text=result_text).first
    expect(commons_result).to_be_visible(timeout=15000)
    expect_loaded_image(page, commons_result.locator("img").first)
    commons_result.click()


def stub_commons_search(page):
    payload = {
        "query": {
            "pages": {
                "1": {
                    "title": "File:Lionel_Messi_31mar2007.jpg",
                    "imageinfo": [
                        {
                            "descriptionurl": GENERIC_COMMONS_SOURCE_URL,
                            "thumburl": GENERIC_COMMONS_IMAGE_URL,
                            "url": GENERIC_COMMONS_IMAGE_URL,
                            "extmetadata": {
                                "ObjectName": {"value": GENERIC_COMMONS_IMAGE_TITLE},
                                "Artist": {"value": "Alex Tremps"},
                                "LicenseShortName": {"value": "CC BY 2.0"},
                                "LicenseUrl": {
                                    "value": "https://creativecommons.org/licenses/by/2.0/"
                                },
                            },
                        }
                    ],
                }
            }
        }
    }

    page.route(
        "https://commons.wikimedia.org/w/api.php**",
        lambda route: route.fulfill(
            status=200,
            body=json.dumps(payload),
            headers={
                "access-control-allow-origin": "*",
                "content-type": "application/json",
            },
        ),
    )


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
    expect(page.get_by_role("dialog")).to_be_visible()


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
