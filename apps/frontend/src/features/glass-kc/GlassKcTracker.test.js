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
    pretendToBeVisual: true,
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
      window.matchMedia = (media) => ({
        media,
        matches: false,
        addEventListener() {},
        removeEventListener() {},
      });
      window.CSS = { supports: () => true };
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
  it('edits the selected saved session while preserving KC, other sessions and drop memories', () => {
    const data = {
      version: 2,
      boss: 'pnm',
      base: 1700,
      name: 'Nightmare',
      sessions: [
        {
          id: 'earlier',
          kills: 10,
          notes: 'Earlier session',
          drops: 'Nothing',
          ended: '2026-10-06',
        },
        {
          id: 'orb-session',
          kills: 5,
          notes: 'Finally!',
          drops: 'Forgot to write it down',
          ended: '2026-10-07',
        },
      ],
      active: { id: 'current', kills: 1, notes: 'Current note', drops: 'Current loot' },
      dropTiles: {
        15: {
          label: 'Harmonised orb',
          image: 'data:image/jpeg;base64,YWJj',
          savedAt: 1780000000000,
        },
      },
    };
    const window = open(JSON.stringify(data));
    const main = window.document.querySelector('#window-art svg');
    const postcard = window.document.querySelector('#postcard-items svg');
    window.document.querySelector('[data-edit-session="orb-session"]').click();
    let form = window.document.querySelector('.postcard-editor');
    expect(form.elements.namedItem('drops').value).toBe('Forgot to write it down');
    form.elements.namedItem('drops').value = 'Harmonised orb at 1715 KC';
    form.elements.namedItem('drops').dispatchEvent(new window.Event('input', { bubbles: true }));
    form.elements.namedItem('notes').value = 'Another pane. Finally, less pain.';
    form.elements.namedItem('notes').dispatchEvent(new window.Event('input', { bubbles: true }));
    click(window, 'record-kill');
    form = window.document.querySelector('.postcard-editor');
    expect(form.elements.namedItem('drops').value).toBe('Harmonised orb at 1715 KC');
    expect(window.document.querySelector('#postcard-items svg')).toBe(postcard);
    form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    const saved = JSON.parse(window.localStorage.getItem(key));
    expect(saved.sessions[0]).toEqual(data.sessions[0]);
    expect(saved.sessions[1]).toEqual({
      ...data.sessions[1],
      notes: 'Another pane. Finally, less pain.',
      drops: 'Harmonised orb at 1715 KC',
    });
    expect(saved.active).toEqual({ ...data.active, kills: 2 });
    expect(saved.dropTiles).toEqual(data.dropTiles);
    expect(window.document.getElementById('total-kc').textContent).toBe('1,717');
    expect(window.document.querySelector('#window-art svg')).toBe(main);
    expect(window.document.querySelector('#postcard-items svg')).toBe(postcard);
    expect(window.document.querySelector('.postcard-editor')).toBeNull();
    expect(window.document.activeElement.dataset.editSession).toBe('orb-session');
    expect(window.eval('postcardSVG(1)')).toContain('Harmonised orb at 1715 KC');
    const restored = open(JSON.stringify(saved));
    expect(
      restored.document.querySelector('[data-session-id="orb-session"] .postcard-loot').textContent
    ).toBe('Harmonised orb at 1715 KC');
  });

  it('cancels session edits with Cancel or Escape without changing the saved journal', () => {
    const window = open();
    begin(window, 0);
    click(window, 'record-kill');
    click(window, 'finish-session');
    const saved = window.localStorage.getItem(key);
    for (const escape of [false, true]) {
      window.document.querySelector('[data-edit-session]').click();
      const form = window.document.querySelector('.postcard-editor');
      const loot = form.elements.namedItem('drops');
      loot.value = 'Unsaved loot';
      loot.dispatchEvent(new window.Event('input', { bubbles: true }));
      if (escape)
        loot.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      else form.querySelector('[data-cancel-session]').click();
      expect(window.document.querySelector('.postcard-editor')).toBeNull();
      expect(window.localStorage.getItem(key)).toBe(saved);
      expect(window.document.activeElement.hasAttribute('data-edit-session')).toBe(true);
    }
  });

  it('retains a session edit draft when storage fails and rejects stale text from another tab', () => {
    const data = {
      version: 2,
      boss: 'pnm',
      base: 0,
      name: 'Nightmare',
      sessions: [
        { id: 'saved', kills: 1, notes: 'Original', drops: 'Original loot', ended: '2026-10-07' },
      ],
      active: null,
      dropTiles: {},
    };
    const window = open(JSON.stringify(data), true);
    window.document.querySelector('[data-edit-session]').click();
    let form = window.document.querySelector('.postcard-editor');
    form.elements.namedItem('drops').value = 'Missed orb';
    form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    expect(form.querySelector('.postcard-edit-error').textContent).toContain('storage is full');
    expect(form.elements.namedItem('drops').value).toBe('Missed orb');
    expect(JSON.parse(window.localStorage.getItem(key)).sessions[0]).toEqual(data.sessions[0]);
    const remote = { ...data, sessions: [{ ...data.sessions[0], drops: 'Other tab loot' }] };
    window.dispatchEvent(
      new window.StorageEvent('storage', { key, newValue: JSON.stringify(remote) })
    );
    form = window.document.querySelector('.postcard-editor');
    expect(form.elements.namedItem('drops').value).toBe('Missed orb');
    form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    expect(form.querySelector('.postcard-edit-error').textContent).toContain('session changed');
    expect(window.eval('journal.sessions[0].drops')).toBe('Other tab loot');
  });

  it('validates session edit lengths, escapes text, and clears drafts when changing hunts', () => {
    const window = open();
    begin(window, 0);
    click(window, 'record-kill');
    click(window, 'finish-session');
    window.document.querySelector('[data-edit-session]').click();
    const form = window.document.querySelector('.postcard-editor');
    form.elements.namedItem('drops').value = 'x'.repeat(241);
    form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    expect(form.querySelector('.postcard-edit-error').textContent).toContain('240 characters');
    form.elements.namedItem('drops').value = '<b>Harmonised orb</b>';
    form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    expect(window.document.querySelector('.postcard-loot').textContent).toBe(
      '<b>Harmonised orb</b>'
    );
    expect(window.document.querySelector('.postcard-loot b')).toBeNull();
    window.document.querySelector('[data-edit-session]').click();
    click(window, 'change-boss');
    click(window, 'choose-cox');
    expect(window.eval('sessionEdit')).toBeNull();
    expect(window.document.querySelector('.postcard-editor')).toBeNull();
  });

  it.each(['pnm', 'cox', 'toa', 'tob', 'cg', 'yama', 'nex'])(
    'keeps every %s scene running while lighting, undoing and marking panes',
    (bossId) => {
      const window = open(undefined, false, { choose: false });
      click(window, `choose-${bossId}`);
      begin(window, 100);
      const scenes = window.eval('boss().titles.length');
      for (let index = 0; index < scenes; index++) {
        window.eval(
          `journal.active = { id: 'motion', kills: ${index * 100 + 24}, notes: '', drops: '' }; render();`
        );
        const host = window.document.getElementById('window-art');
        const svg = host.querySelector('svg');
        const scene = svg.querySelector('#scene-main');
        const animations = Array.from(
          scene.querySelectorAll('animate, animateMotion, animateTransform, style')
        );
        const pane = svg.querySelector('.pane');
        click(window, 'record-kill');
        expect(host.querySelector('svg')).toBe(svg);
        expect(svg.querySelector('#scene-main')).toBe(scene);
        expect(
          Array.from(scene.querySelectorAll('animate, animateMotion, animateTransform, style'))
        ).toEqual(animations);
        expect(svg.querySelector('.pane')).toBe(pane);
        expect(svg.querySelectorAll('.pane.filled')).toHaveLength(25);
        expect(svg.querySelector('[data-window-reveal]').children).toHaveLength(25);
        expect(svg.querySelectorAll('[data-ornament]')).toHaveLength(1);
        expect(svg.getAttribute('aria-label')).toContain('25 of 100 pieces lit, 1 of 4');
        click(window, 'undo-kill');
        expect(host.querySelector('svg')).toBe(svg);
        expect(svg.querySelectorAll('.pane.filled')).toHaveLength(24);
        expect(svg.querySelector('[data-window-reveal]').children).toHaveLength(24);
        expect(svg.querySelectorAll('[data-ornament]')).toHaveLength(0);
        window.eval(
          `savePaneMemory(${index * 100 + 24}, { label: 'Motion test drop', image: '' }); render();`
        );
        const drop = svg.querySelector(`[data-pane="${index * 100 + 24}"]`);
        expect(host.querySelector('svg')).toBe(svg);
        expect(drop.getAttribute('fill')).toBe('#d85397');
        expect(drop.getAttribute('aria-label')).toContain('Motion test drop');
        expect(svg.querySelectorAll('.drop-spark')).toHaveLength(1);
        expect(scene.isConnected).toBe(true);
        window.eval(`savePaneMemory(${index * 100 + 24}, null); render();`);
        expect(svg.querySelectorAll('.drop-spark')).toHaveLength(0);
        expect(drop.getAttribute('fill')).toBe('transparent');
      }
    }
  );

  it('keeps completion, collection and postcard scenes running until a new window begins', () => {
    const window = open(
      JSON.stringify({
        version: 2,
        boss: 'pnm',
        base: 100,
        name: 'Nightmare',
        sessions: [
          { id: 'finished', kills: 100, notes: 'One window', drops: '', ended: '2026-10-06' },
        ],
        active: { id: 'motion', kills: 99, notes: '', drops: '' },
        dropTiles: {},
      })
    );
    const host = window.document.getElementById('window-art');
    const svg = host.querySelector('svg');
    const collected = window.document.querySelector('#gallery-items svg');
    const postcard = window.document.querySelector('#postcard-items svg');
    click(window, 'record-kill');
    expect(host.querySelector('svg')).toBe(svg);
    expect(svg.querySelectorAll('.pane.filled')).toHaveLength(100);
    expect(svg.querySelectorAll('[data-ornament]')).toHaveLength(4);
    expect(svg.querySelector('.window-resonance')).not.toBeNull();
    expect(window.document.querySelector('#gallery-items svg')).toBe(collected);
    expect(window.document.querySelectorAll('#gallery-items svg')).toHaveLength(2);
    expect(window.document.querySelector('#postcard-items svg')).toBe(postcard);
    click(window, 'record-kill');
    expect(host.querySelector('svg')).not.toBe(svg);
    expect(host.querySelectorAll('.pane.filled')).toHaveLength(1);
    expect(window.document.querySelector('#gallery-items svg')).toBe(collected);
    expect(window.document.querySelector('#postcard-items svg')).toBe(postcard);
  });

  it('keeps workshop and sanctuary previews running and refreshes style and reduced motion changes', () => {
    const window = open();
    begin(window, 0);
    click(window, 'record-kill');
    const details = window.document.querySelector('#window-workshop details');
    details.open = true;
    window.eval('windowWorkshop.refresh()');
    const preview = window.document.querySelector('.workshop-preview svg');
    window.eval("openSanctuary('pnm', 0)");
    const sanctuary = window.document.querySelector('#room-art svg');
    const pane = window.document.querySelector('#window-art [data-pane="1"]');
    pane.focus();
    click(window, 'record-kill');
    expect(window.document.querySelector('.workshop-preview svg')).toBe(preview);
    expect(window.document.querySelector('#room-art svg')).toBe(sanctuary);
    expect(window.document.activeElement).toBe(pane);
    expect(sanctuary.querySelector('[data-window-reveal]').children).toHaveLength(2);
    const main = window.document.querySelector('#window-art svg');
    window.document.querySelector('#window-workshop [data-shape="ogee"]').click();
    const reshaped = window.document.querySelector('#window-art svg');
    expect(reshaped).not.toBe(main);
    expect(reshaped.dataset.windowShape).toBe('ogee');
    expect(reshaped.querySelector('[data-window-reveal]').children).toHaveLength(2);
    window.document.querySelector('#window-workshop [data-frame="amethyst"]').click();
    const reframed = window.document.querySelector('#window-art svg');
    expect(reframed).not.toBe(reshaped);
    expect(reframed.getAttribute('aria-label')).toContain('Amethyst frame');
    window.matchMedia = () => ({ matches: true });
    window.dispatchEvent(new window.Event('glass-motionchange'));
    const reduced = window.document.querySelector('#window-art svg');
    expect(reduced).not.toBe(reframed);
    expect(reduced.querySelectorAll('animate, animateMotion, animateTransform')).toHaveLength(0);
    click(window, 'record-kill');
    expect(window.document.querySelector('#window-art svg')).toBe(reduced);
    expect(reduced.querySelector('[data-window-reveal]').children).toHaveLength(3);
  });

  it('dates new drops and screenshot replacements without reordering label edits or removals', () => {
    const window = open();
    begin(window, 100);
    click(window, 'record-kill');
    const clock = vi.spyOn(window.Date, 'now').mockReturnValue(1780000000000);
    window.eval("savePaneMemory(1,{label:'Orb',image:''})");
    clock.mockReturnValue(1780000001000);
    window.eval("savePaneMemory(1,{label:'Renamed orb',image:''})");
    let saved = JSON.parse(window.localStorage.getItem(key));
    expect(saved.dropTiles['1'].savedAt).toBe(1780000000000);
    window.eval("savePaneMemory(1,{label:'Orb',image:'data:image/jpeg;base64,YWJj'})");
    saved = JSON.parse(window.localStorage.getItem(key));
    expect(saved.dropTiles['1'].savedAt).toBe(1780000001000);
    clock.mockReturnValue(1780000002000);
    window.eval("savePaneMemory(1,{label:'Orb',image:''})");
    saved = JSON.parse(window.localStorage.getItem(key));
    expect(saved.dropTiles['1'].savedAt).toBe(1780000001000);
    clock.mockRestore();
    const restored = open(JSON.stringify(saved));
    expect(restored.eval('journal.dropTiles[1].savedAt')).toBe(1780000001000);
  });

  it('keeps undated legacy drops undated and rejects invalid dates in backups', () => {
    const data = {
      version: 2,
      boss: 'pnm',
      base: 100,
      name: 'Nightmare',
      sessions: [],
      active: { id: 'old', kills: 1, notes: '', drops: '' },
      dropTiles: { 1: { label: 'Old orb', image: '' } },
    };
    const window = open(JSON.stringify(data));
    window.eval("savePaneMemory(1,{label:'Renamed old orb',image:''})");
    expect(JSON.parse(window.localStorage.getItem(key)).dropTiles['1']).not.toHaveProperty(
      'savedAt'
    );
    for (const savedAt of [0, -1, 1.5, true, '1780000000000', null, 8640000000000001]) {
      const backup = { ...data, dropTiles: { 1: { label: 'Orb', image: '', savedAt } } };
      expect(() => window.eval(`validate(${JSON.stringify(backup)})`)).toThrow();
    }
    data.dropTiles['1'].savedAt = 1780000000000;
    expect(window.eval(`validate(${JSON.stringify(data)}).dropTiles[1].savedAt`)).toBe(
      1780000000000
    );
  });

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
  it('saves edited session loot to the account without modifying the guest journal', async () => {
    const data = {
      ...sample(),
      sessions: [
        {
          id: 'orb-session',
          kills: 5,
          notes: 'Finally',
          drops: 'Forgot loot',
          ended: '2026-10-07',
        },
      ],
    };
    const guest = JSON.stringify({ ...sample(), base: 900 });
    const fetch = vi.fn(async (url, options) => {
      if (url.endsWith('/me')) return response({ username: 'alice' });
      if (options.method === 'PUT') return response({ revision: 8 });
      return response({ journal: data, revision: 7 });
    });
    const window = open(guest, false, { account: signedIn, fetch });
    await settle();
    window.document.querySelector('[data-edit-session]').click();
    const form = window.document.querySelector('.postcard-editor');
    form.elements.namedItem('drops').value = 'Harmonised orb';
    form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await window.eval('flushCloud()');
    const put = fetch.mock.calls.find(([, options]) => options.method === 'PUT');
    expect(JSON.parse(put[1].body)).toMatchObject({
      revision: 7,
      journal: { sessions: [{ ...data.sessions[0], drops: 'Harmonised orb' }] },
    });
    expect(window.localStorage.getItem(key)).toBe(guest);
    expect(window.document.getElementById('cloud-status').textContent).toBe(
      'Saved on this device and to your account'
    );
  });

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
    expect(window.document.getElementById('cloud-recovery').hidden).toBe(true);
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
    expect(window.document.getElementById('cloud-status').textContent).toContain(
      'Saved on this device · account save failed'
    );
    expect(window.document.getElementById('retry-cloud').hidden).toBe(false);
    expect(window.document.getElementById('load-cloud').hidden).toBe(true);
    const draft = JSON.parse(
      window.localStorage.getItem('praynr-glass-kc-account:https://praynr.com:draft:alice:pnm')
    );
    expect(draft.journal.active.kills).toBe(1);
    offline = false;
    await window.eval('flushCloud()');
    expect(window.document.getElementById('cloud-status').textContent).toBe(
      'Saved on this device and to your account'
    );
    expect(window.document.getElementById('cloud-recovery').hidden).toBe(true);
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
    expect(window.document.getElementById('retry-cloud').hidden).toBe(true);
    expect(window.document.getElementById('load-cloud').hidden).toBe(false);
    expect(window.document.getElementById('save-device-backup').hidden).toBe(false);
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

  it('keeps device changes when account replacement is cancelled or the request fails', async () => {
    let unavailable = false;
    const fetch = vi.fn(async (url) => {
      if (unavailable) throw new Error('Offline');
      return url.endsWith('/me')
        ? response({ username: 'alice' })
        : response({ journal: sample(), revision: 8 });
    });
    const window = open(null, false, {
      account: signedIn,
      fetch,
      draft: { revision: 4, pending: true, journal: { ...sample(), base: 500 } },
    });
    await settle();
    const localKey = 'praynr-glass-kc-account:https://praynr.com:draft:alice:pnm';
    const saved = window.localStorage.getItem(localKey);
    window.confirm = vi.fn(() => false);
    const calls = fetch.mock.calls.length;
    click(window, 'load-cloud');
    await settle();
    expect(fetch).toHaveBeenCalledTimes(calls);
    expect(window.confirm.mock.calls[0][0]).toContain('does not combine');
    expect(window.localStorage.getItem(localKey)).toBe(saved);
    unavailable = true;
    window.confirm = () => true;
    click(window, 'load-cloud');
    await settle();
    expect(window.document.getElementById('total-kc').textContent).toBe('500');
    expect(window.localStorage.getItem(localKey)).toBe(saved);
    expect(window.eval('cloudPending.base')).toBe(500);
    expect(fetch.mock.calls.every(([, options]) => options.method === 'GET')).toBe(true);
  });

  it('automatically reconnects an offline device copy when connectivity returns', async () => {
    let unavailable = true;
    const fetch = vi.fn(async (url) => {
      if (unavailable) throw new Error('Offline');
      return url.endsWith('/me')
        ? response({ username: 'alice' })
        : response({ journal: { ...sample(), base: 200 }, revision: 9 });
    });
    const window = open(null, false, {
      account: signedIn,
      fetch,
      draft: { revision: 8, pending: false, journal: sample() },
    });
    await settle();
    expect(window.document.getElementById('retry-cloud').textContent).toBe('Reconnect to account');
    expect(window.document.getElementById('load-cloud').hidden).toBe(true);
    unavailable = false;
    window.dispatchEvent(new window.Event('online'));
    await settle();
    expect(window.document.getElementById('total-kc').textContent).toBe('200');
    expect(window.document.getElementById('cloud-recovery').hidden).toBe(true);
    expect(fetch.mock.calls.every(([, options]) => options.method === 'GET')).toBe(true);
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
    expect(window.document.getElementById('cloud-status').textContent).toContain(
      'Saved on this device · account save failed'
    );
    expect(window.document.getElementById('retry-cloud').hidden).toBe(false);
    expect(window.document.getElementById('load-cloud').hidden).toBe(true);
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

  it.each([
    ['cox', 'Chambers'],
    ['toa', 'Tombs'],
    ['tob', 'Theatre'],
    ['cg', 'Corrupted Gauntlet'],
    ['yama', 'Yama'],
    ['nex', 'Nex'],
  ])('uses %s cloud routes and local backup, and resets only that hunt', async (boss, title) => {
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
    click(window, `choose-${boss}`);
    await settle();
    begin(window, 40);
    click(window, 'record-kill');
    await window.eval('flushCloud()');
    const localKey = `praynr-glass-kc-account:https://praynr.com:draft:alice:${boss}`;
    expect(JSON.parse(window.localStorage.getItem(localKey))).toMatchObject({
      pending: false,
      journal: { boss, base: 40, active: { kills: 1 } },
    });
    const put = fetch.mock.calls.find(([, options]) => options.method === 'PUT');
    expect(put[0]).toContain(`/journals/${boss}`);
    expect(JSON.parse(put[1].body).journal.boss).toBe(boss);
    click(window, 'hard-reset');
    expect(window.document.getElementById('reset-scope').textContent).toContain(title);
    window.document.getElementById('reset-confirmation').value = 'RESET';
    window.document.getElementById('reset-confirmation').dispatchEvent(new window.Event('input'));
    window.document
      .getElementById('reset-form')
      .dispatchEvent(new window.Event('submit', { cancelable: true }));
    await settle();
    expect(fetch.mock.calls.find(([, options]) => options.method === 'DELETE')[0]).toContain(
      `/journals/${boss}`
    );
    expect(window.localStorage.getItem(localKey)).toBeNull();
    expect(JSON.parse(window.localStorage.getItem(key))).toEqual(sample());
  });

  it.each([
    ['cox', 'The Great Olm', 6, 'CHAMBERS OF XERIC'],
    ['toa', 'Tumeken’s shadow', 6, 'TOMBS OF AMASCUT'],
    ['tob', 'The Scythe of Vitur', 6, 'THEATRE OF BLOOD'],
    ['cg', 'Hunllef, crystal and crimson', 4, 'CORRUPTED GAUNTLET'],
    ['yama', 'The Master of Pacts', 6, 'YAMA'],
    ['nex', 'The Fifth General', 6, 'NEX'],
  ])(
    'keeps pane numbering through all %s windows and the next edition',
    (boss, firstTitle, scenes, postcardName) => {
      const window = open(null, false, { choose: false });
      const completions = scenes * 100;
      const firstPane = completions - 99;
      const saved = {
        ...sample(),
        boss,
        active: { id: 'completions', kills: completions, notes: '', drops: '' },
        dropTiles: { [firstPane]: { label: 'Reward remembered', image: '' } },
      };
      window.localStorage.setItem(`praynr-glass-kc-${boss}-journal-v2`, JSON.stringify(saved));
      click(window, `choose-${boss}`);
      expect(window.document.querySelectorAll('#gallery-items figure')).toHaveLength(scenes);
      expect(window.document.querySelectorAll('#window-art .pane.filled')).toHaveLength(100);
      expect(
        window.document
          .querySelector(`#window-art [data-pane="${firstPane}"]`)
          .getAttribute('aria-label')
      ).toContain('Reward remembered');
      click(window, 'finish-session');
      expect(window.eval('postcardSVG(0)')).toContain(postcardName);
      click(window, 'record-kill');
      expect(window.document.getElementById('window-title').textContent).toContain(firstTitle);
      expect(window.document.querySelectorAll('#window-art .pane.filled')).toHaveLength(1);
      expect(
        window.document.querySelector(`#window-art [data-pane="${completions + 1}"]`)
      ).not.toBeNull();
    }
  );

  it.each([
    [0, 0, 0, 'The Master of Pacts'],
    [25, 25, 0, 'The Master of Pacts'],
    [99, 99, 0, 'The Master of Pacts'],
    [100, 100, 1, 'The Master of Pacts'],
    [600, 100, 6, 'The Judge’s crossing'],
    [601, 1, 6, 'The Master of Pacts'],
  ])(
    'keeps Yama progress and backups isolated at %i successes',
    (successes, panes, windows, title) => {
      const window = open(JSON.stringify(sample()), false, { choose: false });
      const yamaKey = 'praynr-glass-kc-yama-journal-v2';
      const saved = {
        ...sample(),
        boss: 'yama',
        name: 'Yama',
        base: 900,
        active: { id: 'yama-successes', kills: successes, notes: '', drops: '' },
      };
      window.localStorage.setItem(yamaKey, JSON.stringify(saved));
      click(window, 'choose-yama');
      expect(window.document.getElementById('window-title').textContent).toContain(title);
      expect(window.document.querySelectorAll('#window-art .pane.filled')).toHaveLength(panes);
      expect(window.document.getElementById('window-count').textContent).toBe(String(windows));
      expect(window.document.getElementById('milestone-help').textContent).toContain(
        '25 successes per seal'
      );
      expect(window.document.getElementById('session-info').textContent).toBe(
        `${successes} ${successes === 1 ? 'SUCCESS' : 'SUCCESSES'}`
      );
      expect(() => window.eval(`validate(${JSON.stringify(sample())})`)).toThrow();
      expect(() => window.eval(`validate(${JSON.stringify(saved)}, 'pnm')`)).toThrow();
      expect(JSON.parse(window.localStorage.getItem(key))).toEqual(sample());
      expect(JSON.parse(window.localStorage.getItem(yamaKey))).toEqual(saved);
    }
  );
  it.each([
    [0, 0, 0, 'The Fifth General'],
    [25, 25, 0, 'The Fifth General'],
    [99, 99, 0, 'The Fifth General'],
    [100, 100, 1, 'The Fifth General'],
    [599, 99, 5, 'The Zaryte arsenal'],
    [600, 100, 6, 'The Zaryte arsenal'],
    [601, 1, 6, 'The Fifth General'],
  ])('keeps Nex progress and backups isolated at %i kills', (kills, panes, windows, title) => {
    const window = open(JSON.stringify(sample()), false, { choose: false });
    const nexKey = 'praynr-glass-kc-nex-journal-v2';
    const saved = {
      ...sample(),
      boss: 'nex',
      name: 'Nex',
      base: 900,
      active: { id: 'nex-kills', kills: kills, notes: '', drops: '' },
    };
    window.localStorage.setItem(nexKey, JSON.stringify(saved));
    click(window, 'choose-nex');
    expect(window.document.getElementById('window-title').textContent).toContain(title);
    expect(window.document.querySelectorAll('#window-art .pane.filled')).toHaveLength(panes);
    expect(window.document.getElementById('window-count').textContent).toBe(String(windows));
    expect(window.document.getElementById('milestone-help').textContent).toContain(
      '25 kills per sigil'
    );
    expect(window.document.getElementById('session-info').textContent).toBe(
      `${kills} ${kills === 1 ? 'KILL' : 'KILLS'}`
    );
    expect(() => window.eval(`validate(${JSON.stringify(sample())})`)).toThrow();
    expect(() => window.eval(`validate(${JSON.stringify(saved)}, 'pnm')`)).toThrow();
    expect(JSON.parse(window.localStorage.getItem(key))).toEqual(sample());
    expect(JSON.parse(window.localStorage.getItem(nexKey))).toEqual(saved);
  });
});
