/* global GLASS_NEW_SCENES */
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
GLASS_NEW_SCENES.obligator = (h, c, id) => {
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
  lid += p('M254 321 L291 307 L284 337 L310 333 L290 370 L263 369 L241 343Z', '#6b7e9e', ink, 1.2);
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
