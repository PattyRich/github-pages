"""
Unit tests for server/server.py

Uses unittest.mock and a small locked in-memory collection to isolate MongoDB
and external calls (Discord, requests), so no live database or network
connection is needed to run these.

Run with:
    python -m pytest test_server.py -v
or:
    python -m unittest test_server.py -v
"""

import base64
import copy
import io
import json
import os
import tempfile
import threading
import time
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from unittest.mock import MagicMock, patch

os.environ.setdefault("PYTHON_DOTENV_DISABLED", "1")


# ---------------------------------------------------------------------------
# Patch heavy dependencies BEFORE importing server so the module-level
# pymongo.MongoClient() and index_information() calls don't fail.
# ---------------------------------------------------------------------------
MONGO_PATCH = patch("pymongo.MongoClient", autospec=True)
mock_mongo_cls = MONGO_PATCH.start()

# Build a realistic mock collection that won't blow up on index_information()
_mock_col = MagicMock()
_mock_col.index_information.return_value = {"_id_": {}}   # 1 index → skip creation
mock_mongo_cls.return_value.__getitem__.return_value.__getitem__.return_value = _mock_col

# Force flask_limiter to use in-memory storage during unit tests
import flask_limiter
_original_init = flask_limiter.Limiter.__init__
def _mock_init(self, *args, **kwargs):
    kwargs["storage_uri"] = "memory://"
    _original_init(self, *args, **kwargs)
flask_limiter.Limiter.__init__ = _mock_init

import server  # noqa: E402  (must come after patch)
import redis_events  # noqa: E402
import showcase  # noqa: E402
import upload_gc  # noqa: E402

# Point server's module-level `mycol` at our controllable mock
server.mycol = _mock_col


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_board(rows=2, cols=2, teams=2,
                admin_pw="admin123", general_pw="gen123",
                board_name="TestBoard", visible_rows=None):
    """Return a minimal board document as MongoDB would return it."""
    board_data = [[server.defaultBoardObj.copy() for _ in range(rows)] for _ in range(cols)]
    doc = {
        "_id": "board-id",
        "boardName": board_name,
        "adminPassword": admin_pw,
        "generalPassword": general_pw,
        "boardData": board_data,
        "teams": teams,
        "rows": rows,
        "columns": cols,
        "visibleRows": visible_rows if visible_rows is not None else rows,
        "boardMutationRevision": 0,
        "boardSettingsRevision": 0,
    }
    for i in range(teams):
        key = f"team-{i}"
        doc[key] = {
            "name": key,
            "teamData": server.initEmptyTeamData(cols, rows),
        }
    return doc


def _client(app):
    app.config["TESTING"] = True
    return app.test_client()


_MISSING = object()


def _path_value(document, path):
    current = document
    for part in path.split("."):
        if isinstance(current, dict):
            if part not in current:
                return _MISSING
            current = current[part]
        elif isinstance(current, list):
            try:
                index = int(part)
            except (TypeError, ValueError):
                return _MISSING
            if index < 0 or index >= len(current):
                return _MISSING
            current = current[index]
        else:
            return _MISSING
    return current


def _set_path(document, path, value):
    parts = path.split(".")
    current = document
    for part in parts[:-1]:
        if isinstance(current, dict):
            current = current[part]
        else:
            current = current[int(part)]
    leaf = parts[-1]
    if isinstance(current, dict):
        current[leaf] = copy.deepcopy(value)
    else:
        current[int(leaf)] = copy.deepcopy(value)


def _unset_path(document, path):
    parts = path.split(".")
    current = document
    for part in parts[:-1]:
        current = current[int(part)] if isinstance(current, list) else current.get(part, _MISSING)
        if current is _MISSING:
            return
    leaf = parts[-1]
    if isinstance(current, dict):
        current.pop(leaf, None)
    elif isinstance(current, list):
        index = int(leaf)
        if 0 <= index < len(current):
            current[index] = None


def _matches_query(document, query):
    for key, expected in query.items():
        if key == "$and":
            if not all(_matches_query(document, clause) for clause in expected):
                return False
            continue
        if key == "$or":
            if not any(_matches_query(document, clause) for clause in expected):
                return False
            continue
        actual = _path_value(document, key)
        if isinstance(expected, dict) and "$exists" in expected:
            if (actual is not _MISSING) != bool(expected["$exists"]):
                return False
        elif actual is _MISSING or actual != expected:
            return False
    return True


class _UpdateResult:
    def __init__(self, matched_count):
        self.matched_count = matched_count


class StatefulCollection:
    """Small, locked Mongo update_one model for CAS interleaving tests."""

    def __init__(self, board, synchronize_auth_reads=False):
        self.board = copy.deepcopy(board)
        self.lock = threading.Lock()
        self.read_barrier = threading.Barrier(2) if synchronize_auth_reads else None

    def find_one(self, query):
        with self.lock:
            result = copy.deepcopy(self.board) if _matches_query(self.board, query) else None
        if self.read_barrier is not None:
            self.read_barrier.wait(timeout=5)
        return result

    def update_one(self, query, update):
        with self.lock:
            if not _matches_query(self.board, query):
                return _UpdateResult(0)
            for path, value in update.get("$set", {}).items():
                _set_path(self.board, path, value)
            for path, amount in update.get("$inc", {}).items():
                current = _path_value(self.board, path)
                _set_path(self.board, path, (0 if current is _MISSING else current) + amount)
            for path in update.get("$unset", {}):
                _unset_path(self.board, path)
            return _UpdateResult(1)


def _query_has_field(query, field):
    if field in query:
        return True
    return any(
        _query_has_field(value, field) if isinstance(value, dict)
        else any(_query_has_field(item, field) for item in value) if isinstance(value, list)
        else False
        for value in query.values()
    )


class OrderedStructuralCollection(StatefulCollection):
    """Force either progress or structural update to commit first."""

    def __init__(self, board, first):
        super().__init__(board, synchronize_auth_reads=True)
        self.first = first
        self.progress_done = threading.Event()
        self.structural_done = threading.Event()

    def update_one(self, query, update):
        structural = _query_has_field(query, "boardMutationRevision")
        if self.first == "progress" and structural:
            self.progress_done.wait(timeout=5)
        elif self.first == "structural" and not structural:
            self.structural_done.wait(timeout=5)
        result = super().update_one(query, update)
        if structural:
            self.structural_done.set()
        else:
            self.progress_done.set()
        return result


class TestRedisEventBroker(unittest.TestCase):
    class StopBrokerLoop(BaseException):
        pass

    def setUp(self):
        self.spawn_patch = patch("redis_events.spawn")
        self.mock_spawn = self.spawn_patch.start()
        self.mock_spawn.return_value.dead = False
        self.broker = redis_events.RedisEventBroker(MagicMock(), MagicMock())

    def tearDown(self):
        self.spawn_patch.stop()

    def test_fans_out_only_to_matching_board_subscribers(self):
        first = self.broker.subscribe("board:first")
        second = self.broker.subscribe("board:second")

        refresh = object()
        self.broker._dispatch("board:first", refresh)

        self.assertIs(first.get_nowait(), refresh)
        self.assertTrue(second.empty())
        self.assertEqual(self.broker.subscriber_count(), 2)
        self.mock_spawn.assert_called_once_with(self.broker._run)

    def test_coalesces_refreshes_and_prioritizes_disconnect(self):
        subscriber = self.broker.subscribe("board:first")

        self.broker._dispatch("board:first", object())
        self.broker._dispatch("board:first", object())
        self.assertEqual(subscriber.qsize(), 1)

        self.broker._disconnect_subscribers()
        self.assertIs(subscriber.get_nowait(), redis_events.BROKER_DISCONNECTED)

    def test_unsubscribe_removes_empty_board_channel(self):
        subscriber = self.broker.subscribe("board:first")

        self.broker.unsubscribe("board:first", subscriber)

        self.assertEqual(self.broker.subscriber_count(), 0)

    def test_sse_stream_releases_subscription_when_broker_disconnects(self):
        subscription = MagicMock()
        subscription.get.return_value = redis_events.BROKER_DISCONNECTED

        with (
            patch.object(server, "auth", return_value=({}, None)),
            patch.object(server._board_event_broker, "subscribe", return_value=subscription),
            patch.object(server._board_event_broker, "unsubscribe") as unsubscribe,
        ):
            response = _client(server.app).get(
                "/events/TestBoard/gen123/general",
                buffered=False,
            )
            self.assertEqual(next(response.response), b"retry: 3000\n\n")
            with self.assertRaises(StopIteration):
                next(response.response)

        unsubscribe.assert_called_once_with("board:TestBoard", subscription)

    def test_listener_subscribes_routes_pattern_message_and_closes(self):
        first = self.broker.subscribe("board:first")
        second = self.broker.subscribe("board:second")
        pubsub = self.broker._redis.pubsub.return_value
        calls = 0

        def get_message(timeout):
            nonlocal calls
            calls += 1
            if calls == 1:
                return None  # PSUBSCRIBE acknowledgement is hidden.
            if calls == 2:
                # Drain the broker's initial reconciliation refresh so the
                # pattern message itself is what remains in the target queue.
                first.get_nowait()
                second.get_nowait()
                return {
                    "type": "pmessage",
                    "channel": b"board:first",
                    "data": b"refresh",
                }
            raise self.StopBrokerLoop()

        pubsub.get_message.side_effect = get_message

        with self.assertRaises(self.StopBrokerLoop):
            self.broker._run()

        pubsub.psubscribe.assert_called_once_with("board:*")
        self.assertEqual(first.qsize(), 1)
        self.assertTrue(second.empty())
        pubsub.close.assert_called_once()

    def test_listener_disconnects_clients_then_reconciles_after_retry(self):
        old_subscription = self.broker.subscribe("board:first")
        failed_pubsub = MagicMock()
        recovered_pubsub = MagicMock()
        failed_pubsub.get_message.side_effect = server.redis_lib.exceptions.ConnectionError(
            "connection lost"
        )
        recovered_pubsub.get_message.side_effect = [None, self.StopBrokerLoop()]
        self.broker._redis.pubsub.side_effect = [failed_pubsub, recovered_pubsub]
        new_subscription = None

        def reconnect_sleep(delay):
            nonlocal new_subscription
            self.assertEqual(delay, 1)
            self.assertIs(
                old_subscription.get_nowait(),
                redis_events.BROKER_DISCONNECTED,
            )
            self.broker.unsubscribe("board:first", old_subscription)
            new_subscription = self.broker.subscribe("board:first")

        with (
            patch("redis_events.sleep", side_effect=reconnect_sleep) as sleep,
            self.assertRaises(self.StopBrokerLoop),
        ):
            self.broker._run()

        sleep.assert_called_once_with(1)
        failed_pubsub.close.assert_called_once()
        recovered_pubsub.close.assert_called_once()
        self.assertIsNotNone(new_subscription)
        self.assertEqual(new_subscription.qsize(), 1)

    def test_event_pool_disables_internal_redis_retries(self):
        retry = server._event_redis_pool.connection_kwargs["retry"]
        self.assertEqual(retry.get_retries(), 0)


