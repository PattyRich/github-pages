/* Sanctuary overview. Journal reads and window detail navigation belong to the host. */
(function () {
  let instanceCount = 0;
  const PAGE_SIZE = 8;

  window.createGlassSanctuaryWings = function (container, options) {
    const { getCollections, renderWindow, colorFor, onOpen, initialBoss } = options;
    const instance = ++instanceCount;
    const number = new Intl.NumberFormat();
    let selectedId = typeof initialBoss === 'function' ? initialBoss() : initialBoss;
    let page = null;
    let renderCount = 0;
    let collections = [];

    const esc = (value) =>
      String(value ?? '').replace(
        /[&<>"']/g,
        (character) =>
          ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]
      );
    const safeTotal = (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed)
        ? Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, Math.floor(parsed)))
        : 0;
    };
    const safeColor = (value) =>
      /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(String(value)) ? value : '#dbceb4';
    const earnedCount = (collection) => Math.ceil(collection.total / 100);
    const sceneTitle = (collection, index) =>
      collection.titles?.[index % (collection.titles.length || 1)] ||
      `Window ${number.format(index + 1)}`;

    container.classList.add('sanctuary-wings');
    container.innerHTML = `
      <nav class="wing-navigation" aria-label="Sanctuary wings"></nav>
      <section class="wing-room" aria-labelledby="wing-name-${instance}">
        <div class="wing-heading">
          <div>
            <p class="wing-eyebrow">Your collected light</p>
            <h2 id="wing-name-${instance}"></h2>
          </div>
          <p class="wing-summary"></p>
        </div>
        <div class="wing-panorama" tabindex="0" aria-label="Earned windows; scroll to explore">
          <div class="wing-track"></div>
        </div>
        <div class="wing-bottom">
          <p class="wing-guidance">Choose a window to step closer. Scroll along the wall to explore.</p>
          <div class="wing-paging" aria-label="Window pages">
            <button type="button" data-wing-page="previous" aria-label="Previous wall">← Previous wall</button>
            <span class="wing-page-label" aria-live="polite" aria-atomic="true"></span>
            <button type="button" data-wing-page="next" aria-label="Next wall">Next wall →</button>
          </div>
        </div>
      </section>`;

    const navigation = container.querySelector('.wing-navigation');
    const heading = container.querySelector(`#wing-name-${instance}`);
    const summary = container.querySelector('.wing-summary');
    const panorama = container.querySelector('.wing-panorama');
    const track = container.querySelector('.wing-track');
    const guidance = container.querySelector('.wing-guidance');
    const paging = container.querySelector('.wing-paging');
    const pageLabel = container.querySelector('.wing-page-label');
    const previous = container.querySelector('[data-wing-page="previous"]');
    const next = container.querySelector('[data-wing-page="next"]');

    function paintNavigation() {
      navigation.innerHTML = collections
        .map((collection) => {
          const complete = Math.floor(collection.total / 100);
          const current = collection.total % 100;
          const detail = complete
            ? `${number.format(complete)} complete${current ? ' · in progress' : ''}`
            : current
              ? `${current} panes lit`
              : 'Waiting for light';
          return `<button type="button" class="wing-choice" data-wing="${esc(collection.id)}" aria-pressed="${collection.id === selectedId}">
            <span>${esc(collection.shortName || collection.name)}</span>
            <small>${detail}</small>
          </button>`;
        })
        .join('');
    }

    function paintRoom(resetScroll = false) {
      const collection = collections.find((entry) => entry.id === selectedId);
      if (!collection) {
        heading.textContent = 'The sanctuary';
        summary.textContent = '';
        track.innerHTML = '<p class="wing-empty-message">Your collection will appear here.</p>';
        paging.hidden = true;
        guidance.hidden = true;
        return;
      }

      const count = earnedCount(collection);
      const completed = Math.floor(collection.total / 100);
      const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));
      page = Math.max(0, Math.min(page === null ? pageCount - 1 : page, pageCount - 1));
      heading.textContent = `${collection.name} wing`;
      summary.textContent = count
        ? `${number.format(completed)} completed ${completed === 1 ? 'window' : 'windows'} · ${number.format(collection.total)} panes lit`
        : 'A quiet place for your next hunt';
      track.classList.toggle('wing-track-empty', count === 0);
      panorama.setAttribute(
        'aria-label',
        `${collection.name} sanctuary wing${count ? '; scroll to explore earned windows' : ''}`
      );
      paging.hidden = count <= PAGE_SIZE;
      guidance.hidden = count === 0;

      if (!count) {
        track.innerHTML = `<div class="wing-empty">
          <svg class="wing-empty-glass" viewBox="0 0 150 210" aria-hidden="true">
            <path d="M24 184V80Q24 37 75 14Q126 37 126 80V184Z" fill="none" stroke="currentColor" stroke-width="10"/>
            <path d="M34 184V82Q34 49 75 25Q116 49 116 82V184ZM75 25V184M34 92H116M34 137H116M75 92L34 137M75 137L116 184M75 92L116 137M75 137L34 184" fill="none" stroke="currentColor" stroke-width="2"/>
            <path d="M15 193H135" stroke="currentColor" stroke-width="8"/>
          </svg>
          <div>
            <h3>Every window begins in the dark.</h3>
            <p>Record your first hunt in the journal to place a pane in this wing. Every 100 panes completes a window worth keeping.</p>
          </div>
        </div>`;
        pageLabel.textContent = '';
        return;
      }

      const start = page * PAGE_SIZE;
      const end = Math.min(start + PAGE_SIZE, count);
      const windows = [];
      const renderId = ++renderCount;
      for (let index = start; index < end; index++) {
        const pieces = Math.min(100, collection.total - index * 100);
        const title = sceneTitle(collection, index);
        const uid = `wing-${instance}-${renderId}-${index}`;
        const color = safeColor(colorFor(collection.id, index));
        windows.push(`<div class="wing-bay" style="--wing-glow:${color};--wing-strength:${(0.15 + (pieces / 100) * 0.6).toFixed(2)}">
          <div class="wing-pier" aria-hidden="true"></div>
          <div class="wing-light" aria-hidden="true"></div>
          <button class="wing-window" type="button" data-wing-window="${index}" aria-label="Open window ${number.format(index + 1)}: ${esc(title)}, ${pieces === 100 ? 'complete' : `${pieces} of 100 panes lit`}">
            <span class="wing-art" aria-hidden="true">${renderWindow(collection.id, index, pieces, uid)}</span>
            <span class="wing-window-caption">
              <span class="wing-window-number">Window ${number.format(index + 1)}</span>
              <span class="wing-window-title">${esc(title)}</span>
              <span class="wing-window-state ${pieces === 100 ? 'wing-complete' : ''}">${pieces === 100 ? 'Complete · 100 panes' : `Growing · ${pieces}/100 panes`}</span>
            </span>
          </button>
        </div>`);
      }
      track.innerHTML = windows.join('');
      previous.disabled = page === 0;
      next.disabled = page >= pageCount - 1;
      pageLabel.textContent = `${number.format(start + 1)}–${number.format(end)} of ${number.format(count)} windows`;
      if (resetScroll) panorama.scrollLeft = 0;
    }

    function refresh() {
      const focusedWing = navigation.contains(document.activeElement)
        ? document.activeElement.dataset.wing
        : null;
      collections = (getCollections() || []).map((collection) => ({
        ...collection,
        total: safeTotal(collection.total),
      }));
      if (!collections.some((collection) => collection.id === selectedId)) {
        selectedId = collections[0]?.id;
        page = null;
      }
      paintNavigation();
      paintRoom();
      if (focusedWing)
        navigation
          .querySelector(`[data-wing="${CSS.escape(focusedWing)}"]`)
          ?.focus({ preventScroll: true });
    }

    function selectWing(bossId) {
      if (!collections.some((collection) => collection.id === bossId)) return;
      selectedId = bossId;
      page = null;
      paintNavigation();
      paintRoom(true);
    }

    container.addEventListener('click', (event) => {
      const choice = event.target.closest('[data-wing]');
      if (choice && navigation.contains(choice)) {
        selectWing(choice.dataset.wing);
        navigation.querySelector(`[data-wing="${CSS.escape(selectedId)}"]`)?.focus();
        return;
      }
      const pageButton = event.target.closest('[data-wing-page]');
      if (pageButton && paging.contains(pageButton) && !pageButton.disabled) {
        page += pageButton.dataset.wingPage === 'next' ? 1 : -1;
        paintRoom(true);
        return;
      }
      const selectedWindow = event.target.closest('[data-wing-window]');
      if (selectedWindow && track.contains(selectedWindow)) {
        onOpen(selectedId, Number(selectedWindow.dataset.wingWindow));
      }
    });

    refresh();
    return { refresh, selectWing };
  };
})();
