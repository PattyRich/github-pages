/* A brief ceremony for a newly recorded 100th pane. No journal or storage state. */
/* exported createGlassWindowCompletion */
let glassCompletionSequence = 0;

function createGlassWindowCompletion(container, { onVisit } = {}) {
  if (!container) return { play() {}, dismiss() {} };

  const stage = container.closest('.window-stage');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let finishTimer;
  let announcementFrame;
  let light;

  container.classList.add('glass-window-completion');
  container.hidden = true;
  container.innerHTML = `<div class="glass-completion-banner">
    <span class="glass-completion-emblem" aria-hidden="true">✧</span>
    <div class="glass-completion-announcement" role="status" aria-live="polite" aria-atomic="true">
      <strong class="glass-completion-title"></strong>
      <span class="glass-completion-detail"></span>
    </div>
    <div class="glass-completion-actions">
      <button class="glass-completion-visit" type="button">Visit sanctuary <span aria-hidden="true">→</span></button>
      <button class="glass-completion-dismiss" type="button" aria-label="Dismiss window completion">×</button>
    </div>
  </div>`;

  const titleNode = container.querySelector('.glass-completion-title');
  const detailNode = container.querySelector('.glass-completion-detail');
  const visitButton = container.querySelector('.glass-completion-visit');
  visitButton.hidden = typeof onVisit !== 'function';

  function finishLight() {
    clearTimeout(finishTimer);
    stage?.classList.remove('glass-completion-active');
    light?.remove();
    light = null;
  }

  function dismiss() {
    finishLight();
    cancelAnimationFrame(announcementFrame);
    container.hidden = true;
    titleNode.textContent = '';
    detailNode.textContent = '';
    stage?.style.removeProperty('--glass-completion-color');
    container.style.removeProperty('--glass-completion-color');
  }

  // The light follows the actual selected outline, including alternate arches.
  // It is a temporary sibling of the artwork SVG and never touches its panes.
  function createLight(artwork) {
    const svg = artwork?.querySelector('svg');
    const outline = svg?.querySelector(':scope > path[fill="none"]');
    if (!svg || !outline) return null;

    const namespace = 'http://www.w3.org/2000/svg';
    const make = (tag, attributes = {}) => {
      const node = document.createElementNS(namespace, tag);
      for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
      return node;
    };
    const id = `glass-completion-${++glassCompletionSequence}`;
    const overlay = make('svg', {
      class: 'glass-completion-light',
      viewBox: svg.getAttribute('viewBox'),
      'aria-hidden': 'true',
      focusable: 'false',
    });
    const definitions = make('defs');
    const clip = make('clipPath', { id: `${id}-clip` });
    clip.append(make('path', { d: outline.getAttribute('d') }));
    const gradient = make('linearGradient', {
      id: `${id}-glow`,
      x1: '0',
      y1: '0',
      x2: '0',
      y2: '1',
    });
    for (const [offset, opacity] of [
      ['0', '0'],
      ['.45', '.85'],
      ['1', '0'],
    ]) {
      gradient.append(
        make('stop', { offset, 'stop-color': 'currentColor', 'stop-opacity': opacity })
      );
    }
    definitions.append(clip, gradient);
    const glass = make('g', { 'clip-path': `url(#${id}-clip)` });
    glass.append(
      make('rect', {
        class: 'glass-completion-wave',
        x: '-24',
        y: '-10',
        width: '408',
        height: '190',
        fill: `url(#${id}-glow)`,
      })
    );
    overlay.append(definitions, glass);
    artwork.append(overlay);
    return overlay;
  }

  function play({ title = '', windowNumber = 1, bossName = '', color } = {}) {
    dismiss();
    const number = Math.max(1, Math.trunc(Number(windowNumber)) || 1);
    const glow = color && CSS.supports('color', color) ? color : 'var(--bright)';
    stage?.style.setProperty('--glass-completion-color', glow);
    container.style.setProperty('--glass-completion-color', glow);
    container.hidden = false;
    announcementFrame = requestAnimationFrame(() => {
      titleNode.textContent = `Window ${String(number).padStart(2, '0')} complete`;
      detailNode.textContent = [title, bossName].filter(Boolean).join(' · ');
    });

    if (stage && !reducedMotion.matches) {
      const artwork = stage.querySelector('#window-art');
      light = createLight(artwork);
      // Repeated completions restart the ceremony after safely removing the old one.
      void stage.offsetWidth;
      stage.classList.add('glass-completion-active');
      finishTimer = setTimeout(finishLight, 5400);
    }
  }

  visitButton.addEventListener('click', () => {
    dismiss();
    onVisit?.();
  });
  container.querySelector('.glass-completion-dismiss').addEventListener('click', dismiss);

  // The banner stays available after the light fades. The host dismisses it when
  // the next kill begins a window or when changing/resetting the active hunt.
  return { play, dismiss };
}
