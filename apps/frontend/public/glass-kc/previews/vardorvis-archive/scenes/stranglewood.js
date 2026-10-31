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
  window.GLASS_NEW_SCENES = window.GLASS_NEW_SCENES || {};
  window.GLASS_NEW_SCENES.stranglewood = function stranglewood(h, c, id) {
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
    art += l('M281 290 L299 290 M281 299 L299 299 M281 308 L299 308 M287 286 V315', '#56444f', 0.9);
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
