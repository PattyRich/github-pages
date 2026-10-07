/* Shared 100-pane reveal, accessible drop targets and window frame. */
/* exported GLASS_RENDERERS, GLASS_WINDOW_SHAPES, GLASS_WINDOW_FRAMES, createGlassWindow, updateGlassWindow */
const GLASS_RENDERERS = {};
function glassCurveEdge(y, points) {
  if (y <= points[0][1]) return 180;
  if (y >= points[3][1]) return 20;
  const coordinate = (t, axis) =>
    (1 - t) ** 3 * points[0][axis] +
    3 * (1 - t) ** 2 * t * points[1][axis] +
    3 * (1 - t) * t ** 2 * points[2][axis] +
    t ** 3 * points[3][axis];
  let low = 0,
    high = 1;
  for (let i = 0; i < 20; i++) {
    const middle = (low + high) / 2;
    if (coordinate(middle, 1) < y) low = middle;
    else high = middle;
  }
  return coordinate((low + high) / 2, 0);
}
const GLASS_WINDOW_SHAPES = {
  lancet: {
    label: 'Gothic',
    top: 18,
    bottom: 550,
    outline: (d) =>
      `M${20 - d} ${550 + d} V220 Q${20 - d} ${92 - d * 0.92} 180 ${18 - d * 1.17} Q${340 + d} ${92 - d * 0.92} ${340 + d} 220 V${550 + d} Z`,
    edge: (y) =>
      y >= 220 ? 20 : 20 + 160 * ((256 - Math.sqrt(256 * 256 - 216 * (220 - y))) / 108) ** 2,
    transform: '',
  },
  round: {
    label: 'Round arch',
    top: 60,
    bottom: 550,
    outline: (d) =>
      `M${20 - d} ${550 + d} V220 A${160 + d} ${160 + d} 0 0 1 ${340 + d} 220 V${550 + d} Z`,
    edge: (y) => (y >= 220 ? 20 : 180 - Math.sqrt(Math.max(0, 160 ** 2 - (220 - y) ** 2))),
    transform: 'translate(14.4 44) scale(.92)',
  },
  rectangle: {
    label: 'Rectangle',
    top: 18,
    bottom: 550,
    outline: (d) => `M${20 - d} ${18 - d} H${340 + d} V${550 + d} H${20 - d} Z`,
    edge: () => 20,
    transform: '',
  },
  octagon: {
    label: 'Octagon',
    top: 18,
    bottom: 550,
    outline: (d) =>
      `M80 ${18 - d} H280 L${340 + d} 78 V490 L280 ${550 + d} H80 L${20 - d} 490 V78 Z`,
    edge: (y) => 20 + Math.max(0, 78 - y, y - 490),
    transform: 'translate(10.8 17.04) scale(.94)',
  },
  ogee: {
    label: 'Ogee arch',
    top: 18,
    bottom: 550,
    outline: (d) =>
      `M${20 - d} ${550 + d} V230 C${20 - d} ${134 - d} ${135 - d * 0.4} ${135 - d} 180 ${18 - d * 1.17} C${225 + d * 0.4} ${135 - d} ${340 + d} ${134 - d} ${340 + d} 230 V${550 + d} Z`,
    edge: (y) =>
      glassCurveEdge(y, [
        [180, 18],
        [135, 135],
        [20, 134],
        [20, 230],
      ]),
    transform: 'translate(10.8 17.04) scale(.94)',
  },
  tudor: {
    label: 'Tudor arch',
    top: 48,
    bottom: 550,
    outline: (d) =>
      `M${20 - d} ${550 + d} V190 C${20 - d} ${118 - d * 0.7} ${84 - d * 0.4} ${100 - d * 0.7} 180 ${48 - d} C${276 + d * 0.4} ${100 - d * 0.7} ${340 + d} ${118 - d * 0.7} ${340 + d} 190 V${550 + d} Z`,
    edge: (y) =>
      glassCurveEdge(y, [
        [180, 48],
        [84, 100],
        [20, 118],
        [20, 190],
      ]),
    transform: 'translate(10.8 31.08) scale(.94)',
  },
  stepped: {
    label: 'Stepped',
    top: 18,
    bottom: 550,
    outline: (d) =>
      `M${20 - d} ${550 + d} V${160 - d} H${64 - d} V${102 - d} H${111 - d} V${58 - d} H${151 - d} V${18 - d} H${209 + d} V${58 - d} H${249 + d} V${102 - d} H${296 + d} V${160 - d} H${340 + d} V${550 + d} Z`,
    edge: (y) => (y < 58 ? 151 : y < 102 ? 111 : y < 160 ? 64 : 20),
    transform: 'translate(10.8 17.04) scale(.94)',
  },
};
const GLASS_WINDOW_FRAMES = {
  stone: { label: 'Sandstone', width: 12, base: '#332b22', edge: '#8a704d', light: '#ac8a54' },
  gilded: { label: 'Gilded', width: 20, base: '#665438', edge: '#ac8a54', light: '#d9c6a1' },
  iron: { label: 'Dark iron', width: 9, base: '#242a30', edge: '#6b7e89', light: '#b9c1a8' },
  oak: { label: 'Carved oak', width: 18, base: '#463b2c', edge: '#917651', light: '#bb9e73' },
  amethyst: { label: 'Amethyst', width: 22, base: '#443050', edge: '#9769b5', light: '#d8b6e9' },
  ivory: { label: 'Ivory', width: 18, base: '#aaa38b', edge: '#d1c79b', light: '#f0e5c3' },
  bloodstone: {
    label: 'Bloodstone',
    width: 18,
    base: '#3c202b',
    edge: '#8f3d50',
    light: '#d88b86',
  },
};

