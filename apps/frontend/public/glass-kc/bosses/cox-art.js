/* Chambers-only illustrations. The shared frame owns pane reveal and drop targets.
 * References: OSRS Wiki /Great_Olm, /Twisted_bow, /Ancestral_robes,
 * /Tekton, /Vasa_Nistirio, /Olmlet, /Arcane_prayer_scroll and /Kodai_wand.
 * Original SVG interpretations, no remote assets.
 */
GLASS_RENDERERS.cox = function createChambersRenderer(config, { esc, getJournal }) {
  const sceneNumber = (index) => index % config.titles.length;
  const sceneColors = (index) =>
    config.palettes[
      (sceneNumber(index) + Math.floor(index / config.titles.length)) % config.palettes.length
    ];

  // Wiki File:Kodai_wand_detail.png: tapered grey shaft with violet polygonal fittings.
  function kodaiWand(x, y, scale = 1, tilt = 0) {
    return `<g data-relic="kodai-wand" transform="translate(${x} ${y}) rotate(${tilt}) scale(${scale})" stroke="#353343" stroke-width="2" stroke-linejoin="round">
      <path d="M0 -198 L7 -154 L9 -102 L8 124 H-8 L-7 -102 L-4 -155Z" fill="#85818d"/>
      <path d="M0 -198 L2 -146 L1 120 H-8 L-7 -102 L-4 -155Z" fill="#a5a0aa" stroke="none"/>
      <path d="M2 -146 L7 -154 L9 -102 L8 124 H2Z" fill="#5d5869" stroke="none"/>
      <path d="M-8 -91 L3 -97 L16 -84 L14 -66 L2 -59 L-13 -70 L-16 -82Z" fill="#8273a7"/>
      <path d="M-8 -91 L3 -97 L3 -75 L-13 -70 L-16 -82Z" fill="#56506f" stroke-width="1.3"/>
      <path d="M3 -97 L16 -84 L3 -75Z" fill="#a394c1" stroke-width="1.2"/>
      <path d="M-12 -35 L4 -41 L18 -27 L16 -8 L2 -1 L-16 -12 L-19 -27Z" fill="#8677ab"/>
      <path d="M-12 -35 L4 -41 L3 -17 L-16 -12 L-19 -27Z" fill="#5b537b" stroke-width="1.3"/>
      <path d="M4 -41 L18 -27 L3 -17Z" fill="#aa9ac8" stroke-width="1.2"/>
      <path d="M-15 27 L2 19 L23 40 L20 65 L3 75 L-21 53 L-24 39Z" fill="#8875ac"/>
      <path d="M-15 27 L2 19 L1 50 L-21 53 L-24 39Z" fill="#564972" stroke-width="1.4"/>
      <path d="M2 19 L23 40 L1 50Z" fill="#ab9acb" stroke-width="1.3"/>
      <path d="M-20 115 L1 98 L30 132 L24 157 L-3 172 L-29 143Z" fill="#713ad2"/>
      <path d="M-20 115 L1 98 L-1 139 L-29 143Z" fill="#4d27a5" stroke-width="1.4"/>
      <path d="M1 98 L30 132 L-1 139Z" fill="#a065ed" stroke-width="1.4"/>
      <path d="M-1 139 L24 157 L-3 172 L-29 143Z" fill="#5d2bbb" stroke-width="1.4"/>
      <path d="M-3 -151 L-2 -106 M-4 -57 V-43 M-4 3 V18 M-4 82 V102 M-20 117 L-23 133" fill="none" stroke="#c3b7d2" stroke-width="1.4"/>
    </g>`;
  }

  function crystal(x, y, scale = 1, arcane = false) {
    const [dark, mid, light] = arcane
      ? ['#51436f', '#8661d0', '#c1ade6']
      : ['#4d7350', '#93bd69', '#d9e9a3'];
    return `<g transform="translate(${x} ${y}) scale(${scale})" stroke="#253532" stroke-width="2" stroke-linejoin="round"><path d="M0 -55 L15 -28 L11 13 L-9 20 L-18 -20Z" fill="${mid}"/><path d="M0 -55 L-3 -16 L-9 20 L-18 -20Z" fill="${dark}"/><path d="M0 -55 L15 -28 L-3 -16Z" fill="${light}"/><path d="M-3 -16 L11 13 M-3 -16 L15 -28" fill="none"/><path d="M14 -2 L26 -26 L32 -8 L20 22 L11 13Z" fill="${dark}"/><path d="M26 -26 L24 1 L20 22 M24 1 L32 -8" fill="none" stroke="${mid}"/></g>`;
  }

  function cavernCrystal(x, y, size = 1, turn = 0) {
    return `<g transform="translate(${x} ${y}) rotate(${turn}) scale(${size})" stroke="#374c2c" stroke-width="2" stroke-linejoin="round">
        <path d="M0 -67 L14 -52 L17 -4 L5 20 L-13 12 L-17 -43Z" fill="#a7ca30"/>
        <path d="M0 -67 L2 -45 L5 20 L-13 12 L-17 -43Z" fill="#779526"/>
        <path d="M0 -67 L14 -52 L2 -45 L-17 -43Z" fill="#d7e97b"/>
        <path d="M2 -45 L14 -52 L17 -4 L5 20Z" fill="#bcd94b"/>
        <path d="M-8 -37 L-4 -8 L1 7" fill="none" stroke="#b8d654" stroke-width="2"/>
      </g>`;
  }

  // Wiki File:Great_Olm.png: a pale angular head, paired dark horns,
  // lime eyes and crystals, and broad clawed hands emerging from the rock.
  // Keep the encounter portrait separate from the small Olmlet illustration.
  function greatOlm() {
    const hand = (x, y, size, turn, facing = 1) =>
      `<g transform="translate(${x} ${y}) rotate(${turn}) scale(${size * facing} ${size})" stroke="#344a47" stroke-width="2.4" stroke-linejoin="round">
        <path d="M-35 1 L-7 -12 L22 -5 L42 14 L43 32 L31 43 L37 68 L31 81 L19 82 L8 70 L3 48 L-4 45 L-9 79 L-20 88 L-32 81 L-29 61 L-24 39 L-35 33 L-44 57 L-56 63 L-66 55 L-57 40 L-43 21Z" fill="#dce7df"/>
        <path d="M-35 1 L-7 -12 L22 -5 L27 12 L9 22 L-22 15 L-43 21Z" fill="#f0f0e2" stroke-width="1.4"/>
        <path d="M9 22 L27 12 L43 32 L31 43 L37 68 L31 81 L19 82 L23 63 L15 38Z M-4 45 L-9 79 L-20 88 L-32 81 L-19 67 L-15 34Z M-35 33 L-44 57 L-56 63 L-66 55 L-50 50 L-39 24Z" fill="#a0b8b2" stroke="none"/>
        <path d="M-22 15 L-27 29 M9 22 L3 34 M-14 39 L-17 57 M20 44 L25 61" fill="none" stroke="#7c9991" stroke-width="1.8"/>
        <path d="M-66 55 L-56 63 L-76 76 L-73 65Z M-32 81 L-20 88 L-39 104 L-38 91Z M19 82 L31 81 L38 101 L24 95Z" fill="#555054"/>
        <path d="M-66 55 L-73 65 L-76 76 M-32 81 L-38 91 L-39 104 M31 81 L30 91 L38 101" fill="none" stroke="#817777" stroke-width="1.3"/>
      </g>`;
    return `<g stroke-linejoin="round">
      <path d="M180 52 L300 238 L279 411 H82 L57 238Z" fill="#253d39" stroke="#698b67" stroke-width="1.4"/>
      <path d="M180 52 L158 138 L90 195 M180 52 L205 140 L278 199 M158 138 L180 194 L205 140" fill="none" stroke="#8fa66b" stroke-width="1.5"/>
      <path d="M20 397 V279 L47 253 L70 277 L103 245 L128 272 L150 238 L187 282 L217 224 L250 253 L275 212 L309 255 L340 274 V550 H20Z" fill="#2c4641" stroke="#21342f" stroke-width="2.6"/>
      <path d="M20 279 L47 253 L70 277 L61 330 L20 344Z M70 277 L103 245 L128 272 L106 322 L61 330Z M217 224 L250 253 L275 212 L309 255 L278 306 L239 290Z" fill="#416054" stroke="#2a433b" stroke-width="1.8"/>
      <path d="M239 290 L278 306 L309 255 L340 274 L330 358 L282 377 L246 346Z M61 330 L106 322 L128 272 L143 333 L120 371 L74 367Z" fill="#233c37" stroke="#1e332e" stroke-width="1.8"/>
      ${cavernCrystal(88, 275, 0.74, -30)}${cavernCrystal(57, 280, 0.47, -53)}
      ${cavernCrystal(266, 218, 1.02, 17)}${cavernCrystal(297, 252, 0.66, 40)}
      ${cavernCrystal(180, 97, 0.54)}
      <path d="M177 103 L180 69 L184 94" fill="none" stroke="#e4e9a1" stroke-width="1.4"/>
      <g stroke="#344b47" stroke-width="2.7">
        <path d="M171 284 L212 251 L235 276 L246 346 L252 412 L236 447 L195 459 L159 440 L145 399 L158 345Z" fill="#cfdfd6"/>
        <path d="M171 293 L197 297 L207 359 L218 423 L195 445 L166 430 L156 394 L167 340Z" fill="#edf0df" stroke="none"/>
        <path d="M212 251 L235 276 L246 346 L252 412 L236 447 L218 423 L207 359 L197 297Z" fill="#a6bcbb" stroke-width="1.6"/>
        <path d="M174 326 L185 365 L176 403 L191 437 L166 430 L156 394 L167 340Z" fill="#c6d6ca" stroke="none"/>
        <path d="M222 321 L226 359 L235 383 M207 411 L213 436" fill="none" stroke="#87a69b" stroke-width="1.5"/>
      </g>
      <g stroke="#333a3b" stroke-width="2.7">
        <path d="M201 225 L200 178 L219 131 L257 107 L239 147 L226 184 L225 224Z" fill="#514e52"/>
        <path d="M201 225 L200 178 L219 131 L239 122 L215 177 L215 221Z" fill="#70676b" stroke="none"/>
        <path d="M239 147 L257 107 L238 127 L219 164 L215 221 L225 224 L226 184Z" fill="#383b3f" stroke="none"/>
        <path d="M171 224 L149 186 L151 153 L167 120 L192 100 L177 142 L178 164 L184 191 L198 220Z" fill="#585357"/>
        <path d="M151 153 L167 120 L179 111 L162 151 L162 182 L182 220 L171 224 L149 186Z" fill="#7a7072" stroke="none"/>
        <path d="M192 100 L177 142 L178 164 L184 191 L198 220 L182 220 L169 182 L170 145Z" fill="#3e3e42" stroke="none"/>
      </g>
      <g stroke="#354b47" stroke-width="2.5">
        <path d="M82 298 L117 291 L161 264 L195 270 L181 301 L162 320 L129 335 L92 324Z" fill="#1e392b"/>
        <path d="M94 307 L128 301 L178 275 L188 276 L160 305 L129 319 L102 320Z" fill="#577e2d" stroke="none"/>
        <path d="M92 319 L126 323 L160 308 L182 286 L185 301 L166 329 L137 347 L112 340 L97 331Z" fill="#d4e2d2"/>
        <path d="M97 331 L137 337 L166 319 L166 329 L137 347 L112 340Z" fill="#a2bcb0" stroke="none"/>
        <path d="M119 335 L138 340 L152 330 L149 346 L138 370 L126 351 L111 347Z" fill="#e7eddb"/>
        <path d="M138 340 L149 346 L138 370 L135 352Z" fill="#b9d0bf" stroke="none"/>
        <path d="M69 285 L87 264 L115 258 L136 239 L154 235 L158 214 L178 196 L196 206 L211 190 L229 208 L245 239 L235 264 L208 283 L189 282 L166 280 L134 300 L98 309 L77 303Z" fill="#dce8dc"/>
        <path d="M154 235 L158 214 L178 196 L196 206 L183 230 L177 242Z" fill="#f0f0e2" stroke-width="1.3"/>
        <path d="M183 230 L196 206 L211 190 L218 225 L206 243 L189 246Z" fill="#baccc9" stroke-width="1.3"/>
        <path d="M206 243 L229 225 L245 239 L235 264 L208 283 L189 282 L193 264Z" fill="#a3bab7" stroke-width="1.3"/>
        <path d="M87 264 L115 258 L136 239 L154 235 L146 258 L122 276 L93 283 L77 289Z" fill="#f2f1e1" stroke="none"/>
        <path d="M77 289 L93 283 L122 276 L146 258 L165 263 L134 286 L99 301 L77 303Z" fill="#c5d9cb" stroke="none"/>
        <path d="M147 238 L158 214 L178 206 L169 229 L160 241 L143 253Z" fill="#dce7d5" stroke-width="1.5"/>
        <path d="M164 247 L186 233 L203 233 L194 250 L176 261 L165 257Z" fill="#b7d934" stroke="#45613a" stroke-width="2"/>
        <path d="M184 240 L178 254" stroke="#324136" stroke-width="3.2"/>
        <path d="M156 243 L180 228 L206 226 L203 233 L185 235 L165 249Z" fill="#edf0df" stroke-width="1.4"/>
        <path d="M87 275 L100 272 L95 280 L87 281Z" fill="#58786a" stroke-width="1.2"/>
        <path d="M95 306 L101 317 L107 302 M117 301 L126 312 L131 296 M141 289 L148 300 L155 282 M168 280 L172 289 L179 277" fill="#e8eeda" stroke-width="1.2"/>
        <path d="M113 325 L122 316 L128 324 M139 316 L145 306 L151 310" fill="#e0e8cf" stroke-width="1.1"/>
        <path d="M205 259 L215 250 L229 252 M152 219 L160 221 M203 212 L208 220" fill="none" stroke="#77948b" stroke-width="1.5"/>
      </g>
      <g stroke="#333c3b" stroke-width="2.5">
        <path d="M221 266 L240 258 L260 242 L278 220 L273 247 L255 269 L230 285 L210 285Z" fill="#514f52"/>
        <path d="M221 266 L240 258 L260 242 L278 220 L264 248 L243 271 L230 279 L210 285Z" fill="#756c6d" stroke="none"/>
        <path d="M230 279 L255 263 L273 237 L273 247 L255 269 L230 285 L210 285Z" fill="#383c3f" stroke="none"/>
      </g>
      <g stroke="#20372f" stroke-width="2.8">
        <path d="M20 410 L54 365 L89 372 L125 403 L144 391 L162 424 L196 445 L243 424 L264 384 L302 370 L340 414 V550 H20Z" fill="#355348"/>
        <path d="M20 410 L54 365 L89 372 L74 411 L29 437Z M89 372 L125 403 L114 441 L74 411Z M264 384 L302 370 L340 414 L304 436 L271 426Z" fill="#547365" stroke-width="1.8"/>
        <path d="M29 437 L74 411 L114 441 L144 391 L162 424 L134 474 L81 481Z M271 426 L304 436 L340 414 V479 L283 483 L243 459Z" fill="#29463c" stroke-width="1.8"/>
        <path d="M37 400 L77 386 L117 404 L129 440 L71 455 L29 429Z M240 422 L264 392 L304 387 L337 419 L330 457 L276 466Z" fill="#142b26"/>
        <path d="M20 498 L74 472 L119 490 L162 464 L205 478 L247 468 L304 489 L340 478 V550 H20Z" fill="#375548"/>
        <path d="M20 498 L74 472 L81 509 L47 550 H20Z M119 490 L162 464 L205 478 L182 511 L129 532 L81 509Z M247 468 L304 489 L292 521 L227 534 L205 478Z" fill="#486657" stroke-width="1.7"/>
        <path d="M47 550 L81 509 L129 532 L151 550 M182 511 L192 550 M227 534 L257 550 M292 521 L340 530" fill="none" stroke="#203a30" stroke-width="2"/>
      </g>
      ${hand(86, 406, 0.86, 9)}${hand(273, 411, 0.98, -9, -1)}
      ${cavernCrystal(42, 504, 0.53, -20)}${cavernCrystal(320, 503, 0.56, 27)}
      ${cavernCrystal(180, 516, 0.48)}${cavernCrystal(150, 526, 0.32, -27)}
      <path d="M108 490 L121 503 L114 513 L99 502Z M217 510 L235 503 L242 515 L226 522Z M275 343 L282 335 L291 348 L283 357Z" fill="#a8cc43" stroke="#3e5935" stroke-width="1.5"/>
    </g>`;
  }

  // Wiki File:Olmlet_(follower).png: an upright pale pet, short legs,
  // small dark horns and a long raised tail. The scroll uses the ragged
  // parchment and dark red glyphs of File:Arcane_prayer_scroll_detail.png.
  function olmlet(colors) {
    const scroll = `<g transform="translate(119 302) rotate(-12)" stroke="#766047" stroke-width="1.8" stroke-linejoin="round">
      <path d="M-25 -9 L-6 -6 L2 -12 L13 -7 L31 -9 L34 2 L27 8 L34 13 L31 28 L36 36 L29 40 L34 52 L30 70 L14 68 L7 74 L-7 68 L-24 71 L-22 58 L-29 55 L-24 41 L-29 35 L-25 20 L-30 14 L-24 8Z" fill="#c8b597"/>
      <path d="M-25 -9 L-6 -6 L2 -12 L13 -7 L31 -9 L34 2 L17 1 L6 4 L-24 8Z M-24 41 L-16 40 L-18 59 L-7 68 L-24 71 L-22 58 L-29 55Z" fill="#eadabd" stroke="none"/>
      <path d="M27 8 L34 13 L31 28 L36 36 L29 40 L34 52 L30 70 L14 68 L20 49 L18 31Z" fill="#ad9474" stroke="none"/>
      <path d="M-18 3 L12 0 M-18 60 L16 63" fill="none" stroke="#ad9474" stroke-width="1"/>
      <g fill="#582e32" stroke="#582e32" stroke-width="1.1">
        <path d="M-12 14 L-4 11 L2 16 L-7 19Z M7 11 H18 L12 16 L17 21 L8 20Z"/>
        <path d="M-12 27 L-4 23 L2 28 L-4 32Z M8 26 L17 24 L14 28 L19 32 L8 34Z"/>
        <path d="M-12 39 L-3 37 L-5 42 L2 45 L-10 47Z M9 39 L17 37 L14 45 L7 47Z"/>
        <path d="M-9 53 L-1 51 L4 55 L-6 57Z M9 53 L17 50 L18 57 L10 59Z"/>
      </g>
    </g>`;
    return `<g stroke-linejoin="round">
      <path d="M52 550 V245 Q52 157 180 95 Q308 157 308 245 V550Z" fill="${colors[0]}" stroke="${colors[2]}" stroke-width="1.8"/>
      ${halo(180, 292, 119, colors[3])}
      <path d="M180 95 V150 M68 255 L89 265 M270 265 L292 255 M81 200 L101 215 M251 199 L269 185" fill="none" stroke="${colors[4]}" stroke-width="1.5" opacity=".65"/>
      <path d="M180 69 L193 91 L180 116 L167 91Z" fill="#d7e6ae" stroke="#58754d" stroke-width="2"/>
      <path d="M180 75 V108 M171 91 H189" stroke="#edf0c5" stroke-width="1.2"/>
      <path d="M20 478 L67 456 L112 475 L166 453 L221 478 L268 459 L340 480 V550 H20Z" fill="#334e44" stroke="#263c35" stroke-width="2.5"/>
      <path d="M20 518 L83 486 L138 507 L196 479 L263 507 L340 494 M83 486 L64 550 M138 507 L172 550 M263 507 L248 550" fill="none" stroke="#5b7c65" stroke-width="1.8"/>
      <ellipse cx="182" cy="499" rx="81" ry="17" fill="#1c3430" opacity=".65"/>
      ${cavernCrystal(56, 470, 0.6, -19)}${cavernCrystal(299, 482, 0.64, 23)}
      <g stroke="#3c5150" stroke-width="2.5">
        <path d="M206 429 Q270 413 270 351 Q270 277 257 215 Q244 168 267 135 L287 104 L284 133 Q267 164 274 203 Q298 306 286 379 Q279 438 248 458 L214 455Z" fill="#bdced0"/>
        <path d="M222 442 Q271 428 278 367 Q282 295 265 215 Q253 170 277 135 L287 104 L284 133 Q267 164 274 203 Q298 306 286 379 Q279 438 248 458Z" fill="#93acad" stroke="none"/>
        <path d="M251 421 Q276 378 273 313 Q271 257 260 213 Q250 170 271 139" fill="none" stroke="#e2e8de" stroke-width="4"/>
        <path d="M156 418 L180 433 L175 459 L157 485 L133 495 L120 486 L136 459 L137 435Z" fill="#c0d3c9"/>
        <path d="M196 425 L221 422 L222 452 L238 477 L229 495 L207 485 L196 460 L185 446Z" fill="#a9c1b7"/>
        <path d="M133 477 L150 487 L154 497 L141 503 L114 511 L103 504 L111 496 L109 487 L124 488Z M210 477 L229 481 L241 493 L256 498 L252 508 L230 508 L217 501 L205 505 L196 496Z" fill="#d9e5d5"/>
        <path d="M104 502 L114 511 L100 517 L99 509Z M120 501 L125 509 L113 516Z M136 497 L141 503 L131 512Z M217 501 L222 508 L211 514Z M233 502 L239 508 L238 517Z M248 502 L256 498 L263 509 L252 508Z" fill="#565154" stroke-width="1.5"/>
        <path d="M159 335 Q143 348 148 376 L155 407 L165 431 Q183 449 205 432 L218 414 L223 373 L207 341Z" fill="#dce8dc"/>
        <path d="M159 335 L180 349 L174 383 L180 423 L194 439 L165 431 L155 407 L148 376 Q143 348 159 335Z" fill="#b7cdc3" stroke="none"/>
        <path d="M180 349 L207 341 L215 365 L200 385 L201 421 L184 429 L174 383Z" fill="#edf0e0" stroke="none"/>
        <path d="M200 385 L223 373 L218 414 L205 432 L194 439 L201 421Z" fill="#9fbbb1" stroke="none"/>
        <path d="M174 288 L196 280 L198 307 L211 337 L195 352 L167 349 L152 336 L160 312Z" fill="#d7e4da"/>
        <path d="M174 288 L184 302 L182 324 L195 352 L167 349 L159 334 L169 311Z" fill="#edf0e1" stroke="none"/>
        <path d="M196 280 L198 307 L211 337 L195 352 L182 324 L184 302Z" fill="#a4bdb5" stroke-width="1.4"/>
        <path d="M149 343 L161 349 L155 372 L135 387 L125 381 L134 365Z" fill="#cdded3"/>
        <path d="M207 344 Q233 359 228 377 L212 393 L200 389 L198 378 L216 368 L204 358Z" fill="#dce7dd"/>
        <path d="M216 368 L228 377 L212 393 L200 389 L205 379Z" fill="#aac3b6" stroke="none"/>
        <path d="M174 373 L184 384 L178 402 L166 409 L155 400 L161 386Z" fill="#c5d9cb"/>
      </g>
      <g stroke="#3b3e41" stroke-width="2.4">
        <path d="M164 242 L148 216 L149 197 L161 172 L169 163 L164 196 L170 217 L180 235Z" fill="#5a5358"/>
        <path d="M149 197 L161 172 L156 198 L158 215 L174 237 L164 242 L148 216Z" fill="#817476" stroke="none"/>
        <path d="M186 239 L186 210 L201 180 L213 168 L207 197 L206 226 L198 245Z" fill="#555157"/>
        <path d="M186 210 L201 180 L196 212 L198 241 L186 239Z" fill="#766b73" stroke="none"/>
      </g>
      <g stroke="#39514b" stroke-width="2.3">
        <path d="M111 282 L127 268 L143 262 L147 246 L160 229 L177 235 L189 229 L209 245 L216 265 L202 286 L178 296 L157 291 L139 302 L120 299 L108 290Z" fill="#dce8dc"/>
        <path d="M147 246 L160 229 L177 235 L166 255 L143 270Z" fill="#f0f0e2" stroke-width="1.3"/>
        <path d="M177 235 L189 229 L209 245 L202 263 L177 270 L166 255Z" fill="#c0d3ca" stroke-width="1.3"/>
        <path d="M202 263 L216 265 L202 286 L178 296 L169 282 L177 270Z" fill="#a4bdb2" stroke-width="1.3"/>
        <path d="M111 282 L127 268 L143 262 L154 265 L137 283 L115 290Z" fill="#edf0de" stroke="none"/>
        <path d="M161 270 L177 258 L194 258 L190 272 L173 280 L163 278Z" fill="#b7d934" stroke="#4d693e" stroke-width="1.7"/>
        <path d="M176 263 L172 275" fill="none" stroke="#324336" stroke-width="2.5"/>
        <path d="M156 265 L176 252 L198 252 L194 258 L177 258 L161 270Z" fill="#eef0e0" stroke-width="1.2"/>
        <path d="M117 280 L123 279 L119 284Z" fill="#739284" stroke-width="1"/>
        <path d="M111 292 L133 293 L154 282 L174 285 L157 303 L137 310 L117 306Z" fill="#344f39"/>
        <path d="M200 279 L216 274 L231 262 L225 280 L210 291 L192 295Z" fill="#655b62" stroke="#3e4241" stroke-width="2"/>
      </g>
      ${scroll}
      <g stroke="#39514b" stroke-width="1.8">
        <path d="M125 302 L139 304 L159 292 L169 286 L166 300 L145 316 L129 315 L119 310Z" fill="#dce8d6"/>
        <path d="M139 304 L159 292 L166 293 L145 310 L129 310 L119 310 L129 315 L145 316 L166 300 L169 286Z" fill="#a6c0ae" stroke="none"/>
        <path d="M122 292 L126 301 L131 292 M142 289 L146 298 L151 285" fill="#edf0df" stroke-width="1.1"/>
        <path d="M132 312 L141 312 L149 319 L140 328 L131 319Z" fill="#e2e9d8"/>
      </g>
      <g stroke="#39514b" stroke-width="1.8">
        <path d="M129 363 L140 364 L149 377 L145 385 L134 380 L128 372 L118 373 L114 366 L119 360Z" fill="#e0e9d9"/>
        <path d="M138 365 L140 373 M126 363 L127 370" fill="none" stroke="#7f9d8b" stroke-width="1.3"/>
        <path d="M174 394 L178 402 L166 409 L155 400 L158 394 L165 400 L169 389Z" fill="#e1ead8"/>
      </g>
      ${cavernCrystal(60, 531, 0.45, -12)}${cavernCrystal(276, 527, 0.37, 24)}
      <g fill="#d7e4b3" stroke="#608151" stroke-width="1.1"><path d="M81 340 l3 -9 3 9 9 3 -9 3 -3 9 -3 -9 -9 -3Z M235 150 l3 -7 3 7 7 3 -7 3 -3 7 -3 -7 -7 -3Z M246 472 l3 -6 3 6 6 3 -6 3 -3 6 -3 -6 -6 -3Z"/></g>
    </g>`;
  }

  function halo(x, y, radius, color) {
    return `<circle cx="${x}" cy="${y}" r="${radius}" fill="none" stroke="${color}" stroke-width="2"/><circle cx="${x}" cy="${y}" r="${radius - 10}" fill="none" stroke="${color}" stroke-width="1" opacity=".5"/>${Array.from({ length: 16 }, (_, i) => `<path transform="translate(${x} ${y}) rotate(${i * 22.5})" d="M0 ${-radius + 2} V${-radius + 9}" stroke="${color}" stroke-width="2"/>`).join('')}`;
  }

  // Studied from Wiki File:Twisted_bow_detail.png: dark faceted limbs,
  // two pale inner braces, hooked ends, and a green string (not green limbs).
  function twistedBow(x, y, scale) {
    return `<g transform="translate(${x} ${y}) rotate(-25) scale(${scale}) translate(-292 -300)" stroke="#232125" stroke-width="3" stroke-linejoin="round">
      <path d="M47 500 L80 453 L400 91 L447 70 L414 116 L96 473Z" fill="#697715" stroke="#505d12"/>
      <path d="M47 500 L96 473 L447 70 L414 116Z" fill="#8c9c21" stroke="none"/>
      <path d="M130 492 L150 459 L187 433 L224 404 L276 373 L288 385 L251 415 L219 449 L183 477 L146 510Z" fill="#8b9188" stroke="#676d67"/>
      <path d="M150 459 L187 433 L224 404 L276 373 L262 395 L224 428 L188 465 L146 510Z" fill="#b4b6a5" stroke="none"/>
      <path d="M359 283 L381 241 L413 202 L451 140 L467 84 L480 83 L478 149 L449 175 L420 218 L382 265Z" fill="#a6ac9e" stroke="#6d746c"/>
      <path d="M359 283 L381 241 L413 202 L451 140 L467 84 L460 157 L430 194 L401 240Z" fill="#777e76" stroke="none"/>
      <path d="M447 49 L479 32 L533 0 L577 10 L584 42 L547 64 L562 26 L523 40 L507 79 L506 108 L516 140 L517 173 L505 205 L484 234 L448 249 L417 271 L389 297 L376 319 L343 322 L317 342 L323 370 L299 384 L281 425 L254 464 L215 491 L177 507 L141 512 L100 511 L69 525 L42 536 L25 547 L22 575 L40 575 L78 554 L59 585 L22 600 L0 571 L12 531 L31 515 L66 495 L99 492 L143 489 L181 473 L218 451 L240 410 L272 372 L273 321 L312 314 L320 303 L316 279 L359 275 L390 254 L426 232 L452 207 L466 174 L472 148 L466 115 L469 80 L479 58 L455 66Z" fill="#444146"/>
      <path d="M479 32 L533 0 L549 22 L523 40 L507 79 L479 58Z M472 148 L506 108 L516 140 L517 173 L466 174Z M426 232 L448 249 L417 271 L390 254Z M359 275 L389 297 L376 319 L343 322 L316 279Z M273 321 L323 370 L299 384 L272 372Z M240 410 L281 425 L254 464 L218 451Z M177 507 L141 512 L143 489 L181 473Z M100 511 L69 525 L66 495 L99 492Z" fill="#5d595c" stroke="#37353a" stroke-width="1.6"/>
      <path d="M533 0 L577 10 L562 26 L549 22Z M562 26 L584 42 L547 64Z M479 58 L507 79 L469 80Z M466 174 L517 173 L505 205 L484 234 L452 207Z M320 303 L343 322 L376 319 L316 279Z M273 321 L294 342 L323 370 L272 372Z M218 451 L215 491 L177 507 L181 473Z M31 515 L69 525 L42 536 L12 531Z M22 575 L40 575 L59 585 L22 600Z" fill="#29272c" stroke="none"/>
      <path d="M417 271 L428 268 L431 302 L413 322 L386 321 L411 309Z M281 425 L314 421 L334 397 L340 373 L324 395 L297 401Z" fill="#353237"/>
      <path d="M386 321 L412 302 L413 322Z M334 397 L340 373 L324 395Z" fill="#8c981c" stroke="#626f17"/>
      <path d="M447 49 L479 32 L479 58 L455 66 L447 65Z M31 515 L30 483 L51 476 L45 500 L50 524Z" fill="#738019" stroke="#535f14"/>
      <path d="M30 483 L40 488 L45 500 L50 524 L37 516Z M447 49 L455 53 L455 66 L447 65Z" fill="#a3aa35" stroke="none"/>
    </g>`;
  }

  // The Chambers rare-loot light is a descending column, with uneven
  // violet ribbons reaching the chest rather than a flame rising from it.
  function purpleLootBeam() {
    return `<g data-relic="chambers-loot-beam" transform="translate(180 0) scale(1.5 1) translate(-180 0)" stroke-linejoin="round">
      <path d="M149 23 L210 23 L205 172 L211 294 L203 389 L210 464 H150 L155 380 L149 253 L154 128Z" fill="#a96fba" opacity=".16"/>
      <path d="M158 24 H172 L169 138 L174 254 L169 354 L171 461 H156 L163 352 L158 232 L163 120Z" fill="#a877c2" opacity=".4"/>
      <path d="M177 18 H185 L184 114 L188 213 L182 330 L187 465 H175 L180 325 L175 213 L179 112Z" fill="#d7a2e0" opacity=".7"/>
      <path d="M193 27 H201 L200 162 L204 267 L197 374 L201 463 H191 L195 369 L190 268 L196 160Z" fill="#bb7ecb" opacity=".5"/>
      <path d="M150 53 L154 171 L149 290 L154 405 V450 M207 57 L204 185 L208 319 L204 444" fill="none" stroke="#ad79c0" stroke-width="1.2" opacity=".7"/>
      <path d="M165 31 L163 141 L167 253 L164 357 L166 449 M197 38 L198 162 L196 263 L200 376 V454" fill="none" stroke="#d5a4df" stroke-width="1.7" opacity=".8"/>
      <path d="M181 20 L182 114 L180 213 L184 329 L181 461" fill="none" stroke="#eed0ef" stroke-width="2" opacity=".8"/>
      <path d="M150 464 L163 454 L181 458 L198 453 L211 464 L192 474 H167Z" fill="#c294d5" opacity=".5"/>
    </g>`;
  }

  function bowFrameChest(x, y) {
    return `<g data-frame-relic="treasure-chest" transform="translate(${x} ${y})" stroke-linejoin="round"><path d="M0 -24 L17 -10 V11 L0 25 L-17 11 V-10Z" fill="#3e353d" stroke="#9e835f" stroke-width="1.6"/><path d="M0 -18 L12 -8 V8 L0 18 L-12 8 V-8Z" fill="#28282f" stroke="#655b59" stroke-width="1"/><path d="M-12 -1 L-8 -8 H8 L12 -1 V12 H-12Z" fill="#645064" stroke="#b29a73" stroke-width="1.5"/><path d="M-12 -1 H12 M-7 -7 V11 M7 -7 V11" fill="none" stroke="#b29a73" stroke-width="1.6"/><path d="M-2 -2 H2 V6 H-2Z" fill="#d9be80" stroke="#42313a" stroke-width="1"/><path d="M-4 -20 H4 L3 -8 H-3Z" fill="#b885cb" opacity=".6"/><path d="M0 -21 V-8 M-5 -18 V-9 M5 -16 V-9" fill="none" stroke="#d7a2e0" stroke-width="1.1"/></g>`;
  }

  function motif(scene, x, y) {
    if (scene === 0 || scene === 4) return crystal(x, y + 8, 0.4, scene === 4);
    if (scene === 1) return bowFrameChest(x, y);
    if (scene === 2)
      return `<g transform="translate(${x} ${y})" stroke="#49464b" stroke-width="1.5"><path d="M-9 5 L-1 -22 L5 -10 L6 5Z" fill="#aaa796"/><path d="M-17 11 L-8 3 L7 3 L17 13Z" fill="#c0bcaa"/><path d="M-8 3 H7 L9 7 H-10Z" fill="#48444a"/><path d="M-3 2 H1 V7 H-3Z" fill="#d8ad38"/><path d="M-17 11 L17 13" stroke="#65618b" stroke-width="2"/></g>`;
    if (scene === 3)
      return `<g transform="translate(${x} ${y})" stroke="#473b37" stroke-width="2"><path d="M0 -21 L12 0 L0 20 L-12 0Z" fill="#e29a55"/><path d="M0 -12 L5 0 L0 10 L-5 0Z" fill="#f8d68c"/></g>`;
    return `<g transform="translate(${x} ${y})" fill="#d9e2cd" stroke="#455b50" stroke-width="1.5"><path d="M-7 4 Q0 -7 7 4 L8 12 Q0 18 -8 12Z"/><ellipse cx="-9" cy="-6" rx="3" ry="5"/><ellipse cy="-11" rx="3" ry="5"/><ellipse cx="9" cy="-6" rx="3" ry="5"/></g>`;
  }

  function frameOrnaments(count, index, uid, celebrate, { anchors }) {
    return anchors
      .map(([x, y], i) => {
        const earned = count >= (i + 1) * 25;
        return earned
          ? `<g data-ornament="${i + 1}" class="${celebrate && (count === 100 || count === (i + 1) * 25) ? 'ornament-new' : ''}">${motif(sceneNumber(index), x, y)}</g>`
          : `<circle cx="${x}" cy="${y}" r="4" fill="#332b22" stroke="#6e5c43"/>`;
      })
      .join('');
  }

  function shrineMarkup(pieces, index, celebrate = false) {
    const colors = sceneColors(index);
    return Array.from({ length: 4 }, (_, i) => {
      const charge = Math.max(0, Math.min(25, pieces - i * 25));
      const awake = charge === 25;
      const carving = `<path d="M-26 81 L-17 69 H17 L26 81Z" fill="#65766b" stroke="#293b37" stroke-width="2"/>${crystal(0, 25, 1.05, sceneNumber(index) === 4)}`;
      return `<div class="shrine-totem ${awake ? 'awake' : charge > 0 || i === Math.floor(pieces / 25) ? 'charging' : ''} ${celebrate && awake && (pieces === 100 || pieces === (i + 1) * 25) ? 'just-awakened' : ''}" style="--shrine-light:${colors[3]}"><svg viewBox="-40 -50 80 158" role="img" aria-label="Crystal ${i + 1}: ${charge} of 25 raids"><defs><clipPath id="cox-charge-${i}"><rect x="-40" y="${85 - (charge / 25) * 135}" width="80" height="${(charge / 25) * 135}"/></clipPath><filter id="cox-stone-${i}"><feColorMatrix type="saturate" values="0"/></filter></defs><g filter="url(#cox-stone-${i})" opacity=".28">${carving}</g><g class="totem-light" clip-path="url(#cox-charge-${i})">${carving}</g></svg><small>${awake ? 'AWAKENED' : pieces < 100 && i === Math.floor(pieces / 25) ? charge + ' / 25' : 'WAITING'}</small></div>`;
    }).join('');
  }

  const art = createGlassWindow({
    config,
    esc,
    getJournal,
    sceneColors,
    frameOrnaments,
    renderScene(colors, panes, index) {
      const scene = sceneNumber(index);
      const tracery = `<path d="M39 546 V221 Q39 106 180 41 Q321 106 321 221 V546 M50 214 Q180 132 310 214 M40 494 Q180 441 320 494" fill="none" stroke="${colors[4]}" stroke-width="1.4" opacity=".65"/>`;
      let illustration;
      if (scene === 0) {
        illustration = greatOlm();
      } else if (scene === 1) {
        illustration = `<path d="M180 50 L319 296 L180 528 L41 296Z" fill="#40384f" stroke="#a795b5" stroke-width="2"/>${halo(180, 297, 124, '#9a89ad')}
          <path d="M180 95 V480 M60 296 H301 M96 193 L272 403 M96 403 L272 193" stroke="#a595b1" stroke-width="1" opacity=".5"/>
          ${purpleLootBeam()}
          ${twistedBow(180, 270, 0.52)}
          <path d="M95 493 L118 464 H240 L266 493 V536 H95Z" fill="#645064" stroke="#292c35" stroke-width="4"/><path d="M95 493 H266 M118 464 V492 M241 465 V493 M117 499 V532 M244 499 V532" stroke="#b29a73" stroke-width="5"/><path d="M174 488 H188 V511 H174Z" fill="#c4ad7c" stroke="#352e37" stroke-width="2"/>
          <path d="M159 465 H202 M169 467 H192" fill="none" stroke="#e0b7e9" stroke-width="2" opacity=".8"/>`;
      } else if (scene === 2) {
        // Wiki File:Ancestral_robes_equipped_female.png: stone-grey mantle,
        // indigo split tunic, gold bands/buckles and a tall beige witch hat.
        illustration = `<path d="M63 550 V242 Q63 157 180 104 Q297 157 297 242 V550Z" fill="#323c54" stroke="#929998" stroke-width="2"/>${halo(180, 246, 103, '#9da6ad')}
          <g stroke="#38383f" stroke-width="2.8" stroke-linejoin="round">
            <path d="M143 359 L211 360 L235 489 L216 529 L193 511 L180 433 L165 518 L139 529 L121 498Z" fill="#89897f"/>
            <path d="M167 388 L180 433 L165 518 L149 521 L157 460Z M193 400 L217 469 L216 529 L193 511 L180 433Z" fill="#58595b"/>
            <path d="M139 354 L219 354 L230 399 L244 480 L220 501 L212 427 L197 385 L169 431 L133 493 L110 518 L126 432Z" fill="#575b86"/>
            <path d="M144 365 L172 372 L164 422 L132 479 L121 486 L136 425Z" fill="#696e98" stroke="none"/>
            <path d="M207 376 L220 407 L234 474 L223 487 L210 426 L197 385Z" fill="#44486f" stroke="none"/>
            <path d="M139 371 L126 432 L110 518 L133 493 L152 460 L126 486 L138 431Z M197 385 L212 427 L220 501 L228 507 L216 426Z" fill="#aca996" stroke-width="1.6"/>
            <path d="M137 237 L114 250 L95 280 L88 316 L108 333 L131 302 L136 351 L164 367 L214 359 L221 306 L246 334 L270 321 L258 280 L239 249 L215 236Z" fill="#575b85"/>
            <path d="M164 275 L154 313 L166 348 L205 347 L216 303 L216 254Z" fill="#676a96" stroke="none"/>
            <path d="M97 310 L109 328 L106 357 L96 375 L88 369 L93 337 M246 324 L265 317 L269 348 L258 374 L248 370 L252 342Z" fill="#93968e"/>
            <path d="M96 350 L108 351 L105 361 L93 360 M254 347 L268 344 L265 356 L251 359" fill="#64677a" stroke-width="1.4"/>
            <path d="M97 284 L116 295 L134 282 L136 294 L113 309 L91 298Z M240 284 L262 293 L267 306 L242 298 L226 282 L230 271Z" fill="#d9ac31" stroke="#8f773e" stroke-width="1.5"/>
            <path d="M89 310 L111 322 L127 305 L121 322 L108 333 L88 316Z M244 318 L261 312 L270 321 L246 334 L233 319Z" fill="#30344d"/>
            <path d="M139 235 L153 223 L180 228 L205 220 L225 238 L207 260 L180 287 L153 303 L133 285 L127 258Z" fill="#b0ae9e"/>
            <path d="M151 237 L168 249 L191 239 L201 226 L180 228 L153 223Z" fill="#cdc8b5" stroke-width="1.5"/>
            <path d="M139 235 L127 247 L108 256 L101 276 L121 292 L138 277 L143 260Z M222 236 L244 251 L258 267 L239 285 L220 284 L219 260Z" fill="#a3a28f"/>
            <path d="M143 260 L154 287 L177 276 L206 253 L225 238 L211 264 L181 291 L153 303 L133 285Z" fill="#92917f" stroke="none"/>
            <path d="M212 237 L225 238 L218 248 L208 247Z" fill="#e0b132" stroke="#8f793f" stroke-width="1.2"/>
            <path d="M135 348 L165 354 L216 345 L218 356 L165 366 L136 359Z" fill="#4c4848"/>
            <path d="M156 350 L173 351 L173 367 L156 365Z" fill="#d9ae34" stroke="#8d773e" stroke-width="1.5"/><path d="M161 355 L168 355 V362 L161 361Z" fill="#595050" stroke="none"/>
            <path d="M145 185 L157 156 L163 113 L156 73 L177 105 L185 125 L184 157 L197 190Z" fill="#aaa997"/>
            <path d="M156 73 L169 120 L169 157 L160 181 L183 185 L184 157 L185 125 L177 105Z" fill="#c2bdab" stroke="none"/>
            <path d="M161 145 L182 149 M157 161 L183 165" fill="none" stroke="#949381" stroke-width="1.8"/>
            <path d="M147 179 L194 182 L211 196 L237 216 L246 224 L110 216 L120 205Z" fill="#b2b09e"/>
            <path d="M147 179 L194 182 L199 193 L171 196 L140 190Z" fill="#484447"/>
            <path d="M155 181 L166 182 L164 193 L153 192Z" fill="#dbaf35" stroke="#8c773f" stroke-width="1.5"/><path d="M158 184 H163 L162 189 H157Z" fill="#514b42" stroke="none"/>
            <path d="M140 197 L173 201 L211 196 L237 216 L171 208 L120 212Z" fill="#c1bdac" stroke="none"/>
            <path d="M110 216 L246 224 L243 229 L109 221Z" fill="#4c5077" stroke-width="1.4"/>
          </g>
          ${kodaiWand(285, 360, 0.96, 7)}
          <path d="M78 388 V500 M70 441 L78 426 L86 441 L78 456Z" fill="#79769b" stroke="#afaa9c" stroke-width="1.8"/>`;
      } else if (scene === 3) {
        // Wiki File:Tekton.png: tall horned helm, charcoal plates, molten
        // orange seams, a heated blade and the heavy black smithing hammer.
        illustration = `<path d="M34 550 V256 L76 206 L100 229 L138 183 L180 111 L223 187 L265 224 L292 204 L326 257 V550Z" fill="#3d3535" stroke="#8a6950" stroke-width="2"/>
          ${halo(180, 294, 126, '#a97d4b')}
          <path d="M20 505 L89 468 L169 493 L245 474 L340 512 V550 H20Z" fill="#342c2c" stroke="#685040" stroke-width="2"/>
          <path d="M22 539 L85 507 L136 525 L196 511 L243 531 L338 515" fill="none" stroke="#bd7535" stroke-width="4"/>
          <g stroke="#29282c" stroke-width="2.6" stroke-linejoin="round">
            <path d="M141 349 L169 365 L166 407 L147 446 L136 480 L112 483 L99 465 L113 423 L126 409Z" fill="#656164"/>
            <path d="M191 361 L222 348 L243 397 L246 438 L263 480 L245 498 L221 480 L213 429 L198 408Z" fill="#5a565b"/>
            <path d="M125 410 L152 418 L147 446 L131 452 L112 435Z M212 422 L244 416 L253 453 L239 468 L221 457Z" fill="#777071"/>
            <path d="M113 465 L137 473 L128 498 L106 516 L80 513 L74 500 L92 477Z M235 476 L258 472 L284 495 L295 518 L266 527 L241 518 L223 501Z" fill="#696367"/>
            <path d="M82 494 L112 481 L106 509 L80 513 M253 489 L275 496 L289 516 L266 517Z" fill="#888082" stroke-width="1.4"/>
            <path d="M144 416 L127 454 L134 460 L117 473 L128 451Z M225 408 L233 441 L249 470 L243 490 L259 512 L248 504 L235 486 L240 467 L225 445Z" fill="#efac30" stroke="none"/>
            <path d="M129 240 L151 225 L181 230 L209 219 L237 242 L245 280 L224 320 L217 352 L176 370 L139 348 L136 315 L114 278Z" fill="#58555a"/>
            <path d="M132 250 L170 267 L206 248 L222 270 L213 309 L182 328 L149 306Z" fill="#777174"/>
            <path d="M134 271 L177 284 L216 267 L211 302 L183 321 L155 307Z" fill="#666165" stroke="none"/>
            <path d="M137 251 L173 265 L180 277 L204 264 L211 237 L215 271 L184 286 L181 318 L187 329 L174 325 L174 282Z" fill="#f0b42d" stroke="none"/>
            <path d="M147 322 L178 334 L214 323 L218 355 L178 376 L144 354Z" fill="#454147"/>
            <path d="M154 335 L159 335 L158 360 L153 356Z M171 338 L177 339 L182 370 L175 367Z M194 334 L199 332 L206 356 L200 360Z" fill="#f5b932" stroke="none"/>
            <path d="M118 228 L140 237 L143 270 L122 291 L100 281 L88 255 L97 238Z" fill="#6a6467"/>
            <path d="M118 228 L124 251 L140 237 M124 251 L143 270 L122 291 L113 265 L88 255" fill="#817a7a" stroke="#4d484e" stroke-width="1.8"/>
            <path d="M220 218 L249 230 L270 252 L271 277 L250 297 L227 281 L215 254Z" fill="#686166"/>
            <path d="M220 218 L237 249 L269 253 L249 230Z M237 249 L227 281 L250 297 L254 270Z" fill="#81777a" stroke="#514a50" stroke-width="1.8"/>
            <path d="M99 278 L118 284 L117 307 L102 326 L85 315 L83 296Z" fill="#615b5e"/>
            <path d="M86 312 L104 315 L97 348 L77 372 L62 405 L45 439 L34 449 L39 420 L55 380 L72 347Z" fill="#d49326" stroke="#8e6928" stroke-width="2"/>
            <path d="M85 320 L94 319 L84 351 L65 379 L50 422 L34 449 L39 420 L61 366Z" fill="#ecc52f" stroke="none"/>
            <path d="M104 304 L105 318 L90 328 L84 320Z" fill="#e6ad31" stroke-width="1.5"/>
            <path d="M248 285 L269 279 L279 303 L265 330 L238 345 L213 336 L213 318 L245 310Z" fill="#61595e"/>
            <path d="M249 287 L263 300 L245 310 L213 318 L214 329 L244 325 L270 309Z" fill="#807479" stroke="none"/>
            <path d="M234 333 L250 331 L258 432 L243 449 L229 430Z" fill="#302b30"/>
            <path d="M212 351 L242 342 L278 351 L276 403 L258 426 L222 418 L207 402Z" fill="#242126"/>
            <path d="M212 351 L242 342 L278 351 L251 365 L209 368Z" fill="#4c424a"/><path d="M251 365 L278 351 L276 403 L258 426Z" fill="#383038"/><path d="M215 375 L215 399 L225 406" fill="none" stroke="#5e4c52" stroke-width="2"/>
            <path d="M167 173 L170 145 L183 112 L204 72 L196 111 L190 139 L191 166 L198 180Z" fill="#645d52"/>
            <path d="M170 145 L183 141 L190 139 L191 166 L182 173 L167 173Z" fill="#83765b"/><path d="M183 112 L204 72 L190 139 L183 141Z" fill="#48423f" stroke="none"/>
            <path d="M156 177 L180 165 L199 177 L201 221 L181 246 L160 223Z" fill="#676166"/>
            <path d="M156 177 L178 188 L201 183 L199 177 L180 165Z" fill="#eab130" stroke="#957231" stroke-width="1.5"/>
            <path d="M157 183 L178 194 L181 236 L162 217Z" fill="#4c474f" stroke="none"/>
            <path d="M172 193 L177 196 L184 224 L180 220Z M182 190 L187 191 L194 217 L190 226Z" fill="#f5b430" stroke="none"/>
            <path d="M162 221 L181 238 L195 224 L187 249 L169 245Z" fill="#353139"/>
            <path d="M50 469 H128 L152 453 L149 481 L123 493 H111 L106 517 H130 V532 H60 V517 H85 L81 493 L58 485Z" fill="#686568"/><path d="M50 469 L76 480 H131 L152 453" fill="none" stroke="#a89983" stroke-width="3"/>
          </g>
          <g stroke="#e9b554" stroke-width="1.8"><path d="M68 453 L58 439 M86 454 V437 M107 455 L118 441"/></g>`;
      } else if (scene === 4) {
        // Wiki File:Vasa_Nistirio.png: a hovering skeletal caster above a
        // low, sprawling stone body with vivid violet crystal fractures.
        const boulder = (x, y, size, turn = 0) =>
          `<g transform="translate(${x} ${y}) rotate(${turn}) scale(${size})" stroke="#383442" stroke-width="2"><path d="M-17 -10 L2 -22 L21 -10 L18 12 L-3 22 L-22 5Z" fill="#70677d"/><path d="M-17 -10 L2 -22 L3 1 L-22 5Z" fill="#91819c"/><path d="M3 1 L21 -10 L18 12 L-3 22Z" fill="#544b63"/></g>`;
        illustration = `<path d="M180 52 L319 278 L296 550 H64 L41 278Z" fill="#302b43" stroke="#85749d" stroke-width="1.5"/>
          ${halo(180, 242, 113, '#907ca7')}
          <path d="M20 527 L102 490 L184 516 L268 486 L340 525 V550 H20Z" fill="#343044" stroke="#625471" stroke-width="2"/>
          <ellipse cx="180" cy="489" rx="125" ry="28" fill="#514164" opacity=".55"/>
          <g stroke="#383345" stroke-width="2.5" stroke-linejoin="round">
            <path d="M133 372 L106 351 L69 365 L45 406 L58 438 L86 437 L113 405 L150 401Z" fill="#71697f"/>
            <path d="M227 375 L253 347 L285 357 L312 398 L305 435 L278 444 L251 404 L217 403Z" fill="#6a6279"/>
            <path d="M49 404 L27 441 L28 474 L50 490 L69 476 L71 445 L58 428Z M302 399 L327 437 L330 469 L311 487 L291 471 L285 441Z" fill="#655e74"/>
            <path d="M66 373 L90 362 L107 375 L67 415 L52 410Z M272 359 L289 371 L310 412 L299 419 L275 389Z" fill="#866eb0" stroke="none"/>
            <path d="M62 386 L87 373 L70 404 L56 423Z M292 384 L308 402 L299 405Z M30 443 L44 431 L37 464Z M315 438 L324 451 L314 467Z" fill="#7542e3" stroke="#9a70f0" stroke-width="1"/>
            <path d="M110 386 L146 363 L205 367 L250 394 L233 447 L195 463 L137 453 L107 434Z" fill="#72697f"/>
            <path d="M119 393 L155 377 L207 383 L232 403 L204 424 L161 416Z" fill="#8c61c5"/>
            <path d="M142 396 L183 386 L214 398 L188 411 L162 410Z" fill="#7e3fe9" stroke="#ae83f1" stroke-width="1.3"/>
            <path d="M123 413 L158 425 L190 443 L195 463 L137 453 L107 434Z" fill="#585065"/>
            <path d="M139 377 L129 346 L143 312 L168 298 L204 308 L227 343 L214 374 L181 388Z" fill="#766087"/>
            <path d="M143 312 L168 298 L181 330 L172 376 L139 377 L129 346Z" fill="#8664b4"/><path d="M181 330 L204 308 L227 343 L214 374 L181 388 L172 376Z" fill="#574c6c"/>
            <path d="M150 322 L161 315 L162 349 L172 372 L157 357Z" fill="#9c72d5" stroke="none"/>
            <path d="M91 408 L119 401 L148 422 L140 458 L104 490 L71 491 L54 466 L65 434Z" fill="#7d728c"/>
            <path d="M218 408 L247 396 L280 420 L297 458 L277 490 L244 495 L212 463 L201 432Z" fill="#776a88"/>
            <path d="M91 408 L119 401 L148 422 L108 439 L65 434Z M218 408 L247 396 L280 420 L243 438 L201 432Z" fill="#93819e"/>
            <path d="M70 444 L103 438 L86 470 L60 467Z M117 453 L136 432 L128 460 L108 477Z M218 443 L240 435 L225 470 L211 459Z M254 447 L280 431 L276 458 L243 480Z" fill="#7945df" stroke="#ae82e9" stroke-width="1.2"/>
            <path d="M71 482 L102 482 L115 503 L104 528 L79 537 L58 523 L57 505Z M246 484 L276 484 L295 505 L290 529 L268 540 L245 523 L236 503Z" fill="#62596f"/>
            <path d="M70 501 L91 489 L91 523 L79 531Z M256 496 L278 499 L286 522 L267 534Z" fill="#7750b3"/>
          </g>
          <path d="M168 212 L193 206 L215 240 L204 287 L188 355 L180 320 L166 342 L160 289 L149 253Z" fill="#9869e1" opacity=".48"/>
          <g stroke="#494255" stroke-width="2" stroke-linejoin="round">
            <path d="M160 221 L137 226 L112 245 L83 255 L59 272 L91 262 L120 256 L145 240 L161 238 M198 221 L221 230 L243 251 L270 263 L290 286 L268 271 L238 262 L213 243 L197 239" fill="#8d829e"/>
            <path d="M140 230 L117 246 L111 251 M220 235 L240 253 L247 256" fill="none" stroke="#c1afce" stroke-width="4"/>
            <path d="M86 256 L75 266 L64 271 M84 262 L82 274 M91 260 L94 270 M267 264 L274 279 L283 287 M270 270 L269 283 M276 271 L287 276" fill="none" stroke="#696078" stroke-width="2.2"/>
            <path d="M178 205 L174 225 L183 254 L177 282 L183 293" fill="none" stroke="#a69ab1" stroke-width="6"/>
            <path d="M163 221 L177 217 L198 221 L205 236 L196 257 L183 269 L165 256 L158 237Z" fill="#5d526f"/>
            <path d="M163 226 L177 233 L197 227 M161 235 L178 242 L201 235 M164 245 L180 252 L198 245 M168 254 L183 261 L193 255" fill="none" stroke="#b3a1c3" stroke-width="3.6"/>
            <path d="M180 220 L181 261" stroke="#c7b5d1" stroke-width="3"/>
            <path d="M169 266 L181 272 L196 266 L193 282 L182 289 L171 283Z" fill="#8c7b9c"/><path d="M175 274 L181 281 L188 274" fill="none" stroke="#4b405c"/>
            <path d="M182 288 L176 300 L181 307 L173 317 M184 290 L192 300 L188 312" fill="none" stroke="#9d87b3" stroke-width="3"/>
            <path d="M163 188 L171 179 L187 178 L197 188 L194 202 L186 212 L172 207 L164 200Z" fill="#8e819e"/>
            <path d="M166 190 L176 189 L178 198 L168 198Z M181 190 L191 188 L192 197 L182 199Z" fill="#42304f"/><path d="M170 194 H174 M184 194 H189" stroke="#9973ec" stroke-width="3"/>
            <path d="M178 199 L176 205 L182 203 M173 209 L187 210 M176 209 V213 M182 209 V214" fill="none" stroke="#4c425c" stroke-width="1.4"/>
            <path d="M163 182 L169 155 L191 119 L186 151 L193 178 L207 187 L193 193 L179 187 L158 193 L151 188Z" fill="#8c76ad"/>
            <path d="M169 155 L191 119 L180 164 L177 179 L163 182Z" fill="#b09bd2" stroke="none"/>
            <path d="M162 183 L177 178 L192 180 L196 186 L180 183 L162 189Z" fill="#5d4b7a" stroke="none"/>
          </g>
          ${boulder(115, 164, 0.6, -18)}${boulder(250, 137, 0.75, 10)}${boulder(235, 97, 0.43, -14)}${boulder(185, 73, 0.3)}${boulder(79, 223, 0.56, 14)}${boulder(278, 225, 0.74, -8)}${boulder(211, 281, 0.55, 13)}${boulder(153, 304, 0.38, -11)}`;
      } else {
        illustration = olmlet(colors);
      }
      return `${panes}${tracery}${illustration}`;
    },
  });
  return { art, shrineMarkup, sceneColors };
};
