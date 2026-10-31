/* Original stained glass, checked against the actual OSRS Wiki detail image.
 * https://oldschool.runescape.wiki/w/File:Executioner%27s_axe_head_detail.png
 * https://oldschool.runescape.wiki/w/Executioner%27s_axe_head
 * Detached component only: graphite blade, forked tang, open mounting notch.
 * Pass 2: revisited the canonical detail image and Strangled animal model
 * (https://oldschool.runescape.wiki/w/Strangled_animal). Restored the head's
 * broad aspect ratio; thickened crimson vines into faceted, twisting stems
 * with long triangular thorns. Checked the initial still and motion contact
 * sheet; the mounting notch remains clear throughout the reflection cycle.
 * Feedback pass: preserve that silhouette while giving the steel a dark
 * back-face, a honed cutting rim and a deliberate silver reflection. Crimson
 * light follows the existing thorned stems, with a quiet pause between cycles.
 * Feedback refinement: reviewed the new still and complete-cycle contact
 * sheet against the model again. Advanced the reflection so its brightest
 * moment crosses the broad steel face, rather than only catching the tangs.
 */
window.GLASS_NEW_SCENES = window.GLASS_NEW_SCENES || {};
window.GLASS_NEW_SCENES['axe-head'] = function axeHeadScene(h, c, id) {
  const { p, l, g, ellipse, a, move } = h;
  const outline =
    'M139 190 L219 209 L264 244 L280 265 L289 409 L261 384 L228 370 L206 361 L193 360 L174 384 L160 403 L142 387 L155 362 L171 344 L174 321 L156 320 L146 342 L127 363 L109 378 L90 371 L61 390 L77 366 L99 349 L124 350 L141 329 L149 305 L142 299 Q157 271 155 247Z';
  const bladeClip = `${id}-detached-axe`;

  // Crimson stranglethorn hugs the perimeter; its triangular thorns stay
  // separate from the head's narrow fork and open mounting notch.
  function thorn(x, y, direction, size = 10) {
    return (
      p(
        `M${x - direction * 3} ${y - 7} L${x + direction * (size + 4)} ${y - size - 9} L${x + direction * 5} ${y + 9}Z`,
        '#9d2932',
        '#321c28',
        1.6
      ) +
      p(
        `M${x} ${y - 5} L${x + direction * (size + 2)} ${y - size - 6} L${x + direction * 2} ${y + 5}Z`,
        '#c04a47',
        'none'
      )
    );
  }
  const leftStem =
    'M46 536 L52 490 L62 455 L53 417 L47 383 L50 348 L63 309 L61 275 L50 242 L50 209 L62 175 L66 140 L61 113';
  const rightStem =
    'M315 537 L309 504 L316 467 L322 433 L314 397 L304 363 L305 330 L317 293 L313 260 L305 225 L306 195 L319 163 L321 125';
  const leftVine =
    l(leftStem, '#291a23', 24) +
    l(leftStem, '#7e222c', 19) +
    p(
      'M40 538 L46 489 L56 456 L48 417 L41 384 L45 346 L58 307 L55 275 L44 243 L45 207 L57 173 L62 139 L56 112 L62 106 L71 140 L66 177 L55 212 L55 240 L66 276 L67 309 L55 349 L52 382 L60 416 L67 456 L57 490 L51 538Z',
      '#631c27',
      '#261d27',
      2.2
    ) +
    p(
      'M46 536 L52 490 L62 455 L53 417 L47 383 L50 348 L63 309 L61 275 L50 242 L50 209 L62 175 L66 140 L61 113 L65 138 L62 172 L53 211 L53 242 L63 275 L65 308 L53 349 L50 384 L58 418 L65 456 L55 492 L49 538Z',
      '#ac3c43',
      'none'
    ) +
    // Alternating broad planes wind around the darker cylindrical stem.
    p(
      'M35 497 L45 479 L61 483 L63 495 L48 490 L43 506Z M52 454 L42 433 L52 426 L63 442 L70 455 L62 465Z M38 389 L41 370 L57 365 L59 378 L46 380 L48 395Z M55 330 L70 316 L71 303 L59 300 L58 314 L46 327Z M41 253 L40 235 L58 229 L60 244 L51 245 L51 259Z M55 187 L71 176 L73 160 L60 158 L59 172 L48 180Z',
      '#9d343b',
      '#4a1c29',
      1.3
    ) +
    l(
      'M39 497 L45 485 L58 487 M54 454 L48 437 L53 432 M42 386 L45 374 L55 371 M58 325 L65 316 L66 306 M44 250 L45 240 L56 235 M57 183 L66 173 L68 163',
      '#c95b54',
      1.2
    ) +
    l('M48 501 L56 469 M49 371 L57 341 M56 266 L51 247 M61 163 L65 142', '#d16c65', 1.2) +
    thorn(58, 470, 1, 13) +
    thorn(54, 427, -1, 11) +
    thorn(48, 379, 1, 12) +
    thorn(56, 328, -1, 11) +
    thorn(61, 284, 1, 13) +
    thorn(48, 230, -1, 10) +
    thorn(61, 179, 1, 12) +
    thorn(64, 139, -1, 9);
  const rightVine =
    l(rightStem, '#291a23', 24) +
    l(rightStem, '#7c202a', 19) +
    p(
      'M310 537 L304 504 L311 466 L317 432 L309 398 L298 363 L300 329 L312 292 L308 261 L299 226 L301 194 L314 161 L316 123 L325 112 L326 124 L323 165 L311 197 L310 224 L319 259 L323 293 L311 332 L310 362 L320 395 L328 433 L322 470 L315 504 L321 537Z',
      '#671f29',
      '#261d27',
      2.2
    ) +
    p(
      'M315 537 L309 504 L316 467 L322 433 L314 397 L304 363 L305 330 L317 293 L313 260 L305 225 L306 195 L319 163 L321 125 L325 118 L322 163 L309 196 L308 226 L316 260 L321 293 L309 332 L308 363 L318 398 L326 433 L320 469 L313 504 L319 537Z',
      '#a93a40',
      'none'
    ) +
    p(
      'M301 514 L300 497 L317 490 L320 502 L309 506 L312 520Z M311 470 L315 448 L332 444 L331 458 L323 460 L320 476Z M311 407 L299 390 L310 382 L322 399 L327 412 L319 419Z M296 360 L296 340 L312 334 L316 347 L306 348 L307 365Z M309 291 L307 271 L324 265 L326 278 L318 280 L322 296Z M298 218 L298 200 L315 190 L319 203 L308 208 L308 224Z M313 161 L313 141 L330 134 L331 147 L323 149 L324 167Z',
      '#9e343a',
      '#4a1c29',
      1.3
    ) +
    l(
      'M305 510 L305 501 L316 496 M316 467 L320 453 L329 450 M316 406 L305 391 L310 388 M300 357 L301 345 L311 340 M314 290 L312 276 L321 271 M302 216 L303 204 L314 197 M318 159 L318 145 L328 140',
      '#c85a52',
      1.2
    ) +
    l('M312 495 L317 469 M309 376 L315 395 M308 324 L315 301 M310 184 L317 165', '#cb6660', 1.2) +
    thorn(312, 508, -1, 10) +
    thorn(320, 457, -1, 12) +
    thorn(319, 414, 1, 10) +
    thorn(304, 368, -1, 12) +
    thorn(307, 330, 1, 10) +
    thorn(317, 282, -1, 12) +
    thorn(307, 237, 1, 11) +
    thorn(312, 188, -1, 11) +
    thorn(320, 143, -1, 9);

  let art = `<defs><clipPath id="${bladeClip}">${p(outline, '#fff', 'none')}</clipPath></defs>`;

  // A few large background facets give the iron a readable, warm surround.
  art += p('M75 145 L137 116 L180 175 L125 235 L76 224Z', '#71383e', '#39212d', 1.8);
  art += p('M180 175 L229 121 L290 158 L287 236 L235 223Z', '#8b4646', '#39212d', 1.8);
  art += p('M78 228 L125 235 L106 323 L71 345Z', '#4c303a', '#39212d', 1.8);
  art += p('M277 306 L300 330 L290 424 L269 435 L268 375Z', '#57303a', '#39212d', 1.8);
  art += p('M76 427 L135 415 L180 452 L111 478 L71 466Z', '#72383f', '#39212d', 1.8);
  art += p('M180 452 L238 423 L289 444 L282 480 L212 485Z', '#8b4a47', '#39212d', 1.8);
  art += l(
    'M137 116 L180 175 L229 121 M76 224 L125 235 M111 478 L180 452 L238 423',
    '#b17267',
    1,
    'opacity=".65"'
  );
  art += `<g opacity="0">${a('opacity', '0;0;.18;.12;0;0', '0;.19;.3;.46;.6;1', 16)}`;
  art += p(
    'M75 145 L137 116 L180 175 L125 235 L76 224Z M180 175 L229 121 L290 158 L287 236 L235 223Z',
    '#d15c55',
    'none'
  );
  art += p(
    'M76 427 L135 415 L180 452 L111 478 L71 466Z M180 452 L238 423 L289 444 L282 480 L212 485Z',
    '#c84249',
    'none',
    0,
    'opacity=".6"'
  );
  art += '</g>';

  art += leftVine + rightVine;
  // A short warm reflection travels along each solid thorn stem. The vine
  // itself stays stationary, retaining the heavy Strangled animal reference.
  function stemReflection(d, delay) {
    return `<g opacity="0">${a('opacity', '0;0;.84;.68;0;0', `0;${0.21 + delay};${0.28 + delay};${0.5 + delay};${0.62 + delay};1`, 16)}<path d="${d}" fill="none" stroke="#e56c59" stroke-width="4.3" stroke-linecap="round" stroke-dasharray="45 550">${a('stroke-dashoffset', '0;0;-510;-510', `0;${0.23 + delay};${0.61 + delay};1`, 16)}</path></g>`;
  }
  art += stemReflection(leftStem, 0) + stemReflection(rightStem, 0.045);
  for (const [x, y, direction, start] of [
    [58, 470, 1, 0.26],
    [61, 284, 1, 0.39],
    [61, 179, 1, 0.48],
    [320, 457, -1, 0.3],
    [317, 282, -1, 0.43],
    [312, 188, -1, 0.53],
  ]) {
    art += `<g opacity="0">${a('opacity', '0;0;.68;0;0', `0;${start};${start + 0.035};${start + 0.095};1`, 16)}`;
    art += p(
      `M${x} ${y - 5} L${x + direction * 15} ${y - 19} L${x + direction * 2} ${y + 5}Z`,
      '#e46b57',
      'none'
    );
    art += '</g>';
  }
  art += ellipse(181, 452, 62, 8, '#2d232b', 'none', 0, 'opacity=".66"');
  art += p('M98 476 L122 459 L245 459 L270 476 L255 488 H112Z', '#7f6864', '#30272c', 2);
  art += p('M112 488 H255 L252 505 H117Z', '#4f4548', '#30272c', 2);
  art += p('M123 462 H242 L259 475 H108Z', '#aa8b7a', '#514048', 1.2);
  art += p('M117 491 L146 494 L145 504 H120Z M219 491 L249 489 L247 503 H222Z', '#645055', 'none');
  art += l('M158 461 L165 468 L159 475 M229 461 L222 469 L232 476 M113 481 H255', '#d0ac8e', 1.1);

  // The Wiki model is substantially wider than tall. Keep that proportion
  // rather than stretching the detached head to occupy the whole arch.
  art += '<g transform="translate(-9 78) scale(1.05 .75)">';
  art += g('translate(11 18)', p(outline, '#221e29', 'none', 0, 'opacity=".42"'));
  art += g('translate(5 7)', p(outline, '#302d39', '#211e29', 2));
  // The great fan blade and two uneven tangs are one continuous silhouette.
  art += p(outline, '#55555e', '#211f2a', 3);
  art += p(
    'M139 190 L219 209 L264 244 L280 265 L269 274 L251 252 L211 222 L154 205Z',
    '#92929a',
    '#36313e',
    1.6
  );
  art += p(
    'M154 205 L211 222 L251 252 L269 274 L276 378 L255 357 L217 341 L194 334 L182 308 L166 294 L155 283 Q161 266 155 247Z',
    '#696973',
    '#3b3544',
    1.8
  );
  art += p('M211 222 L251 252 L269 274 L276 378 L262 361 L247 287Z', '#7f8088', '#4a4351', 1.4);
  art += p('M154 205 L211 222 L251 252 L219 277 L184 265 L160 247Z', '#747985', '#4b4a58', 1.1);
  art += p(
    'M184 265 L219 277 L247 287 L262 361 L217 341 L194 334 L182 308 L166 294Z',
    '#585b68',
    '#42414f',
    1.2
  );
  art += p('M211 222 L251 252 L269 274 L247 287 L219 277Z', '#8b909a', '#575763', 1.1);
  art += p('M269 274 L280 265 L289 409 L276 391 L276 378Z', '#b0afb5', '#57505f', 1.5);
  art += p(
    'M194 334 L217 341 L255 357 L276 378 L289 409 L261 384 L228 370 L206 361 L193 360 L174 384 L160 403 L142 387 L155 362 L171 344 L174 321 L182 308Z',
    '#46444f',
    '#302936',
    1.7
  );
  art += p('M182 338 L193 348 L178 370 L160 393 L151 385 L163 362Z', '#6f6c76', '#3a3241', 1.4);
  art += p(
    'M155 283 L166 294 L156 320 L146 342 L127 363 L109 378 L90 371 L61 390 L77 366 L99 349 L124 350 L141 329 L149 305 L142 299Z',
    '#65616c',
    '#302936',
    1.7
  );
  art += p(
    'M150 303 L144 326 L126 350 L106 365 L90 360 L75 371 L99 354 L126 357 L145 333 L155 314Z',
    '#8d8690',
    'none'
  );
  art += p('M166 294 L182 308 L174 321 L156 320Z', '#44414d', '#332b3b', 1.5);
  art += p(
    'M142 194 L219 212 L264 246 L278 265 L274 270 L260 251 L217 218 L147 201Z',
    '#b9bdc2',
    '#666672',
    0.9
  );
  art += p('M278 269 L280 265 L289 409 L285 402 L278 288Z', '#d9dcd8', '#85858e', 0.9);
  art += l('M280 275 L286 393', '#eee7da', 1.6);
  art += l('M148 199 L218 216 L260 248', '#d7d7d4', 1.1, 'opacity=".8"');
  art += l(
    'M157 207 L212 225 L249 254 M255 289 L264 343 M280 293 L284 365',
    '#c4bec3',
    1.3,
    'opacity=".7"'
  );
  art += l(
    'M175 245 L200 252 L217 267 M197 286 L224 298 L236 323 M225 346 L252 358 M109 354 L124 356 M157 375 L164 365',
    '#89838e',
    1.2
  );
  // Fine nicks are restrained; this is grey iron rather than a jeweled weapon.
  art += l(
    'M272 282 L275 294 M277 338 L280 347 M257 373 L265 379 M219 216 L227 220 M189 236 L185 251',
    '#35303e',
    1.2
  );

  art += `<g clip-path="url(#${bladeClip})">`;
  art += `<g opacity="0">${a('opacity', '0;0;.68;.54;0;0', '0;.2;.29;.45;.55;1', 16)}`;
  art += `<g>${move('-120 0;-120 0;250 0;250 0', '0;.2;.53;1', 16)}`;
  art += p('M43 169 L69 175 L221 425 L189 436Z', '#cbd4d8', 'none');
  art += p('M68 174 L77 177 L228 426 L217 431Z', '#f3eee1', 'none', 0, 'opacity=".86"');
  art += l('M79 183 L219 420', '#f6f0df', 1.3, 'opacity=".8"');
  art += '</g></g></g>';

  // One faint edge-glint gives the still reduced-motion view a finished blade.
  art += l('M278 285 L285 386', '#ddd0ca', 0.9, 'opacity=".55"');
  art += '</g>';
  art += g('translate(0 0)', l('M66 276 L67 309 L55 349', '#c76a65', 0.9, 'opacity=".35"'));
  return art;
};
