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
let accountSaveState = 'idle';
let accountExpanded = false;
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

function cloudStatus(message, state = 'idle') {
  accountSaveState = state;
  const status = document.getElementById('cloud-status');
  status.textContent = message;
  status.dataset.state = state;
  saveRecoveryUI();
}

function saveRecoveryUI() {
  const conflict = accountSaveState === 'conflict';
  const retry = accountSaveState === 'offline' || accountSaveState === 'error';
  const visible = !!account && bossChosen && (conflict || retry);
  document.getElementById('cloud-recovery').hidden = !visible;
  document.getElementById('retry-cloud').hidden = !visible || !retry;
  document.getElementById('retry-cloud').textContent =
    cloudReady && cloudPending ? 'Try saving again' : 'Reconnect to account';
  document.getElementById('load-cloud').hidden =
    !visible || !(conflict || accountSaveState === 'error');
  document.getElementById('save-device-backup').hidden = !visible || !configured;
  document.getElementById('cloud-recovery-help').textContent = conflict
    ? 'This device has changes that are not in your account copy. Download a backup to keep them. Use account copy replaces this device’s journal; it does not combine the two.'
    : accountSaveState === 'error'
      ? 'This device’s account copy could not be read. Reconnecting checks it again. Use account copy replaces it with the journal saved in your account.'
      : 'Your account copy could not be reached or updated. Retry keeps this device’s changes. Download a backup for an extra copy.';
  for (const id of ['retry-cloud', 'load-cloud', 'save-device-backup'])
    document.getElementById(id).disabled =
      !bossChosen || cloudBusy || cloudLoading || accountBusy || resetOpen;
  document.getElementById('import-local').disabled =
    !bossChosen || !cloudReady || cloudBusy || cloudLoading || accountBusy || resetOpen;
  accountPanelUI();
}

function accountPanelUI() {
  const needsLogin = !document.getElementById('auth-form').hidden;
  const expanded = !account || needsLogin || accountExpanded;
  document.getElementById('account-details').hidden = !expanded;
  document.getElementById('account-panel').dataset.collapsed = String(!expanded);
  document.getElementById('account-heading').hidden = !!account && !expanded;
  const toggle = document.getElementById('account-toggle');
  toggle.hidden = !account || needsLogin;
  toggle.setAttribute('aria-expanded', String(expanded));
  toggle.textContent = expanded ? 'Close account ▴' : 'Account ▾';
}

function accountLoadError(error) {
  cloudStatus(
    error.message || 'Could not reach your account. Your device copy has been kept.',
    error.status === 401 ? 'expired' : error.localSaveInvalid ? 'error' : 'offline'
  );
  if (error.status === 401) document.getElementById('auth-form').hidden = false;
  accountPanelUI();
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
      : 'Saved to your account · browser storage is full or unavailable. Your local copy could not be updated. Export a backup.',
    'saved'
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
  if (!cloudReady)
    throw new Error(
      'Reconnect to your account or resolve the save conflict before making changes.'
    );
  const clean = JSON.parse(JSON.stringify(validate(candidate)));
  storeAccountCopy(clean, cloudRevision, true);
  cloudPending = clean;
  cloudStatus(
    localCopyCurrent
      ? 'Saved on this device · saving to your account…'
      : 'Browser storage is full or unavailable · saving to your account. Keep this tab open until saved, or export a backup.',
    'saving'
  );
  clearTimeout(cloudTimer);
  cloudTimer = setTimeout(flushCloud, 400);
}

async function flushCloud() {
  if (!account || !cloudReady || !cloudPending || cloudBusy || resetOpen) return;
  cloudBusy = true;
  saveRecoveryUI();
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
          ? 'Another device changed your account copy. Your changes are still on this device. Choose which copy to use.'
          : 'Session expired. Your changes are still here. Log in again to save them to your account.',
        error.status === 409 ? 'conflict' : 'expired'
      );
    } else {
      cloudStatus(
        localCopyCurrent
          ? 'Saved on this device · account save failed. We’ll try again when you reconnect.'
          : 'Not saved locally or to your account. Keep this tab open and export a backup, then retry.',
        'offline'
      );
    }
  } finally {
    cloudBusy = false;
    saveRecoveryUI();
    if (succeeded && cloudPending) void flushCloud();
  }
}