function glassFrame(shape, frame, uid) {
  const { width, base, edge, light } = frame;
  const outline = shape.outline(width);
  const profile = `<path d="${outline}" fill="${base}" stroke="${edge}" stroke-width="2"/><path d="${shape.outline(width / 2)}" fill="none" stroke="${edge}" stroke-width="2"/>`;
  let detail = '';
  if (frame === GLASS_WINDOW_FRAMES.gilded) {
    detail = `<path d="${shape.outline(15)}" fill="none" stroke="${light}" stroke-width="2"/><path d="${shape.outline(9)}" fill="none" stroke="${light}" stroke-width="3" stroke-dasharray="1 8" stroke-linecap="round"/>`;
  } else if (frame === GLASS_WINDOW_FRAMES.iron) {
    detail = `<path d="${shape.outline(5)}" fill="none" stroke="${light}" stroke-width="3" stroke-dasharray="1 45" stroke-linecap="round"/>`;
  } else if (frame === GLASS_WINDOW_FRAMES.oak) {
    detail = `<path d="${shape.outline(13)}" fill="none" stroke="${light}" stroke-width="1" opacity=".6"/><path d="${shape.outline(5)}" fill="none" stroke="${edge}" stroke-width="2" stroke-dasharray="24 5 7 4"/>`;
  } else if (frame === GLASS_WINDOW_FRAMES.amethyst) {
    const gems = [270, 345, 420, 495]
      .flatMap((y) => {
        const x = shape.edge(y) - width / 2;
        return [x, 360 - x].map(
          (cx) =>
            `<path d="M${cx} ${y - 8} L${cx + 4} ${y} L${cx} ${y + 8} L${cx - 4} ${y}Z" fill="${edge}" stroke="${light}" stroke-width=".8"/><path d="M${cx} ${y - 8} L${cx + 4} ${y} L${cx} ${y + 8}Z" fill="${light}" opacity=".55"/>`
        );
      })
      .join('');
    detail = `<path d="${shape.outline(16)}" fill="none" stroke="${edge}" stroke-width="1.2"/><path d="${shape.outline(5)}" fill="none" stroke="${light}" stroke-width="1"/>${gems}`;
  } else if (frame === GLASS_WINDOW_FRAMES.ivory) {
    detail = `<path d="${shape.outline(13)}" fill="none" stroke="${edge}" stroke-width="2"/><path d="${shape.outline(8)}" fill="none" stroke="${light}" stroke-width="4" stroke-dasharray="1 13" stroke-linecap="round"/>`;
  } else if (frame === GLASS_WINDOW_FRAMES.bloodstone) {
    detail = `<path d="${shape.outline(13)}" fill="none" stroke="${edge}" stroke-width="4" stroke-dasharray="16 6"/><path d="${shape.outline(6)}" fill="none" stroke="${light}" stroke-width="1.4"/>`;
  }
  const sillLeft = shape === GLASS_WINDOW_SHAPES.octagon ? 80 : 20 - width;
  const sillRight = shape === GLASS_WINDOW_SHAPES.octagon ? 280 : 340 + width;
  const sill = `<path d="M${sillLeft} ${552 + width} H${sillRight}" stroke="${edge}" stroke-width="7"/><path d="M${sillLeft + 10} ${558 + width} H${sillRight - 10}" stroke="${base}" stroke-width="2"/>`;
  return `<g data-frame="${uid}">${profile}${detail}${sill}</g>`;
}
const glassWindowUpdates = new WeakMap();
function updateGlassWindow(container, markup) {
  const current = container.querySelector(':scope > svg');
  if (current && glassWindowUpdates.get(container) === markup) return;
  const template = document.createElement('template');
  template.innerHTML = markup;
  const next = template.content.firstElementChild;
  if (!next) return;
  if (!current || current.dataset.windowKey !== next.dataset.windowKey) {
    if (current) current.replaceWith(next);
    else container.prepend(next);
  } else {
    // Keep the SVG clock, CSS animations and scene nodes running. Only earned state changes.
    const patch = (target, source) => {
      if (target.isEqualNode(source)) return;
      if (target.nodeType !== source.nodeType || target.nodeName !== source.nodeName) {
        target.replaceWith(source.cloneNode(true));
        return;
      }
      if (target.nodeType !== Node.ELEMENT_NODE) {
        target.nodeValue = source.nodeValue;
        return;
      }
      for (const attribute of Array.from(target.attributes)) {
        if (!source.hasAttribute(attribute.name)) target.removeAttribute(attribute.name);
      }
      for (const attribute of source.attributes) {
        if (target.getAttribute(attribute.name) !== attribute.value)
          target.setAttribute(attribute.name, attribute.value);
      }
      const children = Array.from(target.childNodes);
      const replacements = Array.from(source.childNodes);
      for (let i = 0; i < Math.max(children.length, replacements.length); i++) {
        if (!replacements[i]) children[i].remove();
        else if (!children[i]) target.append(replacements[i].cloneNode(true));
        else patch(children[i], replacements[i]);
      }
    };
    current.setAttribute('aria-label', next.getAttribute('aria-label'));
    for (const region of ['reveal', 'panes', 'ornaments', 'celebration']) {
      const selector = `[data-window-${region}]`;
      patch(current.querySelector(selector), next.querySelector(selector));
    }
  }
  glassWindowUpdates.set(container, markup);
}

