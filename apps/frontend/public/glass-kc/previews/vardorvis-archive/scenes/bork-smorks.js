/* global GLASS_NEW_SCENES */
/* Original stained-glass interpretation, artwork pass two.
 * Current OSRS references inspected directly, not the older RS2/RS3 Bork:
 * https://oldschool.runescape.wiki/w/File:Bork.png
 * https://oldschool.runescape.wiki/w/File:The_Smorks.png
 * https://oldschool.runescape.wiki/images/Bork_and_the_Smorks_-_flinching_setup.mp4
 * https://oldschool.runescape.wiki/w/The_Fractured_Archive/Strategies#Bork_and_the_Smorks
 * The drum belongs to Bork; the two visible goblins operate one cannon cart.
 * Pass two reopens the current Bork and Smorks model renders: broad sloping
 * trapezius/pectorals, heavy rounded upper arms, dimensional hands and facial
 * tusks replace the thin initial anatomy. The drum rim and angular Bandos
 * glyph now follow the model. Cart placement and its anchored recoil stay fixed.
 * Drum-action feedback: the encounter clip shows an outward pale stone-dust
 * shockwave after a definite wind-up/contact. Two heavy strikes now throw
 * faceted tan dust and small stone flecks across the window, then settle.
 * The separate feedback refinement accelerates the first outward dust fan
 * and increases its spread, making both impacts readable at window size.
 */
