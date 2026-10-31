/* global GLASS_NEW_SCENES */
/* Refined pass 2: bespoke Justiciar armour, never the Theatre of Blood set.
 * Actual current model, concept and encounter footage inspected:
 * https://oldschool.runescape.wiki/w/File:Ezekiel.png
 * https://oldschool.runescape.wiki/w/File:Ezekiel_concept_art.png
 * https://oldschool.runescape.wiki/w/Ezekiel#Enrage_Phase
 * Reopened the model and concept after inspecting the initial full-size and
 * complete-cycle review images. Broadened/faceted the fur, turned the helmet,
 * staggered the rear leg, restored the long cape and sharpened the forked blade.
 * The held hilt and both hands remain one fixed assembly through the loop.
 * Spinning-sword feedback: inspected the separate Animated Sword model and
 * both actual charge/launch clips, not Ezekiel's held curved greatsword:
 * https://oldschool.runescape.wiki/w/File:Animated_Sword.png
 * https://oldschool.runescape.wiki/w/Animated_Sword
 * https://oldschool.runescape.wiki/images/Ezekiel_-_animated_swords_1.mp4
 * https://oldschool.runescape.wiki/images/Ezekiel_-_animated_swords_2.mp4
 * This sword has silver fittings and a GREEN grip, rather than gold fittings.
 * Feedback refinement: compared the first new still/action/cycle renders with
 * that model again. Restored brighter green wraps and blade facets, stopped
 * the spin before the straight launch, and shortened the flight to keep its
 * whole silhouette clear of the arch. Fade-out conceals the return/reset.
 * Identity colours stay fixed through the glass editions. */
