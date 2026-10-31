/* Read-only artwork controls. No journal, account, appearance storage or analytics code. */
/* global GLASS_PREVIEW_BOSSES, GLASS_RENDERERS, GLASS_WINDOW_SHAPES, GLASS_WINDOW_FRAMES */
(() => {
  'use strict';
  const byId = (id) => document.getElementById(id);
  const esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]
    );
  const nativeMatchMedia = window.matchMedia.bind(window);
  window.matchMedia = (query) => {
    if (query !== '(prefers-reduced-motion: reduce)' || !byId('still').checked)
      return nativeMatchMedia(query);
    return { matches: true, media: query, addEventListener() {}, removeEventListener() {} };
  };
  const collections = Object.values(GLASS_PREVIEW_BOSSES).map((config) => ({
    config,
    renderer: GLASS_RENDERERS[config.id](config, {
      esc,
      getJournal: () => ({ base: 0, dropTiles: {} }),
    }),
  }));
  const windows = collections.flatMap((collection) =>
    collection.config.titles.map((title, scene) => ({ ...collection, title, scene }))
  );
  const viewer = byId('window-viewer');
  let selected = 0;
  function setReviewLink(key) {
    const url = new URL(location.href);
    if (key) url.searchParams.set('window', key);
    else url.searchParams.delete('window');
    history.replaceState(null, '', url);
  }
  byId('shape').innerHTML = Object.entries(GLASS_WINDOW_SHAPES)
    .map(([id, s]) => `<option value="${id}">${esc(s.label)}</option>`)
    .join('');
  byId('frame').innerHTML = Object.entries(GLASS_WINDOW_FRAMES)
    .map(([id, f]) => `<option value="${id}">${esc(f.label)}</option>`)
    .join('');
  function art(window, uid) {
    return window.renderer.art(
      Number(byId('panes').value),
      Number(byId('edition').value) * window.config.titles.length + window.scene,
      uid,
      false,
      { shape: byId('shape').value, frame: byId('frame').value }
    );
  }
  function render() {
    let position = 0;
    byId('pane-count').textContent = byId('panes').value;
    byId('collections').innerHTML = collections
      .map(
        ({ config }) =>
          `<section class="collection" id="${config.id}" data-boss="${config.id}" aria-labelledby="title-${config.id}"><header class="collection-heading"><h2 id="title-${config.id}">${esc(config.name)}</h2><p class="muted">${config.titles.length} windows</p></header><div class="windows">${config.titles
            .map((title, scene) => {
              const index = position++;
              return `<figure><button class="window-art" type="button" data-window="${index}" aria-label="View ${esc(title)} larger">${art(windows[index], `preview-${config.id}-${scene}`)}</button><figcaption><span class="scene-number">${String(scene + 1).padStart(2, '0')}</span>${esc(title)}</figcaption><p class="window-description">${esc(config.sceneDescriptions[scene])}</p></figure>`;
            })
            .join(
              ''
            )}</div><details class="sources"><summary>Image references</summary><div class="source-links">${config.sources.map(([name, url]) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(name)}</a>`).join('')}</div></details></section>`
      )
      .join('');
    if (viewer.open) show(selected);
  }
  function show(index) {
    selected = (index + windows.length) % windows.length;
    const window = windows[selected];
    byId('viewer-title').textContent = window.title;
    byId('viewer-collection').textContent = `${window.config.name} · Window ${window.scene + 1}`;
    byId('viewer-description').textContent = window.config.sceneDescriptions[window.scene];
    byId('viewer-position').textContent = `${selected + 1} / ${windows.length}`;
    byId('viewer-art').innerHTML = art(window, 'preview-detail');
    if (!viewer.open) viewer.showModal();
    document.body.classList.add('viewer-open');
    setReviewLink(window.config.sceneKeys[window.scene]);
  }
  byId('collections').addEventListener('click', (event) => {
    const button = event.target.closest('[data-window]');
    if (button) show(Number(button.dataset.window));
  });
  for (const id of ['shape', 'frame', 'edition', 'panes', 'still'])
    byId(id).addEventListener(id === 'panes' ? 'input' : 'change', render);
  byId('viewer-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('close', () => {
    document.body.classList.remove('viewer-open');
    viewer.classList.remove('zoomed');
    byId('viewer-zoom').setAttribute('aria-pressed', 'false');
    byId('viewer-zoom').textContent = 'Zoom in';
    setReviewLink(null);
  });
  byId('viewer-next').addEventListener('click', () => show(selected + 1));
  byId('viewer-previous').addEventListener('click', () => show(selected - 1));
  byId('viewer-zoom').addEventListener('click', () => {
    const zoom = viewer.classList.toggle('zoomed');
    byId('viewer-zoom').setAttribute('aria-pressed', String(zoom));
    byId('viewer-zoom').textContent = zoom ? 'Fit window' : 'Zoom in';
  });
  document.addEventListener('keydown', (event) => {
    if (viewer.open && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      show(selected + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  window.addEventListener('glass-motionchange', render);
  window.GLASS_ART_PREVIEW = { collections, windows, render, show };
  render();
  const requested = new URL(location.href).searchParams.get('window');
  const requestedIndex = windows.findIndex(
    ({ config, scene }) => config.sceneKeys[scene] === requested
  );
  if (requestedIndex >= 0) show(requestedIndex);
})();
