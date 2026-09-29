// @vitest-environment node
import { readFileSync } from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';
import { afterEach, describe, expect, it, vi } from 'vitest';

const html = readFileSync(
  new URL('../../../public/glass-kc/index.html', import.meta.url),
  'utf8'
).replace(
  /<script src="([^"]+)"><\/script>/g,
  (_, path) =>
    `<script>${readFileSync(new URL('../../../public/glass-kc/' + path, import.meta.url), 'utf8')}</script>`
);
const key = 'praynr-glass-kc-journal-v2';
const browsers = [];

function open(saved, blocked = false, cloud = {}) {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', (error) => errors.push(error));
  const dom = new JSDOM(html, {
    url: 'https://example.com/github-pages/glass-kc/index.html',
    runScripts: 'dangerously',
    virtualConsole,
    beforeParse(window) {
      if (saved) window.localStorage.setItem(key, saved);
      if (cloud.account)
        window.localStorage.setItem(
          'praynr-glass-kc-account:https://praynr.com',
          JSON.stringify(cloud.account)
        );
      if (cloud.draft)
        window.localStorage.setItem(
          'praynr-glass-kc-account:https://praynr.com:draft:alice:pnm',
          JSON.stringify(cloud.draft)
        );
      if (cloud.fetch) window.fetch = cloud.fetch;
      window.AbortController = AbortController;
      window.confirm = () => true;
      window.HTMLElement.prototype.scrollIntoView = () => {};
      window.HTMLDialogElement.prototype.showModal = function () {
        this.open = true;
      };
      window.HTMLDialogElement.prototype.close = function () {
        this.open = false;
        this.dispatchEvent(new window.Event('close'));
      };
      if (blocked) {
        window.Storage.prototype.setItem = () => {
          throw new Error('QuotaExceededError');
        };
      }
    },
  });
  browsers.push({ dom, errors });
  if (cloud.choose !== false) dom.window.document.getElementById('choose-pnm')?.click();
  return dom.window;
}

function begin(window, base) {
  window.document.getElementById('start-kc').value = String(base);
  window.document
    .getElementById('journal-setup')
    .dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
}

function click(window, id) {
  window.document.getElementById(id).click();
}

afterEach(() => {
  const errors = browsers.flatMap((browser) => browser.errors);
  browsers.splice(0).forEach(({ dom }) => dom.window.close());
  expect(errors).toEqual([]);
});