TINY_PNG_DATA_URI = (
    "data:image/png;base64,"
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg=="
)


def _animated_image_data_uri(format_name="GIF", mime_type="image/gif"):
    from PIL import Image

    frames = [
        Image.new("RGB", (4, 4), (255, 0, 0)),
        Image.new("RGB", (4, 4), (0, 255, 0)),
    ]
    buf = io.BytesIO()
    save_options = {
        "format": format_name,
        "save_all": True,
        "append_images": frames[1:],
        "duration": [60, 60],
        "loop": 0,
    }
    if format_name == "WEBP":
        save_options.update({"quality": 80, "method": 6})
    frames[0].save(buf, **save_options)
    return f"data:{mime_type};base64,{base64.b64encode(buf.getvalue()).decode('ascii')}"


# ---------------------------------------------------------------------------
# Tests: helper functions (pure Python, no HTTP)
# ---------------------------------------------------------------------------

class TestInitEmptyTeamData(unittest.TestCase):
    def test_correct_dimensions(self):
        data = server.initEmptyTeamData(3, 4)
        self.assertEqual(len(data), 3)
        self.assertEqual(len(data[0]), 4)

    def test_default_values(self):
        data = server.initEmptyTeamData(2, 2)
        tile = data[0][0]
        self.assertFalse(tile["checked"])
        self.assertEqual(tile["proof"], "")
        self.assertEqual(tile["currPoints"], 0)

    def test_tiles_are_independent_copies(self):
        """Mutating one tile must not affect another (`.copy()` guard)."""
        data = server.initEmptyTeamData(2, 2)
        data[0][0]["checked"] = True
        self.assertFalse(data[0][1]["checked"])
        self.assertFalse(data[1][0]["checked"])


class TestClearBadData(unittest.TestCase):
    def test_removes_disallowed_keys(self):
        data = {"a": 1, "b": 2, "evil": 3}
        result = server.clearBadData(data, ["a", "b"])
        self.assertNotIn("evil", result)

    def test_keeps_allowed_keys(self):
        data = {"title": "hi", "points": 5, "hack": True}
        result = server.clearBadData(data, server.adminTileKeys)
        self.assertIn("title", result)
        self.assertIn("points", result)
        self.assertNotIn("hack", result)

    def test_empty_data(self):
        result = server.clearBadData({}, ["title"])
        self.assertEqual(result, {})


class TestImageStore(unittest.TestCase):
    def test_board_cover_store_preserves_animated_gif_as_webp(self):
        from PIL import Image

        with tempfile.TemporaryDirectory() as tmp:
            store = server.board_images.__class__(
                url_prefix="/static/uploads/board-images",
                upload_root=Path(tmp),
                max_source_bytes=1024 * 1024,
                max_pixels=10_000,
                target_kb=50,
                allowed_media_types=("image/png", "image/jpeg", "image/webp", "image/gif"),
                allow_animated=True,
                animated_target_kb=300,
                max_animation_frames=10,
                max_animation_total_pixels=100_000,
            )

            saved_url = store.save(_animated_image_data_uri())
            saved_path = Path(tmp) / saved_url.rsplit("/", 1)[-1]

            self.assertTrue(saved_url.endswith(".webp"))
            self.assertLessEqual(saved_path.stat().st_size, 300 * 1024)
            with Image.open(saved_path) as image:
                self.assertEqual(image.format, "WEBP")
                self.assertTrue(getattr(image, "is_animated", False))
                self.assertGreater(getattr(image, "n_frames", 1), 1)

    def test_proof_store_rejects_animated_webp(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = server.proof_images.__class__(
                url_prefix="/static/uploads/proofs",
                upload_root=Path(tmp),
                max_source_bytes=1024 * 1024,
                max_pixels=10_000,
                target_kb=50,
                allowed_media_types=("image/png", "image/jpeg", "image/webp"),
                allow_animated=False,
                max_animation_frames=10,
                max_animation_total_pixels=100_000,
            )

            with self.assertRaisesRegex(ValueError, "Animated images are only supported"):
                store.save(_animated_image_data_uri("WEBP", "image/webp"))


class TestUploadGarbageCollection(unittest.TestCase):
    def test_collects_relative_and_public_upload_urls_from_nested_documents(self):
        references = upload_gc.collect_upload_references({
            "boardData": [[{"image": {"url": "/static/uploads/board-images/board.webp"}}]],
            "team-0": {
                "teamData": [[{
                    "proofImages": [
                        "https://praynr.com/static/uploads/proofs/proof.webp",
                        "https://example.com/external.webp",
                    ],
                }]],
            },
        })
        self.assertEqual(
            references["/static/uploads/board-images"],
            {"/static/uploads/board-images/board.webp"},
        )
        self.assertEqual(
            references["/static/uploads/proofs"],
            {"/static/uploads/proofs/proof.webp"},
        )

    def test_prunes_only_old_unreferenced_direct_image_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            directory = Path(tmp)
            referenced = directory / "referenced.webp"
            orphan = directory / "orphan.png"
            fresh = directory / "fresh.jpg"
            ignored = directory / "notes.txt"
            for path in (referenced, orphan, fresh, ignored):
                path.write_bytes(b"test")

            old_timestamp = time.time() - (8 * 24 * 60 * 60)
            os.utime(referenced, (old_timestamp, old_timestamp))
            os.utime(orphan, (old_timestamp, old_timestamp))
            os.utime(ignored, (old_timestamp, old_timestamp))

            removed = upload_gc.prune_upload_directory(
                directory,
                "/static/uploads/proofs",
                {"/static/uploads/proofs/referenced.webp"},
                time.time() - (7 * 24 * 60 * 60),
            )

            self.assertEqual(removed, 1)
            self.assertTrue(referenced.exists())
            self.assertFalse(orphan.exists())
            self.assertTrue(fresh.exists())
            self.assertTrue(ignored.exists())


class TestShowcase(unittest.TestCase):
    def test_parses_newline_list_and_ignores_blank_lines_and_comments(self):
        filenames = showcase.parse_showcase_list([
            "first.webp\n",
            "\n",
            "# chosen from a proof URL\n",
            " second.webp \n",
        ])

        self.assertEqual(filenames, ["first.webp", "second.webp"])

    def test_rejects_duplicate_or_unsafe_filenames(self):
        with self.assertRaisesRegex(ValueError, "duplicate"):
            showcase.parse_showcase_list(["same.webp\n", "same.webp\n"])
        with self.assertRaisesRegex(ValueError, "Invalid"):
            showcase.parse_showcase_list(["../proof.webp\n"])

    def test_replaces_existing_showcase_as_one_batch(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            proofs = root / "proofs"
            destination = root / "showcase"
            proofs.mkdir()
            destination.mkdir()
            (proofs / "first.webp").write_bytes(b"first")
            (proofs / "second.webp").write_bytes(b"second")
            (destination / "old.webp").write_bytes(b"old")
            (destination / showcase.MANIFEST_NAME).write_text(
                json.dumps({"version": 1, "images": ["old.webp"]}),
                encoding="utf-8",
            )

            showcase.replace_showcase(
                ["second.webp", "first.webp"],
                proof_dir=proofs,
                showcase_dir=destination,
            )

            self.assertFalse((destination / "old.webp").exists())
            self.assertEqual(
                showcase.load_showcase_filenames(destination),
                ["second.webp", "first.webp"],
            )

    def test_missing_proof_keeps_existing_showcase(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            proofs = root / "proofs"
            destination = root / "showcase"
            proofs.mkdir()
            destination.mkdir()
            (destination / "old.webp").write_bytes(b"old")
            (destination / showcase.MANIFEST_NAME).write_text(
                json.dumps({"version": 1, "images": ["old.webp"]}),
                encoding="utf-8",
            )

            with self.assertRaisesRegex(FileNotFoundError, "missing.webp"):
                showcase.replace_showcase(
                    ["missing.webp"],
                    proof_dir=proofs,
                    showcase_dir=destination,
                )

            self.assertEqual(showcase.load_showcase_filenames(destination), ["old.webp"])


class TestShowcaseEndpoint(unittest.TestCase):
    def setUp(self):
        self.client = _client(server.app)

    @patch.object(server, "load_showcase_filenames", return_value=["first.webp", "second.webp"])
    def test_returns_public_showcase_urls(self, _load):
        response = self.client.get("/showcase")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.data)["images"],
            [
                "http://localhost/static/uploads/showcase/first.webp",
                "http://localhost/static/uploads/showcase/second.webp",
            ],
        )
        self.assertEqual(response.headers["Cache-Control"], "public, max-age=60")

    @patch.object(server, "load_showcase_filenames", side_effect=ValueError("bad manifest"))
    def test_manifest_failure_returns_empty_fallback_payload(self, _load):
        response = self.client.get("/showcase")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.data), {"images": []})


