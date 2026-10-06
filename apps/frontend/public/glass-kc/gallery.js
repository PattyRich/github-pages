/* Unlisted artwork browser. It uses the shared renderers without loading journal or account code. */
(() => {
  'use strict';
  const esc = (value) =>
    String(value).replace(/[&<>"']/g, (character) => {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  const collections = Object.values(GLASS_BOSSES)
    .filter((config) => GLASS_RENDERERS[config.id])
    .map((config) => ({
      config,
      renderer: GLASS_RENDERERS[config.id](config, {
        esc,
        getJournal: () => ({ base: 0, dropTiles: {} }),
      }),
    }));
  const windows = collections.flatMap((collection) =>
    collection.config.titles.map((title, scene) => ({ ...collection, title, scene }))
  );
  const byId = (id) => document.getElementById(id);
  const viewer = byId('window-viewer');
  const editionSelect = byId('glass-edition');
  let edition = 0;
  let currentWindow = 0;
  function styleTarget() {
    const window = windows[currentWindow];
    const index = edition * window.config.titles.length + window.scene;
    return {
      boss: window.config.id,
      index,
      value: currentWindow,
      label: `${window.config.name} · Window ${String(index + 1).padStart(2, '0')} · ${window.title}`,
    };
  }

  // The journal reserves main/gallery-* IDs for drop buttons. Exhibit IDs keep every pane read-only.
  function artwork(window, uid) {
    const index = edition * window.config.titles.length + window.scene;
    return window.renderer.art(
      100,
      index,
      uid,
      false,
      GLASS_APPEARANCE.get(window.config.id, index)
    );
  }

  function renderCollections() {
    let position = 0;
    byId('collections').innerHTML = collections
      .map(({ config }) => {
        const figures = config.titles
          .map((title) => {
            const index = position++;
            const window = windows[index];
            return `<figure><button type="button" class="window-art" data-window="${index}" aria-label="View ${esc(title)} larger">${artwork(window, `exhibit-${config.id}-${window.scene}`)}</button><figcaption>${esc(title)}</figcaption><button type="button" class="window-style-button" data-style-window="${index}" aria-label="Style ${esc(title)}">Style window</button></figure>`;
          })
          .join('');
        return `<section class="collection" id="${esc(config.id)}" aria-labelledby="collection-${esc(config.id)}"><header class="collection-heading"><h2 id="collection-${esc(config.id)}">${esc(config.name)}</h2><p class="muted">${config.titles.length} windows · ${esc(config.shortName)}</p></header><div class="windows">${figures}</div></section>`;
      })
      .join('');
  }

  function renderViewer(position) {
    currentWindow = (position + windows.length) % windows.length;
    const window = windows[currentWindow];
    byId('viewer-title').textContent = window.title;
    byId('viewer-collection').textContent = `${window.config.name} · Edition ${edition + 1}`;
    byId('viewer-art').innerHTML = artwork(window, 'detail-exhibit');
    byId('viewer-description').textContent = window.config.sceneDescriptions[window.scene];
    byId('viewer-position').textContent = `${currentWindow + 1} / ${windows.length}`;
    byId('viewer-art').scrollTo(0, 0);
    workshop.refresh();
    viewerWorkshop.refresh();
  }

  function setZoom(zoomed) {
    viewer.classList.toggle('zoomed', zoomed);
    byId('viewer-zoom').setAttribute('aria-pressed', String(zoomed));
    byId('viewer-zoom').textContent = zoomed ? 'Fit window' : 'Zoom in';
    byId('viewer-art').scrollTo(0, 0);
  }

  byId('gallery-count').textContent =
    `${windows.length} windows · ${collections.length} collections`;
  byId('collection-links').innerHTML = collections
    .map(({ config }) => `<a href="#${esc(config.id)}">${esc(config.name)}</a>`)
    .join('');
  editionSelect.innerHTML = Array.from(
    { length: Math.max(...collections.map(({ config }) => config.palettes.length)) },
    (_, index) => `<option value="${index}">Edition ${index + 1}</option>`
  ).join('');
  const workshop = createGlassWorkshop(byId('window-workshop'), {
    getTarget: styleTarget,
    getWindows: () =>
      windows.map((window, value) => ({
        value,
        label: `${window.config.name} · ${window.title}`,
      })),
    onSelect: (value) => {
      currentWindow = Number(value);
    },
    preview: () => artwork(windows[currentWindow], 'workshop-preview'),
    onChange: () => {
      renderCollections();
      if (viewer.open) renderViewer(currentWindow);
    },
  });
  const viewerWorkshop = createGlassWorkshop(byId('viewer-workshop'), {
    title: 'Style this window',
    getTarget: styleTarget,
    onChange: () => {
      renderCollections();
      renderViewer(currentWindow);
    },
  });
  byId('window-workshop').querySelector('details').open = true;
  renderCollections();

  addEventListener('glass-motionchange', () => {
    renderCollections();
    workshop.refresh();
    if (viewer.open) renderViewer(currentWindow);
  });

  editionSelect.addEventListener('change', () => {
    edition = Number(editionSelect.value);
    renderCollections();
    workshop.refresh();
  });
  byId('collections').addEventListener('click', (event) => {
    const styleButton = event.target.closest('button[data-style-window]');
    if (styleButton) {
      currentWindow = Number(styleButton.dataset.styleWindow);
      const details = byId('window-workshop').querySelector('details');
      details.open = true;
      workshop.refresh();
      details.querySelector('summary').focus({ preventScroll: true });
      details.scrollIntoView({ block: 'center' });
      return;
    }
    const button = event.target.closest('button[data-window]');
    if (!button) return;
    setZoom(false);
    renderViewer(Number(button.dataset.window));
    document.body.classList.add('viewer-open');
    viewer.showModal();
  });
  byId('viewer-close').addEventListener('click', () => viewer.close());
  byId('viewer-zoom').addEventListener('click', () =>
    setZoom(!viewer.classList.contains('zoomed'))
  );
  byId('viewer-previous').addEventListener('click', () => renderViewer(currentWindow - 1));
  byId('viewer-next').addEventListener('click', () => renderViewer(currentWindow + 1));
  viewer.addEventListener('close', () => document.body.classList.remove('viewer-open'));
  viewer.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    renderViewer(currentWindow + (event.key === 'ArrowLeft' ? -1 : 1));
  });
  viewer.addEventListener('click', (event) => {
    if (event.target !== viewer) return;
    const bounds = viewer.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      viewer.close();
  });
  if (location.hash) {
    document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'start' });
  }
})();
