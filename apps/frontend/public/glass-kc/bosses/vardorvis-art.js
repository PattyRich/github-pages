/* Original Wiki-referenced stained glass. Approved after per-window artwork reviews. */
/* global GLASS_RENDERERS, createGlassWindow */
GLASS_RENDERERS.vardorvis = function createVardorvisRenderer(config, { esc, getJournal }) {
  const helpers = {
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
      return `<g opacity="0" ${attrs}>${helpers.a('opacity', values, keys, seconds)}${body}</g>`;
    },
  };
  // Scene authors may destructure helpers without losing the path helper's context.
  helpers.l = helpers.l.bind(helpers);
  const scenes = {};
  const sceneKeys = ['vardorvis', 'stranglewood', 'ultor-ring', 'axe-head'];
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
  scenes.vardorvis = (h, c, id) => {
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
    scene += p(
      'M229 445 L244 444 L253 457 L252 471 L245 478 L237 475 L231 463Z',
      paleFill,
      ink,
      1.8
    );
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
    scene += p(
      'M231 235 L248 237 L262 251 L267 262 L252 277 L233 270 L221 251Z',
      '#4e5664',
      ink,
      2
    );
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

  /* Original stained-glass interpretation, second artwork pass.
   * References inspected: OSRS Wiki The_Stranglewood; File:Strangled_flora_and_fauna_concept.png;
   * File:Stranglewood_Ritual_Site_concept.png; user-supplied city-centre temple and
   * strangled animal screenshots. Pass 2 reopened the supplied city/animal images and
   * compared initial still + full-cycle contact sheet: enlarged the skull, separated
   * tooth-lined open jaws from the curling parasite, connected narrow ribs to a
   * faceted spine and jointed legs, and refined bone-white twig tips/temple erosion.
   * Architecture and bone/parasite identity colours stay fixed.
   * Vine-motion pass 1: revisited the supplied city/animal references and the Wiki
   * Strangled_flora_and_fauna_concept.png. Three rooted scarlet ribbons flex over
   * the stepped faces; their facets and thorns share the same path poses.
   * Vine-motion pass 2: reopened the city screenshot and Wiki flora concept beside
   * the initial cycle. Tapered the small summit thorns, seated lower roots with
   * contact shadows, and eased the flex. The vines now share a brief activity
   * window in a 40-second cycle, with long still rests before and after it.
   * Timing refinement: the last settle ends at 15.5s across all three vines,
   * leaving 33.5 of every 40 seconds (83.75%) completely still. */
  (function () {
    scenes.stranglewood = function stranglewood(h, c, id) {
      const { p, l, g, ellipse, circle, move, on, a } = h;
      const lead = '#252329';
      const stone = '#8d727d';
      const bone = '#d7cdb3';
      const blood = '#731e2a';
      const points = (ps) =>
        ps.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ') + 'Z';
      const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      const poly = (ps, fill, stroke = lead, width = 1.4) => p(points(ps), fill, stroke, width);
      function livingVine(poses, widths, delay) {
        const times = '0;.225;.27;.3;.335;.37;1';
        const sequence = [0, 0, 1, 2, 1, 0, 0];
        const frames = poses.map((pose) =>
          pose.map(([x, y], i) => {
            const prev = pose[Math.max(0, i - 1)];
            const next = pose[Math.min(pose.length - 1, i + 1)];
            const length = Math.hypot(next[0] - prev[0], next[1] - prev[1]);
            const normal = [-(next[1] - prev[1]) / length, (next[0] - prev[0]) / length];
            return { x, y, normal, width: widths[i] };
          })
        );
        const edge = (point, side) => [
          point.x + point.normal[0] * point.width * side,
          point.y + point.normal[1] * point.width * side,
        ];
        const movingPolygon = (build, fill, stroke = 'none', width = 0) => {
          const paths = frames.map((frame) => points(build(frame)));
          return `<path d="${paths[0]}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round">${a('d', sequence.map((index) => paths[index]).join(';'), times, 40, `begin="${delay}s" calcMode="spline" keySplines="0 0 1 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;0 0 1 1"`)}</path>`;
        };
        let vine = movingPolygon(
          (frame) => [
            ...frame.map((point) => edge(point, 1)),
            ...frame
              .slice()
              .reverse()
              .map((point) => edge(point, -1)),
          ],
          blood,
          '#421b24',
          1.3
        );
        for (let i = 0; i < widths.length - 1; i++) {
          vine += movingPolygon(
            (frame) => [
              edge(frame[i], -0.05),
              edge(frame[i + 1], -0.05),
              edge(frame[i + 1], 1),
              edge(frame[i], 1),
            ],
            i % 2 ? '#9a343c' : '#872b35'
          );
        }
        for (const [index, side] of [
          [2, -1],
          [4, 1],
          [5, -1],
        ]) {
          vine += movingPolygon(
            (frame) => {
              const point = frame[index];
              const origin = edge(point, side);
              const reach = Math.min(7, point.width * 1.6 + 2);
              const tip = [
                origin[0] + point.normal[0] * side * reach - 1.5,
                origin[1] + point.normal[1] * side * reach - 4,
              ];
              return [[origin[0] - 2, origin[1] + 2], tip, [origin[0] + 3, origin[1] + 3]];
            },
            '#9e353c',
            '#4c1c27',
            0.65
          );
        }
        return `<g data-art-effect="temple-strangler-vine">${vine}</g>`;
      }
      let art = '';

      // A deep, enclosed Old Ones city: pale infected woodland, river and masonry.
      art += p(
        'M35 167 L71 145 L109 156 L145 142 L193 150 L239 138 L283 158 L325 148 V535 H35Z',
        '#42433e',
        '#6b6860',
        1.2
      );
      art += p(
        'M36 246 L80 210 L115 232 L137 271 L117 319 L70 352 L35 365Z',
        '#566367',
        '#303b41',
        1.7
      );
      art += p('M35 292 L69 275 L102 279 L120 265 M36 326 L62 306 L88 309', 'none', '#839293', 1);
      art += p(
        'M35 353 L94 321 L153 341 L203 320 L278 342 L325 318 V535 H35Z',
        '#65594e',
        '#35332f',
        1.5
      );
      art += p('M133 355 L197 365 L287 535 H86 L123 453 L111 412Z', '#887b69', '#443d38', 1.4);
      art += p('M123 453 L153 421 L204 452 L189 488 L230 535 H86Z', '#9b8a71', '#534a40', 1.2);

      function fir(x, y, s, dark) {
        return g(
          `translate(${x} ${y}) scale(${s})`,
          p('M-3 0 L-4 -78 L3 -78 L5 0Z', '#665447', lead, 1.3) +
            p(
              'M0 -128 L14 -97 L8 -99 L23 -72 L15 -74 L32 -43 L21 -46 L35 -17 L7 -29 L-7 -20 L-32 -20 L-21 -47 L-29 -43 L-12 -77 L-20 -70 L-6 -103 L-12 -96Z',
              dark ? '#35483f' : '#64715b',
              lead,
              1.4
            ) +
            p(
              'M0 -128 L0 -34 L-8 -24 L-27 -23 L-18 -47 L-24 -45 L-9 -76 L-15 -72 L-3 -101 L-8 -98Z',
              dark ? '#46584a' : '#79806a',
              'none'
            ) +
            l('M0 -110 L7 -88 M-2 -77 L12 -59 M-2 -48 L20 -31', '#899078', 0.9)
        );
      }
      art += fir(109, 223, 0.69, true) + fir(269, 236, 0.83, false) + fir(301, 268, 0.96, true);
      art += fir(71, 211, 0.58, false) + fir(225, 177, 0.38, true);

      // Tall enclosing masonry wall, inset carved frieze and a broken column.
      art += p('M62 229 L166 188 L290 223 V272 L166 234 L62 277Z', '#806773', lead, 2);
      art += p('M62 229 L166 188 L290 223 L286 234 L165 201 L63 242Z', '#aa9297', lead, 1.2);
      art += p('M65 253 L164 215 L287 249 V260 L164 227 L65 266Z', '#65535d', lead, 1);
      for (let i = 0; i < 11; i++) {
        const x = 72 + i * 8.1;
        const y = 246 - i * 3.1;
        art += l(`M${x} ${y} v6 h3 v-4 h3 v6`, '#b19b9e', 0.85);
        art += l(`M${177 + i * 9.2} ${220 + i * 2.55} v6 h3 v-4 h3 v6`, '#a48a93', 0.85);
      }
      art += l(
        'M84 235 L85 247 M110 225 V237 M138 214 V226 M188 207 V220 M216 215 V228 M245 223 V236 M271 230 V243',
        '#4b3f49',
        1
      );
      art += l(
        'M70 251 L94 242 M105 237 L132 227 M175 232 L204 240 M220 244 L250 253',
        '#c1a6a6',
        0.75
      );

      // Four-sided square truncated pyramid with a real dark opening at its summit.
      const topL = [132, 225],
        topB = [180, 254],
        topR = [228, 225];
      const baseL = [57, 314],
        baseB = [180, 396],
        baseR = [303, 314];
      art += poly([topL, topB, baseB, baseL], '#9c7f89', lead, 2.2);
      art += poly([topB, topR, baseR, baseB], '#7c626e', lead, 2.2);
      for (let row = 0; row < 8; row++) {
        const t = row / 8,
          u = (row + 1) / 8;
        const leftA = mix(topL, baseL, t),
          leftB = mix(topB, baseB, t);
        const leftC = mix(topB, baseB, u),
          leftD = mix(topL, baseL, u);
        const rightA = mix(topB, baseB, t),
          rightB = mix(topR, baseR, t);
        const rightC = mix(topR, baseR, u),
          rightD = mix(topB, baseB, u);
        art += poly(
          [leftA, leftB, leftC, leftD],
          ['#9d8088', '#92747f', '#a1858d'][row % 3],
          '#604c58',
          1.2
        );
        art += poly(
          [rightA, rightB, rightC, rightD],
          ['#806571', '#735c67', '#896c77'][row % 3],
          '#4a3e49',
          1.2
        );
        const count = 4 + Math.floor(row / 2);
        for (let brick = 1; brick < count; brick++) {
          const f = (brick - (row % 2 ? 0.38 : 0)) / count;
          const a1 = mix(leftA, leftB, f),
            b1 = mix(leftD, leftC, f);
          const a2 = mix(rightA, rightB, f),
            b2 = mix(rightD, rightC, f);
          art += l(
            `M${a1[0]} ${a1[1]} L${b1[0]} ${b1[1]} M${a2[0]} ${a2[1]} L${b2[0]} ${b2[1]}`,
            '#55464e',
            0.9
          );
        }
        art += l(`M${leftD[0]} ${leftD[1] - 1.5} L${leftC[0]} ${leftC[1] - 1.5}`, '#b59ba0', 0.7);
      }
      art += poly([[180, 196], topR, topB, topL], '#9a8880', lead, 2);
      art += poly(
        [
          [180, 202],
          [218, 225],
          [180, 247],
          [142, 225],
        ],
        '#73665f',
        '#b19b8f',
        1
      );
      art += poly(
        [
          [180, 210],
          [206, 225],
          [180, 240],
          [154, 225],
        ],
        '#171c1f',
        '#413b39',
        2
      );
      art += p('M154 225 L180 210 L206 225 L201 228 L180 217 L160 229Z', '#383631', 'none');

      // Dark, individually cut stair treads descend the right-hand sloping face.
      const stairTL = [205, 241],
        stairTR = [220, 232],
        stairBL = [250, 350],
        stairBR = [275, 334];
      art += poly([stairTL, stairTR, stairBR, stairBL], '#4d454a', '#c0a3a6', 1.2);
      for (let step = 0; step < 12; step++) {
        const t = step / 12,
          u = (step + 1) / 12;
        const tl = mix(stairTL, stairBL, t),
          tr = mix(stairTR, stairBR, t);
        const bl = mix(stairTL, stairBL, u),
          br = mix(stairTR, stairBR, u);
        art += poly([tl, tr, br, bl], step % 2 ? '#65555e' : '#79616e', '#3a323b', 0.9);
        art += l(`M${bl[0]} ${bl[1]} L${br[0]} ${br[1]}`, '#ad8e99', 0.9);
      }

      // Retaining wall has a carved edge, a heavy cap and staggered masonry courses.
      art += p('M59 333 L180 413 L300 334 V356 L180 438 L59 355Z', '#6b5862', lead, 2);
      art += p('M59 333 L67 327 L180 402 L293 327 L300 334 L180 415Z', '#b49b9f', lead, 1.5);
      art += l(
        'M60 344 L180 425 L299 345 M77 347 L77 357 M98 360 V372 M120 375 V387 M144 391 V403 M168 407 V420 M192 407 V420 M217 390 V402 M242 373 V385 M268 355 V368 M289 342 V353',
        '#433942',
        1
      );
      for (let i = 0; i < 13; i++) {
        art += l(`M${68 + i * 8.2} ${337 + i * 5.4} l0 5 l4 3 l0 -5`, '#d1b8ae', 0.7);
        art += l(`M${188 + i * 8.0} ${410 - i * 5.4} l0 5 l4 -3 l0 -5`, '#a98d97', 0.7);
      }
      art += p('M281 281 L290 276 L299 282 V315 L290 322 L281 315Z', stone, lead, 1.4);
      art += ellipse(290, 281, 10, 5, '#baa1a3', lead, 1.2);
      art += l(
        'M281 290 L299 290 M281 299 L299 299 M281 308 L299 308 M287 286 V315',
        '#56444f',
        0.9
      );
      art += p(
        'M108 277 L118 270 L126 276 L117 284Z M144 339 L155 344 L151 350 L141 346Z M240 283 L247 280 L250 287 L245 290Z',
        '#67565f',
        '#b59ca3',
        0.7
      );
      art += l(
        'M113 287 L109 302 L113 313 M147 346 L143 364 M274 314 L267 327 L270 334',
        '#b5a46e',
        1
      );
      art += p(
        'M111 296 L104 292 L107 300Z M111 305 L117 301 L115 309Z M145 354 L137 350 L141 359Z M269 323 L276 318 L273 326Z',
        '#96885c',
        '#625d47',
        0.65
      );

      // The masonry stays fixed while rooted scarlet tendrils flex along its faces.
      art += ellipse(104, 360.5, 7, 2.1, '#45353f', 'none', 0, 'opacity=".65"');
      art += ellipse(263, 362, 6.5, 2.2, '#45353f', 'none', 0, 'opacity=".65"');
      art += livingVine(
        [
          [
            [104, 359],
            [99, 344],
            [102, 325],
            [113, 312],
            [111, 293],
            [119, 282],
            [133, 284],
            [136, 273],
          ],
          [
            [104, 359],
            [99, 344],
            [95, 326],
            [101, 311],
            [100, 292],
            [110, 275],
            [127, 274],
            [130, 264],
          ],
          [
            [104, 359],
            [99, 344],
            [104, 325],
            [121, 316],
            [124, 299],
            [135, 292],
            [146, 294],
            [146, 282],
          ],
        ],
        [5, 4.8, 4.3, 3.7, 3.2, 2.7, 1.9, 0.6],
        0
      );
      art += livingVine(
        [
          [
            [263, 361],
            [274, 345],
            [272, 326],
            [257, 314],
            [260, 298],
            [250, 284],
            [237, 286],
            [232, 276],
          ],
          [
            [263, 361],
            [274, 345],
            [286, 325],
            [272, 314],
            [273, 297],
            [265, 281],
            [250, 277],
            [247, 266],
          ],
          [
            [263, 361],
            [274, 345],
            [260, 330],
            [247, 321],
            [246, 306],
            [235, 299],
            [224, 303],
            [218, 295],
          ],
        ],
        [5, 4.7, 4, 3.6, 3, 2.5, 1.8, 0.6],
        0.35
      );
      art += livingVine(
        [
          [
            [228, 242],
            [234, 232],
            [229, 219],
            [218, 216],
            [211, 222],
            [216, 229],
          ],
          [
            [228, 242],
            [234, 232],
            [236, 216],
            [226, 207],
            [216, 210],
            [212, 220],
          ],
          [
            [228, 242],
            [234, 232],
            [225, 226],
            [216, 227],
            [212, 235],
            [221, 237],
          ],
        ],
        [3, 2.8, 2.4, 1.9, 1.3, 0.5],
        0.7
      );

      // Bleached tree: broad scarlet parasitic ribbons, rather than green creepers.
      art += p(
        'M39 492 L48 420 L52 361 L48 303 L59 253 L55 208 L63 159 L59 119 L68 101 L70 159 L66 210 L74 254 L64 304 L68 368 L59 425 L57 492Z',
        '#cdc8b4',
        lead,
        2.2
      );
      art += p(
        'M55 211 L37 182 L35 160 L42 168 L46 183 L60 193 M64 169 L86 148 L91 123 L99 108 L97 135 L91 157 L70 189 M65 237 L88 218 L103 180 L112 168 L109 198 L97 227 L71 251 M55 298 L36 271 L35 245 L44 264 L61 279 M63 347 L86 327 L96 302 L105 296 L101 323 L88 345 L66 366',
        '#d6d2bf',
        lead,
        1.7
      );
      art += p(
        'M62 172 L70 164 L69 185 L59 203 L58 218 L65 231 L72 226 L74 248 L63 255 L54 236 L51 220 L55 199Z M54 288 L66 280 L65 299 L58 318 L64 334 L68 330 L69 351 L58 363 L49 343 L49 325 L56 307Z M49 405 L62 392 L60 416 L51 438 L56 454 L58 449 L59 471 L45 481 L40 463 L42 442 L50 420Z',
        blood,
        '#421b24',
        1.2
      );
      art += p(
        'M87 156 L97 151 L94 169 L86 184 L84 195 L76 199 L79 179Z M88 329 L99 320 L97 339 L88 350 L78 351 L84 338Z',
        '#8f2931',
        '#4c1b24',
        1
      );
      art += l(
        'M61 120 L62 153 L59 181 M60 257 L56 274 M60 371 L53 403 M48 483 L50 466',
        '#f0e8cf',
        1.3
      );
      art += p(
        'M69 148 L82 133 L83 114 L87 103 L88 125 L83 141 L71 157Z M42 175 L36 157 L36 139 L42 151 L45 171Z M97 216 L114 203 L122 185 L121 204 L108 218 L99 223Z',
        '#e0dac4',
        lead,
        1.1
      );
      art += p(
        'M39 493 L49 480 L62 487 L76 499 L61 496 L57 509 L49 499 L35 505Z',
        '#aba893',
        lead,
        1.3
      );

      // Connected carcass silhouette: arched spine, open ribs and bent long bones.
      art += ellipse(190, 496, 102, 21, '#393632', '#535044', 1.2);
      art += p(
        'M145 466 L153 448 L180 434 L212 437 L236 454 L231 479 L203 491 L171 488Z',
        '#403d35',
        '#6c6353',
        1.2
      );
      art += p(
        'M139 460 L143 445 L163 429 L189 423 L217 430 L235 444 L247 448 L244 459 L226 453 L208 439 L188 435 L168 440 L154 451 L150 468Z',
        '#cabc9d',
        lead,
        1.7
      );
      art += p(
        'M143 445 L163 429 L190 423 L214 429 L209 436 L187 433 L166 437 L149 449Z',
        '#e9dabb',
        '#a79b81',
        0.9
      );
      art += l(
        'M161 430 L165 437 M175 427 L178 434 M191 425 L190 433 M204 429 L201 436 M218 435 L213 442 M229 444 L223 449',
        '#8d826b',
        1.2
      );
      art += p(
        'M158 444 Q142 459 153 479 L164 488 L170 484 L159 472 Q150 459 165 447Z',
        bone,
        lead,
        1.3
      );
      art += p(
        'M175 437 Q157 452 168 475 L180 488 L186 485 L175 469 Q165 453 181 440Z',
        '#d7c5a3',
        lead,
        1.3
      );
      art += p(
        'M191 436 Q175 451 185 473 L199 486 L205 482 L192 467 Q182 453 197 440Z',
        '#e0cfac',
        lead,
        1.3
      );
      art += p(
        'M208 441 Q196 452 204 469 L218 479 L224 474 L211 464 Q204 452 214 445Z',
        '#cbb998',
        lead,
        1.3
      );
      art += p(
        'M226 451 L241 445 L260 454 L261 465 L252 472 L243 465 L236 457 L227 461Z',
        '#d9c8a3',
        lead,
        1.4
      );
      art += p(
        'M250 462 L258 465 L250 487 L276 488 L282 496 L279 504 L244 498 L238 488Z',
        '#d5c4a0',
        lead,
        1.5
      );
      art += p(
        'M150 467 L160 472 L150 489 L171 505 L168 513 L158 514 L136 494 L138 485Z',
        '#ccbd9f',
        lead,
        1.5
      );
      art += p(
        'M158 502 L170 506 L168 513 L158 511Z M273 489 L282 494 L279 504 L269 498Z',
        '#eee0bd',
        '#7c735e',
        1
      );
      art += l('M146 478 L151 473 M242 485 L248 472 M247 492 L268 496', '#96876e', 1);

      // The rear parasite disappears behind the cranium, then returns through its mouth.
      art += p(
        'M145 480 L141 465 Q145 447 164 441 Q185 438 205 454 L209 463 L198 461 Q182 449 168 451 Q152 454 153 468 L155 481Z',
        '#651e28',
        '#371b22',
        1.7
      );
      art += p('M151 459 Q160 443 175 445 L194 453 L185 450 Q166 447 156 466Z', '#963139', 'none');

      // Enlarged low skull, triangular eye socket and a visibly open, tooth-lined jaw.
      art += p(
        'M107 447 L132 443 L151 452 L159 466 L153 479 L143 483 L128 481 L116 490 L105 483 L96 467 L98 453Z',
        '#d8ccad',
        lead,
        1.8
      );
      art += p('M107 447 L132 443 L129 461 L112 468 L98 453Z', '#eee3c8', '#a2967d', 1);
      art += p('M132 443 L151 452 L159 466 L144 461 L129 461Z', '#b7ad94', '#91856f', 1);
      art += p('M105 465 L119 457 L126 472 L118 482 L109 478Z', '#242723', '#a99b7b', 1.4);
      art += p('M99 476 L106 476 L108 486 L104 489 L99 484Z', '#5b5643', '#c8b895', 1);
      art += p(
        'M129 473 L143 469 L155 477 L157 489 L147 499 L133 499 L123 491 L122 480Z',
        '#eddcba',
        '#897e67',
        1.4
      );
      art += p(
        'M132 479 L143 476 L150 481 L150 489 L143 493 L131 490 L128 484Z',
        '#38252a',
        '#b3a68b',
        1.2
      );
      art += p(
        'M128 479 L133 478 L133 484 L129 484Z M136 477 L140 476 L141 483 L137 483Z M144 478 L148 480 L146 485 L143 484Z',
        '#f5e8c8',
        '#8d8067',
        0.75
      );
      art += p(
        'M124 488 L132 494 L146 496 L151 490 L156 493 L149 504 L132 505 L119 497 L116 490Z',
        '#d7c7a4',
        lead,
        1.3
      );
      art += p(
        'M129 495 L133 496 L132 491 L129 491Z M138 498 L142 498 L141 493 L138 494Z M147 495 L150 493 L147 490 L145 492Z',
        '#f2e3c2',
        '#8d8067',
        0.7
      );
      art += p('M100 455 L88 450 L96 466 L105 470Z', '#c9bfa4', lead, 1.2);
      art += l('M128 447 L126 456 M134 465 L142 463 M100 459 L106 463', '#a19174', 0.9);

      // Clear curl emerging between the jaws: its dark edge separates red vine from bone.
      art += p(
        'M144 486 C148 488 147 493 142 495 C135 499 125 497 122 493 L120 488 L114 490 L114 497 C121 509 137 512 149 503 C157 498 157 488 151 482 L145 480Z',
        '#6d202b',
        '#381b23',
        1.7
      );
      art += p(
        'M143 490 Q147 495 137 499 Q123 503 118 495 L120 500 Q134 511 148 500 L151 490 L147 486Z',
        '#9a333b',
        'none'
      );
      art += p(
        'M206 465 L218 451 L226 425 L236 408 L232 432 L227 459 L216 475Z M96 497 L91 477 L75 459 L87 467 L103 484 L107 499Z M278 488 L283 468 L295 453 L289 476 L288 493Z',
        blood,
        '#391d26',
        1.4
      );
      art += p(
        'M87 442 L80 426 L83 450Z M112 438 L114 419 L122 443Z M259 445 L265 427 L264 452Z M294 513 L302 496 L301 518Z M73 516 L66 500 L68 522Z',
        '#8b2631',
        '#4a2029',
        1
      );

      // Rusty grasses, fallen stones and light facets hold the foreground together.
      for (const [x, y, s] of [
        [89, 383, 0.75],
        [286, 405, 0.9],
        [81, 527, 0.7],
        [309, 524, 0.75],
        [121, 403, 0.6],
      ]) {
        art += g(
          `translate(${x} ${y}) scale(${s})`,
          l(
            'M0 0 L-3 -20 M0 -5 L-11 -16 M-3 -13 L3 -26 M-1 -3 L8 -15 M-2 -11 L-10 -26',
            '#99915d',
            1.2
          ) +
            p(
              'M-11 -16 L-16 -14 L-13 -20Z M8 -15 L13 -16 L10 -10Z M3 -26 L8 -27 L6 -22Z',
              '#b39d5f',
              '#696044',
              0.6
            )
        );
      }
      art += p(
        'M304 382 L317 373 L324 380 L321 393 L306 396Z M38 518 L47 509 L60 516 L59 527 L43 530Z M230 517 L239 512 L247 519 L239 525Z',
        '#b2b09a',
        '#68675c',
        1.2
      );
      art += l('M304 382 L315 385 L321 393 M43 518 L52 520 L59 516', '#e4dfc4', 0.9);

      // A quiet parasite highlight and sparse dust accompany the moving temple vines.
      art += on(
        l(
          'M52 469 Q46 450 54 430 M57 345 Q49 331 59 310 M151 459 Q167 442 185 450 M121 499 Q135 507 147 499',
          '#c95050',
          1.8
        ),
        '0;0;.5;.12;0;0',
        '0;.24;.35;.48;.61;1',
        16
      );
      for (const [x, y] of [
        [118, 315],
        [235, 365],
        [276, 194],
      ]) {
        art += g(
          '',
          circle(x, y, 1.35, '#d5cdb4', 'none', 0) + move('0 0;2 -11;4 -20;0 0', '0;.42;.82;1', 16),
          `opacity=".34"`
        );
      }
      return `<g data-scene="stranglewood" data-reference="stranglewood-temple-and-strangled-animal">${art}</g>`;
    };
  })();

  /* Original stained-glass study, refined second pass.
   * Visually checked against the current OSRS Wiki detailed item renders:
   * https://oldschool.runescape.wiki/w/File:Ultor_ring_detail.png
   * https://oldschool.runescape.wiki/w/File:Ultor_vestige_detail.png
   * Silver band, crimson Strangler fragment, ochre crossbar and grey block.
   * The finished ring is crafted from the vestige; it is not a direct boss drop.
   * Pass 2: reopened both full item renders and compared the initial enlarged
   * window and 0–24s motion sheet. Darkened the broad outer silver plane, kept
   * the inner bevel lighter so the polygonal hole reads as an opening rather
   * than a flat grey hoop, and enlarged the separate thorned vestige. The ring,
   * crossbar and block remain fixed throughout the reflection cycle. */
  scenes['ultor-ring'] = (h, c, id) => {
    const { p, l, g, ellipse, move, on } = h;
    const ink = '#26232c';
    const band =
      'M217 249 L290 249 L359 283 L450 309 L469 443 L457 520 L413 648 L253 718 L143 718 L61 676 L31 600 L0 484 L23 354 L92 249 L151 207 L217 226Z M106 493 L115 451 L149 417 L217 395 L294 392 L329 411 L350 448 L341 482 L294 526 L231 557 L179 572 L129 549Z';
    const block = 'M289 37 L396 0 L486 144 L462 233 L404 266 L330 226Z';
    const red =
      'M188 125 L271 125 L272 204 L218 327 L217 395 L191 397 L149 417 L115 451 L106 493 L129 549 L179 572 L143 605 L143 718 L61 676 L31 600 L0 484 L1 459 L23 354 L92 249 L151 207 L148 177Z';
    const vestige =
      'M210 8 L132 39 L188 39 L174 87 L90 119 L36 211 L6 242 L23 298 L76 291 L91 317 L107 286 L205 215 L126 220 L154 158 L238 129Z';

    let art = '';
    // A quiet botanical border connects the relic to the Strangler without hiding it.
    art += p(
      'M37 508 L44 427 L38 386 L49 327 L47 279 L61 241 L64 193 L75 174 L71 221 L63 265 L67 301 L56 351 L60 392 L52 436 L48 511Z',
      '#4d303b',
      '#29252b',
      2
    );
    art += p(
      'M50 431 L72 401 L56 408 L65 364 L43 392Z M50 329 L29 307 L43 314 L45 280 L51 305Z M62 245 L87 222 L70 229 L72 205 L60 224Z',
      '#733c45',
      ink,
      1.4
    );
    art += l('M44 496 L51 433 L46 387 L55 328 L53 282 L66 242 L69 199', '#936268', 1.2);
    art += p(
      'M320 510 L311 466 L316 419 L304 381 L310 333 L299 293 L303 244 L290 215 L288 180 L279 158 L294 177 L299 208 L312 240 L308 287 L320 332 L314 378 L325 418 L320 466 L331 511Z',
      '#49323a',
      '#29252b',
      2
    );
    art += p(
      'M308 337 L289 321 L303 324 L297 297 L313 318Z M315 418 L336 390 L324 397 L321 373 L309 397Z M296 209 L275 197 L288 196 L287 177 L298 197Z',
      '#713e48',
      ink,
      1.4
    );
    art += l(
      'M325 499 L315 465 L321 419 L309 381 L315 333 L303 291 L308 244 L295 213 L291 180',
      '#86545f',
      1.2
    );
    art += l(
      'M65 182 L91 153 L114 142 M290 172 L271 147 L247 138 M58 465 L76 455 M303 455 L286 446',
      c[4],
      1.2,
      'opacity=".42"'
    );

    // Inset architectural fragments leave the two relics a distinct, readable silhouette.
    art += p('M67 402 L83 387 L98 390 L106 410 L94 442 L68 453Z', '#49434a', '#877b78', 1.5);
    art += p('M67 402 L83 387 L83 424 L68 453Z', '#62555a', 'none');
    art += l('M73 408 L87 405 M71 429 L90 423', '#a18a85', 1);
    art += p('M270 394 L286 381 L300 400 L295 449 L271 439Z', '#49434a', '#877b78', 1.5);
    art += p('M286 381 L300 400 L295 449 L286 432Z', '#352f39', 'none');

    let ring = '';
    // The hole is genuine negative space; polygon facets follow the detailed model.
    ring += p(band, '#888995', ink, 5, 'fill-rule="evenodd"');
    ring += p(
      'M217 249 L290 249 L359 283 L450 309 L414 340 L327 312 L264 288 L217 296Z',
      '#858593',
      'none'
    );
    ring += p(
      'M217 296 L264 288 L327 312 L414 340 L434 433 L405 421 L376 367 L294 344 L217 341Z',
      '#a2a0ad',
      ink,
      2.5
    );
    ring += p(
      'M217 341 L294 344 L376 367 L405 421 L391 476 L350 448 L329 411 L294 392 L217 395Z',
      '#8b8c99',
      ink,
      2.5
    );
    ring += p(
      'M450 309 L469 443 L457 520 L413 648 L378 598 L409 501 L434 433 L414 340Z',
      '#6d7280',
      ink,
      2.5
    );
    ring += p(
      'M350 448 L341 482 L294 526 L231 557 L179 572 L143 605 L253 603 L337 563 L391 476Z',
      '#a7a6b2',
      ink,
      2.5
    );
    ring += p(
      'M143 605 L253 603 L337 563 L378 598 L413 648 L253 718 L143 718Z',
      '#92939e',
      ink,
      2.5
    );
    ring += p('M143 605 L253 603 L253 718 L143 718Z', '#999aa5', 'none');
    ring += p('M337 563 L378 598 L413 648 L253 718 L253 674 L347 626Z', '#80838f', 'none');
    ring += l(
      'M233 271 L288 270 L350 298 M444 373 L451 438 L443 501 M163 699 L251 699 L315 673',
      '#bbb9c3',
      2.4
    );
    ring += l(
      'M223 386 L292 383 L334 404 L361 447 L350 485 M298 530 L234 563 L182 581',
      '#bab8c2',
      2.2
    );
    ring += l('M217 341 L243 340 M401 516 L377 576 M277 624 L316 607', '#6c6d7a', 2.5);

    // Small grey back tab and the ochre bar are behind the crimson fragment.
    ring += p('M19 233 L74 233 L89 262 L52 298Z', '#79848a', ink, 4);
    ring += p('M19 233 L74 233 L62 249 L41 264Z', '#acb4b3', 'none');
    ring += p(
      'M272 149 L305 123 L343 181 L281 223 L231 247 L174 263 L151 240 L190 212Z',
      '#a38e62',
      ink,
      4
    );
    ring += p('M272 149 L305 123 L315 147 L232 204 L174 239 L151 240 L190 212Z', '#c2ae7d', 'none');
    ring += p('M41 180 L125 210 L97 237Z', '#884039', ink, 3);
    ring += p('M41 180 L107 207 L125 210 L97 221Z', '#ae5448', 'none');
    ring += p(red, '#8c403e', ink, 4.5);
    ring += p(
      'M188 125 L271 125 L272 204 L218 327 L191 397 L149 417 L115 451 L106 493 L54 473 L23 354 L92 249 L151 207 L148 177Z',
      '#9d4944',
      ink,
      2.5
    );
    ring += p(
      'M188 125 L271 125 L247 148 L195 147 L170 180 L162 218 L108 272 L78 343 L54 473 L23 354 L92 249 L151 207 L148 177Z',
      '#b2574b',
      'none'
    );
    ring += p(
      'M247 148 L271 125 L272 204 L218 327 L191 397 L149 417 L168 352 L196 276 L229 216Z',
      '#783735',
      ink,
      2.5
    );
    ring += p(
      'M23 354 L54 473 L106 493 L129 549 L179 572 L143 605 L143 718 L61 676 L31 600 L0 484 L1 459Z',
      '#9d6553',
      ink,
      2.5
    );
    ring += p('M0 484 L54 473 L106 493 L129 549 L82 558 L61 676 L31 600Z', '#8a4f48', 'none');
    ring += p('M82 558 L129 549 L179 572 L143 605 L143 718 L61 676Z', '#b07a61', 'none');
    ring += l('M184 163 L170 205 L115 262 M65 344 L48 411 M193 332 L174 384', '#c27260', 2.8);

    // This chunky head is deliberately grey, rather than a jewel or golden setting.
    ring += p(block, '#7c8b8f', ink, 4.5);
    ring += p('M289 37 L396 0 L486 144 L373 185Z', '#9ca8a7', ink, 2.5);
    ring += p('M289 37 L373 185 L404 266 L330 226Z', '#74858a', ink, 2.5);
    ring += p('M373 185 L486 144 L462 233 L404 266Z', '#899698', ink, 2.5);
    ring += p('M396 0 L486 144 L468 153 L385 19Z', '#8a9799', 'none');
    ring += l('M300 48 L365 164 M390 203 L464 174', '#bac2bb', 3.2);
    ring += `<defs><clipPath id="${id}-metal"><path d="${band}" fill-rule="evenodd" clip-rule="evenodd"/><path d="${block}"/></clipPath></defs>`;
    ring += `<g clip-path="url(#${id}-metal)" opacity=".55" data-art-effect="ultor-silver-reflection"><g>${move('-800 0;-800 0;620 0;620 0', '0;.44;.61;1', 16)}${p('M-105 -60 L-73 -60 L256 790 L223 790Z', '#e2e0d1', 'none')}${p('M-61 -60 L-53 -60 L276 790 L268 790Z', '#c6c5bb', 'none')}</g></g>`;
    art += g('translate(72 99) scale(.45)', ring, 'data-relic="ultor-ring"');

    // The fragment rests on a shallow display ledge below the completed ring.
    art += ellipse(184, 486, 75, 11, '#25232d', 'none', 0, 'opacity=".55"');
    art += p('M78 490 L115 469 L257 469 L286 488 L267 505 L101 505Z', '#817774', '#29232c', 2);
    art += p(
      'M78 490 L101 505 L267 505 L286 488 L282 513 L264 529 L105 529 L80 514Z',
      '#514950',
      '#29232c',
      2
    );
    art += p('M101 505 L267 505 L264 529 L105 529Z', '#665c61', 'none');
    art += p('M115 469 L257 469 L267 478 L111 478 L88 490 L78 490Z', '#a39688', 'none');
    art += l('M111 512 H255 M109 520 H253 M93 493 L116 482 M257 482 L274 489', '#a09285', 1.2);
    art += l('M154 508 V526 M219 508 V526', '#453c44', 1.4);

    let fragment = p(vestige, '#8e342e', ink, 6);
    fragment += p(
      'M210 8 L132 39 L188 39 L174 87 L90 119 L36 211 L6 242 L23 298 L76 291 L91 317 L107 286 L205 215 L126 220 L154 158 L238 129Z',
      '#a83e33',
      'none'
    );
    fragment += p('M210 8 L238 129 L189 111 L174 87 L188 39 L132 39Z', '#bd5140', ink, 2.8);
    fragment += p('M90 119 L189 111 L238 129 L154 158 L126 220 L36 211Z', '#a74536', ink, 2.8);
    fragment += p(
      'M36 211 L126 220 L205 215 L107 286 L91 317 L76 291 L23 298 L6 242Z',
      '#7c302d',
      ink,
      2.8
    );
    fragment += p('M90 119 L109 142 L63 217 L36 211Z', '#c65b43', 'none');
    fragment += l('M174 87 L154 115 M45 234 L98 247 L174 225', '#c2694d', 3.5);
    fragment += on(
      p(vestige, '#d37656', 'none'),
      '0;0;.2;0;0',
      '0;.69;.74;.8;1',
      16,
      'data-art-effect="ultor-vestige-pulse"'
    );
    art += g('translate(226 437) rotate(76) scale(.30)', fragment, 'data-relic="ultor-vestige"');

    // Small carved chevrons, rather than lettering, keep the relic display quiet.
    art += l('M168 516 L181 522 L194 516 M173 514 L181 518 L189 514', '#c0a890', 1.2);
    art += p(
      'M76 534 L87 528 L100 534 L93 541 L82 541Z M261 534 L274 528 L287 534 L280 541 L268 541Z',
      '#6a5a61',
      '#9e8584',
      1
    );
    return art;
  };

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
  scenes['axe-head'] = function axeHeadScene(h, c, id) {
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
    art += p(
      'M117 491 L146 494 L145 504 H120Z M219 491 L249 489 L247 503 H222Z',
      '#645055',
      'none'
    );
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

  const h = helpers;
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
      const key = sceneKeys[scene];
      const draw = scenes[key];
      if (!draw) throw new Error(`Missing collection scene: ${key}`);
      const id = `${config.id}-${key}-${++instance}`;
      return `${panes}${background(c, scene)}<g data-art-scene="${key}">${draw(h, c, id)}</g>`;
    },
  });
  return {
    art,
    sceneColors,
    shrineMarkup(pieces, index = 0, celebrate = false) {
      const colors = sceneColors(index);
      return Array.from({ length: 4 }, (_, i) => {
        const charge = Math.max(0, Math.min(25, pieces - i * 25));
        const awake = charge === 25;
        const uid = config.id + '-shrine-' + i;
        const outer = 'M-17 64 V-9 Q-17 -27 0 -38 Q17 -27 17 -9 V64Z';
        const inner = 'M-11 59 V-8 Q-11 -22 0 -30 Q11 -22 11 -8 V59Z';
        const glass =
          h.p(inner, colors[1], colors[4], 1.1) +
          h.p('M0 -30 V59 H-11 V-8 Q-11 -22 0 -30Z', colors[2], 'none') +
          h.l('M-10 5 H10 M-10 23 H10 M-10 41 H10 M0 -25 V58', colors[4], 0.8);
        const height = (charge / 25) * 94;
        const svg =
          '<defs><clipPath id="' +
          uid +
          '"><rect x="-20" y="' +
          (64 - height) +
          '" width="40" height="' +
          height +
          '"/></clipPath></defs>' +
          h.p(outer, '#625e54', '#302d2b', 2) +
          h.p(inner, '#353b39', '#9d9279', 1) +
          '<g class="totem-light" clip-path="url(#' +
          uid +
          ')">' +
          glass +
          '</g>' +
          inlay(0, 69, awake);
        const charging = !awake && (charge > 0 || i === Math.floor(pieces / 25));
        const fresh = celebrate && awake && (pieces === 100 || pieces === (i + 1) * 25);
        const label =
          config.milestoneNoun + ' ' + (i + 1) + ': ' + charge + ' of 25 ' + config.countNoun + 's';
        return (
          '<div class="shrine-totem ' +
          (awake ? 'awake' : charging ? 'charging' : '') +
          (fresh ? ' just-awakened' : '') +
          '" style="--shrine-light:' +
          colors[3] +
          '"><svg viewBox="-32 -44 64 120" role="img" aria-label="' +
          esc(label) +
          '">' +
          svg +
          '</svg><small>' +
          (awake ? 'LIT' : charge + ' / 25') +
          '</small></div>'
        );
      }).join('');
    },
  };
};
