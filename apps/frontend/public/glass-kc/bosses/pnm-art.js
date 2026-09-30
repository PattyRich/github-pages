/* PNM-specific SVG scene renderer. No storage, account, or DOM ownership. */
GLASS_RENDERERS.pnm = function createNightmareRenderer(config, { esc, getJournal }) {
  const { palettes, titles } = config;
  const sceneNumber = (index) => index % titles.length;
  // Keep each scene's glass colours when totems and sleepwalkers change display slots.
  const paletteScenes = [0, 1, 2, 3, 5, 4];
  const sceneColors = (index) =>
    palettes[
      (paletteScenes[sceneNumber(index)] + Math.floor(index / titles.length)) % palettes.length
    ];
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
    return `<g data-grasping-hand="true" transform="translate(${x} ${y}) rotate(${tilt}) scale(${scale * facing} ${scale})" stroke="#18212f" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-44 -113 L-71 -131 L-91 -157 L-103 -183 L-103 -205 L-94 -221 L-82 -224 L-74 -213 L-88 -199 L-86 -182 L-71 -162 L-51 -147 L-33 -130Z" fill="#6b7e89"/>
    <path d="M-26 -140 L-46 -170 L-55 -205 L-54 -241 L-42 -261 L-27 -269 L-12 -260 L-10 -247 L-25 -244 L-34 -228 L-31 -205 L-18 -176 L-5 -151Z" fill="#788b96"/>
    <path d="M2 -151 L-5 -188 L-2 -226 L7 -264 L22 -281 L39 -277 L51 -261 L47 -241 L36 -236 L32 -258 L25 -260 L19 -229 L22 -201 L31 -158Z" fill="#899ca4"/>
    <path d="M30 -143 L51 -171 L68 -204 L84 -223 L103 -226 L119 -214 L126 -194 L115 -181 L105 -188 L105 -204 L98 -208 L87 -194 L76 -165 L59 -130Z" fill="#657d89"/>
    <path d="M-36 -88 L-62 -104 L-86 -119 L-111 -118 L-126 -107 L-126 -92 L-116 -83 L-105 -96 L-94 -99 L-77 -82 L-53 -64 L-31 -65Z" fill="#81939b"/>
    <g fill="#182330" stroke="#121c29" stroke-width="2">
      <path d="M-94 -221 L-82 -229 L-68 -220 L-64 -203 L-72 -187 L-78 -202 L-84 -209 L-91 -205Z"/>
      <path d="M-27 -269 L-13 -268 L-3 -254 L-5 -236 L-16 -223 L-14 -245 L-23 -253 L-32 -253Z"/>
      <path d="M39 -277 L51 -263 L54 -245 L44 -225 L34 -221 L39 -242 L33 -258 L25 -262Z"/>
      <path d="M119 -214 L128 -197 L125 -179 L113 -167 L103 -164 L113 -188 L108 -204Z"/>
      <path d="M-126 -107 L-137 -92 L-136 -76 L-123 -61 L-123 -82 L-116 -95 L-111 -102Z"/>
    </g>
    <g fill="#b0bdba" stroke="none">
      <path d="M-93 -205 L-95 -184 L-84 -162 L-73 -147 L-79 -166 L-91 -187Z"/>
      <path d="M-43 -244 L-43 -213 L-36 -188 L-22 -164 L-27 -185 L-37 -214 L-35 -239Z"/>
      <path d="M12 -261 L7 -228 L7 -194 L17 -167 L14 -197 L13 -227 L21 -265Z"/>
      <path d="M82 -205 L67 -171 L49 -145 L59 -149 L77 -175 L91 -205Z"/>
      <path d="M-112 -111 L-91 -111 L-69 -97 L-85 -103 L-104 -104Z"/>
    </g>
    <path d="M-27 6 L-32 -40 L-48 -72 L-57 -109 L-40 -141 L-19 -156 L6 -160 L30 -154 L53 -135 L58 -105 L45 -72 L29 -43 L24 6Z" fill="#637c89"/>
    <path d="M-40 -141 L-19 -156 L6 -160 L30 -154 L16 -128 L-7 -119 L-28 -127Z" fill="#9babaf"/>
    <path d="M-28 -127 L-7 -119 L-10 -80 L-17 -47 L-13 4 L-27 6 L-32 -40 L-48 -72 L-57 -109Z" fill="#7d929c" stroke="none"/>
    <path d="M16 -128 L30 -154 L53 -135 L58 -105 L45 -72 L29 -43 L24 6 L9 5 L14 -54 L32 -84 L36 -109Z" fill="#3e596c" stroke="none"/>
    <path d="M-7 -119 L16 -128 L36 -109 L32 -84 L14 -54 L9 5 L-3 5 L-9 -56 L-10 -80Z" fill="#879da4" stroke="none"/>
    <path d="M-27 5 L-32 -37 L-44 -65 L-37 -65 L-24 -42 L-18 5Z M16 5 L22 -44 L34 -66 L32 -41 L24 6Z" fill="#a57ca3" stroke="none"/>
    <g fill="none">
      <path d="M-91 -178 L-82 -178 M-44 -215 L-34 -216 M5 -230 L18 -228 M72 -184 L83 -179 M-83 -109 L-89 -98" stroke="#455c6d" stroke-width="3"/>
      <path d="M-41 -132 L-25 -135 M-15 -146 L-3 -143 M14 -148 L25 -143 M38 -134 L48 -126" stroke="#d0ccc1" stroke-width="2.2"/>
      <path d="M-37 -115 L-22 -98 L-15 -72 M-20 -108 L-3 -99 L10 -108 L28 -102 M28 -120 L20 -91 L7 -65 L5 -27 M-31 -47 L-11 -39 M9 -38 L24 -44" stroke="#344b5c" stroke-width="2.3"/>
      <path d="M-6 -78 L-4 -52 L1 -14 M-44 -89 L-34 -69 L-29 -63" stroke="#bdc5c0" stroke-width="1.8"/>
      <path d="M-76 -217 L-71 -207 M-13 -259 L-8 -250 M44 -267 L48 -254 M120 -205 L122 -193 M-131 -91 L-131 -80" stroke="#66818e" stroke-width="1.5"/>
    </g>
  </g>`;
  }
  // Wiki File:Inquisitor's_mace_detail.png: flared steel flanges, red spike and collar.
  function inquisitorsMace(x, y, scale = 1, tilt = 0) {
    return `<g data-relic="inquisitors-mace" transform="translate(${x} ${y}) rotate(${tilt}) scale(${scale})" stroke="#302b33" stroke-width="2.2" stroke-linejoin="round">
      <path d="M-7 7 H7 L6 132 L-6 136Z" fill="#777276"/>
      <path d="M-7 7 H-2 L-1 133 L-6 136Z" fill="#a0999b" stroke="none"/>
      <path d="M-6 134 L6 132 L7 175 L-6 177Z" fill="#766444"/>
      <path d="M-4 136 L1 135 V174 L-4 175Z" fill="#998264" stroke="none"/>
      <path d="M-11 174 L10 173 L13 185 L8 194 L-9 194 L-14 183Z" fill="#686168"/>
      <path d="M-9 192 H9 L15 206 L7 220 L-9 216 L-16 204Z" fill="#89828a"/>
      <path d="M1 195 L9 193 L15 206 L7 220 L1 210Z" fill="#514c57" stroke="none"/>
      <path d="M-14 -14 L-20 -40 L-8 -62 L9 -66 L24 -41 L15 -12 L8 1 H-7Z" fill="#78656c"/>
      <path d="M-6 -12 L-27 -23 L-44 -43 L-55 -57 L-57 -81 L-42 -77 L-35 -56 L-18 -45 L-8 -31Z" fill="#8c747c"/>
      <path d="M-35 -56 L-42 -77 L-57 -81 L-56 -93 L-39 -88 L-29 -74 L-25 -57Z" fill="#514b52"/>
      <path d="M-8 -37 L-25 -66 L-26 -87 L-35 -111 L-31 -134 L-11 -139 L-7 -120 L-15 -100 L-9 -83 L4 -64 L6 -35Z" fill="#947d84"/>
      <path d="M-31 -134 L-11 -139 L-7 -120 L-15 -100 L-22 -100 L-18 -124Z" fill="#58525a"/>
      <path d="M7 -38 L15 -72 L28 -91 L31 -114 L45 -119 L56 -106 L48 -88 L31 -66 L24 -36Z" fill="#8b737b"/>
      <path d="M31 -114 L45 -119 L56 -106 L48 -88 L39 -92 L41 -108Z" fill="#554d55"/>
      <path d="M13 -15 L32 -20 L46 -35 L52 -52 L69 -57 L78 -39 L67 -33 L60 -19 L39 -7 L21 -9Z" fill="#857078"/>
      <path d="M52 -52 L69 -57 L78 -39 L67 -33 L61 -42 L48 -35Z" fill="#504b54"/>
      <path d="M-6 -63 L8 -133 L25 -154 L25 -112 L15 -67Z" fill="#84434a"/>
      <path d="M8 -133 L25 -154 L12 -92 L-6 -63Z" fill="#a96062" stroke-width="1.4"/>
      <path d="M15 -67 L25 -112 L25 -154 L32 -132 L27 -99 L22 -69Z" fill="#5c353e"/>
      <path d="M-20 -9 L-11 -18 L10 -14 L23 -2 L16 12 L-8 8Z" fill="#83414a"/>
      <path d="M-20 -9 L-8 -8 L16 12 L-8 8Z" fill="#ad6967" stroke-width="1.2"/>
      <path d="M-20 -31 L-40 -46 M-20 -81 L-16 -66 L-4 -47 M24 -51 L34 -73 M36 -18 L51 -28 M-3 20 V122 M-8 203 L-3 213" fill="none" stroke="#b7a2a4" stroke-width="1.5"/>
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
        if (scene === 4)
          motif = `<path d="M${x} ${y} Q${x + side * 8} 82 180 5" fill="none" stroke="${colors[3]}" stroke-width="3"/><path d="M${x} ${y - 11} l8 11 -8 11 -8 -11Z" fill="${colors[3]}" stroke="${colors[4]}"/><path d="M180 -7 l8 12 -8 12 -8 -12Z" fill="${colors[3]}" stroke="${colors[4]}"/>`;
        if (scene === 1)
          motif = `<g transform="translate(${x} ${y})" stroke="#342e38" stroke-width="1.5"><path d="M-11 -8 L-11 -20 L-4 -14 L0 -23 L5 -14 L11 -20 L12 -7 L9 11 L0 19 L-9 11Z" fill="#93939b"/><path d="M-9 -1 L-2 2 M3 2 L10 -1" stroke="#282e37" stroke-width="2.5"/><path d="M0 4 V12" stroke="#c1b7b2"/></g>`;
        if (scene === 3)
          motif = `<ellipse cx="${x}" cy="${y + 16}" rx="16" ry="5" fill="#11141e" stroke="#82708b" stroke-width="1.5"/>${graspingHand(x, y + 15, 0.17, -side)}`;
        if (scene === 5)
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
        const side = i < 6 ? -1 : 1,
          step = i % 6,
          x = 180 + side * (115 + 18 * Math.sin((step * Math.PI) / 5)),
          y = 186 + step * 62;
        return `<path transform="translate(${x} ${y}) rotate(${side * (25 + step * 12)})" d="M0 -9 Q11 0 0 12 Q-7 1 0 -9Z" fill="${i % 2 ? colors[3] : colors[2]}" stroke="#251d33" stroke-width="2"/>`;
      }).join('');
      // Wiki model reference: the head hangs below a spiked, hunched back; hair is sparse and angular.
      // Shared by the awakening and sleepwalker windows so both keep the same silhouette.
      const face = `<g stroke="#25313c" stroke-width="2" stroke-linejoin="round">
    <path d="M163 199 L185 203 L198 223 L189 246 L170 271 L155 278 L151 263 L138 257 L134 238 L144 214Z" fill="#71808c"/>
    <path d="M144 216 L164 204 L160 234 L148 250 L136 242Z" fill="#98a4ae" stroke="none"/>
    <path d="M164 229 L183 215 L191 232 L178 251 L157 268 L153 257Z" fill="#495c6b" stroke="none"/>
    <path d="M144 248 L154 251 L149 258 L141 256Z M162 251 L180 240 L172 254 L160 259Z" fill="#342939" stroke-width="1.2"/>
    <path d="M144 251 L152 252 L148 255Z M164 251 L176 246 L170 252Z" fill="#d55099" stroke="none"/>
    <path d="M157 255 L151 267 L160 264 L164 268 L151 274 L148 269" fill="#637783" stroke-width="1.4"/>
    <path d="M154 278 L164 274 L160 282 L151 285Z" fill="#36434e" stroke-width="1.3"/>
    <path d="M139 210 L164 187 L185 190 L205 211 L203 230 L190 226 L180 206 L158 208 L142 225 L131 267 L132 302 L121 273 L127 234Z" fill="#aeb7c4"/>
    <path d="M164 189 L153 211 L139 221 L143 235 L130 285 L132 315 L120 277 L125 235 L138 213Z" fill="#c1c9d1" stroke-width="1.4"/>
    <path d="M179 198 L193 207 L184 219 L191 244 L177 303 L174 274 L171 237 L161 218Z" fill="#d1d4d8" stroke-width="1.4"/>
    <path d="M192 211 L203 220 L206 253 L217 322 L202 293 L191 250 L183 223Z" fill="#b5bcc8" stroke-width="1.4"/>
    <path d="M140 215 L133 238 L127 273 M181 227 L184 248 L179 280 M197 240 L207 291" fill="none" stroke="#8b99ad" stroke-width="1.2"/>
  </g>`;
      const boss = `<g stroke="#202d37" stroke-width="2.6" stroke-linejoin="round">
    <path d="M196 288 L181 343 L160 374 L170 400 L166 455 L157 486 L169 509 L191 503 L194 476 L186 439 L188 404 L181 374 L214 337 L231 287Z" fill="#475b69"/>
    <path d="M188 326 L164 373 L176 390 L186 372 L211 337Z M170 402 L186 415 L179 444 L166 458Z" fill="#617581" stroke-width="1.5"/>
    <path d="M221 290 L214 336 L208 369 L214 393 L230 401 L253 425 L253 450 L273 454 L280 433 L267 406 L244 382 L232 376 L240 330 L244 287Z" fill="#566a76"/>
    <path d="M232 376 L218 392 L231 400 L255 426 L267 423 L252 400Z" fill="#3b4e5e" stroke-width="1.5"/>
    <path d="M168 405 L187 403 L188 417 L170 432Z M168 446 L183 438 L189 454 L163 472Z M161 480 L191 468 L194 487 L170 499Z M216 329 L240 326 L237 344 L213 349Z M211 355 L234 349 L233 365 L208 369Z" fill="#7f7959" stroke-width="1.5"/>
    <path d="M170 407 L185 406 M167 450 L181 443 M165 485 L188 476 M218 333 L237 330" stroke="#a3986b" stroke-width="1.6"/>
    <path d="M158 487 L177 484 L192 498 L193 516 L180 524 L151 521 L145 513Z M254 443 L271 447 L272 467 L260 478 L235 477 L230 471 L242 465Z" fill="#607481"/>
    <path d="M148 510 L158 511 L157 520 L148 516Z M161 511 L173 512 L172 522 L159 521Z M177 512 L186 510 L185 520 L175 524Z M234 469 L243 470 L241 476 H231Z M246 469 L256 469 L254 477 H243Z" fill="#302f3c" stroke-width="1"/>
    <path d="M133 185 L160 155 L196 144 L227 157 L252 186 L247 243 L231 292 L219 333 L203 321 L195 286 L170 248Z" fill="#354855"/>
    <path d="M228 184 L245 199 L237 240 L216 270 L209 305 L198 289 L200 243Z" fill="#657480" stroke-width="1.5"/>
    <path d="M170 186 L194 177 L227 188 L235 217 L219 248 L207 276 L217 350 L201 325 L190 275 L178 253 L166 223Z" fill="#885866"/>
    <path d="M191 185 L224 193 L231 214 L208 232 L178 225Z" fill="#a26b79" stroke-width="1.5"/>
    <path d="M181 237 L210 242 L201 267 L207 311 L193 287 L186 260Z" fill="#6d4556" stroke-width="1.5"/>
    <path d="M138 180 L153 195 L120 240 L94 268 L72 308 L60 349 L48 345 L59 301 L81 263 L109 230Z" fill="#526775"/>
    <path d="M139 188 L116 235 L86 267 L64 307 L59 328 L57 305 L80 260 L108 228Z" fill="#75838e" stroke="none"/>
    <path d="M233 178 L260 195 L277 224 L281 279 L293 339 L283 355 L272 338 L269 280 L260 236 L231 206Z" fill="#5b6e7b"/>
    <path d="M248 197 L268 226 L272 280 L286 339 L293 339 L281 278 L277 224 L260 195Z" fill="#7b8992" stroke="none"/>
    <path d="M60 332 L68 350 L64 379 L59 386 L60 363 L55 358 L51 386 L54 425 L45 407 L43 382 L46 360 L39 384 L40 414 L33 397 L34 374 L42 350 L49 340Z" fill="#465c6b" stroke-width="2"/>
    <path d="M285 332 L296 345 L302 375 L304 405 L298 422 L298 387 L290 368 L293 402 L285 437 L284 410 L281 384 L272 406 L259 427 L266 401 L270 375 L276 350Z" fill="#435968" stroke-width="2"/>
    <path d="M49 351 L43 379 M57 347 L62 357 L61 371 M283 349 L278 377 L273 394 M291 354 L297 378" fill="none" stroke="#81919a" stroke-width="1.5"/>
    <path d="M118 180 L130 170 L116 158 L139 160 L148 129 L153 156 L168 119 L174 149 L193 108 L197 143 L214 122 L218 152 L235 143 L233 165 L255 173 L244 181 L264 200 L238 197 L246 213 L219 202 L199 182 L175 172 L151 170 L134 187Z" fill="#1b303e"/>
    <path d="M130 166 L148 144 L149 166 L165 158 L169 139 L174 164 L192 132 L193 169 L209 159 L215 146 L219 176 L237 166 L230 186 L244 194 L219 193 L197 177 L174 168 L148 169Z" fill="#293f4f" stroke-width="1.3"/>
    <path d="M197 143 L210 131 L214 159Z M220 154 L234 147 L230 172Z" fill="#624756" stroke-width="1.3"/>
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
      // Layer the broken paving, portal depth and rim in front of each reaching wrist.
      const portal = (x, y, scale, handScale, facing, tilt) => `<g data-claw-portal="true">
    <g transform="translate(${x} ${y}) scale(${scale})">
      <ellipse rx="94" ry="37" fill="#b46aab" opacity=".12"/>
      <path d="M-88 1 L-73 -15 L-57 -15 L-43 -27 L-22 -22 L-4 -29 L17 -24 L34 -29 L51 -18 L71 -17 L87 -4 L78 12 L60 15 L46 29 L23 25 L5 32 L-19 26 L-39 31 L-53 20 L-75 20Z" fill="#222534" stroke="#786781" stroke-width="1.5"/>
      <ellipse rx="72" ry="24" fill="#775271"/>
      <ellipse cy="-1" rx="66" ry="20" fill="#070c18" stroke="#252139" stroke-width="3"/>
      <path d="M-60 -9 Q-29 -25 12 -17 M35 -15 Q54 -12 63 -5" fill="none" stroke="#bb8aba" stroke-width="1.8"/>
      <path d="M-82 -7 L-103 -17 L-109 -31 L-126 -36 M-101 -17 L-117 -14 M76 -10 L96 -24 L103 -41 M93 -23 L116 -26 M-55 24 L-67 40 L-61 50 L-79 62 M-67 40 L-88 42 M42 26 L56 44 L49 59 L65 73 M56 44 L76 47" fill="none" stroke="#151f2d" stroke-width="2.4"/>
      <path d="M-80 1 L-93 -8 M74 4 L88 -4 M-45 25 L-55 34 M34 27 L43 37" fill="none" stroke="#a77a9f" stroke-width="1.4"/>
    </g>
    ${graspingHand(x, y, handScale, facing, tilt)}
    <g transform="translate(${x} ${y}) scale(${scale})" stroke-linejoin="round">
      <path d="M-67 3 Q-31 29 6 21 Q42 23 67 3 L62 16 L47 22 L37 28 L15 25 L-3 30 L-24 24 L-42 26 L-52 18 L-64 14Z" fill="#382c46" stroke="#1d2233" stroke-width="1.8"/>
      <path d="M-55 13 Q-22 28 13 23 M27 21 L48 16" fill="none" stroke="#c08ab4" stroke-width="2"/>
      <path d="M-85 14 L-73 5 L-64 13 L-71 24Z M62 -18 L72 -27 L81 -22 L77 -11Z M40 33 L53 30 L59 39 L45 42Z" fill="#88828d" stroke="#293244" stroke-width="1.5"/>
      <path d="M-85 14 L-73 5 L-70 14 M62 -18 L72 -27 L75 -20 M40 33 L53 30" fill="none" stroke="#b4a7b2" stroke-width="1.3"/>
    </g>
  </g>`;
      const claws = `${panes}
    <path d="M20 550 V220 Q20 92 180 18 Q340 92 340 220 V550Z" fill="#182738" opacity=".9"/>
    <path d="M41 335 V232 Q41 132 180 52 Q319 132 319 232 V335 L288 315 V235 Q288 160 180 93 Q72 160 72 235 V315Z" fill="#294453" stroke="#172536" stroke-width="2"/>
    <path d="M54 325 V228 Q54 141 180 68 Q306 141 306 228 V325" fill="none" stroke="#6a7589" stroke-width="1.6"/>
    <path d="M64 260 L121 169 L180 125 L239 169 L296 260 L247 330 H112Z" fill="#493452" opacity=".65"/>
    <path d="M20 328 L94 288 L180 275 L266 288 L340 328 V550 H20Z" fill="#353d4d" stroke="#172737" stroke-width="2"/>
    <g stroke="#202b3b" stroke-width="2" stroke-linejoin="round">
      <path d="M20 328 L94 288 L83 343 L20 377Z M94 288 L180 275 L177 335 L83 343Z M180 275 L266 288 L277 343 L177 335Z M266 288 L340 328 V377 L277 343Z" fill="#515367"/>
      <path d="M20 377 L83 343 L62 411 L20 449Z M83 343 L177 335 V408 L62 411Z M177 335 L277 343 L301 411 L177 408Z M277 343 L340 377 V449 L301 411Z" fill="#41495b"/>
      <path d="M20 449 L62 411 L118 419 L108 485 L20 506Z M118 419 L242 419 L254 485 H108Z M242 419 L301 411 L340 449 V506 L254 485Z" fill="#565064"/>
      <path d="M20 506 L108 485 L91 550 H20Z M108 485 H254 L272 550 H91Z M254 485 L340 506 V550 H272Z" fill="#43475a"/>
    </g>
    <path d="M20 336 L89 302 L113 298 L87 363 L20 401 M340 336 L271 302 L247 298 L276 363 L340 401" fill="none" stroke="#587a7c" stroke-width="5"/>
    <g fill="none" stroke="#1c2839" stroke-width="2.2" stroke-linecap="round">
      <path d="M69 323 L57 343 L64 359 L46 376 M57 343 L39 347 M286 320 L298 337 L289 352 L304 367 M298 337 L322 343 M183 445 L166 464 L172 479 L155 499 M166 464 L146 461 M197 483 L211 503 L205 523 L224 543 M211 503 L237 510"/>
    </g>
    <g fill="#928393" stroke="#2d3044" stroke-width="1.6">
      <path d="M85 385 L99 371 L107 382 L101 397Z M264 400 L277 385 L284 401 L273 412Z M109 444 L119 435 L123 447 L115 452Z"/>
      <path d="M82 350 L87 339 L95 345 L91 357Z M259 352 L269 341 L274 352 L268 361Z"/>
    </g>
    <path d="M89 385 L99 376 M269 398 L277 389 M113 444 L119 439" fill="none" stroke="#c6a9ba" stroke-width="1.5"/>
    ${portal(179, 405, 1.13, 1.01, 1, -8)}
    ${portal(283, 493, 0.63, 0.48, -1, 19)}
    ${portal(77, 505, 0.65, 0.5, 1, -21)}
    <path d="M140 514 L151 502 L160 511 L156 525Z M232 537 L242 525 L256 532 L251 544Z" fill="#777083" stroke="#273043" stroke-width="1.8"/>
    <path d="M145 514 L151 506 M239 537 L245 529" fill="none" stroke="#b39aaa" stroke-width="1.4"/>`;
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
    ${inquisitorsMace(74, 289, 0.93, 7)}
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
      return [awakening, armour, staff, claws, pillars, dream][sceneNumber(index)];
    },
  });

  return { art, shrineMarkup, sceneColors };
};
