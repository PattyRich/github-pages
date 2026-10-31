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
/* global GLASS_NEW_SCENES */
GLASS_NEW_SCENES['cosmic-loot'] = function cosmicLoot(h, c, id) {
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
    tree(72, 305, 0.83, -1) + tree(111, 286, 0.64) + tree(257, 294, 0.8, -1) + tree(299, 327, 0.91);

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
  art += p('M200 375 L248 364 L270 386 L251 441 L235 490 L200 475 L210 422Z', '#35364c', ink, 1.3);
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
