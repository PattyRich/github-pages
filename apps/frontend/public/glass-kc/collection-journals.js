/* Read-only collection snapshots. Tracking and cloud save ownership stay in account.js. */
/* exported createGlassCollectionReader */
function createGlassCollectionReader({
  catalog,
  getScope,
  getCurrent,
  readLocal,
  loadRemote,
  validate,
  onChange,
}) {
  let owner = null;
  let generation = 0;
  let loading = null;
  let lastLoaded = 0;
  let failures = 0;
  const locals = new Map();
  const remotes = new Map();
  const epochs = new Map();
  function scope() {
    const current = getScope();
    if (current !== owner) {
      owner = current;
      generation++;
      loading = null;
      lastLoaded = 0;
      failures = 0;
      locals.clear();
      remotes.clear();
      epochs.clear();
    }
    return current;
  }
  function localFor(id) {
    let serialized;
    try {
      serialized = readLocal(id);
      if (locals.get(id)?.serialized === serialized) return locals.get(id).value;
      const stored = serialized ? JSON.parse(serialized) : null;
      const envelope =
        owner === 'guest' && stored ? { journal: stored, revision: 0, pending: false } : stored;
      const value = envelope?.journal
        ? { ...envelope, journal: validate(envelope.journal, id) }
        : null;
      if (value && (!Number.isSafeInteger(value.revision) || value.revision < 0)) return null;
      locals.set(id, { serialized, value });
      return value;
    } catch {
      locals.set(id, { serialized, value: null });
      return null;
    }
  }
  function getJournal(id) {
    scope();
    const current = getCurrent();
    if (current?.id === id) {
      // Reading the authoritative active hunt invalidates earlier snapshot GETs,
      // including those still in flight when the hunt is reset or switched.
      epochs.set(id, (epochs.get(id) || 0) + 1);
      remotes.delete(id);
      return current.configured ? current.journal : null;
    }
    const local = localFor(id);
    const remote = remotes.get(id);
    if (!remote) return local?.journal || null;
    if (local && (remote.resetRevision || 0) > local.revision) return remote.journal;
    if (local && (local.pending !== false || local.revision > remote.revision))
      return local.journal;
    return remote.journal;
  }
  function collections() {
    return Object.values(catalog).map((config) => {
      const journal = getJournal(config.id);
      const total = journal
        ? journal.sessions.reduce((sum, session) => sum + session.kills, 0) +
          (journal.active?.kills || 0)
        : 0;
      return {
        id: config.id,
        name: config.name,
        shortName: config.shortName,
        titles: config.titles,
        total,
        journal,
      };
    });
  }
  async function refreshRemote(force = false) {
    const identity = scope();
    if (identity === 'guest' || loading || (!force && Date.now() - lastLoaded < 30000))
      return loading;
    const turn = generation;
    const pending = Promise.allSettled(
      Object.keys(catalog).map(async (id) => {
        const epoch = epochs.get(id) || 0;
        const result = await loadRemote(id);
        if (!Number.isSafeInteger(result.revision) || result.revision < 0)
          throw new Error('Invalid collection revision.');
        return [
          id,
          { ...result, journal: result.journal ? validate(result.journal, id) : null },
          epoch,
        ];
      })
    );
    loading = pending;
    onChange?.();
    const results = await pending;
    if (turn !== generation || identity !== getScope()) return;
    failures = 0;
    for (const result of results) {
      if (result.status === 'fulfilled') {
        const [id, snapshot, epoch] = result.value;
        if ((epochs.get(id) || 0) === epoch) remotes.set(id, snapshot);
      } else failures++;
    }
    loading = null;
    lastLoaded = Date.now();
    onChange?.();
  }
  return {
    getJournal,
    collections,
    refreshRemote,
    status() {
      scope();
      if (owner === 'guest') return 'Your guest hunts saved on this device.';
      if (loading) return 'Opening your account collections… Device saves are available now.';
      if (failures)
        return 'Some account hunts are unavailable. Showing the latest collections we can read.';
      return lastLoaded
        ? 'Your account collections, with this device’s latest changes.'
        : 'Your account hunts saved on this device.';
    },
  };
}
