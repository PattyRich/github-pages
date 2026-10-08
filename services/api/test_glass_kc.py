"""Focused security and persistence checks, without Mongo or Redis services."""
import copy
import datetime as dt
import hashlib
from unittest.mock import MagicMock

import pytest
from flask import Flask
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from pymongo.errors import DuplicateKeyError, ServerSelectionTimeoutError
from werkzeug.security import check_password_hash, generate_password_hash

from glass_kc import create_glass_kc_api, validate_journal


def journal():
    return {'version': 2, 'boss': 'pnm', 'name': 'My PNM hunt', 'base': 1394,
            'sessions': [], 'active': {'id': 'one', 'kills': 1, 'notes': '', 'drops': ''},
            'dropTiles': {'1': {'label': 'Orb', 'image': 'data:image/jpeg;base64,YWJj'}}}


@pytest.fixture
def api():
    app = Flask(__name__)
    app.config.update(TESTING=True, RATELIMIT_ENABLED=False)
    limiter = Limiter(key_func=get_remote_address, app=app, storage_uri='memory://')
    collections = {key: MagicMock() for key in ['users', 'sessions', 'journals']}
    app.register_blueprint(create_glass_kc_api(collections, limiter), url_prefix='/glass-kc/api')
    collections['sessions'].find_one.return_value = {'user': 'alice'}
    yield app.test_client(), collections


HEADERS = {'Authorization': 'Bearer ' + 'a' * 43}


def test_register_hashes_password_and_token(api):
    client, db = api
    response = client.post('/glass-kc/api/register', json={'username': 'Alice', 'password': 'long secret password'})
    assert response.status_code == 201
    user = db['users'].insert_one.call_args.args[0]
    assert user['_id'] == 'alice'
    assert check_password_hash(user['passwordHash'], 'long secret password')
    assert 'password' not in user
    session = db['sessions'].insert_one.call_args.args[0]
    assert session['_id'] == hashlib.sha256(response.json['token'].encode()).hexdigest()
    assert session['expiresAt'] > dt.datetime.now(dt.timezone.utc)
    assert response.headers['Cache-Control'] == 'no-store'


def test_duplicate_username_and_bad_credentials(api):
    client, db = api
    db['users'].insert_one.side_effect = DuplicateKeyError('duplicate')
    assert client.post('/glass-kc/api/register', json={'username': 'alice', 'password': 'long secret password'}).status_code == 409
    assert client.post('/glass-kc/api/register', json={'username': {'$ne': ''}, 'password': 'long secret password'}).status_code == 400
    assert client.post('/glass-kc/api/register', json={'username': 'alice', 'password': 'short'}).status_code == 400


def test_login_and_logout(api):
    client, db = api
    db['users'].find_one.return_value = {'_id': 'alice', 'passwordHash': generate_password_hash('long secret password')}
    assert client.post('/glass-kc/api/login', json={'username': 'Alice', 'password': 'long secret password'}).status_code == 200
    assert client.post('/glass-kc/api/login', json={'username': 'Alice', 'password': 'wrong long password'}).status_code == 401
    assert client.post('/glass-kc/api/logout', headers=HEADERS).status_code == 204
    db['sessions'].delete_one.assert_called_once_with({'_id': hashlib.sha256(('a' * 43).encode()).hexdigest()})


def test_authentication_and_expiry_required(api):
    client, db = api
    assert client.get('/glass-kc/api/journals/pnm').status_code == 401
    db['sessions'].find_one.return_value = None
    assert client.get('/glass-kc/api/journals/pnm', headers=HEADERS).status_code == 401
    assert '$gt' in db['sessions'].find_one.call_args.args[0]['expiresAt']
    db['journals'].find_one.assert_not_called()


def test_reads_only_authenticated_users_hunt(api):
    client, db = api
    db['journals'].find_one.return_value = {'journal': journal(), 'revision': 3}
    response = client.get('/glass-kc/api/journals/pnm?user=bob', headers=HEADERS)
    assert response.json == {'journal': journal(), 'revision': 3}
    db['journals'].find_one.assert_called_once_with({'_id': 'alice:pnm'})
    assert client.get('/glass-kc/api/journals/bandos', headers=HEADERS).status_code == 404


def test_create_and_revision_conflicts(api):
    client, db = api
    payload = {'journal': journal(), 'revision': 0, 'user': 'bob'}
    response = client.put('/glass-kc/api/journals/pnm', json=payload, headers=HEADERS)
    assert response.json == {'revision': 1}
    assert db['journals'].insert_one.call_args.args[0]['_id'] == 'alice:pnm'
    db['journals'].insert_one.side_effect = DuplicateKeyError('existing hunt')
    assert client.put('/glass-kc/api/journals/pnm', json=payload, headers=HEADERS).status_code == 409
    payload['revision'] = 2
    db['journals'].update_one.return_value.matched_count = 0
    assert client.put('/glass-kc/api/journals/pnm', json=payload, headers=HEADERS).status_code == 409
    assert db['journals'].update_one.call_args.args[0] == {'_id': 'alice:pnm', 'revision': 2}
    db['journals'].update_one.return_value.matched_count = 1
    assert client.put('/glass-kc/api/journals/pnm', json=payload, headers=HEADERS).json == {'revision': 3}


@pytest.mark.parametrize('field,value', [('base', True), ('base', -1), ('boss', 'bandos'), ('sessions', {}), ('name', '$' * 41)])
def test_invalid_journal_is_rejected(field, value):
    data = journal()
    data[field] = value
    with pytest.raises(ValueError):
        validate_journal(data)