GLASS_NEW_SCENES.ezekiel = (h, _c, id) => {
  const { p, l, g, ellipse, a, move, turn, on } = h;
  const ink = '#2c2936';
  const silver = '#b7b4bd';
  const shadow = '#747482';
  const gold = '#b59b53';
  const gilt = '#d7c17a';
  const purple = '#5e527f';
  let scene = `<defs><linearGradient id="${id}-floor" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#606664"/><stop offset="1" stop-color="#383b43"/></linearGradient></defs>`;

  // Grey arena paving and receding ranks of swords, as in the enrage footage.
  scene += p('M35 399 L145 354 L244 359 L325 411 V535 H35Z', `url(#${id}-floor)`, '#737777', 1.6);
  scene += p('M145 354 L244 359 L325 411 L245 399 L122 393 L35 418 V399Z', '#7c8279', 'none');
  scene += l(
    'M35 436 L127 407 L247 410 L325 438 M35 469 L125 443 L250 447 L325 475 M35 510 L126 487 L255 493 L325 518 M97 535 L156 356 M181 535 L193 357 M273 535 L226 359',
    '#b0b2a3',
    1.4,
    'opacity=".6"'
  );
  scene += l(
    'M53 430 L60 463 M92 417 L96 452 M147 408 L146 445 M203 409 L207 447 M267 416 L279 456 M59 480 L64 504 M98 453 L101 495 M162 446 L162 491 M223 448 L232 494 M288 464 L306 513',
    '#343b3e',
    1.3
  );
  scene += p(
    'M38 365 L57 354 L85 355 L87 374 L37 383Z M277 355 L305 356 L324 368 V384 L277 375Z',
    '#73716b',
    '#3e4346',
    1.4
  );
  scene += l('M43 370 L75 365 M285 364 L318 373', '#9b9a88', 1.1);

  function plantedSword(x, y, scale, lean = 0, charged = false) {
    let b = ellipse(0, 77, 11, 3, '#292f35', 'none');
    b += p('M-3 -25 L0 -35 L4 -25 L3 53 L0 75 L-3 53Z', '#9ea4ac', ink, 1.3);
    b += p('M0 -35 L4 -25 L3 53 L0 75Z', '#d1d3cf', 'none');
    b += p('M-14 49 L-14 44 L-3 47 L3 47 L15 42 L15 49 L4 52 L-3 52Z', '#a99761', ink, 1.3);
    b += p('M-3 31 L3 31 L3 46 L-3 46Z', '#5b4a48', ink, 1.1);
    b += p('M-4 28 L0 24 L5 28 L3 33 L-3 33Z', '#c3b68b', ink, 1.1);
    if (charged) {
      const flash =
        p('M0 -43 L-8 -24 L5 -17 L-7 2 L6 12 L-3 27', 'none', '#bce9dc', 2.4) +
        p('M-3 -26 L-15 -19 L-11 -7 M6 10 L17 13 L12 26', 'none', '#66cacd', 1.7) +
        ellipse(0, 75, 16, 4, '#71d9cb', 'none', 0, 'opacity=".6"');
      b += on(flash, '0;0;.9;.25;.85;0;0', '0;.47;.49;.51;.535;.56;1', 24);
    }
    return g(`translate(${x} ${y}) rotate(${lean}) scale(${scale})`, b);
  }
  scene += plantedSword(70, 286, 0.9, -5, true);
  scene += plantedSword(96, 332, 0.62, 8);
  scene += plantedSword(270, 343, 0.62, -8);
  scene += plantedSword(58, 407, 0.77, -4);
  scene += plantedSword(305, 423, 0.74, 5);

  // The actual summoned sword: narrow straight silver blade, swept silver
  // quillons, green wrapped grip, diamond pommel and pale spinning ribbons.
  // It rises at the room edge, spins while charging, then flies in a straight
  // line and resets while hidden. The held greatsword below never rotates.
  let flyingBlade = p('M0 -55 L5 -43 L4 16 L0 23 L-4 16 L-4 -43Z', '#b4b0b9', ink, 1.4);
  flyingBlade += p('M0 -55 L0 23 L-4 16 L-4 -43Z', '#e1d9d6', 'none');
  flyingBlade += p('M0 -55 L5 -43 L4 16 L0 23 L1 -18Z', '#96929e', 'none');
  flyingBlade += p('M-4 -2 L0 -13 L4 -9 L0 3Z M0 3 L4 -9 L4 16 L0 23Z', '#aaa5ae', 'none');
  flyingBlade += p(
    'M-18 16 L-13 18 L-5 18 L0 20 L5 18 L13 18 L18 15 L19 21 L14 25 L5 25 L0 23 L-5 25 L-15 24 L-19 20Z',
    '#939096',
    ink,
    1.4
  );
  flyingBlade += p(
    'M-18 16 L-13 18 L-5 18 L0 20 L5 18 L13 18 L18 15 L17 20 L11 22 L4 21 L0 23 L-5 21 L-14 21Z',
    '#c8c2bf',
    'none'
  );
  flyingBlade += p('M-4 25 L4 25 L3 45 L-3 45Z', '#166e35', ink, 1.1);
  flyingBlade += p('M-4 25 L0 24 L0 45 L-3 45Z', '#28954d', 'none');
  flyingBlade += p('M-4 28 L4 30 V34 L-4 32Z M-4 37 L3 39 V42 L-3 41Z', '#0b7c31', 'none');
  flyingBlade += p('M-3 45 L3 45 L7 49 L0 53 L-6 49Z', '#b3aaa9', ink, 1.2);
  flyingBlade += p('M-3 45 L3 45 L0 49 L-6 49Z', '#d6cbc6', 'none');
  flyingBlade += l('M-2 -40 L-2 10 M-1 28 L-1 41', '#e9ded0', 0.7);
  const spinRibbons =
    p('M-38 -34 Q-21 -49 8 -40 Q31 -33 39 -13 Q26 -30 5 -31 Q-20 -39 -38 -34Z', '#e1dfd4', 'none') +
    p(
      'M-40 -20 Q-22 -33 0 -27 Q21 -23 31 -10 Q14 -19 -2 -20 Q-25 -24 -40 -20Z',
      '#d7ded7',
      'none'
    ) +
    p('M-34 12 Q-16 30 8 24 Q29 21 40 7 Q32 28 8 32 Q-18 39 -34 12Z', '#dce2d8', 'none') +
    p('M-26 26 Q-5 41 19 31 Q31 27 38 17 Q32 35 13 40 Q-10 46 -26 26Z', '#ece6d7', 'none');
  const charge =
    p(
      'M-16 -45 L-20 -31 L-13 -26 M14 -20 L21 -12 L15 -3 M-17 15 L-23 25 L-15 30',
      'none',
      '#91d9cf',
      1.5
    ) +
    l(
      'M-29 -20 Q-38 2 -21 22 M20 -32 Q40 -13 34 10 M-12 31 Q8 42 29 25',
      '#abdcd2',
      1.1,
      'opacity=".6"'
    );
  const spinningAssembly =
    `<g data-ezekiel-effect="sword-spin">${turn('0;0;0;360;765;765;765;765;0;0', '0;.25;.34;.425;.51;.55;.61;.66;.69;1', 24)}` +
    `<g opacity="0">${a('opacity', '0;0;.7;.8;0;0', '0;.31;.36;.5;.57;1', 24)}${spinRibbons}</g>${flyingBlade}</g>`;
  scene += ellipse(277, 380, 17, 4, '#252d34', 'none', 0, 'opacity=".5"');
  scene += g(
    'translate(277 304)',
    `<g data-ezekiel-effect="flying-sword">${move('0 0;0 0;-8 -37;-8 -47;-8 -47;10 -80;10 -80;0 0;0 0', '0;.25;.34;.4;.51;.61;.66;.69;1', 24)}` +
      `<g opacity="1">${a('opacity', '1;1;1;0;0;1;1', '0;.51;.57;.615;.69;.76;1', 24)}` +
      g(
        'scale(.8) rotate(-18)',
        spinningAssembly +
          `<g opacity="0">${a('opacity', '0;0;.8;.2;0;0', '0;.32;.43;.53;.59;1', 24)}${charge}</g>`
      ) +
      '</g></g>'
  );
  // Cyan spell light occupies one short interval, with the knight otherwise still.
  scene += on(
    p('M83 119 L70 155 L80 170 L66 196 L78 210 L69 242 L75 259', 'none', '#8bdedb', 2.6) +
      p('M83 119 L80 150 L90 164 L79 186', 'none', '#c1efe2', 1.1),
    '0;0;.8;0;.5;0;0',
    '0;.46;.48;.505;.525;.55;1',
    24
  );

  // White cape, brown fur collar and red geometric marks are crucial identifiers.
  let cape = p(
    'M156 212 L219 204 L233 254 L247 310 L278 363 L262 352 L268 374 L243 362 L226 389 L217 434 L214 472 L203 493 L157 496 L143 480 L151 432 L151 368 L146 308Z',
    '#bfc1b7',
    ink,
    2.2
  );
  cape += p(
    'M204 211 L219 213 L230 258 L236 299 L260 342 L248 337 L240 353 L222 335 L210 313 L200 263Z',
    '#e2e0d2',
    '#9a9e9b',
    1.3
  );
  cape += p(
    'M175 224 L188 219 L195 268 L190 321 L201 370 L191 422 L198 487 L176 490 L163 473 L171 427 L171 366 L161 310Z',
    '#929a99',
    'none'
  );
  cape += p(
    'M153 364 L170 368 L170 428 L161 472 L174 489 L157 492 L147 479 L155 429Z',
    '#d8d8c9',
    'none'
  );
  cape += p(
    'M234 312 L243 325 L246 341 L237 333Z M252 346 L268 359 L262 352 L278 363 L266 345 L257 339Z M224 344 L231 354 L228 369 L216 351Z M235 285 L244 304 L238 302 L231 292Z M159 479 L166 488 L175 476 L184 491 L193 480 L203 493 L157 496 L148 481Z M207 454 L211 466 L207 477 L203 467Z',
    '#b26665',
    '#8e5759',
    1
  );
  cape += l(
    'M216 228 L222 274 L234 319 M197 239 L194 292 M245 345 L257 354 M181 376 L180 425 L185 467',
    '#e8e4d4',
    1.3
  );
  scene += `<g data-ezekiel-effect="cape">${move('0 0;0 0;1.7 -1;-.7 .5;0 0;0 0', '0;.3;.42;.57;.7;1', 24)}${cape}</g>`;

  // Rear leg, slate-purple cloth and faceted gold kneecap.
  scene += p(
    'M178 333 L207 327 L218 363 L218 392 L232 421 L218 438 L199 429 L192 404 L180 381 L167 355Z',
    purple,
    ink,
    2.2
  );
  scene += p(
    'M195 344 L207 345 L211 377 L205 392 L216 416 L207 424 L197 402 L187 376Z',
    '#7c6b9a',
    'none'
  );
  scene += p('M207 387 L224 394 L235 416 L222 433 L201 426 L195 407Z', silver, ink, 2);
  scene += p('M208 391 L221 396 L227 411 L217 420 L205 413 L201 403Z', gold, '#80734f', 1.2);
  scene += p('M208 391 L217 399 L217 420 L205 413 L201 403Z', gilt, 'none');
  scene += p(
    'M199 426 L222 427 L234 454 L232 477 L241 488 L232 498 L215 493 L210 475 L201 454 L190 444Z',
    shadow,
    ink,
    2.1
  );
  scene += p(
    'M204 432 L218 433 L229 455 L226 474 L233 485 L219 484 L216 471 L211 451Z',
    '#bbb8c0',
    '#928a88',
    1.1
  );
  scene += p(
    'M211 434 L218 433 L229 455 L226 474 L233 485 L226 488 L222 473 L224 457Z',
    gold,
    'none'
  );
  scene += p(
    'M218 482 L235 484 L252 496 L256 504 L231 505 L213 496 L211 489Z',
    '#aaa8b3',
    ink,
    1.8
  );
  scene += p('M220 485 L233 488 L247 497 L232 499 L216 493Z', '#c9c5ca', 'none');
  scene += l('M231 499 L250 501 M216 493 L231 499 L231 504', '#6a6b7d', 1.1);

  // Forward leg bends outwards into the characteristic broad stance.
  scene += p(
    'M147 329 L176 340 L166 367 L149 397 L134 418 L113 410 L116 387 L126 363Z',
    '#554b75',
    ink,
    2.2
  );
  scene += p('M150 342 L166 345 L155 372 L138 396 L127 398 L133 378Z', '#78658f', 'none');
  scene += p('M114 395 L132 393 L149 407 L141 427 L119 432 L105 414Z', '#a9a6b0', ink, 2);
  scene += p('M117 398 L130 397 L139 407 L130 421 L117 417 L110 409Z', gold, '#80734f', 1.3);
  scene += p('M117 398 L124 405 L130 421 L117 417 L110 409Z', '#d1b566', 'none');
  scene += p('M113 428 L139 425 L133 455 L126 488 L109 499 L98 487 L101 456Z', shadow, ink, 2.3);
  scene += p('M113 433 L127 432 L122 461 L116 487 L108 487 L107 458Z', '#c4c0c3', '#8c858b', 1.2);
  scene += p('M112 435 L117 434 L112 462 L108 487 L103 485 L106 458Z', gold, 'none');
  scene += p('M109 486 L125 488 L125 503 L114 511 L77 521 L72 513 L89 499Z', '#a5a4b0', ink, 2);
  scene += p('M109 490 L117 493 L111 505 L81 514 L89 504Z', '#ccc7c9', 'none');
  scene += l('M81 514 L109 508 L115 512 M112 496 L105 507', '#737384', 1.2);

  // Torso: silver breastplate over violet, gold edging, layered hip armour.
  scene += p(
    'M143 222 L170 211 L196 220 L210 246 L200 285 L201 327 L182 345 L147 337 L133 316 L139 276 L132 249Z',
    '#5d5279',
    ink,
    2.4
  );
  scene += p(
    'M141 229 L165 223 L193 229 L199 252 L185 284 L166 306 L142 282 L135 252Z',
    silver,
    ink,
    2.1
  );
  scene += p('M142 232 L165 226 L165 299 L146 280 L138 253Z', '#d2cdcd', 'none');
  scene += p('M168 227 L193 232 L197 250 L183 281 L166 301 L172 269Z', '#9293a1', 'none');
  scene += p('M138 250 L158 258 L166 275 L143 270Z M172 234 L190 236 L184 249Z', '#e2dbd3', 'none');
  scene += l('M138 253 L158 261 L165 283 M174 278 L188 261 M166 293 L166 303', '#8b8794', 0.85);
  scene += p('M141 236 L146 230 L169 223 L194 230 L199 236 L171 229Z', gold, '#86764e', 1);
  scene += p('M145 281 L166 295 L187 283 L185 291 L166 304 L143 288Z', gold, '#86764e', 1.1);
  scene += p(
    'M166 247 L172 257 L184 263 L172 269 L165 282 L160 268 L148 262 L160 257Z',
    gold,
    '#927c45',
    1.25
  );
  scene += p('M166 247 L166 263 L148 262 L160 257Z M166 263 L172 269 L165 282Z', '#e1c76d', 'none');
  scene += l('M166 247 L165 281 M149 262 L182 263', '#f0dc9b', 0.8);
  scene += p(
    'M142 290 L165 304 L187 292 L196 309 L179 325 L147 316 L135 305Z',
    '#66543f',
    ink,
    1.7
  );
  scene += p('M142 296 L164 310 L184 300 L187 308 L166 318 L140 304Z', gold, '#8c7449', 1.2);
  scene += p(
    'M145 308 L160 318 L152 336 L133 334 L131 322Z M180 315 L194 307 L206 326 L202 340 L181 344 L171 332Z',
    silver,
    ink,
    1.8
  );
  scene += p(
    'M135 326 L153 329 L151 335 L134 334Z M181 334 L203 327 L202 334 L182 342Z',
    gold,
    '#8f7a51',
    1.1
  );
  scene += l('M137 317 L154 321 M183 325 L198 319', '#e4d9b5', 1);

  // The wide brown fur mantle is angular rather than a smooth golden pauldron.
  let fur = p(
    'M151 182 L138 180 L133 189 L118 187 L119 199 L105 201 L113 210 L101 218 L116 223 L108 238 L126 234 L129 248 L139 239 L150 245 L156 230 L167 235 L177 222 L190 230 L201 225 L213 238 L218 228 L234 229 L227 217 L239 211 L225 202 L228 190 L213 193 L202 181 L188 187 L170 179Z',
    '#88683f',
    ink,
    2.35
  );
  fur += p(
    'M139 186 L124 194 L119 206 L109 204 L120 215 L114 231 L128 227 L132 240 L141 228 L151 236 L154 215 L167 202Z',
    '#ac8653',
    '#715535',
    1
  );
  fur += p(
    'M178 186 L191 189 L202 185 L209 198 L220 197 L218 209 L232 212 L219 219 L226 226 L213 222 L209 230 L199 218 L189 224 L181 209 L169 201Z',
    '#9b7546',
    '#715535',
    1
  );
  fur += p(
    'M139 186 L145 201 L130 196Z M145 201 L154 215 L132 212Z M130 196 L119 206 L132 212Z M132 212 L128 227 L141 228Z M154 215 L141 228 L151 236Z M191 189 L190 206 L178 199Z M202 185 L209 198 L190 206Z M190 206 L199 218 L181 209Z M209 198 L218 209 L199 218Z M218 209 L232 212 L219 219Z',
    '#c0a070',
    'none'
  );
  fur += p(
    'M109 217 L120 215 L116 223Z M128 227 L129 242 L138 233Z M154 215 L167 202 L164 221 L157 230Z M190 206 L181 209 L188 220Z M199 218 L213 222 L209 230Z',
    '#6c5035',
    'none'
  );
  fur += l(
    'M124 194 L132 212 L141 228 M145 201 L132 212 L120 215 M178 199 L190 206 L199 218 M209 198 L190 206 M199 218 L218 209 M219 219 L213 222',
    '#80603c',
    0.85
  );
  fur += l(
    'M116 207 L122 210 M135 192 L140 195 M148 224 L151 227 M204 199 L208 201 M222 214 L226 214',
    '#d0b384',
    0.85
  );
  scene += fur;

  // Closed helm with cyan slit and the distinctive perforated lower face.
  scene += p(
    'M147 151 L158 138 L177 139 L190 151 L194 169 L187 191 L168 206 L150 196 L141 176Z',
    '#a4a1ad',
    ink,
    2.3
  );
  scene += p('M147 151 L158 140 L175 141 L184 149 L169 154 L147 165Z', '#d3cfcd', '#96919c', 1.1);
  scene += p('M158 140 L165 145 L183 149 L175 141Z', '#e0d9d4', 'none');
  scene += p('M184 149 L190 151 L194 169 L187 191 L168 206 L166 177Z', '#777783', 'none');
  scene += p('M149 156 L163 153 L175 149 L183 151 L171 158 L148 168Z', gold, '#8d7a52', 0.8);
  scene += p(
    'M143 171 L158 166 L169 167 L181 162 L185 167 L171 176 L156 174 L146 178Z',
    '#45424e',
    ink,
    1.1
  );
  scene += p(
    'M149 171 L158 169 L165 170 L159 174Z M171 170 L179 166 L177 171 L171 173Z',
    '#64d3da',
    '#385c67',
    0.7
  );
  scene += p(
    'M143 179 L156 178 L167 180 L181 172 L180 191 L166 204 L152 195Z',
    '#c6c2c3',
    '#777181',
    1.4
  );
  scene += p('M167 180 L181 172 L180 191 L166 204Z', '#a09aa9', 'none');
  scene += p(
    'M182 177 L190 172 L188 179 L181 184Z M178 188 L185 184 L183 190 L176 195Z',
    '#a99761',
    '#786a4f',
    0.7
  );
  scene += p(
    'M148 183 L153 184 L154 189 L150 187Z M157 184 L161 186 L160 191 L156 190Z M153 191 L157 193 L156 197 L153 195Z M171 183 L175 181 L177 184 L173 188Z M171 192 L175 189 L176 193 L172 196Z',
    '#4e4750',
    'none'
  );
  scene += l(
    'M157 145 L166 147 M148 155 L153 151 M167 181 L166 202 M184 154 L188 162 L187 169',
    '#e1d9cd',
    0.9
  );

  // Arms cross at the grip: no shield, no duplicated weapon or floating hands.
  scene += p(
    'M125 232 L140 237 L141 256 L154 269 L167 281 L154 296 L139 284 L126 274 L117 251Z',
    purple,
    ink,
    2.1
  );
  scene += p('M120 232 L135 235 L137 251 L126 265 L115 252 L113 240Z', silver, ink, 1.9);
  scene += p('M118 237 L126 234 L132 240 L131 253 L125 259 L119 250Z', '#d1caca', 'none');
  scene += p('M127 267 L139 256 L157 269 L172 286 L161 298 L144 288Z', gold, '#84734b', 1.4);
  scene += p('M134 267 L140 262 L155 274 L167 286 L160 292 L145 280Z', '#c9c1c2', '#8b858e', 1);
  scene += p('M134 267 L140 262 L155 274 L153 281 L145 280Z', '#e1d8cb', 'none');
  scene += l('M142 267 L153 277 L160 287', '#9992a0', 1);
  scene += p('M203 231 L215 238 L211 263 L195 289 L180 280 L191 256Z', '#55486e', ink, 2.1);
  scene += p('M202 231 L213 236 L216 248 L207 262 L195 253 L194 242Z', silver, ink, 1.8);
  scene += p('M200 234 L208 237 L211 246 L204 253 L198 248Z', '#d4ccca', 'none');
  scene += p('M202 260 L210 265 L197 287 L184 292 L177 278 L187 269Z', '#afadb7', ink, 1.9);
  scene += p('M200 260 L204 265 L191 282 L181 285 L178 280 L188 272Z', '#d8c582', '#8e7f51', 1.1);

  // His long curved silver blade sweeps to the lower right, tipped with a notch.
  scene += p('M170 294 L182 300 L176 313 L164 306Z', '#554333', ink, 1.5);
  scene += p('M160 286 L167 283 L185 296 L192 310 L183 315 L177 306 L159 294Z', gold, ink, 1.8);
  scene += p('M164 287 L169 287 L183 298 L187 307 L183 308 L178 300Z', '#e0c77a', 'none');
  scene += p(
    'M181 308 L220 342 L253 375 L279 403 L298 421 L317 420 L309 435 L323 441 L307 449 L293 448 L279 439 L259 419 L235 392 L207 359 L175 317Z',
    silver,
    ink,
    2.4
  );
  scene += p(
    'M181 308 L220 342 L253 375 L279 403 L298 421 L317 420 L309 435 L300 432 L283 418 L263 398 L241 373 L215 347 L178 315Z',
    '#d4cfd0',
    'none'
  );
  scene += p(
    'M179 315 L212 352 L238 385 L264 413 L285 433 L300 441 L323 441 L307 449 L293 448 L279 439 L259 419 L235 392 L207 359 L175 317Z',
    '#8b8b9b',
    'none'
  );
  scene += p('M298 421 L317 420 L309 435 L300 432Z', '#b5b0bb', '#8f8999', 0.8);
  scene += l('M184 318 L217 353 L244 387 L271 415 L294 435 L303 439', '#e6ddd6', 1.15);
  scene += l('M226 368 L242 383 M262 406 L274 418', '#a5a0ad', 0.8);

  // Brown gauntlets visibly close around the hilt over the blade's upper layers.
  scene += p(
    'M149 278 L160 274 L169 281 L174 292 L169 302 L159 300 L151 291Z',
    '#71513e',
    ink,
    1.8
  );
  scene += p('M153 279 L160 278 L167 284 L169 291 L164 295 L158 290Z', '#947056', 'none');
  scene += p(
    'M178 279 L185 281 L183 293 L176 303 L168 304 L163 296 L168 286Z',
    '#6c4b3c',
    ink,
    1.8
  );
  scene += p('M177 282 L181 283 L178 292 L174 298 L169 297 L171 288Z', '#947056', 'none');
  scene += l(
    'M156 284 L163 288 M156 289 L163 293 M171 287 L177 289 M168 292 L175 294',
    '#b08a66',
    1.1
  );

  // A few small foreground fragments ground the pose, without hiding his boots.
  scene += p(
    'M49 523 L63 514 L72 517 L69 528 L54 530Z M269 519 L281 514 L290 522 L286 529 L273 530Z',
    '#747478',
    '#3e4048',
    1.3
  );
  scene += p(
    'M50 522 L63 516 L67 521 L57 524Z M271 520 L281 516 L285 521 L277 524Z',
    '#a3a196',
    'none'
  );
  return scene;
};