describe('browser-local glass journal', () => {
  it('requires setup and keeps a custom baseline, screenshot and postcard across reloads', () => {
    const window = open();
    expect(window.document.getElementById('record-kill').disabled).toBe(true);
    begin(window, 1280);
    click(window, 'record-kill');
    click(window, 'mark-drop');
    expect(window.document.getElementById('pane-kc').value).toBe('1281');
    window.document.getElementById('pane-label').value = 'Chestplate';
    window.eval("pendingImage='data:image/jpeg;base64,YWJj';");
    click(window, 'pane-save');
    click(window, 'undo-kill');
    expect(window.document.getElementById('total-kc').textContent).toBe('1,281');
    click(window, 'record-kill');
    expect(window.document.getElementById('kills-since-drop').textContent).toBe('1');
    click(window, 'finish-session');
    const saved = window.localStorage.getItem(key);
    const restored = open(saved);
    expect(restored.document.getElementById('total-kc').textContent).toBe('1,282');
    expect(restored.document.getElementById('postcard-items').textContent).toContain(
      'Phosani’s Nightmare'
    );
    expect(restored.eval('postcardSVG(0)')).toContain('PHOSANI’S NIGHTMARE');
    expect(JSON.parse(saved).dropTiles['1'].image).toBe('data:image/jpeg;base64,YWJj');
    expect(restored.document.getElementById('journal-setup').hidden).toBe(true);
  });

  it('starts at zero and completes windows based on newly recorded kills', () => {
    const window = open();
    begin(window, 0);
    // A restored session at 99 kills exercises the boundary without 99 full SVG renders.
    const data = JSON.parse(window.localStorage.getItem(key));
    data.active = { id: 'session', kills: 99, notes: '', drops: '' };
    const restored = open(JSON.stringify(data));
    click(restored, 'record-kill');
    expect(restored.document.getElementById('window-fill').textContent).toBe('100 / 100');
    expect(restored.document.getElementById('window-count').textContent).toBe('1');
    click(restored, 'record-kill');
    expect(restored.document.getElementById('window-fill').textContent).toBe('1 / 100');
    click(restored, 'undo-kill');
    expect(restored.document.getElementById('window-fill').textContent).toBe('100 / 100');
  });

  it('imports legacy backups with the personal baseline correction and preserves memories', async () => {
    const window = open();
    const data = {
      version: 1,
      base: 1280,
      sessions: [],
      active: { id: 'original', kills: 2, notes: 'Keep me', drops: '' },
      dropTiles: { 1: { label: 'Orb', image: 'data:image/jpeg;base64,YWJj' } },
    };
    const file = window.document.getElementById('import-file');
    Object.defineProperty(file, 'files', {
      value: [{ size: 500, text: async () => JSON.stringify(data) }],
    });
    file.dispatchEvent(new window.Event('change'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    const saved = JSON.parse(window.localStorage.getItem(key));
    expect(saved.base).toBe(1394);
    expect(saved.version).toBe(2);
    expect(saved.active).toEqual(data.active);
    expect(saved.dropTiles).toEqual(data.dropTiles);
    expect(window.document.getElementById('total-kc').textContent).toBe('1,396');
  });

  it('rejects invalid starting KC and does not start when storage is unavailable', () => {
    const window = open();
    for (const base of ['', -1, 2.5, 1000000001]) {
      begin(window, base);
      expect(window.localStorage.getItem(key)).toBeNull();
    }
    const blocked = open(undefined, true);
    begin(blocked, 50);
    expect(blocked.document.getElementById('record-kill').disabled).toBe(true);
    expect(blocked.document.getElementById('setup-error').hidden).toBe(false);
  });

  it('preserves corrupt saves and rejects malformed backups', () => {
    const window = open('{broken');
    begin(window, 0);
    expect(window.localStorage.getItem(key)).toBe('{broken');
    expect(window.document.getElementById('record-kill').disabled).toBe(true);
    expect(() =>
      window.eval('validate({version:2,base:-1,name:"Bad",sessions:[],active:null})')
    ).toThrow();
  });

  it('preserves a saved screenshot when a replacement exceeds storage quota', () => {
    const window = open();
    begin(window, 20);
    click(window, 'record-kill');
    window.eval("savePaneMemory(1,{label:'Original',image:'data:image/jpeg;base64,YWJj'})");
    const saved = window.localStorage.getItem(key);
    window.Storage.prototype.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    expect(() => window.eval("savePaneMemory(1,{label:'Replacement',image:''})")).toThrow();
    expect(window.localStorage.getItem(key)).toBe(saved);
    expect(window.eval('journal.dropTiles[1].label')).toBe('Original');
  });
});

const signedIn = { username: 'alice', token: 'a'.repeat(43) };
const sample = () => ({
  version: 2,
  boss: 'pnm',
  base: 100,
  name: 'Nightmare',
  sessions: [],
  active: null,
  dropTiles: {},
});
const response = (data, status = 200) => ({ ok: status < 400, status, json: async () => data });
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('account-backed glass journal', () => {
  it('creates an account, opens an empty hunt, and logs out back to the guest journal', async () => {
    const fetch = vi.fn(async (url) => {
      if (url.endsWith('/register')) return response(signedIn, 201);
      if (url.endsWith('/me')) return response({ username: 'alice' });
      if (url.endsWith('/logout')) return response({}, 204);
      return response({ journal: null, revision: 0 });
    });
    const window = open(JSON.stringify({ ...sample(), base: 77 }), false, { fetch });
    window.document.getElementById('account-username').value = 'alice';
    window.document.getElementById('account-password').value = 'long secret password';
    window.document.getElementById('auth-form').dispatchEvent(
      new window.SubmitEvent('submit', {
        bubbles: true,
        cancelable: true,
        submitter: window.document.querySelector('button[value="register"]'),
      })
    );
    await settle();
    expect(window.document.getElementById('account-name').textContent).toBe('Signed in as alice');
    expect(window.document.getElementById('journal-setup').hidden).toBe(false);
    expect(window.document.getElementById('account-password').value).toBe('');
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      username: 'alice',
      password: 'long secret password',
    });
    click(window, 'logout');
    await settle();
    expect(window.document.getElementById('total-kc').textContent).toBe('77');
    expect(window.localStorage.getItem('praynr-glass-kc-account:https://praynr.com')).toBeNull();
    expect(window.document.getElementById('auth-form').hidden).toBe(false);
  });

  it('loads a returning account, saves with a revision, and preserves the guest journal', async () => {
    const guest = JSON.stringify({ ...sample(), base: 50 });
    const fetch = vi.fn(async (url, options) => {
      if (url.endsWith('/me')) return response({ username: 'alice' });
      if (options.method === 'PUT') return response({ revision: 8 });
      return response({ journal: sample(), revision: 7 });
    });
    const window = open(guest, false, { account: signedIn, fetch });
    await settle();
    expect(window.document.getElementById('total-kc').textContent).toBe('100');
    click(window, 'record-kill');
    await window.eval('flushCloud()');
    const put = fetch.mock.calls.find(([, options]) => options.method === 'PUT');
    expect(JSON.parse(put[1].body)).toMatchObject({
      revision: 7,
      journal: { active: { kills: 1 } },
    });
    expect(put[1].headers.Authorization).toBe(`Bearer ${signedIn.token}`);
    expect(window.localStorage.getItem(key)).toBe(guest);
    expect(
      JSON.parse(
        window.localStorage.getItem('praynr-glass-kc-account:https://praynr.com:draft:alice:pnm')
      )
    ).toMatchObject({ revision: 8, pending: false, journal: { active: { kills: 1 } } });
    expect(window.document.getElementById('cloud-status').textContent).toBe(
      'Saved on this device and to your account'
    );
  });

  it('keeps unsynced changes when offline and retries without claiming cloud success', async () => {
    let offline = true;
    const fetch = vi.fn(async (url, options) => {
      if (url.endsWith('/me')) return response({ username: 'alice' });
      if (options.method === 'PUT') {
        if (offline) throw new Error('Offline');
        return response({ revision: 2 });
      }
      return response({ journal: sample(), revision: 1 });
    });
    const window = open(null, false, { account: signedIn, fetch });
    await settle();
    click(window, 'record-kill');
    await window.eval('flushCloud()');
    expect(window.document.getElementById('cloud-status').textContent).toContain('Not synced');
    const draft = JSON.parse(
      window.localStorage.getItem('praynr-glass-kc-account:https://praynr.com:draft:alice:pnm')
    );
    expect(draft.journal.active.kills).toBe(1);
    offline = false;
    await window.eval('flushCloud()');
    expect(window.document.getElementById('cloud-status').textContent).toBe(
      'Saved on this device and to your account'
    );
  });

  it('blocks conflicting saves but leaves the local draft exportable', async () => {
    const fetch = vi.fn(async (url, options) => {
      if (url.endsWith('/me')) return response({ username: 'alice' });
      if (options.method === 'PUT') return response({ message: 'Conflict' }, 409);
      return response({ journal: sample(), revision: 2 });
    });
    const window = open(null, false, { account: signedIn, fetch });
    await settle();
    click(window, 'record-kill');
    await window.eval('flushCloud()');
    expect(window.document.getElementById('record-kill').disabled).toBe(true);
    expect(window.document.getElementById('export-journal').disabled).toBe(false);
    expect(window.document.getElementById('cloud-status').textContent).toContain('Another device');
    expect(window.eval('journal.active.kills')).toBe(1);
  });

  it('recovers a pending draft after reload and imports guest progress only on request', async () => {
    const fetch = vi.fn(async (url, options) => {
      if (url.endsWith('/me')) return response({ username: 'alice' });
      if (options.method === 'PUT') return response({ revision: 5 });
      return response({ journal: sample(), revision: 4 });
    });
    const draft = {
      revision: 4,
      journal: { ...sample(), active: { id: 'draft', kills: 3, notes: '', drops: '' } },
    };
    const window = open(JSON.stringify({ ...sample(), base: 900 }), false, {
      account: signedIn,
      fetch,
      draft,
    });
    await settle();
    expect(window.document.getElementById('total-kc').textContent).toBe('103');
    click(window, 'import-local');
    expect(window.document.getElementById('total-kc').textContent).toBe('900');
    await window.eval('flushCloud()');
    expect(JSON.parse(fetch.mock.calls.at(-1)[1].body).journal.base).toBe(900);
  });

  it('never replaces a cloud hunt with a stale draft on reload', async () => {
    const fetch = vi.fn(async (url) =>
      url.endsWith('/me')
        ? response({ username: 'alice' })
        : response({ journal: sample(), revision: 8 })
    );
    const window = open(null, false, {
      account: signedIn,
      fetch,
      draft: { revision: 4, journal: { ...sample(), base: 500 } },
    });
    await settle();
    expect(window.document.getElementById('record-kill').disabled).toBe(true);
    expect(window.document.getElementById('export-journal').disabled).toBe(false);
    expect(window.document.getElementById('total-kc').textContent).toBe('500');
    click(window, 'retry-cloud');
    await settle();
    expect(window.document.getElementById('record-kill').disabled).toBe(true);
    expect(
      JSON.parse(
        window.localStorage.getItem('praynr-glass-kc-account:https://praynr.com:draft:alice:pnm')
      ).revision
    ).toBe(4);
    expect(fetch.mock.calls.every(([, options]) => options.method === 'GET')).toBe(true);
    click(window, 'load-cloud');
    await settle();
    expect(window.document.getElementById('total-kc').textContent).toBe('100');
    expect(window.document.getElementById('record-kill').disabled).toBe(false);
  });
});

