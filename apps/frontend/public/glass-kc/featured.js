/* global GLASS_BOSSES, GLASS_RENDERERS */
/* Home-page exhibit. No account, journal, API or device-preference access. */
(() => {
  const scenes = [
    ['shadow-window', 'toa', 0, 'gilded'],
    ['prif-window', 'cg', 2, 'ivory'],
    ['sleepwalkers-window', 'pnm', 5, 'ivory'],
    ['zebak-window', 'toa', 4, 'ivory'],
    ['olm-window', 'cox', 0, 'ivory'],
  ];
  const escape = (value) =>
    String(value).replace(/[&<>"']/g, (character) => {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  const exhibits = scenes.map(([target, boss, scene, frame]) => ({
    target,
    scene,
    frame,
    renderer: GLASS_RENDERERS[boss](GLASS_BOSSES[boss], {
      esc: escape,
      getJournal: () => ({ base: 0, dropTiles: {} }),
    }),
  }));
  const rotatingExhibits = exhibits.slice(1);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const svgNamespace = 'http://www.w3.org/2000/svg';
  const sceneDuration = 16000;
  const revealDelay = 900;
  const revealDuration = 12500;
  let currentScene = 0;
  let rotationTimer;
  let sceneElapsed = 0;
  let lastTick = 0;

  function prepareProgress(exhibit) {
    const { target, scene, frame, renderer } = exhibit;
    const svg = document.getElementById(target).querySelector('svg');
    const clip = svg.querySelector(`#lit-${target}`);
    const panes = Array.from(svg.querySelectorAll('.pane'));
    const litPanes = Array.from(clip.children);
    const empty = document.createElement('template');
    empty.innerHTML = renderer.art(0, scene, `${target}-empty`, false, {
      shape: 'lancet',
      frame,
    });
    const sockets = Array.from(
      empty.content.querySelector('[data-window-ornaments]').children
    ).filter((element) => element.localName === 'circle');
    const ornaments = Array.from(svg.querySelector('[data-window-ornaments]').children)
      .filter((element) => element.hasAttribute('data-ornament'))
      .map((ornament, index) => {
        const socket = sockets[index].cloneNode(true);
        const slot = document.createElementNS(svgNamespace, 'g');
        ornament.replaceWith(slot);
        slot.append(socket, ornament);
        return { socket, ornament };
      });
    exhibit.progress = {
      svg,
      clip,
      panes,
      litPanes,
      ornaments,
      label: svg.getAttribute('aria-label'),
      count: 100,
    };
  }

  function setProgress(exhibit, count) {
    const progress = exhibit.progress;
    if (progress.count === count) return;
    const { svg, clip, panes, litPanes, ornaments, label } = progress;
    // Update the earned-pane mask in place so subject animations never restart.
    if (count < progress.count) clip.replaceChildren(...litPanes.slice(0, count));
    else clip.append(...litPanes.slice(progress.count, count));
    for (const [index, pane] of panes.entries()) {
      pane.classList.toggle('filled', index < count);
      pane.setAttribute('stroke-width', index < count ? '0.8' : '1.3');
    }
    for (const [index, { socket, ornament }] of ornaments.entries()) {
      const earned = count >= (index + 1) * 25;
      socket.style.display = earned ? 'none' : '';
      ornament.style.display = earned ? '' : 'none';
    }
    svg.setAttribute('data-preview-panes', String(count));
    svg.setAttribute(
      'aria-label',
      label.replace(
        /100 of 100 pieces lit, 4 of 4 frame ornaments earned\./,
        `${count} of 100 pieces lit, ${Math.floor(count / 25)} of 4 frame ornaments earned.`
      )
    );
    progress.count = count;
  }

  function showScene(index) {
    currentScene = index;
    if (!reducedMotion.matches) setProgress(rotatingExhibits[index], 50);
    for (const [position, { target }] of rotatingExhibits.entries()) {
      const layer = document.getElementById(target);
      layer.classList.toggle('is-current', position === index);
      layer.setAttribute('aria-hidden', String(position !== index));
    }
  }

  function render() {
    clearInterval(rotationTimer);
    for (const { target, scene, frame, renderer } of exhibits) {
      document.getElementById(target).innerHTML = renderer.art(100, scene, target, false, {
        shape: 'lancet',
        frame,
      });
    }
    if (!reducedMotion.matches) {
      for (const exhibit of rotatingExhibits) {
        prepareProgress(exhibit);
        setProgress(exhibit, 50);
      }
    }
    showScene(reducedMotion.matches ? 0 : currentScene);
    sceneElapsed = 0;
    lastTick = performance.now();
    if (!reducedMotion.matches) {
      rotationTimer = setInterval(() => {
        const now = performance.now();
        const elapsed = now - lastTick;
        lastTick = now;
        if (document.hidden) return;
        sceneElapsed += elapsed;
        if (sceneElapsed >= sceneDuration) {
          sceneElapsed %= sceneDuration;
          showScene((currentScene + 1) % rotatingExhibits.length);
        }
        const count =
          50 +
          Math.min(50, Math.floor((50 * Math.max(0, sceneElapsed - revealDelay)) / revealDuration));
        setProgress(rotatingExhibits[currentScene], count);
      }, 100);
    }
  }
  render();
  addEventListener('glass-motionchange', render);
  document.addEventListener('visibilitychange', () => {
    lastTick = performance.now();
  });
})();
