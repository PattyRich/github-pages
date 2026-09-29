# Glass KC Tracker

Open **Glass KC Tracker** from the home page, or `/#/glass-kc` (GitHub Pages: `/github-pages/#/glass-kc`). The boss picker is always the entry screen, including for returning users. Choose **Phosani’s Nightmare (PNM)** or **Chambers of Xeric (CoX)** to reveal the tracker and enter a starting KC. The selected boss names the journal and postcards automatically. The picker shows a stained-glass preview; there is no generated portrait. **Choose another boss** returns to the picker without erasing progress. Each recorded kill (completed raid for Chambers) lights one pane; every 25 lights a milestone and every 100 completes a window. Both bosses have six scenes, sanctuary, drop memories, and postcards. PNM uses Inquisitor’s armour in the picker; Chambers uses the Great Olm.

## Accounts and returning to a hunt

Create an account with a username (3–24 letters, numbers or underscores) and a password (12–128 characters). Usernames are case-insensitive. Log in on another device or site origin to open the same hunt. One journal is stored per account and boss.

Passwords are hashed with Werkzeug’s scrypt default. Random bearer sessions expire after 30 days; Mongo stores only their SHA-256 hashes. Logging out revokes the current session. The browser remembers its token in localStorage, scoped to the configured API. No email is collected and password recovery is not implemented; use a password manager.

The account bar distinguishes saved, pending, offline, and conflicting changes. A complete local copy is kept under an account-specific key, including after Mongo confirms a save and after logout. Its revision and pending flag distinguish unsynced changes from a saved backup; older draft-only saves are still recovered. Reopening while the API is unavailable loads this copy and allows local tracking. Pending changes retry when connectivity returns or **Retry sync** is clicked. A newer cloud save refreshes a previously synced local copy without pushing that older copy back to Mongo. The server checks a revision on every write, so another device’s newer save cannot be silently overwritten. If a conflict occurs, export the local changes, then **Load cloud save**. Restore the exported backup only if you intend to replace the cloud hunt. Closing with pending changes triggers the browser’s unsaved-change prompt.

## Existing journals and backups

Guest PNM saves still use `praynr-glass-kc-journal-v2`; Chambers uses `praynr-glass-kc-cox-journal-v2`. It is separate from signed-in hunts. After logging in, **Import browser journal** explicitly imports that local journal into the selected boss’s hunt, replacing an existing account hunt only after confirmation. The original guest copy remains intact. Guest journals on `praynr.com`, GitHub Pages, and localhost are separate; use **Export backup** and **Restore backup** to transfer between those origins.

Export includes KC, sessions, drop labels and screenshots. Restore replaces the currently open hunt; when signed in, that replacement syncs to Mongo. Version-1 personal watcher backups remain supported and correct the old 1,280 baseline to 1,394. Version-2 backups preserve the chosen baseline. The legacy `name` field is retained for API/backup compatibility, but custom hunt names are no longer entered or displayed. A backup explicitly naming an unsupported boss is rejected.

Selected PNG/JPG/WebP screenshots are resized in the browser to a maximum 1,280-pixel edge and encoded as JPEG. Each is capped at 180,000 encoded characters, with 1,500,000 total per journal (about eight maximum-sized images). Account journals store these bounded images inside Mongo so backups include everything. Journals are limited to 5 MiB of BSON. Browser quotas may be reached earlier while storing the local copy. A failed guest write leaves both the last saved journal and displayed progress unchanged, and prompts the user to log in or export a backup. Signed-in users can still sync to Mongo when local writes fail; the status explicitly warns that the local copy is older. If both stores fail, keep the tab open and export a backup. A full browser store also does not prevent login, although that login may only last until the page closes. Clearing browser data still removes local copies. Original image files are untouched, and screenshots do not automatically add kills.

## Backend and persistent storage