describe('permanent local copies and storage limits', () => {
  const localKey = 'praynr-glass-kc-account:https://praynr.com:draft:alice:pnm';

  it('refreshes a synced local copy from a newer cloud save without uploading the old one', async () => {
    const fetch = vi.fn(async (url) =>
      url.endsWith('/me')
        ? response({ username: 'alice' })
        : response({ journal: { ...sample(), base: 200 }, revision: 9 })
    );
    const window = open(null, false, {
      account: signedIn,
      fetch,
      draft: { journal: sample(), revision: 8, pending: false },
    });
    await settle();
    expect(window.document.getElementById('total-kc').textContent).toBe('200');
    expect(JSON.parse(window.localStorage.getItem(localKey))).toMatchObject({
      revision: 9,
      pending: false,
      journal: { base: 200 },
    });
    expect(fetch.mock.calls.every(([, options]) => options.method === 'GET')).toBe(true);
    expect(window.document.getElementById('record-kill').disabled).toBe(false);
  });

  it('reopens a synced local copy offline and keeps new changes for later sync', async () => {
    const window = open(null, false, {
      account: signedIn,
      fetch: async () => {
        throw new Error('Offline');
      },
      draft: { journal: sample(), revision: 8, pending: false },
    });
    await settle();
    expect(window.document.getElementById('total-kc').textContent).toBe('100');
    expect(window.document.getElementById('export-journal').disabled).toBe(false);
    click(window, 'record-kill');
    await window.eval('flushCloud()');
    expect(JSON.parse(window.localStorage.getItem(localKey))).toMatchObject({
      revision: 8,
      pending: true,
      journal: { active: { kills: 1 } },
    });
    expect(window.document.getElementById('cloud-status').textContent).toContain('Not synced');
  });

  it('rejects guest changes atomically when storage is full and prompts login', () => {
    const saved = { ...sample(), active: { id: 'one', kills: 1, notes: '', drops: '' } };
    const window = open(JSON.stringify(saved), true);
    for (const id of ['record-kill', 'undo-kill', 'finish-session']) {
      click(window, id);
      expect(JSON.parse(window.localStorage.getItem(key))).toEqual(saved);
      expect(window.eval('journal')).toEqual(saved);
      expect(window.document.getElementById('total-kc').textContent).toBe('101');
      expect(window.document.getElementById('notice').textContent).toContain('Log in');
    }
    expect(() => window.eval("savePaneMemory(1, {label:'Orb', image:''})")).toThrow('Log in');
  });

  it('allows cloud saves when local storage is full without replacing the last local copy', async () => {
    const draft = { journal: sample(), revision: 8, pending: false };
    const fetch = vi.fn(async (url, options) => {
      if (url.endsWith('/me')) return response({ username: 'alice' });
      if (options.method === 'PUT') return response({ revision: 9 });
      return response({ journal: sample(), revision: 8 });
    });
    const window = open(null, true, { account: signedIn, fetch, draft });
    await settle();
    click(window, 'record-kill');
    await window.eval('flushCloud()');
    expect(window.document.getElementById('total-kc').textContent).toBe('101');
    expect(JSON.parse(window.localStorage.getItem(localKey))).toEqual(draft);
    expect(window.document.getElementById('cloud-status').textContent).toContain(
      'Saved to your account · browser storage is full'
    );
    expect(fetch.mock.calls.some(([, options]) => options.method === 'PUT')).toBe(true);
  });

  it('warns to export when neither store can save, and warns before leaving', async () => {
    const window = open(null, true, {
      account: signedIn,
      fetch: async () => {
        throw new Error('Offline');
      },
      draft: { journal: sample(), revision: 8, pending: false },
    });
    await settle();
    click(window, 'record-kill');
    await window.eval('flushCloud()');
    expect(window.document.getElementById('cloud-status').textContent).toContain(
      'Not saved locally or to your account'
    );
    expect(window.eval('journal.active.kills')).toBe(1);
    const beforeUnload = new window.Event('beforeunload', { cancelable: true });
    window.dispatchEvent(beforeUnload);
    expect(beforeUnload.defaultPrevented).toBe(true);
  });

  it('can log in with full storage so a guest can move their saved hunt to Mongo', async () => {
    const fetch = vi.fn(async (url) => {
      if (url.endsWith('/login')) return response(signedIn);
      if (url.endsWith('/me')) return response({ username: 'alice' });
      return response({ journal: null, revision: 0 });
    });
    const window = open(JSON.stringify(sample()), true, { fetch });
    window.document.getElementById('account-username').value = 'alice';
    window.document.getElementById('account-password').value = 'long secret password';
    window.document
      .getElementById('auth-form')
      .dispatchEvent(new window.SubmitEvent('submit', { cancelable: true }));
    await settle();
    expect(window.document.getElementById('account-name').textContent).toBe('Signed in as alice');
    click(window, 'import-local');
    expect(window.eval('cloudPending.base')).toBe(100);
    expect(window.localStorage.getItem(key)).toBe(JSON.stringify(sample()));
  });
});

