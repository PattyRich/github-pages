/* Ordered raid modes share pane progress; older kills remain unspecified. */
/* exported GLASS_RAID_MODES */
/* global GLASS_BOSSES */
const GLASS_RAID_MODES = (() => {
  const options = (id) => GLASS_BOSSES[id]?.raidModes || [];
  const enabled = (id) => options(id).length > 0;
  const modes = (id) => [...options(id).map((mode) => mode.id), 'unspecified'];
  const label = (id, mode, short = false) =>
    mode === 'unspecified'
      ? 'Mode unspecified'
      : options(id).find((item) => item.id === mode)?.[short ? 'shortLabel' : 'label'] || mode;
  const emptyCounts = (id) => Object.fromEntries(modes(id).map((mode) => [mode, 0]));
  const baseline = (journal, id = journal.boss) => ({
    ...emptyCounts(id),
    ...(journal.modeBase || { unspecified: journal.base }),
  });
  const runs = (session) =>
    session?.modeRuns || (session?.kills ? [{ mode: 'unspecified', kills: session.kills }] : []);
  const compact = (values) => {
    const result = [];
    for (const run of values) {
      const previous = result[result.length - 1];
      if (previous?.mode === run.mode) previous.kills += run.kills;
      else result.push({ mode: run.mode, kills: run.kills });
    }
    return result;
  };
  function validate(journal, id) {
    const allowed = modes(id);
    const hasModes =
      ['modeBase', 'recordMode'].some((key) => journal[key] !== undefined) ||
      [...journal.sessions, ...(journal.active ? [journal.active] : [])].some(
        (session) => session.modeRuns !== undefined
      );
    if (!enabled(id)) {
      if (hasModes) throw new Error('Raid modes do not belong to this hunt.');
      return;
    }
    if (
      journal.recordMode !== undefined &&
      !options(id).some((mode) => mode.id === journal.recordMode)
    )
      throw new Error('Invalid recording mode in this journal.');
    if (journal.modeBase !== undefined) {
      const values = journal.modeBase;
      if (
        !values ||
        typeof values !== 'object' ||
        Array.isArray(values) ||
        Object.keys(values).length !== allowed.length ||
        !allowed.every((mode) => Number.isSafeInteger(values[mode]) && values[mode] >= 0) ||
        Object.values(values).reduce((sum, count) => sum + count, 0) !== journal.base
      )
        throw new Error('Starting mode KCs must add up to the starting KC.');
    }
    for (const session of [...journal.sessions, ...(journal.active ? [journal.active] : [])]) {
      if (session.modeRuns === undefined) continue;
      if (
        !Array.isArray(session.modeRuns) ||
        session.modeRuns.length > 100000 ||
        !session.modeRuns.every(
          (run) =>
            run &&
            allowed.includes(run.mode) &&
            Number.isSafeInteger(run.kills) &&
            run.kills > 0 &&
            run.kills <= 100000
        ) ||
        session.modeRuns.reduce((sum, run) => sum + run.kills, 0) !== session.kills
      )
        throw new Error('Raid mode counts must add up to the session’s recorded raids.');
    }
  }
  function add(session, mode) {
    return {
      ...session,
      kills: session.kills + 1,
      modeRuns: compact([...runs(session), { mode, kills: 1 }]),
    };
  }
  function undo(session) {
    const values = runs(session).map((run) => ({ ...run }));
    if (--values[values.length - 1].kills === 0) values.pop();
    return { ...session, kills: session.kills - 1, modeRuns: values };
  }
  function counts(journal, id = journal.boss) {
    return { ...timeline(journal, id).counts };
  }
  function breakdown(session, id) {
    const values = emptyCounts(id);
    for (const run of runs(session)) values[run.mode] += run.kills;
    return modes(id)
      .filter((mode) => values[mode])
      .map(
        (mode) =>
          `${values[mode].toLocaleString()} ${mode === 'unspecified' ? 'unspecified' : label(id, mode, true)}`
      )
      .join(' · ');
  }
  const timelines = new WeakMap();
  function timeline(journal, id) {
    const cached = timelines.get(journal);
    if (cached?.id === id) return cached;
    const values = baseline(journal, id);
    const segments = [];
    let end = 0;
    for (const session of [
      ...(journal.sessions || []),
      ...(journal.active ? [journal.active] : []),
    ]) {
      for (const run of runs(session)) {
        segments.push({
          mode: run.mode,
          start: end,
          end: end + run.kills,
          before: values[run.mode],
          unspecified: values.unspecified,
        });
        end += run.kills;
        values[run.mode] += run.kills;
      }
    }
    const result = { id, counts: values, segments };
    timelines.set(journal, result);
    return result;
  }
  function at(journal, tile, id = journal.boss) {
    if (!enabled(id)) return null;
    if (!Number.isSafeInteger(tile) || tile < 1) return null;
    const { segments } = timeline(journal, id);
    let lo = 0,
      hi = segments.length;
    while (lo < hi) {
      const middle = Math.floor((lo + hi) / 2);
      if (segments[middle].end < tile) lo = middle + 1;
      else hi = middle;
    }
    const segment = segments[lo];
    return segment
      ? {
          mode: segment.mode,
          modeKc: segment.before + tile - segment.start,
          uncertain: segment.mode !== 'unspecified' && segment.unspecified > 0,
        }
      : null;
  }
  function kcLabel(journal, tile, id = journal.boss) {
    const entry = at(journal, tile, id);
    const combined = `KC ${(journal.base + tile).toLocaleString()}`;
    if (!entry) return combined;
    if (entry.mode === 'unspecified') return `${combined} · mode unspecified`;
    return `${label(id, entry.mode, true)} #${entry.modeKc.toLocaleString()}${entry.uncertain ? '+' : ''} · ${combined}`;
  }
  return {
    options,
    enabled,
    modes,
    label,
    baseline,
    runs,
    compact,
    validate,
    add,
    undo,
    counts,
    breakdown,
    at,
    kcLabel,
  };
})();
