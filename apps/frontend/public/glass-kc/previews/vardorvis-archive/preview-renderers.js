/* Each window has its own authoring file; both collections share the production frame. */
/* global GLASS_RENDERERS, createGlassWindow */
/* exported GLASS_NEW_SCENES */
var GLASS_NEW_SCENES = {};
const GLASS_NEW_HELPERS = {
  ink: '#211e27',
  p(d, fill, stroke = '#211e27', width = 2, attrs = '') {
    return `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round" ${attrs}/>`;
  },
  l(d, stroke, width = 1.3, attrs = '') {
    return this.p(d, 'none', stroke, width, attrs);
  },
  g(transform, body, attrs = '') {
    return `<g transform="${transform}" ${attrs}>${body}</g>`;
  },
  ellipse(cx, cy, rx, ry, fill, stroke = '#211e27', width = 2, attrs = '') {
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" ${attrs}/>`;
  },
  circle(cx, cy, r, fill, stroke = '#211e27', width = 2, attrs = '') {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" ${attrs}/>`;
  },
  a(name, values, keys, seconds = 16, attrs = '') {
    return `<animate attributeName="${name}" values="${values}" keyTimes="${keys}" dur="${seconds}s" repeatCount="indefinite" ${attrs}/>`;
  },
  move(values, keys, seconds = 16) {
    return `<animateTransform attributeName="transform" type="translate" values="${values}" keyTimes="${keys}" dur="${seconds}s" repeatCount="indefinite"/>`;
  },
  turn(values, keys, seconds = 16) {
    return `<animateTransform attributeName="transform" type="rotate" values="${values}" keyTimes="${keys}" dur="${seconds}s" repeatCount="indefinite"/>`;
  },
  on(body, values, keys, seconds = 16, attrs = '') {
    return `<g opacity="0" ${attrs}>${GLASS_NEW_HELPERS.a('opacity', values, keys, seconds)}${body}</g>`;
  },
};
// Scene authors may destructure helpers without losing the path helper's context.
GLASS_NEW_HELPERS.l = GLASS_NEW_HELPERS.l.bind(GLASS_NEW_HELPERS);

function createPreviewBossRenderer(config, { esc, getJournal }) {
  const h = GLASS_NEW_HELPERS;
  let instance = 0;
  const sceneColors = (index) =>
    config.palettes[
      ((index % config.titles.length) + Math.floor(index / config.titles.length)) %
        config.palettes.length
    ];
  function background(c, scene) {
    const { p, l, circle } = h;
    let result = p('M20 550 V220 Q20 92 180 18 Q340 92 340 220 V550Z', c[0]);
    const apex = 78 + (scene % 3) * 12;
    result += p(`M180 ${apex} L302 214 L271 373 L180 461 L89 373 L58 214Z`, c[1], c[4], 1.4);
    result += p(`M180 ${apex} V461 L89 373 L58 214Z`, c[2], h.ink, 1.2, 'opacity=".3"');
    result += circle(180, 246, 111, 'none', c[4], 1.3, 'opacity=".35"');
    for (let row = 0; row < 8; row++) {
      const y = 126 + row * 53;
      result += l(`M27 ${y} L89 ${y - 22} M333 ${y} L271 ${y - 22}`, c[4], 1, 'opacity=".28"');
    }
    result += l(
      'M180 35 V84 M62 185 L90 213 M298 185 L270 213 M28 362 L72 345 M332 362 L288 345',
      c[4],
      2,
      'opacity=".6"'
    );
    return result;
  }
  function inlay(x, y, lit) {
    // Progress belongs to the stonework: four small cuts in the sill, with no
    // floating badges competing with the scene or protruding beyond the frame.
    return h.g(
      `translate(${x} ${y})`,
      h.p('M-5 -1.5 H5 V1.5 H-5Z', lit ? '#c7b68f' : '#443a32', '#302a25', 0.7) +
        h.l('M-4 -1 H4', lit ? '#e0d2b2' : '#6a5a46', 0.65)
    );
  }
  const art = createGlassWindow({
    config,
    esc,
    getJournal,
    sceneColors,
    frameOrnaments(count) {
      return Array.from({ length: 4 }, (_, i) => {
        const mark = inlay(153 + i * 18, 557, count >= (i + 1) * 25);
        return count >= (i + 1) * 25 ? `<g data-ornament="${i + 1}">${mark}</g>` : mark;
      }).join('');
    },
    renderScene(c, panes, index) {
      const scene = index % config.titles.length;
      const key = config.sceneKeys[scene];
      const draw = GLASS_NEW_SCENES[key];
      if (!draw) throw new Error(`Missing preview scene: ${key}`);
      const id = `${config.id}-${key}-${++instance}`;
      return `${panes}${background(c, scene)}<g data-art-scene="${key}">${draw(h, c, id)}</g>`;
    },
  });
  return {
    art,
    sceneColors,
    shrineMarkup: (pieces) =>
      Array.from(
        { length: 4 },
        (_, i) =>
          `<div class="shrine-totem"><svg viewBox="-35 -35 70 70" aria-label="${config.milestoneNoun} ${i + 1}">${inlay(0, 0, pieces >= (i + 1) * 25)}</svg></div>`
      ).join(''),
  };
}
GLASS_RENDERERS.vardorvis = createPreviewBossRenderer;
GLASS_RENDERERS.tfa = createPreviewBossRenderer;
