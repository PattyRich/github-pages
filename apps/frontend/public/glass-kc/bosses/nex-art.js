/* Original OSRS Wiki-referenced stained glass. Approved Nex collection.
 * Current Torva and sanguine models, not retro or RS3 equipment.
 * Identity colours are fixed; only architectural glass changes edition. */
GLASS_RENDERERS.nex = function createNexRenderer(config, { esc, getJournal }) {
  let instance = 0;
  const ink = '#191c29';
  const p = (d, fill, stroke = ink, width = 2, attrs = '') =>
    `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round" ${attrs}/>`;
  const l = (d, stroke = '#8794a9', width = 1.3, attrs = '') => p(d, 'none', stroke, width, attrs);
  const g = (transform, body, attrs = '') => `<g transform="${transform}" ${attrs}>${body}</g>`;
  const a = (name, values, keys, seconds = 14, attrs = '') =>
    `<animate attributeName="${name}" values="${values}" keyTimes="${keys}" dur="${seconds}s" repeatCount="indefinite" ${attrs}/>`;
  const turn = (values, keys, seconds = 14) =>
    `<animateTransform attributeName="transform" type="rotate" values="${values}" keyTimes="${keys}" dur="${seconds}s" repeatCount="indefinite"/>`;
  const move = (values, keys, seconds = 14) =>
    `<animateTransform attributeName="transform" type="translate" values="${values}" keyTimes="${keys}" dur="${seconds}s" repeatCount="indefinite"/>`;
  const on = (body, values, keys, seconds = 14, attrs = '') =>
    `<g opacity="0" ${attrs}>${a('opacity', values, keys, seconds)}${body}</g>`;
  const pulse = (body, start, peak, end, seconds = 16, attrs = '') =>
    on(
      body,
      '0;0;1;.85;0;0',
      `0;${start / seconds};${peak / seconds};${(peak + 0.5) / seconds};${end / seconds};1`,
      seconds,
      attrs
    );
  const sceneCount = config.titles.length;
  // Keep each scene's established glass colours when moving the door to slot two.
  const paletteSlots = [0, 4, 1, 2, 3, 5];
  const sceneColors = (index) =>
    config.palettes[
      (paletteSlots[index % sceneCount] + Math.floor(index / sceneCount)) % config.palettes.length
    ];

  // Four voids and the diagonal cross of the OSRS Zaros emblem.
  function zaros(x, y, scale = 1, color = '#8b5dc3', trim = '#c4a5df') {
    return g(
      `translate(${x} ${y}) scale(${scale})`,
      p(
        'M-14 -54 H14 L11 -41 Q31 -36 40 -13 L54 -17 V17 L40 13 Q32 36 11 41 L14 54 H-14 L-11 41 Q-33 35 -40 13 L-54 17 V-17 L-40 -13 Q-32 -36 -11 -41Z M-17 -29 L17 -29 L0 -10Z M29 -17 V17 L10 0Z M17 29 H-17 L0 10Z M-29 17 V-17 L-10 0Z',
        color,
        trim,
        2,
        'fill-rule="evenodd"'
      ) + l('M-36 -23 L-22 -35 M22 -35 L36 -23 M35 23 L23 35 M-23 35 L-35 23', '#ae8fd1', 1)
    );
  }
  function pillar(x, top, bottom, width = 26, cold = true) {
    const face = cold ? '#525b6c' : '#52445e',
      light = cold ? '#8294a4' : '#9d81ac';
    return (
      p(
        `M${x - width / 2} ${top} H${x + width / 2} V${bottom} H${x - width / 2}Z`,
        face,
        '#252635',
        2
      ) +
      p(
        `M${x - width / 2} ${top} H${x - width / 2 + 7} V${bottom} H${x - width / 2}Z`,
        light,
        'none'
      ) +
      p(
        `M${x + width / 2 - 7} ${top} H${x + width / 2} V${bottom} H${x + width / 2 - 7}Z`,
        '#303140',
        'none'
      ) +
      p(
        `M${x - width / 2 - 5} ${top + 9} H${x + width / 2 + 5} V${top + 24} H${x - width / 2 - 5}Z M${x - width / 2 - 5} ${bottom - 16} H${x + width / 2 + 5} V${bottom} H${x - width / 2 - 5}Z`,
        face,
        light,
        1.3
      ) +
      l(
        `M${x - 3} ${top + 35} V${bottom - 30} M${x + 5} ${top + 35} V${bottom - 30}`,
        '#3b3d50',
        1.2
      )
    );
  }
  function vault(colors, kind = 'prison') {
    let art = p(
      'M18 550 V180 L72 125 L118 105 L180 36 L242 105 L288 125 L342 180 V550Z',
      colors[0],
      '#6c718a',
      2
    );
    art += p('M20 183 L73 130 L111 179 L85 365 L20 440Z', colors[1], ink, 2);
    art += p('M340 183 L287 130 L249 179 L275 365 L340 440Z', colors[1], ink, 2);
    art += p('M90 395 V222 Q94 142 180 118 Q266 142 270 222 V395Z', '#242736', '#637284', 2);
    art += p('M117 397 V234 Q118 177 180 157 Q242 177 243 234 V397Z', '#343649', '#667082', 1.5);
    art += l(
      'M23 265 L96 218 M20 354 L90 310 M337 265 L264 218 M340 354 L270 310 M117 234 H243 M119 294 H241 M120 354 H240',
      '#768092',
      1.2
    );
    art += pillar(80, 170, 435, 24) + pillar(280, 170, 435, 24);
    art += p('M20 449 L109 391 L180 373 L251 391 L340 449 V550 H20Z', '#40475b', '#9f9caf', 2);
    art += p('M109 391 L180 373 V550 H20 V449Z', '#535468', 'none');
    art += p('M180 373 L251 391 L340 449 V550 H180Z', '#343b51', 'none');
    art += l(
      'M20 488 Q180 416 340 488 M20 540 Q180 448 340 540 M51 550 L134 385 M310 550 L226 385 M143 550 L169 377 M218 550 L190 377',
      '#8a869e',
      1.4
    );
    if (kind === 'prison') {
      art += p(
        'M78 130 L113 122 L132 154 L120 217 L104 173 L88 200Z M244 149 L263 118 L283 136 L274 203 L253 179Z',
        '#81a8b6',
        '#384c62',
        1.7
      );
      art += p(
        'M117 94 L151 70 L169 124 L150 178 L143 131 L124 148Z M197 113 L213 79 L243 112 L224 167 L214 131Z',
        '#aecbd0',
        '#50647b',
        1.5
      );
      art += p('M172 67 L186 54 L206 97 L194 153 L183 120 L172 149Z', '#cddbd1', '#687a91', 1.5);
      art += p('M168 145 L193 145 L221 392 L141 392Z', '#b3c2d1', 'none', 0, 'opacity=".08"');
      art += l(
        'M152 78 L158 128 L151 153 M219 91 L223 116 L214 144 M107 144 L116 170 L114 192',
        '#def0e6',
        1.2
      );
    }
    return art;
  }
  function tracery(colors) {
    return (
      l(
        'M32 550 V235 Q32 109 180 36 Q328 109 328 235 V550 M47 550 V240 Q47 135 180 62 Q313 135 313 240 V550',
        '#b8a8aa',
        1.25,
        'opacity=".48"'
      ) +
      p('M180 55 L191 72 L180 92 L169 72Z', colors[3], '#786a81', 1.4) +
      l('M32 530 L47 512 M328 530 L313 512 M32 253 L47 267 M328 253 L313 267', '#b8a8aa', 1.3)
    );
  }

  // The arena's frozen walls, stone niches and circular pit are visible in
  // File:Fighting_Nex.png. Keep the scene legible, rather than copying its UI.
  function arena(colors) {
    let art = p('M20 550 V170 L95 102 L180 35 L265 102 L340 170 V550Z', colors[0], '#9fb6c4', 2);
    art += p(
      'M20 175 L73 130 L101 208 L78 316 L88 392 L20 439Z M340 175 L287 130 L259 208 L282 316 L272 392 L340 439Z',
      '#647f8e',
      '#34475a',
      1.7
    );
    art += p(
      'M95 109 L129 83 L153 140 L147 278 L164 387 L108 405 L91 290Z M213 94 L249 121 L267 281 L248 404 L195 390 L210 249Z',
      '#a2bfc8',
      '#6a8b9e',
      1.6
    );
    art += l(
      'M43 183 L53 243 L42 340 M112 132 L127 223 L118 303 M235 131 L245 228 L235 302 M314 181 L302 246 L314 340',
      '#d6e5df',
      1.5
    );
    art += p(
      'M137 153 L180 64 L223 153 L203 276 L216 390 H145 L155 277Z',
      '#405269',
      '#a8c3cc',
      1.7
    );
    for (const x of [56, 305]) {
      art += p(
        `M${x - 21} 393 V251 Q${x - 21} 215 ${x} 201 Q${x + 21} 215 ${x + 21} 251 V393Z`,
        '#293447',
        '#8ca6b4',
        1.8
      );
      art += l(
        `M${x - 15} 257 H${x + 15} M${x - 15} 286 H${x + 15} M${x - 15} 316 H${x + 15} M${x - 15} 346 H${x + 15} M${x} 218 V388`,
        '#667d91',
        1.1
      );
    }
    art += pillar(84, 196, 423, 19) + pillar(276, 196, 423, 19);
    art += p(
      'M20 410 L40 389 L53 404 L68 386 L79 411 L109 393 L117 419 L155 401 L173 414 L207 400 L231 418 L250 393 L277 411 L291 389 L313 405 L329 390 L340 410 V550 H20Z',
      '#9cafb8',
      '#637e90',
      1.8
    );
    art += p(
      'M20 474 Q39 392 180 390 Q321 392 340 474 Q314 454 293 451 Q286 424 180 420 Q74 424 67 451 Q46 453 20 474Z',
      '#d0dbd5',
      '#718b9d',
      1.6
    );
    art += p(
      'M67 451 Q81 416 180 420 Q279 416 293 451 Q267 478 180 486 Q93 477 67 451Z',
      '#202838',
      '#52647b',
      1.9
    );
    art += p(
      'M20 493 Q95 476 124 447 L158 436 L188 438 L236 466 Q291 492 340 493 V550 H20Z',
      '#859da9',
      '#b5c7c9',
      1.8
    );
    art += l(
      'M25 515 Q78 503 111 483 M251 490 Q296 511 335 516 M55 538 L83 518 M295 540 L268 518',
      '#c7d8d6',
      1.2
    );
    return art;
  }
  function ancientForge() {
    let art = p(
      'M254 430 L258 248 L268 203 Q295 188 321 207 L329 256 L338 426 L326 452 H265Z',
      '#707c87',
      '#b1c2c8',
      1.8
    );
    art += p('M266 220 Q294 201 319 220 L316 240 Q293 250 263 239Z', '#384858', '#99aebd', 1.4);
    art += l(
      'M262 259 Q294 271 329 258 M260 289 Q297 304 331 289 M258 323 Q294 339 333 322 M256 365 Q294 379 335 362 M268 252 V271 M308 270 V289 M278 305 V329 M315 335 V365',
      '#bac7c8',
      1.1
    );
    art += p('M258 431 V357 L269 326 L293 300 L321 330 L330 357 V431Z', '#bec9c9', '#4c6176', 2);
    art += p('M271 420 V363 L293 337 L316 363 V420Z', '#213649', '#9dbac7', 1.7);
    art += p(
      'M279 400 L284 376 L294 391 L299 363 L310 392 L307 411 H280Z',
      '#71c8dc',
      '#b9e5e1',
      1.1
    );
    art += p('M286 407 L296 391 L301 407Z', '#daefdf', 'none');
    art += l('M273 406 H315 M277 408 V424 M286 408 V424 M296 408 V424 M306 408 V424', '#728797', 2);
    art += p('M258 431 H327 L318 448 H265Z', '#91a8b7', '#c3d2cc', 1.3);
    art += on(
      p('M280 401 L281 385 L289 390 L298 370 L311 397 L306 407Z', '#b4e7e7', 'none'),
      '0;.4;.15;.55;0',
      '0;.22;.48;.65;1',
      16
    );
    return art;
  }

  function nex(colors) {
    let art = arena(colors);
    const cycle = 32;
    const phaseKeys = (start) =>
      [
        0,
        start / cycle,
        (start + 1.1) / cycle,
        (start + 1.8) / cycle,
        (start + 3.2) / cycle,
        1,
      ].join(';');
    const smokeKeys = phaseKeys(1.5),
      shadowKeys = phaseKeys(9.5),
      bloodKeys = phaseKeys(17.5),
      iceKeys = phaseKeys(25.5);
    const phase = (body, keys, attrs = '', peak = 1) =>
      on(body, `0;0;${peak};${peak};0;0`, keys, cycle, attrs);
    const glass = 'M20 550 V170 L95 102 L180 35 L265 102 L340 170 V550Z';
    // Containment grows faceted stalagmites around the floor, behind and ahead of Nex.
    const icicle = (x, y, height, width) =>
      g(
        `translate(${x} ${y})`,
        `<g transform="scale(1 0)"><animateTransform attributeName="transform" type="scale" values="1 0;1 0;1 1;1 1;1 0;1 0" keyTimes="${iceKeys}" dur="${cycle}s" repeatCount="indefinite"/>` +
          p(
            `M${-width / 2} 0 L${-width * 0.32} ${-height * 0.45} L${-width * 0.12} ${-height * 0.6} L0 ${-height} L${width * 0.22} ${-height * 0.64} L${width * 0.3} ${-height * 0.28} L${width / 2} 0Z`,
            '#b6dbe2',
            '#678ca1',
            1.2
          ) +
          p(
            `M${-width / 2} 0 L${-width * 0.12} ${-height * 0.6} L0 ${-height} L${width * 0.06} ${-height * 0.25} L0 0Z`,
            '#e1f0e7',
            'none'
          ) +
          p(
            `M0 0 L${width * 0.06} ${-height * 0.25} L0 ${-height} L${width * 0.22} ${-height * 0.64} L${width / 2} 0Z`,
            '#7eafc8',
            'none'
          ) +
          l(
            `M${-width * 0.16} ${-height * 0.22} L${-width * 0.03} ${-height * 0.72}`,
            '#edf5e7',
            1.4
          ) +
          '</g>'
      );
    const rearIce =
      icicle(90, 474, 104, 28) +
      icicle(150, 454, 64, 22) +
      icicle(210, 455, 72, 22) +
      icicle(264, 480, 126, 32);
    art += phase(rearIce, iceKeys, 'data-art-effect="nex-ice-rear" data-nex-phase="ice"');
    // Original vector facets, proportioned against the complete OSRS Nex model.
    // Both arms spread, with hanging membranes, ivory fins and a crossed hover stance.
    const part = (pts, fill, stroke = '#463548', width = 1.15) =>
      p(
        pts
          .map(
            ([x, y], i) =>
              `${i ? 'L' : 'M'}${(180 + (x - 630) * 0.5).toFixed(2)} ${(142 + y * 0.54).toFixed(2)}`
          )
          .join(' ') + 'Z',
        fill,
        stroke,
        width
      );
    let body = '';
    body += part(
      [
        [648, 277],
        [684, 300],
        [730, 354],
        [767, 388],
        [753, 410],
        [695, 380],
        [651, 334],
      ],
      '#9d8e63'
    );
    body += part(
      [
        [686, 320],
        [719, 367],
        [752, 394],
        [740, 403],
        [700, 370],
      ],
      '#beb088',
      'none'
    );
    body += part(
      [
        [750, 385],
        [766, 388],
        [753, 410],
        [741, 402],
      ],
      '#745148',
      'none'
    );
    body += part(
      [
        [614, 310],
        [657, 323],
        [655, 380],
        [625, 423],
        [647, 485],
        [654, 550],
        [625, 589],
        [603, 570],
        [602, 535],
        [584, 473],
        [576, 408],
      ],
      '#62476e'
    );
    body += part(
      [
        [614, 324],
        [638, 335],
        [626, 394],
        [599, 443],
        [591, 413],
      ],
      '#816088',
      'none'
    );
    body += part(
      [
        [600, 288],
        [629, 306],
        [626, 359],
        [613, 415],
        [596, 458],
        [591, 527],
        [579, 569],
        [557, 560],
        [555, 503],
        [567, 445],
        [566, 376],
      ],
      '#80598e'
    );
    body += part(
      [
        [609, 315],
        [611, 358],
        [590, 422],
        [578, 458],
        [576, 412],
        [578, 359],
      ],
      '#9f7aaa',
      'none'
    );
    body += part(
      [
        [557, 551],
        [580, 563],
        [586, 586],
        [580, 615],
        [557, 630],
        [546, 602],
        [551, 580],
      ],
      '#86584c'
    );
    body += part(
      [
        [603, 506],
        [626, 516],
        [642, 531],
        [671, 533],
        [657, 549],
        [674, 566],
        [647, 580],
        [636, 574],
        [637, 602],
        [617, 611],
        [604, 583],
      ],
      '#754b45'
    );
    body += part(
      [
        [556, 606],
        [580, 614],
        [578, 654],
        [562, 680],
        [542, 689],
        [531, 679],
        [542, 642],
      ],
      '#785584'
    );
    body += part(
      [
        [618, 582],
        [638, 584],
        [636, 626],
        [620, 648],
        [605, 631],
      ],
      '#6c4e7c'
    );
    body += part(
      [
        [539, 679],
        [549, 681],
        [548, 699],
        [525, 716],
        [527, 699],
      ],
      '#dce0ce',
      '#93919a'
    );
    body += part(
      [
        [552, 683],
        [562, 684],
        [560, 704],
        [547, 719],
        [542, 714],
        [548, 697],
      ],
      '#f0ecd9',
      '#93919a',
      0.75
    );
    body += part(
      [
        [607, 629],
        [614, 636],
        [609, 651],
        [600, 655],
        [601, 642],
      ],
      '#d6daca',
      '#8d8491'
    );
    body += part(
      [
        [615, 638],
        [620, 644],
        [619, 656],
        [611, 658],
        [612, 649],
      ],
      '#ece5d3',
      '#8d8491',
      0.75
    );
    // Gold membranes and long white fins descend independently from the arm bones.
    let left = part(
      [
        [553, 132],
        [516, 148],
        [466, 167],
        [409, 207],
        [421, 237],
        [439, 232],
        [443, 277],
        [472, 269],
        [477, 225],
        [494, 257],
        [522, 248],
        [535, 202],
        [562, 176],
      ],
      '#95896a'
    );
    left += part(
      [
        [494, 166],
        [521, 152],
        [515, 217],
        [504, 246],
        [476, 225],
        [467, 189],
      ],
      '#b9ac84',
      'none'
    );
    left += part(
      [
        [438, 188],
        [456, 179],
        [444, 239],
        [421, 237],
        [409, 207],
      ],
      '#b3a482',
      'none'
    );
    left += part(
      [
        [557, 124],
        [529, 133],
        [493, 145],
        [461, 162],
        [444, 181],
        [459, 185],
        [496, 169],
        [536, 152],
        [559, 147],
      ],
      '#846094'
    );
    left += part(
      [
        [461, 162],
        [473, 166],
        [443, 185],
        [408, 209],
        [384, 225],
        [371, 222],
        [385, 205],
        [415, 185],
      ],
      '#915d58'
    );
    left += part(
      [
        [385, 205],
        [371, 213],
        [356, 212],
        [344, 229],
        [349, 240],
        [361, 227],
        [369, 229],
        [384, 223],
      ],
      '#895450'
    );
    left += part(
      [
        [344, 223],
        [337, 231],
        [331, 251],
        [345, 239],
        [352, 227],
      ],
      '#deded0',
      '#8b8596'
    );
    left += part(
      [
        [351, 225],
        [353, 245],
        [363, 235],
        [370, 223],
      ],
      '#e9e3d1',
      '#9a91a2'
    );
    left += part(
      [
        [375, 231],
        [382, 254],
        [404, 246],
        [403, 287],
        [405, 348],
        [392, 417],
        [372, 487],
        [362, 457],
        [359, 390],
        [359, 319],
        [351, 278],
        [351, 246],
      ],
      '#d8d5cc',
      '#8c8192'
    );
    left += part(
      [
        [372, 268],
        [381, 284],
        [385, 365],
        [373, 441],
        [367, 389],
      ],
      '#f0ead8',
      'none'
    );
    left += part(
      [
        [365, 242],
        [356, 250],
        [350, 295],
        [340, 368],
        [333, 435],
        [331, 487],
        [342, 453],
        [354, 393],
        [362, 318],
      ],
      '#744c49'
    );
    body += g(
      '',
      `<g>${turn('0 134 218;0 134 218;-2 134 218;-2 134 218;0 134 218;0 134 218', '0;.18;.32;.46;.61;1', 8)}${left}</g>`,
      'data-nex-wing="left"'
    );
    let right = part(
      [
        [682, 145],
        [713, 165],
        [744, 192],
        [772, 225],
        [796, 270],
        [816, 314],
        [824, 360],
        [811, 348],
        [803, 372],
        [785, 347],
        [767, 333],
        [754, 297],
        [723, 273],
        [700, 231],
        [674, 181],
      ],
      '#938469'
    );
    right += part(
      [
        [708, 169],
        [744, 197],
        [770, 232],
        [781, 284],
        [774, 301],
        [746, 257],
        [724, 221],
      ],
      '#b0a47c',
      'none'
    );
    right += part(
      [
        [683, 143],
        [705, 154],
        [738, 182],
        [769, 223],
        [783, 253],
        [768, 270],
        [741, 233],
        [708, 204],
        [682, 181],
        [665, 164],
      ],
      '#835d90'
    );
    right += part(
      [
        [768, 261],
        [784, 257],
        [804, 285],
        [827, 325],
        [847, 348],
        [844, 366],
        [828, 354],
        [811, 329],
        [788, 300],
      ],
      '#99625a'
    );
    right += part(
      [
        [833, 340],
        [847, 348],
        [855, 365],
        [858, 385],
        [848, 395],
        [838, 382],
        [831, 384],
        [819, 370],
        [824, 355],
      ],
      '#88554e'
    );
    right += part(
      [
        [831, 377],
        [835, 386],
        [829, 410],
        [817, 418],
        [820, 398],
      ],
      '#e5e2d4',
      '#958b9b'
    );
    right += part(
      [
        [846, 388],
        [854, 379],
        [858, 389],
        [851, 414],
        [841, 427],
      ],
      '#eee7d3',
      '#958b9b'
    );
    right += part(
      [
        [855, 351],
        [872, 367],
        [871, 412],
        [870, 470],
        [855, 550],
        [837, 523],
        [826, 477],
        [822, 424],
        [832, 390],
      ],
      '#d7d4ca',
      '#897d8e'
    );
    right += part(
      [
        [858, 396],
        [858, 459],
        [844, 512],
        [835, 481],
        [835, 427],
      ],
      '#f0ead8',
      'none'
    );
    right += part(
      [
        [866, 352],
        [883, 385],
        [901, 438],
        [918, 477],
        [944, 490],
        [928, 491],
        [906, 477],
        [886, 439],
        [873, 400],
      ],
      '#795044'
    );
    right += pulse(
      l('M286 345 L291 337 L301 343 M282 334 L283 325 M296 351 L307 354', '#d8c0e8', 2),
      1.8,
      2.6,
      4.4,
      8
    );
    body += g(
      '',
      `<g>${turn('0 209 231;0 209 231;3 209 231;3 209 231;0 209 231;0 209 231', '0;.18;.32;.46;.61;1', 8)}${right}</g>`,
      'data-nex-wing="right"'
    );
    // Broad sloping neck behind a compact projecting head, rather than an upright humanoid face.
    body += part(
      [
        [619, 25],
        [638, 42],
        [655, 80],
        [670, 127],
        [658, 150],
        [636, 155],
        [606, 139],
        [583, 115],
        [594, 83],
        [615, 59],
      ],
      '#a3946e'
    );
    body += part(
      [
        [638, 54],
        [655, 85],
        [664, 125],
        [649, 141],
        [626, 133],
        [611, 111],
        [619, 87],
      ],
      '#bdaf85',
      'none'
    );
    body += part(
      [
        [578, 116],
        [602, 122],
        [620, 145],
        [651, 117],
        [676, 123],
        [704, 146],
        [677, 185],
        [662, 206],
        [653, 250],
        [640, 286],
        [621, 329],
        [602, 325],
        [585, 297],
        [576, 260],
        [567, 218],
        [556, 174],
        [549, 149],
      ],
      '#775582'
    );
    body += part(
      [
        [567, 153],
        [594, 139],
        [616, 153],
        [610, 191],
        [594, 219],
        [573, 219],
        [557, 198],
      ],
      '#b2a17b',
      '#776676'
    );
    body += part(
      [
        [635, 151],
        [662, 132],
        [678, 147],
        [686, 178],
        [677, 200],
        [660, 220],
        [637, 217],
        [623, 200],
      ],
      '#b9a783',
      '#776676'
    );
    body += part(
      [
        [579, 241],
        [611, 251],
        [648, 240],
        [646, 271],
        [637, 301],
        [621, 329],
        [602, 324],
        [589, 292],
      ],
      '#a99870'
    );
    body += part(
      [
        [586, 251],
        [611, 263],
        [644, 252],
        [640, 274],
        [609, 284],
        [591, 273],
      ],
      '#b7a57b',
      'none'
    );
    body += part(
      [
        [596, 284],
        [612, 292],
        [635, 284],
        [627, 310],
        [614, 322],
        [605, 308],
      ],
      '#bca984',
      'none'
    );
    body += part(
      [
        [578, 111],
        [588, 110],
        [600, 133],
        [609, 148],
        [599, 157],
        [588, 140],
      ],
      '#e4dfd0',
      '#9c8f9c',
      0.85
    );
    body += part(
      [
        [609, 147],
        [624, 148],
        [656, 118],
        [671, 111],
        [678, 116],
        [661, 135],
        [631, 162],
        [618, 170],
        [607, 166],
      ],
      '#e5e1d3',
      '#a0959e',
      0.85
    );
    body += part(
      [
        [566, 201],
        [582, 214],
        [600, 217],
        [607, 203],
        [617, 200],
        [620, 223],
        [642, 229],
        [663, 218],
        [676, 201],
        [673, 217],
        [652, 237],
        [630, 243],
        [615, 232],
        [599, 229],
        [580, 228],
      ],
      '#e4ded0',
      '#968795',
      0.85
    );
    body += part(
      [
        [608, 166],
        [619, 161],
        [624, 182],
        [619, 201],
        [622, 221],
        [615, 232],
        [607, 220],
        [605, 195],
      ],
      '#ded8cb',
      '#968795',
      0.85
    );
    // Short horns sweep back; the muzzle points down-left and the eye stays a narrow slit.
    body += part(
      [
        [614, 24],
        [636, 26],
        [653, 20],
        [668, 28],
        [679, 30],
        [684, 39],
        [675, 48],
        [666, 47],
        [652, 41],
        [627, 41],
        [613, 37],
      ],
      '#70517e'
    );
    body += part(
      [
        [670, 28],
        [679, 30],
        [684, 39],
        [675, 48],
        [666, 47],
        [670, 39],
      ],
      '#35293f',
      'none'
    );
    body += part(
      [
        [551, 8],
        [559, 5],
        [560, 24],
        [555, 42],
        [552, 45],
        [547, 29],
      ],
      '#936d9e'
    );
    body += part(
      [
        [564, 3],
        [580, -4],
        [600, 0],
        [618, 15],
        [628, 34],
        [624, 54],
        [606, 78],
        [586, 96],
        [579, 108],
        [570, 110],
        [561, 100],
        [557, 84],
        [552, 66],
        [556, 53],
        [550, 39],
        [553, 19],
      ],
      '#785385',
      '#3c2b49',
      1.45
    );
    body += part(
      [
        [568, 2],
        [580, -4],
        [600, 0],
        [617, 14],
        [612, 27],
        [600, 29],
        [594, 44],
        [580, 34],
        [574, 42],
        [561, 30],
        [563, 17],
      ],
      '#bbaa7e',
      '#837078',
      0.8
    );
    body += part(
      [
        [554, 57],
        [577, 50],
        [600, 50],
        [609, 60],
        [595, 76],
        [579, 89],
        [563, 90],
        [556, 80],
      ],
      '#936d9f',
      'none'
    );
    body += part(
      [
        [616, 32],
        [626, 37],
        [622, 57],
        [604, 77],
        [584, 97],
        [579, 108],
        [573, 102],
        [579, 89],
        [598, 68],
        [608, 46],
      ],
      '#5d3f70',
      'none'
    );
    body += part(
      [
        [576, 65],
        [596, 56],
        [599, 59],
        [589, 67],
        [578, 70],
      ],
      '#e6dbe9',
      'none'
    );
    body += part(
      [
        [554, 61],
        [563, 57],
        [561, 63],
        [555, 66],
      ],
      '#c8b7d1',
      'none'
    );
    body += part(
      [
        [558, 82],
        [565, 88],
        [580, 85],
        [582, 90],
        [568, 97],
        [561, 94],
      ],
      '#5b3b66',
      'none'
    );
    body += part(
      [
        [569, 97],
        [578, 94],
        [581, 98],
        [573, 104],
        [570, 110],
        [564, 105],
      ],
      '#694575',
      'none'
    );
    body += part(
      [
        [563, 88],
        [568, 89],
        [566, 92],
      ],
      '#d8cddc',
      'none'
    );
    art += body;
    // Smoke comes first: ash-grey plumes sweep across the bridge and disperse.
    art += phase(
      p(glass, '#676e64', 'none'),
      smokeKeys,
      'data-art-effect="nex-smoke-haze" data-nex-phase="smoke"',
      0.12
    );
    const smokePlumes =
      p(
        'M5 514 Q35 471 71 490 Q95 501 107 477 Q117 450 144 457 Q172 462 182 439 Q200 408 225 430 Q203 424 199 448 Q187 481 157 478 Q134 473 128 498 Q105 530 76 516 Q42 501 24 538Z',
        '#7e847d',
        'none',
        0,
        'opacity=".72"'
      ) +
      p(
        'M351 536 Q321 511 289 523 Q258 536 242 509 Q227 487 205 503 Q174 519 151 502 Q186 510 198 482 Q220 458 249 488 Q271 510 294 498 Q330 483 356 510Z',
        '#b1b7aa',
        'none',
        0,
        'opacity=".62"'
      ) +
      p(
        'M23 450 Q47 431 63 445 Q78 458 89 440 Q104 423 131 436 Q104 435 98 457 Q85 478 62 461 Q39 447 23 460Z',
        '#c0c2b2',
        'none',
        0,
        'opacity=".46"'
      ) +
      p(
        'M10 475 Q40 454 42 420 Q39 397 62 386 Q79 375 65 356 Q45 340 63 325 Q94 310 116 330 Q91 322 82 340 Q71 357 91 374 Q111 398 85 416 Q69 428 74 447 Q75 467 50 485Z',
        '#7b817a',
        'none',
        0,
        'opacity=".62"'
      ) +
      l(
        'M44 439 Q51 413 75 405 Q96 393 77 375 M53 509 Q77 499 94 509 M274 517 Q297 508 314 520',
        '#d0d1c1',
        1.5,
        'opacity=".45"'
      );
    art += phase(
      `<g>${move('0 18;0 18;7 0;13 -12;20 -26;0 18', smokeKeys, cycle)}${smokePlumes}</g>`,
      smokeKeys,
      'data-art-effect="nex-smoke-plumes" data-nex-phase="smoke"'
    );
    const ash = Array.from({ length: 5 }, (_, i) =>
      p(`M${60 + i * 53} ${468 - (i % 2) * 28} l3 -7 4 4 -3 7Z`, '#d0cbb4', 'none')
    ).join('');
    art += phase(
      `<g>${move('0 22;0 22;5 0;9 -18;15 -38;0 22', smokeKeys, cycle)}${ash}</g>`,
      smokeKeys,
      'data-art-effect="nex-smoke-ash" data-nex-phase="smoke"',
      0.65
    );
    // Embrace Darkness: the approved chamber dimming and wisps follow smoke.
    // Keep the figure readable and the frame outside the phase's veil.
    art += phase(
      p(glass, '#10121e', 'none'),
      shadowKeys,
      'data-art-effect="nex-shadow-veil" data-nex-phase="shadow"',
      0.66
    );
    const wisps =
      p(
        'M18 552 Q7 501 39 470 Q76 451 56 415 Q34 391 46 355 Q61 323 47 300 Q91 340 78 379 Q62 414 84 441 Q105 477 72 501 Q54 523 68 552Z',
        '#716784',
        'none',
        0,
        'opacity=".55"'
      ) +
      p(
        'M342 552 Q353 502 321 473 Q287 454 305 418 Q328 384 315 349 Q301 329 313 306 Q272 344 285 381 Q299 414 277 444 Q255 478 288 504 Q306 524 292 552Z',
        '#756783',
        'none',
        0,
        'opacity=".48"'
      ) +
      p(
        'M83 552 Q98 512 135 511 Q166 510 156 482 Q144 457 165 440 Q196 423 217 442 Q186 439 180 459 Q179 482 211 490 Q247 499 266 552Z',
        '#93889f',
        'none',
        0,
        'opacity=".28"'
      );
    art += phase(
      `<g>${move('0 36;0 36;0 0;0 -12;0 -25;0 36', shadowKeys, cycle)}${wisps}</g>`,
      shadowKeys,
      'data-art-effect="nex-shadow-smoke" data-nex-phase="shadow"'
    );
    art += phase(
      l('M153 177 L163 173', '#ede0ef', 1.5),
      shadowKeys,
      'data-art-effect="nex-shadow-eye" data-nex-phase="shadow"',
      0.65
    );
    const smoke =
      p(
        'M20 528 Q47 509 79 519 Q111 505 142 521 Q178 504 211 521 Q246 507 279 521 Q310 509 340 530 V550 H20Z',
        '#9b93a8',
        'none'
      ) + l('M38 527 Q79 515 110 527 M220 530 Q259 517 292 531', '#d3c5df', 1.5);
    art += phase(
      `<g>${move('0 5;0 5;0 -7;0 -14;0 -20;0 5', shadowKeys, cycle)}${smoke}</g>`,
      shadowKeys,
      'data-art-effect="nex-shadow-floor" data-nex-phase="shadow"',
      0.4
    );
    // Blood Siphon: a crimson reflection and drawn-in wisps return to Nex.
    art += phase(
      p(glass, '#a72643', 'none'),
      bloodKeys,
      'data-art-effect="nex-blood-light" data-nex-phase="blood"',
      0.22
    );
    const bloodWisps =
      p(
        'M49 522 Q59 477 93 455 Q127 437 117 414 Q108 387 144 355 L162 340 Q133 375 140 399 Q156 430 135 451 Q112 470 81 486 Q62 498 49 522Z',
        '#ad435b',
        'none',
        0,
        'opacity=".64"'
      ) +
      p(
        'M311 522 Q301 477 268 457 Q239 440 247 414 Q258 386 226 357 L204 337 Q233 375 225 400 Q208 431 231 453 Q254 473 282 487 Q303 502 311 522Z',
        '#c14e63',
        'none',
        0,
        'opacity=".6"'
      );
    art += phase(
      `<g>${move('0 15;0 15;0 0;0 -10;0 -20;0 15', bloodKeys, cycle)}${bloodWisps}</g>`,
      bloodKeys,
      'data-art-effect="nex-blood-siphon" data-nex-phase="blood"'
    );
    for (const [i, x, y] of [
      [0, 71, 480],
      [1, 109, 510],
      [2, 287, 471],
      [3, 258, 514],
    ]) {
      const start = 17.7 + i * 0.13,
        keys = [
          0,
          start / cycle,
          (start + 0.3) / cycle,
          (start + 1.65) / cycle,
          (start + 2) / cycle,
          1,
        ].join(';');
      const dx = 180 - x,
        dy = 293 - y;
      const droplet =
        p('M0 -8 Q-5 -2 -4 2 Q0 8 4 2 Q5 -2 0 -8Z', '#d16b78', '#6d2f45', 0.7) +
        p('M0 -5 L-1 2 L2 1Z', '#e8a59b', 'none');
      art += g(
        `translate(${x} ${y})`,
        phase(
          `<g>${move(`0 0;0 0;${dx * 0.18} ${dy * 0.18};${dx} ${dy};${dx} ${dy};0 0`, keys, cycle)}${droplet}</g>`,
          keys,
          'data-art-effect="nex-blood-return" data-nex-phase="blood"',
          0.9
        )
      );
    }
    art += phase(
      l('M141 250 L165 272 L179 275 L201 259 M150 293 L177 308 L190 292', '#efadb5', 1.6),
      bloodKeys,
      'data-art-effect="nex-blood-reflection" data-nex-phase="blood"',
      0.6
    );
    // Ice is last: cold light catches the glass as Containment rises and melts away.
    art += phase(
      p(glass, '#8accde', 'none'),
      iceKeys,
      'data-art-effect="nex-ice-light" data-nex-phase="ice"',
      0.2
    );
    const frontIce =
      icicle(85, 534, 106, 33) + icicle(247, 538, 120, 34) + icicle(174, 548, 72, 29);
    art += phase(frontIce, iceKeys, 'data-art-effect="nex-ice-front" data-nex-phase="ice"');
    art += phase(
      l(
        'M41 525 L66 515 L83 519 L113 505 M211 518 L238 507 L258 515 L318 526 M110 540 L134 528 L155 540 L173 532 L196 541',
        '#d1e9e7',
        1.6
      ),
      iceKeys,
      'data-art-effect="nex-ice-frost" data-nex-phase="ice"',
      0.8
    );
    return art;
  }

  function torvaFigure(blood) {
    const metal = blood ? '#424249' : '#50505a',
      shadow = '#292b33',
      light = blood ? '#79787e' : '#929098';
    const cloth = blood ? '#6e2a2c' : '#392044',
      gem = blood ? '#b23235' : '#9554c1';
    const edge = '#292b35';
    let body = p(
      'M153 466 L151 483 L136 499 L132 509 L145 514 L165 505 L169 488 L170 466Z M201 466 L206 489 L208 505 L226 508 L235 492 L224 474 L221 460Z',
      '#886345',
      edge,
      1.3
    );
    body += p(
      'M151 316 L180 324 L211 319 L220 357 L211 404 L187 397 L181 361 L171 400 L143 395 L137 355Z',
      cloth,
      edge,
      1.2
    );
    // Straight, separated shins and faceted knee caps keep the legs legible.
    body += p(
      'M143 392 L171 397 L172 420 L162 468 L143 472 L137 437Z M188 397 L211 394 L222 430 L223 467 L203 474 L192 439Z',
      metal,
      edge,
      1.3
    );
    body += p(
      'M143 399 L157 396 L169 414 L157 431 L137 414Z M191 410 L203 399 L219 411 L212 431 L199 436Z',
      light,
      edge,
      0.9
    );
    body += p(
      'M143 402 L157 397 L157 422 L137 414Z M191 410 L203 399 L205 425 L199 436Z',
      blood ? '#68666e' : '#bbb5ba',
      'none'
    );
    body += p(
      'M140 434 L156 434 L158 445 L148 466 L143 467Z M210 436 L218 431 L220 461 L212 467Z',
      '#393b43',
      'none'
    );
    if (blood)
      body += p(
        'M142 459 L151 466 L164 461 L163 474 L145 479 L140 471Z M200 461 L210 468 L222 459 L225 471 L211 481 L202 475Z',
        '#8b878c',
        edge,
        0.8
      );
    // Arm plates overlap at the elbow, leaving a clean waist silhouette.
    body += p(
      'M133 213 L120 242 L119 273 L130 291 L143 280 L147 241Z M219 218 L239 236 L243 272 L232 291 L219 281 L213 244Z',
      metal,
      edge,
      1.2
    );
    body += p(
      'M122 254 L133 267 L144 260 L142 272 L130 284 L120 273Z M224 262 L241 253 L243 269 L230 280 L221 271Z',
      light,
      'none'
    );
    body += p(
      'M119 280 L135 280 L133 305 L122 308 L117 298Z M226 281 L239 277 L239 305 L226 310 L223 300Z',
      shadow,
      edge,
      1
    );
    body += p(
      'M122 306 L117 321 L124 330 L134 322 L133 305Z M227 307 L224 325 L231 333 L240 325 L237 305Z',
      '#be966f',
      '#695148',
      1.1
    );
    body += p('M158 207 L182 202 L206 211 L210 223 L181 238 L151 221Z', cloth, edge, 1.1);
    body += p(
      'M147 214 L165 206 L181 218 L202 206 L219 221 L220 255 L209 291 L183 302 L153 291 L141 258Z',
      metal,
      edge,
      1.4
    );
    body += p(
      'M147 216 L166 209 L179 222 L174 256 L152 269 L141 252Z',
      blood ? '#63616a' : '#73717b',
      'none'
    );
    body += p(
      'M182 221 L201 210 L218 222 L218 258 L199 273 L183 258Z',
      blood ? '#4e4e55' : '#64616a',
      'none'
    );
    body += p('M157 270 L181 260 L205 274 L211 290 L183 301 L151 290Z', '#383a42', 'none');
    body += p(
      'M146 218 L161 209 L181 222 L202 210 L219 223 L214 226 L201 219 L180 230 L160 218 L149 225Z',
      light,
      'none'
    );
    body += p('M151 283 L181 269 L211 285 L208 298 L181 286 L155 298Z', light, edge, 0.8);
    // The chest medallion carries four purple or red voids, rather than a large diamond.
    body += p(
      'M171 240 L182 233 L195 241 L198 259 L182 269 L168 257Z',
      blood ? '#3b3940' : '#a09aa2',
      edge,
      1
    );
    body += p(
      'M181 238 L190 244 L183 251 L175 245Z M173 249 L179 253 L173 258Z M189 250 L195 254 L188 260 L183 255Z M180 258 L188 263 L181 269 L176 264Z',
      gem,
      'none'
    );
    body += p(
      'M153 300 L180 309 L209 300 L217 326 L190 337 L180 326 L168 336 L143 326Z',
      metal,
      edge,
      1.1
    );
    body += p(
      'M149 313 L163 321 L179 307 L195 323 L213 316 L217 326 L192 332 L179 319 L165 332 L144 326Z',
      light,
      'none'
    );
    body += p(
      'M150 332 L168 327 L179 336 L169 371 L153 388 L136 380 L140 352Z M185 334 L206 331 L221 342 L225 378 L210 389 L194 380Z',
      metal,
      edge,
      1.3
    );
    body += p(
      'M145 349 L154 335 L166 331 L163 343 L151 353 L142 379 L136 380Z M211 337 L218 344 L223 378 L210 388 L194 380 L190 370 L210 378Z',
      light,
      'none'
    );
    body += p(
      'M178 326 L191 341 L193 362 L181 391 L171 373 L170 348Z',
      blood ? '#53515a' : '#60606b',
      edge,
      1.1
    );
    body += p('M177 339 L182 343 L184 373 L179 384 L173 371Z', '#737078', 'none');
    // Distinct shoulder rims, dark gaps and restrained bevels replace crowded outlines.
    body += p(
      blood
        ? 'M119 198 L124 180 L134 195 L144 185 L159 211 L155 236 L130 248 L114 230Z'
        : 'M116 211 L126 195 L147 197 L160 218 L153 236 L130 244 L114 231Z',
      metal,
      edge,
      1.4
    );
    body += p(
      blood
        ? 'M208 211 L218 187 L229 198 L235 185 L249 212 L252 234 L236 247 L215 238Z'
        : 'M209 218 L218 201 L240 197 L253 217 L253 231 L236 244 L215 237Z',
      metal,
      edge,
      1.4
    );
    body += p(
      'M119 216 L128 207 L147 213 L156 225 L147 228 L131 218 L120 224Z M215 220 L223 209 L239 207 L249 217 L247 226 L229 218 L219 228Z',
      light,
      'none'
    );
    body += p(
      'M120 226 L132 224 L143 230 L143 237 L132 233 L121 230Z M230 221 L240 222 L249 232 L239 230Z',
      gem,
      edge,
      0.65
    );
    body += p(
      'M114 230 L131 241 L151 235 L148 245 L130 250 L116 242Z M215 235 L237 243 L251 236 L251 245 L237 251 L217 244Z',
      light,
      edge,
      0.8
    );
    // Smaller helmet: long black T visor, silver cheek rails and the current crest.
    body += p(
      blood
        ? 'M157 186 L158 153 L159 134 L168 151 L177 135 L187 133 L194 149 L204 135 L205 161 L209 178 L207 203 L188 213 L164 205Z'
        : 'M157 186 L155 157 L162 154 L159 141 L166 149 L176 146 L183 126 L187 145 L198 149 L203 137 L204 158 L210 174 L208 201 L188 213 L164 204Z',
      metal,
      edge,
      1.5
    );
    body += p(
      'M164 154 L178 151 L188 161 L202 151 L208 170 L198 179 L188 173 L175 182 L162 170Z',
      blood ? '#55515b' : '#75717b',
      'none'
    );
    body += p(
      'M159 172 L175 167 L185 174 L201 166 L205 173 L190 184 L192 207 L184 213 L180 181 L163 180Z',
      shadow,
      'none'
    );
    body += p(
      'M160 173 L173 171 L181 176 L174 180 L161 178Z M190 175 L202 169 L199 176 L190 181Z',
      gem,
      'none'
    );
    body += p(
      'M160 183 L167 185 L169 198 L179 204 L180 211 L163 203Z M198 182 L204 179 L205 199 L193 207 L191 201 L198 196Z',
      light,
      edge,
      0.8
    );
    body += p(
      'M177 149 L183 128 L188 153 L186 170 L182 178 L177 169Z',
      blood ? '#545059' : '#aba4ae',
      edge,
      0.75
    );
    body += p(
      'M179 182 L185 184 L189 207 L184 213 L181 207Z',
      blood ? '#2c282f' : '#949099',
      'none'
    );
    return body;
  }

  function torva(colors, id) {
    let art = vault(colors, 'forge');
    art += l(
      'M27 240 L47 247 V306 L32 321 M313 202 L327 247 V307 M28 346 L57 337 V377 L28 392',
      '#a4aebc',
      1.3
    );
    art += p(
      'M39 510 L52 494 L65 502 L61 521Z M273 531 L290 514 L314 523 L303 540Z',
      '#9aafbc',
      '#586b7c',
      1.2
    );
    art += p('M97 329 V218 Q105 147 180 113 Q255 147 264 218 V329Z', '#322b3f', '#8d7d9b', 2);
    art += l(
      'M114 270 H245 M112 228 H247 M123 188 H237 M149 151 V330 M211 151 V330',
      '#655769',
      1.3
    );
    art += ancientForge();
    const warrior = torvaFigure;
    // Both changes travel downwards. Invisible clips reset during the holds.
    const keys = '0;.2;.45;.46;.65;.9;.95;1';
    art += `<defs><clipPath id="${id}-normal" clipPathUnits="userSpaceOnUse"><rect x="96" y="125" width="178" height="400" data-torva-clip="normal">${a('y', '125;125;525;125;125;125;125;125', keys, 16)}${a('height', '400;400;0;0;0;400;400;400', keys, 16)}</rect></clipPath><clipPath id="${id}-blood" clipPathUnits="userSpaceOnUse"><rect x="96" y="125" width="178" height="0" data-torva-clip="blood">${a('y', '125;125;125;125;125;525;125;125', keys, 16)}${a('height', '0;0;400;400;400;0;0;0', keys, 16)}</rect></clipPath></defs>`;
    art += `<g data-torva-form="normal" clip-path="url(#${id}-normal)">${warrior(false)}</g><g data-torva-form="blood" clip-path="url(#${id}-blood)">${warrior(true)}</g>`;
    // DT2 ornament kit sits on a small separate bench, not in a Nex drop beam.
    art +=
      p('M32 467 L83 448 L126 469 L82 490Z', '#85818d', '#c3b6bb', 1.6) +
      p('M32 467 L82 490 V526 L32 508Z M82 490 L126 469 V511 L82 526Z', '#514958', '#8d8095', 1.7);
    art += g(
      'translate(79 460) scale(.55)',
      p(
        'M-35 5 L-45 -22 L-27 -16 L-21 -45 L-2 -24 L17 -45 L32 -28 L28 -1 L39 11 L23 25 L29 37 L8 43 L-11 35 L-14 21 L-28 18Z',
        '#42404b',
        '#94909c',
        2
      ) +
        p('M-8 -15 L11 -8 L8 14 L-12 7Z', '#ae3844', '#602b3b', 1.5) +
        l('M-31 -9 L-20 7 L-4 15 M15 16 L24 28', '#77707f', 2)
    );
    art += pulse(l('M80 439 Q118 390 165 316 M183 302 L183 235', '#d56c81', 3), 3.7, 4.6, 6.6, 16);
    art += on(
      p(
        'M153 171 L161 164 L178 224 L169 236Z M150 258 L177 273 L176 289 L154 280Z M141 421 L163 409 L166 418 L146 432Z',
        '#e1dae2',
        'none'
      ),
      '0;0;.7;0;0',
      '0;.13;.18;.24;1',
      16
    );
    return art;
  }

  function hilt(colors, id) {
    // Broken icy masonry and a broad amber-lit opening replace the purple altar.
    let art = p('M20 550 V178 L83 114 L180 34 L278 115 L340 178 V550Z', '#344e5d', '#91a8b2', 1.8);
    art += p('M96 142 L180 65 L256 137 L245 381 L200 463 L122 389Z', '#667f84', '#9baeb1', 1.5);
    art += p('M112 170 L180 100 L234 160 L223 387 L179 459 L126 392Z', '#b7b692', '#727f7e', 1.5);
    art += p('M180 101 L220 151 L169 395 L135 392 L142 188Z', '#d2c59e', 'none');
    art += l(
      'M143 188 L130 378 M191 133 L156 404 M221 175 L201 398',
      '#eee1b6',
      1.3,
      'opacity=".5"'
    );
    art += p(
      'M20 192 L55 154 L93 175 L89 222 L63 235 L83 278 L73 323 L87 365 L64 425 L20 446Z',
      '#526d7a',
      '#263c4b',
      1.7
    );
    art += p(
      'M340 191 L303 153 L265 178 L271 231 L295 246 L276 285 L287 325 L273 374 L300 429 L340 446Z',
      '#486474',
      '#253846',
      1.7
    );
    art += p(
      'M31 202 L45 187 L52 215 L66 225 L53 267 L33 251Z M302 186 L317 200 L325 249 L306 259 L291 226Z',
      '#b1c4c4',
      '#7d98a2',
      1.2
    );
    art += p(
      'M52 300 L69 284 L81 320 L67 364 L57 348 L43 375Z M293 300 L309 284 L319 324 L305 359 L290 344Z',
      '#7e9ca9',
      '#4c697b',
      1.3
    );
    art += l(
      'M28 283 L73 263 M24 337 L69 346 M24 401 L63 389 M331 282 L286 260 M335 340 L291 347 M334 399 L302 391',
      '#abc0c4',
      1.2
    );
    art += p(
      'M20 459 L88 415 L129 429 L180 404 L230 429 L278 415 L340 458 V550 H20Z',
      '#617c86',
      '#9fb2b7',
      1.8
    );
    art += p(
      'M20 502 L84 449 L126 474 L170 449 L219 480 L285 455 L340 500 V550 H20Z',
      '#afc0bc',
      '#637f8c',
      1.5
    );
    art += l(
      'M23 530 L77 485 L128 506 M334 530 L280 487 L222 513 M150 548 L179 488 L206 548',
      '#d5dace',
      1.3
    );
    art += p('M86 475 L132 454 L193 454 L253 479 L198 503 L134 506Z', '#b8baa8', '#56666f', 1.8);
    art += p(
      'M86 475 L134 506 L198 503 L253 479 V507 L199 533 L132 535 L87 510Z',
      '#6f7f80',
      '#acb6aa',
      1.7
    );
    art += l('M134 509 V529 M199 507 V529 M91 503 L130 521', '#d0d0b9', 1.1);
    art += p(
      'M45 489 L58 479 L77 490 L66 505Z M266 526 L286 510 L309 522 L306 540 L280 548Z',
      '#879c9f',
      '#576f7c',
      1.2
    );
    // Convert the detail model's faceted silhouette into the upright composition.
    const part = (points, fill, stroke = '#4c5360', width = 1.6) =>
      p(
        points
          .map(
            ([x, y], i) =>
              `${i ? 'L' : 'M'}${(180 + ((x - 420) * 0.688 + (y - 550) * 0.725) * 0.42).toFixed(2)} ${(342 - ((x - 420) * 0.725 - (y - 550) * 0.688) * 0.42).toFixed(2)}`
          )
          .join(' ') + 'Z',
        fill,
        stroke,
        width
      );
    let sword = part(
      [
        [800, 190],
        [782, 250],
        [432, 566],
        [400, 545],
        [746, 207],
      ],
      '#a1adb6'
    );
    sword += part(
      [
        [800, 190],
        [752, 236],
        [418, 553],
        [400, 545],
        [746, 207],
      ],
      '#d0d7d3',
      'none'
    );
    sword += part(
      [
        [800, 190],
        [782, 250],
        [432, 566],
        [418, 553],
        [752, 236],
      ],
      '#718699',
      'none'
    );
    sword += part(
      [
        [595, 341],
        [577, 302],
        [560, 285],
        [530, 281],
        [489, 285],
        [535, 264],
        [587, 272],
        [621, 326],
      ],
      '#a3adb7'
    );
    sword += part(
      [
        [595, 341],
        [577, 302],
        [560, 285],
        [530, 281],
        [489, 285],
        [535, 273],
        [581, 280],
        [609, 333],
      ],
      '#d0d5d0',
      'none'
    );
    sword += part(
      [
        [649, 374],
        [690, 384],
        [709, 414],
        [721, 448],
        [701, 480],
        [680, 493],
        [698, 450],
        [682, 406],
        [633, 392],
      ],
      '#94a5b4'
    );
    sword += part(
      [
        [649, 374],
        [690, 384],
        [709, 414],
        [721, 448],
        [704, 466],
        [713, 447],
        [702, 416],
        [685, 393],
        [640, 383],
      ],
      '#c1cbd0',
      'none'
    );
    sword += part(
      [
        [481, 422],
        [516, 432],
        [536, 414],
        [535, 369],
        [568, 381],
        [609, 453],
        [572, 431],
        [550, 455],
        [562, 494],
        [520, 486],
        [473, 535],
      ],
      '#9eaab7'
    );
    sword += part(
      [
        [481, 422],
        [516, 443],
        [544, 424],
        [540, 383],
        [552, 388],
        [547, 430],
        [521, 453],
        [521, 476],
        [545, 485],
        [520, 482],
        [480, 530],
      ],
      '#d6d9d1',
      'none'
    );
    sword += part(
      [
        [535, 369],
        [568, 381],
        [609, 453],
        [583, 437],
        [559, 404],
      ],
      '#7a8da2',
      'none'
    );
    // The crossguard has a large inner curl and smaller serrated outer curl.
    sword += part(
      [
        [402, 524],
        [380, 493],
        [374, 459],
        [384, 444],
        [422, 447],
        [432, 478],
        [441, 435],
        [415, 429],
        [377, 430],
        [369, 441],
        [361, 468],
        [366, 503],
        [376, 524],
        [351, 496],
        [334, 478],
        [322, 454],
        [321, 445],
        [332, 438],
        [347, 438],
        [325, 433],
        [315, 437],
        [307, 451],
        [305, 472],
        [310, 482],
        [318, 478],
        [324, 499],
        [337, 496],
        [343, 519],
        [353, 517],
        [361, 535],
        [410, 565],
        [452, 617],
        [491, 613],
        [529, 598],
        [543, 581],
        [546, 552],
        [536, 535],
        [506, 535],
        [526, 544],
        [530, 554],
        [522, 581],
        [489, 595],
        [453, 576],
      ],
      '#8b96a2'
    );
    sword += part(
      [
        [377, 430],
        [415, 429],
        [441, 435],
        [435, 441],
        [390, 442],
        [381, 455],
        [381, 478],
        [390, 502],
        [414, 529],
        [453, 576],
        [489, 595],
        [522, 581],
        [529, 560],
        [531, 552],
        [537, 557],
        [536, 580],
        [524, 594],
        [490, 608],
        [449, 601],
        [412, 548],
        [379, 518],
        [371, 489],
        [368, 463],
      ],
      '#c7cece',
      'none'
    );
    sword += part(
      [
        [462, 618],
        [481, 631],
        [499, 637],
        [518, 634],
        [536, 623],
        [540, 608],
        [539, 629],
        [526, 643],
        [501, 656],
        [480, 650],
        [477, 641],
        [468, 642],
        [462, 633],
      ],
      '#9ba6b0'
    );
    sword += part(
      [
        [480, 631],
        [498, 641],
        [519, 639],
        [536, 627],
        [526, 643],
        [501, 651],
        [481, 644],
      ],
      '#ced1c9',
      'none'
    );
    sword += p('M166 353 L193 354 L190 394 L182 410 L168 404 L161 386Z', '#5d276b', '#38253f', 1.8);
    sword += p('M168 358 L176 360 L176 392 L181 406 L172 400 L165 384Z', '#875698', 'none');
    sword += l('M166 367 L186 370 M165 378 L184 382 M168 391 L180 396', '#4e215c', 1.2);
    sword += p(
      'M168 405 L184 410 L195 421 L189 439 L174 441 L159 429 L161 414Z',
      '#8d99a5',
      '#4f5663',
      1.6
    );
    sword += p('M162 416 L170 411 L178 418 L174 437 L162 430Z', '#c8d0d0', 'none');
    sword += l('M183 414 L188 423 L185 434', '#e0dfd4', 1.2);
    const pommel =
      p(
        'M165 440 L180 434 L197 441 L207 456 L201 474 L180 485 L160 475 L152 457Z M167 448 L160 458 L168 469 L180 476 L194 468 L200 457 L191 448 L180 443Z',
        '#744183',
        '#3a2b43',
        1.5,
        'fill-rule="evenodd"'
      ) +
      p('M176 441 H184 V478 H176Z M159 453 H200 V462 H159Z', '#9259a0', '#492e55', 1) +
      p(
        'M161 443 L157 434 L148 434 L152 447 L158 451Z M196 444 L201 435 L210 436 L205 449 L201 453Z M162 469 L152 480 L155 488 L165 483 L170 474Z M196 470 L206 481 L204 489 L194 482 L188 476Z',
        '#744183',
        '#3d2a43',
        1.1
      );
    sword +=
      pommel +
      l('M159 454 L166 446 L180 439 L194 446 M181 466 V478 M166 473 L176 479', '#b781bd', 1.1);
    // A brief Blood Sacrifice-inspired cast, then a long quiet hold.
    const bladeD = part(
      [
        [800, 190],
        [782, 250],
        [432, 566],
        [400, 545],
        [746, 207],
      ],
      'none'
    ).match(/d="([^"]*)"/)[1];
    sword += `<defs><clipPath id="${id}-blade-shine"><path d="${bladeD}"/></clipPath></defs>`;
    sword += `<g clip-path="url(#${id}-blade-shine)" data-art-effect="godsword-silver-flash"><g transform="translate(0 -45)">${move('0 -45;0 -45;0 230;0 230;0 -45;0 -45', '0;.45;.53;.57;.6;1')}${p('M156 119 L202 99 L204 116 L158 136Z', '#eee4d1', 'none')}${p('M156 127 L202 107 L204 112 L158 132Z', '#fff0df', 'none')}</g></g>`;
    sword += pulse(
      p(
        'M176 122 L168 164 L170 211 L165 250 L172 294 L167 328 L178 349 L195 342 L191 301 L198 267 L188 232 L194 192 L184 147Z',
        '#b44e62',
        '#df9aa0',
        0.8,
        'opacity=".4"'
      ),
      4.8,
      5.55,
      6.7,
      14,
      'data-art-effect="godsword-blood-blade"'
    );
    sword += pulse(
      l(
        'M165 442 L180 436 L197 443 L205 456 L199 473 L180 483 L162 473 L154 457Z M180 444 V476 M162 457 H198',
        '#eb9ca8',
        2.2
      ),
      5.8,
      6.5,
      8.2,
      14,
      'data-art-effect="godsword-blood-hilt"'
    );
    art += pulse(
      zaros(180, 278, 1.08, '#923747', '#e3a19e'),
      3.1,
      4.2,
      7.8,
      14,
      'data-art-effect="blood-sacrifice-mark"'
    );
    const fragments = [
      [104, 236, 64, 163],
      [261, 243, -84, 157],
      [112, 344, 58, 57],
      [267, 345, -94, 60],
    ];
    fragments.forEach(([x, y, dx, dy], index) => {
      const shard =
        p('M0 -12 L6 -1 L3 8 L-4 12 L-7 3 L-5 -4Z', '#b64457', '#ec9fa5', 0.85) +
        p('M-4 -3 L0 -10 L2 3 L-3 7Z', '#db7784', 'none');
      const start = 4.3 + index * 0.14,
        peak = start + 0.4;
      art += g(
        `translate(${x} ${y})`,
        on(
          `<g>${move(`0 0;0 0;${dx} ${dy};${dx} ${dy};0 0;0 0`, '0;.33;.49;.54;.6;1')}${shard}</g>`,
          '0;0;.9;.9;0;0',
          `0;${start / 14};${peak / 14};.48;.54;1`,
          14,
          'data-art-effect="godsword-blood-fragment"'
        )
      );
    });
    art += g('rotate(-9 180 295)', sword, 'data-relic="ancient-godsword"');
    return art;
  }

  function mage(x, y, scale, slot) {
    const robes = ['#625b62', '#665776', '#923f39', '#335866'];
    const skirts = ['#464049', '#38323f', '#593b46', '#284451'];
    const shine = ['#a1979f', '#b09bc4', '#c57967', '#8db9c3'];
    const coat = robes[slot],
      hem = skirts[slot],
      trim = shine[slot];
    const start = 2 + slot * 3,
      seconds = 16;
    const keys = `0;${(start - 0.45) / seconds};${start / seconds};${(start + 0.9) / seconds};${(start + 1.4) / seconds};1`;
    let body = p(
      'M-18 215 L-20 241 L-36 251 L-35 259 L-12 254 L-8 228Z M13 215 L20 238 L32 242 L34 228 L26 215Z',
      '#34343f',
      '#78727f',
      1.8
    );
    body += p(
      'M-22 102 L-48 161 L-57 215 L-41 234 H40 L53 215 L42 161 L23 105Z',
      hem,
      '#262833',
      2
    );
    body += p('M-17 120 L-36 183 L-34 218 L-6 223 L2 120Z', coat, 'none', 0, 'opacity=".44"');
    body += p('M-55 216 L-41 234 H40 L53 215 L51 226 L39 242 H-42 L-57 224Z', trim, '#37303f', 1.2);
    body += l('M-28 154 L-38 208 M-12 160 L-19 221 M21 153 L34 207', '#766975', 1.2);
    body += p('M-32 45 L-48 62 L-34 91 L-18 81 L-10 51Z', coat, '#292837', 1.8);
    body += p('M-38 83 L-34 108 L-24 112 L-23 86Z', coat, '#a095a6', 1.5);
    body += p('M-33 106 L-37 120 L-27 127 L-18 118 L-23 109Z', '#52515d', '#2b2a39', 1.5);
    body += g(
      'translate(33 61)',
      `<g data-mage-casting-arm="${slot}">${turn(`0;0;-32;-32;0;0`, keys, seconds)}` +
        p('M-9 -13 L9 -10 L13 15 L9 34 L-2 34 L-11 11Z', coat, '#2d2937', 1.8) +
        p('M-2 33 L9 34 L9 57 L1 61 L-7 56 L-8 48Z', '#56505d', '#292734', 1.5) +
        l('M-4 28 H11', trim, 2) +
        '</g>'
    );
    body += p('M-26 49 L0 38 L28 49 L34 89 L22 108 L-23 108 L-35 86Z', coat, '#302935', 2);
    body += p('M-46 43 L-13 27 L2 39 L15 28 L49 44 L33 66 L5 56 L-17 63Z', coat, '#9d98a2', 1.8);
    body += l(
      'M-34 47 L-9 40 L-7 57 M10 41 L12 55 L35 47 M-10 80 L0 72 L10 80 L0 90Z',
      '#cabda1',
      1.8
    );
    body += p('M-31 86 L29 86 L25 96 H-27Z', '#baab8d', '#61545c', 1.4);
    body += l('M-3 53 V81 M-10 59 H6 M-10 59 V66 M6 59 V66', '#c9c7be', 3);
    body += p('M-5 86 L4 81 L11 91 L1 103 L-9 95Z', '#a28c62', '#dfc9a1', 1.3);
    body += p(
      'M-25 108 L-13 106 L-15 132 L-32 151 L-44 143 L-36 126Z M13 107 L27 111 L38 140 L26 153 L14 133Z',
      '#716059',
      '#99888a',
      1.2
    );
    body += l('M-27 118 L-17 119 V130 M16 118 L27 121 L30 132', '#c2c8be', 1.7);
    body += p(
      'M-24 105 L-9 100 L-6 119 L-25 136 L-36 128Z M8 102 L23 104 L34 127 L22 138 L8 119Z',
      '#59535e',
      '#9b8892',
      1.4
    );
    body += p(
      'M-18 -9 L-13 -33 L-12 -49 L-5 -53 L-5 -23 L5 -26 L14 -48 L18 -48 L21 -16 L19 4 L5 20 L-7 20 L-19 6Z',
      '#747780',
      '#333541',
      1.8
    );
    body += p(
      'M-11 -40 L-11 -48 L-6 -52 L-6 -22 L-12 -17Z M14 -46 L18 -46 L19 -18 L14 -19Z',
      '#adaeb1',
      'none'
    );
    body += p('M-15 -12 L-1 -18 L15 -9 L13 7 L0 20 L-14 6Z', '#595d67', '#393b47', 1.5);
    body += p('M-13 -7 L-3 -2 L-7 3 L-15 -1Z M4 -2 L14 -8 L13 1 L7 6Z', '#282b35', '#9799a0', 1.3);
    body += p('M-17 8 L-9 9 L0 22 L13 9 L20 6 L15 21 L1 30 L-13 20Z', '#40434f', '#858b97', 1.4);
    body += l('M-1 -14 V-2 L2 6 L-4 13', '#afb1b3', 1.2);
    return g(`translate(${x} ${y}) scale(${scale})`, body);
  }
  function bodyguards(colors) {
    let art = p('M20 550 V180 L90 118 L180 54 L270 118 L340 180 V550Z', '#343140', '#80728c', 2);
    art += p('M20 199 L180 99 L340 199 V550 H20Z', colors[1], '#3d3549', 1.7);
    art += l('M20 242 H340 M20 325 H340 M20 428 H340 M20 503 H340 M180 97 V550', '#8e7e96', 1.4);
    art += p(
      'M53 138 L108 96 L158 138 V328 H53Z M203 138 L253 96 L308 138 V328 H203Z',
      '#51495e',
      '#a496ac',
      1.8
    );
    art += p(
      'M53 344 L108 317 L158 344 V540 H53Z M203 344 L253 317 L308 344 V540 H203Z',
      '#51495e',
      '#a496ac',
      1.8
    );
    const stages = [
      [106, 166],
      [254, 166],
      [106, 376],
      [254, 376],
    ];
    const nicheColor = ['#38413f', '#403249', '#49303d', '#284653'];
    stages.forEach(([x, y], slot) => {
      art += p(
        `M${x - 49} ${y + 137} V${y - 2} Q${x - 49} ${y - 43} ${x} ${y - 60} Q${x + 49} ${y - 43} ${x + 49} ${y - 2} V${y + 137}Z`,
        nicheColor[slot],
        '#2c2838',
        2
      );
      art += l(
        `M${x - 43} ${y + 124} V${y + 2} Q${x - 41} ${y - 31} ${x} ${y - 49} Q${x + 41} ${y - 31} ${x + 43} ${y + 2} V${y + 124}`,
        '#a390b4',
        1.1
      );
      art += l(
        `M${x - 40} ${y + 22} H${x + 40} M${x - 40} ${y + 57} H${x + 40} M${x - 40} ${y + 93} H${x + 40} M${x - 24} ${y - 9} V${y + 21} M${x + 19} ${y + 22} V${y + 57} M${x - 16} ${y + 58} V${y + 92}`,
        '#665775',
        0.9
      );
      art += p(
        `M${x - 51} ${y + 139} L${x - 35} ${y + 128} H${x + 35} L${x + 51} ${y + 139} V${y + 148} H${x - 51}Z`,
        '#81718d',
        '#b4a0b9',
        1.5
      );
      const start = 2 + slot * 3;
      let effect = '';
      if (slot === 0)
        effect =
          p(
            `M${x - 32} ${y + 96} Q${x - 51} ${y + 79} ${x - 24} ${y + 67} Q${x - 37} ${y + 46} ${x - 11} ${y + 28} Q${x + 5} ${y + 15} ${x + 29} ${y + 41} Q${x + 48} ${y + 43} ${x + 32} ${y + 62} Q${x + 39} ${y + 75} ${x + 18} ${y + 100}Z`,
            '#a9b29f',
            '#627a72',
            1.5
          ) +
          l(
            `M${x - 16} ${y + 85} Q${x - 39} ${y + 68} ${x - 10} ${y + 51} Q${x + 7} ${y + 35} ${x + 26} ${y + 52}`,
            '#d1cfb3',
            2
          );
      if (slot === 1)
        effect =
          p(
            `M${x - 42} ${y + 131} L${x - 22} ${y + 114} L${x - 30} ${y + 89} L${x - 11} ${y + 104} L${x} ${y + 64} L${x + 9} ${y + 104} L${x + 26} ${y + 91} L${x + 20} ${y + 115} L${x + 43} ${y + 131}Z`,
            '#1c1f35',
            '#a084bf',
            1.8
          ) +
          l(
            `M${x - 33} ${y + 131} L${x - 4} ${y + 111} M${x + 4} ${y + 110} L${x + 32} ${y + 131}`,
            '#b594d6',
            2
          );
      if (slot === 2)
        effect =
          p(
            `M${x + 28} ${y + 35} Q${x + 46} ${y + 50} ${x + 28} ${y + 64} Q${x + 11} ${y + 53} ${x + 28} ${y + 35}Z M${x - 30} ${y + 72} Q${x - 12} ${y + 88} ${x - 29} ${y + 102} Q${x - 43} ${y + 87} ${x - 30} ${y + 72}Z`,
            '#c95866',
            '#f09e97',
            1.5
          ) + l(`M${x - 38} ${y + 111} Q${x - 24} ${y + 75} ${x + 30} ${y + 53}`, '#e08a9c', 2.6);
      if (slot === 3)
        effect =
          p(
            `M${x - 42} ${y + 111} L${x - 38} ${y + 62} L${x - 29} ${y + 90} L${x - 13} ${y + 35} L${x - 5} ${y + 81} L${x + 19} ${y + 15} L${x + 24} ${y + 74} L${x + 43} ${y + 44} L${x + 35} ${y + 111}Z`,
            '#a1d9dc',
            '#d1ecdf',
            1.6
          ) +
          l(
            `M${x - 34} ${y + 110} L${x - 13} ${y + 45} M${x + 5} ${y + 110} L${x + 19} ${y + 28} M${x + 5} ${y + 110} L${x + 37} ${y + 58}`,
            '#e3f2e3',
            1.9
          );
      art += pulse(
        effect,
        start - 0.1,
        start + 0.4,
        start + 1.5,
        16,
        `data-art-effect="mage-${slot}-cast"`
      );
      art += mage(x, y - 10, 0.57, slot);
      const names = ['FUMUS', 'UMBRA', 'CRUOR', 'GLACIES'];
      art += `<text x="${x}" y="${y + 148}" fill="#ded0c9" text-anchor="middle" font-family="Georgia,serif" font-size="9">${names[slot]}</text>`;
    });
    art +=
      pillar(35, 210, 550, 15, false) +
      pillar(180, 148, 550, 18, false) +
      pillar(325, 210, 550, 15, false);
    art += zaros(180, 90, 0.32, '#9273ac', '#c9acc9');
    return art;
  }

  function door() {
    let art = p(
      'M20 550 V169 L92 124 L125 66 L180 30 L235 66 L268 124 L340 169 V550Z',
      '#354854',
      '#90afb8',
      2
    );
    art += p(
      'M20 183 L65 136 L72 207 L45 268 L55 372 L20 401Z M340 183 L298 139 L290 214 L315 278 L304 374 L340 401Z',
      '#718e9d',
      '#3c576d',
      1.5
    );
    art += l(
      'M43 212 L49 230 L35 259 M314 213 L303 248 L320 289 M29 325 L42 335 L34 370 M328 329 L314 344 L322 378',
      '#b1cbd0',
      1.2
    );
    art += p(
      'M20 231 L56 181 L64 332 L37 423 L20 410Z M340 231 L304 181 L296 332 L323 423 L340 410Z',
      '#536b77',
      '#263947',
      2
    );
    art += p('M64 494 V263 Q64 148 180 111 Q296 148 296 263 V494Z', '#79888e', '#c2d0c9', 2.4);
    art += p('M86 480 V260 Q89 173 180 139 Q271 173 274 260 V480Z', '#3c4e5d', '#3c3e51', 2.4);
    art += p('M98 461 V266 Q97 199 177 161 V459 L145 476 L122 466Z', '#526574', '#a2b0b5', 2);
    art += p('M185 161 Q266 199 266 266 V463 L241 475 L216 465 L185 459Z', '#455966', '#98a4b0', 2);
    art += p('M104 273 V267 Q105 215 161 184 L159 450 L141 460 L115 451Z', '#667c83', 'none');
    art += p('M196 184 Q253 215 255 267 V451 L240 461 L222 451 L196 444Z', '#59717b', 'none');
    art += l(
      'M78 264 L88 262 M83 218 L94 223 M108 172 L119 183 M151 131 L159 148 M208 131 L201 150 M248 172 L237 183 M277 218 L265 223 M282 264 L272 263 M79 365 L90 367 M279 365 L269 367',
      '#c4cec7',
      2.2
    );
    // The real door bears Saradomin, Zamorak, Bandos and Armadyl.
    const symbols = [
      p('M0 -24 L5 -5 L22 0 L5 4 L0 24 L-5 4 L-22 0 L-5 -5Z', '#d7c37b', '#758184', 1.3),
      // The door's Zamorak emblem has tapered outer horns and a tall centre blade.
      p(
        'M-27 -16 L-25 -7 L-21 -1 L-14 4 L-7 5 L-3 1 L-3 -5 L-1 -11 L0 -25 L3 -13 L2 -7 L5 -1 L4 3 L10 8 L19 8 L25 4 L28 -14 L29 4 L26 11 L19 13 L9 13 L1 8 L-2 4 L-7 10 L-15 10 L-24 5 L-28 -2Z',
        '#33262f',
        'none',
        0,
        'data-door-symbol="zamorak"'
      ),
      p(
        'M-14 -17 L-3 -21 L7 -8 L22 -4 L22 3 L5 0 L-2 4 L3 10 L12 11 L12 18 L0 17 L-4 32 L-9 18 L-18 20 L-18 13 L-8 12 L-12 5 L-25 0 L-19 -7 L-12 -4 L-5 -2 L1 -8 L-5 -15 L-13 -11Z',
        '#354739',
        'none',
        0
      ),
      p(
        'M-26 -22 L-29 -17 L-1 2 L0 -4Z M0 -4 L27 -18 L29 -12 L1 4Z M-27 -11 L-23 -8 L-28 8 L-30 1Z M-19 -6 L-15 -3 L-19 13 L-23 11Z M-11 -1 L-6 2 L-12 20 L-16 17Z M25 -7 L29 -10 L31 5 L28 10Z M17 -3 L22 -6 L26 13 L22 15Z M9 1 L14 -2 L20 18 L16 22Z M0 1 L-7 13 L0 12Z M-10 10 L-17 24 L-5 28 L-5 13Z M-3 13 L4 13 L8 29 L-2 30Z M8 11 L16 23 L8 28 L5 14Z',
        '#405a88',
        'none',
        0
      ),
    ];
    const positions = [
        [134, 285],
        [224, 285],
        [135, 376],
        [225, 376],
      ],
      hues = ['#ffe8a0', '#f18a87', '#b7dd99', '#a8d6fa'];
    const beamKeys = '0;.1;.84;.9;.95;1';
    function refraction(length, colour) {
      const beam = (x) => `M-4 4 L4 4 L${x + 15} ${length} L${x - 15} ${length}Z`;
      const traced = (offset, end) => `M${offset * 0.12} 4 L${end + offset} ${length}`;
      let body = `<path d="${beam(125)}" fill="${colour}" opacity=".13" stroke="none" data-refraction-fan>${a('d', `${beam(125)};${beam(125)};${beam(-125)};${beam(-125)};${beam(125)};${beam(125)}`, beamKeys)}</path>`;
      for (const offset of [-14, 0, 14]) {
        const right = traced(offset, 125),
          left = traced(offset, -125);
        body += `<path d="${right}" fill="none" stroke="${offset ? colour : '#f0ead3'}" stroke-width="${offset ? 1.15 : 1.65}" opacity="${offset ? 0.62 : 0.85}">${a('d', `${right};${right};${left};${left};${right};${right}`, beamKeys)}</path>`;
      }
      const inlet = (x) => `M${x} -112 L0 0`;
      body += `<path d="${inlet(-66)}" fill="none" stroke="${colour}" stroke-width="1.4" opacity=".23">${a('d', `${inlet(-66)};${inlet(-66)};${inlet(66)};${inlet(66)};${inlet(-66)};${inlet(-66)}`, beamKeys)}</path>`;
      return body;
    }
    let refractedLight = '';
    symbols.forEach((symbol, slot) => {
      const colour = hues[slot],
        start = 1.4 + slot * 2.3;
      const glow = symbol
        .replace(/stroke="[^"]+"/g, `stroke="${colour}"`)
        .replace(/fill="(?!none)[^"]+"/g, `fill="${colour}"`);
      const soft = glow.replace(/stroke-width="[^"]+"/g, 'stroke-width="9"');
      const halo = `<g opacity=".18">${soft}</g>${glow}`;
      art += g(
        `translate(${positions[slot][0]} ${positions[slot][1]})`,
        symbol +
          pulse(halo, start, start + 0.65, start + 2, 14, `data-art-effect="door-glyph-${slot}"`)
      );
      const fan = refraction(slot < 2 ? 205 : 171, colour);
      const shine =
        pulse(fan, start, start + 0.65, start + 2, 14, `data-door-rays="${slot}"`) +
        pulse(
          fan + `<g opacity=".4">${halo}</g>`,
          9.4,
          10.1,
          12.6,
          14,
          `data-door-rays-together="${slot}"`
        );
      refractedLight += g(`translate(${positions[slot][0]} ${positions[slot][1]})`, shine);
    });
    art += p(
      'M20 453 L42 436 L63 449 L81 477 L119 485 L149 496 L184 484 L215 487 L240 477 L280 490 L299 444 L318 434 L340 460 V550 H20Z',
      '#90aeb8',
      '#506d80',
      2
    );
    art += p(
      'M20 504 L56 482 L110 507 L154 511 L177 501 L230 510 L265 493 L309 502 L340 486 V550 H20Z',
      '#c6d7d3',
      '#829eac',
      1.5
    );
    art += p(
      'M32 543 L62 519 L88 522 L110 550 H20Z M247 544 L275 521 L312 526 L332 549Z',
      '#8babba',
      '#617b91',
      1.4
    );
    art += p(
      'M56 178 L73 135 L82 212 L75 252 L63 214 L58 238Z M98 128 L117 101 L125 148 L115 191 L104 158Z M247 123 L263 142 L261 202 L248 160 L245 180Z M286 156 L307 189 L301 239 L288 206 L283 219Z',
      '#acc7cc',
      '#647e94',
      1.6
    );
    art += l(
      'M66 169 L72 205 M111 128 L115 161 M256 153 L255 184 M297 184 L297 214',
      '#e1e8d9',
      1.4
    );
    art += on(
      l('M181 165 V460', '#c4a6eb', 5) + l('M174 181 V453 M188 183 V452', '#7f619f', 2),
      '0;0;.85;.85;0;0',
      '0;.66;.72;.79;.89;1',
      14,
      'data-art-effect="door-seam-light"'
    );
    art += l(
      'M106 281 L114 272 M249 331 L259 316 M199 433 L207 445 M144 444 L134 452',
      '#bdcbd0',
      1.3
    );
    const crack =
      'M106 275 L123 294 L113 307 L141 334 L132 346 L158 371 L149 388 L171 412 M122 294 L143 291 L150 274 M140 334 L160 327 M150 388 L125 397 L121 414';
    art += `<path d="${crack}" fill="none" stroke="#d5e7df" stroke-width="2.6" stroke-dasharray="260" stroke-dashoffset="260" opacity="0" data-art-effect="door-frost-fracture">${a('stroke-dashoffset', '260;260;0;0;260;260', '0;.20;.39;.50;.67;1')}${a('opacity', '0;0;1;.7;0;0', '0;.19;.37;.54;.67;1')}</path>`;
    art += refractedLight;
    return art;
  }

  function nihilHorn() {
    // Purple root and the long grey taper visible in Nihil_horn_detail.png.
    let body = p(
      'M11 -29 L27 -32 L35 -47 L51 -58 L62 -66 L70 -62 L74 -50 L71 -34 L62 -20 L47 -11 L36 -10 L30 -14 L21 -12 L6 3 L-8 16 L-11 14 L-26 -5 L-20 -21Z',
      '#716078',
      '#363940',
      1.3
    );
    body += p(
      'M-20 -21 L-8 0 L-11 14 L-29 38 L-47 64 L-55 83 L-70 106 L-64 66 L-58 42 L-40 3Z',
      '#8c8b93',
      '#4c4f58',
      1.25
    );
    body += p('M-20 -21 L-8 0 L-11 14 L-29 38 L-47 64 L-60 90 L-54 59 L-38 24Z', '#b1a7af', 'none');
    body += p('M-64 66 L-60 90 L-70 106 L-69 88Z', '#696b76', 'none');
    body += p(
      'M-20 -21 L11 -29 L27 -32 L35 -47 L51 -58 L61 -64 L60 -43 L56 -25 L45 -15 L23 -14 L-8 10Z',
      '#96809f',
      'none'
    );
    body += p(
      'M51 -58 L62 -66 L70 -62 L74 -50 L71 -34 L62 -20 L47 -11 L36 -10 L30 -14 L45 -21 L56 -25 L60 -43 L60 -63Z',
      '#594b67',
      'none'
    );
    body += p('M41 -52 L47 -56 L51 -42 L51 -29 L44 -18 L47 -34Z', '#52445e', 'none');
    body += l('M-19 -21 L-8 0 L8 -8 M36 -13 L48 -17', '#b8a5bd', 0.8);
    return g('translate(108 492) rotate(40) scale(.43)', body, 'data-relic="nihil-horn"');
  }

  function zaryteVambraces() {
    const cuff = (x, y, angle) => {
      let body = p(
        'M-28 -15 L-21 -28 L-6 -31 L29 -12 L37 -4 L31 9 L20 13 L17 29 L1 32 L-20 19 L-25 7Z',
        '#4b4651',
        '#2a2e36',
        1.3
      );
      body += p('M-21 -28 L-6 -31 L29 -12 L37 -4 L23 -2 L1 -14Z', '#34343e', 'none');
      body += p('M-28 -15 L1 -14 L23 -2 L17 29 L1 32 L-20 19Z', '#827582', 'none');
      body += p('M-28 -15 L-20 19 L1 32 L-2 20 L-17 9 L-21 -13Z', '#625c6c', 'none');
      body += p('M1 -14 L12 -7 L23 -2 L17 29 L9 23 L4 3Z', '#9b8c99', 'none');
      body += p('M8 -17 L22 -15 L18 -4 L2 -1 L0 7 L-6 4 L-5 -10Z', '#ad58c6', '#514258', 0.7);
      body += p('M8 -17 L22 -15 L18 -4 L9 -6 L-6 4 L-5 -10Z', '#8b429e', 'none');
      body += p('M8 -17 L9 -6 L-6 4 L-5 -10Z', '#c471d9', 'none');
      body += p('M20 13 L31 9 L37 -4 L36 5 L31 15 L19 23 L17 29Z', '#302f39', 'none');
      body += l('M-21 -23 L-24 -13 M-18 15 L0 28 M28 -9 L34 -3', '#c0b1bc', 0.85);
      return g(`translate(${x} ${y}) rotate(${angle}) scale(.76 .54)`, body);
    };
    return cuff(220, 486, -12) + cuff(262, 501, -12);
  }

  function crossbow(colors) {
    // Limestone, faded olive cloth and honey-brown timber separate the black metal.
    let art = p('M20 550 V180 L84 119 L180 34 L275 119 L340 180 V550Z', '#8d9789', '#5d6c71', 1.8);
    art += p(
      'M20 191 L79 134 L135 111 L180 59 L231 110 L281 134 L340 191 V429 H20Z',
      '#c4c4a8',
      '#8b978c',
      1.5
    );
    art += p(
      'M21 226 L75 208 L61 349 L20 384Z M340 226 L287 206 L299 348 L340 384Z',
      colors[1],
      '#6c7d78',
      1.2
    );
    art += l(
      'M20 247 H340 M20 303 H340 M20 363 H340 M58 191 V247 M120 143 V247 M246 146 V247 M300 191 V247 M89 248 V302 M219 248 V302 M52 304 V363 M170 304 V363 M283 304 V363',
      '#8e9a89',
      1.2
    );
    art += p('M67 164 L293 164 L290 187 H64Z', '#6a644c', '#a4aa91', 1.4);
    art += p(
      'M79 187 L280 185 L300 416 L263 433 L227 423 L186 435 L145 423 L99 434 L66 419Z',
      '#b4b89a',
      '#7a826f',
      1.6
    );
    art += p(
      'M80 189 L93 194 L78 409 L99 429 L79 427 L67 416Z M271 191 L280 189 L299 416 L279 430 L288 408Z',
      '#8b967b',
      'none'
    );
    art += l(
      'M104 202 L102 415 M251 199 L264 416 M124 421 L148 411 L170 427 M193 431 L222 410 L245 425',
      '#d4d4b7',
      1.1
    );
    art += p('M230 134 L251 150 L169 425 L140 426Z', '#e7dab0', 'none', 0, 'opacity=".24"');
    art += p(
      'M76 176 L83 168 L90 175 L86 184 L78 183Z M271 175 L278 168 L285 176 L279 184Z',
      '#5d6762',
      '#e1dfba',
      1.2
    );
    art += p(
      'M20 436 L78 406 L104 433 L180 425 L258 434 L289 408 L340 437 V550 H20Z',
      '#7a846e',
      '#b3b796',
      1.6
    );
    art += p('M43 485 L103 450 L241 451 L321 486 L246 522 L105 525Z', '#b69f6e', '#ece0b6', 1.9);
    art += p(
      'M43 485 L105 525 L246 522 L321 486 V516 L246 550 H106 L43 519Z',
      '#746748',
      '#b8ad82',
      1.8
    );
    art += l(
      'M58 484 L106 511 L245 508 L301 483 M72 492 L108 515 M122 463 L146 471 M188 458 L218 470 M122 530 V548 M245 526 V547',
      '#d3be8e',
      1.2
    );
    // Three-quarter view follows the full OSRS model, with charcoal rather than violet metal.
    let bow = p(
      'M664 108 L718 117 L585 353 L568 401 L548 499 L469 720 L370 695 L371 576 L479 406 L529 330 L615 171Z',
      '#373940',
      '#222b32',
      4.5
    );
    bow += p('M664 108 L687 115 L565 329 L541 367 L529 330 L615 171Z', '#626570', 'none');
    bow += p('M479 406 L529 414 L535 486 L463 608 L399 591 L371 576Z', '#4d5059', 'none');
    bow += p('M371 576 L399 591 L463 608 L467 721 L370 695Z', '#45484e', '#2d343a', 2.5);
    bow += p('M535 486 L548 499 L469 720 L463 608Z', '#252d34', 'none');
    bow += p(
      'M411 49 L579 49 L641 61 L687 62 L779 91 L836 117 L886 146 L925 163 L925 190 L866 265 L952 285 L977 278 L998 267 L984 245 L1033 278 L1033 313 L975 345 L951 345 L890 332 L788 316 L746 249 L806 248 L841 201 L835 177 L786 146 L740 137 L670 126 L602 105 L569 96 L498 95 L469 113 L469 131 L444 130 L418 115 L397 94 L387 155 L296 136 L272 111 L291 91 L306 68 L253 89 L245 112 L252 159 L266 185 L399 235 L472 220 L512 193 L430 194 L425 91 L411 79Z',
      '#3e4149',
      '#252d35',
      5.2
    );
    bow += p(
      'M411 49 L579 49 L641 61 L687 62 L779 91 L836 117 L886 146 L925 163 L915 187 L866 184 L858 163 L821 142 L784 127 L738 117 L667 109 L592 90 L566 78 L465 84Z',
      '#666873',
      'none'
    );
    bow += p(
      'M425 91 L444 105 L444 130 L418 115 L397 94 L387 155 L397 190 L430 194 L472 220 L399 235 L266 185 L252 159 L245 112 L253 89 L268 81 L261 115 L270 142 L301 159 L390 180 L399 96Z',
      '#535862',
      'none'
    );
    bow += p(
      'M746 249 L806 248 L865 272 L952 285 L975 279 L975 312 L951 345 L890 332 L788 316Z',
      '#575b64',
      'none'
    );
    bow += p(
      'M952 285 L975 279 L998 267 L984 245 L1033 278 L1033 313 L975 345 L951 345 L951 315Z',
      '#70717a',
      'none'
    );
    bow += p('M866 184 L915 187 L866 265 L824 252 L841 201Z', '#2e353d', 'none');
    bow += p('M579 49 L672 2 L672 67Z M727 83 L778 26 L792 92Z', '#413641', '#293039', 3.5);
    bow += p('M616 51 L663 12 L651 60Z M739 82 L770 39 L769 87Z', '#8555a5', 'none');
    bow += l(
      'M463 91 L494 88 M602 92 L670 112 M785 135 L823 154 M386 197 L420 208 M800 302 L890 320 M966 287 V320 M389 605 L388 680',
      '#a2a39d',
      2.4
    );
    bow += `<path d="M266 185 L550 355 L975 345" fill="none" stroke="#ddd6bd" stroke-width="3.5" data-art-effect="zaryte-string">${a('d', 'M266 185 L550 355 L975 345;M266 185 L550 355 L975 345;M266 185 L532 384 L975 345;M266 185 L532 384 L975 345;M266 185 L550 355 L975 345;M266 185 L550 355 L975 345', '0;.24;.34;.39;.405;1')}</path>`;
    // Dragon_bolts_1_detail.png: red metal shaft and point, with flat pale vanes.
    const bolt = g(
      'translate(550 355) rotate(32)',
      p('M-4 6 L-5 -126 L5 -126 L4 6 L0 13Z', '#984b34', '#4e3631', 1.8) +
        p('M-4 6 L-5 -126 L-1 -126 L0 13Z', '#bb6945', 'none') +
        p('M0 -162 L13 -131 L7 -121 L-7 -121 L-13 -131Z', '#9c452b', '#4e3631', 1.8) +
        p('M0 -162 L-13 -131 L0 -127Z', '#bc6538', 'none') +
        p('M0 -162 L13 -131 L7 -121 L0 -127Z', '#733a2d', 'none') +
        p('M-4 -19 L-18 -10 L-20 9 L-7 8 L-4 -4Z', '#c7c9b5', '#6f7468', 1.4) +
        p('M4 -18 L17 -9 L20 9 L7 9 L4 -4Z', '#b2b9a8', '#6f7468', 1.4) +
        p('M-4 -19 L-18 -10 L-7 8 L-4 -4Z', '#d8d9c4', 'none') +
        p('M-2 -18 L2 -18 L1 3 L-1 10Z', '#d8d9c4', 'none'),
      'data-relic="dragon-bolt"'
    );
    bow += on(
      `<g>${move('0 0;0 0;-18 29;-18 29;150 -240;150 -240;0 0;0 0', '0;.24;.34;.39;.46;.52;.63;1')}${bolt}</g>`,
      '0;0;1;1;0;0',
      '0;.22;.24;.42;.47;1',
      14,
      'data-art-effect="zaryte-bolt"'
    );
    bow += on(
      `<g>${move('0 0;0 0;150 -240;150 -240;0 0;0 0', '0;.39;.46;.53;.63;1')}${l('M535 377 L618 244', '#dca283', 5)}</g>`,
      '0;0;.65;0;0',
      '0;.389;.405;.48;1'
    );
    art += g('translate(22 155) scale(.4) translate(-245 0)', bow, 'data-relic="zaryte-crossbow"');
    art += nihilHorn();
    art += p('M194 469 L258 472 L295 493 L270 523 L206 504 L190 483Z', '#596553', '#9fa181', 1.2);
    art += zaryteVambraces();
    return art;
  }

  function ornament(x, y, index) {
    const scene = index % sceneCount;
    let body = p('M0 -22 L15 -10 L17 12 L0 23 L-17 12 L-15 -10Z', '#41394d', '#b59fbc', 1.5);
    if (scene === 1)
      body += p('M0 -13 L3 -3 L12 0 L3 3 L0 13 L-3 3 L-12 0 L-3 -3Z', '#c2d9d4', '#628597', 1.3);
    else if (scene === 2)
      body +=
        p(
          'M-10 9 L-12 -4 L-8 -13 L-3 -7 L0 -14 L4 -7 L9 -12 L12 -3 L9 10 L0 15Z',
          '#76717f',
          '#c1b2c9',
          1.1
        ) + l('M-7 -1 L-1 2 M3 2 L8 -2', '#bd7c96', 2);
    else body += zaros(0, 0, 0.24, scene === 0 ? '#b69cbf' : '#9d75b5', '#d1b8d6');
    return g(`translate(${x} ${y})`, body);
  }
  const frameOrnaments = (count, index, uid, celebrate, { anchors }) =>
    anchors
      .map(([x, y], i) =>
        count >= (i + 1) * 25
          ? `<g data-ornament="${i + 1}">${ornament(x, y, index)}</g>`
          : `<circle cx="${x}" cy="${y}" r="4" fill="#332b22" stroke="#6e5c43"/>`
      )
      .join('');
  const renderScene = (colors, panes, index) => {
    const id = 'nex-scene-' + ++instance;
    return `${panes}<g data-nex-scene="${index % sceneCount}">${[nex, door, torva, hilt, bodyguards, crossbow][index % sceneCount](colors, id)}</g>${tracery(colors)}`;
  };
  const art = createGlassWindow({
    config,
    esc,
    getJournal,
    sceneColors,
    renderScene,
    frameOrnaments,
  });
  const shrineMarkup = (pieces) =>
    Array.from({ length: 4 }, (_, i) => {
      const count = Math.max(0, Math.min(25, pieces - i * 25));
      return `<div class="shrine-totem ${count === 25 ? 'awake' : count ? 'charging' : ''}"><svg viewBox="-40 -40 80 90" role="img" aria-label="Sigil ${i + 1}: ${count} of 25 kills">${zaros(0, 0, 0.55, count === 25 ? '#af80ce' : '#51435d', '#9d83a9')}</svg><small>${count === 25 ? 'SEALED' : count + ' / 25'}</small></div>`;
    }).join('');
  return { art, shrineMarkup, sceneColors };
};