function accountUI() {
  document.getElementById('auth-form').hidden = !!account;
  document.getElementById('account-actions').hidden = !account;
  document.getElementById('account-save-help').hidden = !account;
  document.getElementById('account-name').textContent = account
    ? `Signed in as ${account.username}`
    : 'Keep a light here. Find it again anywhere.';
  document.getElementById('account-heading').textContent = account
    ? 'Your account'
    : 'Your hunt, waiting for you.';
  let guestPresent = false;
  try {
    guestPresent = !!localStorage.getItem(KEY);
  } catch {
    /* Account access remains available. */
  }
  document.getElementById('import-local').hidden = !account || !bossChosen || !guestPresent;
  document.getElementById('storage-description').textContent = account
    ? 'Your KC, postcards and compressed screenshots save automatically on this device and to your account. Export a backup for an extra copy.'
    : 'Guest progress stays in this browser. Create an account to keep your hunt across devices, then choose Copy guest journal to account.';
  if (account && !bossChosen && !cloudPending)
    cloudStatus('Choose a boss to open your account journal.');
  else saveRecoveryUI();
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
      let candidate;
      try {
        candidate = fromMemory
          ? { journal: cloudPending, revision: cloudRevision, pending: true }
          : JSON.parse(stored);
        candidate.journal = validate(candidate.journal);
      } catch (error) {
        throw Object.assign(error, { localSaveInvalid: true });
      }
      if (!Number.isSafeInteger(candidate.revision) || candidate.revision < 0)
        throw Object.assign(
          new Error(
            'This device’s account copy could not be read. Use account copy to recover the saved journal.'
          ),
          { localSaveInvalid: true }
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
    cloudStatus('Opening your account journal…', 'loading');
    const user = await cloudRequest('/me');
    if (user.username !== account.username)
      throw Object.assign(new Error('Account mismatch. Log out and log in again.'), {
        status: 403,
      });
    const remote = await cloudRequest(journalPath());
    // Validate the replacement before changing pending data or either stored copy.
    const remoteJournal = remote.journal ? validate(remote.journal) : null;
    // A reset on another device invalidates even an unsynced pre-reset browser copy.
    if (local && remote.resetRevision > local.revision) {
      local = null;
      cloudPending = null;
      localStorage.removeItem(draftKey());
      notify('This hunt was reset on another device. Opened the current account copy.', true);
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
      if (remoteJournal && canonical(remoteJournal) === canonical(pending.journal)) pending = null;
    }
    cloudRevision = pending ? pending.revision : remote.revision;
    cloudPending = pending?.journal || null;
    journal = cloudPending || remoteJournal || emptyJournal();
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
      cloudStatus(
        'Another device changed your account copy. Your changes are still on this device. Choose which copy to use.',
        'conflict'
      );
    } else if (cloudPending)
      cloudStatus('Device changes recovered · saving to your account…', 'saving');
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
        ? 'Showing this device’s save · log in again to save changes to your account.'
        : error.status === 403
          ? error.message
          : localCopyCurrent
            ? 'Showing this device’s save · account unavailable. Changes stay here and save to your account when you reconnect.'
            : 'Account unavailable and browser storage is full. Keep this tab open and export your changes.',
      error.status === 401 ? 'expired' : 'offline'
    );
  } finally {
    cloudLoading = false;
    saveRecoveryUI();
  }
}

async function initAccount() {
  initReset();
  accountUI();
  document.getElementById('account-toggle').addEventListener('click', () => {
    accountExpanded = !accountExpanded;
    accountPanelUI();
  });
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
      accountExpanded = false;
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
      accountLoadError(error);
      document.getElementById('auth-form').hidden = false;
    } finally {
      buttons.forEach((button) => {
        button.disabled = false;
      });
      accountBusy = false;
      saveRecoveryUI();
    }
  });
  document.getElementById('retry-cloud').addEventListener('click', async () => {
    if (!account || !bossChosen || cloudBusy || accountBusy || cloudLoading || resetOpen) return;
    if (cloudReady && cloudPending) await flushCloud();
    else {
      try {
        await openCloud();
      } catch (error) {
        accountLoadError(error);
      }
    }
  });
  document.getElementById('load-cloud').addEventListener('click', async () => {
    if (!account || !bossChosen || cloudBusy || accountBusy || cloudLoading || resetOpen) return;
    if (
      !confirm(
        `Replace this device’s ${boss().name} journal with the copy saved in your account? Changes that have not reached your account will be discarded. Download this device’s backup first to keep them. This does not combine the two copies.`
      )
    )
      return;
    try {
      await openCloud(true);
    } catch (error) {
      accountLoadError(error);
    }
  });
  document.getElementById('save-device-backup').addEventListener('click', () => {
    document.getElementById('export-journal').click();
  });
  document.getElementById('logout').addEventListener('click', async () => {
    if (cloudBusy || accountBusy || cloudLoading) return;
    if (
      cloudPending &&
      !confirm(
        localCopyCurrent
          ? 'Your changes have not reached your account yet. They will stay on this device for this account. Log out anyway?'
          : 'Your changes could not be saved on this device or to your account. Cancel and export a backup before logging out. Log out and discard these changes?'
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
          `Copy this browser’s guest journal to your ${boss().name} account journal? This replaces the account journal, including its KC, drops and screenshots. Export a backup first to keep both. The guest copy stays in this browser.`
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
    if (!account || !bossChosen || cloudBusy || cloudLoading || accountBusy || resetOpen) return;
    if (accountSaveState === 'conflict' || accountSaveState === 'expired') return;
    if (cloudReady && cloudPending) void flushCloud();
    else if (
      document.getElementById('pane-editor').hidden &&
      ['offline', 'error'].includes(accountSaveState)
    )
      void openCloud().catch(accountLoadError);
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
      accountLoadError(error);
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
    saveRecoveryUI();
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
          ? `Reset could not be confirmed. Your local copy is kept. ${error.message} Cancel and reconnect to your account before trying again.`
          : 'Browser storage could not be cleared. Your hunt has not been reset. Allow browser storage and try again.';
      errorBox.hidden = false;
      if (account)
        cloudStatus(
          'Reset could not be completed. Your device copy is kept. Reconnect before continuing.',
          error.status === 409 ? 'conflict' : error.status === 401 ? 'expired' : 'offline'
        );
    } finally {
      resetBusy = false;
      submit.disabled = confirmation.value !== 'RESET';
      cancel.disabled = false;
      confirmation.disabled = false;
      submit.textContent = 'Erase hunt permanently';
    }
  });
}
