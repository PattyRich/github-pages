/* Classic script: shares the standalone journal's rendering and validation. */
/* exported persistJournal, initAccount */
'use strict';
const apiBase =
  new URLSearchParams(location.search).get('api') ||
  (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)
    ? 'http://localhost:8000'
    : 'https://praynr.com');
const authKey = `praynr-glass-kc-account:${apiBase}`;
let bossId = LEGACY_BOSS_ID,
  bossChosen = false;
const boss = () => GLASS_BOSSES[bossId];
const journalPath = () => `/journals/${bossId}`;
let account = null;
try {
  account = JSON.parse(localStorage.getItem(authKey));
} catch {
  /* Login remains available. */
}
if (!account || typeof account.token !== 'string' || typeof account.username !== 'string')
  account = null;
let cloudRevision = 0,
  cloudReady = false,
  cloudPending = null,
  cloudBusy = false;
let cloudTimer,
  accountBusy = false,
  cloudLoading = false;
let localCopyCurrent = true;
let resetOpen = false,
  resetBusy = false;
const draftKey = () => `${authKey}:draft:${account.username}:${bossId}`;
const emptyJournal = () => ({
  version: 2,
  boss: bossId,
  base: 0,
  name: boss().name,
  sessions: [],
  active: null,
  dropTiles: {},
});

