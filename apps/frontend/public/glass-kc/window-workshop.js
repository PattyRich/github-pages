/* Display preferences stay separate from KC and accounts; backups carry a scoped copy. */
/* exported GLASS_APPEARANCE, createGlassWorkshop */
const GLASS_APPEARANCE = (() => {
  const key = 'praynr-glass-kc-appearance-v1';
  const defaults = { shape: 'lancet', frame: 'stone' };
  let current = { ...defaults };
  let lastSaved;
  const windows = {};
  const bosses = {};
  const validStyle = (value) =>
    Object.hasOwn(GLASS_WINDOW_SHAPES, value?.shape) &&
    Object.hasOwn(GLASS_WINDOW_FRAMES, value?.frame);
  const normalizeStyle = (value) => ({
    shape: value?.shape === 'rose' ? 'lancet' : value?.shape,
    frame: value?.frame,
  });
  function writeSaved() {
    try {
      const serialized = JSON.stringify({ ...current, bosses, windows });
      localStorage.setItem(key, serialized);
      lastSaved = serialized;
      return true;
    } catch {
      // A cosmetic preference must never block tracking.
      return false;
    }
  }
  function readSaved() {
    try {
      const serialized = localStorage.getItem(key);
      if (serialized === lastSaved) return;
      const saved = JSON.parse(serialized);
      lastSaved = serialized;
      current = { ...defaults };
      for (const id of Object.keys(windows)) delete windows[id];
      for (const id of Object.keys(bosses)) delete bosses[id];
      const savedShape = saved?.shape === 'rose' ? 'lancet' : saved?.shape;
      let migratedRose = saved?.shape === 'rose';
      if (Object.hasOwn(GLASS_WINDOW_SHAPES, savedShape)) current.shape = savedShape;
      if (Object.hasOwn(GLASS_WINDOW_FRAMES, saved?.frame)) current.frame = saved.frame;
      if (saved?.bosses && typeof saved.bosses === 'object' && !Array.isArray(saved.bosses)) {
        for (const [id, value] of Object.entries(saved.bosses)) {
          const style = normalizeStyle(value);
          if (/^[a-z0-9-]{1,32}$/.test(id) && validStyle(style)) {
            bosses[id] = style;
            migratedRose ||= value?.shape === 'rose';
          }
        }
      }
      if (saved?.windows && typeof saved.windows === 'object' && !Array.isArray(saved.windows)) {
        for (const [id, previousStyle] of Object.entries(saved.windows)) {
          const style = normalizeStyle(previousStyle);
          if (/^[a-z0-9-]{1,32}:(0|[1-9][0-9]{0,7})$/.test(id) && validStyle(style)) {
            windows[id] = { shape: style.shape, frame: style.frame };
            migratedRose ||= previousStyle?.shape === 'rose';
          }
        }
      }
      if (migratedRose) {
        writeSaved();
      }
    } catch {
      // The workshop remains usable when browser storage is unavailable.
    }
  }
  readSaved();
  addEventListener('storage', (event) => {
    if (event.key === key) readSaved();
  });
  function validateBackup(value, boss) {
    const error = () => {
      throw new Error('This backup contains invalid window styles.');
    };
    if (
      !value ||
      value.version !== 1 ||
      value.boss !== boss ||
      !value.windows ||
      typeof value.windows !== 'object' ||
      Array.isArray(value.windows)
    )
      error();
    const fallback = normalizeStyle(value.default);
    if (!validStyle(fallback)) error();
    const styles = {};
    for (const [index, entry] of Object.entries(value.windows)) {
      const style = normalizeStyle(entry);
      if (!/^(0|[1-9][0-9]{0,7})$/.test(index) || !validStyle(style)) error();
      styles[index] = style;
    }
    return { version: 1, boss, default: fallback, windows: styles };
  }
  return {
    // Older device-wide choices become the fallback for uncustomized windows.
    get: (boss, index) => ({ ...(windows[`${boss}:${index}`] || bosses[boss] || current) }),
    set(value, boss, index) {
      if (!validStyle(value)) return;
      // Preserve other windows customized in another open tracker or gallery tab.
      readSaved();
      if (boss === undefined) current = { shape: value.shape, frame: value.frame };
      else windows[`${boss}:${index}`] = { shape: value.shape, frame: value.frame };
      writeSaved();
    },
    exportBackup(boss) {
      readSaved();
      return {
        version: 1,
        boss,
        default: { ...(bosses[boss] || current) },
        windows: Object.fromEntries(
          Object.entries(windows)
            .filter(([id]) => id.startsWith(`${boss}:`))
            .map(([id, style]) => [id.slice(boss.length + 1), { ...style }])
        ),
      };
    },
    validateBackup,
    restoreBackup(value, boss) {
      const saved = validateBackup(value, boss);
      readSaved();
      for (const id of Object.keys(windows)) {
        if (id.startsWith(`${boss}:`)) delete windows[id];
      }
      bosses[boss] = saved.default;
      for (const [index, style] of Object.entries(saved.windows))
        windows[`${boss}:${index}`] = style;
      return writeSaved();
    },
  };
})();