# ---------------------------------------------------------------------------
# Tests: auth() helper
#
# auth() calls bad_request() on failure, which calls jsonify() — that
# requires an active Flask application context even outside a request.
# We push one in setUp and pop it in tearDown.
# ---------------------------------------------------------------------------

class TestAuthHelper(unittest.TestCase):
    def setUp(self):
        self.board = _make_board()
        _mock_col.find_one.return_value = self.board
        self.ctx = server.app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    def test_admin_correct_password(self):
        cache, err = server.auth("TestBoard", "admin123", "admin")
        self.assertIsNone(err)
        self.assertIsNotNone(cache)

    def test_admin_wrong_password(self):
        cache, err = server.auth("TestBoard", "wrong", "admin")
        self.assertIsNone(cache)
        self.assertIsNotNone(err)

    def test_general_correct_password(self):
        cache, err = server.auth("TestBoard", "gen123", "general")
        self.assertIsNone(err)

    def test_general_accepts_admin_password(self):
        """Admin password should also work for general-level auth."""
        cache, err = server.auth("TestBoard", "admin123", "general")
        self.assertIsNone(err)

    def test_general_wrong_password(self):
        cache, err = server.auth("TestBoard", "totally_wrong", "general")
        self.assertIsNone(cache)
        self.assertIsNotNone(err)

    def test_board_not_found(self):
        _mock_col.find_one.return_value = None
        cache, err = server.auth("NoSuchBoard", "pw", "general")
        self.assertIsNone(cache)
        self.assertIsNotNone(err)
        _mock_col.find_one.return_value = self.board   # restore

    def test_must_be_admin_rejects_general(self):
        cache, err = server.auth("TestBoard", "gen123", "general", mustBeAdmin=True)
        self.assertIsNone(cache)
        self.assertIsNotNone(err)

    def test_must_be_admin_accepts_admin(self):
        cache, err = server.auth("TestBoard", "admin123", "admin", mustBeAdmin=True)
        self.assertIsNone(err)


# ---------------------------------------------------------------------------
# Tests: HTTP endpoints
# ---------------------------------------------------------------------------

class TestCreateBoard(unittest.TestCase):
    def setUp(self):
        self.client = _client(server.app)
        _mock_col.find_one.return_value = None           # board doesn't exist yet
        _mock_col.insert_one.return_value = MagicMock()  # simulate successful insert

    def _post(self, payload):
        return self.client.post(
            "/createBoard",
            data=json.dumps(payload),
            content_type="application/json",
        )

    @patch("server.postToDiscord", return_value=True)
    def test_creates_board_successfully(self, _):
        resp = self._post({
            "boardName": "MyBoard",
            "adminPassword": "a",
            "generalPassword": "g",
            "teams": 2,
            "rows": 3,
            "columns": 3,
        })
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(json.loads(resp.data)["success"])
        inserted = _mock_col.insert_one.call_args[0][0]
        self.assertEqual(inserted["visibleRows"], 3)
        self.assertEqual(inserted["boardType"], "osrs")
        self.assertEqual(inserted["boardData"][0][0]["title"], "Example Tile")
        self.assertIn("oldschool.runescape.wiki", inserted["boardData"][0][0]["image"]["url"])
        self.assertNotIn("opacity", inserted["boardData"][0][0]["image"])

    @patch("server.postToDiscord", return_value=True)
    def test_generic_board_skips_osrs_starter_tile(self, _):
        resp = self._post({
            "boardName": "GenericBoard",
            "adminPassword": "a",
            "generalPassword": "g",
            "teams": 2,
            "rows": 3,
            "columns": 3,
            "boardType": "generic",
        })
        self.assertEqual(resp.status_code, 200)
        inserted = _mock_col.insert_one.call_args[0][0]
        self.assertEqual(inserted["boardType"], "generic")
        self.assertEqual(inserted["boardData"][0][0]["title"], "")
        self.assertIsNone(inserted["boardData"][0][0]["image"])

    @patch("server.postToDiscord", return_value=True)
    def test_creation_discord_link_encodes_board_and_password_spaces(self, post_to_discord):
        with patch.dict(server.os.environ, {"CREATION_WEBHOOK": "https://discord.example/webhook"}):
            resp = self._post({
                "boardName": "My Board (2)",
                "adminPassword": "a",
                "generalPassword": "general pw",
                "teams": 2,
                "rows": 3,
                "columns": 3,
            })
        self.assertEqual(resp.status_code, 200)
        message = post_to_discord.call_args[0][0]
        self.assertIn("/#/bingo/My%20Board%20%282%29?password=general%20pw", message)

    def test_create_rejects_route_breaking_characters(self):
        for char in server.disallowedRouteChars:
            with self.subTest(char=char):
                _mock_col.reset_mock()
                resp = self._post({
                    "boardName": f"My{char}Board",
                    "adminPassword": "a",
                    "generalPassword": "g",
                    "teams": 2,
                    "rows": 3,
                    "columns": 3,
                })
                self.assertEqual(resp.status_code, 400)
                self.assertIn("cannot have these characters", json.loads(resp.data)["message"])
                _mock_col.find_one.assert_not_called()

    @patch("server.postToDiscord", return_value=True)
    def test_test_board_prefix_skips_creation_discord_alert(self, post_to_discord):
        with patch.dict(server.os.environ, {"CREATION_WEBHOOK": "https://discord.example/webhook"}):
            resp = self._post({
                "boardName": f"{server.testBoardPrefix} smoke",
                "adminPassword": "a",
                "generalPassword": "g",
                "teams": 2,
                "rows": 3,
                "columns": 3,
            })
        self.assertEqual(resp.status_code, 200)
        post_to_discord.assert_not_called()

    @patch("server.postToDiscord", return_value=True)
    def test_missing_creation_webhook_skips_creation_discord_alert(self, post_to_discord):
        with patch.dict(server.os.environ, {"CREATION_WEBHOOK": ""}):
            resp = self._post({
                "boardName": "LocalDevBoard",
                "adminPassword": "a",
                "generalPassword": "g",
                "teams": 2,
                "rows": 3,
                "columns": 3,
            })
        self.assertEqual(resp.status_code, 200)
        post_to_discord.assert_not_called()

    def test_test_board_request_is_detected_for_rate_limit_exemption(self):
        with server.app.test_request_context(
            "/createBoard",
            method="POST",
            json={"boardName": f"{server.testBoardPrefix} rate-limit"},
        ):
            self.assertTrue(server.is_test_board_request())

    @patch("server.postToDiscord", return_value=True)
    def test_duplicate_board_name_returns_400(self, _):
        _mock_col.find_one.return_value = _make_board()  # board already exists
        resp = self._post({
            "boardName": "MyBoard",
            "adminPassword": "a",
            "generalPassword": "g",
            "teams": 2,
            "rows": 3,
            "columns": 3,
        })
        self.assertEqual(resp.status_code, 400)
        _mock_col.find_one.return_value = None           # restore