function createGlassWindow({ config, esc, getJournal, sceneColors, renderScene, frameOrnaments }) {
  const { titles, sceneDescriptions } = config;
  const sceneNumber = (index) => index % titles.length;
  function art(count, index, uid, celebrate = false, appearance = {}) {
    const colors = sceneColors(index);
    const shapeId = Object.hasOwn(GLASS_WINDOW_SHAPES, appearance.shape)
      ? appearance.shape
      : 'lancet';
    const shape = GLASS_WINDOW_SHAPES[shapeId];
    const frameId = Object.hasOwn(GLASS_WINDOW_FRAMES, appearance.frame)
      ? appearance.frame
      : 'stone';
    const frame = GLASS_WINDOW_FRAMES[frameId];
    const path = shape.outline(0);
    let panes = '',
      facets = '',
      seams = '',
      revealed = '',
      sleeping = '',
      memories = '';
    const previewOnly = uid === 'sanctuary';
    const interactive = uid === 'main' || uid.startsWith('gallery-') || previewOnly;
    const leftEdge = shape.edge;
    // Shared vertices avoid gaps. Kill order remains bottom-to-top, left-to-right.
    const vertices = Array.from({ length: 11 }, (_, r) =>
      Array.from({ length: 11 }, (_, c) => {
        const y =
          shape.bottom -
          r * ((shape.bottom - shape.top) / 10) +
          (r > 0 && r < 10 && c > 0 && c < 10 ? Math.sin(r * 2.7 + c * 1.9) * 8 : 0);
        const edge = leftEdge(y),
          width = 360 - 2 * edge;
        let x =
          edge + width * (c / 10 + (c > 0 && c < 10 ? Math.sin(r * 1.8 + c * 2.3) * 0.012 : 0));
        // Extend boundary panes through the clip so curved rims have no unlit slivers.
        if (shape !== GLASS_WINDOW_SHAPES.lancet && (c === 0 || c === 10)) {
          x = c === 0 ? 20 : 340;
        }
        return [x, y];
      })
    );
    // Every window has 100 panes, regardless of its scene or collection edition.
    for (let row = 0; row < 10; row++)
      for (let col = 0; col < 10; col++) {
        const n = row * 10 + col,
          quad = [
            vertices[row + 1][col],
            vertices[row + 1][col + 1],
            vertices[row][col + 1],
            vertices[row][col],
          ];
        const [[x1, y1], [x2, y2], [x3, y3], [x4, y4]] = quad;
        const points = quad.map((p) => p.join(',')).join(' ');
        panes += `<polygon points="${points}" fill="${colors[(row + col) % 2]}"/>`;
        panes += `<path d="M${x4} ${y4} L${x2} ${y2} L${x3} ${y3}Z" fill="#dce8be" opacity=".08"/>`;
        facets += `<polygon points="${points}" fill="${(row + col) % 3 ? '#dce5da' : '#192733'}" opacity="${0.025 + ((row * 7 + col * 3) % 5) * 0.009}"/>`;
        const tile = index * 100 + n + 1,
          drop = n < count ? getJournal().dropTiles?.[tile] : null;
        const target =
          interactive && n < count && (!previewOnly || drop)
            ? ` data-pane="${tile}" tabindex="0" role="button" aria-label="KC ${getJournal().base + tile}${drop ? ', drop: ' + esc(drop.label || 'Drop recorded') : ': mark a drop'}${previewOnly ? ', view drop memory' : ''}"`
            : '';
        sleeping += `<polygon points="${points}" fill="${['#232b2b', '#293032', '#242a30', '#303236'][(row * 3 + col) % 4]}"/><path d="M${x4} ${y4} L${x2} ${y2} L${x3} ${y3}Z" fill="#b9dad1" opacity=".035"/>`;
        seams += `<polygon class="pane ${n < count ? 'filled' : ''}"${target} points="${points}" fill="${drop ? '#d85397' : 'transparent'}" fill-opacity="${drop ? 0.24 : 0}" stroke="${drop ? '#f29dcd' : '#121b20'}" stroke-width="${drop ? 2.5 : n < count ? 0.8 : 1.3}"/>`;
        if (drop) {
          const cx = (x1 + x2 + x3 + x4) / 4,
            cy = (y1 + y2 + y3 + y4) / 4;
          memories += `<path class="drop-spark" d="M${cx} ${cy - 7} l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2Z" fill="#f7c5e1" stroke="#912d60" stroke-width="1"/>`;
        }
        if (n < count) revealed += `<polygon points="${points}"/>`;
      }
    // Fit tall subjects inside shorter silhouettes without distorting their proportions.
    const scene = shape.transform
      ? `${panes}<g transform="${shape.transform}">${renderScene(colors, '', index)}</g>`
      : renderScene(colors, panes, index);
    const reducedMotion =
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Inline scenes preserve SVG path morphs and motion paths without a <use> shadow tree.
    const sceneMarkup = reducedMotion
      ? scene.replace(
          /<(animate|animateMotion|animateTransform)\b[^>]*(?:\/>|>[\s\S]*?<\/\1>)/g,
          ''
        )
      : scene;
    const ornamentRows = [300, 460];
    const anchors = ornamentRows.flatMap((y) => [
      [leftEdge(y) - frame.width - 9, y],
      [360 - leftEdge(y) + frame.width + 9, y],
    ]);
    const viewBox = '-24 -14 408 594';
    const ornaments = frameOrnaments(count, index, uid, celebrate, {
      anchors,
      crownY: Math.max(-2, shape.top - frame.width - 1),
    });
    const windowKey = [config.id, index, uid, shapeId, frameId, reducedMotion].join(':');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" data-window-key="${esc(windowKey)}" data-window-shape="${shapeId}" role="${interactive ? 'group' : 'img'}" aria-label="${esc(titles[sceneNumber(index)])} — ${esc(sceneDescriptions[sceneNumber(index)])} ${count} of 100 pieces lit, ${Math.floor(count / 25)} of 4 frame ornaments earned. ${shape.label} window, ${frame.label} frame."><defs><clipPath id="clip-${uid}"><path d="${path}"/></clipPath><clipPath id="lit-${uid}" data-window-reveal>${revealed}</clipPath><linearGradient id="glass-${uid}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e3edcc" stop-opacity=".12"/><stop offset=".45" stop-color="#acbacf" stop-opacity="0"/><stop offset="1" stop-color="#0d1725" stop-opacity=".2"/></linearGradient></defs>${glassFrame(shape, frame, uid)}<g clip-path="url(#clip-${uid})">${sleeping}<g clip-path="url(#lit-${uid})"><g id="scene-${uid}">${sceneMarkup}${facets}<path d="${path}" fill="url(#glass-${uid})"/></g></g><g data-window-panes>${seams}${memories}</g></g><path d="${path}" fill="none" stroke="${frame.light}" stroke-width="3" pointer-events="none"/><g data-window-ornaments>${ornaments}</g><g data-window-celebration>${celebrate ? `<path class="window-resonance" d="${path}" fill="none" stroke="${colors[3]}" stroke-width="${count === 100 ? 10 : 5}" opacity="0" pointer-events="none"/>` : ''}</g></svg>`;
  }
  return art;
}

if (typeof matchMedia === 'function' && typeof dispatchEvent === 'function') {
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () =>
    dispatchEvent(new Event('glass-motionchange'))
  );
}
