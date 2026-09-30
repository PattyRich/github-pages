/* Original Gauntlet SVGs, drawn after inspecting the OSRS Wiki's Crystalline
 * and Corrupted Hunllef models, Bow of Faerdhinen and Blade of Saeldor detail
 * images, Corrupted Gauntlet room screenshot and Prifddinas city view.
 * Identity colours stay fixed; only the surrounding glass changes edition.
 */
GLASS_RENDERERS.cg = function createGauntletRenderer(config, { esc, getJournal }) {
  const sceneNumber = (index) => index % config.titles.length;
  // Keep each scene's original palette and crystal colours when changing its slot.
  const paletteScenes = [0, 1, 3, 2];
  const sceneColors = (index) =>
    config.palettes[
      (paletteScenes[sceneNumber(index)] + Math.floor(index / config.titles.length)) %
        config.palettes.length
    ];
  const path = (d, fill, stroke = '#253238', width = 2.4) =>
    `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`;
  const line = (d, stroke = '#b2d5cd', width = 1.6) => path(d, 'none', stroke, width);
  const ellipse = (x, y, rx, ry, fill, stroke = '#253238', width = 2) =>
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;

  function shard(x, y, scale = 1, scene = 0) {
    const left = ['#bb4257', '#d4536c', '#ae4357', '#85c3aa'][paletteScenes[scene]];
    const right = ['#6cbecb', '#842e46', '#652b40', '#467b70'][paletteScenes[scene]];
    return `<g transform="translate(${x} ${y}) scale(${scale})">${path('M0 -25 L15 -10 L12 15 L0 26 L-12 15 L-15 -10Z', left, '#b5a37b', 2)}${path('M0 -25 L15 -10 L12 15 L0 26Z', right, '#253238', 1.2)}${line('M-15 -10 L0 -5 L15 -10 M0 -5 V26', '#d8e8d9', 1)}${path('M0 -20 L-10 -8 L0 -5Z', '#d6ebe3', '#82b2b8', 0.6)}</g>`;
  }

  function crystal(x, y, scale = 1, red = false) {
    const dark = red ? '#772d43' : '#3e777e';
    const mid = red ? '#be4559' : '#79b6c0';
    const light = red ? '#ee837d' : '#c4e3e0';
    return `<g transform="translate(${x} ${y}) scale(${scale})">${path('M-26 6 L-34 -32 L-20 -44 L-8 -20 L0 -65 L15 -43 L15 -8 L31 -31 L36 -14 L23 15 L0 24Z', dark)}${path('M0 -65 L15 -43 L15 -8 L0 24 L-6 -15Z', mid)}${path('M0 -65 L5 -40 L0 24 L-6 -15Z M-34 -32 L-20 -44 L-14 -18 L-18 15Z M31 -31 L28 -9 L15 19 L23 -9Z', light, dark, 1.3)}${line('M-26 6 L0 24 L23 15 M-20 -44 L-8 -20 M15 -43 L3 -29', light, 1)}</g>`;
  }

  function hunllef() {
    // A low three-quarter stance: the corrupted front meets the crystal rear
    // along the shoulder facets rather than a mirrored, face-on centre line.
    return `${ellipse(181, 504, 121, 19, '#29313b', '#69716e', 1.8)}
      ${path('M264 244 L294 247 L313 264 L329 291 L325 324 L315 350 L320 372 L309 379 L301 350 L314 322 L314 295 L303 279 L281 268 L259 266Z', '#285868', '#294f62', 2.7)}
      ${path('M313 264 L329 291 L325 324 L315 350 L308 344 L318 321 L318 292Z', '#529aa9', '#285868', 1.5)}
      ${path('M309 357 L325 372 L331 402 L315 388 L297 385 L299 364Z', '#80ced8', '#325e74', 2)}
      ${path('M309 357 L315 388 L331 402 L322 374Z', '#c1e9e3', '#5c9cae', 1.2)}
      ${path('M208 319 L230 342 L236 377 L222 409 L216 444 L199 456 L190 448 L205 427 L208 399 L205 375 L188 349Z', '#285868')}
      ${path('M220 350 L225 377 L216 409 L211 440 L198 449 L206 419 L211 397 L212 373Z', '#529aa9', '#285868', 1.3)}
      ${path('M195 439 L214 441 L216 453 L199 465 L185 466 L194 455 L177 463 L170 461 L187 447Z', '#71beca', '#294f62', 1.8)}
      ${path('M125 307 L154 323 L155 355 L143 394 L139 425 L118 455 L100 465 L97 453 L115 432 L123 397 L129 366 L116 337Z', '#353440')}
      ${path('M145 330 L144 361 L134 393 L130 426 L113 448 L119 419 L125 388 L133 356Z', '#62505b', '#353440', 1.4)}
      ${path('M102 449 L121 446 L129 456 L112 473 L100 475 L106 464 L87 474 L79 471 L95 458 L75 465 L68 461Z', '#c74758', '#522e41', 1.8)}
      ${path('M168 225 L194 209 L229 197 L253 206 L276 228 L285 260 L270 296 L244 328 L214 347 L176 346 L156 312 L150 266Z', '#285868', '#253238', 3)}
      ${path('M171 226 L196 205 L225 195 L236 206 L255 191 L266 225 L281 216 L279 248 L270 273 L248 296 L213 295 L188 274 L173 260Z', '#80ced8')}
      ${path('M196 205 L225 195 L210 224 L183 242 L173 260 L171 226Z', '#c1e9e3', '#5c9cae', 1.5)}
      ${path('M210 224 L236 206 L228 236 L204 256 L188 274 L183 242Z', '#4c94a3', '#294f62', 1.6)}
      ${path('M228 236 L266 225 L270 250 L248 275 L213 295 L231 265Z', '#93d8dc', '#355f75', 1.6)}
      ${path('M248 296 L268 253 L277 210 L275 167 L252 189 L240 228 L224 259 L212 284Z', '#559bab', '#294f62', 2.7)}
      ${path('M275 167 L261 216 L246 254 L224 283 L248 296 L268 253 L277 210Z', '#80ced8', '#386e81', 1.6)}
      ${path('M261 216 L275 167 L252 189 L240 228Z', '#b6e4e2', '#5c9cae', 1.3)}
      ${path('M114 234 L142 222 L172 225 L188 249 L180 281 L195 307 L176 346 L144 360 L116 338 L104 301Z', '#6f3549', '#253238', 2.7)}
      ${path('M114 234 L142 222 L160 215 L172 225 L181 250 L164 270 L136 281 L113 267Z', '#c74758', '#713244', 2)}
      ${path('M142 222 L160 215 L151 242 L128 260 L113 267 L114 234Z', '#ed8986', '#a84555', 1.4)}
      ${path('M164 270 L180 281 L195 307 L176 346 L153 336 L157 305Z', '#353440')}
      ${path('M173 281 L177 302 L161 328 L157 305 L164 270Z', '#b94b5c', '#713244', 1.4)}
      ${path('M245 305 L268 326 L276 363 L264 393 L244 417 L240 445 L219 462 L205 454 L224 430 L230 399 L239 370 L229 344Z', '#285868', '#253238', 2.7)}
      ${path('M261 333 L265 362 L253 390 L235 414 L233 440 L219 451 L226 425 L232 398 L248 366 L244 344Z', '#529aa9', '#285868', 1.5)}
      ${path('M214 444 L237 440 L246 449 L241 464 L218 479 L205 480 L215 465 L195 475 L186 473 L205 455 L188 463 L177 460Z', '#80ced8', '#294f62', 2)}
      ${path('M237 440 L246 449 L241 464 L218 479 L226 463Z M205 455 L195 475 L186 473 L198 460Z', '#c1e9e3', '#5c9cae', 1.1)}
      ${path('M163 324 L184 324 L203 349 L200 377 L185 410 L179 453 L161 484 L143 492 L131 482 L151 459 L156 422 L166 387 L162 362 L147 342Z', '#353440', '#253238', 2.7)}
      ${path('M184 335 L193 351 L189 376 L176 408 L169 453 L151 481 L146 473 L160 445 L166 408 L176 380 L176 357Z', '#68515a', '#522e41', 1.5)}
      ${path('M137 477 L157 472 L170 481 L169 494 L144 512 L132 513 L138 499 L115 511 L106 507 L128 488 L103 499 L94 494Z', '#c74758', '#522e41', 2)}
      ${path('M157 472 L170 481 L169 494 L144 512 L151 493Z M128 488 L115 511 L106 507 L121 492Z', '#f39b8b', '#a84555', 1.2)}
      ${path('M93 271 L82 242 L60 223 L40 229 L53 208 L54 180 L66 150 L74 186 L95 210 L104 236 L119 263Z', '#c74758', '#522e41', 2.6)}
      ${path('M66 150 L62 189 L69 210 L95 235 L104 236 L95 210 L74 186Z', '#ed8986', '#a84555', 1.4)}
      ${path('M60 223 L40 229 L53 208 L54 180 L62 189 L69 210Z', '#62505b', '#522e41', 1.3)}
      ${path('M105 251 L129 239 L148 247 L167 272 L155 301 L141 322 L126 334 L109 346 L91 354 L68 374 L53 370 L67 337 L75 309 L84 287Z', '#a73c52', '#253238', 2.8)}
      ${path('M105 251 L129 239 L148 247 L132 270 L104 284 L88 279Z', '#e56972', '#8f354d', 1.6)}
      ${path('M148 247 L167 272 L155 301 L137 324 L119 318 L123 290 L132 270Z', '#353440')}
      ${path('M88 279 L104 284 L99 307 L78 322 L77 300Z', '#6f3549', '#522e41', 1.6)}
      ${path('M96 285 L106 277 L115 298 L101 303Z', '#231f2b', '#ab4d5a', 1.2)}
      ${path('M67 330 L103 314 L128 305 L147 288 L157 267 L158 241 L151 219 L154 187 L166 226 L176 253 L174 284 L154 312 L128 326 L96 343 L74 352Z', '#bb4057', '#522e41', 2.5)}
      ${path('M154 187 L163 237 L166 270 L150 293 L124 313 L89 335 L74 352 L96 343 L128 326 L154 312 L174 284 L176 253 L166 226Z', '#e9767c', '#a84555', 1.3)}
      ${path('M78 357 L99 344 L126 333 L137 338 L119 355 L100 373 L79 390 L62 380 L55 370Z', '#231f2b', '#253238', 2.2)}
      ${path('M83 349 L112 335 L143 315 L136 333 L121 345 L99 352 L86 365 L75 370Z', '#a73c52', '#522e41', 1.8)}
      ${path('M65 342 L81 337 L93 345 L83 360 L73 374 L54 374 L64 357Z', '#bb4057', '#522e41', 2.2)}
      ${path('M65 342 L81 337 L78 354 L73 374 L54 374 L64 357Z', '#e56972', '#a84555', 1.3)}
      ${path('M76 374 L92 370 L96 387 L108 400 L124 410 L103 408 L85 399 L72 386 L64 377Z', '#b74558', '#522e41', 2.2)}
      ${path('M76 374 L92 370 L96 387 L108 400 L124 410 L98 396 L83 391Z', '#6f3549', '#432836', 1.3)}
      ${line('M78 380 L88 388 L99 393', '#bb4057', 1.3)}
      ${line('M111 256 L133 251 M118 336 L137 324 M151 230 L155 253 M202 284 L224 296 M228 210 L232 219', '#bdcfc9', 1.3)}`;
  }

  function weapons() {
    // The model's hooked tips, long bent limbs and large hollow crystal grip
    // are reconstructed in their own plane, then turned into the crossing bow.
    const bow = `<g transform="rotate(32 180 300)">
      ${line('M137 116 L137 473', '#f7bfb1', 1.2)}
      <g transform="matrix(-.306 .286 .286 .306 248.7 11.6)">
        ${path('M510 378 L524 381 L532 414 L550 433 L578 443 L572 465 L537 460 L509 417Z', '#715f43', '#3b3a32', 5)}
        ${path('M510 378 L516 414 L539 448 L537 460 L509 417Z', '#998a66', '#715f43', 3)}
        ${path('M365 0 L430 64 L410 100 L407 174 L440 237 L407 208 L423 263 L510 307 L510 392 L438 389 L403 329 L384 265 L333 233 L384 245 L379 186 L365 123 L389 63Z', '#b7354d', '#442632', 6)}
        ${path('M365 0 L410 62 L391 102 L390 175 L400 233 L399 268 L481 322 L482 388 L438 389 L403 329 L384 265 L333 233 L384 245 L379 186 L365 123 L389 63Z', '#e36976', '#97354b', 3)}
        ${path('M365 0 L430 64 L410 100 L407 174 L440 237 L407 208 L400 175 L399 96 L410 62Z', '#6a2038', '#66263e', 3)}
        ${path('M333 233 L423 263 L510 307 L510 392 L482 388 L481 322 L399 268Z', '#86273f', '#66263e', 3)}
        ${path('M423 278 L479 325 L476 382 L447 376 L414 326Z', '#d64d60', '#a93950', 3)}
        ${path('M510 452 L573 452 L609 452 L641 465 L683 545 L725 558 L725 538 L783 566 L847 572 L890 561 L948 623 L885 591 L851 602 L807 615 L768 612 L705 592 L705 631 L651 594 L648 568 L600 534 L570 502 L510 495Z', '#b7354d', '#442632', 6)}
        ${path('M510 452 L573 452 L609 452 L641 465 L683 545 L725 558 L725 538 L783 566 L847 572 L890 561 L948 623 L890 579 L850 589 L780 591 L730 570 L674 560 L614 498 L573 476 L510 479Z', '#81253c', '#66263e', 3)}
        ${path('M510 479 L573 476 L614 498 L674 560 L730 570 L780 591 L850 589 L890 579 L948 623 L885 591 L851 602 L807 615 L768 612 L705 592 L705 631 L651 594 L648 568 L600 534 L570 502 L510 495Z', '#e4737e', '#97354b', 3)}
        ${path('M510 346 L648 325 L609 452 L641 465 L651 497 L570 502 L461 502Z M513 378 L491 457 L575 460 L623 354Z', '#ca445d', '#442632', 6)}
        ${path('M510 346 L648 325 L623 354 L513 378 L491 457 L575 460 L570 480 L479 481Z', '#f39391', '#97354b', 3)}
        ${path('M648 325 L609 452 L641 465 L651 497 L570 502 L570 480 L607 477 L595 451 L623 354Z', '#842e46', '#66263e', 3)}
        ${line('M383 120 L397 183 M433 320 L458 364 M606 505 L636 534 M760 599 L806 602', '#f4b0a2', 3)}
      </g>
    </g>`;
    // Both small teeth and the larger triangular cutout are on the inner edge.
    const blade = `<g transform="translate(-24 22) rotate(-32 180 300)">
      ${path('M162 106 L189 121 L210 163 L212 199 L218 237 L212 266 L195 309 L187 380 L165 378 L151 345 L166 350 L154 338 L157 322 L169 327 L193 236 L181 242 L186 215 L187 184 L172 135Z', '#bd3c54', '#452632', 2.8)}
      ${path('M162 106 L184 145 L204 197 L206 237 L200 268 L181 306 L174 338 L175 381 L187 380 L195 309 L212 266 L218 237 L212 199 L210 163 L189 121Z', '#ec7c84', '#9a3048', 1.2)}
      ${line('M170 135 L196 192 L201 222 M195 258 L175 322 M161 330 L163 337 M156 355 L167 368', '#f5b1a1', 1.4)}
      ${path('M154 378 L188 382 L198 394 L186 402 L173 392 L146 388Z', '#a62e4b')}
      ${path('M165 393 L180 399 L165 459 L154 471 L147 459Z', '#745743')}
      ${path('M165 393 L169 408 L154 456 L154 471 L147 459Z', '#92795a', '#745743', 1.1)}
      ${path('M146 456 L165 460 L171 475 L154 485 L140 470Z', '#d4536c')}
    </g>`;
    return `${blade}${bow}`;
  }

  function runeDoor(x, y, scale = 1) {
    return `<g transform="translate(${x} ${y}) scale(${scale})">${path('M-35 61 V-21 L0 -66 L35 -21 V61Z', '#3c3440', '#96877e', 2.6)}${path('M-25 54 V-19 L0 -51 L25 -19 V54Z', '#632e42', '#c45d65', 1.8)}${ellipse(0, 0, 22, 22, '#852e44', '#dd746e', 2)}${line('M-14 -14 L-8 -3 L-14 1 L-8 9 L0 15 L8 9 L14 1 L8 -3 L14 -14 L4 -7 H-4Z M-5 0 L-2 3 M5 0 L2 3 M0 8 V12', '#f1a193', 2)}${line('M-19 32 H19 M-14 41 H14', '#cd7475', 1.5)}</g>`;
  }

  function roots(x, y, scale = 1) {
    return `<g transform="translate(${x} ${y}) scale(${scale})">${ellipse(0, 31, 29, 10, '#303238', '#706c61', 2)}${path('M-15 30 L-6 13 L-14 -7 L-5 -25 L-13 -48 L-7 -70 L3 -76 L-1 -50 L8 -31 L2 -13 L12 5 L5 22 L17 29 L4 34Z', '#777b52', '#333d35', 2.5)}${path('M-7 17 L-4 3 L-12 -18 L-23 -28 L-25 -43 L-16 -36 L-8 -33 L-1 -11 L3 3Z M4 10 L15 -10 L28 -16 L33 -37 L39 -29 L35 -9 L23 -2 L15 20Z', '#93925e', '#333d35', 2)}${line('M-1 -62 L3 -31 L-2 -16 L6 4 L0 28 M26 -11 L30 -19', '#b6ad7c', 1.3)}</g>`;
  }

  function labyrinth() {
    const floor = Array.from({ length: 9 }, (_, i) =>
      line(`M180 302 L${-160 + i * 85} 550`, '#a85a64', 1.2)
    ).join('');
    return `${path('M20 304 H340 V550 H20Z', '#723342', '#39303a', 2)}
      ${path('M20 422 L180 348 L340 422 V550 H20Z', '#9d4251', '#653341', 1.6)}
      ${floor}${line('M20 330 H340 M20 357 H340 M20 394 H340 M20 446 H340 M20 520 H340', '#c27073', 1.4)}
      ${path('M28 300 V194 L64 156 L118 178 L118 333 L81 351Z M242 333 V178 L296 156 L332 194 V300 L279 351Z', '#5c5963', '#292b35', 3)}
      ${path('M28 194 L64 156 L118 178 L88 206Z M242 178 L296 156 L332 194 L272 206Z', '#9a9192', '#39343c', 2)}
      ${path('M88 206 L118 178 V333 L88 355Z M242 178 L272 206 V355 L242 333Z', '#35353f')}
      ${line('M34 229 L83 238 M34 271 L83 290 M61 213 V234 M53 269 V303 M278 235 L326 228 M278 287 L326 270 M304 232 V267 M292 279 V315', '#77717d', 1.5)}
      ${path('M111 308 V188 L130 163 H230 L249 188 V308Z', '#68606a', '#292b35', 3)}
      ${path('M111 188 L130 163 H230 L249 188Z', '#ada097', '#49404a', 2)}
      ${line('M115 230 H144 M218 230 H246 M116 267 H144 M218 267 H246 M132 190 V225 M229 190 V225', '#93868b', 1.4)}
      ${runeDoor(180, 252, 0.93)}${runeDoor(65, 281, 0.57)}${runeDoor(297, 281, 0.57)}
      ${path('M20 362 L59 340 L100 370 V414 L65 433 L20 404Z M260 370 L302 340 L340 362 V404 L295 433 L260 414Z', '#504c58', '#292b35', 2.7)}
      ${path('M20 362 L59 340 L100 370 L65 391Z M260 370 L302 340 L340 362 L295 391Z', '#96878b', '#4e414b', 1.8)}
      ${line('M26 386 L63 409 M71 412 L95 398 M267 398 L292 412 M303 405 L332 389', '#796974', 1.4)}
      ${roots(76, 458, 0.8)}${crystal(278, 480, 0.92, true)}
      ${path('M152 472 L179 464 L207 473 L204 492 L180 505 L155 493Z', '#716776', '#38333d', 2.5)}
      ${ellipse(180, 473, 27, 10, '#b79894', '#413842', 2)}${ellipse(180, 473, 18, 5, '#863c4c', '#d99489', 1.4)}
      ${path('M185 458 L198 428 L203 424 L204 434 L193 463Z', '#a8a8b0', '#40333f', 1.8)}
      ${path('M117 521 L144 505 L181 513 L210 503 L243 521 L204 537 L169 534 L139 544Z', '#632f42', '#c77a79', 1.7)}
      ${line('M149 518 L174 522 L201 517 M175 531 L198 531', '#b46b74', 1.4)}`;
  }

  function tree(x, y, scale = 1) {
    return `<g transform="translate(${x} ${y}) scale(${scale})">${path('M-5 6 L-7 61 L3 66 L6 10Z', '#80765c', '#3e5349', 1.7)}${path('M0 -52 L27 -30 L34 -1 L20 18 L0 27 L-25 13 L-35 -6 L-27 -33Z', '#73977a', '#395b51', 2)}${path('M0 -52 L4 -16 L-25 13 L-35 -6 L-27 -33Z', '#aec49a', '#5d8067', 1.2)}${path('M4 -16 L27 -30 L34 -1 L20 18 L0 27Z', '#537e69', '#395b51', 1.2)}${line('M-5 7 L0 -6 L17 -15', '#c2d5ac', 1)}</g>`;
  }

  function prifddinas() {
    const bridge = [-1, 1]
      .map(
        (side) => `<g transform="translate(180 0) scale(${side} 1)">
      ${path('M38 362 L165 319 V373 L40 417Z', '#d2dcd0', '#52756c', 2.5)}
      ${path('M38 362 L165 319 L171 329 L45 374Z', '#eff0dc', '#829b87', 1.5)}
      ${path('M58 394 V376 Q63 359 74 359 V388Z M88 384 V365 Q95 349 106 348 V378Z M119 374 V353 Q126 339 139 337 V366Z M149 365 V344 L160 334 V362Z', '#558e84', '#a4bcaa', 1.8)}
      ${line('M47 408 L166 367 M61 399 V407 M101 386 V394 M140 373 V380', '#849f8c', 1.4)}
    </g>`
      )
      .join('');
    return `${path('M20 366 L81 323 L147 335 L208 321 L279 331 L340 362 V550 H20Z', '#75a68d', '#4e7865', 2)}
      ${path('M20 440 L94 391 L143 406 L178 371 L212 401 L273 399 L340 442 V550 H20Z', '#a2bb8d', '#668c71', 1.5)}
      ${tree(57, 314, 0.75)}${tree(301, 316, 0.83)}${tree(98, 304, 0.53)}${tree(260, 299, 0.55)}
      ${path('M134 388 V221 L150 195 H210 L226 221 V388Z', '#d9dfcb', '#697d69', 2.5)}
      ${path('M147 385 V235 Q150 220 163 219 V385Z M197 385 V219 Q210 220 213 235 V385Z', '#b6c4ad', '#8a9d83', 1.7)}
      ${path('M165 386 V271 Q180 248 195 271 V386Z', '#54867e', '#ecedda', 2.6)}
      ${path('M141 224 L139 373 L148 390 L152 235Z M219 224 L208 235 L212 390 L221 373Z', '#e8e7ce', '#a39879', 1.8)}
      ${path('M158 219 L160 246 H169 L171 218Z M189 218 L191 246 H200 L202 219Z', '#b9a680', '#7e856f', 1.5)}
      ${path('M180 112 L193 155 L215 177 L240 188 L274 175 L257 207 L225 220 L180 223 L135 220 L103 207 L86 175 L120 188 L145 177 L167 155Z', '#6bba9f', '#846f4e', 2.7)}
      ${path('M180 112 L174 168 L145 200 L135 220 L103 207 L86 175 L120 188 L145 177 L167 155Z', '#b3dfb7', '#718e71', 1.7)}
      ${path('M180 112 L193 155 L215 177 L240 188 L274 175 L257 207 L225 220 L204 197 L186 169Z', '#76c6a7', '#5e8f7b', 1.7)}
      ${path('M180 148 L194 173 L225 199 L245 198 L225 220 L180 223 L135 220 L116 201 L142 201 L166 178Z', '#4d9e8c', '#677d5f', 1.7)}
      ${line('M180 121 V216 M93 183 L126 207 L173 217 M267 183 L237 207 L187 217 M143 182 L151 195 M213 182 L206 193', '#d3e9be', 1.5)}
      ${path('M123 219 H238 V231 L219 238 H142 L123 231Z', '#c7b383', '#7b7c65', 2)}
      ${line('M129 227 H232 M161 252 H199 M151 360 H209', '#f0e5c3', 1.8)}
      ${bridge}
      ${path('M169 387 L143 407 L127 450 L165 472 L131 507 L77 550 H250 L218 520 L193 499 L207 473 L159 448 L167 418 L192 389Z', '#d1c79a', '#829476', 2)}
      ${line('M174 398 L156 422 L147 444 L181 466 L166 492 L124 531', '#eeead0', 1.8)}
      ${tree(48, 433, 0.65)}${tree(315, 432, 0.67)}${tree(91, 408, 0.45)}${tree(270, 425, 0.48)}
      ${crystal(83, 498, 0.48)}${crystal(284, 496, 0.56)}
      ${path('M21 519 L46 505 L74 518 L97 542 L76 550 H20Z M258 550 L280 529 L312 512 L340 525 V550Z', '#568e78', '#3f7162', 1.8)}
      ${line('M28 529 L52 519 L72 534 M281 542 L311 525 L333 536', '#a9cd9b', 1.4)}`;
  }

  function frameOrnaments(count, index, uid, celebrate) {
    return [
      [-1, 300],
      [361, 300],
      [-1, 460],
      [361, 460],
    ]
      .map(([x, y], i) =>
        count >= (i + 1) * 25
          ? `<g data-ornament="${i + 1}" class="${celebrate && (count === 100 || count === (i + 1) * 25) ? 'ornament-new' : ''}">${shard(x, y, 0.57, sceneNumber(index))}</g>`
          : `<circle cx="${x}" cy="${y}" r="4" fill="#332b22" stroke="#6e5c43"/>`
      )
      .join('');
  }

  function shrineMarkup(pieces, index, celebrate = false) {
    const colours = sceneColors(index);
    return Array.from({ length: 4 }, (_, i) => {
      const charge = Math.max(0, Math.min(25, pieces - i * 25));
      const awake = charge === 25;
      const carving = `${path('M-20 84 V60 L-12 50 V5 L0 -13 L12 5 V50 L20 60 V84Z', '#68777a', '#303d43', 2)}${path('M0 -13 L12 5 V50 L20 60 V84 H0Z', '#43545e', '#303d43', 1)}${line('M-25 84 H25 M-20 76 H20', '#bdac83', 3)}${shard(0, 11, 1.22, sceneNumber(index))}`;
      return `<div class="shrine-totem ${awake ? 'awake' : charge > 0 || i === Math.floor(pieces / 25) ? 'charging' : ''} ${celebrate && awake && (pieces === 100 || pieces === (i + 1) * 25) ? 'just-awakened' : ''}" style="--shrine-light:${colours[3]}"><svg viewBox="-40 -50 80 158" role="img" aria-label="Shard ${i + 1}: ${charge} of 25 completions"><defs><clipPath id="cg-charge-${i}"><rect x="-40" y="${85 - (charge / 25) * 135}" width="80" height="${(charge / 25) * 135}"/></clipPath><filter id="cg-stone-${i}"><feColorMatrix type="saturate" values="0"/></filter></defs><g filter="url(#cg-stone-${i})" opacity=".28">${carving}</g><g class="totem-light" clip-path="url(#cg-charge-${i})">${carving}</g></svg><small>${awake ? 'AWAKENED' : pieces < 100 && i === Math.floor(pieces / 25) ? charge + ' / 25' : 'WAITING'}</small></div>`;
    }).join('');
  }

  const art = createGlassWindow({
    config,
    esc,
    getJournal,
    sceneColors,
    frameOrnaments,
    renderScene(colours, panes, index) {
      const scene = sceneNumber(index);
      const arch = `${path('M42 550 V230 Q42 139 180 65 Q318 139 318 230 V550Z', colours[0])}${line('M42 550 V230 Q42 139 180 65 Q318 139 318 230 V550', colours[4], 1.4)}`;
      let illustration;
      if (scene === 0) {
        illustration = `${path('M180 68 V550 H42 V230 Q42 139 180 68Z', '#582b40', '#8a4255', 1.6)}${path('M180 68 Q318 139 318 230 V550 H180Z', '#305566', '#547c85', 1.6)}${ellipse(180, 283, 123, 123, 'none', '#b7b59a', 1.7)}${line('M180 76 V149 M69 156 L113 199 M291 156 L247 199 M49 263 H71 M289 263 H311', '#bfa995', 1.8)}${path('M20 550 L58 504 L83 520 L119 493 L180 509 L238 493 L279 520 L307 504 L340 550Z', '#44424c', '#77636e', 2)}${crystal(59, 526, 0.6, true)}${crystal(301, 526, 0.6)}${hunllef()}`;
      } else if (scene === 1) {
        illustration = `${path('M180 89 L292 312 L180 522 L68 312Z', '#456978', '#9cc3bd', 2)}${path('M180 89 V522 L68 312Z', '#334e62', '#7b9daa', 1.2)}${ellipse(180, 301, 123, 123, 'none', '#c9d5bb', 1.5)}${line('M180 104 V164 M180 442 V512 M73 303 H113 M249 303 H290 M95 207 L115 223 M261 210 L245 225 M95 399 L115 381 M261 399 L244 381', '#93b6b2', 1.5)}${crystal(180, 128, 0.63, true)}${weapons()}${path('M124 526 L142 509 H218 L236 526 V541 H124Z', '#688382', '#acb79b', 2)}${crystal(181, 521, 0.51, true)}`;
      } else if (scene === 3) {
        illustration = `${path('M62 197 L86 148 L115 130 L180 81 L245 130 L274 148 L298 197Z', '#4b3948', '#8c6164', 2)}${path('M180 81 V164 L115 130Z', '#754251', '#98626c', 1.4)}${line('M86 148 L119 164 M274 148 L241 164 M147 113 L157 152 M212 111 L202 151', '#bd7b77', 1.4)}${labyrinth()}`;
      } else {
        illustration = `${path('M180 70 L222 109 L284 139 L316 192 V368 H44 V192 L78 139 L137 109Z', '#aecac0', '#6c958e', 1.7)}${path('M180 70 L174 181 L139 236 L77 139 L137 109Z', '#d2dfcb', '#91b2a3', 1.3)}${ellipse(242, 177, 24, 24, '#e8e6b7', '#bac99c', 1.5)}${line('M63 218 L93 204 L109 210 M253 233 L278 215 L302 223', '#e3ecce', 1.5)}${prifddinas()}`;
      }
      return `${panes}${arch}${illustration}${line('M62 540 H298', colours[4], 1.3)}`;
    },
  });
  return { art, shrineMarkup, sceneColors };
};