GLASS_NEW_SCENES['bork-smorks'] = function drawBorkAndSmorks(h, c, id) {
  const { p, l, g, ellipse, circle, move, turn, on } = h;
  const ink = '#282a25';
  const skin = '#68745b';
  const skinLight = '#87906e';
  const skinDark = '#414e40';
  const iron = '#55515c';
  const ironLight = '#837b82';
  const ivory = '#d0c29a';
  const wood = '#826035';
  const olive = '#8f963d';
  const seconds = 24;
  const strikes = [8.64, 10.56];
  const at = (times) => times.map((time) => (time / seconds).toFixed(5)).join(';');
  const handKeys = '0;.24;.33;.35;.36;.39;.42;.435;.44;.49;1';
  function dustBurst(hit, front) {
    // Reset only after fading. The face stays clear, and the heavier clouds
    // remain behind the fixed cart and its two visible goblins.
    const keys = at([0, hit - 0.03, hit, hit + 0.22, hit + 0.9, hit + 1.8, hit + 2.8, seconds]);
    const opacity = front ? '0;0;.2;.62;.38;.08;0;0' : '0;0;.35;.78;.48;.12;0;0';
    const cloud =
      p(
        'M-23 3 L-18 -8 L-7 -10 L0 -17 L14 -12 L18 -3 L29 2 L21 10 L5 8 L-9 13 L-21 10Z',
        '#c4b693',
        'none'
      ) +
      p(
        'M-18 1 L-7 -10 L0 -17 L7 -8 L21 2 L8 4 L-1 0 L-9 6Z',
        '#ded0aa',
        'none',
        1,
        'opacity=".48"'
      );
    const clouds = front
      ? [
          [103, 350, -70, -10, 1],
          [158, 351, 135, -12, 1.15],
          [117, 408, -72, 15, 0.9],
          [161, 411, 131, 18, 1],
          [124, 474, -81, 15, 1.2],
          [161, 479, 131, 15, 1.1],
        ]
      : [
          [105, 340, -70, -40, 1.3],
          [154, 340, 132, -58, 1.45],
          [108, 367, -69, 20, 1.4],
          [156, 364, 130, 9, 1.5],
          [125, 449, -80, 35, 1.5],
          [156, 458, 139, 30, 1.6],
        ];
    let result = clouds
      .map(([x, y, dx, dy, size]) => {
        const shift = `0 0;0 0;0 0;${dx * 0.65} ${dy * 0.65};${dx} ${dy};${dx * 1.08} ${dy * 1.08};${dx * 1.14} ${dy * 1.14};0 0`;
        const scale = `.15;.15;.25;${size * 0.9};${size * 1.15};${size * 1.22};${size * 1.3};.15`;
        return g(
          `translate(${x} ${y})`,
          `<g opacity="0">${h.a('opacity', opacity, keys, seconds)}${move(shift, keys, seconds)}<g><animateTransform attributeName="transform" type="scale" values="${scale}" keyTimes="${keys}" dur="${seconds}s" repeatCount="indefinite"/>${cloud}</g></g>`
        );
      })
      .join('');
    const flecks = front ? 20 : 24;
    for (let i = 0; i < flecks; i++) {
      const side = i % 2 ? 1 : -1;
      const x = 126 + (i % 4) * 7;
      const y = front ? 345 + (i % 4) * 38 : 343 + (i % 3) * 18;
      const dx = side * (70 + (i % 5) * 20);
      const lift = -(22 + (i % 4) * 15);
      const end = front ? 70 : 60;
      const shift = `0 0;0 0;0 0;${dx * 0.65} ${lift * 0.9};${dx} ${lift * 0.7};${dx * 1.13} ${end * 0.5};${dx * 1.18} ${end};0 0`;
      const size = front ? 2 + (i % 3) : 2 + (i % 4) * 0.7;
      const shard = p(
        `M${-size} ${-size * 0.5} L${size * 0.5} ${-size} L${size} ${size * 0.45} L0 ${size} L${-size * 0.8} ${size * 0.4}Z`,
        ['#d0bd95', '#a89573', '#dacfaf'][i % 3],
        'none'
      );
      result += g(
        `translate(${x} ${y})`,
        `<g opacity="0">${h.a('opacity', '0;0;.4;.9;.75;.3;0;0', keys, seconds)}${move(shift, keys, seconds)}${shard}</g>`
      );
    }
    return `<g data-art-effect="bork-drum-${front ? 'front' : 'back'}-dust" data-impact="${hit}">${result}</g>`;
  }
  let out = '';

  // The Archive's old green stone surrounds a worn, open fighting floor.
  out += p('M37 491 L105 453 L239 447 L327 492 V545 H34Z', '#656653', '#9b9a78', 1.5);
  out += p('M37 491 L105 453 L143 475 L111 514 L34 535Z', '#7f7d60', ink, 1.1);
  out += p('M143 475 L239 447 L266 480 L216 519 L111 514Z', '#555f50', ink, 1.1);
  out += p('M266 480 L327 492 L326 540 L216 519Z', '#73765c', ink, 1.1);
  out += l('M40 518 L326 518 M98 464 L79 543 M184 465 L177 543 M274 473 L292 543', '#a6a283', 1.1);
  out += p(
    'M40 456 V245 L52 228 L67 240 V457Z M291 455 V236 L305 223 L320 240 V471Z',
    '#454c40',
    '#8b9474',
    1.5
  );
  out += p('M40 247 H67 V264 H40Z M291 243 H320 V260 H291Z', '#929376', ink, 1.2);
  out += l('M50 275 V425 M303 275 V433', '#68765a', 3);
  out += p(
    'M66 191 L84 168 L104 177 L95 206 L76 216Z M255 182 L270 161 L289 174 L285 201 L265 211Z',
    c[2],
    c[4],
    1.1,
    'opacity=".5"'
  );
  out += l('M84 168 L76 216 M270 161 L265 211', c[4], 1.3, 'opacity=".65"');

  // Drum contact sends low stone dust outwards through the fighting floor.
  for (const hit of strikes) {
    const keys = at([0, hit - 0.01, hit, hit + 0.2, hit + 0.9, hit + 1.6, seconds]);
    const ring =
      ellipse(0, 0, 38, 10, 'none', '#d3c39a', 2.6) + ellipse(0, 0, 28, 7, 'none', '#a99e79', 1.6);
    out += g(
      'translate(135 482)',
      `<g opacity="0" data-art-effect="bork-drum-ground-wave">${h.a('opacity', '0;0;.75;.65;.3;0;0', keys, seconds)}<animateTransform attributeName="transform" type="scale" values=".15;.15;.3;1.25;3.6;4.8;.15" keyTimes="${keys}" dur="${seconds}s" repeatCount="indefinite"/>${ring}</g>`
    );
    out += dustBurst(hit, false);
  }

  // Legs: the torso is much larger than the short, heavily wrapped lower legs.
  out += p('M93 401 L133 403 L132 451 L123 483 L92 483 L91 459Z', skin, ink, 2);
  out += p('M139 403 L177 397 L187 449 L183 488 L154 491 L144 453Z', skinDark, ink, 2);
  out += p('M95 410 L111 417 L106 454 L93 463Z', skinLight, 'none');
  out += p('M153 409 L176 403 L183 447 L168 459Z', skin, 'none');
  out += p('M89 450 L106 438 L130 450 L127 477 L91 480Z', '#725146', ink, 1.8);
  out += p('M153 455 L173 441 L189 454 L185 486 L156 489Z', '#664944', ink, 1.8);
  out += p('M96 441 L112 432 L125 443 L116 458 L100 458Z', iron, ironLight, 1.2);
  out += p('M160 448 L174 438 L186 450 L176 464 L161 463Z', iron, ironLight, 1.2);
  out += p('M92 479 L123 478 L127 497 L117 509 L76 509 L73 501Z', skinDark, ink, 2);
  out += p('M155 486 L184 483 L194 505 L190 514 L148 514 L145 505Z', skin, ink, 2);
  out += p(
    'M82 493 L115 489 L123 498 L114 503 L75 503Z M153 500 L181 492 L188 503 L182 508 L149 508Z',
    skinLight,
    'none'
  );
  out += p(
    'M91 479 L124 477 L124 488 L85 492Z M154 483 L184 480 L188 492 L156 497Z',
    '#9a7950',
    ink,
    1.2
  );

  // The head sits in sloping trapezius muscles, not on a narrow upright neck.
  out += p(
    'M103 202 L118 193 L154 186 L179 200 L205 218 Q231 238 231 266 L211 308 L191 351 L179 400 L99 411 L77 357 L54 310 L48 266 Q45 236 64 222Z',
    skin,
    ink,
    2.4
  );
  out += p(
    'M64 222 L103 202 L119 211 L132 240 L113 271 L70 278 L48 266 Q47 239 64 222Z',
    '#7a8668',
    ink,
    1.1
  );
  out += p(
    'M154 186 L179 200 L205 218 L220 241 L187 252 L151 238 L132 240 L119 211Z',
    '#758263',
    ink,
    1.1
  );
  out += p('M71 249 L108 230 L132 240 L143 275 L109 294 L72 277Z', '#8a9272', ink, 1.1);
  out += p('M132 240 L151 238 L187 252 L204 280 L174 299 L143 275Z', '#69775c', ink, 1.1);
  out += p('M204 280 L219 268 L211 308 L191 351 L178 375 L174 299Z', skinDark, ink, 1.2);
  out += p(
    'M72 277 L109 294 L143 275 L174 299 L160 352 L117 366 L77 357 L54 310Z',
    '#5b6b52',
    ink,
    1.2
  );
  out += l(
    'M113 219 L126 233 M145 237 L157 218 M74 277 L102 283 M177 290 L195 280',
    '#46563f',
    1.1
  );
  // Spiked shoulder bands follow the slope of the shoulder mass.
  out += p(
    'M66 224 L76 211 L105 209 L107 220 L81 235Z M185 216 L213 224 L222 237 L202 243 L182 229Z',
    iron,
    ink,
    1.6
  );
  out += p(
    'M75 217 L72 193 L87 212 L89 190 L99 211 L107 204 L105 221 M192 222 L201 198 L205 225 L215 205 L218 236Z',
    ironLight,
    iron,
    1.2
  );
  // Long pointed ears, broad angular brow and deep cheek planes.
  out += p(
    'M108 174 L83 153 L93 183 L111 195Z M152 170 L184 150 L166 186 L151 196Z',
    skinDark,
    ink,
    1.8
  );
  out += p(
    'M108 153 L126 140 L148 149 L160 171 L159 198 L142 216 L119 212 L101 193 L99 173Z',
    skin,
    ink,
    2
  );
  out += p('M108 153 L126 140 L132 169 L118 178 L99 173Z', '#7c8868', ink, 1.1);
  out += p('M132 169 L148 149 L160 171 L146 185 L121 188 L118 178Z', '#53644d', ink, 1.1);
  out += p(
    'M101 177 L116 171 L129 178 L119 187 L105 186Z M134 177 L149 169 L158 176 L150 186 L137 185Z',
    '#344232',
    'none'
  );
  out += p(
    'M107 179 L119 177 L116 185 L108 184Z M139 178 L151 174 L146 184 L140 184Z',
    '#dfbf49',
    '#63673b',
    0.7
  );
  out += p(
    'M107 169 L114 155 L121 176Z M134 171 L144 151 L145 166Z M102 186 L117 190 L111 194Z M146 187 L158 183 L153 195Z',
    '#a59b60',
    'none'
  );
  out += p('M120 182 L136 180 L146 194 L143 205 L123 209 L111 199Z', '#718368', ink, 1.3);
  out += p('M121 183 L125 194 L136 193 L136 180Z', '#4a5c46', 'none');
  out += p('M120 194 L135 192 L140 196 L134 199 L122 199Z', '#334232', 'none');
  out += p('M114 201 L143 200 L145 205 L126 211 L116 208Z', '#403e34', ink, 0.8);
  // Facial tusks grow upward beside the muzzle, separate from the drum tusks.
  out += p(
    'M109 178 Q107 189 114 204 L122 211 L124 204 L117 190 L113 178Z',
    '#c3b88f',
    '#797650',
    1
  );
  out += p('M112 180 L117 194 L121 206 L118 204 L112 192Z', '#dbd0a6', 'none');
  out += p(
    'M141 176 L139 189 L134 203 L137 211 L146 207 L148 195 L145 181Z',
    '#c3b88f',
    '#797650',
    1
  );
  out += p('M141 179 L142 194 L138 205 L144 203 L146 192Z', '#d9cca3', 'none');
  out += p(
    'M119 213 L127 216 L135 222 L144 213 L150 209 L145 225 L132 237 L125 229Z',
    '#344632',
    ink,
    1
  );
  // Broad broken ochre stripes follow the rounded outer shoulders.
  out += p(
    'M56 236 L65 227 L71 249 L67 264 L61 255Z M205 223 L216 232 L225 249 L216 248 L208 238Z M214 256 L229 257 L226 267 L212 276Z',
    '#a59b60',
    'none'
  );

  // Waist cloth and belt remain visible beneath the drum.
  out += p(
    'M93 389 L177 384 L181 418 L150 416 L139 460 L113 437 L102 419 L92 423Z',
    '#8d653c',
    ink,
    1.7
  );
  out += p('M114 401 L152 402 L142 450 L127 431 L118 430Z', '#a45135', ink, 1.1);
  out += p('M93 387 L176 383 L178 397 L97 404Z', '#4c3b31', ink, 1.4);
  out += p('M128 391 L146 389 L149 404 L132 408 L125 402Z', iron, ironLight, 1.2);

  // Bork's orange belly-drum, seen three-quarter, with a pale Bandos glyph.
  out += p(
    'M84 284 L113 264 L148 269 L173 290 L183 339 L172 384 L144 405 L108 399 L80 373 L69 330Z',
    '#875025',
    ink,
    2.4
  );
  out += p('M113 264 L148 269 L173 290 L150 296 L126 280 L84 298 L84 284Z', '#b06b2b', ink, 1.1);
  out += p(
    'M83 296 L126 280 L150 296 L164 331 L159 368 L137 389 L108 385 L84 362 L76 329Z',
    '#bd6a2b',
    ink,
    1.4
  );
  out += p('M126 280 L150 296 L164 331 L159 368 L137 389 L129 351Z', '#d08a30', 'none');
  out += p('M83 296 L108 307 L113 348 L108 385 L84 362 L76 329Z', '#a95726', 'none');
  out += p(
    'M124 301 L138 317 L150 313 L150 332 L139 329 L124 346 L124 355 L140 353 L139 364 L124 365 L123 384 L115 392 L114 365 L102 363 L102 353 L115 356 L115 346 L99 336 L109 328 L118 334 L128 323 L122 316 L111 327 L100 319Z',
    '#cdb85d',
    '#a18d4c',
    0.8
  );
  out += p(
    'M79 292 L85 283 L92 285 L88 294Z M105 271 L113 267 L118 273 L111 278Z M150 274 L158 278 L158 286 L151 283Z M174 307 L180 311 L180 320 L174 317Z M176 360 L181 356 L180 369 L174 373Z M142 397 L149 394 L148 404 L140 407Z M86 378 L91 383 L87 389 L81 383Z',
    '#85817b',
    ink,
    0.8
  );
  out += l('M82 308 L77 331 L84 351 M168 310 L174 337 L167 367', '#d5984d', 1.4);
  out += l(
    'M88 294 Q121 266 151 285 M82 366 Q105 399 138 398 M158 298 Q184 336 164 380',
    '#d48c3b',
    2.2
  );

  // Ivory tusks rise beside, rather than through, the drum face.
  out += p(
    'M83 365 L70 347 L67 321 L71 292 L81 254 L85 238 L87 277 L83 308 L87 335 L99 356Z',
    ivory,
    '#756e51',
    1.6
  );
  out += p('M83 365 L70 347 L67 321 L71 292 L81 254 L76 302 L76 333 L89 356Z', '#a89f7c', 'none');
  out += p(
    'M164 363 L178 351 L184 326 L183 296 L174 260 L170 239 L169 280 L174 310 L169 336 L154 355Z',
    '#d9cba0',
    '#756e51',
    1.6
  );
  out += p(
    'M170 239 L174 260 L183 296 L184 326 L178 351 L164 363 L167 348 L177 325 L177 298Z',
    '#b7ab83',
    'none'
  );

  // Heavy rounded deltoids/biceps remain anchored; only the cuff and hand turn.
  out += p(
    'M65 234 Q84 236 87 257 L82 279 L72 308 L50 315 L38 302 L36 280 L40 253 Q45 237 65 234Z',
    skin,
    ink,
    2
  );
  out += p('M44 251 L61 241 L72 255 L62 280 L41 292 L36 280Z', skinLight, ink, 1);
  out += p('M62 280 L82 268 L78 288 L69 306 L50 315 L41 304Z', '#53664d', ink, 1);
  let leftHand = p(
    'M47 300 L60 292 L76 297 L84 311 L98 318 L104 329 L99 337 L91 332 L90 340 L81 342 L72 332 L59 327 L48 325 L40 315Z',
    skin,
    ink,
    1.8
  );
  leftHand += p(
    'M58 298 L76 297 L84 311 L98 318 L98 325 L84 320 L75 316 L65 319 L52 313Z',
    '#82906b',
    'none'
  );
  leftHand += p(
    'M72 324 L81 326 L89 338 L81 342 L75 334 L68 332Z M91 324 L98 327 L99 337 L91 332Z',
    '#4c5e47',
    'none'
  );
  leftHand += p('M45 296 L58 292 L67 300 L63 319 L51 326 L39 317 L37 306Z', iron, ink, 1.5);
  leftHand += p(
    'M40 299 L36 289 L48 298 M51 294 L54 284 L59 298 M39 312 L34 319 L47 321',
    ironLight,
    iron,
    1
  );
  leftHand += l('M84 320 L87 329 M77 325 L82 332 M92 324 L97 329', skinDark, 1.1);
  out += `<g data-art-effect="bork-left-drum-hand">${turn('0 53 305;0 53 305;-32 53 305;-32 53 305;0 53 305;0 53 305;-27 53 305;-27 53 305;0 53 305;0 53 305;0 53 305', handKeys, seconds)}${leftHand}</g>`;
  out += p(
    'M210 237 Q232 242 237 268 L240 288 L232 313 L213 327 L194 313 L191 287 L188 262Z',
    skin,
    ink,
    2
  );
  out += p('M210 243 L225 251 L233 274 L217 292 L197 280 L193 259Z', '#7c8868', ink, 1);
  out += p('M217 292 L233 274 L240 288 L232 313 L213 327 L200 313Z', skinDark, ink, 1);
  let rightHand = p(
    'M215 303 L230 305 L232 320 L220 337 L208 344 L195 354 L183 355 L178 348 L183 339 L174 344 L167 338 L170 328 L185 314 L198 309Z',
    skin,
    ink,
    1.9
  );
  rightHand += p(
    'M198 309 L215 303 L230 305 L221 318 L208 323 L197 330 L184 337 L177 334 L185 321Z',
    '#82906b',
    'none'
  );
  rightHand += p(
    'M185 337 L197 330 L208 323 L206 337 L194 350 L183 355 L178 348Z',
    '#4c5e47',
    'none'
  );
  rightHand += p('M218 300 L234 300 L241 309 L236 327 L223 332 L216 319Z', iron, ink, 1.5);
  rightHand += p(
    'M226 301 L230 289 L235 304 L246 299 L241 315 L246 324 L236 324Z',
    ironLight,
    iron,
    1.1
  );
  rightHand += l('M179 333 L186 329 M185 343 L193 337 M193 346 L201 338', skinDark, 1.2);
  out += `<g data-art-effect="bork-right-drum-hand">${turn('0 224 313;0 224 313;29 224 313;29 224 313;0 224 313;0 224 313;25 224 313;25 224 313;0 224 313;0 224 313;0 224 313', handKeys, seconds)}${rightHand}</g>`;

  // Cart functions use a local 0..165 × 0..240 space, visibly smaller than Bork.
  let cart = '';
  cart += p('M15 176 L144 176 L157 193 L141 208 L25 208 L7 193Z', '#5e5960', ink, 2);
  cart += p('M20 182 L141 181 L146 193 L137 201 L25 201 L15 192Z', '#757078', 'none');
  for (const [x, y] of [
    [24, 193],
    [47, 192],
    [74, 192],
    [102, 192],
    [129, 191],
  ]) {
    cart += p(
      `M${x} ${y - 6} L${x + 6} ${y} L${x} ${y + 7} L${x - 6} ${y}Z`,
      '#9a9090',
      '#514b51',
      1
    );
  }
  cart += p('M24 179 L28 78 L57 41 L115 46 L145 89 L140 179Z', wood, ink, 2.2);
  cart += p('M34 90 L57 48 L70 73 L59 178 L29 178Z', '#a07c3d', ink, 1.2);
  cart += p('M66 76 L115 49 L139 91 L133 176 L61 178Z', '#684c2b', ink, 1.3);
  cart += p('M72 88 L120 79 L130 97 L125 154 L72 165Z', '#9a7840', ink, 1.2);
  cart += l('M41 97 L37 159 M51 86 L47 164 M85 91 L81 153 M108 88 L105 151', '#b49451', 1.6);
  // Strong angular green panels are the cart's identifying silhouette.
  cart += p(
    'M25 89 L8 55 L60 70 L81 37 L115 48 L145 82 L157 89 L118 106 L143 124 L133 151 L116 136 L105 162 L86 139 L68 150 L61 128 L42 136 L41 108Z',
    olive,
    '#5d592c',
    1.6
  );
  cart += p(
    'M8 55 L60 70 L46 84 L25 89Z M81 37 L115 48 L102 67 L67 69Z M119 91 L145 82 L157 89 L118 106Z M116 136 L133 151 L126 135 L143 124Z',
    '#b1aa49',
    '#6b632f',
    0.9
  );
  cart += p(
    'M31 66 L57 74 L50 79Z M73 54 L92 65 L100 55Z M79 83 L108 74 L93 97Z M111 110 L134 121 L121 126Z M68 116 L86 139 L77 121Z',
    '#66572c',
    'none'
  );
  cart += p('M61 80 L85 81 L87 99 L62 105Z', '#282b24', '#a28b49', 2);
  // Cannon barrel emerges from the right face; only it recoils.
  let cannon = p('M105 117 L140 108 L155 120 L155 148 L140 158 L104 148Z', '#777579', ink, 1.8);
  cannon += p('M105 117 L140 108 L155 120 L139 126 L104 130Z', '#a09b9b', ink, 1.1);
  cannon += p('M139 126 L155 120 L155 148 L140 158Z', '#55525b', ink, 1.2);
  cannon += p('M141 127 L149 123 L150 143 L142 149Z', '#24262b', '#b2a6a2', 1.4);
  cannon += l('M108 133 L136 130 M109 143 L136 145', '#979096', 1.2);
  cart += `<g data-art-effect="smorks-cannon-recoil">${move('0 0;0 0;-4 1;0 0;0 0', '0;.62;.635;.7;1', seconds)}${cannon}</g>`;
  // Two great tusks curve around the wooden front, strapped with grey metal.
  cart += p(
    'M97 176 L70 180 L43 171 L20 150 L12 123 L11 100 L5 87 L5 133 L14 164 L38 188 L68 199 L104 193Z',
    ivory,
    '#787052',
    1.9
  );
  cart += p(
    'M5 87 L5 133 L14 164 L38 188 L68 199 L104 193 L97 184 L67 188 L39 177 L22 157 L15 131Z',
    '#a9a07d',
    'none'
  );
  cart += p('M69 179 L79 180 L79 196 L70 198 L63 195 L64 185Z', '#77717a', '#48464d', 1.4);
  cart += p('M30 157 L36 160 L45 170 L38 180 L31 174 L26 164Z', '#77717a', '#48464d', 1.3);
  // Wheels use wood centres and thick slate rims, not a tank's tracks.
  for (const [x, y, r] of [
    [29, 217, 22],
    [123, 216, 21],
  ]) {
    cart += circle(x, y, r, '#5e5860', ink, 1.8);
    cart += p(
      `M${x} ${y - r + 5} L${x + r - 5} ${y - 8} L${x + r - 5} ${y + 8} L${x} ${y + r - 5} L${x - r + 5} ${y + 8} L${x - r + 5} ${y - 8}Z`,
      '#92703d',
      '#a19168',
      1.1
    );
    cart += l(
      `M${x} ${y - r + 7} V${y + r - 7} M${x - r + 7} ${y - 6} L${x + r - 7} ${y + 6}`,
      '#694d2d',
      1.1
    );
    cart += p(
      `M${x} ${y - 6} L${x + 6} ${y} L${x} ${y + 6} L${x - 6} ${y}Z`,
      '#aaa09a',
      '#514b51',
      0.9
    );
  }
  // Lobgob, in orange, perches above the roof; the third operator stays inside.
  cart += p(
    'M80 35 L78 16 L88 7 L100 11 L105 25 L99 39 L99 65 L85 72 L75 59Z',
    '#a66825',
    ink,
    1.5
  );
  cart += p('M83 15 L89 5 L98 9 L103 23 L98 32 L86 31 L81 23Z', '#82954b', '#48543a', 1.1);
  cart += p(
    'M83 16 L72 9 L78 25 L87 26Z M100 17 L111 13 L105 26 L99 26Z',
    '#798c43',
    '#48543a',
    0.8
  );
  cart += p('M91 23 L102 24 L107 29 L98 33 L88 29Z', '#91a45a', '#48543a', 0.8);
  cart += circle(99, 23, 1.5, '#d9bd65', 'none');
  cart += p('M84 36 L91 40 L89 55 L98 59 L94 65 L82 60 L78 49Z', '#c8842e', ink, 1);
  cart += l('M94 33 L97 35', '#3c482f', 1);
  // Bonkfist wears yellow and leans across the opposite side of the cart.
  cart += p('M42 88 L52 94 L56 111 L50 135 L41 142 L31 135 L37 116 L29 103Z', '#c5a23b', ink, 1.4);
  cart += p('M39 81 L49 78 L57 86 L54 98 L44 104 L33 97 L31 87Z', '#899a4c', '#48543a', 1.1);
  cart += p('M34 85 L23 76 L27 94 L38 96Z M51 83 L63 78 L57 96 L50 98Z', '#7c8d46', '#48543a', 0.8);
  cart += p('M42 96 L53 94 L58 99 L50 104 L39 102Z', '#9dab5d', '#48543a', 0.8);
  cart += circle(50, 92, 1.5, '#e1c66a', 'none');
  cart += p(
    'M37 108 L31 117 L21 123 L16 119 L28 108 L29 101Z M47 130 L42 146 L31 148 L28 142 L37 137 L39 124Z',
    '#8a9a4d',
    '#48543a',
    1.1
  );
  cart += p('M30 144 L36 144 L33 154 L23 156 L21 152Z', '#806138', ink, 1);
  // One short smoke puff follows the cannon recoil; it fades before reset.
  const smoke = `<g>${move('0 0;0 0;16 -12;22 -22;0 0', '0;.63;.67;.74;1', seconds)}${circle(158, 127, 8, '#c9c1a2', 'none')}${circle(162, 122, 5, '#e0cf9e', 'none')}${circle(155, 117, 6, '#aaa98b', 'none')}</g>`;
  cart += on(
    smoke,
    '0;0;.6;.2;0;0',
    '0;.63;.642;.685;.74;1',
    seconds,
    'data-art-effect="smorks-cannon-smoke"'
  );
  out += g(
    'translate(186 328) scale(.83)',
    cart,
    `id="${id}-cart" data-subject="smorks-cannon-cart"`
  );
  for (const hit of strikes) out += dustBurst(hit, true);
  out += l('M58 525 L91 519 M172 534 L204 529 M295 527 L316 521', '#c4b18a', 1.3, 'opacity=".55"');
  return out;
};
