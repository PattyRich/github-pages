"""Private Glass KC accounts and revisioned journals on the existing Mongo volume."""

import datetime as dt
import hashlib
import re
import secrets

from bson import BSON
from flask import Blueprint, g, jsonify, request
from pymongo.errors import DuplicateKeyError, PyMongoError
from werkzeug.security import check_password_hash, generate_password_hash

MAX_KC = 1_000_000_000
MAX_DOCUMENT = 5 * 1024 * 1024
SESSION_DAYS = 30
SUPPORTED_BOSSES = frozenset({'pnm', 'cox', 'toa', 'tob', 'cg', 'yama', 'nex'})
LEGACY_BOSS = 'pnm'
RAID_MODES = {'cox': ('normal', 'challenge', 'unspecified'),
              'tob': ('normal', 'hard', 'unspecified')}


def integer(value, maximum=MAX_KC):
    return type(value) is int and 0 <= value <= maximum


def validate_journal(data, boss=None):
    """Whitelist every persisted field; never trust a browser backup."""
    if not isinstance(data, dict) or data.get('version') != 2:
        raise ValueError('Unsupported journal version.')
    saved_boss = data.get('boss', LEGACY_BOSS)
    if not isinstance(saved_boss, str) or saved_boss not in SUPPORTED_BOSSES:
        raise ValueError('That boss is not available yet.')
    if boss is not None and saved_boss != boss:
        raise ValueError('This journal belongs to a different boss.')
    name = data.get('name')
    if not isinstance(name, str) or not name.strip() or len(name) > 40:
        raise ValueError('Choose a hunt name of 1–40 characters.')
    if not integer(data.get('base')):
        raise ValueError('Invalid starting KC.')
    sessions = data.get('sessions')
    if not isinstance(sessions, list) or len(sessions) > 10000:
        raise ValueError('Invalid session collection.')
    modes = RAID_MODES.get(saved_boss, ())
    mode_fields = {}
    if 'recordMode' in data:
        if data['recordMode'] not in modes[:2]:
            raise ValueError('Invalid recording mode.')
        mode_fields['recordMode'] = data['recordMode']
    if 'modeBase' in data:
        values = data['modeBase']
        if (not modes or not isinstance(values, dict) or set(values) != set(modes)
                or not all(integer(value) for value in values.values())
                or sum(values.values()) != data['base']):
            raise ValueError('Starting mode KCs must add up to the starting KC.')
        mode_fields['modeBase'] = {mode: values[mode] for mode in modes}
    ids = set()

    def session(value, complete):
        if not isinstance(value, dict) or not integer(value.get('kills'), 100000):
            raise ValueError('Invalid session KC.')
        identifier = value.get('id')
        if not isinstance(identifier, str) or not 1 <= len(identifier) <= 128 or identifier in ids:
            raise ValueError('Invalid or duplicate session ID.')
        ids.add(identifier)
        result = {'id': identifier, 'kills': value['kills']}
        if 'modeRuns' in value:
            runs = value['modeRuns']
            if (not modes or not isinstance(runs, list) or len(runs) > 100000
                    or not all(isinstance(run, dict) and run.get('mode') in modes
                               and integer(run.get('kills'), 100000) and run['kills'] > 0
                               for run in runs)
                    or sum(run['kills'] for run in runs) != value['kills']):
                raise ValueError('Raid mode counts must add up to recorded raids.')
            result['modeRuns'] = [{'mode': run['mode'], 'kills': run['kills']} for run in runs]
        for key, limit in [('notes', 600), ('drops', 240)]:
            text = value.get(key)
            if not isinstance(text, str) or len(text) > limit:
                raise ValueError('Invalid session text.')
            result[key] = text
        for key in ['started', 'ended']:
            if key in value or (complete and key == 'ended'):
                stamp = value.get(key)
                if not isinstance(stamp, str) or len(stamp) > 40:
                    raise ValueError('Invalid session date.')
                try:
                    dt.datetime.fromisoformat(stamp.replace('Z', '+00:00'))
                except ValueError:
                    raise ValueError('Invalid session date.') from None
                result[key] = stamp
        if complete and not result['kills']:
            raise ValueError('Completed sessions must contain a kill.')
        return result

    saved = [session(item, True) for item in sessions]
    active = None if data.get('active') is None else session(data['active'], False)
    kills = sum(item['kills'] for item in saved) + (active['kills'] if active else 0)
    if kills + data['base'] > MAX_KC:
        raise ValueError('This journal exceeds the supported KC range.')
    drops = data.get('dropTiles', {})
    if not isinstance(drops, dict) or len(drops) > 10000:
        raise ValueError('Invalid drop collection.')
    clean_drops = {}
    image_size = 0
    for key, drop in drops.items():
        if not re.fullmatch(r'[1-9][0-9]{0,9}', key) or int(key) > kills or not isinstance(drop, dict):
            raise ValueError('Invalid drop pane.')
        label, image = drop.get('label'), drop.get('image')
        if not isinstance(label, str) or len(label) > 120:
            raise ValueError('Invalid drop label.')
        if not isinstance(image, str) or len(image) > 180000 or (
            image and not re.fullmatch(r'data:image/(?:jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}', image)
        ):
            raise ValueError('Invalid screenshot.')
        image_size += len(image)
        clean_drops[key] = {'label': label, 'image': image}
        if 'savedAt' in drop:
            if not integer(drop['savedAt'], 8_640_000_000_000_000) or drop['savedAt'] == 0:
                raise ValueError('Invalid drop saved date.')
            clean_drops[key]['savedAt'] = drop['savedAt']
    if image_size > 1500000:
        raise ValueError('Screenshot storage is full. Remove an older screenshot.')
    result = dict(version=2, boss=saved_boss, base=data['base'], name=name.strip(),
                  sessions=saved, active=active, dropTiles=clean_drops, **mode_fields)
    if len(BSON.encode(result)) > MAX_DOCUMENT:
        raise ValueError('Journal is too large. Export a backup before removing older memories.')
    return result


