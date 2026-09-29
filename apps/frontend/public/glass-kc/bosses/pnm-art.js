/* PNM-specific SVG scene renderer. No storage, account, or DOM ownership. */
GLASS_RENDERERS.pnm = function createNightmareRenderer(config, { esc, getJournal }) {
  const { palettes, titles } = config;
  const sceneNumber = (index) => index % titles.length;
  const sceneColors = (index) =>
    palettes[(sceneNumber(index) + Math.floor(index / titles.length)) % palettes.length];
  const ordinals = ['first', 'second', 'third', 'fourth'];
  // One shared carving keeps the shrine and window ornaments visually related.
  function shrineCarving(colors) {
    return `<g stroke="#243234" stroke-width="2" stroke-linejoin="round"><path d="M-10 8 H10 V85 H-10Z" fill="${colors[0]}"/><path d="M-17 85 H17 L21 92 H-21Z" fill="${colors[4]}"/><path d="M9 -12 L20 -18 L17 -4 L27 8 L20 20 L25 34 L15 48" fill="${colors[2]}"/><path d="M7 12 Q31 23 17 39 Q7 49 -16 43 L-17 34 Q9 40 12 27 L2 21Z M10 52 Q25 67 9 78 Q-3 83 -17 76 L-18 66 Q6 72 9 62Z" fill="${colors[4]}"/><path d="M-19 2 L-17 -13 L-6 -18 L-2 -31 L3 -16 L17 -19 L22 -5 L13 11 L0 16 L-8 9 L-20 13 L-24 5Z" fill="${colors[4]}"/><path d="M-18 7 L-12 11 L-3 7" fill="none"/><path d="M-17 12 L-22 45 L-15 39 L-13 15Z" fill="${colors[4]}"/><path d="M-17 22 L-20 26 L-16 30 L-19 34" fill="none" stroke="${colors[2]}"/><path d="M-9 -7 L-2 -9" stroke="${colors[3]}" stroke-width="4"/><path d="M-16 8 V17" stroke="${colors[4]}"/><circle cx="0" cy="-38" r="4" fill="${colors[3]}"/></g>`;
  }
  function shrineMarkup(pieces, index, celebrate = false) {
    const colors = sceneColors(index),
      carving = shrineCarving(colors);
    return Array.from({ length: 4 }, (_, i) => {
      const charge = Math.max(0, Math.min(25, pieces - i * 25)),
        awake = charge === 25;
      const newlyAwake = celebrate && awake && (pieces === 100 || pieces === (i + 1) * 25);
      const label = awake
        ? 'AWAKENED'
        : pieces < 100 && i === Math.floor(pieces / 25)
          ? `${charge} / 25`
          : 'WAITING';
      return `<div class="shrine-totem ${awake ? 'awake' : charge > 0 || i === Math.floor(pieces / 25) ? 'charging' : ''} ${newlyAwake ? 'just-awakened' : ''}" style="--shrine-light:${colors[3]}"><svg viewBox="-40 -50 80 158" role="img" aria-label="${ordinals[i]} totem: ${awake ? 'awakened' : charge + ' of 25 kills'}"><defs><clipPath id="charge-${i}"><rect x="-40" y="${92 - (charge / 25) * 138}" width="80" height="${(charge / 25) * 138}"/></clipPath><filter id="stone-${i}"><feColorMatrix type="saturate" values="0"/></filter></defs><ellipse cx="0" cy="94" rx="29" ry="5" fill="${colors[3]}" opacity="${awake ? 0.2 : 0.04}"/><g filter="url(#stone-${i})" opacity=".28">${carving}</g><g class="totem-light" clip-path="url(#charge-${i})">${carving}</g></svg><small>${label}</small></div>`;
    }).join('');
  }
  // The same long, jointed claw appears in the arena and at each earned frame milestone.
  function graspingHand(x, y, scale = 1, facing = 1, tilt = 0) {
    return `<g transform="translate(${x} ${y}) rotate(${tilt}) scale(${scale * facing} ${scale})" stroke="#18212f" stroke-width="2.4" stroke-linejoin="round">
    <path d="M-20 2 L-26 -39 L-44 -72 L-61 -99 L-77 -114 L-86 -112 L-78 -99 L-62 -87 L-53 -65 L-69 -78 L-93 -92 L-106 -113 L-104 -133 L-88 -136 L-64 -120 L-45 -99 L-48 -132 L-62 -156 L-59 -181 L-44 -195 L-31 -192 L-43 -173 L-36 -156 L-22 -133 L-13 -106 L-9 -149 L-18 -178 L-11 -205 L4 -216 L16 -210 L3 -191 L8 -169 L13 -147 L14 -111 L31 -145 L34 -174 L48 -195 L65 -199 L73 -188 L57 -178 L52 -153 L48 -128 L37 -98 L46 -114 L65 -133 L84 -139 L99 -132 L104 -115 L91 -122 L77 -119 L65 -97 L59 -73 L40 -46 L24 2Z" fill="#566674"/>
    <path d="M-19 0 L-17 -43 L-31 -77 L-38 -105 L-15 -90 L9 -99 L34 -92 L26 -60 L10 -36 L9 0Z" fill="#74838a" stroke="none"/>
    <path d="M-102 -129 L-89 -130 L-68 -115 L-49 -91 M-50 -183 L-50 -172 L-31 -132 L-24 -107 M0 -202 L-5 -188 L2 -147 L1 -115 M60 -190 L46 -173 L41 -142 L28 -109 M93 -130 L76 -129 L58 -107" fill="none" stroke="#9b929f" stroke-width="2"/>
    <path d="M-28 -79 L-10 -64 L-6 -27 M1 -90 L11 -69 L9 -41 M27 -83 L22 -61 M-25 -43 L-17 -42 M-17 -25 L9 -24" fill="none" stroke="#3b4b5b" stroke-width="2"/>
    <path d="M-45 -99 L-36 -92 M-14 -105 L-4 -101 M14 -111 L25 -103 M37 -98 L44 -92" stroke="#adb0a6" stroke-width="2"/>
  </g>`;
  }
  function frameOrnaments(count, index, uid, celebrate) {
    const colors = sceneColors(index),
      scene = sceneNumber(index),
      completed = Math.floor(count / 25);
    const anchors = [
      [-1, 300],
      [361, 300],
      [-1, 460],
      [361, 460],
    ];
    return anchors
      .map(([x, y], i) => {
        const lit = i < completed,
          fresh = celebrate && lit && (count === 100 || completed === i + 1);
        if (!lit) return `<circle cx="${x}" cy="${y}" r="4" fill="#332b22" stroke="#6e5c43"/>`;
        const side = i % 2 === 0 ? -1 : 1;
        let motif = '';
        if (scene === 0)
          motif = `<g transform="translate(${x} ${y - 9}) scale(.42)">${shrineCarving(colors)}</g>`;
        if (scene === 5)
          motif = `<path d="M${x} ${y} Q${x + side * 8} 82 180 5" fill="none" stroke="${colors[3]}" stroke-width="3"/><path d="M${x} ${y - 11} l8 11 -8 11 -8 -11Z" fill="${colors[3]}" stroke="${colors[4]}"/><path d="M180 -7 l8 12 -8 12 -8 -12Z" fill="${colors[3]}" stroke="${colors[4]}"/>`;
        if (scene === 1)
          motif = `<g transform="translate(${x} ${y})" stroke="#342e38" stroke-width="1.5"><path d="M-11 -8 L-11 -20 L-4 -14 L0 -23 L5 -14 L11 -20 L12 -7 L9 11 L0 19 L-9 11Z" fill="#93939b"/><path d="M-9 -1 L-2 2 M3 2 L10 -1" stroke="#282e37" stroke-width="2.5"/><path d="M0 4 V12" stroke="#c1b7b2"/></g>`;
        if (scene === 3)
          motif = `<ellipse cx="${x}" cy="${y + 16}" rx="16" ry="5" fill="#11141e" stroke="#82708b" stroke-width="1.5"/>${graspingHand(x, y + 15, 0.17, -side)}`;
        if (scene === 4)
          motif = `<path d="M${x} ${y + 29} q${side * 13} 27 0 51" fill="none" stroke="${colors[4]}" stroke-width="2" stroke-dasharray="3 5"/><g transform="translate(${x} ${y - 8})" stroke="#2d3b3e" stroke-width="1.3"><path d="M-5 18 H5 L7 36 H2 L0 26 L-2 36 H-7Z" fill="#585361"/><path d="M-6 0 H6 L11 24 L2 27 L0 13 L-2 27 L-11 24Z" fill="#817179"/><path d="M-1 2 H2 V16 H-1Z" fill="#c4c7b7"/><ellipse cy="-6" rx="6" ry="8" fill="#b9c1a8"/><path d="M-4 -6 H-1 M2 -6 H4" stroke="#55655d"/></g>`;
        if (scene === 2) {
          const glow = ['#73b85b', '#669ee9', '#eb9645', '#c6b4d1'][i];
          motif =
            i === 3
              ? `<g transform="translate(${x} ${y})" stroke="#c6b4d1" stroke-width="2" fill="#514257"><path d="M0 -16 V19 M-12 -16 L-8 -4 L0 2 L9 -4 L13 -16 L6 -11 L0 -5 L-6 -11Z"/></g>`
              : `<g transform="translate(${x} ${y})" stroke="#262432" stroke-width="2"><circle r="12" fill="${glow}"/><path d="M-8 -5 L0 -10 L8 -3 L4 8 L-6 6Z" fill="none" stroke="#eee2c4"/><path d="M-17 0 H-12 M12 0 H17 M0 -17 V-12 M0 12 V17" stroke="${glow}"/></g>`;
        }
        return `<g data-ornament="${i + 1}" class="${fresh ? 'ornament-new' : ''}">${motif}</g>`;
      })
      .join('');
  }
  const art = createGlassWindow({
    config,
    esc,
    getJournal,
    sceneColors,
    frameOrnaments,
    renderScene(colors, panes, index) {
      const totem = (
        x,
        y,
        scale,
        facing = 1
      ) => `<g transform="translate(${x} ${y}) scale(${scale * facing} ${scale})" stroke="#243234" stroke-width="2.5" stroke-linejoin="round">
    <path d="M-12 30 H12 V121 Q0 128 -12 121Z" fill="#397f88"/>
    <path d="M-16 122 H16 L20 129 H-20Z" fill="#a9a983"/>
    <path d="M8 6 L18 -1 L20 14 L30 21 L23 31 L29 44 L20 55 L23 69 L15 79" fill="#69526a"/>
    <path d="M8 30 Q33 37 18 57 Q9 68 -15 65 L-17 55 Q10 59 13 45 L3 36Z M12 77 Q26 93 9 105 Q-3 113 -18 106 L-21 97 Q4 99 9 90 L4 83Z" fill="#bab890"/>
    <path d="M-9 25 L-22 29 L-19 13 L-7 7 L-4 -8 L2 9 L17 4 L23 17 L16 31 L8 40 L-5 38 L-11 33 L-20 34 L-24 27Z" fill="#c9c69a"/>
    <path d="M-8 23 L-19 27 L-13 34 L-4 34 L4 29" fill="#35666b"/>
    <path d="M-8 15 L-3 14" stroke="#31775a" stroke-width="4"/>
    <path d="M-17 29 L-19 37 M-6 33 L-7 41" stroke="#e6e1bd" stroke-width="3"/>
    <path d="M-17 36 L-23 78 L-16 70 L-14 42Z" fill="#e2dcb9" stroke-width="1"/>
    <path d="M-17 46 L-20 51 L-16 55 L-20 61" fill="none" stroke="#a64d62" stroke-width="1.5"/>
    <path d="M2 -9 V-20" stroke="#bcb88b"/><circle cx="2" cy="-16" r="3" fill="${colors[1]}"/>
    <path d="M10 48 L16 52 M3 58 L6 64 M-8 57 L-3 64 M13 91 L18 97 M-7 98 L-3 107 M7 100 L10 105" fill="none" stroke="#767e68" stroke-width="1.5"/>
  </g>`;
      const petals = Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6,
          x = 180 + 139 * Math.cos(a),
          y = 322 + 185 * Math.sin(a);
        return `<path transform="translate(${x} ${y}) rotate(${i * 30 + 25})" d="M0 -12 Q14 0 0 15 Q-9 1 0 -12Z" fill="${i % 2 ? colors[3] : colors[2]}" stroke="#251d33" stroke-width="2"/>`;
      }).join('');
      // Observed from the current OSRS Wiki model: hunched spine, hanging hair, claws and wrapped shins.
      const face = `<g stroke="#28323c" stroke-width="2.5" stroke-linejoin="round">
    <path d="M142 220 L158 195 L187 187 L214 203 L228 232 L214 274 L185 299 L154 280 L138 249Z" fill="#92a2ae"/>
    <path d="M150 220 L168 206 L183 238 L167 265 L151 251Z" fill="#c2cccf" stroke="none"/>
    <path d="M188 209 L213 222 L215 245 L190 283 L174 279 L188 247Z" fill="#637e8f" stroke="none"/>
    <path d="M147 238 L168 247 L166 256 L152 251Z M191 247 L214 234 L208 252 L191 258Z" fill="#e881bc" stroke="#4c3349" stroke-width="1.5"/>
    <path d="M180 246 L172 273 L183 270 M168 277 L181 281 L194 270" fill="none" stroke="#425264" stroke-width="2"/>
    <path d="M132 226 L145 197 L171 180 L199 182 L222 196 L239 227 L237 268 L222 308 L220 253 L210 216 L190 198 L164 211 L146 239 L144 287 L127 321 L127 263Z" fill="#b7c3ce"/>
    <path d="M159 193 L177 202 L157 240 L163 285 L151 323 L146 263 L145 228Z" fill="#d4dcda"/>
    <path d="M197 194 L209 215 L191 248 L206 306 L193 340 L177 256 L184 222Z" fill="#abb8c5"/>
    <path d="M138 230 L133 285 M222 223 L231 264 M158 208 L152 231" fill="none" stroke="#71899c" stroke-width="2"/>
  </g>`;
      const boss = `<g stroke="#202c35" stroke-width="3" stroke-linejoin="round">
    <path d="M157 311 L139 361 L151 402 L140 474 L162 489 L177 452 L181 397 L194 365 L217 398 L226 456 L247 470 L254 447 L243 382 L220 311Z" fill="#394b59"/>
    <path d="M144 430 L168 436 L161 477 L141 478Z M223 421 L246 414 L252 450 L229 461Z" fill="#7f7c60"/>
    <path d="M144 443 L166 451 M142 458 L163 466 M229 432 L248 426 M232 446 L251 440" stroke="#b1a789" stroke-width="3"/>
    <path d="M141 476 L162 477 L167 496 L152 503 L127 502 L127 492Z M230 457 L248 450 L262 467 L252 479 L226 480 L223 470Z" fill="#465766"/>
    <path d="M130 208 L156 166 L198 152 L231 176 L250 217 L226 271 L215 330 L178 358 L150 327 L143 271Z" fill="#3d4859"/>
    <path d="M164 188 L201 170 L225 194 L215 261 L191 311 L164 270Z" fill="#765364"/>
    <path d="M162 278 L176 304 L197 314 L211 283 L204 335 L177 348 L152 325Z" fill="#293a46"/>
    <path d="M135 207 L102 249 L72 296 L45 359 L55 374 L87 312 L121 277 L155 248 M235 207 L270 245 L282 309 L307 361 L294 374 L267 324 L249 270 L215 245" fill="#566a77"/>
    <path d="M47 352 L35 383 L35 417 L41 399 L46 379 L49 414 L55 427 L57 391 L62 375 L71 397 L77 401 L67 365 M299 351 L315 382 L321 412 L312 399 L304 380 L309 416 L303 429 L297 391 L288 375 L281 408 L276 416 L279 377" fill="#83968f" stroke-width="2"/>
    <path d="M117 204 L133 180 L128 163 L145 171 L154 139 L166 162 L178 131 L190 157 L204 127 L215 153 L230 145 L232 171 L251 183 L239 203 L215 192 L191 173 L160 184 L139 215Z" fill="#243541"/>
    <path d="M145 180 L164 172 M186 151 L192 170 M221 163 L226 181" fill="none" stroke="#506677" stroke-width="2"/>
    ${face}
  </g>`;
      const awakening = `${panes}
    <path d="M20 550 V232 L180 91 L340 232 V550Z" fill="#243d46"/>
    <circle cx="180" cy="218" r="119" fill="#516b72" stroke="#b1c4ba" stroke-width="2"/>
    <circle cx="180" cy="218" r="107" fill="#324d5b" stroke="#7e8b9c" stroke-width="2"/>
    ${Array.from({ length: 16 }, (_, i) => `<path transform="translate(180 218) rotate(${i * 22.5})" d="M0 -107 V-118" stroke="#c4b69d" stroke-width="2"/>`).join('')}
    <g stroke="#172f39" stroke-width="3" fill="#64475a"><path d="M43 207 H58 V488 H43Z M302 207 H317 V488 H302Z"/><path d="M28 177 Q180 214 332 177 L326 195 Q180 225 34 195Z"/><path d="M34 225 H326 V237 H34Z"/></g>
    <path d="M20 500 L180 440 L340 500 V550 H20Z" fill="#31525a"/>
    <path d="M20 518 H340 M20 539 H340 M82 499 L67 550 M278 499 L293 550" stroke="#758d87" stroke-width="2"/>
    <ellipse cx="180" cy="500" rx="86" ry="17" fill="#243b46" stroke="#80b6a5" stroke-width="2"/>
    ${boss}
    ${petals}
    <path d="M180 44 L192 64 L180 85 L168 64Z" fill="#bf719d" stroke="#243240" stroke-width="3"/>`;
      const runes = Array.from(
        { length: 12 },
        (_, i) =>
          `<path transform="translate(180 325) rotate(${i * 30})" d="M-5 -109 L5 -115 L-4 -120" fill="none" stroke="${colors[4]}" stroke-width="3"/>`
      ).join('');
      const pillars = `${panes}<path d="M20 550 L180 45 L340 550Z" fill="#172d40" opacity=".65"/>
    <circle cx="180" cy="325" r="130" fill="#203744" stroke="${colors[4]}" stroke-width="3"/>
    <circle cx="180" cy="325" r="98" fill="none" stroke="${colors[1]}" stroke-width="11"/>${runes}
    <path d="M90 200 L180 322 L270 200 M90 445 L180 322 L270 445" fill="none" stroke="${colors[3]}" stroke-width="14" opacity=".35"/>
    <path d="M90 200 L180 322 L270 200 M90 445 L180 322 L270 445" fill="none" stroke="${colors[4]}" stroke-width="3"/>
    ${totem(90, 167, 1.4, -1)}${totem(270, 167, 1.4)}${totem(90, 367, 1.4, -1)}${totem(270, 367, 1.4)}
    <path d="M180 244 L221 325 L180 399 L139 325Z" fill="${colors[2]}" stroke="#16232f" stroke-width="5"/>
    <path d="M180 266 L203 325 L180 374 L157 325Z" fill="${colors[3]}" stroke="${colors[4]}" stroke-width="2"/>
    <path d="M180 74 L180 130 M166 102 H194 M136 524 H224" stroke="${colors[4]}" stroke-width="3"/>
    <circle cx="180" cy="102" r="25" fill="none" stroke="${colors[3]}" stroke-width="3"/>`;
      // Grasping Claws: black portals in the arena, with long slate-coloured fingers.
      const portal = (x, y, scale, handScale, facing, tilt) => `<g data-claw-portal="true">
    <ellipse cx="${x}" cy="${y}" rx="${68 * scale}" ry="${23 * scale}" fill="#343044" stroke="#6f5c7c" stroke-width="1.5"/>
    <ellipse cx="${x}" cy="${y}" rx="${61 * scale}" ry="${18 * scale}" fill="#0d111b" stroke="#1c1a2b" stroke-width="3"/>
    ${graspingHand(x, y, handScale, facing, tilt)}
    <path transform="translate(${x} ${y}) scale(${scale})" d="M-58 7 Q0 30 58 7 Q45 23 0 24 Q-45 23 -58 7Z" fill="#232333"/>
    <path transform="translate(${x} ${y}) scale(${scale})" d="M-44 17 Q-12 27 21 22" fill="none" stroke="#8d748e" stroke-width="1.6"/>
  </g>`;
      const claws = `${panes}
    <path d="M20 550 V220 Q20 92 180 18 Q340 92 340 220 V550Z" fill="#262c43" opacity=".88"/>
    <path d="M52 305 V224 Q52 134 180 63 Q308 134 308 224 V305" fill="none" stroke="${colors[1]}" stroke-width="1.5" opacity=".4"/>
    <path d="M20 315 L180 278 L340 315 V550 H20Z" fill="#343b4b" stroke="#1b2635" stroke-width="2"/>
    <g stroke="#1e2838" stroke-width="2" stroke-linejoin="round">
      <path d="M20 315 L116 293 L95 349 L20 366Z M116 293 L180 278 L244 293 L268 349 H95Z M244 293 L340 315 V366 L268 349Z" fill="#414455"/>
      <path d="M20 366 L95 349 L69 422 H20Z M95 349 H181 V422 H69Z M181 349 H268 L297 422 H181Z M268 349 L340 366 V422 H297Z" fill="#3c4153"/>
      <path d="M20 422 H117 L103 489 H20Z M117 422 H242 L259 489 H103Z M242 422 H340 V489 H259Z" fill="#454957"/>
      <path d="M20 489 H69 L49 550 H20Z M69 489 H181 V550 H49Z M181 489 H297 L317 550 H181Z M297 489 H340 V550 H317Z" fill="#3c4353"/>
    </g>
    <g fill="none" stroke="#171e2d" stroke-width="2" stroke-linecap="round">
      <path d="M136 370 L116 389 L124 403 L109 416 L115 432 M123 402 L101 398 L90 406 M215 366 L235 381 L226 398 L247 408 M235 381 L255 378 L269 391"/>
      <path d="M68 485 L49 503 L57 519 L41 534 M49 503 L27 497 M106 487 L123 511 L117 529 L136 545 M123 511 L143 506 M263 460 L246 480 L255 500 L241 519 M255 500 L281 511 L288 533 M303 470 L321 484 L315 501 L331 511"/>
    </g>
    <path d="M38 366 L85 356 M126 427 H162 M210 495 H240 M147 545 H174" fill="none" stroke="#827184" stroke-width="1.3" opacity=".6"/>
    ${portal(180, 369, 1.12, 1.05, 1, -5)}
    ${portal(279, 474, 0.65, 0.53, -1, 17)}
    ${portal(83, 489, 0.68, 0.56, 1, -18)}
    <path d="M133 386 L142 379 L153 391 L143 397Z M219 380 L227 387 L220 394 L211 389Z M61 507 L68 499 L76 511Z M299 489 L310 484 L316 492 L304 498Z" fill="#666174" stroke="#252939" stroke-width="1.5"/>`;
      const walker = (
        x,
        y,
        scale,
        tilt,
        coat = '#564954'
      ) => `<g transform="translate(${x} ${y}) rotate(${tilt}) scale(${scale})" stroke="#26313a" stroke-width="2.5" stroke-linejoin="round">
    <path d="M-15 57 L0 58 L-3 100 L-11 115 L-24 115 L-21 103 L-14 94Z M1 57 L17 57 L18 98 L24 108 L18 115 L5 112 L3 97Z" fill="#43404a"/>
    <path d="M-15 7 L14 7 L21 42 L24 78 L4 83 L0 45 L-6 82 L-25 79 L-19 41Z" fill="${coat}"/>
    <path d="M-5 10 H6 L9 53 L-2 64 L-9 52Z" fill="#a3aa9e"/>
    <path d="M-14 9 L-27 15 L-29 49 L-24 64 L-16 59 L-19 40 L-17 26 M15 9 L27 15 L29 48 L24 63 L17 61 L19 38 L17 26" fill="#868f8c"/>
    <path d="M-25 57 L-17 60 L-18 71 L-24 73 L-29 66 M19 59 L25 57 L29 66 L24 73 L17 69" fill="#b9c1a8"/>
    <path d="M-11 -21 L1 -26 L12 -17 L11 -1 L4 9 L-7 5 L-14 -7Z" fill="#b9c1a8"/>
    <path d="M-11 -19 L-8 -8 L-13 -5 M8 -20 L12 -12 L10 -4" fill="none" stroke="#707c76" stroke-width="3"/>
    <path d="M-9 -8 L-4 -7 M2 -6 L7 -7 M-5 0 L2 2" stroke="#5e7168" stroke-width="2"/>
  </g>`;
      const dream = `${panes}<path d="M20 550 V220 Q180 84 340 220 V550Z" fill="#1c343b"/>
    <path d="M42 550 L92 227 L180 96 L269 227 L318 550" fill="#2c484b" stroke="#50716b" stroke-width="2"/>
    <path d="M29 550 Q0 394 152 240 M331 550 Q360 395 209 240 M99 550 Q127 365 168 252 M261 550 Q233 365 192 252" fill="none" stroke="#648781" stroke-width="21"/>
    <path d="M29 550 Q0 394 152 240 M331 550 Q360 395 209 240 M99 550 Q127 365 168 252 M261 550 Q233 365 192 252" fill="none" stroke="#b4bba1" stroke-width="1.5" stroke-dasharray="2 13"/>
    <circle cx="180" cy="180" r="68" fill="#433746" stroke="#9c8196" stroke-width="2"/>
    <g transform="translate(90 75) scale(.5)">${boss}</g>
    ${walker(89, 319, 0.64, -12, '#6e565f')}${walker(271, 321, 0.64, 12, '#535666')}${walker(124, 417, 0.9, -7, '#594a58')}${walker(238, 423, 0.86, 8, '#70665c')}
    <path d="M180 40 L188 64 L180 86 L172 64Z" fill="#c5ccb0" stroke="#33504e" stroke-width="2"/>`;
      // Brown diamond-quilted hauberk, oxblood textile and grey steel, as in the current equipment model.
      const armour = `${panes}
    <path d="M180 46 L304 213 V550 H56 V213Z" fill="#392d35"/>
    <path d="M77 550 V224 Q77 135 180 95 Q283 135 283 224 V550" fill="#68464b" stroke="#b89b7a" stroke-width="2"/>
    <path d="M94 550 V229 Q94 155 180 118 Q266 155 266 229 V550" fill="none" stroke="#8b6566" stroke-width="2"/>
    <g stroke="#2e2c34" stroke-width="2.5" stroke-linejoin="round">
      <path d="M139 326 L220 326 L259 512 L221 531 L136 528 L103 509Z" fill="#514535"/>
      <path d="M146 330 L213 330 L236 511 L178 521 L122 508Z" fill="#874c51"/>
      <path d="M181 344 L167 512 L195 519 L217 509 L197 341Z" fill="#a26165" stroke="none"/>
      <path d="M141 337 L126 363 L121 389 L144 403 L158 343 M220 337 L238 365 L243 393 L222 405 L204 343" fill="#808288"/>
      <path d="M126 369 L119 397 L140 418 L147 388 M236 371 L246 400 L225 424 L218 395" fill="#666e77"/>
      <path d="M120 402 L110 434 L130 456 L140 419 M246 405 L254 439 L236 461 L225 425" fill="#4b5764"/>
      <path d="M133 213 L108 217 L92 272 L106 302 L129 282 M225 215 L250 218 L268 272 L254 304 L233 282" fill="#8e555a"/>
      <path d="M99 275 L121 282 L117 326 L99 344 L87 330Z M243 282 L261 276 L274 328 L261 344 L245 327Z" fill="#6e7781"/>
      <path d="M136 209 L180 219 L224 209 L231 252 L217 332 L181 345 L143 331 L128 250Z" fill="#69573f"/>
      ${Array.from({ length: 4 }, (_, r) =>
        Array.from({ length: 3 }, (_, c) => {
          const x = 153 + c * 27,
            y = 235 + r * 26;
          return `<path d="M${x} ${y - 12} l13 12 -13 13 -13 -13Z" fill="${(r + c) % 2 ? '#826e4d' : '#544534'}" stroke="#60523d" stroke-width="1"/>`;
        }).join('')
      ).join('')}
      <path d="M138 218 L181 229 L223 217" fill="none" stroke="#332f32" stroke-width="9"/>
      <path d="M172 221 H188 V233 H172Z" fill="#a29c8c"/><path d="M176 224 H184 V230 H176Z" fill="#48403a" stroke="none"/>
      <path d="M140 214 L119 202 L98 208 L82 228 L85 252 L119 265 L134 249 M220 214 L242 202 L263 211 L278 233 L274 256 L243 265 L228 248" fill="#93949a"/>
      <path d="M90 232 L123 243 L120 259 L87 247 M237 243 L274 235 L272 253 L244 261" fill="#717a84"/>
      <path d="M142 329 L157 324 L168 333 L180 324 L193 334 L205 325 L219 332 L212 348 L195 342 L181 353 L167 342 L152 347Z" fill="#954f55"/>
      <path d="M145 183 L214 183 L221 213 L182 226 L139 211Z" fill="#8b4d53"/>
      <path d="M143 134 L144 111 L156 119 L165 102 L176 117 L187 100 L198 118 L210 105 L217 130 L219 165 L207 191 L184 211 L157 196 L143 169Z" fill="#8c8d94"/>
      <path d="M144 134 L182 145 L217 130 L212 153 L181 163 L146 154Z" fill="#747681"/>
      <path d="M182 162 L213 153 L207 184 L184 207Z" fill="#626e7b" stroke="none"/>
      <path d="M149 159 L173 165 L170 172 L152 168Z M189 165 L211 157 L207 168 L189 173Z" fill="#242932" stroke-width="1.5"/>
      <path d="M180 164 L176 187 L185 190" fill="none" stroke="#b5b5b5" stroke-width="2"/>
      <path d="M151 132 L151 119 M165 127 L166 110 M183 133 L187 109 M204 128 L209 113" stroke="#b6b3b1" stroke-width="2"/>
    </g>
    <path d="M100 540 H259 M122 545 H237" stroke="#bda482" stroke-width="2"/>
    <path d="M180 52 L190 72 L180 88 L170 72Z" fill="#bd8c8d" stroke="#503b42" stroke-width="2"/>`;
      // Fixed identity colours from the OSRS Wiki; editions only recolour the surrounding glass.
      const orb = (x, y, name, shade, light) =>
        `<g transform="translate(${x} ${y})"><title>${name} orb</title><circle r="43" fill="none" stroke="${shade}" stroke-width="2"/><circle r="34" fill="${shade}" stroke="#1d2530" stroke-width="4"/><path d="M-23 -20 L0 -30 L21 -17 L28 9 L5 28 L-20 19 L-29 -1Z" fill="none" stroke="${light}" stroke-width="2"/><path d="M-23 -20 L-5 -6 L21 -17 M-5 -6 L5 28 M-5 -6 L-29 -1 M-5 -6 L28 9" fill="none" stroke="#223239" stroke-width="2" opacity=".6"/><path d="M-18 -18 L-5 -23 L-9 -11Z" fill="${light}"/><path d="M-21 15 Q0 32 22 10" fill="none" stroke="#1e2c38" stroke-width="5" opacity=".3"/></g>`;
      const staff = `${panes}
    <path d="M180 40 L325 250 L302 550 H58 L35 250Z" fill="#242532"/>
    <ellipse cx="180" cy="302" rx="134" ry="198" fill="none" stroke="#8b7b97" stroke-width="2"/>
    <path d="M180 119 L90 374 L270 374Z" fill="none" stroke="#88799a" stroke-width="2"/>
    <path d="M180 154 V506 M95 374 Q180 463 265 374" fill="none" stroke="#64516f" stroke-width="8" opacity=".5"/>
    <g transform="rotate(-19 180 320)" stroke="#151d26" stroke-width="4" stroke-linejoin="round">
      <path d="M173 262 H186 L190 491 L179 511 L171 491Z" fill="#494854"/>
      <path d="M181 274 L184 478" fill="none" stroke="#94938f" stroke-width="3"/>
      <path d="M169 479 L180 487 L191 479 L189 501 L180 526 L170 502Z" fill="#67445f"/>
      <path d="M164 249 L177 240 L192 250 L195 265 L182 275 L167 267Z" fill="#72506b"/>
      <path d="M177 249 L146 235 L137 212 L119 216 L129 196 L119 166 L144 179 L150 206 L170 208 L190 190 L208 164 L207 143 L228 166 L221 197 L210 228 L187 251Z" fill="#625967"/>
      <path d="M144 179 L152 216 L174 223 L199 204 L214 177" fill="none" stroke="#aaa0ac" stroke-width="3"/>
      <path d="M219 167 L232 179 L224 191 L238 203 L230 215 L244 227" fill="none" stroke="#a2a29b" stroke-width="5"/>
      <path d="M238 215 L265 234 L268 257 L248 267 L228 248Z" fill="#55394f"/>
      <path d="M238 215 L246 246 L268 257 M246 246 L228 248" fill="none" stroke="#927188" stroke-width="2"/>
    </g>
    ${orb(180, 113, 'Harmonised', '#548fdb', '#c2def6')}
    ${orb(88, 379, 'Eldritch', '#68a74e', '#c4e49d')}
    ${orb(272, 379, 'Volatile', '#df863c', '#ffe0a1')}
    <path d="M71 439 L88 449 L105 439 M255 439 L272 449 L289 439 M165 168 L180 179 L195 168" fill="none" stroke="#a99cb6" stroke-width="1.5"/>`;
      return [awakening, armour, staff, claws, dream, pillars][sceneNumber(index)];
    },
  });

  return { art, shrineMarkup, sceneColors };
};