def test_screenshots_and_unknown_fields():
    data = journal()
    data['owner'] = 'bob'
    assert 'owner' not in validate_journal(data)
    data['dropTiles']['2'] = copy.deepcopy(data['dropTiles']['1'])
    with pytest.raises(ValueError):
        validate_journal(data)
    del data['dropTiles']['2']
    data['dropTiles']['1']['image'] = 'data:image/svg+xml,<svg onload="alert(1)"/>'
    with pytest.raises(ValueError):
        validate_journal(data)


def test_webp_screenshots_and_legacy_jpeg_backups_are_accepted():
    for media_type in ['webp', 'jpeg']:
        data = journal()
        data['dropTiles']['1']['image'] = f'data:image/{media_type};base64,YWJj'
        assert validate_journal(data)['dropTiles']['1']['image'] == data['dropTiles']['1']['image']


def test_drop_saved_date_survives_account_save_and_reload(api):
    client, db = api
    data = journal()
    data['dropTiles']['1']['savedAt'] = 1_780_000_000_123
    assert client.put('/glass-kc/api/journals/pnm', json={'revision': 0, 'journal': data}, headers=HEADERS).status_code == 200
    stored = db['journals'].insert_one.call_args.args[0]
    assert stored['journal']['dropTiles']['1']['savedAt'] == 1_780_000_000_123
    db['journals'].find_one.return_value = stored
    assert client.get('/glass-kc/api/journals/pnm', headers=HEADERS).json['journal'] == data
    assert 'savedAt' not in validate_journal(journal())['dropTiles']['1']


@pytest.mark.parametrize('value', [True, 0, -1, 1.5, '1780000000123', None, 8_640_000_000_000_001])
def test_invalid_drop_saved_date_is_rejected(value):
    data = journal()
    data['dropTiles']['1']['savedAt'] = value
    with pytest.raises(ValueError, match='Invalid drop saved date'):
        validate_journal(data)


def test_invalid_write_and_database_outage(api):
    client, db = api
    assert client.put('/glass-kc/api/journals/pnm', json={'revision': False, 'journal': journal()}, headers=HEADERS).status_code == 400
    db['journals'].insert_one.assert_not_called()
    db['journals'].find_one.side_effect = ServerSelectionTimeoutError('unavailable')
    response = client.get('/glass-kc/api/journals/pnm', headers=HEADERS)
    assert response.status_code == 503
    assert 'unavailable' in response.json['message']


def test_reset_requires_auth_confirmation_and_current_revision(api):
    client, db = api
    assert client.delete('/glass-kc/api/journals/pnm', json={'revision': 3, 'confirmation': 'RESET'}).status_code == 401
    assert client.delete('/glass-kc/api/journals/pnm', json={'revision': 3}, headers=HEADERS).status_code == 400
    db['journals'].update_one.assert_not_called()
    db['journals'].update_one.return_value.matched_count = 0
    assert client.delete('/glass-kc/api/journals/pnm', json={'revision': 3, 'confirmation': 'RESET'}, headers=HEADERS).status_code == 409
    db['journals'].update_one.return_value.matched_count = 1
    response = client.delete('/glass-kc/api/journals/pnm', json={'revision': 3, 'confirmation': 'RESET', 'user': 'bob'}, headers=HEADERS)
    assert response.json == {'revision': 4}
    query, update = db['journals'].update_one.call_args.args
    assert query == {'_id': 'alice:pnm', 'revision': 3}
    assert update['$set']['journal'] is None
    assert update['$set']['resetRevision'] == 4
    db['users'].delete_one.assert_not_called()
    db['sessions'].delete_one.assert_not_called()


def test_reset_marker_survives_and_prevents_old_first_writes(api):
    client, db = api
    db['journals'].find_one.return_value = {'journal': None, 'revision': 4, 'resetRevision': 4}
    assert client.get('/glass-kc/api/journals/pnm', headers=HEADERS).json == {'journal': None, 'revision': 4, 'resetRevision': 4}
    db['journals'].insert_one.side_effect = DuplicateKeyError('reset marker exists')
    assert client.put('/glass-kc/api/journals/pnm', json={'revision': 0, 'journal': journal()}, headers=HEADERS).status_code == 409


@pytest.mark.parametrize('boss', ['cox', 'toa', 'tob', 'cg', 'yama', 'nex'])
def test_boss_routes_are_isolated_and_reject_mismatched_backups(api, boss):
    client, db = api
    payload = {'revision': 0, 'journal': journal()}
    assert client.put(f'/glass-kc/api/journals/{boss}', json=payload, headers=HEADERS).status_code == 400
    db['journals'].insert_one.assert_not_called()
    del payload['journal']['boss']
    assert client.put(f'/glass-kc/api/journals/{boss}', json=payload, headers=HEADERS).status_code == 400
    payload['journal']['boss'] = boss
    assert client.put(f'/glass-kc/api/journals/{boss}', json=payload, headers=HEADERS).status_code == 200
    assert db['journals'].insert_one.call_args.args[0]['_id'] == f'alice:{boss}'
    db['journals'].find_one.return_value = {'journal': payload['journal'], 'revision': 1}
    assert client.get(f'/glass-kc/api/journals/{boss}', headers=HEADERS).json['journal']['boss'] == boss
    db['journals'].find_one.assert_called_with({'_id': f'alice:{boss}'})
    assert client.delete(f'/glass-kc/api/journals/{boss}', json={'revision': 1, 'confirmation': 'RESET'}, headers=HEADERS).status_code == 200
    assert db['journals'].update_one.call_args.args[0] == {'_id': f'alice:{boss}', 'revision': 1}