async function cloudRequest(path, method = 'GET', body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${apiBase}/glass-kc/api${path}`, {
      method,
      signal: controller.signal,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(account ? { Authorization: `Bearer ${account.token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = response.status === 204 ? {} : await response.json();
    if (!response.ok)
      throw Object.assign(new Error(data.message || 'Cloud request failed.'), {
        status: response.status,
      });
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

function cloudStatus(message) {
  document.getElementById('cloud-status').textContent = message;
}

function storeAccountCopy(data, revision, pending) {
  try {
    // Retain the same envelope after sync; old envelopes without pending are unsynced.
    localStorage.setItem(draftKey(), JSON.stringify({ revision, journal: data, pending }));
    localCopyCurrent = true;
  } catch {
    // Never remove the previous local copy to make room. Cloud sync can still proceed.
    localCopyCurrent = false;
  }
  return localCopyCurrent;
}

function savedStatus() {
  cloudStatus(
    localCopyCurrent
      ? 'Saved on this device and to your account'
      : 'Saved to your account · browser storage is full or unavailable. Your local copy could not be updated. Export a backup.'
  );
}

function persistJournal(candidate) {
  if (!bossChosen) throw new Error('Choose a boss before saving a hunt.');
  if (resetOpen) throw new Error('Close the reset warning before editing your hunt.');
  if (!account) {
    try {
      localStorage.setItem(KEY, JSON.stringify(candidate));
    } catch {
      const message =
        'Browser storage is full or unavailable. Your last saved journal is unchanged. Log in to save to your account, or export a backup.';
      cloudStatus(message);
      throw new Error(message);
    }
    cloudStatus('Saved on this device · log in for an account backup');
    return;
  }
  if (!cloudReady) throw new Error('Open your cloud save before making changes.');
  const clean = JSON.parse(JSON.stringify(validate(candidate)));
  storeAccountCopy(clean, cloudRevision, true);
  cloudPending = clean;
  cloudStatus(
    localCopyCurrent
      ? 'Changes saved on this device · syncing…'
      : 'Browser storage is full or unavailable · syncing to your account. Keep this tab open until saved, or export a backup.'
  );
  clearTimeout(cloudTimer);
  cloudTimer = setTimeout(flushCloud, 400);
}

async function flushCloud() {
  if (!account || !cloudReady || !cloudPending || cloudBusy || resetOpen) return;
  cloudBusy = true;
  const sent = cloudPending;
  let succeeded = false;
  try {
    const result = await cloudRequest(journalPath(), 'PUT', {
      revision: cloudRevision,
      journal: sent,
    });
    cloudRevision = result.revision;
    if (cloudPending === sent) {
      storeAccountCopy(sent, cloudRevision, false);
      cloudPending = null;
      savedStatus();
    } else {
      storeAccountCopy(cloudPending, cloudRevision, true);
    }
    succeeded = true;
  } catch (error) {
    if (error.status === 409 || error.status === 401) {
      cloudReady = false;
      loadFailed = true;
      render();
      document.getElementById('auth-form').hidden = error.status !== 401;
      cloudStatus(
        error.status === 409
          ? 'Another device saved this hunt. Export your changes, then load the cloud save.'
          : 'Session expired. Log in again to sync, or export your changes.'
      );
    } else {
      cloudStatus(
        localCopyCurrent
          ? 'Not synced · changes kept on this device. Retry or export a backup.'
          : 'Not saved locally or to your account. Keep this tab open and export a backup, then retry.'
      );
    }
  } finally {
    cloudBusy = false;
    if (succeeded && cloudPending) void flushCloud();
  }
}

function accountUI() {
  document.getElementById('auth-form').hidden = !!account;
  document.getElementById('account-actions').hidden = !account;
  for (const id of ['import-local', 'retry-cloud', 'load-cloud'])
    document.getElementById(id).disabled = !bossChosen;
  document.getElementById('account-name').textContent = account
    ? `Signed in as ${account.username}`
    : 'Keep a light here. Find it again anywhere.';
  document.getElementById('import-local').hidden = !account;
  document.getElementById('storage-description').textContent = account
    ? 'Your KC, postcards and screenshots save on this device and to your account. Check both saves in the status before leaving. Export a backup for an extra copy.'
    : 'Guest progress stays in this browser. Create an account to keep your hunt across devices, then import this browser’s journal.';
}

async function openCloud(discardDraft = false) {
  if (cloudLoading || !bossChosen) return;
  cloudLoading = true;
  let local = null;
  try {
    let stored = null;
    try {
      stored = localStorage.getItem(draftKey());
    } catch {
      /* Cloud access remains available. */
    }
    if ((stored || cloudPending) && !discardDraft) {
      const fromMemory = !!cloudPending;
      const candidate = fromMemory
        ? { journal: cloudPending, revision: cloudRevision, pending: true }
        : JSON.parse(stored);
      candidate.journal = validate(candidate.journal);
      if (!Number.isSafeInteger(candidate.revision) || candidate.revision < 0)
        throw new Error(
          'Invalid local save revision. Export a backup before loading the cloud save.'
        );
      local = candidate;
      journal = local.journal;
      configured = true;
      cloudRevision = local.revision;
      cloudPending = local.pending === false ? null : local.journal;
      if (!fromMemory) localCopyCurrent = true;
      closePaneEditor();
      setFields();
    }
    cloudReady = false;
    loadFailed = true;
    render();
    cloudStatus('Opening your saved hunt…');
    const user = await cloudRequest('/me');
    if (user.username !== account.username)
      throw Object.assign(new Error('Account mismatch. Log out and log in again.'), {
        status: 403,
      });
    const remote = await cloudRequest(journalPath());
    // A reset on another device invalidates even an unsynced pre-reset browser copy.
    if (local && remote.resetRevision > local.revision) {
      local = null;
      cloudPending = null;
      localStorage.removeItem(draftKey());
      notify('This hunt was reset on another device. Opened the current cloud save.', true);
    }
    let pending =
      local && (local.pending !== false || local.revision > remote.revision || !remote.journal)
        ? local
        : null;
    if (pending) {
      // A response can be lost after Mongo commits a save. Recognize that exact save.
      const canonical = (value) =>
        JSON.stringify(value, (_, item) =>
          item && typeof item === 'object' && !Array.isArray(item)
            ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)))
            : item
        );
      if (remote.journal && canonical(validate(remote.journal)) === canonical(pending.journal))
        pending = null;
    }
    cloudRevision = pending ? pending.revision : remote.revision;
    cloudPending = pending?.journal || null;
    journal = cloudPending || (remote.journal ? validate(remote.journal) : emptyJournal());
    configured = !!(cloudPending || remote.journal);
    loadFailed = !!pending && pending.revision !== remote.revision;
    cloudReady = !loadFailed;
    if (configured) storeAccountCopy(journal, cloudRevision, !!pending);
    else if (discardDraft) localStorage.removeItem(draftKey());
    closePaneEditor();
    setFields();
    render();
    accountUI();
    if (loadFailed) {
      cloudStatus('Another device saved this hunt. Export your changes, then load the cloud save.');
    } else if (cloudPending) cloudStatus('Local changes recovered · syncing…');
    else if (configured) savedStatus();
    else cloudStatus('Choose your boss and starting KC to begin.');
    if (cloudPending && cloudReady) await flushCloud();
  } catch (error) {
    if (!local || discardDraft) throw error;
    // The local copy stays useful even when the API cannot be reached.
    journal = local.journal;
    configured = true;
    cloudRevision = local.revision;
    cloudPending = local.pending === false ? null : local.journal;
    cloudReady = !error.status || error.status >= 500;
    loadFailed = !cloudReady;
    setFields();
    render();
    accountUI();
    document.getElementById('auth-form').hidden = error.status !== 401;
    cloudStatus(
      error.status === 401
        ? 'Showing your local save · log in again to sync.'
        : error.status === 403
          ? error.message
          : localCopyCurrent
            ? 'Showing your local save · cloud unavailable. Changes will stay on this device until sync succeeds.'
            : 'Cloud unavailable and browser storage is full. Keep this tab open and export your changes.'
    );
  } finally {
    cloudLoading = false;
  }
}

