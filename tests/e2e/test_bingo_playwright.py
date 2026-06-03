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


ROOT = Path(__file__).resolve().parents[2]
API_DIR = ROOT / "services" / "api"
BOARD_PREFIX = os.environ.get("PLAYWRIGHT_E2E_BOARD_PREFIX", "__playwright_e2e__")
FRONTEND_URL = os.environ.get("PLAYWRIGHT_FRONTEND_URL", "http://localhost:3000")
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
TMP_ROOT = Path(os.environ.get("PLAYWRIGHT_E2E_TMP_DIR", ROOT / ".tmp" / "playwright-e2e"))

TINY_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII="
)


def test_bingo_board_create_edit_images_layers_and_cleanup():
    if sync_playwright is None:
        pytest.skip("Playwright is not installed. Install tests/e2e/requirements.txt.")
    if MongoClient is None:
        pytest.skip("pymongo is not installed. Install tests/e2e/requirements.txt.")

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

            open_tile_by_index(page, 1)
            fill_input_group(page, "Title", "Asset Tile")
            page.get_by_role("button", name="Set Tile Background Image").click()
            asset_icon = page.locator('img[title="Dragon claws"]').first
            expect(asset_icon).to_be_visible()
            expect_loaded_image(page, asset_icon)
            asset_icon.click()
            expect(page.get_by_role("button", name="Remove Tile Background Image")).to_be_visible()
            page.get_by_role("button", name="Save").click()
            expect(page.get_by_text("Board Successfully Updated!")).to_be_visible()

            open_tile_by_index(page, 2)
            fill_input_group(page, "Title", "Upload Tile")
            page.get_by_role("button", name="Set Tile Background Image").click()
            page.locator('input[type="file"][accept=".png,.jpeg"]').set_input_files(str(board_image))
            expect(page.get_by_role("button", name="Remove Tile Background Image")).to_be_visible()
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

            observer = context.new_page()
            observer.goto(f"{FRONTEND_URL}/#/bingo/{board_name}?password={general_password}")
            expect(observer.get_by_role("heading", name=re.compile(r"team-0"))).to_be_visible()
            expect(observer.get_by_text(re.compile(r"Points:\s*0"))).to_be_visible()

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

            page.get_by_role("button", name="General Mode").click()
            expect(page.get_by_role("button", name="Edit Board")).to_be_visible()
            edit_board(page)
            set_range(page, "4")
            expect(page.get_by_label("Layered board")).to_be_checked()
            page.get_by_role("button", name="Save").click()
            expect(page.get_by_text("Teams Successfully Updated!")).to_be_visible()

            open_tile(page, "E2E Tile")
            page.locator(".modal-header").get_by_role("button", name="Close").click()
            expect(page.get_by_role("dialog")).not_to_be_visible()

            open_tile(page, "Asset Tile")
            expect_input_group_value(page, "Title", "Asset Tile")
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


def expect_loaded_image(page, image):
    handle = image.element_handle()
    page.wait_for_function(
        "(img) => img.complete && img.naturalWidth > 0 && img.naturalHeight > 0",
        arg=handle,
        timeout=15000,
    )


def open_tile(page, title):
    page.get_by_text(title, exact=True).first.click()
    expect(page.get_by_role("dialog")).to_be_visible()


def open_tile_by_index(page, index):
    page.locator(".center-board .box-flex").nth(index).click()
    expect(page.get_by_role("dialog")).to_be_visible()


def edit_board(page):
    page.get_by_role("button", name="Edit Board").click()
    expect(page.get_by_role("dialog", name="Edit Board")).to_be_visible()


def launch_browser(p):
    browser_name = os.environ.get("PLAYWRIGHT_BROWSER", "chromium")
    headless = os.environ.get("PLAYWRIGHT_HEADLESS", "1").lower() not in ("0", "false", "no")
    browser_type = getattr(p, browser_name, None)
    if browser_type is None:
        pytest.skip(f"Unsupported PLAYWRIGHT_BROWSER={browser_name!r}")
    try:
        return browser_type.launch(headless=headless)
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
    for row in board.get("boardData", []):
        for tile in row:
            image = tile.get("image")
            if isinstance(image, dict) and image.get("url"):
                urls.append(image["url"])

    for team_index in range(int(board.get("teams", 0))):
        team = board.get(f"team-{team_index}", {})
        for row in team.get("teamData", []):
            for tile in row:
                urls.extend(tile.get("proofImages") or [])
    return urls


def delete_artifact(image_url):
    path = artifact_path(image_url)
    if not path:
        return
    try:
        path.unlink(missing_ok=True)
    except OSError:
        pass


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