describe('hard reset', () => {
  const localKey = 'praynr-glass-kc-account:https://praynr.com:draft:alice:pnm';
  async function confirmReset(window, text = 'RESET') {
    window.document.getElementById('reset-confirmation').value = text;
    window.document.getElementById('reset-confirmation').dispatchEvent(new window.Event('input'));
    window.document
      .getElementById('reset-form')
      .dispatchEvent(new window.Event('submit', { cancelable: true }));
    await settle();
  }

  it('warns, permits cancellation, requires RESET, and clears only the guest hunt', async () => {
    const saved = JSON.stringify(sample());
    const window = open(saved);
    window.localStorage.setItem('unrelated', 'keep');
    click(window, 'hard-reset');
    expect(window.document.getElementById('reset-dialog').open).toBe(true);
    expect(window.document.getElementById('reset-scope').textContent).toContain('browser only');
    expect(window.document.getElementById('reset-warning').textContent).toContain(
      'There is no undo'
    );
    expect(window.document.getElementById('reset-submit').disabled).toBe(true);
    await confirmReset(window, 'reset');
    expect(window.localStorage.getItem(key)).toBe(saved);
    click(window, 'reset-cancel');
    expect(window.document.getElementById('reset-dialog').open).toBe(false);
    expect(window.localStorage.getItem(key)).toBe(saved);
    click(window, 'hard-reset');
    await confirmReset(window);
    expect(window.localStorage.getItem(key)).toBeNull();
    expect(window.localStorage.getItem('unrelated')).toBe('keep');
    expect(window.document.getElementById('journal-setup').hidden).toBe(false);
    expect(window.document.getElementById('total-kc').textContent).toBe('0');
    begin(window, 10);
    expect(window.document.getElementById('total-kc').textContent).toBe('10');
  });

  it('resets the account and local copy while retaining the login and guest hunt', async () => {
    const fetch = vi.fn(async (url, options) => {
      if (url.endsWith('/me')) return response({ username: 'alice' });
      if (options.method === 'DELETE') return response({ revision: 9 });
      if (options.method === 'PUT') return response({ revision: 10 });
      return response({ journal: sample(), revision: 8 });
    });
    const window = open(JSON.stringify({ ...sample(), base: 50 }), false, {
      account: signedIn,
      fetch,
    });
    await settle();
    click(window, 'record-kill'); // Pending changes must not be uploaded after the reset.
    click(window, 'hard-reset');
    await confirmReset(window);
    const reset = fetch.mock.calls.find(([, options]) => options.method === 'DELETE');
    expect(JSON.parse(reset[1].body)).toEqual({ revision: 8, confirmation: 'RESET' });
    expect(window.localStorage.getItem(localKey)).toBeNull();
    expect(JSON.parse(window.localStorage.getItem(key)).base).toBe(50);
    expect(window.document.getElementById('account-name').textContent).toBe('Signed in as alice');
    expect(window.eval('cloudPending')).toBeNull();
    expect(window.document.getElementById('journal-setup').hidden).toBe(false);
    begin(window, 0);
    await window.eval('flushCloud()');
    expect(JSON.parse(fetch.mock.calls.at(-1)[1].body).revision).toBe(9);
  });

  it('keeps local data and shows an error when the cloud reset fails', async () => {
    const fetch = vi.fn(async (url, options) => {
      if (url.endsWith('/me')) return response({ username: 'alice' });
      if (options.method === 'DELETE') throw new Error('Offline');
      return response({ journal: sample(), revision: 8 });
    });
    const window = open(null, false, { account: signedIn, fetch });
    await settle();
    const saved = window.localStorage.getItem(localKey);
    click(window, 'hard-reset');
    await confirmReset(window);
    expect(window.localStorage.getItem(localKey)).toBe(saved);
    expect(window.document.getElementById('reset-dialog').open).toBe(true);
    expect(window.document.getElementById('reset-error').textContent).toContain(
      'local copy is kept'
    );
    expect(window.document.getElementById('total-kc').textContent).toBe('100');
    click(window, 'reset-cancel');
    expect(window.document.getElementById('record-kill').disabled).toBe(true);
  });

  it('does not resurrect a pre-reset account copy on another device', async () => {
    const fetch = vi.fn(async (url) =>
      url.endsWith('/me')
        ? response({ username: 'alice' })
        : response({ journal: null, revision: 9, resetRevision: 9 })
    );
    const window = open(null, false, {
      account: signedIn,
      fetch,
      draft: { journal: sample(), revision: 8, pending: true },
    });
    await settle();
    expect(window.localStorage.getItem(localKey)).toBeNull();
    expect(window.document.getElementById('journal-setup').hidden).toBe(false);
    expect(window.document.getElementById('total-kc').textContent).toBe('0');
    expect(fetch.mock.calls.every(([, options]) => options.method === 'GET')).toBe(true);
  });

  it('keeps the guest hunt when browser deletion fails', async () => {
    const window = open(JSON.stringify(sample()));
    window.Storage.prototype.removeItem = () => {
      throw new Error('Blocked');
    };
    click(window, 'hard-reset');
    await confirmReset(window);
    expect(window.document.getElementById('reset-error').textContent).toContain(
      'has not been reset'
    );
    expect(window.document.getElementById('total-kc').textContent).toBe('100');
    expect(window.localStorage.getItem(key)).not.toBeNull();
  });
});