async function initAccount() {
  initReset();
  accountUI();
  document.getElementById('auth-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (accountBusy || cloudBusy || cloudLoading) return;
    if (
      account &&
      cloudPending &&
      !localCopyCurrent &&
      document.getElementById('account-username').value.trim().toLowerCase() !== account.username &&
      !confirm(
        'This hunt has unsaved changes and browser storage is full. Cancel and export a backup first. Switch accounts and discard these changes?'
      )
    )
      return;
    accountBusy = true;
    const submit = event.submitter?.value || 'login';
    const buttons = [...document.querySelectorAll('#auth-form button')];
    buttons.forEach((button) => {
      button.disabled = true;
    });
    const errorBox = document.getElementById('auth-error');
    errorBox.hidden = true;
    try {
      const result = await cloudRequest(`/${submit}`, 'POST', {
        username: document.getElementById('account-username').value.trim(),
        password: document.getElementById('account-password').value,
      });
      try {
        localStorage.setItem(authKey, JSON.stringify(result));
      } catch {
        notify(
          'Browser storage is full or unavailable. You can save to your account, but this login cannot be remembered after closing the page.',
          true
        );
      }
      if (account?.username !== result.username) cloudPending = null;
      account = result;
      cloudReady = false;
      document.getElementById('account-password').value = '';
      journal = emptyJournal();
      configured = false;
      accountUI();
      if (bossChosen) await openCloud();
      else render();
    } catch (error) {
      errorBox.textContent = error.message || 'Could not connect. Please try again.';
      errorBox.hidden = false;
      cloudStatus('Could not open your account. Try logging in again or load the cloud save.');
      document.getElementById('auth-form').hidden = false;
    } finally {
      buttons.forEach((button) => {
        button.disabled = false;
      });
      accountBusy = false;
    }
  });
  document.getElementById('retry-cloud').addEventListener('click', async () => {
    if (cloudBusy || accountBusy || cloudLoading) return;
    if (cloudReady && cloudPending) await flushCloud();
    else {
      try {
        await openCloud();
      } catch (error) {
        cloudStatus(error.message);
      }
    }
  });
  document.getElementById('load-cloud').addEventListener('click', async () => {
    if (cloudBusy || accountBusy || cloudLoading) return;
    if (
      !confirm(
        'Load the cloud save and discard any unsynced changes on this device? Export a backup first to keep them.'
      )
    )
      return;
    try {
      await openCloud(true);
    } catch (error) {
      cloudStatus(error.message);
    }
  });
  document.getElementById('logout').addEventListener('click', async () => {
    if (cloudBusy || accountBusy || cloudLoading) return;
    if (
      cloudPending &&
      !confirm(
        localCopyCurrent
          ? 'Your changes have not synced. They will stay on this device for this account. Log out anyway?'
          : 'Your changes could not be saved locally or synced. Cancel and export a backup before logging out. Log out and discard these changes?'
      )
    )
      return;
    accountBusy = true;
    const wasFailed = loadFailed;
    const wasReady = cloudReady;
    loadFailed = true;
    cloudReady = false;
    render();
    try {
      await cloudRequest('/logout', 'POST');
    } catch (error) {
      if (error.status !== 401) {
        loadFailed = wasFailed;
        cloudReady = wasReady;
        render();
        cloudStatus('Could not log out securely. Retry when connected.');
        return;
      }
    } finally {
      accountBusy = false;
    }
    clearTimeout(cloudTimer);
    localStorage.removeItem(authKey);
    account = null;
    cloudPending = null;
    cloudReady = false;
    journal = emptyJournal();
    configured = false;
    loadFailed = false;
    try {
      const guest = localStorage.getItem(KEY);
      if (guest) {
        journal = validate(JSON.parse(guest));
        configured = true;
      }
    } catch {
      loadFailed = true;
    }
    closePaneEditor();
    setFields();
    render();
    accountUI();
    cloudStatus('Guest journal · saved only in this browser');
  });
  document.getElementById('import-local').addEventListener('click', () => {
    if (!cloudReady || cloudBusy || accountBusy || cloudLoading) return;
    try {
      const guest = localStorage.getItem(KEY);
      if (!guest)
        throw new Error('No guest journal in this browser. Use Restore backup to import a file.');
      const candidate = validate(JSON.parse(guest));
      if (
        !confirm(
          `Import this browser’s guest journal as your ${boss().name} hunt? This replaces the current account hunt. Export it first if you want to keep both.`
        )
      )
        return;
      persistJournal(candidate);
      journal = candidate;
      configured = true;
      closePaneEditor();
      setFields();
      render();
    } catch (error) {
      notify(error.message, true);
    }
  });
  addEventListener('online', () => {
    void flushCloud();
  });
  addEventListener('beforeunload', (event) => {
    if (cloudPending) {
      event.preventDefault();
      event.returnValue = '';
    }
  });
  if (account && bossChosen) {
    try {
      await openCloud();
    } catch (error) {
      cloudStatus(error.message || 'Could not connect. Retry when online.');
      document.getElementById('auth-form').hidden = false;
    }
  }
}