def create_glass_kc_api(database, limiter):
    api = Blueprint('glass_kc', __name__)
    users, sessions, journals = (database[name] for name in ('users', 'sessions', 'journals'))
    # _id provides unique usernames, token hashes and one journal per user/boss.
    # Expiry is also checked on every request, independently of Mongo's TTL sweep.
    try:
        sessions.create_index('expiresAt', expireAfterSeconds=0)
    except PyMongoError:
        pass  # A temporarily unavailable DB must not take the other products offline.
    dummy_hash = generate_password_hash(secrets.token_urlsafe(32))

    @api.before_request
    def authenticate():
        if request.method == 'OPTIONS':
            return None
        if request.content_length and request.content_length > 6 * 1024 * 1024:
            return jsonify(message='Journal is too large.'), 413
        if request.endpoint in ('glass_kc.register', 'glass_kc.login'):
            return None
        token = request.headers.get('Authorization', '').removeprefix('Bearer ')
        if not re.fullmatch(r'[A-Za-z0-9_-]{43}', token):
            return jsonify(message='Log in to open your saved hunts.'), 401
        digest = hashlib.sha256(token.encode()).hexdigest()
        found = sessions.find_one({'_id': digest, 'expiresAt': {'$gt': dt.datetime.now(dt.timezone.utc)}})
        if not found:
            return jsonify(message='Your session expired. Log in again.'), 401
        g.glass_user = found['user']
        g.glass_token = digest

    @api.after_request
    def private_response(response):
        response.headers['Cache-Control'] = 'no-store'
        return response

    @api.errorhandler(PyMongoError)
    def database_unavailable(_error):
        return jsonify(message='Cloud storage is unavailable. Please try again.'), 503

    def credentials():
        body = request.get_json(silent=True)
        if not isinstance(body, dict):
            raise ValueError('Enter a username and password.')
        username, password = body.get('username'), body.get('password')
        if not isinstance(username, str) or not re.fullmatch(r'[A-Za-z0-9_]{3,24}', username):
            raise ValueError('Use 3–24 letters, numbers or underscores for your username.')
        if not isinstance(password, str) or not 12 <= len(password) <= 128:
            raise ValueError('Use a password of 12–128 characters.')
        return username.lower(), password

    def issue_session(username):
        token = secrets.token_urlsafe(32)
        sessions.insert_one({'_id': hashlib.sha256(token.encode()).hexdigest(), 'user': username,
                             'expiresAt': dt.datetime.now(dt.timezone.utc) + dt.timedelta(days=SESSION_DAYS)})
        return jsonify(username=username, token=token)

    @api.post('/register')
    @limiter.limit('5 per hour')
    def register():
        try:
            username, password = credentials()
        except ValueError as error:
            return jsonify(message=str(error)), 400
        try:
            users.insert_one({'_id': username, 'passwordHash': generate_password_hash(password),
                              'createdAt': dt.datetime.now(dt.timezone.utc)})
        except DuplicateKeyError:
            return jsonify(message='That username is already taken.'), 409
        return issue_session(username), 201

    @api.post('/login')
    @limiter.limit('10 per minute; 60 per hour')
    def login():
        try:
            username, password = credentials()
        except ValueError as error:
            return jsonify(message=str(error)), 400
        user = users.find_one({'_id': username})
        valid = check_password_hash(user['passwordHash'] if user else dummy_hash, password)
        if not user or not valid:
            return jsonify(message='Username or password is incorrect.'), 401
        return issue_session(username)

    @api.get('/me')
    def me():
        return jsonify(username=g.glass_user)

    @api.post('/logout')
    def logout():
        sessions.delete_one({'_id': g.glass_token})
        return '', 204

    @api.route('/journals/<boss>', methods=['GET', 'PUT', 'DELETE'])
    @limiter.limit('120 per minute')
    def journal(boss):
        if boss not in SUPPORTED_BOSSES:
            return jsonify(message='That boss is not available yet.'), 404
        key = f'{g.glass_user}:{boss}'
        if request.method == 'GET':
            document = journals.find_one({'_id': key})
            result = dict(journal=document['journal'] if document else None,
                          revision=document['revision'] if document else 0)
            if document and document.get('resetRevision'):
                result['resetRevision'] = document['resetRevision']
            return jsonify(result)
        body = request.get_json(silent=True)
        if not isinstance(body, dict) or not integer(body.get('revision')):
            return jsonify(message='A journal revision is required.'), 400
        resetting = request.method == 'DELETE'
        if resetting:
            if body.get('confirmation') != 'RESET':
                return jsonify(message='Type RESET to confirm deleting this hunt.'), 400
            data = None
        else:
            try:
                data = validate_journal(body.get('journal'), boss)
            except ValueError as error:
                return jsonify(message=str(error)), 400
        revision = body['revision']
        document = {'journal': data, 'revision': revision + 1,
                    'updatedAt': dt.datetime.now(dt.timezone.utc)}
        if resetting:
            # Retain only the revision marker: old tabs must not recreate deleted progress.
            document['resetRevision'] = revision + 1
        if revision == 0:
            try:
                journals.insert_one({'_id': key, **document})
            except DuplicateKeyError:
                return jsonify(message='This hunt changed on another device. Load the cloud save before editing.'), 409
        else:
            result = journals.update_one({'_id': key, 'revision': revision}, {'$set': document})
            if not result.matched_count:
                return jsonify(message='This hunt changed on another device. Load the cloud save before editing.'), 409
        return jsonify(revision=revision + 1)

    return api