class TestGetBoard(unittest.TestCase):
    def setUp(self):
        self.client = _client(server.app)
        self.board = _make_board()
        _mock_col.find_one.return_value = self.board

    def test_get_board_as_admin(self):
        resp = self.client.get("/getBoard/TestBoard/admin123/admin")
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertIn("boardData", data)
        self.assertIn("teamData", data)
        self.assertEqual(data["boardType"], "osrs")

    def test_get_board_exposes_board_and_tile_revisions(self):
        self.board["boardMutationRevision"] = 7
        self.board["boardSettingsRevision"] = 3
        self.board["boardData"][0][1]["revision"] = 4
        self.board["team-0"]["teamData"][0][1]["revision"] = 9
        resp = self.client.get("/getBoard/TestBoard/gen123/general")
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertEqual(data["boardMutationRevision"], 7)
        self.assertEqual(data["boardSettingsRevision"], 3)
        self.assertEqual(data["boardData"][0][1]["revision"], 4)
        self.assertEqual(data["teamData"][0]["data"]["teamData"][0][1]["revision"], 9)

    def test_get_board_maps_legacy_missing_revisions_to_zero(self):
        self.board.pop("boardMutationRevision")
        self.board.pop("boardSettingsRevision")
        self.board["boardData"][0][0].pop("revision")
        self.board["team-0"]["teamData"][0][0].pop("revision")
        resp = self.client.get("/getBoard/TestBoard/gen123/general")
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertEqual(data["boardMutationRevision"], 0)
        self.assertEqual(data["boardSettingsRevision"], 0)
        self.assertEqual(data["boardData"][0][0]["revision"], 0)
        self.assertEqual(data["teamData"][0]["data"]["teamData"][0][0]["revision"], 0)

    def test_get_board_returns_generic_board_type(self):
        self.board["boardType"] = "generic"
        resp = self.client.get("/getBoard/TestBoard/admin123/admin")
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertEqual(data["boardType"], "generic")

    def test_get_board_normalizes_legacy_plain_board_type(self):
        self.board["boardType"] = "plain"
        resp = self.client.get("/getBoard/TestBoard/admin123/admin")
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertEqual(data["boardType"], "generic")

    def test_get_board_as_general(self):
        resp = self.client.get("/getBoard/TestBoard/gen123/general")
        self.assertEqual(resp.status_code, 200)

    def test_get_board_tolerates_image_without_url(self):
        self.board["boardData"][0][0]["image"] = {"opacity": 100}
        resp = self.client.get("/getBoard/TestBoard/gen123/general")
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertIsNone(data["boardData"][0][0]["image"])

    def test_get_board_wrong_password(self):
        resp = self.client.get("/getBoard/TestBoard/wrong/general")
        self.assertEqual(resp.status_code, 400)

    def test_get_board_not_found(self):
        _mock_col.find_one.return_value = None
        resp = self.client.get("/getBoard/NoBoard/pw/general")
        self.assertEqual(resp.status_code, 400)
        _mock_col.find_one.return_value = self.board

    def test_general_pw_not_exposed(self):
        """generalPassword should not appear inside any teamData entry."""
        resp = self.client.get("/getBoard/TestBoard/gen123/general")
        data = json.loads(resp.data)
        for team in data["teamData"]:
            self.assertNotIn("password", team.get("data", {}))

    def test_team_data_count_matches(self):
        resp = self.client.get("/getBoard/TestBoard/admin123/admin")
        data = json.loads(resp.data)
        self.assertEqual(len(data["teamData"]), self.board["teams"])

    def test_general_only_receives_visible_board_rows(self):
        self.board = _make_board(rows=4, cols=3, visible_rows=2)
        _mock_col.find_one.return_value = self.board
        resp = self.client.get("/getBoard/TestBoard/gen123/general")
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertEqual(data["visibleRows"], 2)
        self.assertEqual(len(data["boardData"]), 2)
        self.assertTrue(all(len(row) == 4 for row in data["boardData"]))

    def test_general_still_receives_full_team_data(self):
        self.board = _make_board(rows=4, cols=3, visible_rows=2)
        _mock_col.find_one.return_value = self.board
        resp = self.client.get("/getBoard/TestBoard/gen123/general")
        data = json.loads(resp.data)
        self.assertEqual(len(data["teamData"][0]["data"]["teamData"]), 3)
        self.assertEqual(len(data["teamData"][0]["data"]["teamData"][0]), 4)

    def test_admin_receives_all_board_rows_on_layered_board(self):
        self.board = _make_board(rows=4, cols=3, visible_rows=2)
        _mock_col.find_one.return_value = self.board
        resp = self.client.get("/getBoard/TestBoard/admin123/admin")
        data = json.loads(resp.data)
        self.assertEqual(len(data["boardData"]), 3)
        self.assertTrue(all(len(row) == 4 for row in data["boardData"]))


class TestAuthEndpoint(unittest.TestCase):
    def setUp(self):
        self.client = _client(server.app)
        _mock_col.find_one.return_value = _make_board()

    def test_valid_admin_auth(self):
        resp = self.client.get("/auth/TestBoard/admin123/admin")
        self.assertEqual(resp.status_code, 200)

    def test_valid_general_auth(self):
        resp = self.client.get("/auth/TestBoard/gen123/general")
        self.assertEqual(resp.status_code, 200)

    def test_invalid_password(self):
        resp = self.client.get("/auth/TestBoard/wrong/general")
        self.assertEqual(resp.status_code, 400)

    def test_board_not_found(self):
        _mock_col.find_one.return_value = None
        resp = self.client.get("/auth/GhostBoard/pw/admin")
        self.assertEqual(resp.status_code, 400)


