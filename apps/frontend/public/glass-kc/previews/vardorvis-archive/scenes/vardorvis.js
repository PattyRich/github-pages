/* global GLASS_NEW_SCENES */
/* Original inline SVG interpretation of the current OSRS models.
 * Visual references inspected:
 * https://oldschool.runescape.wiki/w/File:Vardorvis.png
 * https://oldschool.runescape.wiki/w/File:Fighting_Vardorvis.png
 * The headless corpse and the crimson Strangler are one asymmetric silhouette.
 * A held axe is deliberately absent from the Wiki's standing model.
 * Pass 2: reinspected both Wiki originals and the initial full-cycle montage.
 * Opened the red thorax beneath separate layered ribs; moved the cut neck to
 * the shoulder line, sharpened the diagonal armour wrap and cloth folds, and
 * grounded the receding columns with a continuous floor and cast shadows.
 * The vine pivots behind the fixed rib cage and returns to its held rest pose.
 * Feedback pass: widened the Strangler and hunched corpse to match the model,
 * added layered root collars, dimensional plate and cloth, and the interrupted
 * pale front leg. After a new still/cycle review and another source inspection,
 * rounded and tapered the hooked root, gave thorns individual lit facets,
 * interrupted the lowest rib, and added the model's red tabard-crossing root.
 * Head Gaze pass 1: inspected the actual detached-head model, Mod Hend's attack
 * animation and the fight screenshot, then added a foreground ground emergence.
 * https://oldschool.runescape.wiki/w/Vardorvis%27_Head
 * https://oldschool.runescape.wiki/w/File:Vardorvis%27_Head.png
 * https://oldschool.runescape.wiki/w/File:Vardorvis%27_Head_attack.gif
 * Head Gaze pass 2: reopened the model and attack contact sheet beside the
 * initial still/full-cycle render. Lengthened the pale nose, separated the
 * helmet's cloth flaps, added its hooked rear point and clearer red eye slits,
 * then added small lifted floor chips to make the emergence read as grounded. */