function initReset() {
  const dialog = document.getElementById('reset-dialog');
  const confirmation = document.getElementById('reset-confirmation');
  const submit = document.getElementById('reset-submit');
  const cancel = document.getElementById('reset-cancel');
  const errorBox = document.getElementById('reset-error');
  let revisionAtOpen = 0;
  document.getElementById('hard-reset').addEventListener('click', () => {
    if (cloudBusy || cloudLoading || accountBusy) {
      notify('Wait for the current save or account request to finish, then try again.');
      return;
    }
    resetOpen = true;
    accountBusy = true;
    revisionAtOpen = cloudRevision;
    clearTimeout(cloudTimer);
    confirmation.value = '';
    submit.disabled = true;
    errorBox.hidden = true;
    document.getElementById('reset-export').disabled = !configured;
    document.getElementById('reset-scope').textContent = account
      ? `Reset the ${boss().name} hunt for ${account.username} in this browser and in your account across devices. Your login and separate guest journal are kept. You must be online.`
      : 'Reset the guest hunt in this browser only. Account hunts and other browsers are not affected.';
    dialog.showModal();
  });
  confirmation.addEventListener('input', () => {
    submit.disabled = resetBusy || confirmation.value !== 'RESET';
  });
  document
    .getElementById('reset-export')
    .addEventListener('click', () => document.getElementById('export-journal').click());
  cancel.addEventListener('click', () => {
    if (!resetBusy) dialog.close();
  });
  dialog.addEventListener('cancel', (event) => {
    if (resetBusy) event.preventDefault();
  });
  dialog.addEventListener('close', () => {
    resetOpen = false;
    accountBusy = false;
    document.getElementById('hard-reset').focus();
    void flushCloud();
  });
  document.getElementById('reset-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!resetOpen || resetBusy || confirmation.value !== 'RESET') return;
    resetBusy = true;
    submit.disabled = true;
    cancel.disabled = true;
    confirmation.disabled = true;
    submit.textContent = 'Resetting…';
    errorBox.hidden = true;
    const wasFailed = loadFailed;
    loadFailed = true;
    render();
    let cloudReset = false;
    try {
      if (account) {
        const result = await cloudRequest(journalPath(), 'DELETE', {
          revision: revisionAtOpen,
          confirmation: 'RESET',
        });
        cloudRevision = result.revision;
        revisionAtOpen = result.revision;
        cloudReset = true;
      }
      // Cloud confirmation comes first; a failed request never deletes the local backup.
      localStorage.removeItem(account ? draftKey() : KEY);
      cloudPending = null;
      localCopyCurrent = true;
      journal = emptyJournal();
      configured = false;
      loadFailed = false;
      cloudReady = !!account;
      closePaneEditor();
      document.getElementById('start-kc').value = '';
      document.getElementById('setup-error').hidden = true;
      setFields();
      render();
      cloudStatus(
        account
          ? 'Hunt reset locally and in your account. Choose a starting KC to begin again.'
          : 'Guest hunt reset. Choose a starting KC to begin again.'
      );
      resetBusy = false;
      dialog.close();
      document.getElementById('start-kc').focus();
      notify('Hunt reset. You can start fresh.');
    } catch (error) {
      // An uncertain cloud result must not trigger an automatic upload of old progress.
      if (account) cloudReady = false;
      loadFailed = account ? true : wasFailed;
      render();
      errorBox.textContent = cloudReset
        ? 'Your account hunt was reset, but the browser copy could not be cleared. Allow browser storage and retry. Editing is paused.'
        : account
          ? `Reset could not be confirmed. Your local copy is kept. ${error.message} Cancel and load the cloud save before trying again.`
          : 'Browser storage could not be cleared. Your hunt has not been reset. Allow browser storage and try again.';
      errorBox.hidden = false;
    } finally {
      resetBusy = false;
      submit.disabled = confirmation.value !== 'RESET';
      cancel.disabled = false;
      confirmation.disabled = false;
      submit.textContent = 'Erase hunt permanently';
    }
  });
}
