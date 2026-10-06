function akkhaShadowCycle(svg) {
  const palette = new Map([
    // Olive skin and legs.
    ['#8f795a', '#69715b'],
    ['#bba398', '#92977b'],
    ['#b3a399', '#828970'],
    ['#d5c4b7', '#a3aa8c'],
    ['#ab998d', '#6d7764'],
    ['#65565a', '#484749'],
    ['#ddd0bc', '#90977a'],
    // Silver armour, dark grey boots, and the muted belt.
    ['#d0c5a9', '#adb3b6'],
    ['#86766b', '#565963'],
    ['#c7b899', '#b0b3ac'],
    ['#d6cbb1', '#bfc3c1'],
    ['#eee4cf', '#d7d9d5'],
    ['#b7a588', '#939b9a'],
    ['#bca581', '#979e8b'],
    ['#c39851', '#aaa6a3'],
    ['#bca59a', '#9a8f91'],
    ['#bca575', '#969a9c'],
    ['#594a3d', '#666b70'],
    ['#e6e3d7', '#d6d8d3'],
    ['#b7bdbe', '#bbc0c2'],
    // Teal cloth and crest; pale embroidered marks on the blue panels.
    ['#a26338', '#286779'],
    ['#654631', '#264b5b'],
    ['#e3dcd0', '#437e90'],
    ['#aa6b3d', '#d2d8d5'],
    ['#a86a3d', '#37778b'],
    ['#e8e3d7', '#d7dfdf'],
    ['#a46736', '#3b7d92'],
    // Grey helmet markings and blue/silver shield details.
    ['#e1dfd3', '#babfb8'],
    ['#f0e9d9', '#d5dad6'],
    ['#aa7444', '#727775'],
    ['#d9b774', '#919698'],
    ['#ad7540', '#3d8295'],
    ['#c09940', '#585761'],
    ['#b28b38', '#606469'],
    ['#79628b', '#4e8a9c'],
    ['#d7d2c7', '#d7d6d9'],
    ['#d5c9a4', '#bec4c5'],
  ]);
  // The existing spear hits the floor at .51 of each eight-second movement.
  // Two movements per palette cycle: switch at 4.08s, then back at 12.08s.
  return svg.replace(/<path([^>]*?)\/>/g, (whole, attributes) => {
    let animations = '';
    for (const property of ['fill', 'stroke']) {
      const match = attributes.match(new RegExp('\\b' + property + '="([^"]+)"'));
      const shadow = match && palette.get(match[1]);
      if (!shadow) continue;
      const normal = match[1];
      animations += `<animate attributeName="${property}" values="${normal};${normal};${shadow};${shadow};${normal};${normal}" keyTimes="0;.255;.2675;.755;.7675;1" dur="16s" repeatCount="indefinite"/>`;
    }
    return animations ? `<path${attributes}>${animations}</path>` : whole;
  });
}
/* Tombs-only SVG illustrations and approved scene motion, studied from the OSRS Wiki model/detail images:
 * Tumeken's_shadow, Akkha, Ba-Ba, Kephri, Zebak, both awakened Wardens and the phase-1 obelisk.
 * Original vector artwork; no remote assets. Identity colours stay fixed across editions.
 */