function createGlassWorkshop(
  container,
  { preview, onChange, getTarget, getWindows, onSelect, title = 'Window workshop' }
) {
  const esc = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (character) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]
    );
  const shapeButtons = Object.entries(GLASS_WINDOW_SHAPES)
    .map(
      ([id, shape]) =>
        `<button type="button" data-shape="${id}" aria-pressed="false"><svg viewBox="-24 -14 408 594" aria-hidden="true"><path d="${shape.outline(0)}"/></svg><span>${shape.label}</span></button>`
    )
    .join('');
  const frameButtons = Object.entries(GLASS_WINDOW_FRAMES)
    .map(
      ([id, frame]) =>
        `<button type="button" data-frame="${id}" aria-pressed="false"><span class="frame-sample" aria-hidden="true" style="--sample-base:${frame.base};--sample-edge:${frame.edge};--sample-light:${frame.light}"></span><span>${frame.label}</span></button>`
    )
    .join('');
  const picker = getWindows
    ? `<div class="workshop-window"><label for="${esc(container.id)}-selection">Window to style</label><select id="${esc(container.id)}-selection"></select></div>`
    : '<p class="workshop-target"></p>';
  const previewMarkup = preview
    ? '<figure class="workshop-preview"><div></div><figcaption>Window preview</figcaption></figure>'
    : '';
  container.innerHTML = `<details class="window-workshop${preview ? '' : ' workshop-without-preview'}"><summary>${esc(title)} <span class="workshop-current"></span></summary>${picker}<div class="workshop-body">${previewMarkup}<div class="workshop-controls"><fieldset><legend>Window shape</legend><div class="workshop-shapes">${shapeButtons}</div></fieldset><fieldset><legend>Window frame</legend><div class="workshop-frames">${frameButtons}</div></fieldset><div class="workshop-footer"><p>Only this window changes. Saved on this device.</p><button type="button" data-reset-style>Reset style</button></div></div></div></details>`;
  const details = container.querySelector('details');
  function refresh() {
    const target = getTarget();
    const style = GLASS_APPEARANCE.get(target.boss, target.index);
    if (getWindows) {
      const select = container.querySelector('select');
      const options = getWindows();
      select.innerHTML = options
        .map(({ value, label }) => `<option value="${esc(value)}">${esc(label)}</option>`)
        .join('');
      select.value = String(target.value);
      select.disabled = options.length < 2;
    } else container.querySelector('.workshop-target').textContent = target.label;
    container.querySelector('.workshop-current').textContent =
      `${GLASS_WINDOW_SHAPES[style.shape].label} · ${GLASS_WINDOW_FRAMES[style.frame].label}`;
    container.querySelectorAll('[data-shape], [data-frame]').forEach((button) => {
      const type = button.dataset.shape ? 'shape' : 'frame';
      button.setAttribute('aria-pressed', String(button.dataset[type] === style[type]));
    });
    container.querySelector('[data-reset-style]').disabled =
      style.shape === 'lancet' && style.frame === 'stone';
    if (details.open && preview)
      updateGlassWindow(container.querySelector('.workshop-preview div'), preview());
  }
  details.addEventListener('toggle', refresh);
  if (getWindows) {
    container.querySelector('select').addEventListener('change', (event) => {
      onSelect(event.target.value);
      refresh();
    });
  }
  container.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const target = getTarget();
    if (button.hasAttribute('data-reset-style')) {
      GLASS_APPEARANCE.set({ shape: 'lancet', frame: 'stone' }, target.boss, target.index);
    } else {
      const type = button.dataset.shape ? 'shape' : 'frame';
      GLASS_APPEARANCE.set(
        { ...GLASS_APPEARANCE.get(target.boss, target.index), [type]: button.dataset[type] },
        target.boss,
        target.index
      );
    }
    refresh();
    onChange();
  });
  refresh();
  return { refresh };
}