GLASS_NEW_SCENES.vardorvis = (h, c, id) => {
  const { p, l, g, ellipse, circle, turn, a, move } = h;
  const ink = '#281c26';
  const bone = '#d6d7c8';
  const boneShade = '#a8adb0';
  const thorn = '#452630';
  let scene = `<defs><linearGradient id="${id}-vard-mist" x1="0" x2="0" y1="0" y2="1"><stop stop-color="${c[0]}" stop-opacity=".1"/><stop offset="1" stop-color="#aaaba6" stop-opacity=".55"/></linearGradient></defs>`;

  // The ruined ritual site is pale stone, never a snowfield or a castle interior.
  scene += p('M35 334 L117 289 L247 291 L325 338 V537 H35Z', `url(#${id}-vard-mist)`, 'none');
  scene += p(
    'M40 352 L114 309 L254 312 L322 354 V488 L40 497Z',
    '#b1aca1',
    'none',
    0,
    'opacity=".24"'
  );
  scene += l(
    'M44 354 L113 316 L256 319 L318 357 M57 378 L125 337 L261 341 M51 419 L137 365 L271 370 M81 451 L155 395 L283 402',
    '#a29a90',
    0.8,
    'opacity=".6"'
  );
  scene += p('M35 474 L116 437 L265 445 L325 485 V535 H35Z', '#96908b', '#51434a', 1.5);
  scene += p('M40 501 L143 455 L269 463 L323 503 V533 H40Z', '#b3ada2', '#65565a', 1.5);
  scene += l(
    'M60 512 L151 470 L281 477 M92 529 L174 487 L307 498 M144 535 L214 504 M213 534 L247 517 M128 465 L137 477 M172 456 L179 473 M220 459 L221 474',
    '#797176',
    1
  );
  scene += p(
    'M40 457 L80 436 L86 440 L44 466Z M273 441 L320 463 V475 L270 451Z',
    '#59474d',
    ink,
    1.2
  );
  scene += l(
    'M48 457 L52 465 M61 450 L66 458 M77 442 L80 451 M282 447 L281 456 M297 454 L295 462 M313 462 L311 470',
    '#b4a59a',
    1
  );

  function column(x, y, height, scale = 1) {
    let b = ellipse(0, height, 21, 8, '#5e555c', ink, 1.6);
    b += p(
      `M-18 5 L-6 0 L16 4 V${height - 5} L5 ${height + 2} L-18 ${height - 3}Z`,
      '#777179',
      ink,
      1.7
    );
    b += p(`M-18 5 L-6 0 V${height - 6} L-18 ${height - 3}Z`, '#9d9695', 'none');
    b += p(`M5 4 L16 4 V${height - 5} L5 ${height + 2}Z`, '#5a505b', 'none');
    for (let ring = 22; ring < height - 9; ring += 28) {
      b += p(
        `M-20 ${ring} L-7 ${ring - 4} L18 ${ring} V${ring + 5} L4 ${ring + 9} L-20 ${ring + 5}Z`,
        '#8c8384',
        '#4e424d',
        1.2
      );
      b += l(`M-7 ${ring - 3} L-7 ${ring + 6} M5 ${ring + 2} V${ring + 8}`, '#b3a79c', 0.8);
    }
    b += p('M-21 5 L-8 -3 L19 2 L7 12 L-21 9Z', '#b8b1a5', ink, 1.5);
    b += p('M-8 -3 L-6 -14 L2 -7 L11 -12 L15 -1 L7 7Z', '#69606a', '#4a3e48', 1.2);
    b += l('M-4 -6 L2 0 L10 -3 M-16 5 L-6 3', '#d0c7b3', 1.2);
    return g(`translate(${x} ${y}) scale(${scale})`, b);
  }
  scene += column(65, 299, 139, 0.83) + column(291, 281, 166, 0.78);
  scene += column(104, 253, 114, 0.5) + column(264, 232, 131, 0.48);
  scene += p(
    'M94 310 L107 308 L124 323 L111 324Z M254 296 L267 293 L286 312 L271 312Z',
    '#4c444e',
    'none',
    0,
    'opacity=".32"'
  );
  scene += p(
    'M53 414 L72 409 L102 433 L82 439Z M279 411 L298 408 L319 428 L305 433Z',
    '#51434d',
    'none',
    0,
    'opacity=".38"'
  );
  scene += l(
    'M90 326 L94 332 L89 338 L96 344 M281 321 L273 328 L278 333 M48 393 L59 390 L65 396 M300 385 L310 381 L316 386',
    '#71666d',
    1,
    'opacity=".7"'
  );
  scene += p(
    'M43 434 L48 405 L58 387 L52 414 L58 428 L56 439Z M313 449 L304 425 L307 401 L299 382 L301 416 L295 433 L302 451Z',
    '#63313a',
    ink,
    1.4
  );
  scene += p(
    'M65 467 L68 448 L63 435 L73 443 L77 461 L75 466Z M280 464 L282 440 L290 427 L286 451 L290 469Z',
    '#73303a',
    ink,
    1.4
  );

  // One substantial parasite fills the left side and folds over the corpse's shoulders.
  // Wide shaded facets, overlapping root collars and a hunched torso follow the model,
  // rather than reducing the Strangler to a thin antler-and-stick outline.
  scene += `<defs>
    <linearGradient id="${id}-root" x1="0" x2="1" y1="0" y2=".2"><stop stop-color="#472831"/><stop offset=".33" stop-color="#7c282d"/><stop offset=".66" stop-color="#a4382f"/><stop offset="1" stop-color="#63242d"/></linearGradient>
    <linearGradient id="${id}-pale" x1="0" x2="1"><stop stop-color="#939da8"/><stop offset=".38" stop-color="#d4d8cd"/><stop offset="1" stop-color="#9da7b1"/></linearGradient>
    <linearGradient id="${id}-plate" x1="0" x2=".85" y1="0" y2="1"><stop stop-color="#777985"/><stop offset=".45" stop-color="#414753"/><stop offset="1" stop-color="#292f3c"/></linearGradient>
  </defs>`;
  const rootFill = `url(#${id}-root)`;
  const paleFill = `url(#${id}-pale)`;
  const plateFill = `url(#${id}-plate)`;

  let parasite = p(
    'M210 233 L184 220 L155 221 L133 233 L113 253 L99 279 L94 309 L91 341 L81 370 L78 399 L82 426 L75 454 L77 479 Q80 497 94 505 L103 506 L118 493 L123 476 L118 465 L111 483 L103 490 L96 485 Q89 468 95 448 L105 428 L102 401 L108 375 L120 347 L123 316 L130 291 L144 273 L162 265 L189 264 L217 258Z',
    rootFill,
    ink,
    2.8
  );
  parasite += p(
    'M174 231 L151 238 L130 256 L116 282 L109 313 L107 343 L96 374 L92 400 L95 428 L86 455 L87 480 L96 496 L104 499 L99 486 L99 462 L110 433 L107 406 L115 377 L126 350 L130 318 L138 292 L152 279 L174 269 L200 260Z',
    '#a33a31',
    'none'
  );
  parasite += p(
    'M117 269 L104 295 L102 327 L94 355 L85 383 L86 406 L90 428 L82 457 L83 480 L91 495 L93 479 L89 456 L99 429 L96 405 L100 379 L110 350 L114 320 L122 292 L135 278Z',
    '#632b34',
    'none'
  );
  parasite += p(
    'M149 238 L137 249 L122 275 L115 306 L116 317 L123 292 L135 270 L149 257 L176 248 L200 248 L193 237 L173 234Z',
    '#bd4937',
    '#883331',
    0.8
  );
  parasite += l(
    'M149 248 L134 267 L125 288 M119 316 L115 340 M102 382 L98 400 M92 454 L92 477',
    '#cc5740',
    1.1,
    'opacity=".7"'
  );
  parasite += l(
    'M158 261 L138 275 L129 298 M106 361 L98 385 M100 413 L103 428 M82 473 L91 493',
    '#54232d',
    1.2
  );

  // Five unequal branching roots emerge from the same broad shoulder knot.
  parasite += p(
    'M178 240 L155 221 L137 196 L124 173 L103 153 L95 132 L72 116 L59 91 L84 112 L112 125 L127 150 L145 167 L163 192 L187 210 L207 233Z',
    '#922c2b',
    ink,
    2.1
  );
  parasite += p(
    'M179 229 L165 202 L161 178 L163 157 L157 132 L151 111 L168 139 L173 161 L174 181 L187 208 L196 229Z',
    '#922c2b',
    ink,
    1.9
  );
  parasite += p(
    'M192 233 L195 208 L212 190 L218 169 L233 149 L237 124 L244 146 L235 170 L234 195 L219 217 L218 244Z',
    '#8c292b',
    ink,
    2.1
  );
  parasite += p(
    'M168 242 L143 228 L116 223 L96 211 L72 205 L48 189 L76 196 L101 196 L124 207 L149 207 L181 222Z',
    '#922c2b',
    ink,
    2
  );
  parasite += p(
    'M157 226 L141 212 L133 192 L132 171 L122 150 L126 181 L126 205 L141 227 L158 239Z',
    '#8d292b',
    ink,
    1.8
  );
  parasite += p(
    'M81 112 L107 128 L122 152 L140 170 L157 193 L177 213 L184 226 L168 214 L151 192 L135 174 L118 157 L105 137 L88 126Z',
    '#b23b2f',
    'none'
  );
  parasite += p(
    'M167 170 L170 185 L180 207 L185 217 L177 212 L167 193Z M220 191 L223 173 L235 151 L231 169 L229 191 L211 215 L207 216Z M101 202 L121 213 L144 215 L162 226 L149 225 L125 221Z',
    '#b13e31',
    'none'
  );
  parasite += p(
    'M155 225 L174 218 L194 225 L210 240 L216 253 L196 259 L174 251Z',
    '#a2392f',
    ink,
    1.6
  );
  parasite += p('M160 231 L176 226 L191 232 L198 243 L179 239Z', '#c14a35', 'none');
  parasite += p(
    'M177 248 L195 250 L210 243 L215 254 L195 263 L173 254Z',
    '#692632',
    '#55232c',
    1.3
  );
  parasite += p(
    'M110 274 L96 265 L83 264 L96 280Z M99 330 L87 320 L80 321 L92 338Z M83 389 L71 381 L60 383 L72 397Z M85 442 L69 434 L64 440 L77 453Z M120 305 L136 298 L142 299 L130 313Z M107 367 L126 357 L134 361 L117 377Z M99 474 L113 467 L120 469 L109 482Z',
    thorn,
    ink,
    1.2
  );
  parasite += p(
    'M99 270 L89 267 L98 277Z M88 324 L83 323 L92 332Z M76 385 L66 385 L73 390Z M124 303 L136 300 L129 307Z',
    '#8c3d3b',
    'none'
  );
  parasite += p(
    'M96 265 L110 274 L103 276 L95 270Z M87 320 L99 330 L94 333 L86 325Z M69 434 L85 442 L80 447 L70 441Z M126 357 L134 361 L117 377 L121 369Z',
    '#9d4840',
    '#572b35',
    0.7
  );
  scene += g(
    '',
    parasite +
      turn(
        '0 195 249;0 195 249;1.4 195 249;-.6 195 249;0 195 249;0 195 249',
        '0;.3;.44;.57;.72;1',
        16
      )
  );

  // The rear leg bends under the long ragged cloth, ending in the dark boot.
  scene += p(
    'M167 353 L193 363 L193 389 L181 418 L181 440 L189 460 L183 481 L168 481 L156 466 L158 442 L153 422 L159 395 L155 373Z',
    paleFill,
    ink,
    2.2
  );
  scene += p(
    'M160 398 L174 401 L168 424 L171 443 L181 457 L176 471 L164 459 L165 438 L159 422Z',
    '#e0dfd0',
    '#8b939b',
    1.2
  );
  scene += p(
    'M159 458 L180 462 L184 482 L195 490 L190 506 L166 511 L156 501 L155 486Z',
    '#434854',
    ink,
    2
  );
  scene += p('M161 470 L169 474 L168 495 L186 499 L170 505 L160 497Z', '#6e7380', 'none');
  scene += l('M160 485 L165 487 M174 501 L186 498', '#90949a', 1.1);

  // The front thigh and shin are interrupted by the wrapping Strangler, as in the model.
  scene += p(
    'M210 349 L233 352 L246 376 L243 402 L232 410 L215 404 L209 384 L204 367Z',
    paleFill,
    ink,
    2.2
  );
  scene += p('M217 371 L239 372 L242 381 L217 380Z', '#b5ab80', '#82765f', 1.1);
  scene += p('M213 389 L242 395 L239 406 L228 410 L214 403Z', '#8c9baa', '#646d7c', 1.2);
  scene += p('M217 405 L232 410 L230 420 L221 416Z', '#882a2d', ink, 1.3);
  scene += p('M223 412 L229 413 L230 428 L224 434 L220 424Z', '#cecbb5', '#7d7b78', 1.1);
  scene += p('M229 445 L244 444 L253 457 L252 471 L245 478 L237 475 L231 463Z', paleFill, ink, 1.8);
  scene += p('M231 445 L242 439 L250 449 L245 455 L235 455Z', '#a13930', ink, 1.3);
  scene += p(
    'M239 470 L250 467 L253 483 L263 496 L262 508 L250 522 L229 526 L216 520 L219 507 L236 493Z',
    paleFill,
    ink,
    2
  );
  scene += p(
    'M248 484 L252 496 L245 510 L230 517 L236 520 L251 515 L258 505 L255 494Z',
    '#939da9',
    'none'
  );
  scene += p('M238 468 L249 464 L251 470 L241 477 L234 476Z', '#bbb081', '#8c8067', 1.1);
  // A second thick root winds around the destroyed right leg rather than becoming a thin zigzag.
  scene += p(
    'M219 379 L233 384 L241 403 L255 414 L259 433 L256 450 L247 466 L242 484 L232 496 L237 480 L235 466 L245 445 L246 429 L239 418 L225 410 L219 397Z',
    rootFill,
    ink,
    2
  );
  scene += p(
    'M231 391 L237 405 L250 418 L253 433 L248 450 L242 462 L242 475 L248 462 L257 443 L256 429 L248 414 L236 405Z',
    '#a43b33',
    'none'
  );
  scene += p(
    'M254 422 L268 416 L272 418 L260 430Z M255 452 L270 447 L275 452 L259 461Z',
    thorn,
    ink,
    1.2
  );

  // The torso leans forward and right over a narrow waist; only fragments of plate remain.
  scene += p(
    'M192 273 L215 263 L241 274 L242 292 L226 309 L220 326 L195 335 L170 323 L176 304Z',
    plateFill,
    ink,
    2.1
  );
  scene += p(
    'M184 292 L197 294 L214 282 L228 274 L238 279 L222 291 L208 305 L184 315 L175 313Z',
    '#737784',
    '#333642',
    1.3
  );
  scene += p(
    'M176 315 L196 320 L220 313 L223 327 L201 337 L169 329 L167 320Z',
    '#606572',
    ink,
    1.7
  );
  scene += p('M173 319 L194 324 L218 318 L216 324 L195 331 L172 326Z', '#92919a', 'none');
  scene += p(
    'M173 331 L198 337 L220 329 L237 349 L233 375 L214 397 L197 411 L180 440 L173 428 L176 406 L158 388 L158 359Z',
    '#494e5a',
    ink,
    2.1
  );
  scene += p(
    'M174 335 L183 339 L180 364 L172 380 L178 393 L176 406 L162 386 L164 362Z',
    '#aa967c',
    '#6f5d51',
    1.1
  );
  scene += p(
    'M183 341 L192 344 L197 361 L207 350 L220 341 L226 348 L210 364 L196 375 L188 362Z',
    '#9d886f',
    '#5e514d',
    1.3
  );
  scene += p(
    'M181 346 L185 348 L184 363 L189 377 L178 392 L184 402 L176 421 L168 413 L171 399 L163 387 L172 369Z',
    '#66554d',
    ink,
    1.4
  );
  scene += p('M194 379 L207 372 L200 399 L185 427 L181 436 L182 418Z', '#747985', '#323845', 1.3);
  scene += p('M218 365 L230 358 L226 375 L212 394 L205 397 L215 381Z', '#5c6472', '#353742', 1.1);
  scene += p(
    'M165 365 L169 368 L167 382 L171 386 L168 390 L161 383Z M187 416 L191 407 L190 421 L180 440 L178 431Z',
    '#bac0bc',
    '#515866',
    0.9
  );
  scene += l(
    'M177 343 L172 359 M186 346 L191 360 M202 381 L197 399 M181 404 L175 418 M219 373 L214 384',
    '#baaa91',
    1
  );

  // Corpse arm: broad pale upper arm, angular elbow, long tapered slate gauntlet.
  scene += p(
    'M245 240 L261 247 L272 267 L271 283 L280 302 L274 323 L259 330 L251 319 L259 300 L250 282 L247 262 L238 253Z',
    paleFill,
    ink,
    2.2
  );
  scene += p(
    'M258 259 L262 275 L261 287 L270 303 L265 320 L273 316 L276 302 L267 282 L268 268Z',
    '#909ba9',
    'none'
  );
  scene += p(
    'M250 263 L256 268 L258 289 L264 302 L259 314 L256 310 L260 299 L252 283Z',
    '#e3dfcd',
    'none'
  );
  scene += p(
    'M260 321 L275 322 L269 343 L256 368 L248 376 L239 367 L246 349 L250 333Z',
    plateFill,
    ink,
    2
  );
  scene += p('M260 329 L267 331 L259 352 L249 367 L245 367 L252 348Z', '#7c828c', 'none');
  scene += p('M256 318 L275 321 L272 329 L254 326Z', '#b6a48a', ink, 1.3);
  scene += p('M231 235 L248 237 L262 251 L267 262 L252 277 L233 270 L221 251Z', '#4e5664', ink, 2);
  scene += p(
    'M232 239 L245 240 L258 253 L257 260 L249 254 L241 247 L235 249 L237 260 L248 267 L251 271 L234 266 L226 251Z',
    '#b9ac91',
    '#6f716f',
    1.3
  );
  scene += p('M239 249 L247 253 L251 261 L243 258Z', '#71798a', '#393e4a', 1.1);
  scene += p('M245 239 L254 233 L261 242 L264 251 L260 254Z', '#9aabbc', '#525965', 1.2);
  scene += p('M254 239 L264 238 L268 246 L260 246Z', '#ded6ba', '#7f827e', 1);

  // The thorax is torn open, ivory ribs spanning red parasite-filled cavities.
  scene += p(
    'M183 243 L205 232 L227 238 L241 253 L239 272 L223 292 L199 306 L180 291 L174 267Z',
    '#8b2c2c',
    ink,
    1.9
  );
  scene += p(
    'M207 244 L218 247 L229 260 L221 279 L204 297 L191 291 L186 274 L195 258Z',
    '#b13b31',
    'none'
  );
  scene += p(
    'M180 260 L196 250 L206 252 L196 266 L182 274Z M197 281 L211 269 L218 274 L210 291 L200 298 L191 290Z M223 249 L236 257 L236 265 L225 263Z',
    '#51212b',
    'none'
  );
  // A low cut neck is integrated into the shoulder line, never a floating skull or candle.
  scene += p('M219 237 L224 228 L234 229 L239 236 L234 242Z', '#c4c5b6', '#7c817f', 1.2);
  scene += p('M225 231 L231 232 L234 236 L227 238Z', '#e6dfc6', 'none');
  scene += p(
    'M179 245 L198 241 L214 234 L223 239 L218 248 L205 249 L191 252 L179 255 L175 252Z',
    bone,
    '#80847e',
    1.4
  );
  scene += p('M179 246 L198 243 L213 237 L217 241 L201 246 L183 250Z', '#f0e7ca', 'none');
  scene += p(
    'M214 244 L205 255 L187 260 L176 270 L177 282 L187 289 L192 282 L183 278 L183 273 L192 267 L208 263 L222 252Z',
    '#d9dbca',
    '#7a817e',
    1.4
  );
  scene += p(
    'M214 257 L215 266 L206 278 L191 284 L187 294 L195 304 L204 306 L208 298 L199 296 L196 291 L211 286 L224 272 L223 263Z',
    '#bec8bc',
    '#73817f',
    1.4
  );
  scene += p('M214 278 L220 282 L219 292 L213 298 L208 298 L212 289Z', boneShade, '#6f7d7f', 1.3);
  scene += p(
    'M220 245 L226 256 L238 262 L240 271 L232 269 L222 263 L215 252Z',
    '#dddcc7',
    '#7a827c',
    1.3
  );
  scene += p('M221 261 L228 274 L235 279 L229 287 L220 278 L215 270Z', '#c7cebf', '#76817c', 1.3);
  scene += l(
    'M181 271 L190 264 L206 260 M190 290 L207 282 L219 269 M218 247 L225 258 M219 264 L227 276',
    '#f1e8cf',
    1
  );
  // Remnant of the black chest wrap curls diagonally across the lowest ribs.
  scene += p(
    'M233 276 L245 277 L234 291 L217 304 L202 318 L180 317 L181 308 L200 301 L218 289Z',
    plateFill,
    ink,
    1.8
  );
  scene += p(
    'M234 281 L239 279 L229 291 L215 301 L198 311 L186 313 L190 308 L204 303 L222 291Z',
    '#747b88',
    'none'
  );
  scene += l('M234 284 L225 293 M218 299 L204 309', '#a0a5ab', 0.9);

  // Model-specific oxblood root crosses the torn tabard rather than a clean uniform skirt.
  scene += p(
    'M165 339 L173 341 L177 354 L178 364 L187 373 L196 377 L190 383 L180 379 L170 369 L165 357 L161 346Z',
    '#802a30',
    ink,
    1.5
  );
  scene += p(
    'M165 343 L169 345 L172 358 L174 366 L183 375 L189 377 L182 377 L172 369 L167 356Z',
    '#aa3c32',
    'none'
  );

  // Foreground parasite overlaps tie the ribs and hip back to the same living mass.
  scene += p(
    'M172 251 L185 253 L193 264 L194 280 L187 295 L177 307 L177 291 L181 276 L176 265 L165 261Z',
    '#962d2b',
    ink,
    1.7
  );
  scene += p(
    'M176 256 L183 259 L188 271 L185 282 L180 291 L183 276 L179 265 L172 261Z',
    '#c24835',
    'none'
  );
  scene += p(
    'M210 359 L224 348 L243 345 L258 336 L253 350 L241 360 L224 366 L214 381 L203 382 L200 373Z',
    rootFill,
    ink,
    2
  );
  scene += p(
    'M211 366 L226 356 L241 353 L252 346 L244 356 L225 362 L214 376 L207 378Z',
    '#b64434',
    'none'
  );
  scene += p(
    'M247 345 L256 340 L264 329 L260 343 L253 351Z M224 356 L231 344 L237 339 L233 352Z',
    '#7d2b32',
    ink,
    1.1
  );
  scene += l('M216 367 L225 360 L241 356', '#d15a40', 0.9);

  // Small fragments keep the foreground grounded without adding a second subject.
  scene += p(
    'M76 500 L83 495 L91 498 L89 504Z M135 520 L143 513 L153 517 L150 524Z M279 501 L286 497 L295 504 L288 509Z',
    '#78727b',
    '#52444d',
    1.1
  );
  scene += circle(161, 504, 1.5, '#6e626b', 'none');
  scene += circle(270, 525, 1.8, '#6e626b', 'none');

  // The separate head is raised by a thorned root through the ritual floor.
  // A fixed ground clip hides the descending root, rather than fading a floating
  // face in above the arena. The still pose remains emerged for reduced motion.
  const headCycle = 16;
  const headKeys = '0;.25;.34;.4;.54;.61;.69;1';
  scene += `<defs><clipPath id="${id}-head-ground"><rect x="254" y="350" width="78" height="169"/></clipPath></defs>`;
  const splitFloor =
    p(
      'M265 519 L273 512 L283 515 L289 507 L295 514 L307 514 L315 521 L304 527 L291 525 L279 529 L268 525Z',
      '#514049',
      '#796b70',
      1.1
    ) +
    p('M271 520 L282 516 L292 512 L305 517 L310 521 L299 524 L281 525Z', '#322b35', ink, 1.1) +
    l(
      'M272 516 L263 510 L261 502 M280 516 L278 506 L272 501 M302 516 L313 508 L320 509 M308 524 L316 531 M282 526 L278 534',
      '#6c535c',
      1.2
    );
  scene += `<g opacity=".75" data-art-effect="vardorvis-head-crack">${a('opacity', '.3;.3;.9;1;1;.9;.3;.3', headKeys, headCycle)}${splitFloor}</g>`;

  let headRoot = p(
    'M-12 2 L-15 -23 L-12 -45 L-8 -67 L-3 -83 L-7 -99 L-1 -112 L8 -103 L12 -83 L9 -62 L5 -39 L9 -18 L12 2Z',
    rootFill,
    ink,
    1.9
  );
  headRoot += p(
    'M-10 0 L-11 -26 L-7 -46 L-3 -66 L2 -81 L0 -99 L5 -105 L8 -83 L5 -62 L1 -39 L5 -16 L7 1Z',
    '#a03b32',
    'none'
  );
  headRoot += p(
    'M-12 -24 L-26 -34 L-32 -34 L-18 -16Z M7 -42 L23 -47 L28 -43 L8 -34Z M-7 -65 L-18 -73 L-24 -71 L-9 -57Z M10 -83 L20 -86 L25 -81 L11 -76Z',
    '#632a32',
    ink,
    1.1
  );
  headRoot += p(
    'M-24 -33 L-17 -25 L-18 -19Z M12 -43 L23 -46 L18 -40Z M-17 -71 L-11 -64 L-12 -60Z',
    '#a3453b',
    'none'
  );
  headRoot += l('M-5 -4 L-6 -26 L-2 -44 M1 -63 L6 -83', '#c15b43', 0.8);

  // The metal hood and long pale nose are the reference model's identity.
  // It is a vampyre's head in a slate helm, not a bare skull.
  let face = p(
    'M-19 -112 L-19 -127 L-6 -139 L11 -135 L21 -124 L22 -107 L18 -91 L9 -87 L-4 -94 L-13 -100Z',
    '#474957',
    ink,
    1.8
  );
  face += p('M-19 -127 L-6 -139 L11 -135 L5 -124 L-12 -117 L-19 -112Z', '#60636f', 'none');
  face += p('M11 -135 L21 -124 L22 -107 L18 -91 L9 -87 L9 -108 L5 -124Z', '#343844', 'none');
  face += p(
    'M11 -135 L22 -130 L26 -120 L27 -110 L22 -117 L18 -118 L18 -108 L11 -114Z',
    '#3b3d48',
    '#292a35',
    1
  );
  face += p('M12 -132 L20 -127 L22 -120 L16 -123Z', '#555865', 'none');
  face += p(
    'M-15 -114 L-5 -116 L4 -108 L8 -95 L2 -86 L-10 -91 L-15 -101Z',
    '#b7ae8b',
    '#615747',
    1.2
  );
  face += p(
    'M-12 -113 L-6 -115 L-4 -107 L-11 -102 L-19 -100 L-21 -103 L-15 -107Z',
    '#dfd1ad',
    '#8c8168',
    0.9
  );
  face += p('M-10 -111 L-6 -111 L-8 -105 L-17 -103 L-13 -107Z', '#eee1bd', 'none');
  face += p('M-10 -98 L-2 -99 L5 -95 L2 -89 L-7 -91 L-12 -95Z', '#48242b', '#6b5146', 0.8);
  face += p(
    'M-11 -98 L-7 -97 L-6 -90 L-10 -93Z M1 -98 L4 -96 L1 -90 L-1 -92Z',
    '#eee0b8',
    '#aa967c',
    0.6
  );
  face += p(
    'M-18 -116 L-10 -120 L-3 -115 L-11 -111Z M-2 -114 L5 -115 L9 -111 L2 -108Z',
    '#98a6b6',
    '#3c414c',
    0.8
  );
  face += p(
    'M-16 -116 L-11 -118 L-8 -114 L-13 -113Z M2 -113 L5 -113 L6 -111 L3 -110Z',
    '#bb4939',
    '#76313a',
    0.45
  );
  face += p(
    'M-19 -112 L-13 -105 L-14 -90 L-21 -80 L-20 -100Z M9 -108 L21 -106 L21 -91 L14 -80 L6 -84 L7 -95Z',
    '#3c414d',
    '#292a35',
    1.1
  );
  face += p(
    'M-21 -80 L-16 -86 L-15 -98 L-13 -95 L-14 -82 L-22 -74Z M14 -80 L21 -91 L20 -80 L14 -76 L6 -79 L6 -84Z',
    '#aaa289',
    '#514e49',
    0.9
  );
  face += l('M-18 -125 L-10 -131 M11 -130 L16 -123 M12 -99 L11 -88', '#747b88', 0.85);
  const emergingHead =
    headRoot +
    `<g transform="rotate(0 0 -105)">${turn('0 0 -105;0 0 -105;-8 0 -105;0 0 -105;0 0 -105;5 0 -105;0 0 -105;0 0 -105', headKeys, headCycle)}${face}</g>`;
  scene += `<g clip-path="url(#${id}-head-ground)" data-art-effect="vardorvis-head-emergence"><g transform="translate(292 519)"><g transform="translate(0 0)">${move('0 150;0 150;0 -4;0 0;0 0;0 10;0 150;0 150', headKeys, headCycle)}${emergingHead}</g></g></g>`;

  // A single green Head Gaze travels away from the emerged face, then vanishes
  // before its reset. The real encounter screenshot supplies the cone silhouette.
  const gaze =
    p('M0 0 L-31 -12 L-22 0 L-31 12Z', '#75a36b', '#aec4a0', 0.7, 'opacity=".62"') +
    p('M-4 0 L-25 -7 L-18 0 L-25 7Z', '#bfd3a3', 'none', 0, 'opacity=".66"');
  scene += `<g opacity="0" data-art-effect="vardorvis-head-gaze">${a('opacity', '0;0;.8;.65;0;0', '0;.43;.45;.51;.54;1', headCycle)}<g transform="translate(275 416)">${move('275 416;275 416;245 416;132 427;132 427', '0;.44;.46;.54;1', headCycle)}${gaze}</g></g>`;

  // Stone fragments sit in front of the root's cut edge and preserve contact.
  scene += p(
    'M268 521 L274 515 L280 521 L277 526Z M298 523 L304 516 L311 520 L307 526Z M283 527 L287 521 L293 525 L291 530Z',
    '#a19791',
    '#63535b',
    1.1
  );
  scene += l('M270 520 L275 520 M302 520 L307 521 M285 525 L289 525', '#d0c2ac', 0.8);
  const chips = [
    [274, 516, -7, -18, 'M-3 0 L0 -4 L4 -1 L2 3Z'],
    [284, 512, -4, -27, 'M-2 0 L1 -3 L4 1 L0 3Z'],
    [304, 516, 8, -19, 'M-3 1 L-1 -4 L4 -2 L3 3Z'],
    [312, 521, 6, -11, 'M-2 0 L1 -3 L3 1 L0 3Z'],
  ];
  chips.forEach(([x, y, dx, dy, shape], index) => {
    const chip = p(shape, index % 2 ? '#b5a79b' : '#8f7d7e', '#66515b', 0.7);
    scene += `<g opacity="0" data-art-effect="vardorvis-head-floor-chip">${a('opacity', '0;0;.65;.5;0;0', '0;.28;.32;.36;.4;1', headCycle)}<g transform="translate(${x} ${y})"><g>${move(`0 0;0 0;${dx} ${dy};${dx * 1.35} 2;${dx * 1.35} 2`, '0;.28;.34;.4;1', headCycle)}${chip}</g></g></g>`;
  });
  return scene;
};
