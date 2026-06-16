"""
Unit tests for server/server.py

Uses unittest.mock to patch MongoDB and external calls (Discord, requests),
so no live database or network connection is needed to run these.

Run with:
    python -m pytest test_server.py -v
or:
    python -m unittest test_server.py -v
"""

import json
import unittest
from unittest.mock import MagicMock, patch


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
        "boardName": board_name,
        "adminPassword": admin_pw,
        "generalPassword": general_pw,
        "boardData": board_data,
        "teams": teams,
        "rows": rows,
        "columns": cols,
        "visibleRows": visible_rows if visible_rows is not None else rows,
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


TINY_PNG_DATA_URI = (
    "data:image/png;base64,"
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg=="
)


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
        _mock_col.update_one.return_value = MagicMock()

    def _put(self, url, payload):
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
        board_data = _mock_col.update_one.call_args[0][1]["$set"]["boardData"]
        self.assertNotIn("evilKey", board_data[0][0])

    def test_general_can_update_tile(self):
        resp = self._put(
            "/updateBoard/TestBoard/gen123/general",
            {"row": 0, "col": 0, "info": {"checked": True, "proof": "img.png",
                                           "currPoints": 5, "teamId": 0}},
        )
        self.assertEqual(resp.status_code, 200)

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
        updated_team = _mock_col.update_one.call_args[0][1]["$set"]["team-0"]
        self.assertEqual(
            updated_team["teamData"][0][0]["proofImages"],
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

    def test_general_update_preserves_existing_absolute_proof_url_as_relative_path(self):
        resp = self._put(
            "/updateBoard/TestBoard/gen123/general",
            {"row": 0, "col": 0, "info": {"checked": True, "proof": "",
                                           "currPoints": 0, "teamId": 0,
                                           "proofImages": ["https://praynr.com/static/uploads/proofs/test.webp"]}},
        )
        self.assertEqual(resp.status_code, 200)
        updated_team = _mock_col.update_one.call_args[0][1]["$set"]["team-0"]
        self.assertEqual(
            updated_team["teamData"][0][0]["proofImages"],
            ["/static/uploads/proofs/test.webp"],
        )


class TestUpdateTeams(unittest.TestCase):
    def setUp(self):
        self.client = _client(server.app)
        self.board = _make_board(teams=1)
        self.board["requirePassword"] = True
        self.board["team-0"]["password"] = "oldsecret"
        _mock_col.find_one.return_value = self.board
        _mock_col.update_one.reset_mock()
        _mock_col.update_one.return_value = MagicMock()

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


class TestFeedbackEndpoint(unittest.TestCase):
    def setUp(self):
        self.client = _client(server.app)

    @patch("server.postToDiscord", return_value=True)
    def test_feedback_success(self, _):
        resp = self.client.post(
            "/feedback",
            data=json.dumps({"message": "Great app!"}),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(json.loads(resp.data)["success"])

    @patch("server.postToDiscord", return_value=False)
    def test_feedback_discord_failure_returns_400(self, _):
        resp = self.client.post(
            "/feedback",
            data=json.dumps({"message": "will fail"}),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 400)


# ---------------------------------------------------------------------------
# Tests: changeBoardSize helper
# ---------------------------------------------------------------------------

class TestChangeBoardSize(unittest.TestCase):
    def setUp(self):
        _mock_col.update_one.return_value = MagicMock()

    def _cache(self, rows=3, cols=3, teams=1):
        return _make_board(rows=rows, cols=cols, teams=teams)

    def test_no_change_returns_false(self):
        cache = self._cache(rows=3, cols=3)
        result = server.changeBoardSize([], 3, 3, cache, "TestBoard")
        self.assertFalse(result)

    def test_shrink_rows_returns_true(self):
        cache = self._cache(rows=3, cols=3)
        result = server.changeBoardSize([], 2, 3, cache, "TestBoard")
        self.assertTrue(result)

    def test_grow_cols_returns_true(self):
        cache = self._cache(rows=3, cols=3)
        result = server.changeBoardSize([], 3, 4, cache, "TestBoard")
        self.assertTrue(result)

    def test_shrink_rows_trims_board_data(self):
        cache = self._cache(rows=3, cols=3)
        server.changeBoardSize([], 2, 3, cache, "TestBoard")
        set_call = _mock_col.update_one.call_args[0][1]["$set"]
        for col in set_call["boardData"]:
            self.assertEqual(len(col), 2)

    def test_grow_rows_expands_board_data(self):
        cache = self._cache(rows=3, cols=3)
        server.changeBoardSize([], 5, 3, cache, "TestBoard")
        set_call = _mock_col.update_one.call_args[0][1]["$set"]
        for col in set_call["boardData"]:
            self.assertEqual(len(col), 5)


# ---------------------------------------------------------------------------
# Tests: /health endpoint
# ---------------------------------------------------------------------------

class TestHealthEndpoint(unittest.TestCase):
    def setUp(self):
        self.client = _client(server.app)
        server.mycol.count_documents.return_value = 5


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
