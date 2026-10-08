/* Theatre-only original SVG artwork, drawn after inspecting the OSRS Wiki models:
 * Scythe_of_Vitur_detail, Verzik_Vitur_(final_form), Nylocas_Ischyros,
 * Nylocas_Toxobolos, Nylocas_Hagios, Nylocas_Matomenos, The_Maiden_of_Sugadinti, Sotetseg,
 * and Justiciar_armour_equipped_male. Subject colours stay fixed across editions.
 */
let justiciarShineInstance = 0;
GLASS_RENDERERS.tob = function createTheatreRenderer(config, { esc, getJournal }) {
  const sceneNumber = (index) => index % config.titles.length;
  // Move Sotetseg before Maiden without changing either scene's edition colours.
  const paletteScenes = [0, 1, 2, 4, 3, 5];
  const sceneColors = (index) =>
    config.palettes[
      (paletteScenes[sceneNumber(index)] + Math.floor(index / config.titles.length)) %
        config.palettes.length
    ];
  const path = (d, fill, stroke = '#292329', width = 2.4) =>
    `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`;
  const line = (d, stroke = '#bda087', width = 1.8) => path(d, 'none', stroke, width);
  const ellipse = (x, y, rx, ry, fill, stroke = '#292329', width = 2.4) =>
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
  const ring = (x, y, r, color) => ellipse(x, y, r, r, 'none', color, 1.5);

  function sigil(x, y, scale = 1, kind = 0) {
    const marks = [
      'M-12 -6 Q-2 -17 11 -10 L4 -7 M3 -11 L3 13',
      'M-11 2 L-10 -10 L-3 -4 L0 -14 L4 -4 L11 -10 L10 2Z M-10 7 H10',
      'M-12 0 H12 M0 -12 V12 M-9 -9 L9 9 M-9 9 L9 -9 M-6 -6 H6 V6 H-6Z',
      'M-11 -11 H11 V0 H0 V11 H-11 V-2 H-3 V-6 H6',
      'M0 -13 Q-14 3 -7 10 Q0 17 7 10 Q14 3 0 -13Z',
      'M0 -14 L4 -4 L13 0 L4 4 L0 14 L-4 4 L-13 0 L-4 -4Z',
    ];
    return `<g transform="translate(${x} ${y}) scale(${scale})">${path('M0 -25 L21 -12 V13 L0 26 L-21 13 V-12Z', '#542b38', '#b39a69', 2)}${path('M0 -19 L15 -9 V9 L0 19 L-15 9 V-9Z', '#812f44', '#34252e', 1.5)}${line(marks[kind], '#e3c999', 2)}</g>`;
  }

  function scythe() {
    // Keep animated drops outside the weapon, including its bounds and placement.
    const drips = [
      [43, 265],
      [67, 213],
      [94, 179],
    ]
      .map(([x, y], index) => {
        const begin = `${index * 0.25}s`;
        return `<g transform="translate(${x} ${y})"><g opacity="0" data-scythe-drip>
          <animateTransform attributeName="transform" type="translate" values="0 0;0 0;0 135;0 135;0 0;0 0" keyTimes="0;.24;.6;.7;.9;1" dur="9s" begin="${begin}" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0;0;.9;.9;0;0" keyTimes="0;.235;.245;.49;.6;1" dur="9s" begin="${begin}" repeatCount="indefinite"/>
          <path d="M0 -6 C-1 -2 -4 2 -4 5 C-4 11 4 11 4 5 C4 2 1 -2 0 -6Z" fill="#b43a45" stroke="#702839" stroke-width="1.2"/>
          <path d="M-1 1 Q-3 5 -1 7" fill="none" stroke="#e27370" stroke-width="1"/>
        </g></g>`;
      })
      .join('');
    return `<g data-relic="scythe-of-vitur">
      ${path('M192 252 L204 250 L261 494 L257 512 L248 503Z', '#a5a1a4')}
      ${path('M201 256 L205 266 L258 493 L253 504 L249 481Z', '#6c666c', '#6c666c', 1)}
      ${path('M246 486 L262 482 L272 501 L268 519 L250 519 L243 505Z', '#514a50')}
      ${path('M256 481 L267 469 L282 479 L289 499 L270 492Z', '#912d34')}
      ${line('M251 489 L260 497 L257 511', '#8c828b', 2)}
      ${path('M190 107 L194 135 L183 154 L177 168 L185 195 L204 220 L206 248 L195 264 L184 244 L176 218 L159 193 L157 173 L164 150 L174 136 L173 107Z', '#413a40')}
      ${path('M177 160 L183 166 L174 178 L181 195 L204 220 L198 231 L180 213 L165 188 L165 174Z', '#777077', '#514950', 1.6)}
      ${path('M190 168 L212 173 L224 194 L218 219 L208 217 L212 195 L205 186 L190 185Z', '#565056')}
      ${path('M190 141 L204 145 L203 154 L193 158 L182 153 L175 164 L166 158 L176 147Z M184 225 L201 219 L211 230 L213 246 L198 253 L187 248Z', '#942e35')}
      ${path('M202 159 L220 156 L233 164 L230 184 L218 191 L203 181 L198 169Z', '#6e676c')}
      ${path('M205 162 L216 161 L216 169 L205 171Z M222 162 L229 166 L226 174 L219 170Z', '#252127', '#252127', 1)}
      ${path('M211 178 L217 173 L224 177 L221 186 L216 181 L212 188Z', '#b8b0b3', '#514950', 1)}
      ${path('M176 147 L171 133 L172 104 L182 90 L194 94 L194 126 L205 135 L195 145Z', '#50494f')}
      ${path('M182 90 L186 78 L196 88 L194 103Z', '#912d34')}
      ${path('M182 102 L148 101 L112 111 L82 129 L57 151 L37 180 L42 239 L54 187 L83 158 L117 142 L151 133 L181 135Z', '#9c9598', '#29252a', 3)}
      ${path('M42 239 L51 182 L82 149 L116 130 L153 121 L181 121 L181 135 L151 133 L117 142 L83 158 L54 187Z', '#c6bfc1', '#877f84', 1.3)}
      ${path('M37 180 L57 151 L82 129 L112 111 L148 101 L182 102 L180 109 L150 109 L115 119 L86 136 L62 158 L46 180Z', '#59525b', '#29252a', 1.3)}
      ${line('M55 178 L91 147 L126 133 L167 126', '#e0d1cd', 1.5)}
      ${path('M42 239 L49 194 L55 184 L63 177 L67 176 L63 170 L73 163 L83 158 L96 151 L104 147 L100 141 L112 142 L117 142 L91 154 L77 168 L63 183 L54 187Z', '#992c3c', '#672536', 1.2)}
      ${path('M52 201 L56 184 L67 175 L65 183 L59 190 L55 209Z M82 158 L94 151 L97 146 L105 146 L92 157Z', '#c84a50', '#a33440', 0.8)}
      ${path('M42 236 L44 248 L48 258 Q48 268 43 270 Q36 265 39 257 L41 249Z M65 179 L66 195 L71 206 Q73 214 68 216 Q61 213 63 206 L64 194Z M94 154 L94 166 L97 174 Q99 180 94 182 Q89 180 91 173 L93 166Z', '#a72f40', '#5c2635', 1.3)}
      ${line('M42 260 L43 265 M67 207 L68 212 M94 175 V178', '#e27370', 1.3)}
      ${line('M192 196 L200 206 M185 230 L198 236 M198 262 L208 302', '#c1b6b8', 1.5)}
    </g><g data-art-effect="scythe-blood-drips">${drips}</g>`;
  }

  function verzikLegMotion(svg, side, front) {
    const clamp = (value) => Math.max(0, Math.min(1, value));
    const pose = (d, dx, dy, degrees, leading, strength = 1) =>
      d.replace(/([ML])\s*([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+)/g, (_, command, rawX, rawY) => {
        const x = Number(rawX),
          y = Number(rawY);
        const radians = (degrees * Math.PI) / 180;
        const movedX = side * (side * x * Math.cos(radians) - y * Math.sin(radians) + dx);
        const movedY = side * x * Math.sin(radians) + y * Math.cos(radians) + dy;
        // Hip vertices follow the abdomen. Lower rear tips stay planted while knees flex.
        const hip = clamp((65 - x) / 40);
        const knee = clamp((x - 30) / 45) * clamp((150 - y) / 95);
        const foot = front ? clamp((y - 110) / 73) : 0;
        const active = side === leading;
        const nx =
          x +
          (movedX - x) * hip +
          knee * (active ? 5 : -3) * strength +
          foot * (active ? 8 : 0) * strength;
        const ny =
          y +
          (movedY - y) * hip +
          knee * (active ? -13 : 4) * strength -
          foot * (active ? 9 : 0) * strength;
        return command + Number(nx.toFixed(2)) + ' ' + Number(ny.toFixed(2));
      });
    return svg.replace(/<path\b[^>]*\bd="([^"]+)"[^>]*\/>/g, (tag, d) => {
      const right = pose(d, 6, -6, 2.2, 1);
      const planted = pose(d, 2, -2, 0.7, 1, 0.12);
      const left = pose(d, -5, -4, -1.8, -1);
      return (
        tag.slice(0, -2) +
        '><animate attributeName="d" values="' +
        [d, d, right, planted, left, d, d].join(';') +
        '" keyTimes="0;.12;.3;.44;.61;.78;1" dur="13.2s" repeatCount="indefinite"/></path>'
      );
    });
  }

  function matomenosLegMotion(svg, side, begin = 0) {
    // A 0.42-second gait is active only during the approach and crossing.
    const frames = [{ time: 0, angle: 0 }];
    for (const [start, end] of [
      [0.75, 3.45],
      [4.95, 10.05],
    ]) {
      frames.push({ time: start, angle: 0 });
      let step = 0;
      for (let time = start + 0.105; time < end - 0.06; time += 0.105)
        frames.push({ time, angle: [1, 0, -1, 0][step++] });
      frames.push({ time: end, angle: 0 });
    }
    frames.push({ time: 15, angle: 0 });
    const keys = frames.map((frame) => (frame.time / 15).toFixed(5)).join(';');
    const ink = '#84271f';
    const crease = line('M47 -19 L49 -9 M73 8 L79 19 M63 35 L67 46 M24 43 L24 53', ink, 0.8);
    const creases = ['M47 -19 L49 -9', 'M73 8 L79 19', 'M63 35 L67 46', 'M24 43 L24 53'];
    const starts = ['<path d="M17 2', '<path d="M21 10', '<path d="M22 20', '<path d="M8 25'];
    const pivots = ['23 5', '25 15', '19 30', '5 34'];
    const cleaned = svg.replace(crease, '');
    const offsets = starts.map((start) => cleaned.indexOf(start));
    offsets.push(cleaned.lastIndexOf('</g>'));
    if (offsets.some((offset) => offset < 0)) throw new Error('Matomenos leg geometry changed');
    let result = cleaned.slice(0, offsets[0]);
    for (let index = 0; index < 4; index++) {
      const direction = side * (index % 2 ? -1 : 1);
      const values = frames
        .map((frame) => frame.angle * direction * (index === 3 ? 16 : 12) + ' ' + pivots[index])
        .join(';');
      result +=
        '<g data-matomenos-leg="' +
        index +
        '"><animateTransform attributeName="transform" type="rotate" values="' +
        values +
        '" keyTimes="' +
        keys +
        '" dur="15s" begin="' +
        begin +
        's" repeatCount="indefinite"/>' +
        cleaned.slice(offsets[index], offsets[index + 1]) +
        line(creases[index], ink, 0.8) +
        '</g>';
    }
    return result + cleaned.slice(offsets[4]);
  }

  function scurryingMatomenos() {
    // Three resting positions survive reduced motion. Staggered cycles keep each gait and
    // shadow together, with the middle crab on the lower foreground lane.
    const crabs = [
      { x: 270, y: 491, scale: 0.42, begin: 0 },
      { x: 180, y: 511, scale: 0.38, begin: -13.7 },
      { x: 96, y: 497, scale: 0.4, begin: -12.4 },
    ];
    return crabs
      .map(({ x, y, scale, begin }, index) => {
        const farY = y + 7;
        const values =
          '-70 ' +
          farY +
          ';-70 ' +
          farY +
          ';' +
          x +
          ' ' +
          y +
          ';' +
          x +
          ' ' +
          y +
          ';435 ' +
          farY +
          ';435 ' +
          farY +
          ';435 ' +
          farY;
        return (
          '<g data-matomenos-travel="true" data-matomenos-index="' +
          index +
          '" transform="translate(' +
          x +
          ' ' +
          y +
          ')">' +
          '<animateTransform attributeName="transform" type="translate" values="' +
          values +
          '" keyTimes="0;.05;.23;.33;.67;.76;1" dur="15s" begin="' +
          begin +
          's" repeatCount="indefinite"/>' +
          '<g opacity=".48">' +
          ellipse(
            0,
            27 * (scale / 0.42),
            37 * (scale / 0.42),
            6 * (scale / 0.42),
            '#672a2d',
            '#672a2d',
            1
          ) +
          '</g>' +
          nylocas(0, 0, scale, 3, false, true, begin) +
          '</g>'
        );
      })
      .join('');
  }
  function verzik() {
    // The final form's raised knees and spear tips make four legs on each side.
    const rearLegs = [-1, 1]
      .map((side) =>
        verzikLegMotion(
          `<g transform="translate(180 357) scale(${side} 1)">
        ${path('M39 -20 L75 -39 L112 -63 L131 -106 L135 -64 L115 -29 L79 -9 L37 6Z', '#39353c', '#292329', 3)}
        ${path('M74 -39 L112 -63 L131 -106 L122 -57 L103 -39 L78 -22Z', '#514950', '#39343c', 1.3)}
        ${path('M45 1 L84 -3 L117 -21 L151 -68 L148 -4 L138 50 L120 102 L125 48 L129 11 L112 2 L83 19 L44 20Z', '#40393f', '#292329', 3)}
        ${path('M117 -21 L151 -68 L136 -4 L125 48 L120 102 L113 48 L113 18 L96 18Z', '#554b53', '#332c34', 1.5)}
        ${path('M31 20 L67 47 L98 30 L123 -10 L129 47 L120 109 L100 157 L105 104 L100 70 L82 73 L59 70 L23 37Z', '#393239', '#292329', 3)}
        ${path('M98 30 L123 -10 L117 49 L112 96 L100 157 L96 108 L91 81 L82 73Z', '#51464e', '#332c34', 1.4)}
        ${path('M63 43 L81 56 L96 48 L100 70 L82 73 L59 70Z M81 -3 L97 -12 L112 -8 L108 6 L85 19Z', '#665960', '#332c34', 1.3)}
        ${line('M47 -14 L78 -27 L104 -44 M49 10 L80 8 L109 -6 M36 28 L64 57 L82 61', '#85747f', 1.2)}
      </g>`,
          side,
          false
        )
      )
      .join('');
    const frontLegs = [-1, 1]
      .map((side) =>
        verzikLegMotion(
          `<g transform="translate(180 357) scale(${side} 1)">
        ${path('M35 22 L53 40 L57 -12 L72 -59 L77 5 L73 77 L63 132 L51 183 L47 127 L48 82 L34 54 L22 39Z', '#40373f', '#292329', 3)}
        ${path('M57 -12 L72 -59 L67 21 L62 80 L51 183 L47 127 L48 82 L50 46Z', '#5a4c55', '#393039', 1.4)}
        ${path('M35 22 L50 46 L48 67 L35 55 L22 39Z', '#66565f', '#332b33', 1.3)}
        ${line('M59 44 L55 91 L53 120', '#8b7682', 1.1)}
      </g>`,
          side,
          true
        )
      )
      .join('');
    return `${rearLegs}<g data-verzik-weight-shift="true"><animateTransform attributeName="transform" type="translate" values="0 0;0 0;6 -6;2 -2;-5 -4;0 0;0 0" keyTimes="0;.12;.3;.44;.61;.78;1" dur="13.2s" repeatCount="indefinite"/><g><animateTransform attributeName="transform" type="rotate" values="0 180 357;0 180 357;2.2 180 357;.7 180 357;-1.8 180 357;0 180 357;0 180 357" keyTimes="0;.12;.3;.44;.61;.78;1" dur="13.2s" repeatCount="indefinite"/>
      ${path('M177 96 L199 102 L238 132 L263 177 L280 232 L277 287 L262 332 L234 373 L198 394 L141 381 L106 352 L85 308 L79 259 L84 206 L108 156 L139 122Z', '#3a333d', '#292329', 4)}
      ${path('M177 96 L164 120 L131 153 L110 208 L103 261 L117 315 L148 349 L195 371 L233 355 L259 315 L266 257 L252 197 L227 154 L199 123Z', '#543a66', '#382c43', 2)}
      ${path('M164 120 L139 142 L111 182 L94 232 L91 279 L113 328 L148 349 L126 298 L126 239 L143 185Z', '#755783', '#543a66', 1.5)}
      ${path('M177 96 L199 123 L227 154 L252 197 L266 257 L259 315 L233 355 L195 371 L216 318 L225 253 L213 192 L197 147Z', '#493251', '#382c43', 1.6)}
      ${path('M177 123 L164 166 L146 221 L155 283 L177 326 L208 341 L219 286 L213 232 L197 176Z', '#614570', '#4c345a', 1.4)}
      ${path('M176 97 L181 76 L187 101 M139 122 L129 109 L127 133 M107 158 L88 154 L94 178 M83 213 L68 211 L80 231 M81 277 L66 287 L88 300 M110 350 L98 367 L130 374 M237 132 L257 128 L250 153 M273 210 L295 215 L280 235 M277 284 L296 298 L268 311 M243 362 L253 381 L224 383', '#8a8956', '#37333a', 1.8)}
      ${path('M178 161 L191 201 L217 232 L263 269 L254 299 L242 313 L237 283 L176 238 L116 284 L111 312 L98 296 L95 270 L145 223 L166 192Z', '#c8ad22', '#302933', 3)}
      ${path('M178 161 L170 204 L152 235 L105 277 L95 270 L145 223 L166 192Z M170 204 L176 224 L215 257 L249 278 L263 269 L217 232 L191 201Z', '#ebd242', '#aa9223', 1.1)}
      ${path('M105 277 L116 284 L111 312 L104 289Z M249 278 L242 313 L254 299 L263 269Z', '#978332', '#786b32', 1.1)}
      ${path('M151 322 L162 315 H191 L208 324 L215 350 L223 387 L216 414 L193 444 L177 458 L151 442 L135 414 L137 380 L140 348Z', '#568492', '#302c36', 2.8)}
      ${path('M140 348 L160 330 L176 353 L149 365 L138 361Z M176 353 L193 329 L212 345 L214 361 L194 367Z', '#79a1ad', '#466b7a', 1.6)}
      ${path('M142 371 L173 375 L210 370 L220 387 L198 407 L171 420 L139 402 L136 387Z', '#78a0ad', '#4b7280', 1.6)}
      ${path('M139 402 L171 420 L198 407 L216 396 L211 417 L188 439 L169 444 L149 428Z', '#5c899b', '#426a7b', 1.5)}
      ${path('M149 428 L169 444 L188 439 L211 417 L193 444 L177 458 L151 442Z', '#355b6e', '#304754', 1.5)}
      ${path('M151 317 L134 319 L121 338 L116 358 L125 375 L147 382 L151 371 L133 361 L137 347 L153 337Z M192 317 L209 321 L222 339 L230 359 L221 373 L199 382 L194 371 L213 360 L207 345 L191 336Z', '#b2adc6', '#39303f', 2.3)}
      ${path('M133 323 L125 341 L125 357 L135 368 L144 372 L139 379 L125 375 L116 358 L121 338Z M209 321 L222 339 L230 359 L221 373 L210 377 L202 372 L217 360 L210 345Z', '#85819e', '#6c637e', 1.2)}
      ${path('M147 369 L156 371 L162 380 L151 375 L159 387 L146 379 L149 391 L137 379 L128 376 L133 364Z M200 368 L190 372 L182 380 L194 376 L185 388 L198 380 L196 391 L209 378 L221 373 L214 363Z', '#aaa4bf', '#494052', 1.6)}
      ${line('M141 372 L146 379 M205 371 L201 379', '#d4c9db', 1.1)}
      ${path('M157 313 L170 305 L187 307 L195 320 L184 331 L169 329 L157 321Z', '#aaa5bd', '#655976', 1.5)}
      ${path('M154 266 L160 249 L173 242 L188 248 L198 262 L198 281 L191 303 L180 320 L167 319 L155 307 L151 286Z', '#b7b4cc', '#47364f', 2.4)}
      ${path('M173 242 L188 248 L198 262 L198 281 L191 303 L180 320 L173 307 L182 295 L179 284 L183 274 L174 263Z', '#9692b0', '#716780', 1.2)}
      ${path('M157 255 L163 251 L171 263 L174 271 L166 266 L157 266Z M178 256 L188 252 L197 262 L188 267 L177 272Z', '#d0cadb', '#a59fb8', 1.2)}
      ${path('M154 280 L160 273 L170 277 L174 286 L164 281 L154 287Z M178 276 L188 272 L198 277 L190 286 L177 290Z M157 300 L164 291 L174 296 L177 305 L166 301 L160 309Z M181 294 L191 291 L188 302 L179 308Z', '#cac4d6', '#a19ab4', 1.1)}
      ${path('M156 262 L164 265 L170 271 L160 269Z M179 266 L192 262 L187 269 L178 274Z M157 280 L164 282 L170 287 L160 286Z M180 284 L191 278 L186 286 L177 290Z M161 299 L167 301 L172 305 L163 306Z M180 302 L189 297 L185 306 L178 309Z', '#722f42', '#453044', 1.2)}
      ${line('M159 264 L165 267 M181 269 L188 265 M160 282 L166 285 M181 286 L187 282 M164 301 L168 303 M180 305 L185 302', '#e97480', 1.5)}
      ${path('M168 311 L174 313 L184 308 L181 317 L173 321 L167 318Z', '#783547', '#513247', 1.1)}
      ${line('M170 314 L174 316 L180 313', '#e2c8d5', 1.2)}
      </g></g>${frontLegs}`;
  }

  function verzikMotes() {
    // Poison and silk become small luminous glass fragments around the silhouette.
    const motes = [
      [65, 264, 3.5, true],
      [53, 324, 7, true],
      [78, 375, 2.5, false],
      [42, 407, 3.5, false],
      [83, 453, 5, true],
      [104, 503, 3, true],
      [138, 532, 2.5, false],
      [286, 255, 3, false],
      [305, 307, 4, true],
      [281, 354, 2.5, true],
      [306, 403, 6, true],
      [273, 450, 3.5, false],
      [284, 492, 4.5, true],
      [234, 526, 3, false],
    ]
      .map(([x, y, size, poison], i) => {
        const dark = poison ? '#496619' : '#716780';
        const light = poison ? '#b9d783' : '#d4c9db';
        const fragment = poison
          ? `${ellipse(0, 0, size, size, '#688b20', dark, 0.9)}${path(`M0 ${-size} L${size} 0 L0 ${size * 0.65}Z`, '#96b63c', '#96b63c', 0.4)}${line(`M${-size * 0.55} 0 Q${-size * 0.5} ${-size * 0.65} 0 ${-size * 0.65}`, light, 1)}${ring(0, 0, size + 3, '#96b63c')}`
          : path(
              `M0 ${-size} L${size * 0.28} ${-size * 0.28} L${size} 0 L${size * 0.28} ${size * 0.28} L0 ${size} L${-size * 0.28} ${size * 0.28} L${-size} 0 L${-size * 0.28} ${-size * 0.28}Z`,
              light,
              dark,
              0.7
            );
        return `<g transform="translate(${x} ${y})"><g class="verzik-mote" style="animation-duration:${7 + (i % 5)}s;animation-delay:-${i * 1.7}s">${fragment}</g></g>`;
      })
      .join('');
    return `<g pointer-events="none" aria-hidden="true">
      <style>
        .verzik-mote { opacity: .76; animation: verzik-mote-drift 8s ease-in-out infinite; }
        @keyframes verzik-mote-drift {
          0%, 100% { transform: translate(0, 3px); opacity: .5; }
          50% { transform: translate(2px, -6px); opacity: .94; }
        }
        @media (prefers-reduced-motion: reduce) { .verzik-mote { animation: none; } }
      </style>
      <g opacity=".34">${line('M73 495 Q41 464 52 425 M48 393 Q34 364 49 348 M290 494 Q315 467 307 441 M313 375 Q327 342 311 323', '#96b63c', 1.3)}${line('M43 450 Q26 420 38 401 M292 287 Q313 274 309 253', '#b2adc6', 1.1)}</g>
      ${motes}
    </g>`;
  }

  function nylocas(x, y, scale, type, animated = false, scurry = false, scurryBegin = 0) {
    // Wiki model anatomy: a towering shell above a small head and eight jointed legs.
    const colours = [
      ['#b6afb1', '#d5ced0', '#817b85', '#47434b'],
      ['#688b20', '#96b63c', '#496619', '#45412c'],
      ['#0795a7', '#51c4cd', '#116a7a', '#172d36'],
      ['#b33027', '#e4472f', '#84271f', '#292329'],
    ][type];
    const rim = colours[3];
    const legLight = type === 0 ? '#817b85' : type === 3 ? '#4a3032' : colours[0];
    const legs = [-1, 1]
      .map((side) => {
        const geometry = `<g transform="scale(${side} 1)">
      ${path('M17 2 L34 -11 L41 -35 L50 -42 L56 -17 L54 12 L46 31 L44 2 L42 -18 L36 1 L23 15Z', rim, '#292329', 2)}
      ${path('M41 -35 L50 -42 L56 -17 L50 -5 L47 -21 L44 2 L46 31 L39 4Z', legLight, rim, 1.1)}
      ${path('M21 10 L45 -2 L68 -7 L80 8 L88 39 L81 29 L70 10 L46 7 L25 20Z', rim, '#292329', 2)}
      ${path('M45 -2 L68 -7 L72 0 L48 6 L25 20 L22 14Z', type === 0 ? '#68626d' : rim, rim, 0.9)}
      ${path('M68 -7 L80 8 L88 39 L78 27 L70 10Z', legLight, rim, 1.2)}
      ${path('M22 20 L38 26 L56 14 L66 26 L73 50 L73 75 L63 57 L56 36 L40 34 L19 30Z', rim, '#292329', 2)}
      ${path(type === 1 ? 'M56 14 L66 26 L73 50 L73 75 L63 57 L57 43 L55 28Z' : 'M56 14 L66 26 L73 50 L73 75 L65 54 L60 31Z', legLight, rim, 1.2)}
      ${path('M60 31 L65 54 L73 75 L66 53 L63 33Z', colours[2], colours[2], 0.8)}
      ${path('M8 25 L19 24 L29 36 L30 55 L23 81 L18 56 L18 41 L5 34Z', rim, '#292329', 2)}
      ${path(type === 1 ? 'M19 24 L29 36 L30 55 L23 81 L18 56 L18 41 L14 34Z' : 'M19 24 L29 36 L30 55 L23 81 L24 54 L23 40 L14 34Z', legLight, rim, 1.2)}
      ${path('M19 24 L26 30 L23 40 L14 34 L8 25Z', type === 0 ? '#a19aa3' : colours[2], rim, 1)}
      ${line('M47 -19 L49 -9 M73 8 L79 19 M63 35 L67 46 M24 43 L24 53', type === 0 ? '#b6afb1' : colours[2], 0.8)}
    </g>`;
        return scurry ? matomenosLegMotion(geometry, side, scurryBegin) : geometry;
      })
      .join('');
    const spines =
      type >= 2
        ? ''
        : `<g>
      ${path('M-12 -96 L-9 -111 L-2 -99 L9 -96Z M-31 -82 L-42 -96 L-41 -79 L-31 -71Z M-44 -54 L-57 -61 L-46 -42 L-37 -41Z M-46 -23 L-58 -26 L-45 -10 L-35 -13Z M-35 6 L-49 11 L-32 19 L-25 9Z M29 -90 L42 -95 L37 -80 L31 -73Z M46 -61 L60 -65 L48 -48 L41 -48Z M48 -29 L62 -29 L47 -12 L40 -16Z M34 6 L46 17 L29 21 L25 10Z', type === 0 ? '#68626d' : '#a8a18b', rim, 1.2)}
      ${path('M-9 -111 L-2 -99 L-12 -96Z M-42 -96 L-31 -82 L-41 -79Z M-57 -61 L-44 -54 L-46 -42Z M-58 -26 L-46 -23 L-45 -10Z M42 -95 L29 -90 L37 -80Z M60 -65 L46 -61 L48 -48Z', type === 0 ? '#a19aa3' : '#817b59', rim, 0.8)}
    </g>`;
    const shell =
      type === 0
        ? `
      ${path('M-10 -91 L16 -94 L33 -83 L38 -68 L-3 -66 L-31 -73Z', '#d5ced0', colours[2], 1.2)}
      ${path('M-31 -73 L-3 -66 L38 -68 L41 -59 L1 -57 L-35 -65Z', '#68626d', '#47434b', 1)}
      ${path('M-35 -65 L1 -57 L41 -59 L45 -34 L8 -38 L-40 -45Z', '#b6afb1', colours[2], 1.2)}
      ${path('M-40 -45 L8 -38 L45 -34 L43 -26 L6 -30 L-42 -37Z', '#68626d', '#47434b', 1)}
      ${path('M-42 -37 L6 -30 L43 -26 L34 -5 L6 -10 L-40 -16Z', '#c4bdbf', colours[2], 1.2)}
      ${path('M-40 -16 L6 -10 L34 -5 L29 3 L-2 -4 L-35 -8Z', '#68626d', '#47434b', 1)}
      ${path('M-35 -8 L-2 -4 L29 3 L16 18 L-5 20 L-25 12Z', '#b6afb1', colours[2], 1.2)}
      ${path('M16 -94 L33 -83 L38 -68 L21 -67Z M1 -57 L41 -59 L45 -34 L25 -37Z M6 -30 L43 -26 L34 -5 L19 -7Z M-2 -4 L29 3 L16 18 L5 16Z', '#969095', '#817b85', 1)}
      ${path('M-31 -73 L-10 -91 L-3 -66Z M-35 -65 L1 -57 L-11 -42 L-40 -45Z M-42 -37 L6 -30 L-5 -13 L-40 -16Z', '#d5ced0', '#b6afb1', 0.8)}`
        : `
      ${path('M-10 -93 L17 -97 L34 -83 L44 -60 L47 -34 L37 -8 L16 16 L-6 20 L-27 11 L-40 -9 L-42 -39 L-34 -69Z', colours[0], rim, 1.7)}
      ${path('M-10 -93 L17 -97 L5 -77 L-18 -47 L-26 -13 L-6 20 L-27 11 L-40 -9 L-42 -39 L-34 -69Z', colours[1], colours[0], 1.1)}
      ${path('M17 -97 L34 -83 L44 -60 L47 -34 L37 -8 L16 16 L-6 20 L10 -11 L25 -39 L30 -69Z', colours[2], colours[0], 1.1)}
      ${path('M5 -77 L17 -97 L30 -69 L25 -39 L10 -11 L-6 20 L-26 -13 L-18 -47Z', colours[0], colours[0], 0.9)}
      ${path('M-18 -47 L5 -77 L9 -60 L-4 -27 L-16 -8 L-26 -13Z', type === 1 ? '#7c9d2b' : type === 3 ? '#c7412c' : '#26b1bb', colours[0], 0.9)}
      ${line('M-26 0 L-32 -17 L-32 -41 L-25 -62 M31 -60 L29 -36 L18 -14', colours[1], 1)}`;
    const original = `<g transform="translate(${x} ${y}) scale(${scale})">
      ${legs}
      ${path('M-10 -99 L16 -102 L35 -89 L48 -64 L52 -35 L44 -8 L24 18 L-4 29 L-32 17 L-47 -10 L-48 -43 L-38 -75Z', rim, '#292329', 3)}
      ${path('M16 -102 L35 -89 L48 -64 L52 -35 L44 -8 L24 18 L-4 29 L6 17 L30 -9 L39 -38 L34 -73Z', type === 0 ? '#68626d' : rim, rim, 1.2)}
      ${shell}
      ${spines}
      ${path('M-16 19 L1 17 L19 27 L19 41 L7 52 L-12 48 L-25 38 L-24 28Z', rim, '#292329', 2)}
      ${path('M-16 19 L1 17 L12 26 L-4 29 L-18 34 L-24 28Z', colours[2], rim, 1.2)}
      ${path('M-4 29 L12 26 L19 27 L19 41 L7 52 L-1 41Z', type === 0 ? '#68626d' : rim, rim, 1)}
      ${path('M-18 34 L-4 29 L-1 41 L-12 48 L-25 38Z', type === 0 ? '#817b85' : colours[2], rim, 1)}
      ${path('M-14 31 L-8 29 L-6 33 L-13 35Z M2 28 L8 28 L9 32 L3 33Z', colours[1], rim, 0.9)}
      ${path('M-12 40 L-18 49 L-17 55 L-8 60 L-10 53 L-5 44Z M3 41 L2 49 L6 57 L13 56 L8 51 L11 42Z', colours[2], '#292329', 1.4)}
      ${path('M-12 40 L-18 49 L-17 55 L-13 52 L-8 44Z M3 41 L2 49 L6 57 L7 51 L8 43Z', type === 0 ? '#a19aa3' : colours[0], rim, 0.8)}
      ${line('M-13 25 L-5 22 L2 23 M-18 37 L-11 36 M5 35 L11 34', type === 0 ? '#b6afb1' : colours[0], 0.9)}
    </g>`;
    // The red Matomenos in Maiden calls the unmodified branch.
    if (!animated) return original;
    const cycle = 7.5 + type * 0.6;
    const rotation = (values, pivot, delay) =>
      '<animateTransform attributeName="transform" type="rotate" values="' +
      values.map((angle) => angle + ' ' + pivot).join(';') +
      '" keyTimes="0;.22;.46;.72;1" dur="' +
      cycle +
      's" begin="-' +
      delay +
      's" repeatCount="indefinite"/>';
    const ink = type === 0 ? '#b6afb1' : colours[2];
    let side = 0;
    let moving = original.replace(/<path d="M22 20[\s\S]*?(?=<path d="M8 25)/g, (geometry) => {
      const delay = type * 2.3 + side++ * 1.3;
      return (
        '<g data-nylocas-joint="outer-foreleg">' +
        rotation([0, -12, 3, -4, 0], '19 25', delay) +
        geometry +
        line('M63 35 L67 46', ink, 0.8) +
        '</g>'
      );
    });
    side = 0;
    moving = moving.replace(/<path d="M8 25[\s\S]*?(?=<path d="M47 -19)/g, (geometry) => {
      const delay = type * 2.3 + side++ * 1.3 + 0.8;
      return (
        '<g data-nylocas-joint="inner-foreleg">' +
        rotation([0, 15, -3, 5, 0], '5 32', delay) +
        geometry +
        line('M24 43 L24 53', ink, 0.8) +
        '</g>'
      );
    });
    moving = moving.replaceAll(
      line('M47 -19 L49 -9 M73 8 L79 19 M63 35 L67 46 M24 43 L24 53', ink, 0.8),
      line('M47 -19 L49 -9 M73 8 L79 19', ink, 0.8)
    );
    const jaw = (left) =>
      '<g data-nylocas-joint="mandible">' +
      rotation(
        left ? [0, 19, 0, 8, 0] : [0, -19, 0, -8, 0],
        left ? '-12 40' : '3 41',
        type * 2.3 + 0.4
      ) +
      path(
        left
          ? 'M-12 40 L-18 49 L-17 55 L-8 60 L-10 53 L-5 44Z'
          : 'M3 41 L2 49 L6 57 L13 56 L8 51 L11 42Z',
        colours[2],
        '#292329',
        1.4
      ) +
      path(
        left ? 'M-12 40 L-18 49 L-17 55 L-13 52 L-8 44Z' : 'M3 41 L2 49 L6 57 L7 51 L8 43Z',
        type === 0 ? '#a19aa3' : colours[0],
        rim,
        0.8
      ) +
      '</g>';
    moving = moving.replace(
      path(
        'M-12 40 L-18 49 L-17 55 L-8 60 L-10 53 L-5 44Z M3 41 L2 49 L6 57 L13 56 L8 51 L11 42Z',
        colours[2],
        '#292329',
        1.4
      ),
      jaw(true) + jaw(false)
    );
    moving = moving.replace(
      path(
        'M-12 40 L-18 49 L-17 55 L-13 52 L-8 44Z M3 41 L2 49 L6 57 L7 51 L8 43Z',
        type === 0 ? '#a19aa3' : colours[0],
        rim,
        0.8
      ),
      ''
    );
    return moving.replace(
      '<g transform=',
      '<g data-art-effect="nylocas-articulated-stance" transform='
    );
  }

  function nylocasChamber(colours) {
    const point = (angle, radius = 1) =>
      `${(180 + Math.cos(angle) * 153 * radius).toFixed(1)} ${(318 + Math.sin(angle) * 215 * radius).toFixed(1)}`;
    const spokes = Array.from({ length: 12 }, (_, i) =>
      line(`M180 318 L${point((i * Math.PI) / 6)}`, '#8d8199', 1.2)
    ).join('');
    const silk = [0.25, 0.47, 0.7, 0.95]
      .map((radius) =>
        Array.from({ length: 12 }, (_, i) => {
          const angle = (i * Math.PI) / 6;
          return line(
            `M${point(angle, radius)} Q${point(angle + Math.PI / 12, radius * 0.83)} ${point(angle + Math.PI / 6, radius)}`,
            '#b5a7b5',
            1.2
          );
        }).join('')
      )
      .join('');
    const columns = [-1, 1]
      .map(
        (side) => `<g transform="translate(180 0) scale(${side} 1)">
        ${path('M115 482 V245 L122 228 H137 L145 245 V489Z', '#5b4659', '#302632', 2)}
        ${path('M132 234 L145 245 V489 L133 483Z', '#3e344a', '#302632', 1.5)}
        ${path('M113 243 H147 V254 H113Z M110 472 H147 V485 H110Z', '#8d7380', '#443344', 1.5)}
        ${line('M122 259 V461 M117 323 H141 M117 396 H141', '#a18a96', 1.1)}
      </g>`
      )
      .join('');
    return `${path('M42 550 V230 Q42 139 180 65 Q318 139 318 230 V550Z', '#31273c', '#71536b', 2)}
      ${path('M69 472 V234 Q69 161 180 91 Q291 161 291 234 V472Z', '#43344c', '#94717e', 2)}
      ${path('M180 91 L131 205 L131 472 H69 V234 Q69 161 180 91Z', '#514052', '#6a5062', 1.3)}
      ${path('M180 91 Q291 161 291 234 V472 H239 V211Z', '#3a384b', '#61506a', 1.3)}
      ${path('M131 205 L180 136 L239 211 V472 H131Z', '#322b40', '#524052', 1.5)}
      ${line('M69 236 H131 M239 236 H291 M69 292 H131 M239 292 H291 M69 350 H131 M239 350 H291 M69 411 H131 M239 411 H291 M93 236 V292 M111 292 V350 M88 350 V411 M262 236 V292 M249 292 V350 M272 350 V411', '#705d74', 1.3)}
      ${path('M20 489 L180 448 L340 489 V550 H20Z', '#594653', '#332a39', 2)}
      ${path('M180 448 L219 462 L254 550 H180Z M65 479 L104 469 L73 550 H20Z', '#77616c', '#433448', 1.4)}
      ${line('M20 508 H340 M20 534 H340 M180 448 V550 M115 466 L85 550 M245 466 L279 550', '#9f8790', 1.4)}
      ${columns}
      ${line('M60 235 Q59 149 180 79 Q301 149 300 235 M84 233 Q85 173 180 107 Q275 173 276 233 M180 79 V134', colours[4], 1.6)}
      <g opacity=".8">${spokes}${silk}${line('M51 209 L94 286 L43 311 M51 209 L75 282 L43 290 M51 209 L58 277 L43 270 M309 209 L266 286 L317 311 M309 209 L285 282 L317 290 M309 209 L302 277 L317 270', '#b5a7b5', 1.2)}</g>
      ${path('M57 278 L64 285 L62 302 L55 307 L48 300 L50 284Z M304 278 L311 285 L313 300 L306 307 L299 302 L297 285Z', '#817489', '#433449', 1.3)}
      ${line('M53 286 L61 292 L53 299 M301 286 L309 292 L301 299', '#b2a1b4', 1.1)}
    `;
  }

  function maiden() {
    return `<g>
      ${path('M40 493 L51 473 L78 456 L121 447 L179 443 L235 449 L284 464 L316 485 L320 502 L306 519 L268 535 L221 542 L163 543 L111 537 L71 522 L44 506Z', '#534348', '#2e272d', 3)}
      ${path('M44 506 L71 522 L111 537 L163 543 L221 542 L268 535 L306 519 L320 502 L315 516 L282 539 L228 551 L165 552 L107 545 L66 530 L42 513Z', '#30282e', '#272229', 2)}
      ${path('M52 491 L63 477 L94 460 L136 453 L180 450 L237 458 L279 472 L307 489 L306 505 L285 520 L245 532 L197 536 L146 533 L104 527 L68 511Z', '#b33027', '#64282c', 2)}
      ${path('M82 491 L98 475 L138 461 L184 459 L224 465 L264 478 L281 494 L274 512 L234 526 L189 531 L145 525 L109 513Z', '#c7412c', '#b33027', 1.2)}
      ${path('M115 492 L134 477 L169 471 L210 475 L243 489 L244 505 L218 518 L180 522 L147 513 L122 505Z', '#aa332b', '#aa332b', 1)}
      ${line('M54 493 L67 477 L96 463 M247 531 L282 519 L303 504', '#af8274', 1.5)}
      ${path('M190 495 L202 407 L210 317 L225 249 L264 181 L282 143 L260 177 L234 218 L208 269 L195 339 L178 426 L168 496Z', '#9c3028', '#542630', 2.4)}
      ${path('M225 249 L264 181 L282 143 L240 219 L218 276 L204 350 L195 424 L190 495 L178 491 L197 402 L202 321Z', '#c6402b', '#8f3029', 1.3)}
      ${path('M166 295 L189 300 L184 331 L170 364 L164 392 L169 419 L158 441 L146 408 L141 374 L146 340Z', '#aaa8b3', '#47404b', 2.5)}
      ${path('M166 306 L178 310 L167 344 L152 365 L153 395 L160 417 L158 441 L146 408 L141 374 L146 340Z', '#c8c7ce', '#93929e', 1.2)}
      ${path('M178 324 L169 358 L164 392 L169 419 L158 441 L158 400 L155 373Z', '#777781', '#73717f', 1.2)}
      ${path('M189 297 L210 299 L221 334 L218 368 L222 397 L215 427 L201 423 L196 389 L193 358 L181 327Z', '#b7b8c2', '#47404b', 2.5)}
      ${path('M201 304 L211 310 L216 337 L208 368 L213 394 L211 419 L201 423 L196 389 L193 358 L181 327Z', '#93949f', '#868693', 1.2)}
      ${path('M198 360 L207 375 L213 394 L211 419 L201 423 L196 389Z', '#747783', '#6c6d79', 1.2)}
      ${path('M144 187 L165 180 L190 180 L213 193 L219 224 L206 249 L199 272 L210 295 L204 319 L182 333 L158 317 L151 298 L163 275 L158 250 L145 224Z', '#d8dadc', '#47404b', 2.6)}
      ${path('M144 187 L165 180 L177 188 L184 207 L159 213 L146 206Z M146 212 L167 211 L181 221 L163 231 L148 225Z', '#f3efeb', '#c0c0c6', 1.1)}
      ${path('M184 207 L198 188 L213 193 L219 218 L200 226 L181 221Z', '#ecebea', '#b6b7c0', 1.1)}
      ${path('M167 231 L183 226 L197 233 L192 255 L201 274 L185 291 L165 272 L171 253Z', '#ebe9e8', '#c1c1c8', 1.1)}
      ${path('M207 225 L219 218 L206 249 L199 272 L210 295 L204 319 L182 333 L188 309 L182 292 L201 274 L192 255Z', '#a8a8b4', '#9999a6', 1.2)}
      ${path('M158 281 L178 292 L182 310 L163 318 L151 298Z', '#c2c3cb', '#a5a6b0', 1.1)}
      ${path('M144 189 L155 196 L153 223 L142 252 L139 275 L132 300 L120 296 L124 267 L129 241 L131 215Z', '#c5c8cd', '#47404b', 2.3)}
      ${path('M142 195 L147 204 L143 227 L134 247 L135 269 L129 293 L122 294 L127 265 L129 241 L131 215Z', '#e3e2e2', '#a9aab5', 1.1)}
      ${path('M142 251 L139 275 L132 300 L125 297 L132 278 L128 263 L130 250Z', '#9a9ca8', '#8c8d9c', 1)}
      ${path('M213 193 L225 209 L231 241 L231 268 L227 300 L215 300 L217 269 L214 246 L204 218Z', '#cbd0d2', '#47404b', 2.3)}
      ${path('M216 203 L223 215 L227 241 L225 268 L222 295 L216 296 L219 268 L214 246 L207 224Z', '#e5e5e4', '#b3b5c0', 1.1)}
      ${path('M224 245 L231 241 L231 268 L227 300 L222 298 L225 267Z', '#a0a2ad', '#9293a0', 1)}
      ${path('M119 292 L130 290 L137 306 L134 328 L127 360 L115 345 L110 319 L113 302Z', '#e5e5e4', '#47404b', 2.3)}
      ${path('M119 300 L123 319 L122 340 L127 360 L115 345 L110 319 L113 302Z', '#f4eeeb', '#b4b7bf', 1.1)}
      ${path('M131 302 L137 306 L134 328 L127 360 L129 335Z', '#afb2bd', '#a0a1b0', 1.1)}
      ${line('M117 313 L118 332 L124 348 M123 311 L126 332 L127 350', '#a7a8b4', 1)}
      ${line('M133 307 L133 325 L128 349', '#b63a2e', 1.3)}
      ${path('M217 294 L227 291 L235 306 L235 328 L225 360 L216 342 L212 316Z', '#e5e5e4', '#47404b', 2.3)}
      ${path('M217 303 L222 320 L221 343 L225 360 L216 342 L212 316Z', '#f2edeb', '#b4b7bf', 1.1)}
      ${path('M229 302 L235 306 L235 328 L225 360 L228 337Z', '#aeb1bc', '#a0a1b0', 1.1)}
      ${line('M217 315 L218 336 L223 350 M222 312 L226 333 L226 345', '#a7a8b4', 1)}
      ${line('M232 307 L232 327 L227 350', '#b63a2e', 1.3)}
      ${path('M164 164 L190 162 L189 178 L203 190 L182 204 L164 187 L170 175Z', '#c9cdd0', '#47404b', 2)}
      ${path('M173 170 L181 173 L182 184 L176 195 L167 185 L170 175Z', '#eeebe9', '#b3b6c1', 1)}
      ${path('M154 143 L148 125 L155 108 L175 99 L196 102 L210 116 L218 141 L209 166 L188 180 L169 168Z', '#942c25', '#54282e', 2.5)}
      ${path('M154 143 L148 125 L155 108 L175 99 L178 113 L163 127 L159 148 L168 165 L169 168Z', '#be3b28', '#8d3027', 1.2)}
      ${path('M175 99 L196 102 L210 116 L195 117 L181 109 L162 120 L155 137 L155 108Z', '#cd432c', '#a23326', 1.1)}
      ${path('M168 124 L181 115 L197 122 L205 140 L200 162 L184 177 L168 169 L160 155 L157 146 L162 136Z', '#e3e6e6', '#47404b', 2.3)}
      ${path('M181 115 L197 122 L189 135 L177 131 L168 124Z M162 136 L176 137 L169 149 L157 146Z M163 153 L175 154 L181 166 L168 169Z', '#f5f0eb', '#c3c7ce', 1)}
      ${path('M197 122 L205 140 L200 162 L184 177 L181 166 L190 155 L185 147 L195 141 L189 135Z', '#aeb6c1', '#999fad', 1.2)}
      ${path('M181 115 L187 125 L177 131 L169 124Z M189 135 L198 133 L205 140 L195 141Z M177 138 L181 145 L176 149 L172 147Z', '#ccd2d7', '#bcc1cb', 1)}
      ${path('M199 144 L220 128 L211 149 L200 161 L193 161Z', '#c8d0d7', '#47404b', 1.8)}
      ${path('M200 148 L213 136 L204 153 L198 155Z', '#8c99ab', '#8993a7', 1)}
      ${path('M161 142 L171 144 L170 148 L163 149 L158 146Z M181 142 L193 141 L190 147 L181 148Z', '#37353d', '#37353d', 1)}
      ${line('M161 145 L168 146 M183 145 L190 143', '#c84636', 1.4)}
      ${path('M173 138 L170 148 L162 152 L168 154 L176 152 L178 146Z', '#d5dae0', '#b9c1cb', 0.7)}
      ${path('M173 138 L170 148 L162 152 L168 152 L173 149Z', '#f5f0eb', '#f5f0eb', 0.5)}
      ${line('M165 154 H170', '#929ba7', 0.7)}
      ${path('M160 159 L167 158 L175 162 L168 164 L161 162Z', '#59606a', '#45404a', 1)}
      ${path('M163 163 L175 166 L181 172 L173 172 L168 169Z', '#cbd2d8', '#a5afbd', 1)}
      ${path('M205 156 L214 169 L220 193 L216 227 L204 261 L200 283 L184 249 L179 218 L183 193 L195 174Z', '#ab3024', '#61282c', 2.4)}
      ${path('M205 156 L214 169 L220 193 L216 227 L204 261 L200 283 L198 239 L201 202 L195 174Z', '#bd3726', '#913026', 1.2)}
      ${path('M160 235 L161 261 L169 277 L191 298 L212 320 L214 338 L207 327 L197 314 L174 295 L157 279 L151 255Z', '#b93627', '#672a2d', 2)}
      ${path('M160 235 L161 261 L169 277 L191 298 L212 320 L214 338 L205 313 L182 290 L160 279 L153 258Z', '#d4462c', '#ac3326', 1.2)}
      ${path('M173 500 L158 457 L146 416 L141 377 L124 348 L105 328 L110 280 L115 327 L144 368 L163 396 L170 440 L195 489Z', '#bd3826', '#64272d', 2.5)}
      ${path('M110 280 L115 327 L144 368 L163 396 L170 440 L195 489 L180 493 L160 441 L154 405 L126 372 L105 328Z', '#d3452a', '#a93225', 1.3)}
      ${path('M159 347 L149 378 L154 418 L173 456 L189 482 L181 502 L169 491 L164 465 L144 429 L135 400 L137 373Z', '#982b27', '#64262d', 2.4)}
      ${path('M193 498 L207 449 L208 401 L199 360 L198 327 L217 371 L230 407 L235 455 L216 499Z', '#b23125', '#61282d', 2.5)}
      ${path('M198 327 L217 371 L230 407 L235 455 L216 499 L219 451 L217 414 L208 385Z', '#cc3b28', '#9b2d25', 1.3)}
      ${path('M181 499 L192 463 L191 427 L177 391 L170 364 L191 396 L206 430 L208 467 L197 502Z', '#d03d27', '#7c2b2b', 2.3)}
      ${path('M176 451 L194 474 L202 496 L194 507 L171 505 L166 491Z', '#bd3024', '#67272c', 2)}
      ${line('M111 319 L116 340 L148 385 M162 403 L167 438 L185 478 M225 416 L229 451 L218 486 M176 478 L185 496', '#ec6d46', 1.4)}
      ${line('M99 485 L121 480 M241 508 L259 504 M139 528 L164 532 M202 532 L224 528', '#df6448', 1.4)}
    </g>`;
  }

  function maidenMotes() {
    const droplets = [
      [113, 178, 2.7],
      [101, 235, 3.2],
      [97, 289, 4.5],
      [84, 353, 2.5],
      [106, 397, 3.5],
      [126, 454, 2.6],
      [269, 204, 2.4],
      [248, 247, 3.7],
      [259, 322, 4.5],
      [251, 381, 2.8],
      [272, 425, 3.2],
      [243, 466, 2.8],
    ];
    const glints = [
      [87, 264, 1.8],
      [274, 288, 2],
      [112, 424, 1.6],
      [254, 450, 1.6],
    ];
    const motes = [...droplets, ...glints]
      .map(([x, y, size], i) => {
        const fragment =
          i < droplets.length
            ? `${path(`M0 ${-size * 1.6} L${size} ${size * 0.25} L${size * 0.65} ${size} L0 ${size * 1.35} L${-size * 0.75} ${size * 0.6} L${-size * 0.9} 0Z`, '#bd3826', '#64272d', 0.7)}${path(`M0 ${-size * 1.6} L${size} ${size * 0.25} L${size * 0.65} ${size} L0 ${size * 1.35} L${size * 0.2} ${size * 0.2}Z`, '#ec6d46', '#bd3826', 0.4)}`
            : path(
                `M0 ${-size * 1.8} L${size * 0.35} ${-size * 0.35} L${size * 1.4} 0 L${size * 0.35} ${size * 0.35} L0 ${size * 1.8} L${-size * 0.35} ${size * 0.35} L${-size * 1.4} 0 L${-size * 0.35} ${-size * 0.35}Z`,
                '#f4eeeb',
                '#af8274',
                0.5
              );
        return `<g transform="translate(${x} ${y})"><g class="maiden-mote" style="animation-duration:${7 + (i % 4)}s;animation-delay:-${i * 1.3}s">${fragment}</g></g>`;
      })
      .join('');
    return `<g pointer-events="none" aria-hidden="true">
      <style>
        .maiden-mote { opacity: .8; animation: maiden-blood-drift 8s ease-in-out infinite; }
        @keyframes maiden-blood-drift {
          0%, 100% { transform: translate(0, 4px); opacity: .5; }
          50% { transform: translate(-2px, -5px); opacity: .96; }
        }
        @media (prefers-reduced-motion: reduce) { .maiden-mote { animation: none; } }
      </style>
      <g opacity=".34">${line('M94 385 Q79 348 90 325 M260 405 Q276 374 267 348 M104 265 Q91 247 100 225 M251 459 Q265 447 263 433', '#df6448', 1.1)}</g>
      ${motes}
    </g>`;
  }

  function shadowMaze() {
    const rows = [417, 428, 442, 460, 483, 512, 550];
    const routeOrder = ['5:2', '4:2', '4:3', '3:3', '2:3', '2:4', '1:4', '0:4'];
    const route = new Set(routeOrder);
    const point = (y, column) => [180 + ((column - 3) * (y - 374) * 105) / 176, y];
    const corner = (y, column) => point(y, column).join(' ');
    // Reuse the red tiles' perspective coordinates, so the light follows the actual route.
    const centres = routeOrder.map((key) => {
      const [row, column] = key.split(':').map(Number);
      return point((rows[row] + rows[row + 1]) / 2, column + 0.5);
    });
    const distances = centres.map(([x, y], i) =>
      i ? Math.hypot(x - centres[i - 1][0], y - centres[i - 1][1]) : 0
    );
    const total = distances.reduce((sum, distance) => sum + distance, 0);
    let walked = 0;
    const positions = distances.map((distance) => ((walked += distance) / total) * 100);
    const travelFrames = centres
      .map(
        ([x, y], i) =>
          `${positions[i].toFixed(3)}% { transform: translate(${x.toFixed(3)}px, ${y.toFixed(3)}px); }`
      )
      .join('');
    const routePath = `M${centres.map((p) => p.join(' ')).join(' L')}`;
    const tiles = rows
      .slice(0, -1)
      .map((y, row) =>
        Array.from({ length: 6 }, (_, column) => {
          const lit = route.has(`${row}:${column}`);
          const tile = path(
            `M${corner(y, column)} L${corner(y, column + 1)} L${corner(rows[row + 1], column + 1)} L${corner(rows[row + 1], column)}Z`,
            lit ? '#af3746' : (row + column) % 2 ? '#413141' : '#2b2636',
            lit ? '#e17a70' : '#786072',
            lit ? 1.5 : 1
          );
          return lit
            ? tile.replace(
                '<path ',
                `<path class="sotetseg-maze-tile" style="--maze-phase:-${(8 - (positions[routeOrder.indexOf(`${row}:${column}`)] / 100) * 8).toFixed(3)}s" `
              )
            : tile;
        }).join('')
      )
      .join('');
    return `<style>
      .sotetseg-maze-tile { animation: sotetseg-maze-tile-light 8s linear infinite; animation-delay: var(--maze-phase); }
      .sotetseg-maze-trail { opacity: 0; animation: sotetseg-maze-fade 8s linear infinite; }
      .sotetseg-maze-streak { animation: sotetseg-maze-streak-travel 8s linear infinite; }
      .sotetseg-maze-light { opacity: 0; animation: sotetseg-maze-travel 8s linear infinite, sotetseg-maze-fade 8s linear infinite; }
      @keyframes sotetseg-maze-travel { ${travelFrames} }
      @keyframes sotetseg-maze-streak-travel { from { stroke-dashoffset: 12; } to { stroke-dashoffset: -88; } }
      @keyframes sotetseg-maze-fade { 0%, 100% { opacity: 0; } 4%, 92% { opacity: .9; } }
      @keyframes sotetseg-maze-tile-light { 0% { fill: #e99680; } 19%, 100% { fill: #af3746; } }
      @media (prefers-reduced-motion: reduce) {
        .sotetseg-maze-tile, .sotetseg-maze-trail, .sotetseg-maze-streak, .sotetseg-maze-light { animation: none; }
      }
    </style>${path('M20 431 L180 395 L340 431 V550 H20Z', '#302532')}${tiles}
    <g class="sotetseg-maze-trail" pointer-events="none" aria-hidden="true">
      <path class="sotetseg-maze-streak" d="${routePath}" pathLength="100" stroke="#ff8d73" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="12 200" opacity=".3"/>
      <path class="sotetseg-maze-streak" d="${routePath}" pathLength="100" stroke="#ffe1bf" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="12 200"/>
    </g>
    <g class="sotetseg-maze-light" pointer-events="none" aria-hidden="true">
      <circle r="9" fill="#ff9275" opacity=".15"/><circle r="4" fill="#ffb78a" opacity=".6"/><circle r="1.6" fill="#fff1d8"/>
    </g>`;
  }

  function sotetseg() {
    // A low, broad dark beast: the Wiki model's mantle, forward horn and curved tusks.
    return `<g transform="translate(18 152) scale(.285 .345)">
      ${path('M790 123 L891 140 L994 155 L1061 240 L1106 295 L1120 411 L1082 455 L987 474 L885 415 L785 302Z', '#4d2827', '#241f24', 9)}
      ${path('M891 140 L994 155 L1061 240 L995 290 L902 229 L854 198Z', '#68372f', '#4f2928', 4)}
      ${path('M994 155 L1061 240 L1106 295 L1120 411 L1082 455 L1034 407 L1046 304 L995 290Z', '#3d2425', '#302124', 4)}
      ${path('M1025 421 L1092 419 L1108 489 L1085 553 L1044 599 L1008 591 L1022 544 L1001 507Z', '#392427', '#241f24', 8)}
      ${path('M1033 451 L1077 443 L1093 487 L1067 526 L1042 575 L1022 564 L1043 510Z', '#542a2a', '#392326', 4)}
      ${path('M1017 573 L1041 570 L1030 602 L1004 616Z M1049 571 L1070 563 L1063 596 L1041 609Z M1075 559 L1090 545 L1099 579 L1079 594Z', '#c23d28', '#5b2928', 5)}
      ${path('M350 225 L539 134 L740 158 L886 265 L943 424 L866 536 L729 588 L565 584 L441 520 L327 418Z', '#3c2426', '#241f24', 10)}
      ${path('M650 330 L814 317 L906 410 L866 536 L729 588 L596 569 L623 508 L731 510 L795 454Z', '#512925', '#3a2325', 4)}
      ${path('M295 458 L388 428 L454 484 L461 559 L439 615 L388 637 L343 622 L311 652 L269 632 L246 653 L184 676 L168 653 L223 608 L297 564Z', '#4b2728', '#241f24', 8)}
      ${path('M318 531 L384 485 L425 508 L427 565 L388 607 L335 602 L269 632 L247 625 L284 587Z', '#6a302a', '#442628', 4)}
      ${path('M223 608 L254 618 L220 651 L184 676 L168 653Z M270 617 L294 632 L263 656 L224 667Z M332 609 L354 622 L325 650 L284 660Z', '#cf402a', '#652928', 5)}
      ${path('M700 18 L686 50 L738 75 L781 66 L782 94 L819 105 L823 134 L857 147 L853 175 L886 194 L873 221 L903 246 L869 263 L794 217 L682 102 L614 30Z', '#492627', '#241f24', 6)}
      ${path('M338 209 L350 99 L410 95 L421 56 L448 81 L476 58 L514 73 L538 27 L558 41 L611 1 L655 29 L683 61 L747 91 L790 129 L821 179 L859 213 L883 263 L907 323 L899 381 L853 409 L793 427 L717 389 L658 435 L625 489 L580 467 L561 421 L508 399 L478 329 L416 284Z', '#373033', '#241f24', 10)}
      ${path('M350 99 L410 95 L421 56 L448 81 L476 58 L514 73 L538 27 L558 41 L611 1 L592 66 L523 109 L462 95 L465 171 L416 204 L385 281 L338 209Z', '#514244', '#383034', 4)}
      ${path('M611 1 L655 29 L683 61 L747 91 L704 132 L627 106 L592 66Z', '#45393c', '#373034', 4)}
      ${path('M462 95 L523 109 L577 162 L622 228 L645 337 L625 489 L580 467 L561 421 L508 399 L478 329 L465 237Z', '#44373c', '#29252a', 5)}
      ${path('M523 109 L577 162 L607 247 L621 341 L625 489 L596 428 L584 329 L551 243 L489 154Z', '#524147', '#40343a', 4)}
      ${path('M627 106 L704 132 L766 159 L805 229 L833 304 L853 409 L793 427 L745 380 L716 275 L674 190Z', '#342b30', '#29252a', 5)}
      ${path('M674 190 L716 275 L745 380 L793 427 L805 343 L754 280 L724 224Z', '#4b2d30', '#34272d', 4)}
      ${path('M704 132 L766 159 L805 229 L859 213 L883 263 L907 323 L899 381 L853 409 L833 304 L805 229Z', '#403338', '#30282e', 4)}
      ${path('M802 382 L853 409 L924 414 L968 459 L952 525 L915 584 L858 626 L831 689 L792 728 L734 725 L694 756 L651 728 L618 724 L648 678 L699 638 L756 607 L774 548 L783 466Z', '#572b29', '#241f24', 9)}
      ${path('M853 409 L891 418 L907 455 L872 502 L847 571 L802 604 L758 636 L753 658 L699 673 L648 705 L667 661 L713 628 L765 600 L799 543 L820 462Z', '#78372e', '#4a2827', 4)}
      ${path('M907 455 L952 470 L952 525 L915 584 L858 626 L831 689 L792 728 L762 688 L800 640 L851 608 L886 550Z', '#432628', '#302124', 5)}
      ${path('M648 678 L695 665 L717 678 L668 706 L618 724Z M701 687 L747 669 L771 687 L736 714 L694 756 L693 726Z M779 687 L818 662 L840 669 L831 713 L792 771 L798 726Z', '#df452b', '#712b28', 5)}
      ${path('M648 678 L695 665 L717 678 L686 680 L668 695 L618 724Z M701 687 L747 669 L771 687 L742 685 L718 709 L694 756Z M779 687 L818 662 L840 669 L817 681 L798 726 L792 771Z', '#f75c35', '#c53e26', 3)}
      ${path('M301 190 L358 155 L408 175 L464 221 L501 294 L490 359 L445 396 L409 423 L376 468 L332 496 L306 539 L264 541 L229 507 L196 461 L196 411 L220 369 L209 325 L254 281 L264 240Z', '#592b29', '#241f24', 9)}
      ${path('M301 190 L358 155 L408 175 L464 221 L501 294 L423 290 L358 243 L310 252 L270 282 L254 281Z', '#71392f', '#4b2827', 4)}
      ${path('M301 190 L308 238 L392 274 L358 243 L310 219Z M308 238 L270 282 L299 289 L358 312 L423 290 L358 272Z', '#4d2526', '#492628', 3)}
      ${path('M264 291 L313 297 L358 312 L423 290 L445 323 L409 368 L365 390 L296 404 L253 388 L222 364 L220 326Z', '#4d2728', '#302124', 5)}
      ${path('M296 404 L365 390 L409 368 L408 409 L378 446 L330 468 L293 471 L253 452 L234 413Z', '#321f24', '#241f24', 6)}
      ${path('M328 433 L352 426 L387 427 L379 450 L355 464 L322 463 L306 455Z', '#742f29', '#3a2325', 4)}
      ${path('M348 439 L388 430 L373 446 L352 450Z', '#ed4428', '#a73824', 3)}
      ${line('M357 440 L377 436', '#ff8950', 4)}
      ${path('M244 460 L279 461 L316 484 L368 473 L414 494 L428 529 L405 564 L367 590 L328 570 L294 561 L263 532 L236 504Z', '#4b2428', '#241f24', 7)}
      ${path('M279 461 L316 484 L292 502 L258 496 L236 504 L244 477Z M316 484 L368 473 L414 494 L386 510 L361 501 L336 513Z', '#64322b', '#422427', 4)}
      ${path('M287 505 L320 507 L330 520 L307 522Z M367 517 L384 501 L400 514 L384 538 L371 536Z', '#d83a25', '#7b2d27', 3)}
      ${path('M275 535 L307 545 L337 542 L371 556 L402 539 L394 557 L366 573 L333 559 L307 562 L278 552Z', '#251e23', '#211b21', 4)}
      ${path('M283 539 L293 550 L299 543 M314 548 L320 555 L326 548 M344 552 L352 562 L358 555', '#b3877c', '#5f3635', 2.5)}
      ${path('M267 506 L250 481 L240 455 L275 487 L293 531Z M352 544 L339 513 L326 494 L357 516 L379 555Z', '#30272d', '#1d1b21', 5)}
      ${path('M253 383 L279 391 L281 436 L255 486 L220 530 L170 568 L99 604 L34 616 L1 634 L59 554 L109 509 L155 465 L209 420Z', '#652d28', '#281f24', 8)}
      ${path('M253 383 L279 391 L256 438 L208 475 L155 516 L116 563 L68 588 L59 554 L109 509 L155 465 L209 420Z', '#8a3a2d', '#542a27', 4)}
      ${path('M59 554 L137 531 L116 563 L77 597 L34 616 L1 634 L60 581Z', '#d63d25', '#752b24', 5)}
      ${path('M59 554 L137 531 L91 561 L62 584 L1 634 L34 599Z', '#f3552e', '#c23924', 3)}
      ${path('M455 398 L513 426 L549 482 L572 550 L568 615 L532 671 L466 711 L375 728 L272 704 L364 683 L418 650 L442 606 L441 544 L425 480Z', '#653029', '#281f24', 8)}
      ${path('M455 398 L482 420 L505 496 L513 558 L495 620 L456 659 L418 650 L442 606 L441 544 L425 480Z', '#7c382d', '#542b28', 4)}
      ${path('M513 426 L549 482 L572 550 L568 615 L532 671 L490 679 L519 609 L530 555 L505 496Z', '#4e2727', '#3a2325', 4)}
      ${path('M418 650 L485 650 L546 629 L532 671 L466 711 L375 728 L272 704 L366 698Z', '#cf3a23', '#652824', 6)}
      ${path('M418 650 L485 650 L546 629 L490 668 L409 692 L272 704 L366 679Z', '#f04b28', '#ba3321', 3)}
      ${path('M254 218 L284 208 L279 248 L268 274 L254 254Z M307 152 L297 136 L317 112 L347 88 L334 127 L347 158 L312 201Z', '#b33223', '#592526', 5)}
      ${path('M297 136 L317 112 L347 88 L329 125 L331 157 L312 201Z', '#ec4324', '#9f3022', 3)}
      ${path('M341 179 L385 126 L450 88 L428 145 L385 172 L341 216Z M444 247 L470 208 L514 180 L560 164 L520 200 L501 231Z', '#ba3321', '#512526', 5)}
      ${path('M341 179 L385 126 L450 88 L406 159 L367 186 L341 216Z M444 247 L470 208 L514 180 L560 164 L493 210Z', '#e54425', '#aa3021', 3)}
      ${path('M236 320 L278 287 L291 326 L357 340 L294 367 L258 386 L207 425 L133 398 L80 342 L190 336 L224 314Z', '#662e28', '#281f24', 8)}
      ${path('M80 342 L190 336 L224 314 L236 320 L207 365 L168 373 L128 357Z M224 314 L236 291 L254 326 L294 346 L258 357 L220 349Z', '#ae3422', '#6b2a23', 4)}
      ${path('M80 342 L190 336 L224 314 L207 346 L177 355 L128 357Z M236 291 L254 326 L294 346 L258 334Z', '#e54324', '#aa3021', 3)}
      ${path('M497 339 L529 313 L573 322 L600 334 L557 354 L530 364Z', '#c03b26', '#542526', 5)}
      ${path('M497 339 L529 313 L573 322 L600 334 L552 336 L530 350Z', '#f0502c', '#b53522', 3)}
      ${line('M946 438 L929 484 L906 510 M804 501 L787 552 L759 590 M382 531 L368 546', '#985247', 4)}
    </g>`;
  }

  function justiciarArmourShine(original) {
    const id = 'justiciar-metal-' + ++justiciarShineInstance;
    // These are the existing plate silhouettes, not a light wash over the scene.
    const surfaces = [
      'M145 367',
      'M140 430',
      'M192 318',
      'M130 205',
      'M88 259',
      'M83 342',
      'M132 196',
      'M96 216',
      'M148 137',
      'M146 139',
    ];
    const metal = Array.from(original.matchAll(/<path d="([^"]+)"[^>]*\/>/g))
      .filter((match) => surfaces.some((start) => match[1].startsWith(start)))
      .map((match) => '<path d="' + match[1] + '"/>')
      .join('');
    const occlusion =
      '<path d="M149 146 L158 143 L171 149 L158 154Z M184 148 L198 145 L204 150 L189 156Z M150 189 L169 178 L191 182 L203 193 L190 204 L174 207 L156 198Z" fill="black"/>';
    return (
      '<g data-art-effect="justiciar-armour-shine" pointer-events="none" aria-hidden="true">' +
      '<defs><clipPath id="' +
      id +
      '-plates">' +
      metal +
      '</clipPath>' +
      '<mask id="' +
      id +
      '-occlusion" x="50" y="70" width="245" height="470" maskUnits="userSpaceOnUse"><rect x="50" y="70" width="245" height="470" fill="white"/>' +
      occlusion +
      '</mask>' +
      '<linearGradient id="' +
      id +
      '-light" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff4d5" stop-opacity="0"/><stop offset=".37" stop-color="#fff4d5" stop-opacity=".2"/><stop offset=".48" stop-color="#fffaf0" stop-opacity=".85"/><stop offset=".54" stop-color="#fffaf0" stop-opacity=".85"/><stop offset=".67" stop-color="#e4d5b6" stop-opacity=".22"/><stop offset="1" stop-color="#e4d5b6" stop-opacity="0"/></linearGradient></defs>' +
      '<g clip-path="url(#' +
      id +
      '-plates)" mask="url(#' +
      id +
      '-occlusion)"><g opacity="0">' +
      '<animate attributeName="opacity" values="0;0;.88;.88;0;0" keyTimes="0;.48;.50;.78;.82;1" dur="10s" repeatCount="indefinite"/>' +
      '<animateTransform attributeName="transform" type="translate" values="0 -100;0 -100;0 540;0 540" keyTimes="0;.48;.82;1" dur="10s" repeatCount="indefinite"/>' +
      '<g transform="rotate(-20 178 265)"><rect x="-100" y="-25" width="560" height="70" fill="url(#' +
      id +
      '-light)"/></g>' +
      '</g></g></g>'
    );
  }

  function justiciar() {
    const star = (x, y, scale = 1) =>
      `<g transform="translate(${x} ${y}) scale(${scale})">${path('M0 -25 L6 -6 L21 0 L6 6 L0 24 L-6 6 L-21 0 L-6 -6Z', '#d4b653', '#9f854b', 1.2)}${path('M0 -25 V24 L-6 6 L-21 0 L-6 -6Z', '#f0d57c', '#d4b653', 1)}</g>`;
    const original = `<g>
      ${path('M145 367 L173 366 L174 445 L160 503 L140 503 L133 482 L139 432Z M190 365 L220 365 L229 432 L226 484 L210 504 L188 498 L190 446 L181 418Z', '#8b8498')}
      ${path('M140 430 L172 436 L162 481 L138 479 L132 451Z M192 435 L226 428 L233 449 L227 478 L199 484Z', '#c0b9c9')}
      ${path('M138 479 L162 481 L162 491 L140 489Z M199 484 L227 478 L224 488 L201 493Z', '#d1b465')}
      ${path('M140 489 L160 489 L156 509 L138 518 L117 516 L121 506Z M201 492 L225 487 L227 508 L245 515 L240 522 L212 519 L200 510Z', '#4e4759')}
      ${path('M131 307 L210 307 L234 365 L230 417 L182 430 L122 413 L125 361Z', '#555781')}
      ${path('M192 318 L210 307 L234 365 L230 417 L209 424 L199 396 L193 361Z', '#aca4b7')}
      ${path('M200 348 L222 342 L232 361 L208 370Z M209 383 L233 375 L232 385 L212 394Z M210 414 L230 407 L230 417 L211 426Z', '#c8aa5b', '#998453', 1.2)}
      ${path('M130 205 L110 202 L89 222 L85 260 L95 283 L121 268 L132 239Z M210 206 L233 204 L255 222 L269 260 L255 280 L229 268 L215 239Z', '#aaa4b3')}
      ${path('M88 259 L112 267 L109 299 L100 350 L83 350 L78 331 L86 296Z M245 269 L265 257 L271 302 L266 344 L250 352 L240 335 L247 304Z', '#938a9f')}
      ${path('M84 291 L108 297 L106 306 L84 301Z M249 298 L268 295 L269 305 L247 308Z', '#c0a565')}
      ${path('M83 342 L99 344 L105 356 L98 367 L80 364 L75 353Z M251 343 L267 339 L277 350 L270 364 L252 366 L245 357Z', '#a69a99')}
      ${path('M132 196 L165 188 L194 190 L219 208 L217 250 L202 284 L206 309 L184 323 L150 316 L127 302 L139 273 L124 240Z', '#c4bccb')}
      ${path('M134 215 L177 232 L214 218 L214 245 L178 260 L133 243Z', '#ded5df', '#a89dae', 1.5)}
      ${path('M139 269 L179 282 L203 267 L202 286 L206 309 L183 318 L150 309 L127 302Z', '#9e94ab', '#867d95', 1.7)}
      ${path('M128 298 L151 309 L182 318 L206 309 L208 317 L182 327 L148 320 L124 307Z', '#cfb36b')}
      ${path('M141 193 L163 194 L177 207 L194 197 L206 203 L205 215 L178 226 L139 210Z', '#d7b867', '#a08b59', 1.4)}
      ${path('M150 189 L169 178 L191 182 L203 193 L190 204 L174 207 L156 198Z', '#444668')}
      ${path('M96 216 L116 197 L138 207 L134 232 L115 250 L90 243Z M214 209 L236 199 L260 220 L269 244 L245 253 L219 235Z', '#d0c8d3')}
      ${path('M96 235 L116 248 L134 232 L130 246 L112 261 L91 250Z M221 236 L245 253 L267 244 L264 257 L243 265 L220 246Z', '#b49b60', '#8a7855', 1.4)}
      ${line('M100 218 L123 224 L134 232 M223 224 L246 223 L260 235 M223 239 L249 241', '#bfa967', 1.8)}
      ${path('M148 137 L157 118 L179 113 L203 130 L212 161 L203 189 L181 204 L157 188 L143 166Z', '#b8b0c1')}
      ${path('M179 113 L203 130 L212 161 L203 189 L181 204 L182 166Z', '#958aab', '#837794', 1.5)}
      ${path('M149 146 L158 143 L171 149 L158 154Z M184 148 L198 145 L204 150 L189 156Z', '#292632', '#292632', 1)}
      ${path('M178 123 L185 141 L207 144 L187 152 L182 182 L175 155 L151 144 L173 141Z', '#cbb064', '#a38a52', 1.4)}
      ${path('M146 139 L140 105 L150 113 L156 90 L166 112 L176 101 L185 117 L200 95 L204 117 L218 107 L211 146 L198 134 L189 146 L177 132 L166 142 L157 126Z', '#bdb4c4')}
      ${path('M150 113 L156 90 L161 117 L167 119 L176 101 L177 121 L185 117 L200 95 L197 123 L205 126 L211 109 L211 137 L198 134 L189 141 L179 130 L168 136 L157 124Z', '#d7b65e', '#aa9054', 1.3)}
      ${star(178, 265, 1.05)}
      ${star(179, 127, 0.5)}
    </g>`;
    const recoil =
      '<animateTransform attributeName="transform" type="rotate" values="0 178 230;0 178 230;2.5 178 230;0 178 230;0 178 230" keyTimes="0;.18;.22;.34;1" dur="10s" repeatCount="indefinite"/>';
    let moving = original.replace(
      /<path d="M132 196[\s\S]*?(?=<path d="M96 216)/,
      (geometry) => '<g data-justiciar-part="chestguard">' + recoil + geometry + '</g>'
    );
    const cloth = path(
      'M131 307 L210 307 L234 365 L230 417 L182 430 L122 413 L125 361Z',
      '#555781'
    );
    moving = moving.replace(
      cloth,
      '<g data-justiciar-part="indigo-cloth"><animateTransform attributeName="transform" type="rotate" values="0 179 310;0 179 310;-3 179 310;1.5 179 310;0 179 310;0 179 310" keyTimes="0;.19;.27;.36;.48;1" dur="10s" repeatCount="indefinite"/>' +
        cloth +
        '</g>'
    );
    const impact =
      '<g data-art-effect="justiciar-absorbed-blow" pointer-events="none" aria-hidden="true">' +
      '<g opacity="0"><animateTransform attributeName="transform" type="translate" values="60 210;60 210;172 257;172 257;172 257" keyTimes="0;.05;.18;.24;1" dur="10s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0;.86;.86;0;0" keyTimes="0;.049;.055;.18;.185;1" dur="10s" repeatCount="indefinite"/>' +
      '<g transform="rotate(23)"><path d="M-55 -4 L-41 -8 L-10 -4 L0 0 L-10 4 L-44 2Z" fill="#ded5df" stroke="#82798a" stroke-width="1.2"/><path d="M-46 -3 L-10 -1 L0 0" fill="none" stroke="#f4eeeb" stroke-width="1.6"/></g></g>' +
      '<g opacity="0"><animate attributeName="opacity" values="0;0;.6;0;0" keyTimes="0;.18;.2;.45;1" dur="10s" repeatCount="indefinite"/>' +
      path('M134 215 L177 232 L214 218 L214 245 L178 260 L133 243Z', '#f4eeeb', '#d7b867', 1.5) +
      '<g transform="translate(178 265) scale(1.05)">' +
      path('M0 -25 L6 -6 L21 0 L6 6 L0 24 L-6 6 L-21 0 L-6 -6Z', '#f0d57c', '#d4b653', 1.2) +
      '</g></g>' +
      '<g transform="translate(172 257)" opacity="0"><animate attributeName="opacity" values="0;0;.9;0;0" keyTimes="0;.18;.19;.27;1" dur="10s" repeatCount="indefinite"/><path d="M-5 -3 L-25 -17 M-7 2 L-29 7 M-3 7 L-14 24" fill="none" stroke="#f0d57c" stroke-width="2.5" stroke-linecap="round"/></g></g>';
    const closing = moving.lastIndexOf('</g>');
    return (
      moving.slice(0, closing) + impact + justiciarArmourShine(original) + moving.slice(closing)
    );
  }

  function frameOrnaments(count, index, uid, celebrate, { anchors }) {
    return anchors
      .map(([x, y], i) =>
        count >= (i + 1) * 25
          ? `<g data-ornament="${i + 1}" class="${celebrate && (count === 100 || count === (i + 1) * 25) ? 'ornament-new' : ''}">${sigil(x, y, 0.55, sceneNumber(index))}</g>`
          : `<circle cx="${x}" cy="${y}" r="4" fill="#332b22" stroke="#6e5c43"/>`
      )
      .join('');
  }

  function shrineMarkup(pieces, index, celebrate = false) {
    const colours = sceneColors(index);
    return Array.from({ length: 4 }, (_, i) => {
      const charge = Math.max(0, Math.min(25, pieces - i * 25));
      const awake = charge === 25;
      const carving = `${path('M-22 84 V-5 L0 -32 L22 -5 V84Z', '#65505a', '#322830', 2)}${path('M0 -32 L22 -5 V84 H0Z', '#42333f', '#322830', 1)}${line('M-26 84 H26 M-23 76 H23', '#bfa277', 3)}${sigil(0, 20, 0.85, sceneNumber(index))}`;
      return `<div class="shrine-totem ${awake ? 'awake' : charge > 0 || i === Math.floor(pieces / 25) ? 'charging' : ''} ${celebrate && awake && (pieces === 100 || pieces === (i + 1) * 25) ? 'just-awakened' : ''}" style="--shrine-light:${colours[3]}"><svg viewBox="-40 -50 80 158" role="img" aria-label="Sigil ${i + 1}: ${charge} of 25 raids"><defs><clipPath id="tob-charge-${i}"><rect x="-40" y="${85 - (charge / 25) * 135}" width="80" height="${(charge / 25) * 135}"/></clipPath><filter id="tob-stone-${i}"><feColorMatrix type="saturate" values="0"/></filter></defs><g filter="url(#tob-stone-${i})" opacity=".28">${carving}</g><g class="totem-light" clip-path="url(#tob-charge-${i})">${carving}</g></svg><small>${awake ? 'AWAKENED' : pieces < 100 && i === Math.floor(pieces / 25) ? charge + ' / 25' : 'WAITING'}</small></div>`;
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
      const floor = `${path('M20 488 L180 445 L340 488 V550 H20Z', '#4f3e47')}${line('M20 514 H340 M20 540 H340 M117 464 L82 550 M243 462 L279 550 M180 447 V550', '#967a7d', 1.5)}`;
      let illustration;
      if (scene === 0) {
        illustration = `${ring(180, 240, 124, '#a96668')}${ellipse(180, 239, 102, 102, '#572934', '#8b454e', 2)}${line('M75 174 L285 306 M74 306 L284 174 M180 115 V362', '#754350', 1.5)}${floor}${path('M28 509 L38 501 L55 500 L63 495 L76 499 L83 506 L75 514 L55 518 L38 516Z', '#922e3b', '#5e2935', 1.6)}${line('M37 507 L53 505 L64 508 M53 514 L68 511', '#cc625b', 1.4)}${path('M67 499 L95 468 H267 L298 499 L280 526 H82Z', '#382d36', '#b19576', 2)}${path('M95 468 H267 L254 489 H107Z', '#873340')}${line('M105 501 H259 M117 514 H247', '#c09283', 2)}${scythe()}${path('M82 418 H101 V432 L109 440 V474 Q92 487 75 474 V440 L82 432Z M284 418 H301 V432 L309 440 V474 Q292 487 275 474 V440 L284 432Z', '#902f3d', '#382a31', 2)}${line('M82 450 V469 M283 450 V469', '#de827b', 2)}${path('M81 416 H103 V425 H81Z M282 416 H304 V425 H282Z', '#b69d72')}`;
      } else if (scene === 1) {
        illustration = `${path('M62 550 V236 Q60 153 180 88 Q300 153 298 236 V550Z', '#36283f', '#9a7a80', 2)}${line('M83 540 V234 Q82 169 180 117 Q278 169 278 234 V540 M55 498 H305 M55 518 H305 M63 273 H296', '#685260', 1.5)}${ring(180, 210, 111, '#9d895e')}${floor}${verzik()}${verzikMotes()}`;
      } else if (scene === 2) {
        illustration = `${nylocasChamber(colours)}${nylocas(180, 218, 0.94, 0, true)}${nylocas(100, 424, 0.86, 1, true)}${nylocas(265, 420, 0.86, 2, true)}${sigil(181, 494, 0.65, 2)}`;
      } else if (scene === 3) {
        illustration = `${path('M180 77 L215 106 L267 128 L292 190 L314 231 L302 291 L313 345 L273 407 L180 442 L89 407 L49 344 L61 291 L46 231 L68 190 L96 128 L147 106Z', '#542638', '#ac4a5b', 2.5)}${path('M180 101 L214 140 L255 150 L269 201 L291 233 L279 291 L290 340 L258 386 L180 416 L103 386 L70 340 L82 291 L69 233 L93 201 L105 150 L148 140Z', '#292532', '#734057', 1.8)}${path('M96 128 L147 106 L180 77 L156 120 L125 145 L96 177Z M267 128 L292 190 L314 231 L296 219 L283 193 L270 155Z M49 344 L89 407 L122 416 L91 376 L70 343Z M302 291 L313 345 L289 376 L293 333Z', '#983a4e', '#672c41', 1.5)}${line('M82 210 L61 245 L70 283 M278 180 L297 229 M293 379 L271 400 M118 126 L141 116', '#d06970', 1.6)}${shadowMaze()}${sotetseg()}`;
      } else if (scene === 4) {
        illustration = `${path('M47 492 V252 Q49 174 180 83 Q311 174 313 252 V492Z', '#402a3b', '#9e6370', 2)}${path('M53 475 V269 L89 197 L124 269 V475Z M237 475 V269 L272 197 L307 269 V475Z', '#642c42', '#a15f71', 1.7)}${path('M133 448 V196 L180 107 L227 196 V448Z', '#793044', '#c27479', 1.8)}${path('M180 107 V448 H133 V196Z', '#4c263b', '#8a4155', 1.3)}${line('M54 305 H120 M55 366 H120 M241 305 H305 M241 366 H305 M180 110 V128 M61 243 L89 216 L116 242 M244 243 L272 216 L300 242', '#a26478', 1.3)}${floor}${maiden()}${scurryingMatomenos()}${maidenMotes()}`;
      } else {
        illustration = `${path('M180 73 L286 248 L180 457 L74 248Z', '#6d6580', '#c1b38e', 2)}${ring(180, 240, 110, '#d6c48c')}${line('M180 80 V436 M74 248 H286 M104 139 L263 351 M96 341 L258 136', '#ada2a8', 1.5)}${floor}${path('M106 528 L125 510 H237 L260 529 V544 H106Z', '#7a6c75', '#c0ad8a', 2)}${justiciar()}`;
      }
      return `${panes}${arch}${illustration}${line('M62 540 H298', colours[4], 1.3)}`;
    },
  });
  return { art, shrineMarkup, sceneColors };
};