describe('required boss selection and catalog-driven hunts', () => {
  it('requires an explicit choice even with a saved journal', () => {
    const window = open(JSON.stringify(sample()), false, { choose: false });
    expect(window.document.getElementById('boss-selection').hidden).toBe(false);
    expect(window.document.getElementById('tracker-content').hidden).toBe(true);
    expect(window.document.getElementById('window-art').innerHTML).toBe('');
    expect(window.document.querySelector('.boss-choice-preview svg')).not.toBeNull();
    expect(window.document.getElementById('nav-windows').hidden).toBe(true);
    click(window, 'choose-pnm');
    expect(window.document.getElementById('tracker-content').hidden).toBe(false);
    expect(window.document.getElementById('total-kc').textContent).toBe('100');
    click(window, 'change-boss');
    expect(window.document.getElementById('tracker-content').hidden).toBe(true);
    expect(JSON.parse(window.localStorage.getItem(key))).toEqual(sample());
  });

  it('waits for a choice before loading an account hunt', async () => {
    const fetch = vi.fn(async (url) =>
      url.endsWith('/me')
        ? response({ username: 'alice' })
        : response({ journal: sample(), revision: 1 })
    );
    const window = open(null, false, { choose: false, account: signedIn, fetch });
    await settle();
    expect(fetch).not.toHaveBeenCalled();
    click(window, 'choose-pnm');
    await settle();
    expect(fetch.mock.calls.some(([url]) => url.endsWith('/journals/pnm'))).toBe(true);
    expect(window.document.getElementById('tracker-content').hidden).toBe(false);
  });

  it('keeps Chambers progress and drop memories separate when switching bosses', () => {
    const window = open(JSON.stringify(sample()), false, { choose: false });
    click(window, 'choose-cox');
    begin(window, 25);
    click(window, 'record-kill');
    click(window, 'mark-drop');
    window.document.getElementById('pane-label').value = 'Twisted bow';
    click(window, 'pane-save');
    expect(JSON.parse(window.localStorage.getItem('praynr-glass-kc-cox-journal-v2'))).toMatchObject(
      {
        boss: 'cox',
        base: 25,
        active: { kills: 1 },
        dropTiles: { 1: { label: 'Twisted bow' } },
      }
    );
    expect(JSON.parse(window.localStorage.getItem(key))).toEqual(sample());
    expect(() => window.eval(`validate(${JSON.stringify(sample())})`)).toThrow();
    const legacy = sample();
    delete legacy.boss;
    expect(() => window.eval(`validate(${JSON.stringify(legacy)})`)).toThrow();
    click(window, 'change-boss');
    click(window, 'choose-pnm');
    expect(window.document.getElementById('total-kc').textContent).toBe('100');
    click(window, 'change-boss');
    click(window, 'choose-cox');
    expect(window.document.getElementById('total-kc').textContent).toBe('26');
    expect(
      window.document.querySelector('#window-art [data-pane="1"]').getAttribute('aria-label')
    ).toContain('Twisted bow');
  });

  it('uses Chambers cloud routes and local backup, and resets only that hunt', async () => {
    const fetch = vi.fn(async (url, options) => {
      if (url.endsWith('/me')) return response({ username: 'alice' });
      if (options.method === 'PUT') return response({ revision: 1 });
      if (options.method === 'DELETE') return response({ revision: 2 });
      return response({ journal: null, revision: 0 });
    });
    const window = open(JSON.stringify(sample()), false, {
      choose: false,
      account: signedIn,
      fetch,
    });
    click(window, 'choose-cox');
    await settle();
    begin(window, 40);
    click(window, 'record-kill');
    await window.eval('flushCloud()');
    const localKey = 'praynr-glass-kc-account:https://praynr.com:draft:alice:cox';
    expect(JSON.parse(window.localStorage.getItem(localKey))).toMatchObject({
      pending: false,
      journal: { boss: 'cox', base: 40, active: { kills: 1 } },
    });
    const put = fetch.mock.calls.find(([, options]) => options.method === 'PUT');
    expect(put[0]).toContain('/journals/cox');
    expect(JSON.parse(put[1].body).journal.boss).toBe('cox');
    click(window, 'hard-reset');
    expect(window.document.getElementById('reset-scope').textContent).toContain('Chambers');
    window.document.getElementById('reset-confirmation').value = 'RESET';
    window.document.getElementById('reset-confirmation').dispatchEvent(new window.Event('input'));
    window.document
      .getElementById('reset-form')
      .dispatchEvent(new window.Event('submit', { cancelable: true }));
    await settle();
    expect(fetch.mock.calls.find(([, options]) => options.method === 'DELETE')[0]).toContain(
      '/journals/cox'
    );
    expect(window.localStorage.getItem(localKey)).toBeNull();
    expect(JSON.parse(window.localStorage.getItem(key))).toEqual(sample());
  });

  it('keeps pane numbering and drops through all six Chambers windows and the next edition', () => {
    const window = open(null, false, { choose: false });
    const saved = {
      ...sample(),
      boss: 'cox',
      active: { id: 'raids', kills: 600, notes: '', drops: '' },
      dropTiles: { 501: { label: 'Olmlet', image: '' } },
    };
    window.localStorage.setItem('praynr-glass-kc-cox-journal-v2', JSON.stringify(saved));
    click(window, 'choose-cox');
    expect(window.document.querySelectorAll('#gallery-items figure')).toHaveLength(6);
    expect(window.document.querySelectorAll('#window-art .pane.filled')).toHaveLength(100);
    expect(
      window.document.querySelector('#window-art [data-pane="501"]').getAttribute('aria-label')
    ).toContain('Olmlet');
    click(window, 'record-kill');
    expect(window.document.getElementById('window-title').textContent).toContain('The Great Olm');
    expect(window.document.querySelectorAll('#window-art .pane.filled')).toHaveLength(1);
    expect(window.document.querySelector('#window-art [data-pane="601"]')).not.toBeNull();
  });
});
