/* Saved loot memories across hunts. This view never changes a journal. */
/* exported createGlassLootWall */
let glassLootWallSequence = 0;

function createGlassLootWall(container, { getDrops, onOpenMemory, getScope = () => 'guest' }) {
  const prefix = `glass-loot-${++glassLootWallSequence}`;
  const pageSize = 24;
  const esc = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (character) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]
    );
  const text = (value, limit) => (typeof value === 'string' ? value.slice(0, limit) : '');
  const imageAllowed = (image) =>
    typeof image === 'string' &&
    image.length <= 180000 &&
    /^data:image\/(jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(image);
  const numberFormat = new Intl.NumberFormat();
  const number = (value) => numberFormat.format(value);
  let drops = [];
  let visible = [];
  let page = 0;
  let openedDrop = null;
  let returnTarget = null;
  let loadFailed = false;
  let owner = getScope();

  container.classList.add('glass-loot-wall');
  container.setAttribute('aria-labelledby', `${prefix}-heading`);
  container.innerHTML = `
    <div class="glass-loot-heading">
      <div><h2 id="${prefix}-heading">Loot trophy wall</h2><p>Every pink pane has a story. Keep yours together here.</p></div>
      <p class="glass-loot-total"></p>
    </div>
    <div class="glass-loot-controls">
      <label class="glass-loot-search" for="${prefix}-search">Search memories<input id="${prefix}-search" type="search" maxlength="240" placeholder="Drop, boss or window…" autocomplete="off" /></label>
      <label for="${prefix}-boss">Hunt<select id="${prefix}-boss"><option value="">All hunts</option></select></label>
      <label for="${prefix}-order">Order within each hunt<select id="${prefix}-order"><option value="latest">Latest KC first</option><option value="earliest">Earliest KC first</option></select></label>
    </div>
    <p class="glass-loot-status" role="status" aria-live="polite" aria-atomic="true"></p>
    <ul class="glass-loot-grid" aria-label="Saved loot memories"></ul>
    <div class="glass-loot-empty" hidden></div>
    <div class="glass-loot-pages" hidden><button type="button" data-loot-page="previous">Previous</button><p></p><button type="button" data-loot-page="next">Next</button></div>
    <dialog class="glass-loot-dialog" aria-labelledby="${prefix}-memory-title" aria-describedby="${prefix}-memory-meta">
      <div class="glass-loot-dialog-heading"><p class="glass-loot-dialog-boss"></p><button type="button" data-loot-close autofocus>Close</button></div>
      <h2 id="${prefix}-memory-title"></h2>
      <p id="${prefix}-memory-meta" class="glass-loot-dialog-meta"></p>
      <div class="glass-loot-dialog-image"></div>
      <div class="glass-loot-dialog-footer"><p class="glass-loot-dialog-window"></p><button type="button" data-loot-open>View in window</button></div>
    </dialog>`;

  const search = container.querySelector(`#${prefix}-search`);
  const bossFilter = container.querySelector(`#${prefix}-boss`);
  const sort = container.querySelector(`#${prefix}-order`);
  const total = container.querySelector('.glass-loot-total');
  const status = container.querySelector('.glass-loot-status');
  const grid = container.querySelector('.glass-loot-grid');
  const empty = container.querySelector('.glass-loot-empty');
  const pages = container.querySelector('.glass-loot-pages');
  const dialog = container.querySelector('.glass-loot-dialog');
  const closeButton = dialog.querySelector('[data-loot-close]');
  const windowButton = dialog.querySelector('[data-loot-open]');

  function closeMemory(restoreFocus = true) {
    const target = returnTarget;
    returnTarget = null;
    openedDrop = null;
    if (dialog.open) dialog.close();
    dialog.querySelector('.glass-loot-dialog-image').replaceChildren();
    if (restoreFocus && target?.isConnected) target.focus({ preventScroll: true });
  }

  function openWindow(drop) {
    closeMemory(false);
    onOpenMemory(drop);
  }

  function openMemory(drop, target) {
    openedDrop = drop;
    returnTarget = target;
    dialog.querySelector('.glass-loot-dialog-boss').textContent = drop.bossName;
    dialog.querySelector('h2').textContent = drop.label || 'Drop memory';
    dialog.querySelector('.glass-loot-dialog-meta').textContent = `KC ${number(drop.kc)}`;
    dialog.querySelector('.glass-loot-dialog-window').textContent =
      `Window ${number(drop.windowIndex + 1)} · ${drop.windowTitle}`;
    const image = dialog.querySelector('.glass-loot-dialog-image');
    image.innerHTML = drop.image
      ? `<img src="${esc(drop.image)}" alt="Saved screenshot for ${esc(drop.label || 'this drop')}" />`
      : '<div class="glass-loot-written"><span aria-hidden="true">✧</span><p>Saved drop</p><p>This drop was saved without a screenshot.</p></div>';
    dialog.showModal();
    closeButton.focus();
  }

  function render() {
    const query = search.value.trim().toLocaleLowerCase();
    const direction = sort.value === 'earliest' ? 1 : -1;
    visible = drops
      .filter(
        (drop) =>
          (!bossFilter.value || drop.bossId === bossFilter.value) &&
          (!query || drop.searchText.includes(query))
      )
      .sort(
        (a, b) =>
          a.bossName.localeCompare(b.bossName) ||
          direction * (a.kc - b.kc) ||
          direction * (a.tile - b.tile)
      );
    const pageCount = Math.ceil(visible.length / pageSize);
    page = Math.max(0, Math.min(page, pageCount - 1));
    const offset = page * pageSize;
    const shown = visible.slice(offset, offset + pageSize);
    const count = visible.length;
    status.textContent = loadFailed
      ? 'Loot memories are temporarily unavailable.'
      : count
        ? `${number(count)} ${count === 1 ? 'memory' : 'memories'}${query || bossFilter.value ? ' matching your filters' : ' across your hunts'} · Showing ${number(offset + 1)}–${number(offset + shown.length)}`
        : drops.length
          ? 'No memories match these filters.'
          : 'Your first saved drop will appear here.';
    grid.innerHTML = shown
      .map((drop, index) => {
        const title = drop.label || 'Drop memory';
        const preview = drop.image
          ? `<img src="${esc(drop.image)}" alt="" loading="lazy" decoding="async" />`
          : '<span class="glass-loot-inscription" aria-hidden="true"><span>✧</span><span>Saved note</span></span>';
        return `<li class="glass-loot-card${drop.image ? '' : ' glass-loot-card-written'}"><button type="button" class="glass-loot-preview" data-loot-preview="${offset + index}" aria-label="View ${esc(title)} at KC ${number(drop.kc)}, ${esc(drop.bossName)}"><span class="glass-loot-picture">${preview}<span class="glass-loot-kind">${drop.image ? 'Screenshot' : 'Written memory'}</span></span><span class="glass-loot-name">${esc(title)}</span><span class="glass-loot-meta"><span>${esc(drop.bossShortName || drop.bossName)}</span><span>KC ${number(drop.kc)}</span></span></button><button type="button" class="glass-loot-window-link" data-loot-window="${offset + index}" aria-label="View ${esc(title)} in its ${esc(drop.bossName)} window">View in window <span aria-hidden="true">↗</span></button></li>`;
      })
      .join('');
    grid.hidden = !count;
    empty.hidden = Boolean(count) || loadFailed;
    empty.innerHTML = drops.length
      ? '<h3>No matching memories</h3><p>Try another drop name or hunt.</p><button type="button" data-loot-clear>Clear filters</button>'
      : '<span aria-hidden="true">✧</span><h3>Your first drop goes here</h3><p>Save a drop on a lit pane to add it here. Drops, screenshots and notes from all your bosses appear together.</p>';
    pages.hidden = pageCount <= 1;
    pages.querySelector('p').textContent = `Page ${number(page + 1)} of ${number(pageCount)}`;
    pages.querySelector('[data-loot-page="previous"]').disabled = page === 0;
    pages.querySelector('[data-loot-page="next"]').disabled = page >= pageCount - 1;
  }

  function refresh() {
    const identity = getScope();
    if (identity !== owner) {
      closeMemory();
      owner = identity;
      search.value = '';
      bossFilter.value = '';
      page = 0;
    }
    loadFailed = false;
    let source;
    try {
      source = getDrops();
    } catch {
      source = [];
      loadFailed = true;
    }
    drops = (Array.isArray(source) ? source : [])
      .filter(
        (drop) =>
          drop &&
          typeof drop.bossId === 'string' &&
          Number.isSafeInteger(drop.tile) &&
          drop.tile >= 0 &&
          Number.isSafeInteger(drop.kc) &&
          drop.kc >= 0 &&
          Number.isSafeInteger(drop.windowIndex) &&
          drop.windowIndex >= 0
      )
      .map((drop) => {
        const value = {
          ...drop,
          bossId: text(drop.bossId, 64),
          bossName: text(drop.bossName, 120),
          bossShortName: text(drop.bossShortName, 48),
          label: text(drop.label, 240),
          windowTitle: text(drop.windowTitle, 160),
          image: imageAllowed(drop.image) ? drop.image : '',
        };
        value.searchText =
          `${value.label} ${value.bossName} ${value.bossShortName} ${value.windowTitle} ${value.kc}`.toLocaleLowerCase();
        return value;
      });
    const bosses = [...new Map(drops.map((drop) => [drop.bossId, drop.bossName])).entries()].sort(
      (a, b) => a[1].localeCompare(b[1])
    );
    const previousBoss = bossFilter.value;
    bossFilter.innerHTML = `<option value="">All hunts</option>${bosses.map(([id, name]) => `<option value="${esc(id)}">${esc(name)}</option>`).join('')}`;
    if (bosses.some(([id]) => id === previousBoss)) bossFilter.value = previousBoss;
    total.textContent = `${number(drops.length)} ${drops.length === 1 ? 'memory' : 'memories'} · ${number(bosses.length)} ${bosses.length === 1 ? 'hunt' : 'hunts'}`;
    render();
    if (openedDrop) {
      const updated = drops.find(
        (drop) => drop.bossId === openedDrop.bossId && drop.tile === openedDrop.tile
      );
      if (
        !updated ||
        updated.label !== openedDrop.label ||
        updated.image !== openedDrop.image ||
        updated.kc !== openedDrop.kc
      ) {
        closeMemory();
      } else {
        const index = visible.findIndex(
          (drop) => drop.bossId === updated.bossId && drop.tile === updated.tile
        );
        returnTarget = grid.querySelector(`[data-loot-preview="${index}"]`);
        openedDrop = updated;
      }
    }
  }

  const resetPage = () => {
    page = 0;
    render();
  };
  search.addEventListener('input', resetPage);
  bossFilter.addEventListener('change', resetPage);
  sort.addEventListener('change', resetPage);
  closeButton.addEventListener('click', () => closeMemory());
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeMemory();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    ) {
      closeMemory();
    }
  });
  windowButton.addEventListener('click', () => {
    if (openedDrop) openWindow(openedDrop);
  });
  container.addEventListener('click', (event) => {
    const preview = event.target.closest('[data-loot-preview]');
    const windowLink = event.target.closest('[data-loot-window]');
    const paging = event.target.closest('[data-loot-page]');
    if (preview) openMemory(visible[Number(preview.dataset.lootPreview)], preview);
    else if (windowLink) openWindow(visible[Number(windowLink.dataset.lootWindow)]);
    else if (paging && !paging.disabled) {
      page += paging.dataset.lootPage === 'next' ? 1 : -1;
      render();
      grid.scrollIntoView({ block: 'start', behavior: 'instant' });
      grid.querySelector('button')?.focus({ preventScroll: true });
    } else if (event.target.closest('[data-loot-clear]')) {
      search.value = '';
      bossFilter.value = '';
      resetPage();
      search.focus();
    }
  });
  refresh();
  return { refresh };
}