GLASS_RENDERERS.toa = function createTombsRenderer(config, { esc, getJournal }) {
  const sceneNumber = (index) => index % config.titles.length;
  const sceneColors = (index) =>
    config.palettes[
      (sceneNumber(index) + Math.floor(index / config.titles.length)) % config.palettes.length
    ];
  const path = (d, fill, stroke = '#302b30', width = 2.4) =>
    `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`;
  const line = (d, color = '#d1b876', width = 2) => path(d, 'none', color, width);
  const ring = (x, y, r, color) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${color}" stroke-width="2"/>`;

  function solarEclipseSky() {
    return `<g data-motion-effect="tumeken-solar-eclipse">
      <style>
        .tumeken-solar-moon { animation: tumeken-solar-crossing 26s linear infinite; }
        .tumeken-solar-fill { animation: tumeken-solar-fill 26s linear infinite; }
        .tumeken-solar-stroke { animation: tumeken-solar-stroke 26s linear infinite; }
        .tumeken-solar-fill.tumeken-solar-stroke { animation-name: tumeken-solar-fill, tumeken-solar-stroke; }
        .tumeken-solar-rim { animation: tumeken-solar-rim 26s linear infinite; }
        .tumeken-solar-corona { animation: tumeken-solar-corona 26s linear infinite; }
        @keyframes tumeken-solar-crossing {
          0%, 14% { transform: translateX(0); }
          44%, 56% { transform: translateX(140px); }
          86%, 100% { transform: translateX(280px); }
        }
        @keyframes tumeken-solar-fill {
          0%, 14%, 86%, 100% { fill: var(--solar-fill-light); }
          44%, 56% { fill: var(--solar-fill-dark); }
        }
        @keyframes tumeken-solar-stroke {
          0%, 14%, 86%, 100% { stroke: var(--solar-stroke-light); }
          44%, 56% { stroke: var(--solar-stroke-dark); }
        }
        @keyframes tumeken-solar-rim {
          0%, 14%, 86%, 100% { stroke: #e7c886; }
          44%, 56% { stroke: #dce7f6; }
        }
        @keyframes tumeken-solar-corona {
          0%, 14%, 86%, 100% { opacity: 0; }
          44%, 56% { opacity: .18; }
        }
        @media (prefers-reduced-motion: reduce) {
          .tumeken-solar-moon, .tumeken-solar-fill, .tumeken-solar-stroke, .tumeken-solar-fill.tumeken-solar-stroke,
          .tumeken-solar-rim, .tumeken-solar-corona { animation: none; }
        }
      </style>
      <defs><clipPath id="__tumeken-solar-clip__"><circle cx="180" cy="190" r="65"/></clipPath></defs>
      <circle cx="180" cy="190" r="65" fill="#e2ae48" stroke="#edcc86" stroke-width="2.2"/>
      <g clip-path="url(#__tumeken-solar-clip__)"><circle class="tumeken-solar-moon" cx="40" cy="190" r="62" fill="#101522"/></g>
      <circle class="tumeken-solar-rim" cx="180" cy="190" r="65.5" fill="none" stroke="#e7c886" stroke-width="3.3"/>
      <circle class="tumeken-solar-corona" cx="180" cy="190" r="70" fill="none" stroke="#dce7f6" stroke-width="6" opacity="0"/>
    </g>`;
  }

  function solarEclipseGlass(svg, colors, uid) {
    // Include panes outside the scene's fitted group; leave the staff and frame untouched.
    const start = svg.indexOf(`<g id="scene-${uid}">`);
    const end = svg.indexOf('<g data-tumeken-subject="true">', start);
    const shifts = new Map([
      [colors[0], ['#634832', '#24304c']],
      [colors[1], ['#927348', '#526687']],
      [colors[2], ['#bf7a3f', '#8b99b7']],
      [colors[4], ['#e6c58a', '#c3d2ec']],
      ['#615443', ['#76603f', '#3d465d']],
      ['#b29a70', ['#c9aa6e', '#a5b4d0']],
    ]);
    const background = svg
      .slice(start, end)
      .replace(/<(path|polygon|circle|ellipse)([^>]*?)\/>/g, (whole, tag, attributes) => {
        const classes = [];
        const properties = [];
        for (const property of ['fill', 'stroke']) {
          const attribute = attributes.match(new RegExp(`\\b${property}="([^"]+)"`));
          const shift = attribute && shifts.get(attribute[1]);
          if (!shift) continue;
          attributes = attributes.replace(
            `${property}="${attribute[1]}"`,
            `${property}="${shift[0]}"`
          );
          classes.push(`tumeken-solar-${property}`);
          properties.push(
            `--solar-${property}-light:${shift[0]};--solar-${property}-dark:${shift[1]}`
          );
        }
        if (!classes.length) return whole;
        return `<${tag}${attributes} class="${classes.join(' ')}" style="${properties.join(';')}"/>`;
      });
    return (svg.slice(0, start) + background + svg.slice(end)).replaceAll(
      '__tumeken-solar-clip__',
      `tumeken-solar-${uid}`
    );
  }

  function seal(x, y, scale = 1, kind = 0) {
    const marks = [
      'M0 -12 V-17 M0 12 V17 M-12 0 H-17 M12 0 H17 M-9 -9 L-12 -12 M9 9 L12 12 M9 -9 L12 -12 M-9 9 L-12 12',
      'M0 -13 L8 0 L0 13 L-8 0Z M0 -8 V8',
      'M-10 5 L-7 -7 L3 -11 L11 0 L6 11 H-5Z M-7 -7 L0 1 L11 0 M0 1 L-5 11',
      'M0 -10 V11 M-9 -8 Q-16 0 -7 10 M9 -8 Q16 0 7 10 M-5 -11 L-9 -15 M5 -11 L9 -15',
      'M-12 -5 Q-6 -12 0 -5 T12 -5 M-12 5 Q-6 -2 0 5 T12 5',
      'M0 -14 L9 2 L0 15 L-9 2Z M0 -14 V15 M-9 2 H9',
    ];
    return `<g transform="translate(${x} ${y}) scale(${scale})"><circle r="22" fill="#51423d" stroke="#c9a35d" stroke-width="2"/>${ring(0, 0, 18, '#82714d')}${line(marks[kind], '#efd08a', 2)}${kind === 0 ? '<circle r="7" fill="#e8b654" stroke="#352b31" stroke-width="2"/>' : ''}</g>`;
  }

  function shadow() {
    return `<g transform="rotate(15 180 320)">
      ${path('M172 241 H186 V496 L179 517 L172 496Z', '#29272e')}
      ${path('M172 340 L186 330 V351 L172 361Z M172 388 L186 378 V399 L172 409Z M172 436 L186 426 V447 L172 457Z M172 480 L186 470 V491 L172 501Z', '#9c342c')}
      ${line('M178 283 V323 M178 365 V376 M178 413 V424 M178 459 V469', '#56505b', 3)}
      ${path('M166 282 L179 272 L192 282 L190 298 L177 304 L166 296Z M167 491 L179 485 L191 494 L188 508 L179 517 L168 508Z', '#cba037')}
      ${path('M171 220 L193 224 L190 251 L179 277 L170 263 L158 270 L164 247Z', '#8f3329')}
      ${path('M163 178 L176 163 L193 164 L205 179 L199 203 L191 217 L169 224 L156 208 L154 192Z', '#bf9230')}
      ${path('M159 187 L176 178 L184 193 L171 211 L157 206Z M178 164 L193 164 L205 179 L184 182Z', '#eed067', '#9c7529', 1.6)}
      ${path('M193 202 L221 213 L256 195 L289 152 L274 211 L248 239 L210 246 L184 224Z', '#ad4129')}
      ${path('M190 200 L222 205 L253 189 L289 152 L267 193 L229 219 L199 216Z', '#dfb741')}
      ${path('M210 246 L223 225 L248 239Z', '#cf752e', '#ad4129', 1)}
      ${path('M181 165 L163 148 L168 112 L181 85 L208 92 L228 112 L221 145 L200 163Z', '#241e25')}
      ${path('M173 109 L184 92 L204 97 L217 114 L210 142 L189 155 L169 143Z', '#100f16', '#493023', 1.5)}
      ${path('M208 92 L216 63 L221 90 L245 70 L231 102 L252 100 L233 119 L244 137 L224 136 L217 166 L207 151 L192 179 L197 151 L213 135 L220 111Z', '#d1a932')}
      ${path('M231 102 L255 90 L266 65 L279 69 L281 87 L264 106 L234 120Z', '#bf9330')}
      ${path('M258 67 L273 54 L289 59 L297 72 L292 89 L276 95 L261 86Z', '#dd8b28')}
      ${path('M273 54 L289 59 L277 67 L261 86 L258 67Z', '#8d571f', '#9e6d25', 1.5)}
      ${line('M213 87 L218 101 L227 107 M230 126 L217 140', '#f5d875', 2)}
    </g>`;
  }

  function akkha() {
    return akkhaShadowCycle(`<g data-motion-effect="toa-akkha-shadow-cycle">
      ${path('M145 333 L174 336 L171 403 L158 469 L133 474 L133 452 L140 392Z M192 336 L214 340 L227 407 L223 468 L200 473 L193 408 L178 382Z', '#8f795a')}
      ${path('M136 415 L160 418 L155 455 L132 461Z M201 415 L225 410 L225 450 L204 456Z', '#d0c5a9')}
      ${path('M132 458 L156 456 L155 483 L128 495 L111 490 L116 478Z M204 451 L225 450 L230 478 L247 484 L244 494 L213 491 L201 480Z', '#86766b')}
      ${path('M132 298 L207 298 L228 374 L203 406 L175 351 L150 403 L117 383Z', '#a26338')}
      ${path('M171 322 L187 322 L203 406 L179 389 L169 352 L150 403 L145 387Z', '#654631')}
      ${path('M128 304 L153 311 L147 381 L127 371Z M192 311 L210 312 L217 373 L201 385Z', '#e3dcd0')}
      ${path('M128 321 L140 329 L131 338Z M137 347 L145 357 L134 365Z M197 329 L209 334 L201 344Z M201 359 L214 363 L207 371Z', '#aa6b3d', '#aa6b3d', 1)}
      ${path('M131 212 L111 207 L91 229 L91 274 L109 287 L126 269 L133 240 M208 215 L227 207 L250 234 L239 281 L219 275 L211 248', '#c7b899')}


      ${path('M132 204 L159 196 L193 198 L214 215 L209 272 L195 300 L144 302 L126 269Z', '#d6cbb1')}
      ${path('M132 225 L170 243 L207 227 L201 258 L174 274 L135 257Z', '#eee4cf', '#b7a588', 1.5)}
      ${path('M137 269 L171 283 L203 265 L196 295 L150 298Z', '#bca581')}
      ${path('M139 292 L167 305 L197 292 L207 309 L183 319 L168 312 L148 320 L134 308Z', '#c39851')}
      ${path('M167 295 L181 301 L186 313 L175 324 L160 317 L156 305Z', '#bca59a')}
      ${path('M105 207 L121 198 L138 212 L130 239 L110 247 L91 232Z', '#a86a3d')}
      ${path('M109 211 L119 208 L115 219 L125 223 L117 231 L103 225 L102 217Z M125 230 L132 223 L129 237 L120 240Z', '#e8e3d7', '#e8e3d7', 1)}
      ${path('M149 168 L182 163 L195 179 L185 206 L168 214 L151 200Z', '#b3a399')}
      ${path('M163 176 L190 178 L184 197 L174 203 L164 191Z', '#d5c4b7', '#ab998d', 1)}
      ${line('M168 181 L176 183 M182 179 L188 178 M174 194 L182 193', '#65565a', 2)}
      ${path('M139 154 L147 122 L172 112 L195 132 L201 159 L187 179 L181 143 L167 141 L162 181 L151 197 L133 188Z', '#e1dfd3')}
      ${path('M146 126 L139 104 L148 82 L169 70 L196 77 L209 91 L193 96 L178 91 L161 111 L160 131Z', '#a46736')}
      ${path('M150 123 L155 105 L173 91 L189 91 L198 101 L189 116 L181 125Z', '#f0e9d9')}
      ${path('M165 147 L202 151 L221 137 L211 155 L181 163Z', '#d9b774')}
      ${path('M146 145 L154 150 L145 156Z M142 162 L151 165 L143 176Z M182 130 L190 134 L186 143Z M157 130 L163 136 L154 141Z', '#aa7444', '#aa7444', 1)}
      <g data-motion-effect="toa-akkha-spear-plant">
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -20;0 -20;0 8;0 0;0 0" keyTimes="0;.3;.43;.51;.63;1" calcMode="spline" keySplines=".42 0 .58 1;0 0 1 1;.42 0 .58 1;.42 0 .58 1;0 0 1 1" dur="8s" repeatCount="indefinite"/>
        ${path('M95 264 L112 273 L105 308 L83 331 L69 322 L82 300Z', '#ddd0bc')}${path('M72 313 L88 311 L96 326 L89 341 L77 339 L71 330Z', '#bba398')}${line('M75 123 L83 492', '#d7d2c7', 5)}
      ${path('M75 71 L64 116 L75 137 L83 112Z M82 469 L75 490 L84 521 L91 490Z', '#d5c9a4')}</g>
      <path d="M58 532 L70 528 L79 534 L88 529 L103 534 M65 540 L79 535 L92 542 M83 535 L86 546" fill="none" stroke="#d9b774" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" opacity="0">
        <animate attributeName="opacity" values="0;0;.8;0;0" keyTimes="0;.5;.55;.72;1" dur="8s" repeatCount="indefinite"/>
      </path>
      ${path('M220 209 Q247 184 278 213 L288 232 Q260 288 289 349 L275 380 Q239 406 211 378 L204 352 Q224 283 206 238Z', '#bca575', '#594a3d', 3)}
      ${path('M227 218 Q248 200 271 220 L277 234 Q251 291 278 349 L267 371 Q242 392 223 371 L214 350 Q233 282 219 239Z', '#e6e3d7')}
      ${path('M222 351 L239 362 L275 349 L269 365 L238 376 L221 363Z', '#b7bdbe')}
      ${path('M238 237 L246 223 L251 242 L242 248Z M260 247 L267 234 L270 256Z M227 266 L235 261 L231 278Z', '#ad7540', '#ad7540', 1)}
      ${path('M246 264 L252 252 L257 266 L253 280 L262 296 L253 291 L253 320 L244 320 L244 291 L235 298 L242 280Z', '#c09940', '#b28b38', 1)}
      ${path('M245 258 L253 257 L253 266 L247 268Z M246 283 H253 V313 H246Z', '#79628b', '#79628b', 1)}
    </g>`);
  }

  function baba() {
    return `<g>
      ${path('M206 270 Q310 233 311 359 L300 434 L319 477 L292 489 L270 444 L253 383 L218 369Z', '#5d5540')}
      ${path('M243 349 L267 350 L279 391 L270 432 L289 460 L280 476 L257 443 L255 409Z', '#ded4bc')}
      ${path('M303 318 L320 350 L321 411 L309 448', 'none', '#cbc2ab', 10)}
      ${line('M310 350 L320 356 M312 369 L322 376 M312 391 L321 397 M309 415 L316 422', '#675949', 3)}
      ${path('M124 209 L174 196 L218 223 L266 255 L281 311 L252 361 L204 374 L158 337 L126 290Z', '#786548')}
      ${path('M210 236 L250 249 L274 277 L264 338 L232 352 L211 315Z', '#683f56')}
      ${path('M233 260 L253 269 L260 307 L245 330 L232 316 L242 294Z', '#a35e78', '#593b4b', 2)}
      ${path('M204 221 L216 217 L225 229 L235 225 L244 242 L254 239 L262 253 L273 250 L281 266 L269 276 L251 269 L230 250Z', '#e1d5bc')}
      ${path('M222 244 L219 272 L224 320 L214 349 L226 344 L237 318 L231 274 L233 253 M241 255 L243 281 L249 313 L238 340 L249 331 L260 307 L253 275 L254 265', '#d9d1bb')}
      ${path('M110 246 L156 251 L176 304 L164 381 L148 451 L155 485 L123 505 L94 497 L95 473 L110 438 L112 357 L89 311Z', '#655b41')}
      ${path('M111 326 L130 348 L122 425 L111 467 L127 481 L103 487 L99 471 L113 423Z', '#95805a', '#726046', 1.7)}
      ${path('M192 307 L214 329 L217 381 L206 440 L221 473 L209 496 L178 491 L168 473 L178 435 L176 369Z', '#514b38')}
      ${path('M179 455 L197 461 L208 480 L202 491 L176 485 L170 474Z M98 480 L120 479 L137 493 L125 505 L96 499Z', '#bcb6a1')}
      ${line('M102 489 L108 498 M115 487 L122 499 M181 467 L184 484 M194 470 L198 487', '#575042', 2)}
      ${path('M82 213 L103 159 L146 142 L193 174 L213 217 L203 274 L176 326 L153 365 L150 290 L134 339 L125 285 L104 311 L94 261 L69 269Z', '#998055')}
      ${path('M105 173 L145 150 L181 174 L192 206 L170 242 L146 271 L128 251 L114 292 L106 248 L84 251 L88 212Z', '#baa16b')}
      ${path('M178 184 L210 218 L198 273 L173 313 L179 261 L160 282 L166 233Z', '#756044', '#756044', 1)}
      ${path('M99 207 L123 191 L151 211 L157 242 L141 262 L112 269 L93 251 L82 233Z', '#d4ccb4')}
      ${path('M89 233 L105 222 L125 235 L132 258 L113 279 L87 273 L76 254Z', '#eee4cb')}
      ${path('M89 237 L98 244 L87 254 L80 250Z M99 249 L105 251 L100 260Z M115 219 L128 213 L139 224 L128 238 L115 231Z', '#241d23', '#241d23', 1)}
      ${path('M90 272 L113 272 L128 260 L134 277 L120 292 L95 289 L82 279Z', '#d0c3a7')}
      ${path('M97 276 L112 279 L125 271 L119 287 L99 285Z', '#332129')}
      ${path('M86 260 L91 268 L92 281 L99 270 L104 267 M118 262 L126 252 L129 270 L121 282Z', '#f5ead2', '#a5967c', 1.3)}
      ${path('M88 209 L103 193 L117 198 L118 217 L103 208 L89 221Z M130 211 L151 218 L159 235 L145 233 L132 224Z', '#d4a333')}
      ${path('M98 195 L108 183 L119 195 L114 210 L102 210Z', '#b95d22', '#725124', 2)}
      ${path('M127 238 L142 231 L153 254 L150 279 L137 284 L137 263Z', '#765067')}
    </g>`;
  }

  function kephri() {
    const wing = (
      facing
    ) => `<g transform="translate(180 285) scale(${facing} 1)"><g data-motion-effect="toa-kephri-wingcase">
      <animateTransform attributeName="transform" type="rotate" values="0 0 0;7 0 0;0 0 0" keyTimes="0;.5;1" calcMode="spline" keySplines=".42 0 .58 1;.42 0 .58 1" dur="7s" repeatCount="indefinite"/>
      ${path('M-8 15 L-62 -20 L-106 -103 L-112 -187 L-75 -143 L-27 -95 L13 -39Z', '#58785f')}
      ${path('M-8 15 L-62 -20 L-106 -103 L-112 -162 L-95 -133 L-83 -86 L-40 -22 L7 -12Z', '#936155')}
      ${path('M-8 1 L-43 -28 L-86 -103 L-91 -146 L-75 -143 L-62 -100 L-20 -41 L14 -28Z', '#b07660', '#855544', 1.5)}
      ${path('M-112 -187 L-75 -143 L-62 -100 L-89 -112 L-106 -141Z', '#e3d4b5')}
      ${path('M-112 -187 L-107 -161 L-93 -149 L-96 -166Z M-102 -143 L-87 -130 L-80 -113 L-92 -119Z', '#3b2029', '#3b2029', 1)}
      ${path('M-96 -166 L-75 -143 L-69 -123 L-86 -137Z', '#c6ae51', '#c6ae51', 1)}</g>
    </g>`;
    return `${path('M102 361 L139 329 L204 329 L251 361 L267 423 L254 481 L221 516 L166 531 L120 508 L93 466 L86 414Z', '#766039')}
      ${path('M102 361 L155 347 L226 358 L250 404 L238 449 L183 481 L105 460 L88 416Z', '#8b7140', '#766039', 1)}
      ${line('M104 414 L215 368 M102 444 L247 387 M115 474 L254 417 M141 499 L239 457', '#a18a53', 2)}
      ${path('M148 478 l5 -8 5 6 8 -2 -5 8 -8 -1Z M216 457 l-4 -9 8 3 3 9Z', '#d4c49c', '#d4c49c', 1)}
      ${wing(1)}${wing(-1)}
      ${path('M143 264 L180 247 L216 265 L225 300 L207 328 L181 337 L149 324 L135 296Z', '#6f8a6a')}
      ${path('M153 263 L179 253 L209 269 L208 294 L179 314 L146 292Z', '#a16f56')}
      ${path('M155 285 L179 297 L204 284 L194 309 L181 318 L162 309Z', '#384c42')}
      ${path('M155 285 L161 296 L168 292 L176 305 L182 297 L191 301 L197 291 L204 284', '#e7dfbe', '#d6ccaa', 1)}
      ${path('M180 276 L187 284 L183 295 L175 296 L172 285Z', '#d8b547')}
      ${path('M160 320 L181 310 L199 321 L205 346 L189 360 L170 358 L155 341Z', '#617b59')}
      ${path('M171 320 L190 320 L194 335 L184 347 L171 339Z', '#d4b651')}
      ${path('M169 341 L163 365 L171 373 L181 346 L190 372 L199 363 L193 338Z', '#472a33')}
      ${line('M178 347 L171 383 L177 405 M185 350 L181 391 L185 417 M190 347 L193 379 L186 402', '#a4b849', 3)}
      ${[1, -1]
        .map(
          (
            s
          ) => `<g transform="translate(180 330) scale(${s} 1)"><g data-motion-effect="toa-kephri-foreleg">
        <animateTransform attributeName="transform" type="rotate" values="0 0 0;8 0 0;0 0 0" keyTimes="0;.5;1" calcMode="spline" keySplines=".42 0 .58 1;.42 0 .58 1" dur="7s" begin="-1.2s" repeatCount="indefinite"/>
        ${path('M24 0 L48 11 L63 45 L53 81 L39 114 L31 117 L44 78 L45 45 L28 24Z', '#cfb45e')}
        ${path('M33 -5 L65 4 L82 32 L88 68 L79 76 L73 40 L55 22 L28 13Z', '#a78e47')}
        ${path('M41 -9 L65 -30 L82 -48 L72 -19 L58 4Z', '#83906a')}
        ${line('M38 95 L47 98 M34 105 L42 109 M78 54 L85 51 M80 64 L88 61', '#e4cf82', 3)}
        ${line('M23 2 L35 -13 L42 -8 M29 8 L49 -3 L57 2', '#dcba54', 3)}</g>
      </g>`
        )
        .join('')}
      ${path('M180 135 L193 153 L187 169 L180 175 L170 163 L168 151Z', '#d9cbaa', '#94755f', 2)}
      ${path('M181 148 L185 154 L181 162 L177 155Z', '#d2ad42', '#b59a43', 1)}
      ${line('M178 171 L174 183 L181 191 L186 180 L183 172', '#d9cbaa', 3)}`;
  }

  function zebak() {
    return `<g>
      ${path('M218 292 Q316 287 318 377 L327 445 L293 466 L238 439 L206 391Z', '#425960')}
      ${path('M205 369 L244 359 L279 383 L295 426 L271 450 L224 436 L198 410Z', '#6a7a51')}
      ${path('M222 292 L248 277 L268 301 L287 293 L303 323 L315 327 L316 355 L327 374 L321 408 L310 398 L292 370 L268 347 L241 334Z', '#647586')}
      ${path('M247 282 L249 319 L271 341 L268 301 M287 300 L282 343 L301 364 L303 328 M312 344 L305 378 L320 401', '#3d4d5d', '#3d4d5d', 1)}
      ${path('M162 341 L146 374 L118 397 L97 417 L66 419 L65 406 L95 383 L116 347Z', '#526777')}
      ${path('M177 352 L220 354 L239 397 L236 433 L210 459 L175 482 L149 479 L155 460 L188 440 L197 418 L181 395Z', '#64798a')}
      ${path('M210 369 L221 396 L218 425 L187 456 L160 474 L175 476 L210 455 L234 430 L234 399 L220 363Z', '#4a5e6e', '#4a5e6e', 1)}
      ${line('M185 382 L225 391 M193 399 L232 411 M193 423 L224 432 M179 444 L207 452', '#354b57', 3)}
      ${path('M65 405 L57 421 L71 419 M78 405 L73 422 L86 417 M94 400 L89 416 L101 410 M157 462 L143 480 L158 480 M171 465 L164 486 L178 480 M187 461 L183 478 L196 470', '#baa565', '#716748', 1.5)}
      ${path('M113 249 L152 215 L194 221 L234 252 L241 303 L215 357 L182 385 L139 363 L100 323Z', '#56705c')}
      ${path('M136 221 L167 207 L199 220 L224 256 L216 314 L184 330 L145 302Z', '#ae723f')}
      ${path('M146 223 L159 215 L194 229 L209 253 L199 256 L177 236Z M166 246 L207 268 L209 285 L169 265Z M179 281 L213 304 L203 321 L179 306Z', '#583e38', '#583e38', 1)}
      ${path('M209 242 L231 248 L251 280 L242 332 L221 364 L201 360 L221 317 L223 278Z', '#c4b19a')}
      ${path('M124 282 L135 312 L160 345 L178 352 L169 379 L143 364 L116 331 L105 308Z', '#9a7b56')}
      ${path('M143 347 L170 357 L172 377 L148 374 L132 363Z', '#d7ad44')}
      ${path('M106 232 L138 223 L168 239 L176 272 L153 300 L116 304 L88 284 L56 284 L40 272 L47 252 L78 244Z', '#647487')}
      ${path('M48 254 L84 252 L104 242 L121 234 L148 239 L134 252 L101 267 L67 271 L42 268Z', '#82909c', '#82909c', 1)}
      ${path('M45 279 L75 285 L109 274 L147 273 L173 257 L160 298 L125 325 L84 323 L52 305Z', '#303e38')}
      ${path('M53 289 L78 298 L112 285 L148 285 L163 273 L152 299 L123 319 L84 316 L58 302Z', '#c5937a')}
      ${path('M56 309 L83 321 L122 321 L152 302 L147 321 L121 338 L81 334 L58 324Z', '#819363')}
      ${path('M53 282 L57 297 L64 286 M77 286 L83 300 L89 281 M111 277 L118 291 L124 277 M140 277 L143 290 L150 272 M67 313 L72 300 L79 317 M95 319 L103 304 L109 319 M123 312 L130 298 L136 305', '#e4d69b', '#c8bd86', 1)}
      ${path('M105 232 L118 213 L143 214 L158 227 L151 245 L125 252 L112 243Z', '#d8ad3c')}
      ${path('M118 216 L139 217 L152 228 L126 236 L109 233Z', '#f0ce62', '#d8ad3c', 1)}
      ${path('M125 251 L132 267 L151 261 L160 248 L159 277 L142 287 L131 279Z', '#cfa641')}
      ${path('M148 249 L170 241 L159 255 L146 258Z', '#a22f28', '#813128', 1.3)}
      ${line('M60 259 L69 258 M83 253 L92 252', '#3d4e5c', 3)}
    </g>`;
  }

  function warden(x, y, scale, elidinis) {
    const stone = (sx, sy, size = 1) => `<g transform="translate(${sx} ${sy}) scale(${size})">
      ${path('M-12 -8 L-2 -14 L11 -7 L14 5 L6 14 L-9 11 L-15 1Z', '#b7a58c', '#393438', 1.5)}
      ${path('M-12 -8 L-2 -14 L0 -1 L-15 1Z M0 -1 L11 -7 L14 5 L6 4Z M0 -1 L6 14 L-9 11Z', '#d2c1a4', '#8c7a67', 1)}
      ${path('M-9 -4 L-1 0 L-7 5Z M3 -4 L10 1 L4 6Z M-1 5 L3 10 L-4 10Z', '#473833', '#473833', 0.8)}
    </g>`;
    const greave = (sx, sy, angle) => `<g transform="translate(${sx} ${sy}) rotate(${angle})">
      ${path('M-21 -3 L-13 -12 L12 -12 L22 -3 L18 66 L7 89 L-17 77 L-23 22Z', '#bc9640')}
      ${path('M-14 -1 L10 -2 L16 8 L9 73 L3 80 L-12 69 L-17 17Z', '#3d3b40')}
      ${path('M3 44 L9 73 L3 80 L-12 69 L-7 31 L-5 58Z', '#5c5657', '#5c5657', 1)}
      ${
        elidinis
          ? path(
              'M-12 8 L-6 2 L0 9 L6 2 L13 9 M-11 19 H11 L5 26 H-5Z M-7 33 V45 M0 34 V48 M7 33 V45',
              'none',
              '#d1ad42',
              3
            )
          : path(
              'M-12 8 L-3 4 L10 8 L1 12 H-9Z M1 16 L7 22 L2 29 L10 35 L2 36 L-2 44 L-10 38 L-7 25 L-2 23 L-7 19Z M-5 49 H9 M1 44 V57',
              '#c5a64f',
              '#b99a47',
              1.2
            )
      }
      ${line('M-18 -3 L-12 -8 H10 L17 -1', '#e1c170', 2)}
    </g>`;
    const weapon = elidinis
      ? `${path('M88 17 L117 24 L109 45 Q69 70 91 113 L115 132 L108 168 L87 184 L63 171 L52 146 Q67 111 51 77 L55 43Z', '#9c4e44')}
         ${path('M87 32 L103 34 L94 48 Q62 76 82 118 L99 137 L92 157 L77 166 L63 151 Q77 110 61 78 L64 49Z', '#6e3734')}
         ${path('M84 38 L93 39 L82 51 L73 47Z M72 126 L79 135 L71 146 L64 140Z', '#393137', '#393137', 1)}
         ${line('M107 29 L95 46 M110 141 L99 155 L87 173', '#bc6c54', 2)}`
      : `${path('M-98 -50 L-78 -17 L-72 30 L-82 78 L-69 134 L-71 192 L-89 237 L-96 206 L-83 158 L-89 103 L-95 71 L-84 19 L-88 -17Z', '#a18c54')}
         ${path('M-98 -50 L-85 -18 L-82 25 L-91 70 L-85 103 L-83 158 L-96 206 L-89 237 L-77 194 L-77 134 L-89 78 L-79 29 L-82 -17Z', '#d0b773', '#84714b', 1.3)}
         ${line('M-98 -50 L-60 85 L-89 237', '#d8c8a0', 1.5)}`;
    return `<g transform="translate(${x} ${y}) scale(${scale})">
      ${weapon}
      ${path('M-37 117 L-4 119 L-10 185 L-17 236 L-43 232 L-48 172Z M8 121 L37 119 L52 170 L43 230 L16 235 L10 181Z', '#444246')}
      ${path('M-37 126 L-13 130 L-20 185 L-39 190 L-45 171Z M16 128 L33 128 L46 171 L35 186 L19 178Z', '#5b5658', '#5b5658', 1)}
      ${path('M-41 183 L-13 183 L-17 208 L-42 205Z M16 185 L42 181 L43 204 L20 211Z', '#c84a32')}
      ${path('M-30 185 L-13 183 L-17 204 L-26 200Z M18 187 L32 184 L27 205 L20 211Z', '#f47449', '#c84a32', 1)}
      ${greave(-31, 202, 5)}${greave(32, 202, -8)}
      ${path('M-47 277 L-20 277 L-15 302 L-51 306 L-64 299Z M19 277 L45 274 L64 299 L51 308 L16 303Z', '#4b484a')}
      ${path('M-45 283 L-24 284 L-30 296 L-57 298Z M23 284 L43 281 L55 298 L27 296Z', '#5f5759', '#5f5759', 1)}
      ${path('M-43 18 L-65 26 L-72 68 L-69 91 L-50 98 L-39 74Z M41 18 L64 29 L75 68 L66 93 L47 88 L37 66Z', '#4c494d')}
      ${path('M-66 45 L-53 47 L-49 67 L-69 83Z M52 47 L68 55 L72 70 L60 83 L49 64Z', '#60595c', '#60595c', 1)}
      ${path('M-68 81 L-48 87 L-53 103 L-65 106 L-77 93Z M51 81 L67 86 L78 103 L68 124 L49 123 L40 108Z', '#b43a2b')}
      ${path('M-72 87 L-52 91 L-56 109 L-73 121 L-87 108 L-87 95Z M51 87 L69 89 L81 107 L72 122 L51 118 L42 104Z', '#464247')}
      ${line('M-76 99 L-59 102 M-74 109 L-62 109 M53 99 L69 106 M51 109 L66 115', '#665a5c', 2)}
      ${path('M-38 9 L-16 -2 L22 -2 L41 16 L34 88 L23 121 L-27 119 L-41 88Z', '#302d33')}
      ${stone(-29, 58, 1.2)}${stone(31, 57, 1.2)}${stone(-19, 99, 0.9)}${stone(20, 99, 0.9)}
      ${path('M-25 101 L0 109 L25 100 L32 120 L20 143 L-19 141 L-31 120Z', '#74352e')}
      ${path('M-25 103 L0 114 L25 101 L13 132 L0 145 L-10 131Z', '#bf392a')}
      ${path('M-17 110 L0 115 L14 108 L6 127 L0 133 L-6 125Z', '#ed6442', '#c6452e', 1)}
      ${stone(-23, 125, 0.65)}${stone(23, 125, 0.65)}
      ${path('M-27 20 L27 20 L23 91 L0 99 L-25 90Z', '#be9946')}
      ${path('M-18 29 H19 L15 82 L0 88 L-17 81Z', '#a23b2e')}
      ${path('M-9 51 L0 45 L9 52 L7 69 L0 84 L-8 68Z', '#373136')}
      ${path('M-10 46 L0 39 L11 46 L9 53 L0 56 L-10 53Z M-7 57 L0 61 L8 57 L0 70Z', '#b69a68', '#766450', 1.2)}
      ${path('M-44 4 L-61 7 L-72 29 L-55 48 L-37 29Z M42 4 L62 9 L72 31 L56 49 L37 29Z', '#c4a14c')}
      ${path('M-58 10 L-66 24 L-50 21Z M-66 26 L-55 41 L-47 29Z M57 13 L48 22 L65 28Z M65 29 L57 43 L47 33Z', '#4b4142', '#4b4142', 1)}
      ${
        elidinis
          ? `${path('M-51 -115 L-45 -140 L-28 -161 L0 -174 L29 -161 L47 -141 L52 -116 L26 -103 H-28Z', '#a74e42')}
           ${path('M-44 -127 L-23 -120 L-31 -147 L-7 -130 L-4 -163 L12 -136 L30 -151 L27 -122 L47 -132 L35 -110 H-30Z', '#343037')}
           ${path('M-36 -122 L-3 -148 L35 -119 L19 -108 L1 -131 L-12 -107 L-31 -111Z', '#c7a039')}
           ${path('M-13 -107 L0 -123 L17 -108 L24 -59 L17 -43 L-17 -46 L-25 -61Z', '#4a4448')}
           ${path('M-45 -68 L-31 -104 L-10 -91 L19 -95 L45 -64 L54 -7 L43 30 L21 41 L-21 39 L-45 20 L-53 -11Z', '#a88641')}
           ${path('M-44 -55 L-30 -67 L-39 -41 L-31 -22 L-44 -8 L-34 10 L-41 23 L-49 3Z M32 -62 L46 -48 L36 -33 L47 -12 L37 4 L43 22 L29 31 L25 2Z', '#ab5542', '#8c4938', 1)}
           ${path('M-38 -75 L-24 -87 L-1 -81 L23 -91 L39 -76 L22 -61 L-4 -58 L-28 -63Z', '#302b30')}
           ${path('M-2 -80 L4 -96 L16 -103 L25 -97 L18 -95 L11 -94 L8 -80Z', '#d0a846')}
           ${path('M-23 -58 L-3 -52 L23 -59 L18 -29 L0 -14 L-21 -30Z', '#c0a049')}`
          : `${path('M10 -111 L15 -142 L23 -161 L30 -143 L22 -116Z', '#c4a24e')}
           ${path('M-43 -93 L-24 -113 L6 -116 L35 -99 L47 -66 L54 -23 L43 24 L22 42 L-25 37 L-47 14 L-54 -29Z', '#4b4549')}
           ${path('M-45 -69 L-30 -99 L-18 -82 L-36 -57 L-25 -34 L-41 -17 L-29 6 L-39 25 L-49 4 L-52 -29Z M29 -100 L42 -81 L31 -65 L44 -44 L30 -27 L46 -4 L35 22 L23 32 L20 -7Z', '#c0a055')}
           ${path('M-39 -58 L-31 -49 L-44 -35 L-49 -45Z M-37 -9 L-31 2 L-41 17 L-47 5Z M38 -63 L44 -48 L32 -41 L26 -53Z M40 -18 L45 -3 L30 5 L25 -9Z', '#a95240', '#8d4939', 1)}
           ${path('M-24 -105 L-10 -113 L13 -109 L30 -97 L28 -56 L-25 -56 L-33 -78Z', '#615759')}
           ${path('M-24 -105 L-17 -109 L-23 -61 L-30 -59Z M-6 -113 L2 -112 L-2 -59 H-10Z M14 -108 L21 -104 L23 -60 L15 -57Z', '#c5a352', '#b49755', 1)}
           ${path('M-25 -60 L0 -64 L28 -58 L22 -25 L3 -9 L-18 -21Z', '#cfab4e')}`
      }
      ${path('M-20 -48 L-9 -42 L-13 -36 L-22 -39Z M9 -44 L22 -48 L21 -39 L13 -35Z M-2 -36 L4 -23 L-6 -24Z', '#383137', '#383137', 1)}
      ${line('M-10 -20 L2 -16 L12 -22', '#675031', 1.8)}
      ${path('M0 -56 L7 -49 L2 -42 L-6 -48Z', '#d94c32', '#73372f', 1.3)}
      ${path('M-17 -25 L0 -14 L19 -26 L12 8 L0 22 L-13 7Z', '#a38542')}
      ${path('M-8 -12 L2 -5 L10 -11 L6 4 L-3 8Z', '#a64231', '#81372e', 1)}
      ${path('M-49 -49 L-31 -31 L-27 26 L-40 36Z M31 -30 L47 -46 L40 35 L25 27Z', '#373239')}
      ${line('M-32 -26 L-29 25 M30 -26 L27 26', '#d4b05c', 2)}
      ${stone(-62, 64, 0.82)}${stone(64, 69, 0.82)}
      ${stone(-74, 93, 0.7)}${stone(70, 106, 0.7)}
      ${stone(-37, 283, 0.92)}${stone(35, 285, 0.92)}
    </g>`;
  }

  function obelisk() {
    return `<g transform="translate(180 185) scale(.7)">
      ${path('M-47 416 L-70 438 L-48 461 L1 474 L56 454 L66 435 L40 419Z', '#84725d')}
      ${line('M-70 438 L-33 442 L-48 461 M-33 442 L1 474 L20 445 L56 454 M20 445 L40 419', '#4e4140', 2)}
      ${path('M-59 364 L-49 281 L-27 266 L-9 306 L21 307 L36 268 L55 291 L63 371 L45 425 L-38 432 L-61 408Z', '#423c40')}
      ${path('M-49 281 L-32 279 L-19 344 L-2 360 L30 344 L40 279 L55 291 L48 358 L29 395 L-36 406 L-61 385Z', '#68605d')}
      ${path('M-34 344 L-25 360 L-4 372 L28 354 L26 382 L-33 391Z', '#332e33')}
      ${path('M-25 329 L-11 304 L17 315 L26 344 L0 361Z', '#a13930')}
      ${path('M-11 304 L4 312 L-1 345 L-25 329Z', '#f07150', '#a13930', 1)}
      ${path('M-40 198 L-56 221 L-51 272 L-28 289 L28 284 L53 256 L51 210 L34 190Z', '#574128', '#b39a49', 2)}
      ${path('M-29 208 L-36 238 L-23 269 L20 269 L35 239 L23 207Z', '#ad382b')}
      ${path('M-27 217 L-16 208 L11 210 L27 225 L23 245 L12 260 L-14 257 L-27 243Z', '#e85f40', '#a23d2d', 1.6)}
      ${path('M-21 232 L-6 237 L-12 246 L-22 241Z M4 237 L20 230 L18 242 L8 246Z M-4 247 L3 249 L-1 255Z', '#37272c', '#37272c', 1)}
      ${path('M-24 202 L-16 189 L0 183 L18 192 L25 209 L18 224 L-3 230 L-23 220Z', '#ee9a79', '#b14431', 1.5)}
      ${path('M-17 195 L-3 190 L8 198 L5 210 L-10 216 L-20 207Z', '#ffd5b5', '#efb294', 1)}
      ${path('M-25 117 L-49 162 L-60 227 L-48 251 L-36 232 L-31 187 L-15 158 L-10 234 L2 246 L11 230 L13 156 L29 189 L36 228 L48 224 L49 186 L28 123Z', '#843e38')}
      ${path('M-45 170 L-60 227 L-48 251 L-43 208 L-32 180Z M-10 170 L-10 234 L2 246 L11 230 L6 170Z M30 175 L36 228 L48 224 L43 190Z', '#57484a')}
      ${path('M-34 87 L-22 75 L16 77 L35 105 L21 152 L7 166 L-22 139Z', '#443d43')}
      ${path('M-22 75 L4 101 L35 105 L21 152 L7 166 L-1 130 L-22 139 L-34 87Z', '#5b4b50', '#443d43', 1)}
      ${path('M0 0 L31 60 L21 81 L3 98 L-12 82 L-28 58Z', '#a9382c')}
      ${path('M0 0 L31 60 L13 56 L4 28 L-10 67 L-28 58Z', '#ce513a', '#a9382c', 1)}
      ${path('M-13 50 L8 44 L22 61 L20 88 L4 120 L-16 98 L-23 72Z', '#b23d2e')}
      ${path('M8 44 L22 61 L20 88 L4 120 L4 78Z', '#82332f', '#82332f', 1)}
      ${path('M-16 66 L-2 74 L-8 80 L-19 76Z M7 75 L20 64 L19 77 L10 83Z M-1 82 L4 93 L-5 93Z M-9 96 L2 105 L11 97 L3 112Z', '#393137', '#393137', 1.2)}
    </g>`;
  }

  function frameOrnaments(count, index, uid, celebrate, { anchors }) {
    return anchors
      .map(([x, y], i) =>
        count >= (i + 1) * 25
          ? `<g data-ornament="${i + 1}" class="${celebrate && (count === 100 || count === (i + 1) * 25) ? 'ornament-new' : ''}">${seal(x, y, 0.55, sceneNumber(index))}</g>`
          : `<circle cx="${x}" cy="${y}" r="4" fill="#332b22" stroke="#6e5c43"/>`
      )
      .join('');
  }

  function shrineMarkup(pieces, index, celebrate = false) {
    const colors = sceneColors(index);
    return Array.from({ length: 4 }, (_, i) => {
      const charge = Math.max(0, Math.min(25, pieces - i * 25)),
        awake = charge === 25;
      const carving = `${path('M-19 82 V-4 L0 -30 L19 -4 V82Z', '#827052')}${path('M0 -30 L19 -4 V82 H0Z', '#5a5046')}${line('M-23 83 H23 M-20 76 H20', '#ceb577', 3)}${seal(0, 20, 0.75, i + 1)}`;
      return `<div class="shrine-totem ${awake ? 'awake' : charge > 0 || i === Math.floor(pieces / 25) ? 'charging' : ''} ${celebrate && awake && (pieces === 100 || pieces === (i + 1) * 25) ? 'just-awakened' : ''}" style="--shrine-light:${colors[3]}"><svg viewBox="-40 -50 80 158" role="img" aria-label="Seal ${i + 1}: ${charge} of 25 raids"><defs><clipPath id="toa-charge-${i}"><rect x="-40" y="${85 - (charge / 25) * 135}" width="80" height="${(charge / 25) * 135}"/></clipPath><filter id="toa-stone-${i}"><feColorMatrix type="saturate" values="0"/></filter></defs><g filter="url(#toa-stone-${i})" opacity=".28">${carving}</g><g class="totem-light" clip-path="url(#toa-charge-${i})">${carving}</g></svg><small>${awake ? 'AWAKENED' : pieces < 100 && i === Math.floor(pieces / 25) ? charge + ' / 25' : 'WAITING'}</small></div>`;
    }).join('');
  }

  const renderArt = createGlassWindow({
    config,
    esc,
    getJournal,
    sceneColors,
    frameOrnaments,
    renderScene(colors, panes, index) {
      const scene = sceneNumber(index);
      const rays = Array.from(
        { length: 12 },
        (_, i) =>
          `<path transform="translate(180 190) rotate(${i * 30})" d="M0 -63 L-12 -99 L0 -111 L12 -99Z" fill="${i % 2 ? colors[2] : colors[1]}" stroke="#352d31" stroke-width="2"/>`
      ).join('');
      const arch = `${path('M43 550 V232 Q43 138 180 64 Q317 138 317 232 V550Z', colors[0])}${line('M43 550 V232 Q43 138 180 64 Q317 138 317 232 V550', colors[4], 1.5)}`;
      const floor = `${path('M20 484 L180 445 L340 484 V550 H20Z', '#615443')}${line('M20 509 H340 M20 534 H340 M111 466 L85 550 M248 464 L276 550 M180 447 V550', '#b29a70', 1.5)}`;
      let illustration;
      if (scene === 0) {
        illustration = `${rays}${solarEclipseSky()}${ring(180, 190, 117, '#b29a68')}${floor}<g data-tumeken-subject="true">${shadow()}</g>${seal(78, 478, 0.8)}${seal(280, 478, 0.8)}`;
      } else if (scene === 1) {
        illustration = `${path('M180 64 L289 231 L180 456 L70 231Z', '#797b7c', '#c7c8b1', 2)}${ring(180, 233, 113, '#d0c6a0')}${line('M180 82 V435 M71 233 H289 M102 151 L259 314 M103 314 L258 151', '#b1b6ad', 1.5)}${floor}${akkha()}`;
      } else if (scene === 2) {
        illustration = `${path('M39 279 L69 162 L112 140 L168 180 L218 122 L281 166 L322 287Z', '#645347')}${path('M65 251 L100 186 L134 228 L176 198 L210 256 L269 202 L307 273 L322 500 H40Z', '#3e3539')}${ring(180, 257, 115, '#ac8863')}${floor}${baba()}
        <path d="M252 510 L277 475 L309 489 L333 519 L305 542 L270 537Z" fill="#8a7554" stroke="#302b30" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M277 475 L293 514 L333 519 M293 514 L270 537" fill="none" stroke="#534538" stroke-width="2" stroke-linejoin="round"/>
        <g data-motion-effect="toa-baba-bottom-roll">
          <animateMotion path="M-115 474 L475 474" dur="11s" repeatCount="indefinite"/>
          <ellipse cx="0" cy="70" rx="72" ry="6" fill="#302b30" opacity=".5"/>
          <path d="M-63 63 Q-88 71 -114 61 M-72 48 Q-97 56 -130 45 M-75 70 L-137 69" fill="none" stroke="#b29a70" stroke-width="2.3" stroke-linecap="round" opacity=".4"/>
          <g>
            <animateTransform attributeName="transform" type="rotate" values="0;540" dur="11s" repeatCount="indefinite"/>
            <g transform="scale(1.85)"><g transform="translate(-63 -500)">
              <path d="M29 491 L54 461 L81 477 L96 512 L68 534 L32 522Z" fill="#8a7554" stroke="#302b30" stroke-width="2.4" stroke-linejoin="round"/>
              <path d="M54 461 L63 499 L96 512 M63 499 L32 522" fill="none" stroke="#534538" stroke-width="2" stroke-linejoin="round"/>
            </g></g>
          </g>
        </g>`;
      } else if (scene === 3) {
        illustration = `${ring(180, 300, 128, '#bba76b')}${line('M58 329 Q180 461 302 329 M52 353 Q180 485 308 353 M83 192 L279 448 M277 192 L82 448', '#788a6c', 1.5)}${floor}${kephri()}`;
      } else if (scene === 4) {
        illustration = `${path('M20 280 Q98 249 180 277 T340 275 V550 H20Z', '#345b5d')}${ring(180, 232, 106, '#a6b68b')}${Array.from({ length: 5 }, (_, i) => line(`M20 ${370 + i * 37} Q70 ${347 + i * 37} 120 ${370 + i * 37} T220 ${370 + i * 37} T340 ${370 + i * 37}`, i % 2 ? '#799d8a' : '#bdc8a0', 2)).join('')}${zebak()}
        <g data-motion-effect="toa-zebak-river">
          <path d="M20 481 Q70 458 120 481 T220 481 T340 481" pathLength="100" fill="none" stroke="#dce0ba" stroke-width="5" stroke-linecap="round" stroke-dasharray="14 86" stroke-dashoffset="0" opacity=".85">
            <animate attributeName="stroke-dashoffset" values="14;-86" dur="10s" repeatCount="indefinite"/>
          </path>
          <path d="M20 518 Q70 495 120 518 T220 518 T340 518" pathLength="100" fill="none" stroke="#dce0ba" stroke-width="5" stroke-linecap="round" stroke-dasharray="14 86" stroke-dashoffset="0" opacity=".9">
            <animate attributeName="stroke-dashoffset" values="14;-86" dur="10s" begin="-4s" repeatCount="indefinite"/>
          </path>
        </g>${path('M30 535 L46 489 L58 506 L65 476 L78 531 M289 533 L306 484 L308 510 L329 491 L323 537', 'none', '#aca879', 3)}`;
      } else {
        const diamondRays = Array.from({ length: 12 }, (_, i) => {
          const orange = i % 2 === 1;
          return `<g transform="translate(180 190) rotate(${i * 30})">
            ${path('M0 -83 L-13 -108 L0 -132 L13 -108Z', orange ? colors[2] : colors[1], '#352d31', 2)}
            ${path('M0 -132 L-13 -108 L0 -83Z', orange ? '#d6a366' : '#92b2c0', orange ? '#9b744c' : '#607f8e', 1.2)}
          </g>`;
        }).join('');
        illustration = `${path('M180 64 L329 197 V477 L180 520 L31 477 V197Z', '#3c303d', '#ac875e', 2)}
          ${path('M180 87 L299 207 V447 L180 481 L61 447 V207Z', '#2d2932', '#665154', 2)}
          ${line('M61 207 L180 174 L299 207 M61 273 L180 246 L299 273 M61 447 L180 409 L299 447 M180 87 V174', '#756053', 1.4)}
          <g data-motion-effect="toa-warden-diamonds">
            <animateTransform attributeName="transform" type="rotate" values="0 180 190;360 180 190" dur="24s" repeatCount="indefinite"/>
            ${diamondRays}
          </g>${ring(180, 190, 94, '#edc881')}
          ${path('M180 65 L199 107 L180 146 L161 107Z', '#af884a')}
          ${path('M180 65 V146 L161 107Z', '#e2bd70', '#997549', 1.4)}
          ${line('M163 105 L144 89 L129 111 L146 133 M197 105 L216 89 L231 111 L214 133', '#b39159', 2)}
          ${path('M20 482 L180 437 L340 482 V550 H20Z', '#51434a')}
          ${path('M20 482 L83 463 L121 490 L69 512 L20 504Z M243 489 L285 465 L340 482 V507 L296 515Z M121 490 L180 467 L243 489 L207 522 L151 521Z', '#6b5556', '#302b31', 2)}
          ${line('M69 512 L98 550 M151 521 L139 550 M207 522 L223 550 M296 515 L274 550', '#a38870', 1.6)}
          ${path('M104 510 L119 498 L132 512 L120 516 L141 535 L124 533Z M240 511 L251 500 L268 516 L253 513 L244 535 L228 535Z', '#bd4937', '#613735', 1.3)}
          ${warden(100, 275, 0.73, false)}${warden(251, 275, 0.73, true)}
          ${line('M159 333 L143 318 L151 301 L134 287 M201 333 L217 315 L207 298 L228 283 M160 365 L144 383 L155 396 L130 424 M201 368 L217 387 L207 401 L233 427', '#bb573d', 5)}
          ${line('M159 333 L143 318 L151 301 L134 287 M201 333 L217 315 L207 298 L228 283 M160 365 L144 383 L155 396 L130 424 M201 368 L217 387 L207 401 L233 427', '#efaa67', 1.7)}
          ${obelisk()}
          <g data-motion-effect="toa-warden-crimson-lightning" fill="none" stroke-linejoin="round" stroke-linecap="round">
            <path d="M180 329 L173 352 L184 375 L175 402 L185 427 L174 449 L183 479 L177 515 M184 375 L201 390 L196 411 M175 402 L157 420 L161 439" stroke="#a13930" stroke-width="7" opacity="0">
              <animate attributeName="opacity" values="0;0;.16;.32;.9;0;0" keyTimes="0;.42;.59;.72;.77;.85;1" dur="9s" repeatCount="indefinite"/>
            </path>
            <path d="M180 329 L173 352 L184 375 L175 402 L185 427 L174 449 L183 479 L177 515 M184 375 L201 390 L196 411 M175 402 L157 420 L161 439" stroke="#ed6442" stroke-width="3.8" opacity="0">
              <animate attributeName="opacity" values="0;0;.2;1;0;0" keyTimes="0;.59;.72;.77;.85;1" dur="9s" repeatCount="indefinite"/>
            </path>
            <path d="M180 329 L173 352 L184 375 L175 402 L185 427 L174 449 L183 479 L177 515 M184 375 L201 390 L196 411 M175 402 L157 420 L161 439" stroke="#ffd5b5" stroke-width="1.3" opacity="0">
              <animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;.72;.77;.85;1" dur="9s" repeatCount="indefinite"/>
            </path>
          </g>${seal(180, 530, 0.5, 5)}`;
      }
      return `${panes}${arch}${illustration}${line('M62 540 H298', colors[4], 1.3)}`;
    },
  });
  const art = (...args) => {
    const svg = renderArt(...args);
    return sceneNumber(args[1]) === 0 ? solarEclipseGlass(svg, sceneColors(args[1]), args[2]) : svg;
  };
  return { art, shrineMarkup, sceneColors };
};
