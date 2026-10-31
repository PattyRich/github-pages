/* Original Wiki-referenced stained glass. Approved after per-window artwork reviews. */
/* global GLASS_RENDERERS, createGlassWindow */
GLASS_RENDERERS.tfa = function createFracturedArchiveRenderer(config, { esc, getJournal }) {
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
  const sceneKeys = [
    'obligator',
    'bork-smorks',
    'archive-guardian',
    'ezekiel',
    'ocellus',
    'cosmic-loot',
  ];
  /* Original stained glass from the current model and actual Archive reward chest.
   * https://oldschool.runescape.wiki/w/File:Obligator_detail.png
   * https://oldschool.runescape.wiki/w/File:Obligator_equipped_male.png
   * https://oldschool.runescape.wiki/w/File:The_Fractured_Archive_-_reward_room_environment_concept.png
   * https://oldschool.runescape.wiki/w/File:Chest_(The_Fractured_Archive,_standard,_mine).webp
   * Chest rework pass 1: a close view of the rare skull chest, already open, with
   * its lime cage prize rising from a jagged Void cavity. Mirrored presentation
   * leaves the raised lid's skull visible beside the complete brown vine loop.
   * Chest rework pass 2: reopened the current weapon model and reward concept
   * beside the first still and full-cycle sheet. Broke up the Void's regular
   * zigzag into irregular shards, added hinge planes and rim glints, and restored
   * the room's flanking braziers in purple. The whole prize remains visible when
   * motion is reduced and lifts as one piece without exposing a disconnected vine.
   * Green-border pass 1: trace the cage's actual metal body and asymmetric spikes
   * with a bright lime edge. Only its opacity pulses; the silhouette stays fixed.
   * Green-border pass 2: inspected enlarged and thumbnail full-cycle captures,
   * narrowed the faint outer edge and used the cage core's greener lime.
   * Timed pulse pass 1: the fitted border is visible only during the treasure
   * rise. Its resting and reduced-motion states are completely hidden.
   * Timed pulse pass 2: sampled rest, rise, peak and the loop boundary, then
   * softened the fade curves while retaining the same brief 7.2–12s pulse.
   */
  scenes.obligator = (h, c, id) => {
    const { p, l, g, ellipse, a, move } = h;
    const seconds = 24;
    const timing = '0;.2;.32;.42;.56;.72;1';
    const ink = '#252638';
    const earth = '#574c2b';
    const rootLight = '#83704b';
    const rootDark = '#3d3b24';
    const steel = '#748578';
    const steelLight = '#97a696';
    const steelDark = '#354b40';

    function greenPulse() {
      // These are the same metal-and-spike silhouettes drawn by weapon() below.
      // Drawing the border behind those opaque faces conceals every inside edge.
      const cageEdge = [
        'M190 335 L250 338 L283 367 L293 414 L268 456 L222 479 L172 455 L142 417 L147 372Z',
        'M169 352 L161 321 L190 344Z',
        'M199 337 L206 309 L222 339Z',
        'M255 343 L286 318 L275 358Z',
        'M280 372 L319 365 L290 392Z',
        'M291 408 L316 429 L279 427Z',
        'M265 454 L281 483 L250 468Z',
        'M225 470 L215 507 L207 469Z',
        'M174 450 L153 476 L158 439Z',
        'M151 414 L118 427 L143 397Z',
        'M149 372 L125 351 L161 354Z',
      ].join(' ');
      const border =
        p(cageEdge, 'none', '#82ad30', 9.2, 'opacity=".16"') +
        p(cageEdge, 'none', '#98bd2d', 7.4) +
        p(cageEdge, 'none', '#b4d84a', 4.4);
      return (
        '<g opacity="0" data-art-effect="obligator-green-pulse">' +
        a(
          'opacity',
          '0;0;.98;.98;0;0',
          '0;.30;.38;.42;.50;1',
          seconds,
          'calcMode="spline" keySplines="0 0 1 1;.42 0 .58 1;0 0 1 1;.42 0 .58 1;0 0 1 1"'
        ) +
        border +
        '</g>'
      );
    }

    function weapon() {
      let loop = p(
        'M97 358 L80 342 L91 311 L83 289 L74 267 L76 241 L67 220 L73 193 L76 167 L91 145 L96 125 L122 111 L143 96 L168 98 L192 91 L218 106 L225 126 L244 144 L246 170 L239 191 L245 212 L233 239 L229 260 L218 283 L200 279 L207 252 L211 231 L220 209 L214 190 L221 168 L215 151 L199 140 L193 123 L173 117 L153 122 L136 117 L120 132 L109 139 L105 158 L93 178 L94 200 L85 220 L94 238 L92 263 L101 282 L109 307 L104 327 L112 341Z',
        earth,
        rootDark,
        2.6
      );
      loop += p('M97 358 L80 342 L91 311 L104 327 L112 341Z', '#74643e', 'none');
      loop += p('M91 311 L83 289 L74 267 L92 263 L101 282 L109 307Z', rootLight, 'none');
      loop += p('M74 267 L76 241 L67 220 L85 220 L94 238 L92 263Z', '#625c37', 'none');
      loop += p('M67 220 L73 193 L76 167 L93 178 L94 200 L85 220Z', '#8c7750', 'none');
      loop += p('M76 167 L91 145 L96 125 L109 139 L105 158 L93 178Z', '#6b6239', 'none');
      loop += p('M96 125 L122 111 L143 96 L153 122 L136 117 L120 132 L109 139Z', '#887449', 'none');
      loop += p('M143 96 L168 98 L192 91 L173 117 L153 122Z', '#554b27', 'none');
      loop += p('M192 91 L218 106 L225 126 L199 140 L193 123 L173 117Z', '#796c3d', 'none');
      loop += p('M225 126 L244 144 L246 170 L221 168 L215 151 L199 140Z', '#89764f', 'none');
      loop += p('M246 170 L239 191 L245 212 L220 209 L214 190 L221 168Z', '#5d5932', 'none');
      loop += p('M245 212 L233 239 L229 260 L207 252 L211 231 L220 209Z', '#8a744a', 'none');
      loop += p('M229 260 L218 283 L200 279 L207 252Z', '#6b6032', 'none');
      loop += p(
        'M80 342 L91 311 L98 321 L91 344 L97 358Z M74 267 L92 263 L97 274 L82 281Z M76 167 L93 178 L89 190 L72 196Z M122 111 L143 96 L148 109 L132 122Z M218 106 L225 126 L211 134 L206 117Z M239 191 L245 212 L229 222 L221 210Z',
        '#5d4f2c',
        'none'
      );
      loop += p(
        'M91 311 L109 307 L104 327 L98 321Z M76 241 L94 238 L87 250 L75 254Z M91 145 L96 125 L109 139 L105 149Z M153 122 L173 117 L181 106 L167 109Z M244 144 L246 170 L232 166 L230 152Z M229 260 L218 283 L211 275 L218 257Z',
        '#9b885e',
        'none'
      );
      loop += l(
        'M93 337 L97 322 M82 259 L85 242 M82 201 L88 181 M106 130 L124 123 M155 106 L174 108 M209 120 L214 137 M232 165 L227 185 M226 226 L218 242',
        '#a9956c',
        1.1
      );
      let head = p(
        'M221 352 L211 319 L195 300 L190 273 L208 297 L221 305 L230 278 L246 258 L238 296 L237 315 L254 307 L273 275 L265 315 L247 338 L246 355Z',
        earth,
        rootDark,
        2.4
      );
      head += p('M221 352 L226 324 L230 305 L238 296 L237 315 L231 340Z', '#879039', 'none');
      head += p('M195 300 L190 273 L208 297 L221 305 L211 319Z', '#8e7e4e', 'none');
      head += p('M237 315 L254 307 L273 275 L265 315 L247 338Z', '#73653c', 'none');

      // Radial spikes are asymmetric, as on the faceted in-game cage.
      const spikes = [
        ['M169 352 L161 321 L190 344Z', '#9eaba0'],
        ['M199 337 L206 309 L222 339Z', '#acb9a9'],
        ['M255 343 L286 318 L275 358Z', '#95a69b'],
        ['M280 372 L319 365 L290 392Z', '#9ba99d'],
        ['M291 408 L316 429 L279 427Z', '#83958b'],
        ['M265 454 L281 483 L250 468Z', '#6b7d73'],
        ['M225 470 L215 507 L207 469Z', '#8a9d8e'],
        ['M174 450 L153 476 L158 439Z', '#71877b'],
        ['M151 414 L118 427 L143 397Z', '#9aa89a'],
        ['M149 372 L125 351 L161 354Z', '#9ba99c'],
      ];
      spikes.forEach(([d, color]) => {
        head += p(d, color, steelDark, 1.6);
        const coordinates = d.match(/-?\d+(?:\.\d+)?/g).map(Number);
        const [x0, y0, tipX, tipY, x2, y2] = coordinates;
        const ridgeX = (x0 + x2) / 2;
        const ridgeY = (y0 + y2) / 2;
        head += p(`M${tipX} ${tipY} L${ridgeX} ${ridgeY} L${x2} ${y2}Z`, '#5b7365', 'none');
        head += l(`M${tipX} ${tipY} L${ridgeX} ${ridgeY}`, '#7a8f7e', 0.75);
      });

      head += p(
        'M190 335 L250 338 L283 367 L293 414 L268 456 L222 479 L172 455 L142 417 L147 372Z',
        steel,
        steelDark,
        2.8
      );
      head += p('M190 335 L250 338 L242 354 L193 353 L160 381 L147 372Z', steelLight, 'none');
      head += p('M250 338 L283 367 L275 382 L242 354Z', '#9aa89e', 'none');
      head += p('M283 367 L293 414 L276 413 L268 384 L275 382Z', '#657b6f', 'none');
      head += p('M293 414 L268 456 L222 479 L220 459 L254 441 L276 413Z', '#566d61', 'none');
      head += p('M222 479 L172 455 L142 417 L160 415 L184 442 L220 459Z', '#6c8476', 'none');
      head += p('M142 417 L147 372 L160 381 L160 415Z', '#a4b1a2', 'none');

      // Dark inset sockets and bright pentagonal faces create an open metal cage.
      const sockets = [
        [
          'M184 354 L215 355 L227 380 L203 403 L174 389Z',
          'M189 363 L210 364 L217 379 L201 394 L183 384Z',
          '#a9c93d',
        ],
        [
          'M242 356 L267 373 L272 398 L247 409 L228 382Z',
          'M243 365 L260 377 L264 392 L248 400 L237 382Z',
          '#a4c635',
        ],
        [
          'M171 406 L199 413 L206 441 L184 445 L165 427Z',
          'M175 414 L193 419 L197 434 L184 438 L173 426Z',
          '#bbd84b',
        ],
        [
          'M220 418 L246 414 L258 435 L234 453 L214 442Z',
          'M224 425 L242 422 L249 434 L234 445 L222 438Z',
          '#b2d63f',
        ],
        ['M270 409 L283 418 L267 442 L257 439Z', 'M271 417 L277 420 L266 434 L264 431Z', '#88af2c'],
      ];
      sockets.forEach(([rim, face, color], i) => {
        const coordinates = rim.match(/-?\d+(?:\.\d+)?/g).map(Number);
        const points = Array.from({ length: coordinates.length / 2 }, (_, j) => [
          coordinates[j * 2],
          coordinates[j * 2 + 1],
        ]);
        const center = points.reduce(
          (sum, point) => [sum[0] + point[0] / points.length, sum[1] + point[1] / points.length],
          [0, 0]
        );
        const outer = points.map(([x, y]) => [
          center[0] + (x - center[0]) * 1.2,
          center[1] + (y - center[1]) * 1.2,
        ]);
        const shade = ['#a5b29e', '#809985', '#405c49', '#506b55', '#8b9f89'];
        points.forEach(([x, y], j) => {
          const next = (j + 1) % points.length;
          head += p(
            `M${outer[j].join(' ')} L${outer[next].join(' ')} L${points[next].join(' ')} L${x} ${y}Z`,
            shade[j],
            '#687f6b',
            0.65
          );
        });
        head += p(rim, '#192e24', '#5f7961', 1.1);
        head += p(face, color, '#697f35', 1.3);
        if (i === 0)
          head += p('M184 354 L215 355 L210 364 L189 363 L183 384 L174 389Z', '#4e6653', 'none');
        if (i === 1)
          head += p('M242 356 L267 373 L260 377 L243 365 L237 382 L228 382Z', '#405b45', 'none');
        if (i === 2)
          head += p('M171 406 L199 413 L193 419 L175 414 L173 426 L165 427Z', '#456047', 'none');
        if (i === 3)
          head += p('M220 418 L246 414 L242 422 L224 425 L222 438 L214 442Z', '#3f5b44', 'none');
        if (i === 0) head += p('M189 363 L210 364 L201 372 L185 377Z', '#cadd65', 'none');
        if (i === 1) head += p('M243 365 L260 377 L250 380 L240 375Z', '#c0d552', 'none');
        if (i === 3) head += p('M224 425 L242 422 L234 431 L222 438Z', '#d2e66a', 'none');
        if (i === 0)
          head += p('M201 372 L210 364 L217 379 L208 385 L201 394 L193 387Z', '#b4d84a', 'none');
        if (i === 1) head += p('M250 380 L260 377 L264 392 L248 400 L249 388Z', '#82ad30', 'none');
        if (i === 2) head += p('M175 414 L184 420 L184 438 L173 426Z', '#d0e46b', 'none');
        if (i === 3) head += p('M234 431 L249 434 L234 445 L222 438Z', '#98bd2d', 'none');
      });
      head += p('M214 395 L229 393 L244 413 L220 418 L204 408Z', '#91a48e', steelDark, 1.5);
      head += p('M214 395 L229 393 L219 404 L204 408Z', '#b4c0a8', 'none');
      head += p('M219 404 L229 393 L244 413 L220 418Z', '#728c72', 'none');
      head += p('M162 388 L173 387 L176 402 L158 409 L146 403Z', '#a3b0a1', steelDark, 1.2);
      head += p('M270 391 L282 394 L291 406 L277 411 L266 401Z', '#9eada0', steelDark, 1.3);
      head += l(
        'M191 343 L243 346 M157 377 L150 411 M179 451 L216 469 M257 450 L280 417',
        '#c1c8b2',
        1.3
      );

      // The forked vine joins the same neck and metal cage as the current model.
      const neck =
        p(
          'M200 278 L218 277 L230 301 L238 327 L225 347 L210 332 L215 312 L207 298Z',
          earth,
          rootDark,
          2.2
        ) + p('M215 283 L216 306 L225 324 L226 341 L231 335 L230 321 L221 303Z', '#a2c840', 'none');
      const shine = p(
        'M189 363 L210 364 L217 379 L201 394 L183 384Z M243 365 L260 377 L264 392 L248 400 L237 382Z M224 425 L242 422 L249 434 L234 445 L222 438Z',
        '#e0ec8d',
        'none'
      );
      head +=
        '<g opacity=".05" data-art-effect="obligator-core-reflection">' +
        a('opacity', '.05;.05;.2;.32;.16;.05;.05', timing, seconds) +
        shine +
        '</g>';
      return greenPulse() + loop + neck + head;
    }

    function sparkle(x, y, size, delay) {
      const shape = p('M0 -5 L1 -1 L4 0 L1 1 L0 5 L-1 1 L-4 0 L-1 -1Z', '#d8cee5', 'none');
      return g(
        'translate(' + x + ' ' + y + ') scale(' + size + ')',
        '<g opacity=".4">' +
          a('opacity', '.4;.4;.82;.4;.4', '0;.32;.43;.6;1', seconds, 'begin="-' + delay + 's"') +
          shape +
          '</g>'
      );
    }

    // Faceted violet glass and narrow light spills, never a solid glowing orb.
    let art = p('M20 550 V220 Q20 92 180 18 Q340 92 340 220 V550Z', '#181b30', ink, 1);
    art += p(
      'M180 26 L253 119 L290 231 L240 351 L185 427 L113 328 L58 215 L105 127Z',
      '#25263e',
      '#38354e',
      1.1
    );
    art += p('M180 26 L185 427 L113 328 L58 215 L105 127Z', '#20243a', '#38354e', 1.1);
    art += p(
      'M58 215 L113 328 L87 420 L34 368Z M290 231 L329 324 L299 420 L240 351Z',
      '#302840',
      '#3d3452',
      1.1
    );
    art += p('M71 520 L88 449 L180 419 L284 449 L308 520Z', '#343149', '#494158', 1.3);
    art += p('M180 419 L144 518 H71 L88 449Z M180 419 L284 449 L308 520 H255Z', '#3e3554', 'none');
    [
      [151, 76, 0.42, 0],
      [208, 91, 0.45, 5],
      [86, 184, 0.47, 10],
      [283, 201, 0.55, 13],
      [304, 283, 0.48, 18],
      [56, 342, 0.48, 2],
      [75, 478, 0.42, 17],
      [306, 501, 0.48, 8],
      [178, 538, 0.44, 20],
    ].forEach((s) => {
      art += sparkle(...s);
    });

    // The reward dais, viewed from close enough to see the prize and hinges.
    art += ellipse(180, 515, 132, 22, '#171a29', 'none', 0, 'opacity=".8"');
    art += p('M50 491 L91 469 H275 L312 492 V518 L282 536 H82 L50 518Z', '#636075', ink, 2);
    art += p('M50 491 L91 480 H275 L312 492 L279 508 H83Z', '#8e879c', ink, 1.4);
    art += p('M83 508 H279 V536 H83Z', '#494457', ink, 1.2);
    art += p('M50 491 L83 508 V536 L50 518Z', '#746a83', ink, 1.3);
    art += p('M279 508 L312 492 V518 L282 536Z', '#3c3c50', ink, 1.3);
    art += l('M90 519 H272 M109 510 V533 M252 510 V533', '#9e91ac', 1);

    function brazier(x, y, mirror) {
      const body =
        p('M-5 14 L-3 -14 H3 L5 14 L3 25 L7 41 H-7 L-3 25Z', '#565e76', ink, 1.2) +
        p('M-9 -15 L-6 -7 H6 L10 -15 L4 -13 L0 -17 L-4 -13Z', '#9b9fb8', ink, 1.2) +
        l('M-1 0 V12 M0 28 L-2 37', '#b0a2bf', 0.9);
      const fire =
        p(
          'M-5 -15 Q-12 -28 -4 -35 Q-4 -27 0 -27 Q6 -35 3 -42 Q17 -30 9 -20 L5 -13Z',
          '#a76cd1',
          '#714d99',
          1
        ) + p('M-2 -15 Q-7 -25 -1 -30 Q0 -23 4 -27 Q9 -19 4 -15Z', '#e2c0ef', 'none');
      return g(
        'translate(' + x + ' ' + y + ') scale(' + (mirror ? -0.8 : 0.8) + ' .8)',
        body +
          '<g opacity=".8">' +
          a('opacity', '.8;.68;.84;.93;.76;.8;.8', timing, seconds) +
          fire +
          '</g>'
      );
    }
    art += brazier(44, 457, false) + brazier(319, 457, true);

    // The rare reward chest keeps its spiked skull lid and dark corner brackets.
    // The front is uninterrupted crystal trim, without the concept's lower jaw.
    let lid = p(
      'M151 393 L142 355 L129 323 L157 328 L162 292 L181 315 L196 287 L217 313 L245 299 L254 321 L291 307 L284 337 L310 333 L290 370 L281 405 L255 423 L188 421Z',
      '#7d90b0',
      ink,
      2.5
    );
    lid += p('M142 355 L129 323 L157 328 L162 292 L181 315 L177 352Z', '#b0bfd3', ink, 1.2);
    lid += p('M181 315 L196 287 L217 313 L210 343 L177 352Z', '#526484', ink, 1.2);
    lid += p('M217 313 L245 299 L254 321 L241 343 L210 343Z', '#a3b7cf', ink, 1.2);
    lid += p(
      'M254 321 L291 307 L284 337 L310 333 L290 370 L263 369 L241 343Z',
      '#6b7e9e',
      ink,
      1.2
    );
    lid += p('M142 355 L177 352 L211 365 L188 421 L151 393Z', '#647c9e', ink, 1.2);
    lid += p('M211 365 L263 369 L281 405 L255 423 L188 421Z', '#475c7d', ink, 1.2);
    lid += p('M211 365 L263 369 L263 394 L239 411 L203 411Z', '#8b9cbd', ink, 1.2);
    lid += l(
      'M157 335 L165 314 M261 336 L278 322 M154 376 L171 383 M273 388 L269 399',
      '#ccd4df',
      1.2
    );
    // Angular sockets and hanging teeth identify the skull even at picker size.
    lid += p(
      'M216 338 L236 327 L256 335 L266 353 L262 371 L251 379 L248 394 L240 389 L236 398 L229 391 L220 393 L217 381 L207 375 L204 357Z',
      '#c8cbd7',
      '#515e7a',
      1.6
    );
    lid += p('M216 338 L236 327 L236 343 L220 349 L213 365 L204 357Z', '#e0ddea', 'none');
    lid += p('M247 337 L256 335 L266 353 L262 371 L251 379 L247 373 L252 356Z', '#8c99b5', 'none');
    lid += p(
      'M214 351 L230 348 L226 360 L214 362Z M241 348 L257 352 L255 363 L242 359Z',
      '#3c3156',
      '#68718e',
      1
    );
    lid += p(
      'M218 353 L227 352 L224 357 L217 358Z M244 352 L254 354 L252 359 L245 357Z',
      '#a079c1',
      'none'
    );
    lid += p('M234 360 L241 370 L229 371Z', '#5b5573', 'none');
    lid += l(
      'M219 378 L221 386 M226 378 L229 390 M234 379 L237 392 M243 377 L244 387 M251 373 L249 383',
      '#6f738c',
      1.1
    );
    art += '<g data-relic="archive-skull-lid">' + lid + '</g>';

    // Jagged Void and broad rising planes make the chest feel deep and open.
    art += p('M67 423 L101 395 L252 400 L297 426 L261 449 L103 450Z', '#121526', '#9981c3', 2.5);
    art += p('M79 423 L107 406 L249 409 L282 426 L258 441 L106 441Z', '#090f1d', '#3a3150', 1.4);
    art += p(
      'M76 422 L85 407 L93 422 L104 398 L111 418 L128 413 L137 430 L147 405 L153 423 L175 431 L188 411 L196 429 L211 417 L224 433 L243 414 L249 431 L263 426 L269 414 L275 432 L283 420 L274 439',
      'none',
      '#ad79da',
      2
    );
    art += l(
      'M88 409 L93 422 L104 398 M147 405 L153 423 M243 414 L249 431 M275 432 L283 420',
      '#ddc0eb',
      0.85
    );
    art += p(
      'M89 418 L98 422 L102 434 L95 438 L85 430Z M259 422 L274 418 L279 429 L265 437Z',
      '#665481',
      ink,
      0.8
    );
    art += p(
      'M89 418 L98 422 L93 427 L85 430Z M259 422 L274 418 L270 426 L265 429Z',
      '#bda4d3',
      'none'
    );
    art +=
      '<g opacity=".14" data-art-effect="obligator-chest-light">' +
      a('opacity', '.14;.14;.3;.42;.25;.14;.14', timing, seconds) +
      p(
        'M98 429 L60 258 L110 296 L151 423Z M146 429 L138 156 L174 202 L188 428Z M190 426 L233 204 L245 284 L227 429Z M232 429 L302 313 L277 422Z',
        '#9870bd',
        'none'
      ) +
      p(
        'M149 429 L160 281 L181 429Z M201 429 L228 290 L222 430Z',
        '#c3b8b7',
        'none',
        0,
        'opacity=".35"'
      ) +
      '</g>';

    // The entire weapon rises as one piece, so the vine and cage cannot separate.
    art +=
      '<g data-art-effect="obligator-treasure-lift">' +
      move('0 0;0 0;0 -14;0 -22;0 -14;0 0;0 0', timing, seconds) +
      g('translate(330 -10) scale(-.85 .85)', weapon(), 'data-relic="obligator-prize"') +
      '</g>';

    // The fixed front occludes the lowest spike, seating the prize in the cavity.
    let front = p(
      'M67 423 L104 442 H262 L297 426 L284 493 L263 512 H105 L77 490Z',
      '#788bab',
      ink,
      2.4
    );
    front += p('M67 423 L104 442 L105 512 L77 490Z', '#a6b3cb', ink, 1.2);
    front += p('M262 442 L297 426 L284 493 L263 512Z', '#516481', ink, 1.2);
    front += p('M104 442 H262 L263 512 H105Z', '#8793b4', ink, 1.2);
    front += p(
      'M105 444 L120 450 L126 487 L119 510 H108 L113 488Z M150 444 L159 447 L157 471 L166 488 L163 511 H153 L156 490 L148 474Z M206 443 L217 445 L213 469 L223 487 L218 512 H207 L213 489 L204 472Z M244 444 H256 L253 475 L258 493 L250 511 H240 L249 491 L242 477Z',
      '#b1a2ce',
      '#68718f',
      1
    );
    front += p(
      'M77 446 L87 454 L93 485 L86 495 L81 487Z M273 449 L286 441 L279 485 L270 494Z',
      '#697e9d',
      'none'
    );
    front += p(
      'M75 476 L64 481 L65 500 L77 510 L85 505 L75 499 L74 491 L85 487Z M286 476 L299 483 L298 501 L284 513 L276 506 L288 499 L290 491 L278 488Z',
      '#353849',
      ink,
      1.3
    );
    front += p(
      'M105 502 L97 517 L107 523 L119 513 M263 503 L274 516 L266 525 L252 513',
      '#3a3c4d',
      ink,
      1.4
    );
    front += l('M110 444 H146 M226 444 H257 M108 500 H145 M226 501 H255', '#d4d3df', 1.3);
    front +=
      '<g opacity=".08" data-art-effect="obligator-chest-reflection">' +
      a('opacity', '.08;.08;.18;.3;.14;.08;.08', timing, seconds) +
      p(
        'M107 443 L142 445 L136 464 L117 458Z M148 444 L174 445 L165 457 L155 454Z',
        '#c1d992',
        'none'
      ) +
      '</g>';
    art += '<g data-relic="archive-rare-chest">' + front + '</g>';

    // A few lifted splinters lead the eye out of the chest, without covering it.
    [
      [80, 391, 0],
      [289, 380, 4],
      [92, 297, 9],
      [274, 256, 15],
      [230, 191, 20],
    ].forEach(([x, y, delay], i) => {
      const fragment = p('M0 -5 L4 -1 L1 6 L-3 2Z', i % 2 ? '#c6c0d6' : '#9c82b8', ink, 0.6);
      art += g(
        'translate(' + x + ' ' + y + ')',
        '<g opacity=".5">' +
          a('opacity', '.5;.5;.8;.3;.5', '0;.2;.4;.7;1', seconds, 'begin="-' + delay + 's"') +
          move('0 0;0 0;3 -11;1 -16;0 0', '0;.2;.4;.7;1', seconds) +
          fragment +
          '</g>'
      );
    });
    return '<g id="' + id + '-obligator" data-reference-version="2026-10-28">' + art + '</g>';
  };

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
  scenes['bork-smorks'] = function drawBorkAndSmorks(h, c, id) {
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
    out += l(
      'M40 518 L326 518 M98 464 L79 543 M184 465 L177 543 M274 473 L292 543',
      '#a6a283',
      1.1
    );
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
        ellipse(0, 0, 38, 10, 'none', '#d3c39a', 2.6) +
        ellipse(0, 0, 28, 7, 'none', '#a99e79', 1.6);
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
    cart += p(
      'M42 88 L52 94 L56 111 L50 135 L41 142 L31 135 L37 116 L29 103Z',
      '#c5a23b',
      ink,
      1.4
    );
    cart += p('M39 81 L49 78 L57 86 L54 98 L44 104 L33 97 L31 87Z', '#899a4c', '#48543a', 1.1);
    cart += p(
      'M34 85 L23 76 L27 94 L38 96Z M51 83 L63 78 L57 96 L50 98Z',
      '#7c8d46',
      '#48543a',
      0.8
    );
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
    out += l(
      'M58 525 L91 519 M172 534 L204 529 M295 527 L316 521',
      '#c4b18a',
      1.3,
      'opacity=".55"'
    );
    return out;
  };

  /* Original stained glass, current OSRS model references inspected before drawing:
   * https://oldschool.runescape.wiki/w/File:Archive_Guardian.png
   * https://oldschool.runescape.wiki/w/File:Archive_Guardian_concept_art.png
   * Pass 2: reopened full-size current model and concept alongside the initial still
   * and full-cycle montage. Widened the cranium, shifted the face into three-quarter
   * perspective, recessed the eyes, separated the jaw, and replaced regular block
   * teeth with uneven pointed facets. Hanging roots retain open gaps through motion. */
  /* Mouth-attack reference: Jagex Summer Campfire 2026, GuardianBreath.webm:
   * https://cdn.runescape.com/assets/img/external/oldschool/2026/Newsposts/2026-05-29/GuardianBreath.webm
   * Inspected charge, open jaw, orange/cream descending breath, outward sweep and rest.
   * Feedback refinement: reopened the footage peak and current model after the first
   * attack montage. Widened the flared cone, softened the zigzag edges into flowing
   * tongues, added a small anchored sweep and varied the cream core's brightness. */
  scenes['archive-guardian'] = (h, c, id) => {
    const { p, l, g, ellipse, circle, a, move, turn, on } = h;
    const bark = '#626643';
    function leaf(x, y, angle, size = 1) {
      return g(
        `translate(${x} ${y}) rotate(${angle}) scale(${size})`,
        p('M0 0 L-4 -11 L0 -24 L8 -12Z', '#799a40', '#394a30', 1.1) +
          p('M0 0 L0 -24 L8 -12Z', '#a0b965', 'none') +
          l('M0 -2 L2 -19', '#d0cf8b', 0.7)
      );
    }
    function blossom(x, y, size = 1) {
      return g(
        `translate(${x} ${y}) scale(${size})`,
        p(
          'M0 -2 L-6 -13 L-1 -16 L3 -6 L9 -13 L14 -9 L7 -1 L16 2 L13 8 L4 5 L2 15 L-4 14 L-4 5 L-14 6 L-15 0 L-6 -3Z',
          '#bca8aa',
          '#605e53',
          1.2
        ) +
          p(
            'M0 -2 L-1 -16 L3 -6 L9 -13 L7 -1 L16 2 L4 5 L2 15 L-4 5 L-14 6 L-6 -3Z',
            '#d8c2bd',
            'none'
          ) +
          circle(0, 0, 3, '#bba36e', '#696747', 0.8)
      );
    }
    function root(d, facets, motion = '') {
      return `<g data-guardian-root="true">${motion}${p(d, bark, '#303b2b', 2.1)}${facets}</g>`;
    }

    // Low Archive courses and the suspended creature's shadow establish its scale.
    let scene = p('M36 466 L139 428 L236 434 L323 476 V546 H36Z', '#414c43', '#78826b', 1.7);
    scene += p('M36 466 L139 428 L169 444 L68 489Z', '#64705b', '#28372f', 1.1);
    scene += p('M169 444 L236 434 L323 476 L279 493Z', '#53624f', '#29382e', 1.1);
    scene += l(
      'M36 509 L169 455 L323 509 M36 541 L171 480 L323 541 M89 545 L172 444 L253 545 M167 545 V444',
      c[4],
      1.25,
      'opacity=".65"'
    );
    scene += p(
      'M39 451 L62 443 L62 395 L49 389 L37 398Z M38 390 L50 383 L66 390 L54 399 L38 397Z',
      '#58654f',
      '#8a9176',
      1.3
    );
    scene += p(
      'M299 450 L322 463 V414 L309 406 L297 413Z M296 405 L309 398 L325 409 L313 417 L297 413Z',
      '#58654f',
      '#8a9176',
      1.3
    );
    scene += ellipse(180, 493, 75, 15, '#28372f', 'none', 0, 'opacity=".55"');

    let guardian = '';
    // Rear roots hang independently, leaving the characteristic clear spaces.
    guardian += root(
      'M184 270 L204 276 L208 321 L200 364 L216 409 L211 456 L235 488 L257 477 L269 455 L263 486 L239 506 L217 501 L196 463 L197 412 L183 369 L190 324Z',
      p(
        'M196 279 L204 276 L208 321 L200 364 L216 409 L211 456 L235 488 L223 481 L202 455 L207 411 L191 365 L199 324Z',
        '#7e8255',
        'none'
      )
    );
    guardian += root(
      'M218 263 L237 271 L243 318 L237 347 L256 383 L249 426 L260 450 L274 452 L263 460 L247 450 L236 428 L243 385 L223 350 L229 319Z',
      p(
        'M228 272 L237 271 L243 318 L237 347 L256 383 L249 426 L260 450 L247 438 L242 426 L249 385 L229 348 L234 318Z',
        '#85895b',
        'none'
      )
    );
    guardian += root(
      'M129 265 L145 273 L148 321 L131 367 L137 405 L119 449 L121 479 L105 504 L77 516 L61 510 L47 487 L67 502 L80 504 L99 492 L108 474 L107 447 L124 404 L119 367 L135 319Z',
      p(
        'M129 265 L138 269 L141 319 L124 367 L130 406 L113 448 L114 477 L100 498 L77 509 L61 504 L47 487 L67 502 L80 504 L99 492 L108 474 L107 447 L124 404 L119 367 L135 319Z',
        '#85895e',
        'none'
      ),
      turn(
        '0 136 274;0 136 274;-1.2 136 274;0.7 136 274;0 136 274;0 136 274',
        '0;.24;.43;.64;.79;1'
      )
    );
    guardian += root(
      'M169 279 L186 282 L183 329 L166 367 L177 408 L174 451 L161 478 L166 500 L186 524 L170 520 L153 499 L150 476 L162 448 L164 410 L151 368 L169 327Z',
      p(
        'M176 281 L186 282 L183 329 L166 367 L177 408 L174 451 L161 478 L166 500 L186 524 L170 510 L156 497 L157 477 L169 450 L171 410 L158 368 L176 327Z',
        '#7d8154',
        'none'
      ),
      turn('0 177 284;0 177 284;1 177 284;-1.1 177 284;0 177 284;0 177 284', '0;.24;.45;.63;.8;1')
    );

    // Branches emerge from the crown, rather than becoming a pair of arms.
    guardian += p(
      'M227 174 L247 169 L269 148 L284 133 L295 113 L291 139 L277 158 L295 160 L312 150 L301 168 L281 173 L260 183 L244 198Z',
      bark,
      '#34402d',
      2
    );
    guardian += p('M239 182 L270 158 L278 148 L274 162 L260 180 L245 192Z', '#93966a', 'none');
    guardian += p(
      'M106 163 L91 155 L77 133 L65 120 L68 103 L77 122 L96 138 L112 139Z',
      '#696c49',
      '#34402d',
      2
    );
    guardian += p('M75 125 L91 144 L106 148 L107 158 L91 149Z', '#93956a', 'none');

    // Olive crown encircles the grey mineral skull.
    guardian += p(
      'M82 197 L78 166 L90 128 L114 103 L151 91 L194 94 L227 111 L252 144 L260 185 L252 215 L264 240 L244 264 L222 256 L211 214 L100 222Z',
      '#626947',
      '#303a2a',
      2.5
    );
    guardian += p(
      'M89 161 L101 126 L126 107 L161 99 L194 103 L220 119 L235 145 L226 155 L206 127 L181 116 L144 118 L113 134 L102 166Z',
      '#92966a',
      '#47543a',
      1.4
    );
    guardian += p(
      'M194 103 L220 119 L235 145 L252 157 L260 185 L251 216 L242 210 L243 178 L228 155 L210 130Z',
      '#4a563b',
      'none'
    );
    guardian += p(
      'M227 172 L244 178 L243 216 L254 238 L241 253 L225 243 L218 210Z',
      '#7a8158',
      '#3c4730',
      1.4
    );
    guardian += p('M244 195 L246 218 L254 238 L242 246 L237 229 L238 201Z', '#9a9a6d', 'none');

    // Broad rear cranium and projecting near cheek turn the face toward the left.
    guardian += p(
      'M79 160 L91 133 L123 111 L161 105 L200 112 L229 134 L245 162 L244 196 L235 225 L219 250 L191 266 L153 262 L121 249 L96 236 L76 213 L69 190Z',
      '#7e837a',
      '#30372f',
      2.6
    );
    guardian += p(
      'M79 160 L91 133 L123 111 L141 117 L133 142 L115 166 L91 176 L73 187Z',
      '#a9ada0',
      '#5c6558',
      1.4
    );
    guardian += p(
      'M141 117 L161 105 L200 112 L229 134 L219 154 L188 144 L163 146 L133 142Z',
      '#959b90',
      '#535e51',
      1.3
    );
    guardian += p(
      'M200 112 L229 134 L245 162 L244 196 L232 208 L223 178 L219 154 L229 138Z',
      '#626c61',
      '#3d493d',
      1.3
    );
    guardian += p(
      'M219 154 L223 178 L232 208 L219 224 L195 219 L191 200 L202 184Z',
      '#4e5b50',
      '#37443a',
      1.3
    );
    guardian += p(
      'M73 187 L91 176 L111 169 L125 181 L119 199 L99 214 L78 211 L69 198Z',
      '#767f72',
      '#3f4c3f',
      1.4
    );
    guardian += p(
      'M112 169 L128 158 L145 161 L155 153 L188 157 L202 184 L191 200 L171 210 L143 205 L128 214 L119 199 L125 181Z',
      '#989f91',
      '#4a5548',
      1.4
    );
    // A wide near-side hexagon, a foreshortened far socket, and deep stepped rims.
    guardian += p(
      'M83 180 L94 167 L109 169 L122 183 L114 202 L96 209 L82 198Z',
      '#303831',
      '#52604e',
      2
    );
    guardian += p(
      'M88 184 L97 175 L108 177 L116 185 L110 198 L97 203 L88 195Z',
      '#542e24',
      '#252c26',
      1.1
    );
    guardian += p('M94 186 L101 180 L110 186 L105 195 L98 198 L92 192Z', '#b84e24', '#7f3920', 1);
    guardian += p('M98 186 L104 184 L108 190 L101 194 L96 191Z', '#e2862f', 'none');
    guardian += p(
      'M140 180 L158 164 L184 169 L198 187 L186 209 L160 216 L142 202 L134 190Z',
      '#2a322d',
      '#56634f',
      2.2
    );
    guardian += p(
      'M142 187 L160 172 L181 177 L191 188 L181 203 L161 209 L146 199Z',
      '#482b25',
      '#1f2a23',
      1.2
    );
    guardian += p(
      'M149 188 L163 178 L178 183 L184 191 L176 201 L161 204 L150 197Z',
      '#943f23',
      '#713320',
      1.1
    );
    guardian += p(
      'M158 188 L166 182 L179 191 L170 199 L157 196 L153 192Z',
      '#db6c28',
      '#a14a23',
      0.8
    );
    guardian += p('M164 188 L173 191 L168 196 L160 193Z', '#ee9437', 'none');
    guardian += on(
      p(
        'M98 186 L104 184 L108 190 L101 194 L96 191Z M158 188 L166 182 L179 191 L170 199 L157 196 L153 192Z',
        '#ffbb59',
        'none'
      ),
      '0;0;.75;.25;.6;0;0',
      '0;.25;.335;.385;.5;.57;1',
      24,
      'data-guardian-eye-glow="true"'
    );
    // Projected cheekbones enclose a smaller mouth, rather than a full-width grin.
    guardian += p(
      'M78 211 L100 214 L110 209 L121 221 L113 237 L95 240 L80 229 L72 221Z',
      '#9da495',
      '#4d594c',
      1.5
    );
    guardian += p('M78 211 L100 214 L105 220 L92 228 L80 229 L72 221Z', '#bac0ae', 'none');
    guardian += p(
      'M143 212 L171 210 L191 200 L210 204 L219 224 L206 237 L177 241 L155 233 L140 232Z',
      '#8e9788',
      '#455342',
      1.5
    );
    guardian += p(
      'M171 218 L191 209 L209 213 L219 224 L206 230 L178 231 L155 225Z',
      '#b0b6a5',
      'none'
    );
    guardian += p(
      'M206 237 L219 224 L235 225 L219 250 L194 264 L178 253 L177 241Z',
      '#4f5e4f',
      '#374936',
      1.5
    );
    guardian += p(
      'M122 200 L132 218 L129 237 L119 223 L112 238 L107 229Z',
      '#302d2b',
      '#69705f',
      1.5
    );
    guardian += p('M121 211 L125 220 L123 232 L119 223 L115 231Z', '#783c31', 'none');
    guardian += p(
      'M95 244 L112 243 L131 247 L149 244 L172 235 L181 243 L180 273 L161 293 L133 295 L108 285 L96 267Z',
      '#222e25',
      '#3e4c3b',
      1.6
    );
    // Uneven teeth: tapered pentagonal points, angled with the receding jaw.
    guardian += p('M98 240 L109 242 L112 257 L104 266 L98 256Z', '#c3c7b2', '#59624f', 1.1);
    guardian += p('M112 243 L125 244 L130 260 L122 267 L113 259Z', '#cfd0ba', '#59624f', 1.1);
    guardian += p('M128 245 L143 243 L145 259 L136 269 L129 259Z', '#bcc3ab', '#59624f', 1.1);
    guardian += p('M147 242 L159 239 L163 251 L155 262 L149 254Z', '#aeb79f', '#4b5847', 1.1);
    guardian += p('M163 238 L173 234 L176 243 L171 254 L165 251Z', '#8a9981', '#41513d', 1.1);
    // The jaw hinges open while the orange fireball gathers inside the mouth.
    guardian += on(
      p(
        'M98 250 L139 252 L181 239 L195 255 L182 300 L157 319 L127 310 L101 291Z',
        '#20291f',
        'none'
      ),
      '0;0;1;1;0;0',
      '0;.28;.35;.52;.56;1',
      24
    );
    guardian += `<g data-guardian-jaw="true">${turn('0 193 248;0 193 248;-10 193 248;-10 193 248;0 193 248;0 193 248', '0;.3;.36;.5;.56;1', 24)}`;
    // The separate lower jaw catches light below a clear dark gap.
    guardian += p(
      'M95 273 L108 280 L114 269 L122 278 L129 272 L137 285 L146 273 L153 282 L163 268 L170 274 L179 258 L193 248 L190 277 L177 298 L155 310 L128 306 L104 296 L93 285Z',
      '#929b86',
      '#3e4f39',
      2.2
    );
    guardian += p('M95 273 L105 278 L104 296 L93 285Z', '#b0b6a0', '#53624c', 1.1);
    guardian += p('M109 280 L114 269 L122 278 L120 293 L108 290Z', '#c3c8af', '#53624c', 1.1);
    guardian += p('M125 284 L129 272 L137 285 L136 299 L124 296Z', '#d0d1b7', '#53624c', 1.1);
    guardian += p('M141 286 L146 273 L153 282 L152 299 L139 301Z', '#bfc7ac', '#53624c', 1.1);
    guardian += p('M157 284 L163 268 L170 274 L168 289 L156 297Z', '#9fac92', '#46583e', 1.1);
    guardian += p('M172 278 L179 258 L188 253 L185 274 L177 287Z', '#86977e', '#42553b', 1.1);
    guardian += p(
      'M104 296 L128 300 L154 303 L175 293 L190 277 L193 248 L204 238 L204 268 L189 297 L170 313 L154 319 L126 315 L103 304Z',
      '#73816b',
      '#394b34',
      1.8
    );
    guardian += p(
      'M104 296 L128 300 L154 303 L154 319 L126 315 L103 304Z',
      '#a1ad94',
      '#596a4c',
      1.1
    );
    guardian += p(
      'M154 319 L154 303 L175 293 L190 277 L193 248 L204 238 L204 268 L189 297 L170 313Z',
      '#596f54',
      '#394b34',
      1.2
    );
    guardian += '</g>';

    // Foreground crown wraps cut across the side planes, visibly rooted in the cap.
    guardian += p(
      'M221 129 L232 146 L234 182 L225 211 L228 246 L218 273 L206 280 L214 252 L211 214 L221 179Z',
      '#6e784d',
      '#35442f',
      1.8
    );
    guardian += p(
      'M225 146 L229 178 L219 213 L221 248 L214 268 L218 246 L216 212 L226 180Z',
      '#a1a174',
      'none'
    );
    guardian += p(
      'M86 166 L93 178 L91 208 L104 235 L104 260 L95 248 L83 217 L83 192Z',
      '#727e4e',
      '#3a4931',
      1.7
    );
    guardian += p('M86 192 L91 208 L104 235 L104 250 L99 235 L86 214Z', '#a1a778', 'none');
    guardian += p(
      'M111 110 L127 99 L154 92 L181 94 L172 104 L146 104 L133 117 L118 124Z',
      '#77854b',
      '#3c4c30',
      1.5
    );
    guardian += p('M142 99 L154 92 L181 94 L172 104 L151 103Z', '#a6b374', 'none');
    guardian += leaf(109, 116, -49, 0.75) + leaf(133, 103, -28, 0.8) + leaf(164, 99, 18, 0.82);
    guardian += leaf(193, 110, 55, 0.8) + leaf(219, 128, 70, 0.72) + leaf(242, 173, 80, 0.75);
    guardian += leaf(247, 210, 102, 0.68) + leaf(224, 249, 135, 0.65) + leaf(87, 174, -58, 0.65);
    guardian += leaf(187, 97, -10, 0.83) + leaf(142, 323, 160, 0.65) + leaf(197, 366, 104, 0.6);
    guardian += blossom(153, 91, 0.5) + blossom(205, 114, 0.4) + blossom(119, 112, 0.36);
    guardian += on(
      circle(132, 278, 14, '#e88826', '#9e4b21', 1.3) +
        p(
          'M122 278 L126 263 L132 270 L139 262 L142 278 L137 289 L130 285 L126 289Z',
          '#ffe1a0',
          '#eeab47',
          1
        ),
      '0;0;.35;1;.3;0;0',
      '0;.27;.31;.35;.39;.43;1',
      24,
      'data-guardian-mouth-charge="true"'
    );
    // A short descending cone keeps the face and the hanging-root silhouette readable.
    const breath =
      p(
        'M-3 -7 Q15 -3 27 17 L34 34 L43 39 L48 58 L65 69 L69 87 L86 98 L92 119 L112 135 L120 155 L142 168 L156 181 L133 185 L115 176 L102 184 L88 176 L72 181 L73 164 L57 147 L55 125 L41 108 L38 89 L25 71 L20 51 L10 35 L8 18 L-3 8Z',
        '#ce7928',
        '#9b481e',
        1.2
      ) +
      p(
        'M0 -3 Q13 5 20 22 L27 41 L43 55 L46 75 L60 91 L66 112 L84 130 L88 149 L109 169 L133 182 L111 177 L99 169 L89 175 L78 161 L70 144 L62 126 L47 110 L44 89 L30 72 L25 51 L14 35 L11 19Z',
        '#f3b54e',
        '#ce8c32',
        0.8
      ) +
      `<g>${a('opacity', '1;1;.85;1;.78;1;.9;1;1', '0;.365;.39;.415;.44;.46;.485;.51;1', 24)}` +
      p(
        'M0 0 Q10 9 15 25 L20 42 L32 56 L34 73 L49 91 L53 111 L67 128 L73 148 L91 168 L114 181 L97 176 L83 165 L74 149 L65 132 L52 117 L45 98 L33 80 L27 61 L17 47 L13 29 L6 15Z',
        '#ffe6b5',
        '#efc879',
        0.7
      ) +
      p(
        'M22 45 L35 55 L37 73 L51 85 L47 96 L34 79 L31 61Z M66 125 L82 136 L86 150 L106 166 L112 178 L93 168 L80 152 L74 139Z',
        '#ffda91',
        'none'
      ) +
      '</g>' +
      p(
        'M103 162 L126 150 L123 167 L141 162 L134 175 L155 180 L132 187 L105 177 L87 180 L88 167Z',
        '#eea13b',
        '#c67b29',
        0.9
      );
    guardian += on(
      `<g transform="translate(132 278)"><g>${turn('0;0;-4;3;0;0', '0;.34;.39;.49;.55;1', 24)}<g><animateTransform attributeName="transform" type="scale" values=".5 .6;.5 .6;.95 1;1.05 .97;.98 1;1 1;.5 .6;.5 .6" keyTimes="0;.34;.375;.42;.46;.5;.55;1" dur="24s" repeatCount="indefinite"/>${breath}</g></g></g>`,
      '0;0;1;1;.65;0;0',
      '0;.345;.37;.48;.51;.55;1',
      24,
      'data-guardian-mouth-flame="true"'
    );
    guardian += on(
      ellipse(257, 458, 34, 7, '#f2a43d', '#c97924', 1, 'opacity=".65"'),
      '0;0;.8;.5;0;0',
      '0;.375;.4;.5;.55;1',
      24,
      'data-guardian-flame-reflection="true"'
    );
    scene += `<g id="${id}-guardian" data-guardian="floating-skull">${move('0 0;0 0;0 -2;0 1;0 0;0 0', '0;.25;.35;.52;.65;1', 24)}${guardian}</g>`;
    return scene;
  };

  /* Refined pass 2: bespoke Justiciar armour, never the Theatre of Blood set.
   * Actual current model, concept and encounter footage inspected:
   * https://oldschool.runescape.wiki/w/File:Ezekiel.png
   * https://oldschool.runescape.wiki/w/File:Ezekiel_concept_art.png
   * https://oldschool.runescape.wiki/w/Ezekiel#Enrage_Phase
   * Reopened the model and concept after inspecting the initial full-size and
   * complete-cycle review images. Broadened/faceted the fur, turned the helmet,
   * staggered the rear leg, restored the long cape and sharpened the forked blade.
   * The held hilt and both hands remain one fixed assembly through the loop.
   * Spinning-sword feedback: inspected the separate Animated Sword model and
   * both actual charge/launch clips, not Ezekiel's held curved greatsword:
   * https://oldschool.runescape.wiki/w/File:Animated_Sword.png
   * https://oldschool.runescape.wiki/w/Animated_Sword
   * https://oldschool.runescape.wiki/images/Ezekiel_-_animated_swords_1.mp4
   * https://oldschool.runescape.wiki/images/Ezekiel_-_animated_swords_2.mp4
   * This sword has silver fittings and a GREEN grip, rather than gold fittings.
   * Feedback refinement: compared the first new still/action/cycle renders with
   * that model again. Restored brighter green wraps and blade facets, stopped
   * the spin before the straight launch, and shortened the flight to keep its
   * whole silhouette clear of the arch. Fade-out conceals the return/reset.
   * Identity colours stay fixed through the glass editions. */
  scenes.ezekiel = (h, _c, id) => {
    const { p, l, g, ellipse, a, move, turn, on } = h;
    const ink = '#2c2936';
    const silver = '#b7b4bd';
    const shadow = '#747482';
    const gold = '#b59b53';
    const gilt = '#d7c17a';
    const purple = '#5e527f';
    let scene = `<defs><linearGradient id="${id}-floor" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#606664"/><stop offset="1" stop-color="#383b43"/></linearGradient></defs>`;

    // Grey arena paving and receding ranks of swords, as in the enrage footage.
    scene += p('M35 399 L145 354 L244 359 L325 411 V535 H35Z', `url(#${id}-floor)`, '#737777', 1.6);
    scene += p('M145 354 L244 359 L325 411 L245 399 L122 393 L35 418 V399Z', '#7c8279', 'none');
    scene += l(
      'M35 436 L127 407 L247 410 L325 438 M35 469 L125 443 L250 447 L325 475 M35 510 L126 487 L255 493 L325 518 M97 535 L156 356 M181 535 L193 357 M273 535 L226 359',
      '#b0b2a3',
      1.4,
      'opacity=".6"'
    );
    scene += l(
      'M53 430 L60 463 M92 417 L96 452 M147 408 L146 445 M203 409 L207 447 M267 416 L279 456 M59 480 L64 504 M98 453 L101 495 M162 446 L162 491 M223 448 L232 494 M288 464 L306 513',
      '#343b3e',
      1.3
    );
    scene += p(
      'M38 365 L57 354 L85 355 L87 374 L37 383Z M277 355 L305 356 L324 368 V384 L277 375Z',
      '#73716b',
      '#3e4346',
      1.4
    );
    scene += l('M43 370 L75 365 M285 364 L318 373', '#9b9a88', 1.1);

    function plantedSword(x, y, scale, lean = 0, charged = false) {
      let b = ellipse(0, 77, 11, 3, '#292f35', 'none');
      b += p('M-3 -25 L0 -35 L4 -25 L3 53 L0 75 L-3 53Z', '#9ea4ac', ink, 1.3);
      b += p('M0 -35 L4 -25 L3 53 L0 75Z', '#d1d3cf', 'none');
      b += p('M-14 49 L-14 44 L-3 47 L3 47 L15 42 L15 49 L4 52 L-3 52Z', '#a99761', ink, 1.3);
      b += p('M-3 31 L3 31 L3 46 L-3 46Z', '#5b4a48', ink, 1.1);
      b += p('M-4 28 L0 24 L5 28 L3 33 L-3 33Z', '#c3b68b', ink, 1.1);
      if (charged) {
        const flash =
          p('M0 -43 L-8 -24 L5 -17 L-7 2 L6 12 L-3 27', 'none', '#bce9dc', 2.4) +
          p('M-3 -26 L-15 -19 L-11 -7 M6 10 L17 13 L12 26', 'none', '#66cacd', 1.7) +
          ellipse(0, 75, 16, 4, '#71d9cb', 'none', 0, 'opacity=".6"');
        b += on(flash, '0;0;.9;.25;.85;0;0', '0;.47;.49;.51;.535;.56;1', 24);
      }
      return g(`translate(${x} ${y}) rotate(${lean}) scale(${scale})`, b);
    }
    scene += plantedSword(70, 286, 0.9, -5, true);
    scene += plantedSword(96, 332, 0.62, 8);
    scene += plantedSword(270, 343, 0.62, -8);
    scene += plantedSword(58, 407, 0.77, -4);
    scene += plantedSword(305, 423, 0.74, 5);

    // The actual summoned sword: narrow straight silver blade, swept silver
    // quillons, green wrapped grip, diamond pommel and pale spinning ribbons.
    // It rises at the room edge, spins while charging, then flies in a straight
    // line and resets while hidden. The held greatsword below never rotates.
    let flyingBlade = p('M0 -55 L5 -43 L4 16 L0 23 L-4 16 L-4 -43Z', '#b4b0b9', ink, 1.4);
    flyingBlade += p('M0 -55 L0 23 L-4 16 L-4 -43Z', '#e1d9d6', 'none');
    flyingBlade += p('M0 -55 L5 -43 L4 16 L0 23 L1 -18Z', '#96929e', 'none');
    flyingBlade += p('M-4 -2 L0 -13 L4 -9 L0 3Z M0 3 L4 -9 L4 16 L0 23Z', '#aaa5ae', 'none');
    flyingBlade += p(
      'M-18 16 L-13 18 L-5 18 L0 20 L5 18 L13 18 L18 15 L19 21 L14 25 L5 25 L0 23 L-5 25 L-15 24 L-19 20Z',
      '#939096',
      ink,
      1.4
    );
    flyingBlade += p(
      'M-18 16 L-13 18 L-5 18 L0 20 L5 18 L13 18 L18 15 L17 20 L11 22 L4 21 L0 23 L-5 21 L-14 21Z',
      '#c8c2bf',
      'none'
    );
    flyingBlade += p('M-4 25 L4 25 L3 45 L-3 45Z', '#166e35', ink, 1.1);
    flyingBlade += p('M-4 25 L0 24 L0 45 L-3 45Z', '#28954d', 'none');
    flyingBlade += p('M-4 28 L4 30 V34 L-4 32Z M-4 37 L3 39 V42 L-3 41Z', '#0b7c31', 'none');
    flyingBlade += p('M-3 45 L3 45 L7 49 L0 53 L-6 49Z', '#b3aaa9', ink, 1.2);
    flyingBlade += p('M-3 45 L3 45 L0 49 L-6 49Z', '#d6cbc6', 'none');
    flyingBlade += l('M-2 -40 L-2 10 M-1 28 L-1 41', '#e9ded0', 0.7);
    const spinRibbons =
      p(
        'M-38 -34 Q-21 -49 8 -40 Q31 -33 39 -13 Q26 -30 5 -31 Q-20 -39 -38 -34Z',
        '#e1dfd4',
        'none'
      ) +
      p(
        'M-40 -20 Q-22 -33 0 -27 Q21 -23 31 -10 Q14 -19 -2 -20 Q-25 -24 -40 -20Z',
        '#d7ded7',
        'none'
      ) +
      p('M-34 12 Q-16 30 8 24 Q29 21 40 7 Q32 28 8 32 Q-18 39 -34 12Z', '#dce2d8', 'none') +
      p('M-26 26 Q-5 41 19 31 Q31 27 38 17 Q32 35 13 40 Q-10 46 -26 26Z', '#ece6d7', 'none');
    const charge =
      p(
        'M-16 -45 L-20 -31 L-13 -26 M14 -20 L21 -12 L15 -3 M-17 15 L-23 25 L-15 30',
        'none',
        '#91d9cf',
        1.5
      ) +
      l(
        'M-29 -20 Q-38 2 -21 22 M20 -32 Q40 -13 34 10 M-12 31 Q8 42 29 25',
        '#abdcd2',
        1.1,
        'opacity=".6"'
      );
    const spinningAssembly =
      `<g data-ezekiel-effect="sword-spin">${turn('0;0;0;360;765;765;765;765;0;0', '0;.25;.34;.425;.51;.55;.61;.66;.69;1', 24)}` +
      `<g opacity="0">${a('opacity', '0;0;.7;.8;0;0', '0;.31;.36;.5;.57;1', 24)}${spinRibbons}</g>${flyingBlade}</g>`;
    scene += ellipse(277, 380, 17, 4, '#252d34', 'none', 0, 'opacity=".5"');
    scene += g(
      'translate(277 304)',
      `<g data-ezekiel-effect="flying-sword">${move('0 0;0 0;-8 -37;-8 -47;-8 -47;10 -80;10 -80;0 0;0 0', '0;.25;.34;.4;.51;.61;.66;.69;1', 24)}` +
        `<g opacity="1">${a('opacity', '1;1;1;0;0;1;1', '0;.51;.57;.615;.69;.76;1', 24)}` +
        g(
          'scale(.8) rotate(-18)',
          spinningAssembly +
            `<g opacity="0">${a('opacity', '0;0;.8;.2;0;0', '0;.32;.43;.53;.59;1', 24)}${charge}</g>`
        ) +
        '</g></g>'
    );
    // Cyan spell light occupies one short interval, with the knight otherwise still.
    scene += on(
      p('M83 119 L70 155 L80 170 L66 196 L78 210 L69 242 L75 259', 'none', '#8bdedb', 2.6) +
        p('M83 119 L80 150 L90 164 L79 186', 'none', '#c1efe2', 1.1),
      '0;0;.8;0;.5;0;0',
      '0;.46;.48;.505;.525;.55;1',
      24
    );

    // White cape, brown fur collar and red geometric marks are crucial identifiers.
    let cape = p(
      'M156 212 L219 204 L233 254 L247 310 L278 363 L262 352 L268 374 L243 362 L226 389 L217 434 L214 472 L203 493 L157 496 L143 480 L151 432 L151 368 L146 308Z',
      '#bfc1b7',
      ink,
      2.2
    );
    cape += p(
      'M204 211 L219 213 L230 258 L236 299 L260 342 L248 337 L240 353 L222 335 L210 313 L200 263Z',
      '#e2e0d2',
      '#9a9e9b',
      1.3
    );
    cape += p(
      'M175 224 L188 219 L195 268 L190 321 L201 370 L191 422 L198 487 L176 490 L163 473 L171 427 L171 366 L161 310Z',
      '#929a99',
      'none'
    );
    cape += p(
      'M153 364 L170 368 L170 428 L161 472 L174 489 L157 492 L147 479 L155 429Z',
      '#d8d8c9',
      'none'
    );
    cape += p(
      'M234 312 L243 325 L246 341 L237 333Z M252 346 L268 359 L262 352 L278 363 L266 345 L257 339Z M224 344 L231 354 L228 369 L216 351Z M235 285 L244 304 L238 302 L231 292Z M159 479 L166 488 L175 476 L184 491 L193 480 L203 493 L157 496 L148 481Z M207 454 L211 466 L207 477 L203 467Z',
      '#b26665',
      '#8e5759',
      1
    );
    cape += l(
      'M216 228 L222 274 L234 319 M197 239 L194 292 M245 345 L257 354 M181 376 L180 425 L185 467',
      '#e8e4d4',
      1.3
    );
    scene += `<g data-ezekiel-effect="cape">${move('0 0;0 0;1.7 -1;-.7 .5;0 0;0 0', '0;.3;.42;.57;.7;1', 24)}${cape}</g>`;

    // Rear leg, slate-purple cloth and faceted gold kneecap.
    scene += p(
      'M178 333 L207 327 L218 363 L218 392 L232 421 L218 438 L199 429 L192 404 L180 381 L167 355Z',
      purple,
      ink,
      2.2
    );
    scene += p(
      'M195 344 L207 345 L211 377 L205 392 L216 416 L207 424 L197 402 L187 376Z',
      '#7c6b9a',
      'none'
    );
    scene += p('M207 387 L224 394 L235 416 L222 433 L201 426 L195 407Z', silver, ink, 2);
    scene += p('M208 391 L221 396 L227 411 L217 420 L205 413 L201 403Z', gold, '#80734f', 1.2);
    scene += p('M208 391 L217 399 L217 420 L205 413 L201 403Z', gilt, 'none');
    scene += p(
      'M199 426 L222 427 L234 454 L232 477 L241 488 L232 498 L215 493 L210 475 L201 454 L190 444Z',
      shadow,
      ink,
      2.1
    );
    scene += p(
      'M204 432 L218 433 L229 455 L226 474 L233 485 L219 484 L216 471 L211 451Z',
      '#bbb8c0',
      '#928a88',
      1.1
    );
    scene += p(
      'M211 434 L218 433 L229 455 L226 474 L233 485 L226 488 L222 473 L224 457Z',
      gold,
      'none'
    );
    scene += p(
      'M218 482 L235 484 L252 496 L256 504 L231 505 L213 496 L211 489Z',
      '#aaa8b3',
      ink,
      1.8
    );
    scene += p('M220 485 L233 488 L247 497 L232 499 L216 493Z', '#c9c5ca', 'none');
    scene += l('M231 499 L250 501 M216 493 L231 499 L231 504', '#6a6b7d', 1.1);

    // Forward leg bends outwards into the characteristic broad stance.
    scene += p(
      'M147 329 L176 340 L166 367 L149 397 L134 418 L113 410 L116 387 L126 363Z',
      '#554b75',
      ink,
      2.2
    );
    scene += p('M150 342 L166 345 L155 372 L138 396 L127 398 L133 378Z', '#78658f', 'none');
    scene += p('M114 395 L132 393 L149 407 L141 427 L119 432 L105 414Z', '#a9a6b0', ink, 2);
    scene += p('M117 398 L130 397 L139 407 L130 421 L117 417 L110 409Z', gold, '#80734f', 1.3);
    scene += p('M117 398 L124 405 L130 421 L117 417 L110 409Z', '#d1b566', 'none');
    scene += p('M113 428 L139 425 L133 455 L126 488 L109 499 L98 487 L101 456Z', shadow, ink, 2.3);
    scene += p('M113 433 L127 432 L122 461 L116 487 L108 487 L107 458Z', '#c4c0c3', '#8c858b', 1.2);
    scene += p('M112 435 L117 434 L112 462 L108 487 L103 485 L106 458Z', gold, 'none');
    scene += p('M109 486 L125 488 L125 503 L114 511 L77 521 L72 513 L89 499Z', '#a5a4b0', ink, 2);
    scene += p('M109 490 L117 493 L111 505 L81 514 L89 504Z', '#ccc7c9', 'none');
    scene += l('M81 514 L109 508 L115 512 M112 496 L105 507', '#737384', 1.2);

    // Torso: silver breastplate over violet, gold edging, layered hip armour.
    scene += p(
      'M143 222 L170 211 L196 220 L210 246 L200 285 L201 327 L182 345 L147 337 L133 316 L139 276 L132 249Z',
      '#5d5279',
      ink,
      2.4
    );
    scene += p(
      'M141 229 L165 223 L193 229 L199 252 L185 284 L166 306 L142 282 L135 252Z',
      silver,
      ink,
      2.1
    );
    scene += p('M142 232 L165 226 L165 299 L146 280 L138 253Z', '#d2cdcd', 'none');
    scene += p('M168 227 L193 232 L197 250 L183 281 L166 301 L172 269Z', '#9293a1', 'none');
    scene += p(
      'M138 250 L158 258 L166 275 L143 270Z M172 234 L190 236 L184 249Z',
      '#e2dbd3',
      'none'
    );
    scene += l('M138 253 L158 261 L165 283 M174 278 L188 261 M166 293 L166 303', '#8b8794', 0.85);
    scene += p('M141 236 L146 230 L169 223 L194 230 L199 236 L171 229Z', gold, '#86764e', 1);
    scene += p('M145 281 L166 295 L187 283 L185 291 L166 304 L143 288Z', gold, '#86764e', 1.1);
    scene += p(
      'M166 247 L172 257 L184 263 L172 269 L165 282 L160 268 L148 262 L160 257Z',
      gold,
      '#927c45',
      1.25
    );
    scene += p(
      'M166 247 L166 263 L148 262 L160 257Z M166 263 L172 269 L165 282Z',
      '#e1c76d',
      'none'
    );
    scene += l('M166 247 L165 281 M149 262 L182 263', '#f0dc9b', 0.8);
    scene += p(
      'M142 290 L165 304 L187 292 L196 309 L179 325 L147 316 L135 305Z',
      '#66543f',
      ink,
      1.7
    );
    scene += p('M142 296 L164 310 L184 300 L187 308 L166 318 L140 304Z', gold, '#8c7449', 1.2);
    scene += p(
      'M145 308 L160 318 L152 336 L133 334 L131 322Z M180 315 L194 307 L206 326 L202 340 L181 344 L171 332Z',
      silver,
      ink,
      1.8
    );
    scene += p(
      'M135 326 L153 329 L151 335 L134 334Z M181 334 L203 327 L202 334 L182 342Z',
      gold,
      '#8f7a51',
      1.1
    );
    scene += l('M137 317 L154 321 M183 325 L198 319', '#e4d9b5', 1);

    // The wide brown fur mantle is angular rather than a smooth golden pauldron.
    let fur = p(
      'M151 182 L138 180 L133 189 L118 187 L119 199 L105 201 L113 210 L101 218 L116 223 L108 238 L126 234 L129 248 L139 239 L150 245 L156 230 L167 235 L177 222 L190 230 L201 225 L213 238 L218 228 L234 229 L227 217 L239 211 L225 202 L228 190 L213 193 L202 181 L188 187 L170 179Z',
      '#88683f',
      ink,
      2.35
    );
    fur += p(
      'M139 186 L124 194 L119 206 L109 204 L120 215 L114 231 L128 227 L132 240 L141 228 L151 236 L154 215 L167 202Z',
      '#ac8653',
      '#715535',
      1
    );
    fur += p(
      'M178 186 L191 189 L202 185 L209 198 L220 197 L218 209 L232 212 L219 219 L226 226 L213 222 L209 230 L199 218 L189 224 L181 209 L169 201Z',
      '#9b7546',
      '#715535',
      1
    );
    fur += p(
      'M139 186 L145 201 L130 196Z M145 201 L154 215 L132 212Z M130 196 L119 206 L132 212Z M132 212 L128 227 L141 228Z M154 215 L141 228 L151 236Z M191 189 L190 206 L178 199Z M202 185 L209 198 L190 206Z M190 206 L199 218 L181 209Z M209 198 L218 209 L199 218Z M218 209 L232 212 L219 219Z',
      '#c0a070',
      'none'
    );
    fur += p(
      'M109 217 L120 215 L116 223Z M128 227 L129 242 L138 233Z M154 215 L167 202 L164 221 L157 230Z M190 206 L181 209 L188 220Z M199 218 L213 222 L209 230Z',
      '#6c5035',
      'none'
    );
    fur += l(
      'M124 194 L132 212 L141 228 M145 201 L132 212 L120 215 M178 199 L190 206 L199 218 M209 198 L190 206 M199 218 L218 209 M219 219 L213 222',
      '#80603c',
      0.85
    );
    fur += l(
      'M116 207 L122 210 M135 192 L140 195 M148 224 L151 227 M204 199 L208 201 M222 214 L226 214',
      '#d0b384',
      0.85
    );
    scene += fur;

    // Closed helm with cyan slit and the distinctive perforated lower face.
    scene += p(
      'M147 151 L158 138 L177 139 L190 151 L194 169 L187 191 L168 206 L150 196 L141 176Z',
      '#a4a1ad',
      ink,
      2.3
    );
    scene += p('M147 151 L158 140 L175 141 L184 149 L169 154 L147 165Z', '#d3cfcd', '#96919c', 1.1);
    scene += p('M158 140 L165 145 L183 149 L175 141Z', '#e0d9d4', 'none');
    scene += p('M184 149 L190 151 L194 169 L187 191 L168 206 L166 177Z', '#777783', 'none');
    scene += p('M149 156 L163 153 L175 149 L183 151 L171 158 L148 168Z', gold, '#8d7a52', 0.8);
    scene += p(
      'M143 171 L158 166 L169 167 L181 162 L185 167 L171 176 L156 174 L146 178Z',
      '#45424e',
      ink,
      1.1
    );
    scene += p(
      'M149 171 L158 169 L165 170 L159 174Z M171 170 L179 166 L177 171 L171 173Z',
      '#64d3da',
      '#385c67',
      0.7
    );
    scene += p(
      'M143 179 L156 178 L167 180 L181 172 L180 191 L166 204 L152 195Z',
      '#c6c2c3',
      '#777181',
      1.4
    );
    scene += p('M167 180 L181 172 L180 191 L166 204Z', '#a09aa9', 'none');
    scene += p(
      'M182 177 L190 172 L188 179 L181 184Z M178 188 L185 184 L183 190 L176 195Z',
      '#a99761',
      '#786a4f',
      0.7
    );
    scene += p(
      'M148 183 L153 184 L154 189 L150 187Z M157 184 L161 186 L160 191 L156 190Z M153 191 L157 193 L156 197 L153 195Z M171 183 L175 181 L177 184 L173 188Z M171 192 L175 189 L176 193 L172 196Z',
      '#4e4750',
      'none'
    );
    scene += l(
      'M157 145 L166 147 M148 155 L153 151 M167 181 L166 202 M184 154 L188 162 L187 169',
      '#e1d9cd',
      0.9
    );

    // Arms cross at the grip: no shield, no duplicated weapon or floating hands.
    scene += p(
      'M125 232 L140 237 L141 256 L154 269 L167 281 L154 296 L139 284 L126 274 L117 251Z',
      purple,
      ink,
      2.1
    );
    scene += p('M120 232 L135 235 L137 251 L126 265 L115 252 L113 240Z', silver, ink, 1.9);
    scene += p('M118 237 L126 234 L132 240 L131 253 L125 259 L119 250Z', '#d1caca', 'none');
    scene += p('M127 267 L139 256 L157 269 L172 286 L161 298 L144 288Z', gold, '#84734b', 1.4);
    scene += p('M134 267 L140 262 L155 274 L167 286 L160 292 L145 280Z', '#c9c1c2', '#8b858e', 1);
    scene += p('M134 267 L140 262 L155 274 L153 281 L145 280Z', '#e1d8cb', 'none');
    scene += l('M142 267 L153 277 L160 287', '#9992a0', 1);
    scene += p('M203 231 L215 238 L211 263 L195 289 L180 280 L191 256Z', '#55486e', ink, 2.1);
    scene += p('M202 231 L213 236 L216 248 L207 262 L195 253 L194 242Z', silver, ink, 1.8);
    scene += p('M200 234 L208 237 L211 246 L204 253 L198 248Z', '#d4ccca', 'none');
    scene += p('M202 260 L210 265 L197 287 L184 292 L177 278 L187 269Z', '#afadb7', ink, 1.9);
    scene += p('M200 260 L204 265 L191 282 L181 285 L178 280 L188 272Z', '#d8c582', '#8e7f51', 1.1);

    // His long curved silver blade sweeps to the lower right, tipped with a notch.
    scene += p('M170 294 L182 300 L176 313 L164 306Z', '#554333', ink, 1.5);
    scene += p('M160 286 L167 283 L185 296 L192 310 L183 315 L177 306 L159 294Z', gold, ink, 1.8);
    scene += p('M164 287 L169 287 L183 298 L187 307 L183 308 L178 300Z', '#e0c77a', 'none');
    scene += p(
      'M181 308 L220 342 L253 375 L279 403 L298 421 L317 420 L309 435 L323 441 L307 449 L293 448 L279 439 L259 419 L235 392 L207 359 L175 317Z',
      silver,
      ink,
      2.4
    );
    scene += p(
      'M181 308 L220 342 L253 375 L279 403 L298 421 L317 420 L309 435 L300 432 L283 418 L263 398 L241 373 L215 347 L178 315Z',
      '#d4cfd0',
      'none'
    );
    scene += p(
      'M179 315 L212 352 L238 385 L264 413 L285 433 L300 441 L323 441 L307 449 L293 448 L279 439 L259 419 L235 392 L207 359 L175 317Z',
      '#8b8b9b',
      'none'
    );
    scene += p('M298 421 L317 420 L309 435 L300 432Z', '#b5b0bb', '#8f8999', 0.8);
    scene += l('M184 318 L217 353 L244 387 L271 415 L294 435 L303 439', '#e6ddd6', 1.15);
    scene += l('M226 368 L242 383 M262 406 L274 418', '#a5a0ad', 0.8);

    // Brown gauntlets visibly close around the hilt over the blade's upper layers.
    scene += p(
      'M149 278 L160 274 L169 281 L174 292 L169 302 L159 300 L151 291Z',
      '#71513e',
      ink,
      1.8
    );
    scene += p('M153 279 L160 278 L167 284 L169 291 L164 295 L158 290Z', '#947056', 'none');
    scene += p(
      'M178 279 L185 281 L183 293 L176 303 L168 304 L163 296 L168 286Z',
      '#6c4b3c',
      ink,
      1.8
    );
    scene += p('M177 282 L181 283 L178 292 L174 298 L169 297 L171 288Z', '#947056', 'none');
    scene += l(
      'M156 284 L163 288 M156 289 L163 293 M171 287 L177 289 M168 292 L175 294',
      '#b08a66',
      1.1
    );

    // A few small foreground fragments ground the pose, without hiding his boots.
    scene += p(
      'M49 523 L63 514 L72 517 L69 528 L54 530Z M269 519 L281 514 L290 522 L286 529 L273 530Z',
      '#747478',
      '#3e4048',
      1.3
    );
    scene += p(
      'M50 522 L63 516 L67 521 L57 524Z M271 520 L281 516 L285 521 L277 524Z',
      '#a3a196',
      'none'
    );
    return scene;
  };

  /* Original stained glass, checked against current OSRS models and combat footage.
   * https://oldschool.runescape.wiki/w/File:Ocellus.png
   * https://oldschool.runescape.wiki/w/File:Ocellus_(phase_2).png
   * https://oldschool.runescape.wiki/w/File:Ocellus_(phase_3).png
   * https://oldschool.runescape.wiki/w/File:The_Blade.png
   * https://oldschool.runescape.wiki/w/File:Ocellus_-_phase_3_melee_sweep_and_triple_charged_blade.mp4
   * https://oldschool.runescape.wiki/w/File:Ocellus_-_phase_3_untether.mp4
   * Final-phase Ocellus: pale reaver head, crimson facial tendrils, gold gorget,
   * plum robe and an enormous branching arm holding the fractured void Blade.
   * Pass 2: reopened the phase-3 model beside the initial full-size render and
   * full-cycle samples. Rebuilt the forward-sloping head and layered ivory fan,
   * moved irregular tendrils over the gorget, deepened knotted bark planes, and
   * separated the Blade's black void from its faceted suspended fragments.
   * Feedback pass: rechecked Untether footage at 19–21 seconds: a black starfield
   * replaces the arena around the violet-edged safe square before stone returns.
   * Both arm chains now have visible joints and a complete hand-to-weapon grip.
   * Feedback refinement: compared the new full-cycle sheet with the 20s slam
   * frame, deepened the void facets, strengthened its white stars and violet
   * safe-square rim, and clarified the fingers crossing the weapon shaft.
   * Blade passes: the current The_Blade.png object render replaces the compressed
   * flame-bowl interpretation. Pass 2 rechecked its crossguard, long steel-to-void
   * proportions and suspended shards; sharpened metal/void facets and shortened
   * only the extreme point to retain floor clearance in every window outline. */
  scenes.ocellus = (h, c, id) => {
    const { p, l, g, ellipse, move, turn, on } = h;
    const dark = '#28232e';
    const bark = '#3d3437';
    const barkMid = '#514346';
    const barkLight = '#675353';
    const ivory = '#c6c6a6';
    const ivoryLight = '#e0ddbd';
    const ivoryShade = '#969b7c';
    const plum = '#554058';
    const plumLight = '#70516b';
    const plumShade = '#382e44';
    const red = '#942f34';
    const redLight = '#bb5150';
    const gold = '#b59a35';
    const goldLight = '#dac45e';
    const cycle = 24;
    const awake = '0;0;1;1;0;0';
    const keys = '0;.26;.375;.5;.65;1';

    // The encounter's pale stone arena first reads as tall, irregular glass slabs.
    // A second layer replaces those slabs with the actual starry Untether void.
    const field = 'M20 550 V220 Q20 92 180 18 Q340 92 340 220 V550Z';
    let setting = p(field, '#566254', '#323e39', 1.5);
    const slabs = [
      ['M180 18 L214 98 L182 169 L115 154 L81 108Z', '#7a826c'],
      ['M81 108 L115 154 L95 240 L29 266 L20 220 Q26 154 81 108Z', '#677562'],
      ['M214 98 L279 107 L327 178 L305 255 L246 225 L182 169Z', '#697963'],
      ['M115 154 L182 169 L246 225 L222 310 L137 316 L95 240Z', '#596b58'],
      ['M29 266 L95 240 L137 316 L98 393 L20 413 V319Z', '#74816a'],
      ['M246 225 L305 255 L340 291 V393 L279 414 L222 310Z', '#4c6051'],
      ['M20 413 L98 393 L146 457 L118 550 H20Z', '#536750'],
      ['M98 393 L137 316 L222 310 L279 414 L236 467 L146 457Z', '#68765f'],
      ['M279 414 L340 393 V550 H236 V467Z', '#66755d'],
    ];
    for (const [shape, fill] of slabs) setting += p(shape, fill, '#3c4c3f', 1.3);
    setting += l(
      'M45 215 L85 196 L111 207 M230 124 L258 141 L270 171 M41 351 L71 340 L90 353 M282 321 L315 333 M58 457 L89 445',
      '#a1aa89',
      1.3,
      'opacity=".65"'
    );
    let cosmos = p(field, '#11121e', '#4e3268', 1.6);
    const cosmicColors = [
      '#16172b',
      '#1e192e',
      '#142135',
      '#251c36',
      '#201d34',
      '#14192c',
      '#1d192e',
      '#182538',
      '#251d32',
    ];
    for (let i = 0; i < slabs.length; i++)
      cosmos += p(slabs[i][0], cosmicColors[i], '#302a43', 1.1);
    cosmos += p(
      'M35 436 L90 356 L132 344 L180 256 L230 222 L285 133 L325 145 L281 243 L230 278 L174 369 L122 384 L75 472Z',
      '#4a365d',
      'none',
      0,
      'opacity=".38"'
    );
    cosmos += p(
      'M20 359 L78 315 L110 315 L154 248 L194 232 L260 123 L284 104 L239 222 L200 259 L161 330 L103 352 L49 411 L20 421Z',
      '#56607b',
      'none',
      0,
      'opacity=".18"'
    );
    for (let i = 0; i < 124; i++) {
      const x = 33 + ((i * 73) % 293);
      const y = 72 + ((i * 97) % 460);
      const r = i % 9 === 0 ? 1.15 : 0.75;
      cosmos += ellipse(
        x,
        y,
        r,
        r * 0.82,
        i % 4 === 0 ? '#bfb9d7' : '#e9e7dc',
        'none',
        0,
        `opacity="${i % 3 === 0 ? '.95' : '.8'}"`
      );
      if (i % 14 === 0)
        cosmos += l(`M${x - 2} ${y} H${x + 2} M${x} ${y - 2} V${y + 2}`, '#ddd7d6', 0.7);
    }
    let sweep = l(
      'M22 461 L68 430 L95 435 L123 398 L166 390 L195 343 L237 329 L267 284 L302 273 L336 228',
      '#b39ac8',
      1.8
    );
    sweep += l(
      'M24 469 L71 441 L98 445 L126 409 L170 400 L200 354 L240 339 L274 294 L307 284 L339 242',
      '#74658f',
      3.2,
      'opacity=".55"'
    );
    cosmos += on(
      g('', `${move('0 28;0 28;0 -28;0 -28', '0;.29;.48;1', cycle)}${sweep}`),
      '0;0;.9;.2;0;0',
      '0;.29;.38;.48;.6;1',
      cycle
    );
    setting += on(cosmos, awake, keys, cycle, 'data-art-effect="ocellus-galaxy-arena"');

    // The last arena quadrant, split by void. Its stone stays lower than the robe.
    let art =
      setting + p('M35 476 L110 448 L252 450 L326 487 L294 536 H64Z', '#5c6a5b', '#303c37', 2.2);
    art += p('M35 476 L110 448 L167 467 L133 493 L64 536Z', '#76816a', '#3c483d', 1.5);
    art += p('M167 467 L252 450 L326 487 L247 502 L207 532 L133 493Z', '#4d5f51', '#34433b', 1.6);
    art += p('M64 536 L133 493 L164 512 L153 540 H60Z', '#3d4f45', '#303d37', 1.4);
    art += p('M247 502 L326 487 L294 536 L207 532Z', '#65735e', '#344339', 1.5);
    art += l(
      'M51 488 L90 474 L114 478 M80 526 L123 503 M271 467 L265 487 L289 496 M250 522 L279 526',
      '#a1a58a',
      1.4
    );
    const fissure =
      'M38 505 L89 493 L113 502 L153 486 L194 499 L226 487 L265 501 L310 485 L300 494 L264 509 L226 495 L195 508 L153 495 L115 511 L88 502 L43 514Z';
    art += p(fissure, '#281d39', '#79528c', 1.6);
    art += on(
      p(fissure, '#714690', '#b88cd0', 1.1),
      '0;0;.8;.65;0;0',
      '0;.29;.375;.5;.65;1',
      cycle,
      'data-art-effect="ocellus-void-fissure"'
    );
    art += ellipse(147, 512, 55, 8, '#22262d', 'none', 0, 'opacity=".5"');
    art += ellipse(288, 484, 11, 4, '#211729', '#77508e', 1.1);
    art += ellipse(71, 479, 8, 3, '#211729', '#77508e', 1);
    // The safe square beneath Ocellus remains stone when the surrounding floor vanishes.
    let voidFloor = p(
      'M35 476 L110 448 L252 450 L326 487 L294 536 H64Z',
      '#171725',
      '#80609b',
      1.8
    );
    voidFloor += p(
      'M93 473 L219 465 L270 495 L219 524 L103 512 L72 491Z',
      '#5e5c67',
      '#ae64c9',
      2.2
    );
    voidFloor += p(
      'M103 479 L216 474 L253 495 L217 515 L110 504 L84 491Z',
      '#6b6b70',
      '#7f508d',
      1.1
    );
    voidFloor += l('M75 492 L102 515 L220 527 L273 497 M93 472 L219 463 L272 494', '#df9ce5', 1.5);
    for (let i = 0; i < 24; i++) {
      const x = 46 + ((i * 71) % 265),
        y = 468 + ((i * 29) % 66);
      voidFloor += ellipse(x, y, 0.6, 0.5, '#d9d6df', 'none', 0);
    }
    art += on(voidFloor, awake, keys, cycle, 'data-art-effect="ocellus-void-floor-safe-square"');

    // A glimpse of the small red feet under a heavy, asymmetrical skirt.
    art += p('M102 492 L91 510 L78 519 L91 517 L96 521 L108 512 L115 500Z', '#873c39', dark, 1.5);
    art += p('M209 501 L216 515 L231 517 L225 509 L229 505 L215 495Z', '#713331', dark, 1.5);
    art += p(
      'M109 280 L142 260 L192 261 L218 291 L227 347 L250 488 L230 511 L189 520 L119 517 L77 496 L88 423 L103 351Z',
      plum,
      dark,
      2.6
    );
    art += p(
      'M109 280 L142 260 L159 318 L139 362 L108 493 L77 496 L88 423 L103 351Z',
      plumLight,
      '#403448',
      1.3
    );
    art += p(
      'M159 318 L175 290 L192 261 L218 291 L215 365 L230 511 L189 520 L174 427 L158 379Z',
      plumShade,
      '#302b3b',
      1.4
    );
    art += p('M139 362 L158 379 L174 427 L189 520 L119 517 L108 493Z', '#62475f', '#45354a', 1.3);
    art += p('M215 365 L227 347 L250 488 L230 511Z', '#4a384e', '#302936', 1.3);
    art += p(
      'M77 479 L111 496 L156 505 L191 506 L234 492 L250 488 L230 511 L189 520 L119 517 L77 496Z',
      '#5f373b',
      dark,
      1.8
    );
    art += p('M111 496 L156 505 L156 518 L119 517 L108 513Z', '#73464a', 'none');
    art += p('M191 506 L234 492 L230 511 L191 520Z', '#412e36', 'none');
    art += l(
      'M119 363 L105 431 L98 473 M145 403 L135 474 M190 372 L203 465 M220 409 L232 475',
      '#947087',
      1.1,
      'opacity=".65"'
    );
    art += p(
      'M192 318 L207 311 L219 328 L215 356 L197 345 L188 350 L190 336 L181 339Z',
      '#372a43',
      dark,
      1.5
    );
    art += p('M199 321 L207 317 L214 330 L209 339Z', '#77556d', 'none');

    // Anatomical right arm: one shoulder, distinct elbow, tapering forearm and
    // five uneven red claws. The complete chain pivots together for the cast.
    let smallArm = p(
      'M124 243 L131 255 L118 271 L102 278 L91 287 L79 288 L74 280 L83 265 L101 250 L113 241Z',
      ivory,
      '#62614f',
      2.1
    );
    smallArm += p(
      'M113 241 L124 243 L120 253 L102 263 L87 278 L79 278 L83 265 L101 250Z',
      ivoryLight,
      'none'
    );
    smallArm += p(
      'M120 253 L131 255 L118 271 L102 278 L91 287 L83 282 L102 269Z',
      '#a1a58a',
      'none'
    );
    smallArm += p('M83 274 L95 281 L93 291 L86 299 L76 296 L72 287Z', '#ac807a', '#65524e', 1.3);
    smallArm += p(
      'M77 288 L86 290 L90 299 L83 310 L72 317 L62 312 L63 304Z',
      '#b69e91',
      '#65524e',
      1.6
    );
    smallArm += p('M77 288 L82 291 L80 301 L70 310 L63 308 L63 304Z', '#d5bcb0', 'none');
    smallArm += p('M86 290 L90 299 L83 310 L72 317 L67 313 L78 303Z', '#927369', 'none');
    smallArm += p(
      'M112 246 L119 254 L116 269 L106 277 L103 271 L94 276 L100 261Z',
      '#48364d',
      dark,
      1.5
    );
    smallArm += p('M112 246 L119 254 L111 259 L107 269 L100 272 L100 261Z', '#76546b', 'none');
    smallArm += p(
      'M65 307 L75 311 L80 319 L77 327 L71 331 L71 323 L67 322 L67 335 L61 341 L61 325 L57 323 L56 337 L51 342 L51 322 L48 321 L46 332 L42 335 L43 317 L50 307 L57 304Z',
      red,
      '#582b30',
      1.6
    );
    smallArm += p('M51 308 L57 304 L65 307 L70 313 L66 320 L55 319 L48 317Z', redLight, 'none');
    smallArm += p('M70 313 L75 311 L80 319 L77 327 L73 327 L74 320Z', '#7d2c31', 'none');
    smallArm += l('M54 321 L53 332 M63 322 L63 335 M47 320 L46 327', '#c05c51', 0.9);
    art += g(
      '',
      `${turn('0 118 254;0 118 254;8 118 254;8 118 254;0 118 254;0 118 254', '0;.23;.34;.49;.64;1', cycle)}${smallArm}`,
      'data-art-effect="ocellus-right-arm"'
    );

    // Broad ridged fan follows the forward-sloping face, rather than a flat ruff.
    art += p(
      'M141 199 L157 185 L178 176 L192 182 L208 181 L202 192 L221 201 L211 208 L231 219 L217 223 L235 237 L216 237 L229 252 L209 248 L219 266 L199 259 L203 277 L184 266 L178 282 L168 270 L153 274 L140 259 L132 247 L133 222Z',
      ivory,
      '#646950',
      2.2
    );
    art += p(
      'M157 185 L178 176 L192 182 L208 181 L191 194 L177 192 L161 204 L147 210 L141 199Z',
      ivoryLight,
      'none'
    );
    art += p(
      'M161 204 L177 192 L191 194 L202 192 L197 205 L211 208 L194 213 L178 204 L164 216Z',
      '#d5d3af',
      '#a5aa88',
      1
    );
    art += p(
      'M164 216 L178 204 L194 213 L211 208 L207 220 L217 223 L198 225 L182 218 L168 229Z',
      '#b8bf98',
      '#949e7c',
      1
    );
    art += p(
      'M168 229 L182 218 L198 225 L217 223 L215 231 L235 237 L214 237 L197 239 L183 232 L173 243Z',
      '#d8d6b2',
      '#a4aa86',
      1
    );
    art += p(
      'M173 243 L183 232 L197 239 L214 237 L229 252 L209 248 L198 250 L186 244 L180 255Z',
      '#c6c9a4',
      '#9ba381',
      1
    );
    art += p(
      'M180 255 L186 244 L198 250 L209 248 L219 266 L199 259 L192 261 L184 253 L184 266 L178 282 L168 270Z',
      '#d6d3ac',
      '#a0a281',
      1
    );
    art += p(
      'M141 218 L156 222 L160 241 L173 254 L180 255 L168 270 L153 274 L140 259 L132 247 L133 222Z',
      ivoryShade,
      'none'
    );
    art += p('M155 233 L164 229 L168 244 L180 255 L174 264 L163 257 L155 248Z', '#b2b899', 'none');
    art += l(
      'M170 191 L184 184 M181 202 L195 203 M184 216 L204 221 M184 231 L202 235 M187 245 L201 253 M166 251 L171 262',
      '#899271',
      1.1
    );

    // Sloping forehead and beaklike front, with two uneven violet eye markings.
    art += p(
      'M145 194 L161 186 L173 193 L177 208 L167 219 L159 236 L143 240 L128 234 L121 223 L128 207Z',
      '#c5c7a0',
      '#6b7457',
      1.8
    );
    art += p(
      'M145 194 L161 186 L173 193 L154 198 L144 213 L128 222 L121 223 L128 207Z',
      '#e0dfb8',
      'none'
    );
    art += p('M154 198 L173 193 L177 208 L167 219 L159 236 L151 231 L157 214Z', '#aeb68d', 'none');
    art += p('M144 213 L150 221 L143 234 L128 234 L121 223 L128 222Z', '#d3d0a8', 'none');
    art += p('M153 207 L166 201 L161 210 L150 214Z', '#653084', '#5e5469', 0.8);
    art += p('M155 207 L162 204 L158 208Z', '#c1a5da', 'none');
    art += p('M132 205 L137 199 L137 206 L132 211Z', '#a54442', 'none');
    art += p('M150 226 L160 220 L157 232 L148 236 L143 233Z', '#693083', '#797877', 0.8);
    art += p('M150 228 L154 225 L151 232 L147 234Z', '#a571ba', 'none');
    art += p(
      'M122 223 L131 223 L137 233 L146 237 L140 247 L126 242 L123 233Z',
      '#9f403e',
      '#713c37',
      1.1
    );
    art += p('M127 226 L131 224 L136 234 L131 237Z', '#bf6254', 'none');
    // Tendrils are appended after the gorget so they hang over its upper edge.
    let tendrils = p(
      'M126 239 L136 240 L139 254 L133 272 L137 290 L132 308 L121 320 L126 302 L125 287 L127 273 L125 258Z',
      red,
      '#672c31',
      1.5
    );
    tendrils += p(
      'M137 239 L148 237 L149 252 L144 274 L150 295 L148 317 L153 334 L145 325 L142 311 L143 297 L137 276 L140 253Z',
      '#a63b3d',
      '#672c31',
      1.6
    );
    tendrils += p(
      'M148 238 L156 235 L159 251 L155 271 L164 289 L164 306 L173 322 L162 314 L157 303 L157 290 L148 272 L151 254Z',
      '#873337',
      '#5b2a30',
      1.4
    );
    tendrils += p(
      'M126 243 L130 245 L132 255 L129 273 L131 289 L128 306 L129 288 L126 272 L129 257Z',
      '#c15c53',
      'none'
    );
    tendrils += p(
      'M141 244 L145 242 L145 253 L141 273 L146 293 L145 307 L141 288 L137 276 L142 254Z',
      '#bf514b',
      'none'
    );
    tendrils += l('M152 246 L155 252 L152 269 M130 247 L132 256 L129 269', '#d06a5a', 0.9);

    // Broad gold gorget, broken into heavy facets across the chest.
    art += p(
      'M157 260 L173 270 L198 270 L211 258 L217 270 L206 289 L205 307 L191 326 L163 342 L157 315 L147 296 L148 278Z',
      gold,
      '#6e5b2c',
      2.1
    );
    art += p(
      'M157 260 L173 270 L198 270 L211 258 L212 271 L195 283 L171 283 L153 273Z',
      goldLight,
      '#73652d',
      1.1
    );
    art += p(
      'M153 273 L171 283 L195 283 L212 271 L206 289 L194 297 L173 300 L153 288Z',
      '#bba23b',
      '#80702e',
      1.1
    );
    art += p(
      'M153 288 L173 300 L194 297 L206 289 L205 307 L184 317 L160 307Z',
      '#d0b84c',
      '#80702e',
      1.1
    );
    art += p('M160 307 L184 317 L205 307 L191 326 L163 342Z', '#a98d2d', '#77602a', 1.1);
    art += p('M184 317 L191 326 L163 342 L172 325Z', '#d6bd52', 'none');
    art += p('M149 276 L155 269 L159 281 L159 299 L163 307 L160 315 L151 298Z', '#e0c966', 'none');
    art += tendrils;

    // The massive wooden arm and its carried Blade move as one attached assembly.
    let arm = p(
      'M204 271 L224 258 L240 267 L247 296 L265 318 L271 347 L263 365 L246 370 L235 355 L242 337 L234 318 L221 310 L216 290 L203 285Z',
      bark,
      '#27232b',
      2.7
    );
    arm += p(
      'M224 258 L239 238 L248 213 L250 180 L241 153 L247 126 L235 107 L222 101 L211 110 L200 123 L206 105 L220 90 L239 94 L259 107 L264 134 L276 154 L280 184 L276 214 L264 244 L247 275 L240 291Z',
      bark,
      '#27232b',
      2.8
    );
    arm += p(
      'M247 126 L255 121 L259 107 L269 115 L272 137 L287 145 L279 152 L276 154 L264 134Z',
      '#493b3f',
      '#29232d',
      1.6
    );
    arm += p(
      'M239 94 L247 101 L235 107 L222 101 L211 110 L200 123 L206 105 L220 90Z',
      barkLight,
      'none'
    );
    arm += p(
      'M247 126 L241 153 L250 180 L248 213 L239 238 L224 258 L240 267 L254 239 L262 210 L261 179 L252 153 L257 136Z',
      '#57464a',
      'none'
    );
    arm += p(
      'M264 134 L276 154 L280 184 L276 214 L264 244 L247 275 L240 291 L240 267 L254 239 L268 207 L271 177 L262 155Z',
      '#322d35',
      'none'
    );
    arm += p(
      'M250 180 L240 169 L225 157 L214 147 L199 151 L189 166 L192 148 L205 133 L224 134 L239 147 L250 157Z',
      bark,
      '#28232c',
      2.1
    );
    arm += p(
      'M224 134 L239 147 L250 157 L250 168 L233 153 L218 145 L205 143 L192 158 L192 148 L205 133Z',
      barkLight,
      'none'
    );
    arm += p(
      'M241 153 L225 145 L216 122 L202 113 L190 116 L177 130 L181 112 L199 101 L216 105 L232 119 L237 139Z',
      '#44373e',
      '#28232c',
      2
    );
    arm += p(
      'M199 101 L216 105 L232 119 L237 139 L229 131 L222 117 L205 110 L190 116 L177 130 L181 112Z',
      '#655052',
      'none'
    );
    arm += p(
      'M275 199 L292 190 L301 166 L292 149 L296 131 L287 110 L301 125 L305 146 L315 163 L309 184 L294 206 L275 218Z',
      '#43373e',
      '#29232b',
      2.1
    );
    arm += p(
      'M301 166 L292 190 L275 199 L275 209 L295 198 L307 180 L311 164 L302 146 L299 126 L287 110 L301 125 L305 146 L315 163 L309 184Z',
      '#5e4c4e',
      'none'
    );
    arm += p(
      'M276 244 L290 233 L295 211 L307 197 L305 214 L300 230 L307 246 L296 264 L286 282 L268 288 L277 273 L285 255 L280 247Z',
      '#493a40',
      '#29232b',
      2
    );
    arm += p(
      'M224 258 L240 267 L247 296 L265 318 L271 347 L263 365 L252 366 L260 348 L257 329 L240 309 L232 287 L217 279Z',
      '#5e4a4c',
      'none'
    );
    arm += p(
      'M235 355 L242 337 L234 318 L221 310 L216 290 L203 285 L204 271 L217 279 L223 299 L240 310 L250 337 L246 352 L252 366 L246 370Z',
      '#332b33',
      'none'
    );
    // Hard bark planes and swollen joints echo the model's knotted living arm.
    arm += p('M252 154 L262 155 L271 177 L262 194 L254 185 L250 169Z', barkMid, '#382f37', 1.1);
    arm += p('M254 185 L262 194 L268 207 L262 221 L252 216 L249 205Z', '#685153', '#3d3139', 1.1);
    arm += p('M252 216 L262 221 L264 236 L253 245 L242 237 L248 226Z', '#49383f', '#302a32', 1.1);
    arm += p('M242 237 L253 245 L245 257 L232 267 L224 258Z', '#72585a', '#403239', 1.1);
    arm += p('M232 267 L245 257 L247 273 L240 288 L229 281Z', '#43343b', '#2e2830', 1.2);
    arm += p('M229 281 L240 288 L244 301 L235 306 L224 298 L220 287Z', '#705451', '#403239', 1.1);
    arm += p('M235 306 L244 301 L257 318 L252 333 L242 326Z', '#47363d', '#302831', 1.1);
    arm += p('M242 326 L252 333 L261 341 L258 353 L247 347Z', '#75605a', '#47393c', 1);
    arm += p('M238 122 L247 126 L244 139 L234 146 L230 136Z', '#382e36', '#2b252e', 1.1);
    arm += p('M266 160 L275 166 L277 182 L271 191 L267 180Z', '#60494f', 'none');
    arm += l(
      'M240 114 L252 132 M254 181 L256 203 M254 235 L246 253 M236 279 L239 293 M247 319 L259 337 M264 348 L258 359 M299 169 L295 183',
      '#7a5e5c',
      1.2
    );

    // Shoulder-to-elbow-to-wrist is deliberately visible below the great branch.
    // The long outer plane turns at the elbow before the hand wraps the gold shaft.
    arm += p(
      'M213 269 L229 263 L244 274 L258 281 L279 283 L288 295 L282 311 L269 325 L259 343 L260 359 L248 369 L235 361 L235 346 L245 326 L258 309 L262 301 L247 300 L233 291 L219 293 L208 282Z',
      '#51403f',
      '#29242c',
      2.3
    );
    arm += p(
      'M213 269 L229 263 L244 274 L258 281 L279 283 L270 292 L252 291 L235 281 L220 281 L208 282Z',
      '#786056',
      'none'
    );
    arm += p(
      'M279 283 L288 295 L282 311 L269 325 L259 343 L249 340 L255 323 L269 303 L270 292Z',
      '#66514b',
      '#3c3035',
      1.1
    );
    arm += p(
      'M235 291 L247 300 L262 301 L258 309 L245 326 L235 346 L235 361 L248 369 L249 350 L245 345 L252 329 L267 311 L275 300 L267 295 L249 295Z',
      '#332c32',
      'none'
    );
    arm += p('M266 289 L278 291 L282 298 L276 308 L267 311 L261 303Z', '#87715d', '#4a3b3d', 1.1);
    arm += p('M267 311 L269 325 L259 343 L252 340 L255 323Z', '#725b4d', 'none');
    arm += l(
      'M223 273 L234 275 L246 285 M273 292 L277 298 L272 303 M255 329 L251 340',
      '#9d8167',
      1.1
    );

    // The Blade's current object render reveals a greatsword, not a flame-shaped
    // axe: dark-purple grip, open gold pommel, wide gold guard, steel upper third,
    // then a long pointed wound in space carrying the separated metal below it.
    // Local origin is the existing palm; hand and sword stay on one arm timeline.
    let sword = p('M-3 -30 L4 -29 L5 24 L10 33 L-9 31 L-4 21Z', '#2d203e', '#211a30', 1.3);
    sword += p('M-3 -30 L0 -29 L0 21 L-4 27 L-4 21Z', '#443057', 'none');
    sword += p('M4 -29 L5 24 L10 33 L2 28 L0 21 L0 -29Z', '#21182e', 'none');
    // Open diamond pommel. Its hole remains visible above the root fingers.
    sword += p(
      'M0 -48 L10 -37 L12 -25 L6 -20 L1 -31 L-5 -21 L-11 -27 L-9 -39Z M0 -36 L-4 -30 L0 -24 L5 -30Z',
      '#b29a35',
      '#65542b',
      1.2,
      'fill-rule="evenodd"'
    );
    sword += p('M0 -48 L10 -37 L5 -30 L0 -36 L-9 -39Z', '#d0b34e', 'none');
    sword += p('M10 -37 L12 -25 L6 -20 L5 -30Z', '#8d7627', 'none');
    sword += p('M-5 -21 L0 -24 L5 -30 L6 -20 L0 -13Z', '#4b2e62', '#342441', 0.8);
    // Long, slightly asymmetric crossguard with faceted diamond terminals.
    sword += p(
      'M-43 27 L-35 22 L-29 27 L-9 29 L1 22 L12 29 L34 33 L41 29 L49 37 L42 44 L34 39 L12 36 L4 43 L-7 38 L-30 33 L-36 36Z',
      '#a98d2c',
      '#5e4e29',
      1.4
    );
    sword += p(
      'M-43 27 L-35 22 L-29 27 L-9 29 L1 22 L2 29 L-9 34 L-30 30 L-36 30Z',
      '#d5b84a',
      'none'
    );
    sword += p('M12 29 L34 33 L41 29 L49 37 L42 38 L34 35 L12 33Z', '#d0b14a', 'none');
    sword += p(
      'M-36 30 L-30 33 L-36 36 L-43 27Z M34 35 L42 38 L49 37 L42 44 L34 39Z',
      '#7f6924',
      'none'
    );
    sword += p('M-9 29 L1 22 L12 29 L15 42 L7 52 L-7 48 L-13 40Z', '#baa039', '#72602c', 1.3);
    sword += p('M1 22 L12 29 L7 39 L-5 39 L-9 29Z', '#d0b34d', 'none');
    sword += p('M7 39 L15 42 L13 83 L7 89 L4 57Z', '#967a25', '#685729', 0.9);
    const voidOutline =
      'M-9 73 L-13 89 L-24 101 L-18 108 L-29 119 L-22 121 L-23 139 L-18 149 L-22 164 L-32 175 L-7 169 L13 168 L24 149 L29 127 L27 104 L22 83 L17 66 L16 108 L17 132 L10 149 L1 156 L-8 163 L-15 167 L-10 153 L-11 140 L-6 127 L-9 118 L-6 109 L-10 99Z';
    sword += p(voidOutline, '#752999', '#4b235f', 1.4);
    sword += p(
      'M-9 73 L-13 89 L-24 101 L-18 108 L-29 119 L-22 121 L-23 139 L-18 149 L-22 164 L-32 175 L-19 169 L-15 160 L-14 146 L-18 136 L-17 119 L-22 119 L-14 107 L-18 103 L-8 91Z',
      '#522779',
      'none'
    );
    sword += p(
      'M17 66 L22 83 L27 104 L29 127 L24 149 L13 168 L-7 169 L-32 175 L-20 166 L-1 164 L12 155 L18 137 L20 116 L19 96Z',
      '#a13ac9',
      'none'
    );
    sword += p(
      'M19 96 L20 116 L18 137 L12 155 L-1 164 L-22 169 L-14 160 L3 153 L12 139 L14 118 L14 98Z',
      '#7b2baa',
      'none'
    );
    sword += p(
      'M-8 88 L-17 103 L-11 109 L-22 119 L-16 121 L-17 137 L-12 146 L-16 161 L-22 169 L-4 160 L10 151 L16 133 L18 114 L15 89 L10 73Z',
      '#210e17',
      '#42213f',
      0.8
    );
    // The grey blade still joins the guard; only its broken lower part floats.
    sword += p('M-6 40 L2 35 L11 43 L11 88 L3 84 L-7 79Z', '#81929c', '#495865', 1.2);
    sword += p('M-6 40 L2 35 L7 44 L-1 51 L-7 49Z', '#b2bdc1', 'none');
    sword += p('M-7 49 L-1 51 L-1 82 L-7 79Z', '#667b89', 'none');
    sword += p('M-1 51 L7 44 L11 43 L11 88 L3 84 L-1 82Z', '#91a1a9', 'none');
    sword += p('M7 44 L11 43 L11 88 L7 86Z', '#566b7a', 'none');
    sword += l('M-4 48 L-4 76 M4 48 L5 77', '#c1c8c4', 0.65, 'opacity=".7"');
    sword += p('M-5 88 L2 96 L1 106 L-7 119 L-6 103Z', '#879aa5', '#435565', 1);
    sword += p('M-5 88 L2 96 L-2 101 L-6 103Z', '#bcc6c6', 'none');
    sword += p('M-2 101 L1 106 L-7 119 L-6 103Z', '#536c7e', 'none');
    sword += p('M-5 88 L-2 96 L-3 104 L-7 119 L-6 103Z', '#6d8390', 'none');
    sword += p('M6 113 L17 105 L16 131 L8 123Z', '#a2b0b5', '#53616d', 1);
    sword += p('M6 113 L17 105 L13 116 L8 123Z', '#c6cecb', 'none');
    sword += p('M13 116 L17 105 L16 131 L8 123Z', '#6e8594', 'none');
    sword += p('M6 113 L10 114 L8 123 L16 131 L11 128 L5 120Z', '#546c7b', 'none');
    sword += p('M-4 137 L2 141 L-3 146 L-7 142Z', '#b5c0bd', '#657783', 0.7);
    sword += p(
      'M1 91 L4 88 L7 92 L4 94Z M-14 99 L-10 96 L-8 99 L-11 101Z M10 98 L12 96 L13 100Z M6 137 L8 140 L6 143Z M-9 156 L-5 153 L-2 157 L-6 159Z',
      '#d0d3c7',
      '#78878d',
      0.6
    );
    sword += l('M25 107 L26 126 L21 147 M-21 162 L-27 170', '#c55be0', 0.8, 'opacity=".65"');
    sword += on(
      p(voidOutline, 'none', '#c47be7', 1.7),
      '0;0;.85;.45;0;0',
      '0;.3;.375;.47;.6;1',
      cycle,
      'data-art-effect="ocellus-blade-charge"'
    );
    arm += g('translate(255 362) rotate(-14)', sword, 'data-relic="the-blade"');
    arm += p(
      'M246 341 L260 340 L269 347 L274 358 L270 374 L261 383 L250 382 L244 375 L237 372 L235 362 L240 349Z',
      '#655b48',
      '#292630',
      2
    );
    arm += p(
      'M246 341 L260 340 L269 347 L267 355 L254 352 L244 358 L238 359 L240 349Z',
      '#918267',
      'none'
    );
    arm += p(
      'M244 358 L254 352 L260 357 L261 365 L255 369 L250 363 L244 368 L237 367 L235 362Z',
      '#4d443d',
      '#302a30',
      1.1
    );
    arm += p('M249 358 L252 356 L257 359 L258 363 L255 365 L252 362Z', '#473052', '#241d2e', 0.8);
    arm += p('M267 355 L274 358 L270 374 L261 383 L255 380 L262 369 L263 361Z', '#4f473b', 'none');
    arm += p('M244 369 L252 367 L258 374 L255 380 L250 382 L244 375Z', '#82745a', '#443b36', 1.1);
    arm += l(
      'M247 348 L255 347 L263 351 M244 358 L250 363 M260 357 L263 364 M247 373 L252 376',
      '#b09a74',
      1
    );
    arm += l('M244 368 L250 369 L254 374 M263 361 L267 365 L264 373', '#302b30', 1.3);
    art += g(
      '',
      `${turn('0 216 282;0 216 282;-3.5 216 282;-3.5 216 282;2.5 216 282;0 216 282;0 216 282', '0;.24;.34;.42;.47;.6;1', cycle)}${arm}`,
      'data-art-effect="ocellus-branch-arm"'
    );

    // A few isolated void flecks leave the large ivory/wood silhouette readable.
    art += on(
      p(
        'M76 390 L80 381 L85 389 L79 397Z M297 323 L301 314 L306 323 L300 331Z',
        '#9970b2',
        '#634a7b',
        0.8
      ),
      '0;0;.6;.2;0;0',
      '0;.32;.41;.52;.65;1',
      cycle,
      'data-art-effect="ocellus-void-flecks"'
    );
    return `<g data-subject="ocellus-final-phase" id="${id}-subject">${art}</g>`;
  };

  /* Original stained glass, referenced against the actual Archive reward room.
   * https://oldschool.runescape.wiki/w/File:The_Fractured_Archive_-_reward_room_environment_concept.png
   * https://oldschool.runescape.wiki/w/File:Chest_(The_Fractured_Archive,_standard,_mine).webp
   * https://www.youtube.com/watch?v=hD69W4Rvj3w&t=1103s (18:23 reward room)
   * https://oldschool.runescape.wiki/w/File:Obligator_detail.png (current model)
   * Pass 2: reopened the concept and current chest model beside the first render
   * and 0–24s motion samples. Strengthened upright branching chest supports and
   * the diamond lock, darkened bare trees against the pale rim, subdivided the
   * rocky underside into irregular stone facets. Feedback revision: purple flames
   * are the user's explicit choice. The skull lid lifts to reveal the Void and a
   * current-model Obligator, then the weapon returns before the chest closes.
   * Crossbow revision pass 1: inspected current OSRS detail, equipped and concept
   * images. Replaced that reward with both Ascension crossbows, using their green
   * crystalline stocks, hooked dark limbs, cyan under-limbs and diamond noses.
   * Added irregular distant stardust, long staggered twinkles and rising chest sparks.
   * https://oldschool.runescape.wiki/w/File:Ascension_crossbows_detail.png
   * https://oldschool.runescape.wiki/w/File:Ascension_crossbows_equipped_male.png
   * https://oldschool.runescape.wiki/w/File:Ascension_crossbows_concept_art.png
   * Crossbow refinement pass 2: reopened all three model references beside initial
   * still/action/cycle captures. Enlarged the pair, sharpened crystal planes and
   * separated the hooked limbs with pale string lines. Added staggered floor and
   * rim sparkles so the room itself shimmers between chest reveals. Full-cycle
   * and seven-shape captures retain clear trees, chest silhouettes and purple fire.
   * Size feedback: the entire pair, including its separation, is scaled by .5.
   * The reveal peaks at local y=-44 instead of -87. Transition refinement gives
   * the shorter lift a soft arrival and hides the return/reset before closure.
   * Feedback refinement: compared the new full-cycle sheet against both images,
   * added the concept's fixed lower jaw, deepened the Void cavity and added shaded
   * steel spike planes so the miniature retains its cage silhouette at a distance. */
  scenes['cosmic-loot'] = function cosmicLoot(h, c, id) {
    const { p, l, g, ellipse, circle, a, move, turn } = h;
    const ink = '#242235';
    const cycle = 24;

    function crystalChest(x, y, scale, mirror = 1) {
      const body =
        ellipse(0, 46, 25, 7, '#363449', 'none', 0) +
        // Dark branching supports, deliberately visible under the blue crystal.
        p(
          'M-16 39 L-21 26 L-22 12 L-15 2 L-11 8 L-16 21 L-10 34 L-8 40 L4 40 L10 25 L9 10 L15 3 L19 9 L16 27 L11 42 L2 45 L-9 45Z',
          '#3b4057',
          ink,
          1.8
        ) +
        p(
          'M-9 40 L-9 25 L-15 13 L-12 7 L-5 21 L-3 38Z M5 39 L11 24 L14 8 L17 11 L15 27 L9 42Z',
          '#5c637c',
          'none'
        ) +
        p('M-20 38 L-8 35 L13 36 L21 40 L17 47 L-14 48 L-22 44Z', '#646579', ink, 1.6) +
        p('M-22 40 L-13 43 L17 42 L21 40 L17 47 L-14 48 L-22 44Z', '#47495f', ink, 1) +
        // High angular shoulders and the asymmetric central crown.
        p(
          'M-26 -22 L-18 -38 L-4 -31 L4 -43 L15 -42 L16 -30 L31 -36 L27 -11 L20 3 L13 23 L-3 32 L-18 20 L-26 1Z',
          '#929fb8',
          ink,
          2
        ) +
        p('M-26 -22 L-18 -38 L-4 -31 L-12 -10 L-24 -3Z', '#b3c4da', ink, 1) +
        p('M-4 -31 L4 -43 L15 -42 L11 -28 L5 -20 L-12 -10Z', '#525e7e', ink, 1) +
        p('M16 -30 L31 -36 L27 -11 L11 -2 L5 -20 L11 -28Z', '#c1cddd', ink, 1) +
        p('M-24 -3 L-12 -10 L5 -20 L11 -2 L-2 8 L-20 6Z', '#a5b9d0', ink, 1.1) +
        p('M11 -2 L27 -11 L20 3 L13 23 L-2 8Z', '#7183a3', ink, 1.1) +
        p('M-20 6 L-2 8 L13 23 L-3 32 L-18 20Z', '#8f9fbf', ink, 1.1) +
        p('M-18 20 L-3 20 L-3 32Z', '#667792', 'none') +
        l('M-25 -2 L-7 3 L0 -4 L7 2 L22 -1 M-20 11 L-1 17 L17 11', '#556080', 2) +
        p('M0 -6 L7 2 L3 8 L3 16 L-4 16 L-4 8 L-8 2Z', '#c9d3e3', '#515e7d', 1.6) +
        p('M0 -1 L3 3 L0 7 L-3 3Z M-1 6 H1 V12 H-1Z', '#5b6784', 'none') +
        l('M-18 -32 L-22 -20 M22 -28 L18 -12 M-16 5 L-10 7', '#d2d8e5', 1.1);
      return g(`translate(${x} ${y}) scale(${scale * mirror} ${scale})`, body);
    }

    function miniatureCrossbows() {
      // The current OSRS pair: green crystal stocks, hooked dark limbs and a
      // pointed cyan diamond nose. The bolt groove runs along the upper stock.
      function crossbow() {
        let bow = p(
          'M-7 -58 L-3 -66 L5 -62 L7 -48 L3 -34 L-4 -34 L-9 -47Z',
          '#263d36',
          '#172c30',
          1.5
        );
        bow += p('M-4 -58 L-2 -63 L2 -59 L3 -47 L-1 -38 L-4 -40Z', '#446052', 'none');
        bow += p(
          'M-5 -44 L-11 -48 L-6 -32 L-8 -15 L-6 5 L4 10 L11 -4 L7 -22 L3 -39Z',
          '#278e83',
          '#193d43',
          1.6
        );
        bow += p('M-5 -44 L3 -39 L7 -22 L0 -12 L-8 -15 L-6 -32Z', '#42ac91', 'none');
        bow += p('M-5 -44 L-6 -32 L0 -12 L-8 -15 L-6 5 L0 -2 L2 -21Z', '#2c7d83', 'none');
        bow += p('M3 -39 L7 -22 L11 -4 L4 10 L0 -12 L2 -21Z', '#246a80', 'none');
        bow += l('M-5 -39 L0 -30 L7 -22 M-8 -15 L0 -12 L9 -5 M0 -12 L0 7', '#73bbaa', 0.85);
        bow += l('M-1 -56 L1 -38 L0 -18', '#152e33', 1.5);
        // Two angular hooked limbs grow from the crystal, rather than a smooth bow.
        bow += p(
          'M-5 0 L-20 -4 L-27 -17 L-36 -19 L-40 -14 L-48 -18 L-43 -10 L-35 -10 L-32 -4 L-26 6 L-9 12 L0 9Z',
          '#304d41',
          '#183435',
          1.6
        );
        bow += p(
          'M6 0 L22 -5 L28 -17 L37 -20 L42 -16 L49 -22 L44 -11 L37 -11 L34 -3 L28 6 L11 12 L0 9Z',
          '#304c40',
          '#183435',
          1.6
        );
        bow += p(
          'M-44 -14 L-37 -16 L-31 -14 L-25 -2 L-8 5 L-9 9 L-27 3 L-34 -8 L-41 -9Z M8 5 L24 -2 L30 -14 L37 -17 L43 -15 L38 -9 L34 -8 L28 3 L10 9Z',
          '#45685a',
          'none'
        );
        bow += p(
          'M-39 6 L-8 10 L0 7 L8 10 L40 5 L25 15 L7 18 L0 15 L-10 18 L-28 14Z',
          '#2fbbc3',
          '#206b7b',
          1
        );
        bow += p('M-39 6 L-8 10 L-10 14 L-28 12Z M8 10 L40 5 L25 11 L7 14Z', '#66d1cc', 'none');
        bow += l('M-36 -10 L0 24 L37 -11', '#8bcfd3', 1.1, 'opacity=".7"');
        bow += p('M0 -5 L10 5 L5 18 L0 31 L-6 18 L-10 6Z', '#367e94', '#1b495c', 1.4);
        bow += p('M0 -5 L0 13 L-10 6Z M0 13 L5 18 L0 31Z', '#80c7d1', 'none');
        bow += p('M0 -5 L10 5 L0 13Z', '#55a6b9', 'none');
        bow += p('M0 13 L-6 18 L0 31Z', '#286278', 'none');
        return bow;
      }
      return g(
        'scale(.5)',
        g('translate(-33 0) rotate(-18) scale(.85)', crossbow()) +
          g('translate(33 0) rotate(18) scale(.85)', crossbow()),
        'data-relic="ascension-crossbow-pair"'
      );
    }

    function sparkle(x, y, size, tint = '#d6d2ed') {
      return p(
        `M${x} ${y - size * 2} L${x + size * 0.35} ${y - size * 0.3} L${x + size * 1.35} ${y} L${x + size * 0.35} ${y + size * 0.3} L${x} ${y + size * 2} L${x - size * 0.35} ${y + size * 0.3} L${x - size * 1.35} ${y} L${x - size * 0.35} ${y - size * 0.3}Z`,
        tint,
        'none'
      );
    }

    function rewardChest(x, y) {
      const lidKeys = '0;.22;.3;.67;.78;1';
      // The base stays seated on the dais while the faceted lid rises and tilts.
      let art = p('M-35 0 L-17 -12 L18 -12 L37 0 L31 29 L-28 29Z', '#6d7898', ink, 2);
      art += p('M-35 0 L-23 6 L-22 26 L-28 29Z', '#899bb8', ink, 1.3);
      art += p('M25 5 L37 0 L31 29 L23 26Z', '#556686', ink, 1.2);
      art += p('M-31 3 L-6 -1 L17 -1 L32 5 L30 27 L-29 27Z', '#8b8bae', ink, 1.4);
      art += p(
        'M-29 5 L-19 9 L-17 26 L-25 27 L-24 12Z M25 5 L15 9 L17 26 L25 27 L23 12Z',
        '#b6b0d3',
        ink,
        0.9
      );
      // The lower jaw belongs to the chest's fixed front, as in the opened concept.
      art += p('M-11 7 L-7 17 L0 21 L8 17 L12 7 L7 12 L0 15 L-6 12Z', '#c5c8d9', '#606c88', 1.1);
      art += l('M-7 12 L-5 17 M-2 14 V19 M3 14 L4 19 M8 11 L7 16', '#73748f', 0.8);
      art += p('M-28 26 L-33 33 L-27 36 L-22 28 M25 27 L31 33 L26 36 L20 28', '#49465d', ink, 1.2);
      art += l('M-27 18 L-21 17 M24 17 L19 16 M-9 1 L-8 23 M7 1 L8 23', '#d3d5df', 1.2);

      // Opening the chest exposes the black Void and its jagged violet edge.
      const interior =
        p('M-29 1 L-15 -9 H17 L31 1 L19 10 H-19Z', '#101326', '#9b76cc', 1.8) +
        p('M-24 0 L-14 -6 H15 L25 1 L17 6 H-17Z', '#0c1020', '#433056', 0.8) +
        p(
          'M-27 1 L-21 -7 L-17 0 L-12 -12 L-7 -2 L-3 -8 L0 0 L8 -9 L10 1 L19 -7 L20 3 L28 -2 L23 8',
          'none',
          '#9965cd',
          1.7
        );
      art += `<g opacity="0" data-art-effect="loot-void-interior">${a('opacity', '0;0;1;1;0;0', lidKeys, cycle)}${interior}</g>`;

      let lid = p(
        'M-31 -16 L-39 -31 L-20 -25 L-14 -40 L-4 -30 L10 -44 L15 -29 L33 -34 L30 -22 L44 -24 L32 -7 L17 -9 L7 -18 L-9 -17 L-22 -9Z',
        '#91a5c2',
        ink,
        2
      );
      lid += p('M-31 -16 L-22 -9 L-9 -17 L7 -18 L17 -9 L32 -7 L28 1 L-28 1Z', '#788bab', ink, 1.2);
      lid += p('M-20 -25 L-14 -40 L-4 -30 L-9 -17 L-22 -9Z', '#bac5da', ink, 1.1);
      lid += p('M10 -44 L15 -29 L33 -34 L24 -18 L17 -9 L7 -18Z', '#697b9d', ink, 1.1);
      lid += p(
        'M-10 -12 L0 -17 L11 -12 L14 -2 L8 4 L6 11 L2 7 L-1 11 L-4 7 L-8 9 L-9 2 L-15 -3Z',
        '#c7c9d8',
        '#606c88',
        1.2
      );
      lid += p('M-10 -5 L-3 -6 L-5 -1 L-10 -1Z M3 -6 L10 -6 L10 -1 L5 0Z', '#3b364f', 'none');
      lid += p('M0 -2 L3 3 L-2 3Z', '#69617f', 'none');
      lid += l('M-6 3 L-5 7 M0 3 V7 M6 3 L5 7', '#6a6783', 0.8);
      lid += l('M-25 -16 L-21 -20 M18 -25 L24 -26', '#d3d5df', 1.2);
      art += `<g transform="translate(0 0)" data-art-effect="loot-skull-lid">${move('0 0;0 0;-10 -42;-10 -42;0 0;0 0', lidKeys, cycle)}<g transform="rotate(0 -32 -10)">${turn('0 -32 -10;0 -32 -10;-14 -32 -10;-14 -32 -10;0 -32 -10;0 -32 -10', lidKeys, cycle)}${lid}</g></g>`;

      // Gentle rising glints carry the unique's light out of the Void cavity.
      // Their 24-second rise and hidden return share the chest's quiet pauses.
      for (let i = 0; i < 14; i++) {
        const x = (i % 2 ? 1 : -1) * (13 + ((i * 19) % 43));
        const y = -30 - ((i * 29) % 88);
        const glint = sparkle(x, y, i % 3 === 0 ? 2.8 : 1.5, i % 2 ? '#8fc8d8' : '#d9bee9');
        art += `<g opacity="0" data-art-effect="loot-reveal-spark">${a('opacity', '0;0;.85;.6;0;0', '0;.27;.39;.52;.68;1', cycle)}<g transform="translate(0 16)">${move('0 16;0 16;0 -8;0 -20;0 -30;0 -30', '0;.26;.4;.52;.68;1', cycle)}${glint}</g></g>`;
      }

      // A quiet five-second lead-in, a clear 9–12s reveal, then a hidden reset.
      const rewardLift = `<animateTransform attributeName="transform" type="translate" values="0 10;0 10;0 -44;0 -44;0 -12;0 -12" keyTimes="0;.29;.375;.5;.66;1" calcMode="spline" keySplines="0 0 1 1;.16 1 .3 1;0 0 1 1;.42 0 .58 1;0 0 1 1" dur="${cycle}s" repeatCount="indefinite"/>`;
      art += `<g opacity="0" data-art-effect="loot-crossbows-reveal">${a('opacity', '0;0;1;1;0;0', '0;.31;.375;.5;.66;1', cycle)}<g transform="translate(0 10)">${rewardLift}${miniatureCrossbows()}</g></g>`;
      return g(`translate(${x} ${y}) scale(.69)`, art, 'data-relic="archive-unique-chest"');
    }

    function tree(x, y, scale, mirror = 1) {
      const wood =
        p(
          'M-7 20 L-4 -13 L-10 -38 L-14 -52 L-11 -57 L-6 -44 L0 -35 L-1 -66 L-7 -81 L-5 -89 L2 -76 L5 -64 L7 -42 L17 -55 L24 -79 L28 -84 L25 -62 L20 -49 L11 -32 L9 -8 L15 6 L12 22Z',
          '#424b5c',
          ink,
          1.8
        ) +
        p(
          'M-8 -34 L-21 -45 L-27 -65 L-24 -71 L-20 -56 L-17 -50 L-14 -65 L-11 -68 L-12 -48 L-6 -39Z M5 -44 L-1 -52 L-15 -66 L-18 -79 L-15 -83 L-11 -71 L-4 -65 L1 -57Z M13 -35 L26 -42 L36 -58 L41 -61 L35 -47 L27 -36 L12 -27Z',
          '#566073',
          ink,
          1.6
        ) +
        l('M-3 17 L1 -10 L-4 -32 M4 -37 L5 -63 M10 -29 L22 -42 M-13 -49 L-18 -56', '#8f96a4', 1) +
        p('M-9 20 L-17 26 L-3 23 L5 27 L17 25 L9 19Z', '#525467', ink, 1.1);
      return g(`translate(${x} ${y}) scale(${scale * mirror} ${scale})`, wood);
    }

    function brazier(x, y, mirrored) {
      const flame = 'M-6 -12 Q-13 -23 -4 -31 Q-4 -24 0 -24 Q6 -31 3 -40 Q17 -27 9 -17 L6 -10Z';
      const body =
        p('M-8 1 L-5 -19 L5 -19 L8 1 L5 5 L8 17 L-8 17 L-5 5Z', '#66677d', ink, 1.4) +
        p('M-11 -18 L-8 -9 L8 -9 L12 -18 L5 -15 L0 -19 L-5 -15Z', '#9691a8', ink, 1.4) +
        `<g opacity=".8">${a('opacity', '.8;.65;.92;.74;.85;.8', '0;.18;.36;.55;.76;1', cycle)}` +
        p(flame, '#a46dd0', '#714b9a', 1.1) +
        p('M-3 -13 Q-7 -22 -1 -27 Q-1 -19 4 -24 Q8 -18 4 -12Z', '#e0b8ee', 'none') +
        '</g>' +
        l('M-3 -5 V1 M-2 7 L-4 14', '#af9ab9', 1);
      return g(`translate(${x} ${y}) scale(${mirrored ? -0.8 : 0.8} .8)`, body);
    }

    // The cosmic negative space is part of this room, independent of colour edition.
    let art = p('M20 550 V220 Q20 92 180 18 Q340 92 340 220 V550Z', '#17182c', ink, 1);
    art += p('M180 28 L270 137 L225 224 L175 271 L117 236 L63 175Z', '#25243d', '#35314e', 1.2);
    art += p('M180 28 L175 271 L117 236 L63 175Z', '#202139', '#35314e', 1.1);
    art += p(
      'M270 137 L323 218 L294 293 L225 224Z M63 175 L33 253 L69 325 L117 236Z',
      '#1e2337',
      '#35314e',
      1.1
    );
    art += p(
      'M175 271 L225 224 L294 293 L310 414 L242 461 L180 399 L88 450 L46 376 L69 325 L117 236Z',
      '#211c36',
      '#35314e',
      1.1
    );

    // Fine distant dust stays quiet; larger glints take turns over long cycles.
    // Positions are deliberately irregular, with clear space around the reward.
    const dust = [
      [177, 57],
      [145, 92],
      [202, 101],
      [124, 122],
      [166, 139],
      [238, 150],
      [100, 164],
      [278, 202],
      [79, 215],
      [217, 210],
      [145, 186],
      [119, 235],
      [43, 282],
      [318, 291],
      [57, 333],
      [305, 351],
      [41, 388],
      [320, 423],
      [69, 460],
      [84, 491],
      [120, 517],
      [167, 539],
      [213, 532],
      [277, 508],
      [308, 472],
      [296, 394],
      [55, 254],
      [303, 253],
      [158, 113],
      [198, 141],
      [230, 174],
      [111, 197],
      [253, 242],
      [92, 267],
      [280, 280],
      [47, 449],
      [310, 517],
      [147, 502],
      [233, 492],
      [204, 75],
      [143, 154],
      [251, 196],
      [70, 304],
      [320, 374],
      [109, 466],
      [252, 528],
      [50, 499],
      [315, 447],
    ];
    dust.forEach(([x, y], i) => {
      art += circle(
        x,
        y,
        i % 4 === 0 ? 1.05 : 0.62,
        i % 3 ? '#aab2cd' : '#d0b9e0',
        'none',
        0,
        `opacity="${i % 3 === 0 ? 0.56 : 0.36}"`
      );
    });
    const stars = [
      [173, 93, 2.2, 0],
      [130, 129, 2, 4],
      [228, 131, 1.8, 9],
      [93, 181, 1.8, 13],
      [265, 181, 2.2, 17],
      [193, 180, 2.6, 6],
      [143, 212, 1.7, 11],
      [301, 259, 2, 2],
      [53, 286, 2, 15],
      [65, 431, 2.3, 8],
      [292, 434, 1.8, 20],
      [127, 493, 2, 12],
      [229, 513, 2.4, 1],
      [183, 531, 1.7, 18],
      [301, 486, 1.5, 5],
      [180, 127, 1.3, 14],
      [155, 161, 1.4, 10],
      [223, 202, 2, 19],
      [112, 243, 2, 3],
      [310, 324, 1.5, 7],
      [44, 366, 1.7, 16],
      [60, 512, 1.7, 22],
      [276, 538, 1.6, 23],
      [90, 471, 1.1, 21],
      [268, 463, 1.4, 12],
      [207, 102, 1.2, 8],
      [69, 234, 1.4, 4],
      [283, 218, 1.4, 16],
    ];
    stars.forEach(([x, y, radius, delay], index) => {
      art += `<g opacity=".58" data-art-effect="loot-star-twinkle">${a('opacity', '.58;.58;.96;.58;.58', '0;.15;.3;.53;1', cycle, `begin="-${delay}s"`)}`;
      art += sparkle(x, y, radius, index % 3 ? '#c5c9de' : '#d6c1eb');
      art += '</g>';
    });

    // Pale skeletal trees silhouette the far rim before the island is drawn.
    art +=
      tree(72, 305, 0.83, -1) +
      tree(111, 286, 0.64) +
      tree(257, 294, 0.8, -1) +
      tree(299, 327, 0.91);

    // A fractured floating rock rather than a flat platform floating on a gradient.
    art += p(
      'M57 349 L76 329 L139 316 L223 318 L291 341 L301 375 L279 424 L251 441 L235 490 L200 475 L176 515 L158 474 L125 487 L105 449 L78 439 L63 392Z',
      '#454257',
      ink,
      2.7
    );
    art += p('M57 349 L102 356 L115 411 L105 449 L78 439 L63 392Z', '#565268', ink, 1.3);
    art += p('M102 356 L148 375 L158 474 L125 487 L105 449 L115 411Z', '#3d3c50', ink, 1.3);
    art += p('M148 375 L200 375 L210 422 L200 475 L176 515 L158 474Z', '#555066', ink, 1.3);
    art += p(
      'M200 375 L248 364 L270 386 L251 441 L235 490 L200 475 L210 422Z',
      '#35364c',
      ink,
      1.3
    );
    art += p('M248 364 L291 341 L301 375 L279 424 L251 441 L270 386Z', '#656074', ink, 1.3);
    // Broken rock faces carry small inset planes, not evenly spaced crystal columns.
    art += p(
      'M63 365 L79 376 L72 392 L66 388Z M79 376 L101 372 L105 400 L92 412 L76 401 L72 392Z',
      '#615b73',
      ink,
      1.1
    );
    art += p(
      'M92 412 L105 400 L115 411 L105 449 L90 436Z M79 376 L101 372 L99 383 L85 391Z',
      '#423e55',
      ink,
      1.1
    );
    art += p(
      'M114 389 L134 397 L142 426 L127 444 L111 430Z M127 444 L145 452 L151 474 L125 487 L112 462Z',
      '#4e485f',
      ink,
      1.1
    );
    art += p(
      'M114 389 L134 397 L130 410 L118 409Z M127 444 L145 452 L137 463 L116 459Z',
      '#655b72',
      'none'
    );
    art += p(
      'M151 383 L175 394 L183 423 L167 441 L150 427Z M167 441 L188 439 L196 461 L176 483 L164 467Z',
      '#62586e',
      ink,
      1.2
    );
    art += p(
      'M175 394 L195 388 L207 413 L198 432 L183 423Z M176 483 L196 461 L200 475 L176 515Z',
      '#443f55',
      ink,
      1.1
    );
    art += p(
      'M151 383 L175 394 L170 406 L156 402Z M167 441 L188 439 L184 450 L169 453Z',
      '#766981',
      'none'
    );
    art += p(
      'M212 382 L237 383 L243 401 L228 414 L211 406Z M212 428 L231 433 L234 459 L217 475 L204 466Z',
      '#494358',
      ink,
      1.1
    );
    art += p(
      'M237 383 L257 374 L268 390 L249 406 L243 401Z M234 459 L247 440 L242 475 L235 490 L217 475Z',
      '#5d536b',
      ink,
      1.1
    );
    art += p(
      'M273 371 L291 360 L295 375 L281 396 L268 390Z M265 408 L279 399 L279 424 L261 438 L251 441Z',
      '#76677f',
      ink,
      1.1
    );
    art += l(
      'M118 416 L126 427 L133 422 M156 463 L162 469 M199 443 L205 438 L211 441 M257 422 L265 418 M283 379 L287 372',
      '#8e7f98',
      1.1
    );
    art += p(
      'M78 376 L95 384 L94 398 L84 408 L76 397Z M144 426 L157 416 L165 435 L160 453 L146 446Z M225 408 L235 394 L248 410 L239 430 L229 426Z',
      '#898199',
      ink,
      1.3
    );
    art += p(
      'M77 378 L87 383 L84 395 L76 397Z M146 429 L157 420 L160 435 L150 440Z M229 410 L235 399 L239 411 L231 419Z',
      '#aba1b9',
      'none'
    );
    art += l(
      'M68 359 L80 378 M105 367 L113 395 L107 408 M175 394 L183 423 L178 458 M272 365 L280 388 L268 407 M214 447 L225 460',
      '#81778f',
      1.2
    );

    art += ellipse(180, 345, 127, 62, '#57566e', ink, 2.5);
    art += ellipse(180, 338, 122, 58, '#89849a', ink, 2.3);
    art += ellipse(180, 337, 110, 49, '#7067a1', '#b1a2c7', 1.8);
    art += p(
      'M74 339 Q78 310 128 298 L180 289 L228 299 Q278 312 287 338 L249 364 L180 379 L111 364Z',
      '#7466a7',
      '#504566',
      1.3
    );
    art += p('M74 339 L111 364 L180 379 V337 L130 306 Q83 317 74 339Z', '#8270b7', 'none');
    art += p('M180 337 V379 L249 364 L287 338 L231 313Z', '#63528f', 'none');
    art += l(
      'M81 344 Q180 391 278 344 M90 322 Q180 362 270 322 M111 304 L146 371 M180 290 V378 M247 306 L216 373 M77 335 H286',
      '#9886bf',
      1.1
    );
    art += l(
      'M58 340 L70 341 M68 317 L81 321 M90 301 L101 308 M122 287 L128 298 M155 281 L158 290 M199 280 L197 289 M235 287 L229 298 M270 302 L259 310 M292 320 L281 325 M302 344 L288 344 M291 370 L278 363 M265 387 L254 376 M227 399 L220 386 M182 405 V389 M135 400 L140 386 M95 386 L104 375 M68 367 L81 362',
      '#39364e',
      1.6
    );

    // Northern reward dais and its actual short flight of steps.
    art += p('M144 286 L165 272 H195 L216 286 V305 L203 315 H154 L141 305Z', '#656579', ink, 2);
    art += p('M144 286 L165 278 H195 L216 286 L201 297 H158Z', '#9693a8', ink, 1.3);
    art += p('M144 286 L158 297 V312 L141 305Z', '#7c7b90', ink, 1.3);
    art += p('M158 297 H201 L216 286 V305 L203 315 H154Z', '#53556d', ink, 1.3);
    art += p(
      'M158 299 H202 L206 305 V310 H154 V305Z M154 310 H206 L210 316 V321 H150 V316Z M150 321 H210 L215 327 V332 H145 V327Z M145 332 H215 L220 338 V344 H140 V338Z',
      '#818199',
      ink,
      1.5
    );
    art += l('M157 305 H204 M153 316 H208 M148 327 H213 M143 338 H217', '#bab0c8', 1.1);
    art += rewardChest(180, 265);
    art += brazier(135, 284, false) + brazier(226, 284, true);

    // Eight personal chests follow the circular room's perimeter.
    art += crystalChest(87, 311, 0.27, -1) + crystalChest(119, 298, 0.22);
    art += crystalChest(242, 298, 0.22, -1) + crystalChest(276, 315, 0.29);
    art += crystalChest(76, 347, 0.39) + crystalChest(285, 351, 0.39, -1);
    art += crystalChest(111, 374, 0.46, -1) + crystalChest(248, 375, 0.46);

    // Front roots stitch the rim into the rocky underside, without moving geometry.
    art += p(
      'M66 372 L69 388 L83 409 L84 430 L91 445 L95 446 L92 427 L92 413 L104 423 L110 443 L113 439 L107 417 L91 400 L83 378Z',
      '#363647',
      ink,
      1.4
    );
    art += p(
      'M282 373 L275 395 L264 412 L258 432 L245 447 L241 446 L251 429 L255 405 L266 388 L267 375Z',
      '#414052',
      ink,
      1.4
    );
    art += l('M78 387 L85 404 L87 426 M271 390 L260 412', '#6b647a', 1.2);

    // Light catches little suspended crystal flecks across the violet floor.
    // Long, offset fades keep the chamber alive through the chest's quiet pause.
    const roomGlints = [
      [124, 326, 1.7, 2],
      [236, 330, 1.6, 11],
      [154, 352, 1.8, 6],
      [205, 353, 1.4, 17],
      [111, 348, 1.3, 13],
      [251, 347, 1.5, 4],
      [180, 367, 1.6, 20],
      [93, 363, 1.1, 8],
      [269, 365, 1.4, 15],
      [135, 377, 1.3, 1],
      [227, 379, 1.2, 22],
      [167, 332, 1.1, 10],
      [138, 295, 1.3, 18],
      [222, 298, 1.2, 5],
    ];
    roomGlints.forEach(([x, y, size, delay], i) => {
      art += `<g opacity=".47" data-art-effect="loot-floor-sparkle">${a('opacity', '.47;.47;.9;.47;.47', '0;.22;.38;.7;1', cycle, `begin="-${delay}s"`)}${sparkle(x, y, size, i % 2 ? '#ead4ef' : '#c3d6e6')}</g>`;
    });

    // The room's jagged purple rifts shimmer below the island. No spiral galaxy.
    const rift = p(
      'M45 447 L62 467 L57 483 L77 474 L81 494 L105 500 L88 511 L69 499 L62 512 L53 485 L42 478Z M267 462 L282 450 L277 472 L295 465 L282 485 L289 494 L266 503 L249 516 L254 498 L272 486 L262 480Z',
      '#7354ad',
      '#3a305a',
      1.3
    );
    art += `<g opacity=".5" data-art-effect="archive-rift">${a('opacity', '.5;.5;.73;.46;.5', '0;.3;.48;.68;1', cycle)}${rift}</g>`;
    art += p(
      'M49 456 L56 478 L63 484 L60 494 L69 498 M281 460 L273 479 L279 482 L264 494',
      'none',
      '#b790db',
      1.3,
      'opacity=".65"'
    );
    art += p(
      'M58 409 L48 419 L52 435 L61 425Z M313 390 L302 405 L307 417 L318 398Z M106 489 L100 504 L111 512 L116 498Z M241 519 L235 529 L242 537 L251 523Z',
      '#747189',
      ink,
      1.3
    );
    art += p(
      'M58 409 L55 423 L48 419Z M313 390 L310 406 L302 405Z M106 489 L109 503 L100 504Z M241 519 L242 529 L235 529Z',
      '#aba1bc',
      'none'
    );

    return `<g data-cosmic-loot="${id}">${art}</g>`;
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
