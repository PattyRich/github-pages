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

import server  # noqa: E402  (must come after patch)

# Point server's module-level `mycol` at our controllable mock
server.mycol = _mock_col


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_board(rows=2, cols=2, teams=2,
                admin_pw="admin123", general_pw="gen123",
                board_name="TestBoard"):
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

    def test_get_board_as_general(self):
        resp = self.client.get("/getBoard/TestBoard/gen123/general")
        self.assertEqual(resp.status_code, 200)

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

if __name__ == "__main__":
    unittest.main()