class TestUpdateBoard(unittest.TestCase):
    def setUp(self):
        self.client = _client(server.app)
        self.board = _make_board()
        _mock_col.find_one.return_value = self.board
        _mock_col.update_one.reset_mock()
        _mock_col.update_one.return_value = MagicMock(matched_count=1)

    def _put(self, url, payload):
        payload = json.loads(json.dumps(payload))
        payload.setdefault("expectedRevision", 0)
        payload.setdefault("expectedSettingsRevision", 0)
        if "/general" in url:
            payload.setdefault("expectedBoardTileRevision", 0)
        return self.client.put(
            url,
            data=json.dumps(payload),
            content_type="application/json",
        )

    def test_admin_can_update_tile(self):
        resp = self._put(
            "/updateBoard/TestBoard/admin123/admin",
            {"row": 0, "col": 0, "info": {"title": "New Title", "points": 10,
                                           "description": "", "image": None,
                                           "rowBingo": 0, "colBingo": 0}},
        )
        self.assertEqual(resp.status_code, 200)

    def test_legacy_admin_client_uses_authenticated_snapshot_revisions(self):
        self.board["boardSettingsRevision"] = 4
        self.board["boardData"][0][0]["revision"] = 2
        response = self.client.put(
            "/updateBoard/TestBoard/admin123/admin",
            data=json.dumps({"row": 0, "col": 0, "info": {"title": "Legacy edit"}}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        query = _mock_col.update_one.call_args[0][0]
        self.assertEqual(query["$and"], [
            {"boardData.0.0.revision": 2},
            {"boardSettingsRevision": 4},
        ])

    def test_legacy_general_client_uses_authenticated_snapshot_revisions(self):
        self.board["boardSettingsRevision"] = 4
        self.board["boardData"][0][0]["revision"] = 3
        self.board["team-0"]["teamData"][0][0]["revision"] = 2
        response = self.client.put(
            "/updateBoard/TestBoard/gen123/general",
            data=json.dumps({
                "row": 0,
                "col": 0,
                "info": {"checked": True, "currPoints": 0, "teamId": 0},
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        query = _mock_col.update_one.call_args[0][0]
        self.assertEqual(query["$and"], [
            {"team-0.teamData.0.0.revision": 2},
            {"boardSettingsRevision": 4},
            {"boardData.0.0.revision": 3},
        ])

    def test_admin_update_strips_bad_keys(self):
        """Keys not in adminTileKeys should be silently dropped."""
        resp = self._put(
            "/updateBoard/TestBoard/admin123/admin",
            {"row": 0, "col": 0, "info": {"title": "OK", "points": 5,
                                           "description": "", "image": None,
                                           "rowBingo": 0, "colBingo": 0,
                                           "evilKey": "hacked"}},
        )
        self.assertEqual(resp.status_code, 200)
        # Confirm evilKey didn't make it into boardData
        updates = _mock_col.update_one.call_args[0][1]["$set"]
        self.assertNotIn("boardData.0.0.evilKey", updates)

    def test_admin_update_strips_image_opacity(self):
        resp = self._put(
            "/updateBoard/TestBoard/admin123/admin",
            {"row": 0, "col": 0, "info": {"title": "OK", "points": 5,
                                           "description": "",
                                           "image": {"url": "https://example.com/tile.png",
                                                     "opacity": 42,
                                                     "usePixel": True},
                                           "rowBingo": 0, "colBingo": 0}},
        )
        self.assertEqual(resp.status_code, 200)
        updates = _mock_col.update_one.call_args[0][1]["$set"]
        self.assertEqual(updates["boardData.0.0.image"]["url"], "https://example.com/tile.png")
        self.assertTrue(updates["boardData.0.0.image"]["usePixel"])
        self.assertNotIn("opacity", updates["boardData.0.0.image"])

    def test_general_can_update_tile(self):
        self.board["boardData"][0][0]["points"] = 10
        resp = self._put(
            "/updateBoard/TestBoard/gen123/general",
            {"row": 0, "col": 0, "info": {"checked": True, "proof": "img.png",
                                            "currPoints": 5, "teamId": 0}},
        )
        self.assertEqual(resp.status_code, 200)

    def test_general_can_complete_tile_without_configured_points(self):
        self.board["boardData"][0][0]["points"] = ""
        resp = self._put(
            "/updateBoard/TestBoard/gen123/general",
            {"row": 0, "col": 0, "info": {"checked": True, "proof": "",
                                           "currPoints": "", "teamId": 0}},
        )
        self.assertEqual(resp.status_code, 200)
        updates = _mock_col.update_one.call_args[0][1]["$set"]
        self.assertEqual(updates["team-0.teamData.0.0.currPoints"], 0)

    def test_general_rejects_points_above_tile_value(self):
        self.board["boardData"][0][0]["points"] = 10
        resp = self._put(
            "/updateBoard/TestBoard/gen123/general",
            {"row": 0, "col": 0, "info": {"checked": True, "proof": "",
                                            "currPoints": 11, "teamId": 0}},
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("cannot exceed", json.loads(resp.data)["message"])
        _mock_col.update_one.assert_not_called()

    def test_general_rejects_negative_points(self):
        self.board["boardData"][0][0]["points"] = 10
        resp = self._put(
            "/updateBoard/TestBoard/gen123/general",
            {"row": 0, "col": 0, "info": {"checked": True, "proof": "",
                                            "currPoints": -1, "teamId": 0}},
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("cannot be negative", json.loads(resp.data)["message"])
        _mock_col.update_one.assert_not_called()

    def test_general_cannot_update_hidden_row(self):
        board = _make_board(rows=4, cols=3, visible_rows=2)
        _mock_col.find_one.return_value = board
        resp = self._put(
            "/updateBoard/TestBoard/gen123/general",
            {"row": 2, "col": 0, "info": {"checked": True, "proof": "",
                                           "currPoints": 0, "teamId": 0}},
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("not been revealed", json.loads(resp.data)["message"])

    def test_wrong_password_rejected(self):
        resp = self._put(
            "/updateBoard/TestBoard/wrong/general",
            {"row": 0, "col": 0, "info": {"checked": True, "proof": "",
                                           "currPoints": 0, "teamId": 0}},
        )
        self.assertEqual(resp.status_code, 400)

    def test_general_with_team_password_required_wrong_teampw(self):
        board = _make_board()
        board["requirePassword"] = True
        board["team-0"]["password"] = "secret"
        _mock_col.find_one.return_value = board
        resp = self._put(
            "/updateBoard/TestBoard/gen123/general/wrongteampw",
            {"row": 0, "col": 0, "info": {"checked": True, "proof": "",
                                           "currPoints": 0, "teamId": 0}},
        )
        self.assertEqual(resp.status_code, 400)
        _mock_col.find_one.return_value = self.board  # restore

    def test_general_with_team_password_required_correct_teampw(self):
        board = _make_board()
        board["requirePassword"] = True
        board["team-0"]["password"] = "secret"
        _mock_col.find_one.return_value = board
        resp = self._put(
            "/updateBoard/TestBoard/gen123/general/secret",
            {"row": 0, "col": 0, "info": {"checked": True, "proof": "",
                                           "currPoints": 0, "teamId": 0}},
        )
        self.assertEqual(resp.status_code, 200)
        _mock_col.find_one.return_value = self.board  # restore

    def test_general_with_team_password_required_missing_password_does_not_error(self):
        board = _make_board()
        board["requirePassword"] = True
        _mock_col.find_one.return_value = board
        resp = self._put(
            "/updateBoard/TestBoard/gen123/general",
            {"row": 0, "col": 0, "info": {"checked": True, "proof": "",
                                           "currPoints": 0, "teamId": 0}},
        )
        self.assertEqual(resp.status_code, 200)
        _mock_col.find_one.return_value = self.board  # restore

    def test_general_update_rejects_unknown_team(self):
        resp = self._put(
            "/updateBoard/TestBoard/gen123/general",
            {"row": 0, "col": 0, "info": {"checked": True, "proof": "",
                                           "currPoints": 0, "teamId": 99}},
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("Team does not exist", json.loads(resp.data)["message"])

    @patch.object(server.proof_images, "save", return_value="/static/uploads/proofs/test.webp")
    @patch.object(server.proof_images, "cleanup_removed")
    def test_general_upload_saves_proof_image_path(self, _cleanup, _save):
        resp = self._put(
            "/updateBoard/TestBoard/gen123/general",
            {"row": 0, "col": 0, "info": {"checked": True, "proof": "",
                                           "currPoints": 0, "teamId": 0,
                                           "proofImages": [TINY_PNG_DATA_URI]}},
        )
        self.assertEqual(resp.status_code, 200)
        updates = _mock_col.update_one.call_args[0][1]["$set"]
        self.assertEqual(
            updates["team-0.teamData.0.0.proofImages"],
            ["/static/uploads/proofs/test.webp"],
        )

    def test_general_rejects_too_many_proof_images(self):
        resp = self._put(
            "/updateBoard/TestBoard/gen123/general",
            {"row": 0, "col": 0, "info": {"checked": True, "proof": "",
                                           "currPoints": 0, "teamId": 0,
                                           "proofImages": ["/static/uploads/proofs/test.webp"] * (server.maxProofImages + 1)}},
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("limited", json.loads(resp.data)["message"])
        _mock_col.update_one.assert_not_called()

    def test_general_rejects_external_proof_image_urls(self):
        resp = self._put(
            "/updateBoard/TestBoard/gen123/general",
            {"row": 0, "col": 0, "info": {"checked": True, "proof": "",
                                           "currPoints": 0, "teamId": 0,
                                           "proofImages": ["https://example.com/proof.webp"]}},
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("uploaded through this board", json.loads(resp.data)["message"])
        _mock_col.update_one.assert_not_called()

    @patch.object(server.board_images, "save", side_effect=ValueError("Image file is too large"))
    def test_admin_rejects_invalid_board_image_without_storing_data_uri(self, _save):
        resp = self._put(
            "/updateBoard/TestBoard/admin123/admin",
            {"row": 0, "col": 0, "info": {"title": "New Title", "points": 10,
                                           "description": "", "image": {"url": TINY_PNG_DATA_URI},
                                           "rowBingo": 0, "colBingo": 0}},
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("Image file is too large", json.loads(resp.data)["message"])
        _mock_col.update_one.assert_not_called()

    @patch.object(server.board_images, "delete")
    @patch.object(server.board_images, "save", return_value="/static/uploads/board-images/new.webp")
    def test_admin_new_image_is_cleaned_when_tile_cas_loses(self, _save, delete):
        _mock_col.update_one.return_value = MagicMock(matched_count=0)
        response = self._put(
            "/updateBoard/TestBoard/admin123/admin",
            {
                "row": 0,
                "col": 0,
                "info": {"image": {"url": TINY_PNG_DATA_URI}},
                "expectedRevision": 0,
                "expectedSettingsRevision": 0,
            },
        )
        self.assertEqual(response.status_code, 409)
        delete.assert_called_once_with("/static/uploads/board-images/new.webp")

    @patch.object(server.board_images, "delete")
    @patch.object(server.board_images, "save", return_value="/static/uploads/board-images/unknown.webp")
    def test_admin_new_image_is_retained_when_mongo_outcome_is_unknown(self, _save, delete):
        _mock_col.update_one.side_effect = RuntimeError("connection lost")
        response = self._put(
            "/updateBoard/TestBoard/admin123/admin",
            {
                "row": 0,
                "col": 0,
                "info": {"image": {"url": TINY_PNG_DATA_URI}},
                "expectedRevision": 0,
                "expectedSettingsRevision": 0,
            },
        )
        self.assertEqual(response.status_code, 400)
        delete.assert_not_called()
        _mock_col.update_one.side_effect = None
        _mock_col.update_one.return_value = MagicMock(matched_count=1)

    @patch.object(server.board_images, "delete")
    def test_admin_replacement_retains_previous_saved_image(self, delete):
        self.board["boardData"][0][0]["image"] = {
            "url": "/static/uploads/board-images/shared.webp",
        }
        response = self._put(
            "/updateBoard/TestBoard/admin123/admin",
            {
                "row": 0,
                "col": 0,
                "info": {"image": {"url": "https://example.com/replacement.webp"}},
                "expectedRevision": 0,
                "expectedSettingsRevision": 0,
            },
        )
        self.assertEqual(response.status_code, 200)
        delete.assert_not_called()

    @patch.object(server.proof_images, "delete")
    @patch.object(server.proof_images, "save", return_value="/static/uploads/proofs/new.webp")
    def test_general_new_proof_is_cleaned_when_tile_cas_loses(self, _save, delete):
        _mock_col.update_one.return_value = MagicMock(matched_count=0)
        response = self._put(
            "/updateBoard/TestBoard/gen123/general",
            {
                "row": 0,
                "col": 0,
                "info": {"checked": True, "currPoints": 0, "teamId": 0,
                         "proofImages": [TINY_PNG_DATA_URI]},
                "expectedRevision": 0,
                "expectedSettingsRevision": 0,
                "expectedBoardTileRevision": 0,
            },
        )
        self.assertEqual(response.status_code, 409)
        delete.assert_called_once_with("/static/uploads/proofs/new.webp")

    @patch.object(server.proof_images, "delete")
    @patch.object(server.proof_images, "save", return_value="/static/uploads/proofs/unknown.webp")
    def test_general_new_proof_is_retained_when_mongo_outcome_is_unknown(self, _save, delete):
        _mock_col.update_one.side_effect = RuntimeError("connection lost")
        response = self._put(
            "/updateBoard/TestBoard/gen123/general",
            {
                "row": 0,
                "col": 0,
                "info": {"checked": True, "currPoints": 0, "teamId": 0,
                         "proofImages": [TINY_PNG_DATA_URI]},
                "expectedRevision": 0,
                "expectedSettingsRevision": 0,
                "expectedBoardTileRevision": 0,
            },
        )
        self.assertEqual(response.status_code, 400)
        delete.assert_not_called()
        _mock_col.update_one.side_effect = None
        _mock_col.update_one.return_value = MagicMock(matched_count=1)

    def test_general_update_preserves_existing_absolute_proof_url_as_relative_path(self):
        resp = self._put(
            "/updateBoard/TestBoard/gen123/general",
            {"row": 0, "col": 0, "info": {"checked": True, "proof": "",
                                           "currPoints": 0, "teamId": 0,
                                           "proofImages": ["https://praynr.com/static/uploads/proofs/test.webp"]}},
        )
        self.assertEqual(resp.status_code, 200)
        updates = _mock_col.update_one.call_args[0][1]["$set"]
        self.assertEqual(
            updates["team-0.teamData.0.0.proofImages"],
            ["/static/uploads/proofs/test.webp"],
        )


class TestStatefulRevisionInterleavings(unittest.TestCase):
    def _run_requests(self, collection, requests):
        with patch.object(server, "mycol", collection), patch.object(server, "publish_board_update"):
            def send(item):
                path, payload = item
                with server.app.test_client() as client:
                    response = client.put(
                        path,
                        data=json.dumps(payload),
                        content_type="application/json",
                    )
                    return response.status_code

            with ThreadPoolExecutor(max_workers=len(requests)) as executor:
                return list(executor.map(send, requests))

    def _run_puts(self, collection, payloads, path):
        return self._run_requests(collection, [(path, payload) for payload in payloads])

    @staticmethod
    def _admin_payload(col, title):
        return {
            "row": 0,
            "col": col,
            "info": {"title": title},
            "expectedRevision": 0,
            "expectedSettingsRevision": 0,
        }

    @staticmethod
    def _progress_payload(col, checked=True):
        return {
            "row": 0,
            "col": col,
            "info": {"checked": checked, "currPoints": 0, "teamId": 0},
            "expectedRevision": 0,
            "expectedSettingsRevision": 0,
            "expectedBoardTileRevision": 0,
        }

    def test_concurrent_admin_tiles_both_survive(self):
        collection = StatefulCollection(_make_board(), synchronize_auth_reads=True)
        statuses = self._run_puts(
            collection,
            [self._admin_payload(0, "left"), self._admin_payload(1, "right")],
            "/updateBoard/TestBoard/admin123/admin",
        )
        self.assertEqual(sorted(statuses), [200, 200])
        self.assertEqual(collection.board["boardData"][0][0]["title"], "left")
        self.assertEqual(collection.board["boardData"][0][1]["title"], "right")
        self.assertEqual(collection.board["boardData"][0][0]["revision"], 1)
        self.assertEqual(collection.board["boardData"][0][1]["revision"], 1)
        self.assertEqual(collection.board["boardMutationRevision"], 2)

    def test_concurrent_same_team_progress_tiles_both_survive(self):
        collection = StatefulCollection(_make_board(), synchronize_auth_reads=True)
        statuses = self._run_puts(
            collection,
            [self._progress_payload(0), self._progress_payload(1)],
            "/updateBoard/TestBoard/gen123/general",
        )
        self.assertEqual(sorted(statuses), [200, 200])
        self.assertTrue(collection.board["team-0"]["teamData"][0][0]["checked"])
        self.assertTrue(collection.board["team-0"]["teamData"][0][1]["checked"])
        self.assertEqual(collection.board["team-0"]["teamData"][0][0]["revision"], 1)
        self.assertEqual(collection.board["team-0"]["teamData"][0][1]["revision"], 1)
        self.assertEqual(collection.board["boardMutationRevision"], 2)

    def test_concurrent_same_tile_has_one_winner_and_one_conflict(self):
        collection = StatefulCollection(_make_board(), synchronize_auth_reads=True)
        statuses = self._run_puts(
            collection,
            [self._admin_payload(0, "first"), self._admin_payload(0, "second")],
            "/updateBoard/TestBoard/admin123/admin",
        )
        self.assertEqual(sorted(statuses), [200, 409])
        self.assertIn(collection.board["boardData"][0][0]["title"], {"first", "second"})
        self.assertEqual(collection.board["boardData"][0][0]["revision"], 1)
        self.assertEqual(collection.board["boardMutationRevision"], 1)

    def test_same_snapshot_progress_wins_and_resize_refuses_stale_snapshot(self):
        collection = OrderedStructuralCollection(_make_board(), first="progress")
        resize_payload = {
            "passwordRequired": False,
            "rows": 3,
            "columns": 2,
            "visibleRows": 2,
            "expectedSettingsRevision": 0,
            "teamData": [
                {"team": 0, "data": {"name": "team-0", "password": ""}},
                {"team": 1, "data": {"name": "team-1", "password": ""}},
            ],
        }
        statuses = self._run_requests(collection, [
            ("/updateBoard/TestBoard/gen123/general", self._progress_payload(0)),
            ("/updateTeams/TestBoard/admin123/admin", {"dataToSend": resize_payload}),
        ])
        self.assertEqual(statuses, [200, 409])
        self.assertTrue(collection.board["team-0"]["teamData"][0][0]["checked"])
        self.assertEqual(collection.board["rows"], 2)
        self.assertEqual(collection.board["columns"], 2)
        self.assertEqual(collection.board["boardSettingsRevision"], 0)
        self.assertEqual(collection.board["boardMutationRevision"], 1)

    def test_same_snapshot_resize_wins_and_progress_refuses_stale_snapshot(self):
        collection = OrderedStructuralCollection(_make_board(), first="structural")
        resize_payload = {
            "passwordRequired": False,
            "rows": 3,
            "columns": 2,
            "visibleRows": 2,
            "expectedSettingsRevision": 0,
            "teamData": [
                {"team": 0, "data": {"name": "team-0", "password": ""}},
                {"team": 1, "data": {"name": "team-1", "password": ""}},
            ],
        }
        statuses = self._run_requests(collection, [
            ("/updateBoard/TestBoard/gen123/general", self._progress_payload(0)),
            ("/updateTeams/TestBoard/admin123/admin", {"dataToSend": resize_payload}),
        ])
        self.assertEqual(statuses, [409, 200])
        self.assertFalse(collection.board["team-0"]["teamData"][0][0]["checked"])
        self.assertEqual(collection.board["rows"], 3)
        self.assertEqual(collection.board["columns"], 2)
        self.assertEqual(collection.board["boardSettingsRevision"], 1)
        self.assertEqual(collection.board["boardMutationRevision"], 1)

    def test_progress_then_metadata_and_metadata_then_progress_have_expected_ordering(self):
        progress_first = StatefulCollection(_make_board())
        progress_statuses = self._run_puts(
            progress_first,
            [self._progress_payload(0)],
            "/updateBoard/TestBoard/gen123/general",
        )
        self.assertEqual(progress_statuses, [200])
        with patch.object(server, "mycol", progress_first), patch.object(server, "publish_board_update"):
            with server.app.test_client() as client:
                metadata_response = client.put(
                    "/updateTeams/TestBoard/admin123/admin",
                    data=json.dumps({"dataToSend": {
                        "passwordRequired": False,
                        "rows": 2,
                        "columns": 2,
                        "visibleRows": 2,
                        "expectedSettingsRevision": 0,
                        "teamData": [{"team": 0, "data": {"name": "new", "password": ""}},
                                     {"team": 1, "data": {"name": "team-1", "password": ""}}],
                    }}),
                    content_type="application/json",
                )
        self.assertEqual(metadata_response.status_code, 200)
        self.assertTrue(progress_first.board["team-0"]["teamData"][0][0]["checked"])
        self.assertEqual(progress_first.board["team-0"]["name"], "new")

        metadata_first = StatefulCollection(_make_board())
        with patch.object(server, "mycol", metadata_first), patch.object(server, "publish_board_update"):
            with server.app.test_client() as client:
                metadata_response = client.put(
                    "/updateTeams/TestBoard/admin123/admin",
                    data=json.dumps({"dataToSend": {
                        "passwordRequired": False,
                        "rows": 2,
                        "columns": 2,
                        "visibleRows": 2,
                        "expectedSettingsRevision": 0,
                        "teamData": [{"team": 0, "data": {"name": "new", "password": ""}},
                                     {"team": 1, "data": {"name": "team-1", "password": ""}}],
                    }}),
                    content_type="application/json",
                )
        self.assertEqual(metadata_response.status_code, 200)
        stale_progress = self._run_puts(
            metadata_first,
            [self._progress_payload(0)],
            "/updateBoard/TestBoard/gen123/general",
        )
        self.assertEqual(stale_progress, [409])
        self.assertFalse(metadata_first.board["team-0"]["teamData"][0][0]["checked"])

    def test_progress_then_resize_and_resize_then_progress_have_expected_ordering(self):
        progress_first = StatefulCollection(_make_board())
        self.assertEqual(
            self._run_puts(progress_first, [self._progress_payload(0)], "/updateBoard/TestBoard/gen123/general"),
            [200],
        )
        resize_payload = {"passwordRequired": False, "rows": 3, "columns": 2, "visibleRows": 2,
                          "expectedSettingsRevision": 0,
                          "teamData": [{"team": 0, "data": {"name": "team-0", "password": ""}},
                                       {"team": 1, "data": {"name": "team-1", "password": ""}}]}
        with patch.object(server, "mycol", progress_first), patch.object(server, "publish_board_update"):
            with server.app.test_client() as client:
                resize_response = client.put(
                    "/updateTeams/TestBoard/admin123/admin",
                    data=json.dumps({"dataToSend": resize_payload}),
                    content_type="application/json",
                )
        self.assertEqual(resize_response.status_code, 200)
        self.assertTrue(progress_first.board["team-0"]["teamData"][0][0]["checked"])

        resize_first = StatefulCollection(_make_board())
        with patch.object(server, "mycol", resize_first), patch.object(server, "publish_board_update"):
            with server.app.test_client() as client:
                resize_response = client.put(
                    "/updateTeams/TestBoard/admin123/admin",
                    data=json.dumps({"dataToSend": resize_payload}),
                    content_type="application/json",
                )
        self.assertEqual(resize_response.status_code, 200)
        self.assertEqual(
            self._run_puts(resize_first, [self._progress_payload(0)], "/updateBoard/TestBoard/gen123/general"),
            [409],
        )

    def test_legacy_revisions_are_initialized_by_first_write(self):
        board = _make_board()
        board.pop("boardMutationRevision")
        board.pop("boardSettingsRevision")
        board["boardData"][0][0].pop("revision")
        collection = StatefulCollection(board)
        self.assertEqual(
            self._run_puts(collection, [self._admin_payload(0, "legacy")], "/updateBoard/TestBoard/admin123/admin"),
            [200],
        )
        self.assertEqual(collection.board["boardData"][0][0]["revision"], 1)
        self.assertEqual(collection.board["boardMutationRevision"], 1)


class TestUpdateTeams(unittest.TestCase):
    def setUp(self):
        self.client = _client(server.app)
        self.board = _make_board(teams=1)
        self.board["requirePassword"] = True
        self.board["team-0"]["password"] = "oldsecret"
        _mock_col.find_one.return_value = self.board
        _mock_col.update_one.reset_mock()
        _mock_col.update_one.return_value = MagicMock(matched_count=1)

    def _put(self, payload):
        return self.client.put(
            "/updateTeams/TestBoard/admin123/admin",
            data=json.dumps({"dataToSend": payload}),
            content_type="application/json",
        )

    @patch("server.publish_board_update")
    def test_adding_team_persists_password(self, _publish):
        resp = self.client.put(
            "/updateTeams/TestBoard/admin123/admin",
            data=json.dumps({
                "dataToSend": {
                    "passwordRequired": True,
                    "rows": 2,
                    "columns": 2,
                    "visibleRows": 2,
                    "expectedSettingsRevision": 0,
                    "teamData": [
                        {"team": 0, "data": {"name": "team-0", "password": "oldsecret"}},
                        {"team": 1, "data": {"name": "Boss", "password": "newsecret"}},
                    ],
                },
            }),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200)
        added_team_updates = [
            call_args[0][1]["$set"]["team-1"]
            for call_args in _mock_col.update_one.call_args_list
            if "team-1" in call_args[0][1].get("$set", {})
        ]
        self.assertEqual(added_team_updates[0]["password"], "newsecret")

    @patch("server.publish_board_update")
    def test_legacy_client_uses_authenticated_settings_revision(self, _publish):
        self.board["boardSettingsRevision"] = 4
        response = self._put({
            "passwordRequired": True,
            "rows": 2,
            "columns": 2,
            "visibleRows": 2,
            "teamData": [
                {"team": 0, "data": {"name": "Renamed", "password": "newsecret"}},
            ],
        })
        self.assertEqual(response.status_code, 200)
        query = _mock_col.update_one.call_args[0][0]
        self.assertEqual(query["$and"], [{"boardSettingsRevision": 4}])

    @patch("server.publish_board_update")
    def test_metadata_update_targets_fields_and_can_overlap_progress(self, _publish):
        self.board["boardMutationRevision"] = 11
        response = self._put({
            "passwordRequired": True,
            "rows": 2,
            "columns": 2,
            "visibleRows": 2,
            "expectedSettingsRevision": 0,
            "teamData": [
                {"team": 0, "data": {"name": "Renamed", "password": "newsecret"}},
            ],
        })
        self.assertEqual(response.status_code, 200)
        query, update = _mock_col.update_one.call_args[0]
        self.assertEqual(query["_id"], "board-id")
        self.assertEqual(query["$and"], [
            {"$or": [{"boardSettingsRevision": 0}, {"boardSettingsRevision": {"$exists": False}}]},
        ])
        self.assertEqual(update["$set"]["team-0.name"], "Renamed")
        self.assertEqual(update["$set"]["team-0.password"], "newsecret")
        self.assertNotIn("team-0.teamData", update["$set"])
        self.assertEqual(update["$inc"], {"boardMutationRevision": 1, "boardSettingsRevision": 1})
        self.assertNotIn("boardMutationRevision", json.loads(response.data))

    @patch("server.publish_board_update")
    def test_stale_settings_revision_returns_conflict_without_write(self, _publish):
        self.board["boardSettingsRevision"] = 4
        response = self._put({
            "passwordRequired": True,
            "rows": 2,
            "columns": 2,
            "visibleRows": 2,
            "expectedSettingsRevision": 3,
            "teamData": [
                {"team": 0, "data": {"name": "Renamed", "password": "newsecret"}},
            ],
        })
        self.assertEqual(response.status_code, 409)
        _mock_col.update_one.assert_not_called()

    @patch("server.publish_board_update")
    def test_resize_roster_is_one_update_guarded_by_both_revisions(self, _publish):
        self.board["boardMutationRevision"] = 6
        self.board["boardSettingsRevision"] = 2
        response = self._put({
            "passwordRequired": True,
            "rows": 3,
            "columns": 3,
            "visibleRows": 2,
            "expectedSettingsRevision": 2,
            "teamData": [
                {"team": 0, "data": {"name": "Renamed", "password": "newsecret"}},
                {"team": 1, "data": {"name": "Added", "password": "addedsecret"}},
            ],
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(_mock_col.update_one.call_count, 1)
        query, update = _mock_col.update_one.call_args[0]
        self.assertEqual(query["_id"], "board-id")
        self.assertEqual(query["$and"], [
            {"boardMutationRevision": 6},
            {"boardSettingsRevision": 2},
        ])
        self.assertEqual(update["$inc"], {"boardMutationRevision": 1, "boardSettingsRevision": 1})
        self.assertEqual(update["$set"]["teams"], 2)
        self.assertIn("team-1", update["$set"])

class TestFeedbackEndpoint(unittest.TestCase):
    def setUp(self):
        self.client = _client(server.app)

    @patch("server.postToDiscord", return_value=True)
    def test_feedback_success(self, post_to_discord):
        resp = self.client.post(
            "/feedback",
            data=json.dumps({"message": "Great app!"}),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(json.loads(resp.data)["success"])
        post_to_discord.assert_called_once_with("Great app!", "FEEDBACK_WEBHOOK")

    @patch("server.postToDiscord", return_value=True)
    def test_bingo_feedback_includes_board_name(self, post_to_discord):
        resp = self.client.post(
            "/feedback",
            data=json.dumps({"message": "A tile is stuck.", "boardName": "Clan Bingo"}),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200)
        post_to_discord.assert_called_once_with(
            "Board: Clan Bingo\n\nA tile is stuck.",
            "FEEDBACK_WEBHOOK",
        )

    @patch("server.postToDiscord", return_value=False)
    def test_feedback_discord_failure_returns_400(self, _):
        resp = self.client.post(
            "/feedback",
            data=json.dumps({"message": "will fail"}),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 400)


# ---------------------------------------------------------------------------
# Tests: revision helpers and structural update construction
# ---------------------------------------------------------------------------

class TestBoardRevisionHelpers(unittest.TestCase):
    def test_legacy_revision_zero_matches_missing_field(self):
        query = server.board_revision_query(
            "TestBoard", {"boardMutationRevision": 0}, "board-id"
        )
        self.assertEqual(query["_id"], "board-id")
        self.assertEqual(
            query["$and"],
            [{"$or": [{"boardMutationRevision": 0}, {"boardMutationRevision": {"$exists": False}}]}],
        )

    def test_tile_path_uses_validated_numeric_indices(self):
        self.assertEqual(server.tile_revision_path("boardData", 3, 4), "boardData.3.4.revision")

    def test_resize_grid_preserves_existing_tiles_and_initializes_new_tiles(self):
        cache = _make_board(rows=3, cols=3)
        cache["boardData"][1][1]["title"] = "keep"
        resized = server.resize_grid(cache["boardData"], 4, 2, server.defaultBoardObj)
        self.assertEqual(len(resized), 4)
        self.assertTrue(all(len(column) == 2 for column in resized))
        self.assertEqual(resized[1][1]["title"], "keep")
        self.assertEqual(resized[3][1]["revision"], 0)

    def test_structure_update_is_one_atomic_revision_guarded_document(self):
        cache = _make_board(rows=3, cols=3, teams=1)
        update = server.build_structure_update(
            cache,
            rows=2,
            cols=4,
            team_metadata_list=[{"name": "Renamed", "password": "pw"}],
            require_password=True,
            visible_rows=2,
        )
        self.assertEqual(update["$inc"], {"boardMutationRevision": 1, "boardSettingsRevision": 1})
        self.assertEqual(update["$set"]["teams"], 1)
        self.assertEqual(len(update["$set"]["boardData"]), 4)
        self.assertEqual(len(update["$set"]["team-0"]["teamData"]), 4)
        self.assertEqual(update["$set"]["team-0"]["name"], "Renamed")


class TestUpdateBoardRevisionContract(unittest.TestCase):
    def setUp(self):
        self.client = _client(server.app)
        self.board = _make_board()
        _mock_col.find_one.return_value = self.board
        _mock_col.update_one.reset_mock()
        _mock_col.update_one.return_value = MagicMock(matched_count=1)

    def _put(self, url, payload):
        return self.client.put(
            url,
            data=json.dumps(payload),
            content_type="application/json",
        )

    def test_admin_updates_only_target_tile_and_omits_root_mutation_predicate(self):
        response = self._put(
            "/updateBoard/TestBoard/admin123/admin",
            {
                "row": 0,
                "col": 1,
                "info": {"title": "one"},
                "expectedRevision": 0,
                "expectedSettingsRevision": 0,
            },
        )
        self.assertEqual(response.status_code, 200)
        query, update = _mock_col.update_one.call_args[0]
        self.assertEqual(query["_id"], "board-id")
        self.assertEqual(query["$and"], [
            {"$or": [{"boardData.0.1.revision": 0}, {"boardData.0.1.revision": {"$exists": False}}]},
            {"$or": [{"boardSettingsRevision": 0}, {"boardSettingsRevision": {"$exists": False}}]},
        ])
        self.assertEqual(update["$set"], {"boardData.0.1.title": "one"})
        self.assertEqual(update["$inc"], {"boardData.0.1.revision": 1, "boardMutationRevision": 1})

    def test_independent_same_team_progress_tiles_use_separate_cas_paths(self):
        for col in (0, 1):
            response = self._put(
                "/updateBoard/TestBoard/gen123/general",
                {
                    "row": 0,
                    "col": col,
                    "info": {"checked": True, "currPoints": 0, "teamId": 0},
                    "expectedRevision": 0,
                    "expectedSettingsRevision": 0,
                    "expectedBoardTileRevision": 0,
                },
            )
            self.assertEqual(response.status_code, 200)
            query, update = _mock_col.update_one.call_args[0]
            self.assertEqual(query["$and"], [
                {"$or": [{f"team-0.teamData.0.{col}.revision": 0},
                         {f"team-0.teamData.0.{col}.revision": {"$exists": False}}]},
                {"$or": [{"boardSettingsRevision": 0}, {"boardSettingsRevision": {"$exists": False}}]},
                {"$or": [{f"boardData.0.{col}.revision": 0},
                         {f"boardData.0.{col}.revision": {"$exists": False}}]},
            ])
            self.assertEqual(update["$inc"], {
                f"team-0.teamData.0.{col}.revision": 1,
                "boardMutationRevision": 1,
            })

    def test_stale_same_tile_revision_returns_conflict_without_write(self):
        self.board["boardData"][0][0]["revision"] = 2
        response = self._put(
            "/updateBoard/TestBoard/admin123/admin",
            {
                "row": 0,
                "col": 0,
                "info": {"title": "stale"},
                "expectedRevision": 1,
                "expectedSettingsRevision": 0,
            },
        )
        self.assertEqual(response.status_code, 409)
        _mock_col.update_one.assert_not_called()

    def test_metadata_first_rejects_progress_with_old_settings_revision(self):
        self.board["boardSettingsRevision"] = 1
        response = self._put(
            "/updateBoard/TestBoard/gen123/general",
            {
                "row": 0,
                "col": 0,
                "info": {"checked": True, "currPoints": 0, "teamId": 0},
                "expectedRevision": 0,
                "expectedSettingsRevision": 0,
                "expectedBoardTileRevision": 0,
            },
        )
        self.assertEqual(response.status_code, 409)
        _mock_col.update_one.assert_not_called()

    def test_resize_first_rejects_progress_with_old_settings_revision(self):
        self.board["boardMutationRevision"] = 1
        self.board["boardSettingsRevision"] = 1
        response = self._put(
            "/updateBoard/TestBoard/gen123/general",
            {
                "row": 0,
                "col": 0,
                "info": {"checked": True, "currPoints": 0, "teamId": 0},
                "expectedRevision": 0,
                "expectedSettingsRevision": 0,
                "expectedBoardTileRevision": 0,
            },
        )
        self.assertEqual(response.status_code, 409)
        _mock_col.update_one.assert_not_called()

    def test_invalid_indices_are_rejected_before_mongo(self):
        for row, col in ((-1, 0), (0, -1), (99, 0), (0, 99), (True, 0), (0, 1.5)):
            with self.subTest(row=row, col=col):
                response = self._put(
                    "/updateBoard/TestBoard/admin123/admin",
                    {
                        "row": row,
                        "col": col,
                        "info": {"title": "invalid"},
                        "expectedRevision": 0,
                        "expectedSettingsRevision": 0,
                    },
                )
                self.assertEqual(response.status_code, 400)
        _mock_col.update_one.assert_not_called()


# ---------------------------------------------------------------------------
# Tests: /health endpoint
# ---------------------------------------------------------------------------

class TestHealthEndpoint(unittest.TestCase):
    def setUp(self):
        self.client = _client(server.app)
        server.mycol.count_documents.return_value = 5
        server.mycol.aggregate.return_value = iter([{
            "summary": [{
                "boards": 5,
                "created_last_24h": 1,
                "created_last_7d": 2,
                "created_last_30d": 3,
                "boards_with_progress": 5,
                "total_board_tiles": 125,
                "average_board_tiles": 25,
                "largest_board_tiles": 36,
                "total_teams": 8,
                "total_team_tiles": 200,
                "completed_tiles": 50,
                "proof_notes": 40,
                "proof_images": 12,
                "points_earned": 900,
            }],
            "board_types": [{"_id": "osrs", "boards": 4}, {"_id": "generic", "boards": 1}],
            "popular_layouts": [{"_id": {"rows": 5, "columns": 5}, "boards": 3}],
        }])
        server.mycol.aggregate.side_effect = None
        server.analytics.clear_board_analytics_cache()


    @patch("server._redis")
    @patch("server.Worker")
    @patch("rq.Queue")
    @patch("rq.registry.FailedJobRegistry")
    @patch("rq.registry.StartedJobRegistry")
    def test_health_success(self, mock_started_registry, mock_failed_registry, mock_queue, mock_worker, mock_redis):
        # Set up mocks for success
        mock_redis.ping.return_value = True
        mock_worker.all.return_value = [MagicMock()] # at least one worker
        mock_failed_registry.return_value.count = 0
        mock_started_registry.return_value.count = 0
        mock_queue.return_value.__len__.return_value = 0
        
        # We also want to mock myclient.admin.command
        with patch.object(server.myclient, "admin", create=True) as mock_admin:
            mock_admin.command.return_value = {"ok": 1.0}
            
            resp = self.client.get("/health")
            self.assertEqual(resp.status_code, 200)
            data = json.loads(resp.data)
            self.assertEqual(data["status"], "ok")
            self.assertEqual(data["mongo"]["status"], "ok")
            self.assertEqual(data["redis"]["status"], "ok")
            self.assertEqual(data["rq"]["status"], "ok")
            self.assertEqual(data["mongo"]["analytics"]["board_types"], {"osrs": 4, "generic": 1})
            self.assertEqual(data["mongo"]["analytics"]["activity"]["boards_with_progress"], 5)
            self.assertEqual(data["mongo"]["analytics"]["progress"]["completion_percentage"], 25)
            self.assertEqual(data["mongo"]["analytics"]["popular_layouts"][0]["boards"], 3)

    @patch("server._redis")
    @patch("server.Worker")
    @patch("rq.Queue")
    @patch("rq.registry.FailedJobRegistry")
    @patch("rq.registry.StartedJobRegistry")
    def test_health_analytics_failure_does_not_degrade_service(
        self, mock_started_registry, mock_failed_registry, mock_queue, mock_worker, mock_redis
    ):
        server.mycol.aggregate.side_effect = Exception("aggregate timed out")
        mock_redis.ping.return_value = True
        mock_worker.all.return_value = [MagicMock()]
        mock_failed_registry.return_value.count = 0
        mock_started_registry.return_value.count = 0
        mock_queue.return_value.__len__.return_value = 0

        with patch.object(server.myclient, "admin", create=True) as mock_admin:
            mock_admin.command.return_value = {"ok": 1.0}

            resp = self.client.get("/health")

        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertEqual(data["mongo"]["status"], "ok")
        self.assertEqual(data["mongo"]["analytics"], {"status": "unavailable"})

    @patch("server._redis")
    @patch("server.Worker")
    @patch("rq.Queue")
    @patch("rq.registry.FailedJobRegistry")
    @patch("rq.registry.StartedJobRegistry")
    def test_health_redis_failure(self, mock_started_registry, mock_failed_registry, mock_queue, mock_worker, mock_redis):
        mock_redis.ping.side_effect = Exception("Redis connection refused")
        mock_worker.all.return_value = [MagicMock()]
        mock_failed_registry.return_value.count = 0
        mock_started_registry.return_value.count = 0
        mock_queue.return_value.__len__.return_value = 0
        
        with patch.object(server.myclient, "admin", create=True) as mock_admin:
            mock_admin.command.return_value = {"ok": 1.0}
            
            resp = self.client.get("/health")
            self.assertEqual(resp.status_code, 503)
            data = json.loads(resp.data)
            self.assertEqual(data["status"], "degraded")
            self.assertEqual(data["redis"]["status"], "error")
            self.assertIn("Redis connection refused", data["redis"]["error"])




# ---------------------------------------------------------------------------

if __name__ == "__main__":
    unittest.main()