`services/api/glass_kc.py` registers a separate Flask blueprint at `/glass-kc/api`:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/register` | Create an account and session |
| POST | `/login` | Verify credentials and create a session |
| GET | `/me` | Verify the session and return its username |
| POST | `/logout` | Revoke the current session |
| GET | `/journals/<boss>` | Read the authenticated user’s journal and revision |
| PUT | `/journals/<boss>` | Save `{journal, revision}` with an atomic revision check |
| DELETE | `/journals/<boss>` | Hard reset with `{revision, confirmation: "RESET"}` |

Supported boss IDs are `pnm` and `cox`.

All routes except registration/login require `Authorization: Bearer <token>`. Mongo ownership comes from the verified session, never a client-provided username. Registration/login are rate limited. Reads and writes are bounded, validated, and return `Cache-Control: no-store`. Concurrent first writes and stale revisions return HTTP 409. A missing journal returns `{journal: null, revision: 0}`.

Database: `glass_kc`, on the existing `MONGO_URI` connection:

- `users`: normalized username as unique `_id`, password hash, creation time.
- `sessions`: hashed token as unique `_id`, username, expiry with a TTL index. Requests also enforce expiry before Mongo’s periodic cleanup.
- `journals`: `<username>:<boss>` as unique `_id`, validated journal, revision and update time. No TTL on accounts or journals.

**No extra Mongo container or volume is needed.** Both Compose files already mount `mongo_data:/data/db`; this persists every Mongo database, including `glass_kc`. `scripts/backup.ps1` runs an unrestricted `mongodump`, so account data and screenshots are automatically included in `mongo.gz`. The existing Mongo restore procedure restores them too. Do not use `docker compose down -v` on data you want to keep.

Deploy the API and frontend changes and reload Nginx’s configuration. `nginx/praynr.conf` forwards `/glass-kc/api/` to Flask. No new secrets or environment variables are required. The React frame passes the existing `API_BASE_URL` (including `VITE_API_BASE_URL` overrides) and OSRS theme tokens to the journal.

## Implementation and focused checks

The standalone journal remains embedded by `GlassKcTracker.tsx`. Its shared journal UI lives in `apps/frontend/public/glass-kc/index.html`, with boss-specific content and SVG drawing code in `bosses/`. `account.js` handles accounts, persistent local copies, and cloud synchronization. A React rewrite is unnecessary for these additions. Guest tracking remains usable without the API and is independent of Bingo/LoL maintenance mode.

Focused checks cover authentication, ownership, hashing, revocation, data validation, revision conflicts, existing local saves, imports, cloud reloads, and offline draft recovery. Backend checks are included in `make test-backend`; frontend checks are in `GlassKcTracker.test.js`.

## Hard reset

**Hard reset hunt** appears beside backup controls. The modal names the affected hunt and storage, lists the data to erase, warns that there is no undo, offers **Export backup first**, and requires typing `RESET`. Cancel/Escape leaves the hunt intact. Guests reset only the selected boss in this browser. Signed-in users reset the selected account/boss journal locally and in Mongo, retaining the login, separate guest journal, and other hunts.

The cloud reset must succeed before local data is cleared. Offline, expired-session, or revision-conflict failures keep the local copy and report the error. Saves pause during confirmation and reset. Mongo removes the journal payload and retains only a revision/reset marker; stale writes are rejected, and an older cached hunt is discarded when the client next reads that marker. Other devices cannot learn about a reset until they reconnect. Backups exported by the user can still be deliberately restored.

## Adding another boss

Boss content uses a data-only JavaScript catalog rather than a runtime JSON fetch, so the standalone page can load its content synchronously without an API dependency:

1. Add an entry to `public/glass-kc/bosses/catalog.js` with a stable ID, name, unique browser storage key, chooser copy, tracker copy, scene titles/descriptions, palettes, count/milestone nouns, postcard lines, milestone rewards and sanctuary whispers. The PNM storage key is kept for compatibility. Backups without a boss ID belong to legacy PNM, never whichever boss is selected.
2. Add `bosses/<id>-art.js`, registering a factory in `GLASS_RENDERERS[id]`. The factory receives the boss config and `{esc, getJournal}`, and returns `{art, shrineMarkup, sceneColors}`. Artwork owns no account, storage or DOM state. The shared journal currently uses 100 panes per window and four 25-kill milestones.
3. Load the new renderer script before `account.js` in `index.html`. The chooser is built from catalog entries with registered renderers. The shared `glass-window.js` must load before renderers; it handles the 100-pane reveal, drop targets and frame.
4. Add the same ID to `SUPPORTED_BOSSES` in `services/api/glass_kc.py`. Backend storage is already keyed by authenticated user and boss; writes must match the route's boss. No new endpoint implementation, collection, or Docker volume is needed.

The selection controls both browser keys and API URLs. Opening a different boss does not reuse the previous boss's journal; pending account changes must sync before switching. Copy and artwork changes belong in the catalog/renderer, not in authentication or save code.

## Chambers collection

The six windows are the Great Olm, Twisted bow, Ancestral robes, Tekton’s forge, Vasa Nistirio, and Olmlet. These are original inline SVG interpretations, with no remote image dependency. Subject references: [Great Olm](https://oldschool.runescape.wiki/w/Great_Olm), [Twisted bow](https://oldschool.runescape.wiki/w/Twisted_bow), [Ancestral robes](https://oldschool.runescape.wiki/w/Ancestral_robes), [Tekton](https://oldschool.runescape.wiki/w/Tekton), [Vasa Nistirio](https://oldschool.runescape.wiki/w/Vasa_Nistirio), and [Olmlet](https://oldschool.runescape.wiki/w/Olmlet).

Count completed raids, not individual rooms or Olm phases. Normal and Challenge Mode completions share this journal; separate mode tracking is not implemented. Artwork and copy live in `bosses/cox-art.js` and the catalog. Local/account journals, backups, imports and resets remain scoped to `cox`; legacy backups without a boss ID remain PNM only.

The relic windows use the Wiki’s [Twisted bow detail image](https://oldschool.runescape.wiki/w/File:Twisted_bow_detail.png) and [Ancestral robes equipment image](https://oldschool.runescape.wiki/w/File:Ancestral_robes_equipped_female.png) as visual references: charcoal twisted bow limbs, pale inner struts and an olive-green string; indigo robes, grey-beige mantle and hat, and gold bands/buckles. These identity colors stay fixed across collection editions.

The encounter windows follow the [Tekton model](https://oldschool.runescape.wiki/w/File:Tekton.png) and [Vasa Nistirio model](https://oldschool.runescape.wiki/w/File:Vasa_Nistirio.png): Tekton’s pointed helm, charcoal plates, molten gold seams, heated blade and black hammer; Vasa’s floating skeletal caster, suspended stones and sprawling rock body with violet crystal fractures.
