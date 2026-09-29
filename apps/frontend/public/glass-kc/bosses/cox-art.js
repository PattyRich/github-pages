/* Chambers-only illustrations. The shared frame owns pane reveal and drop targets.
 * References: OSRS Wiki /Great_Olm, /Twisted_bow, /Ancestral_robes,
 * /Tekton, /Vasa_Nistirio and /Olmlet. Original SVG interpretations, no remote assets.
 */
GLASS_RENDERERS.cox = function createChambersRenderer(config, { esc, getJournal }) {
  const sceneNumber = (index) => index % config.titles.length;
  const sceneColors = (index) =>
    config.palettes[
      (sceneNumber(index) + Math.floor(index / config.titles.length)) % config.palettes.length
    ];

  function crystal(x, y, scale = 1, arcane = false) {
    const [dark, mid, light] = arcane
      ? ['#51436f', '#8661d0', '#c1ade6']
      : ['#4d7350', '#93bd69', '#d9e9a3'];
    return `<g transform="translate(${x} ${y}) scale(${scale})" stroke="#253532" stroke-width="2" stroke-linejoin="round"><path d="M0 -55 L15 -28 L11 13 L-9 20 L-18 -20Z" fill="${mid}"/><path d="M0 -55 L-3 -16 L-9 20 L-18 -20Z" fill="${dark}"/><path d="M0 -55 L15 -28 L-3 -16Z" fill="${light}"/><path d="M-3 -16 L11 13 M-3 -16 L15 -28" fill="none"/><path d="M14 -2 L26 -26 L32 -8 L20 22 L11 13Z" fill="${dark}"/><path d="M26 -26 L24 1 L20 22 M24 1 L32 -8" fill="none" stroke="${mid}"/></g>`;
  }

  // A long, flat snout and green crown distinguish Olm from a generic dragon.
  function olmHead(x, y, scale = 1) {
    return `<g transform="translate(${x} ${y}) scale(${scale})" stroke="#334647" stroke-width="3" stroke-linejoin="round">
      <path d="M69 66 Q119 15 104 -58 L75 -91 L40 -77 L33 -34 L47 14 L15 70Z" fill="#a8c1b9"/>
      <path d="M57 59 Q91 8 78 -59 L53 -64 L51 -29 L64 11 L35 64Z" fill="#e2e8d6" stroke="none"/>
      <path d="M53 -73 L50 -113 L70 -89 L81 -128 L87 -84 L109 -107 L101 -62" fill="#6a9256"/>
      <path d="M52 -97 L61 -80 M82 -111 L83 -84 M102 -94 L97 -72" stroke="#bbd88b" stroke-width="3"/>
      <path d="M94 -77 L73 -100 L39 -98 L13 -78 L-8 -73 L-25 -53 L-76 -46 L-96 -23 L-86 -7 L-36 -1 L-6 -12 L17 -5 L39 -18 L59 -18 L82 -40Z" fill="#dae3d5"/>
      <path d="M-88 -22 L-41 -29 L-5 -41 L23 -67 L44 -68 L39 -90 L14 -72 L-10 -64 L-29 -47 L-78 -40Z" fill="#f1eddb" stroke="none"/>
      <path d="M-89 -10 L-39 -6 L-9 -20 L15 -14 L47 -32 L46 -17 L19 8 L-18 17 L-73 15 L-91 3Z" fill="#253a39"/>
      <path d="M-89 1 L-70 10 L-25 9 L12 -2 L37 -20 L29 1 L1 21 L-45 26 L-77 18Z" fill="#bbcdbf"/>
      <path d="M-72 -6 L-66 5 L-61 -5 M-45 -8 L-37 2 L-31 -12 M-10 -20 L-4 -7 L3 -18 M21 -19 L25 -6 L31 -26" fill="#efeed8" stroke-width="1.3"/>
      <path d="M14 -56 L39 -62 L31 -45 L17 -44Z" fill="#82bc57" stroke="#344738"/><path d="M27 -58 L25 -47" stroke="#1b302c" stroke-width="4"/>
      <path d="M-80 -31 L-73 -32 M-8 -51 L11 -58 M51 -80 L66 -62 L61 -39 M46 -9 L61 -2 L57 18 M53 29 L70 36" fill="none" stroke="#74958a" stroke-width="2"/>
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

  function motif(scene, x, y) {
    if (scene === 0 || scene === 4) return crystal(x, y + 8, 0.4, scene === 4);
    if (scene === 1) return twistedBow(x, y, 0.075);
    if (scene === 2)
      return `<g transform="translate(${x} ${y})" stroke="#49464b" stroke-width="1.5"><path d="M-9 5 L-1 -22 L5 -10 L6 5Z" fill="#aaa796"/><path d="M-17 11 L-8 3 L7 3 L17 13Z" fill="#c0bcaa"/><path d="M-8 3 H7 L9 7 H-10Z" fill="#48444a"/><path d="M-3 2 H1 V7 H-3Z" fill="#d8ad38"/><path d="M-17 11 L17 13" stroke="#65618b" stroke-width="2"/></g>`;
    if (scene === 3)
      return `<g transform="translate(${x} ${y})" stroke="#473b37" stroke-width="2"><path d="M0 -21 L12 0 L0 20 L-12 0Z" fill="#e29a55"/><path d="M0 -12 L5 0 L0 10 L-5 0Z" fill="#f8d68c"/></g>`;
    return `<g transform="translate(${x} ${y})" fill="#d9e2cd" stroke="#455b50" stroke-width="1.5"><path d="M-7 4 Q0 -7 7 4 L8 12 Q0 18 -8 12Z"/><ellipse cx="-9" cy="-6" rx="3" ry="5"/><ellipse cy="-11" rx="3" ry="5"/><ellipse cx="9" cy="-6" rx="3" ry="5"/></g>`;
  }

  function frameOrnaments(count, index, uid, celebrate) {
    return [
      [-1, 300],
      [361, 300],
      [-1, 460],
      [361, 460],
    ]
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
      const ground = `<path d="M20 474 L77 452 L122 477 L181 447 L244 469 L294 450 L340 476 V550 H20Z" fill="#334b44" stroke="#243933" stroke-width="3"/><path d="M21 513 L93 487 L158 519 L235 481 L339 522 M93 487 L79 550 M158 519 L181 550 M235 481 L268 550" fill="none" stroke="#60816a" stroke-width="2"/>`;
      let illustration;
      if (scene === 0) {
        const hand = (x, facing) =>
          `<g transform="translate(${x} 407) scale(${facing} 1)" stroke="#344a45" stroke-width="2.5"><path d="M-38 50 L-32 20 L-18 -10 L-13 -41 L-1 -52 L9 -43 L7 -10 L21 -34 L32 -38 L39 -26 L24 5 L34 -5 L47 -3 L51 10 L32 42 L20 60Z" fill="#d3dfcc"/><path d="M-18 50 L-9 17 L5 1 M4 47 L12 25 L26 9 M-9 -28 L1 -32 M21 -18 L28 -22" fill="none" stroke="#87a795"/><path d="M-13 -41 L-11 -57 L-1 -52 M32 -38 L42 -40 L39 -26 M47 -3 L57 0 L51 10" fill="#f3eed6"/></g>`;
        illustration = `${halo(180, 260, 126, '#8cac70')}
          <path d="M20 550 V394 L68 346 L91 370 L126 340 L169 377 L221 343 L269 374 L305 350 L340 399 V550Z" fill="#2c403d" stroke="#557060" stroke-width="3"/>
          ${olmHead(185, 315, 1.25)}${ground}${hand(73, 1)}${hand(286, -1)}
          <path d="M107 472 L137 426 L161 452 L185 433 L212 465 L247 451 L268 492 L229 515 H131Z" fill="#3a514a" stroke="#243833" stroke-width="3"/>
          ${crystal(49, 525, 0.75)}${crystal(308, 511, 0.8)}${crystal(158, 502, 0.5)}${crystal(246, 470, 0.45)}
          <path d="M180 70 L194 96 L180 123 L166 96Z" fill="#bbd58b" stroke="#42604d" stroke-width="3"/>`;
      } else if (scene === 1) {
        illustration = `<path d="M180 50 L319 296 L180 528 L41 296Z" fill="#40384f" stroke="#a795b5" stroke-width="2"/>${halo(180, 297, 124, '#9a89ad')}
          <path d="M180 95 V480 M60 296 H301 M96 193 L272 403 M96 403 L272 193" stroke="#a595b1" stroke-width="1" opacity=".5"/>
          ${twistedBow(180, 270, 0.52)}
          <path d="M95 493 L118 464 H240 L266 493 V536 H95Z" fill="#645064" stroke="#292c35" stroke-width="4"/><path d="M95 493 H266 M118 464 V492 M241 465 V493 M117 499 V532 M244 499 V532" stroke="#b29a73" stroke-width="5"/><path d="M174 488 H188 V511 H174Z" fill="#c4ad7c" stroke="#352e37" stroke-width="2"/>
          <path d="M139 464 L153 435 L174 456 L194 428 L214 464Z" fill="#c6a0d7" opacity=".8"/>`;
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
          ${[78, 282].map((x) => `<path d="M${x} 388 V500 M${x - 8} 441 L${x} 426 L${x + 8} 441 L${x} 456Z" fill="#79769b" stroke="#afaa9c" stroke-width="1.8"/>`).join('')}`;
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
        illustration = `${halo(180, 282, 120, '#9eb487')}<path d="M180 73 L191 91 L180 111 L169 91Z" fill="#cddfa5" stroke="#547056" stroke-width="2"/>${ground}
          <g stroke="#3d554d" stroke-width="3" stroke-linejoin="round">
            <path d="M192 390 Q276 451 307 410 Q332 361 290 328 Q316 336 325 376 Q347 473 260 476 Q209 470 169 427Z" fill="#c0d3bd"/>
            <path d="M210 426 Q280 471 313 420" fill="none" stroke="#eef0d8" stroke-width="9"/>
            <path d="M110 352 Q159 317 207 355 Q242 387 219 426 Q189 454 134 427 Q99 403 110 352Z" fill="#dce5cb"/>
            <path d="M184 367 Q232 394 208 422 L182 429 L173 410 L190 402Z M127 387 L121 414 L95 431 L98 443 L131 444 L151 422 L153 397Z" fill="#a6c4ae"/>
            <path d="M191 416 L174 435 L178 446 L205 446 L221 430 M102 434 L102 443 M113 432 V443 M184 435 V445 M195 434 V446" fill="#dce5cb"/>
          </g>
          ${olmHead(133, 340, 0.74)}
          ${crystal(61, 492, 0.75)}${crystal(281, 526, 0.54)}${crystal(250, 478, 0.35)}
          <g fill="#d3dfb1" stroke="#526d54" stroke-width="1.3"><path d="M101 504 l5 -8 5 8 -5 6Z M137 523 l5 -8 5 8 -5 6Z M174 508 l5 -8 5 8 -5 6Z"/></g>`;
      }
      return `${panes}${tracery}${illustration}`;
    },
  });
  return { art, shrineMarkup, sceneColors };
};
