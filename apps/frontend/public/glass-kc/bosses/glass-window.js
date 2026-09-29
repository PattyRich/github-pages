/* Shared 100-pane reveal, accessible drop targets and window frame. */
/* exported GLASS_RENDERERS, createGlassWindow */
const GLASS_RENDERERS = {};
function createGlassWindow({ config, esc, getJournal, sceneColors, renderScene, frameOrnaments }) {
  const { titles, sceneDescriptions } = config;
  const sceneNumber = (index) => index % titles.length;
  function art(count, index, uid, celebrate = false) {
    const colors = sceneColors(index);
    const path = 'M20 550 V220 Q20 92 180 18 Q340 92 340 220 V550 Z';
    let panes = '',
      facets = '',
      seams = '',
      revealed = '',
      sleeping = '',
      memories = '';
    const interactive = uid === 'main' || uid.startsWith('gallery-');
    const leftEdge = (y) =>
      y >= 220 ? 20 : 20 + 160 * ((256 - Math.sqrt(256 * 256 - 216 * (220 - y))) / 108) ** 2;
    // Shared vertices avoid gaps. Kill order remains bottom-to-top, left-to-right.
    const vertices = Array.from({ length: 11 }, (_, r) =>
      Array.from({ length: 11 }, (_, c) => {
        const y =
          550 -
          r * 53.2 +
          (r > 0 && r < 10 && c > 0 && c < 10 ? Math.sin(r * 2.7 + c * 1.9) * 8 : 0);
        const edge = leftEdge(y),
          width = 360 - 2 * edge;
        const x =
          edge + width * (c / 10 + (c > 0 && c < 10 ? Math.sin(r * 1.8 + c * 2.3) * 0.012 : 0));
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
          interactive && n < count
            ? ` data-pane="${tile}" tabindex="0" role="button" aria-label="KC ${getJournal().base + tile}${drop ? ', drop: ' + esc(drop.label || 'Drop recorded') : ': mark a drop'}"`
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
    const scene = renderScene(colors, panes, index);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-24 -14 408 594" role="${interactive ? 'group' : 'img'}" aria-label="${esc(titles[sceneNumber(index)])} — ${esc(sceneDescriptions[sceneNumber(index)])} ${count} of 100 pieces lit, ${Math.floor(count / 25)} of 4 frame ornaments earned"><defs><clipPath id="clip-${uid}"><path d="${path}"/></clipPath><clipPath id="lit-${uid}">${revealed}</clipPath><linearGradient id="glass-${uid}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e3edcc" stop-opacity=".12"/><stop offset=".45" stop-color="#acbacf" stop-opacity="0"/><stop offset="1" stop-color="#0d1725" stop-opacity=".2"/></linearGradient><g id="scene-${uid}">${scene}${facets}<path d="${path}" fill="url(#glass-${uid})"/></g></defs><path d="M8 562 V220 Q8 81 180 4 Q352 81 352 220 V562Z" fill="#332b22" stroke="#8a704d" stroke-width="2"/><path d="M14 557 V220 Q14 87 180 11 Q346 87 346 220 V557Z" fill="none" stroke="#665438" stroke-width="2"/><g clip-path="url(#clip-${uid})">${sleeping}<g clip-path="url(#lit-${uid})"><use href="#scene-${uid}"/></g>${seams}${memories}</g><path d="${path}" fill="none" stroke="#ac8a54" stroke-width="3" pointer-events="none"/><path d="M8 564 H352" stroke="#917651" stroke-width="7"/><path d="M18 570 H342" stroke="#463b2c" stroke-width="2"/>${frameOrnaments(count, index, uid, celebrate)}${celebrate ? `<path class="window-resonance" d="${path}" fill="none" stroke="${colors[3]}" stroke-width="${count === 100 ? 10 : 5}" opacity="0" pointer-events="none"/>` : ''}</svg>`;
  }
  return art;
}
