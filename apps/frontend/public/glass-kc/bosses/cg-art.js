function uprightHunllefMotion(svg) {
  const marker = '<g transform="translate(25 174) scale(.2 .34)">';
  const from = svg.indexOf(marker);
  if (from < 0) throw new Error('Hunllef refinement: missing model plane');
  const end = svg.indexOf('</g>', from);
  if (end < 0) throw new Error('Hunllef refinement: model plane is unclosed');
  let facetIndex = 0;
  const model = svg
    .slice(from + marker.length, end)
    .replace(/<path d="([^"]+)"([^>]*)\/>/g, (path, rest, attrs) => {
      const index = facetIndex++;
      // The two front legs fold at their shoulders while rearing. The cyan rear
      // support and its foot vertices stay planted. Shared vertex coordinates
      // use the same continuous bend so the torso's original facets stay joined.
      const frontLeg = (index >= 7 && index <= 10) || (index >= 38 && index <= 43);
      const pose = (slam = false) =>
        rest.replace(/([ML])(-?[\d.]+)\s+(-?[\d.]+)/g, (_match, command, rawX, rawY) => {
          let x = Number(rawX),
            y = Number(rawY);
          const weight = Math.max(0, Math.min(1, (1100 - x) / 480));
          const planted = x >= 740 && y >= 580;
          if (planted || weight === 0) return `${command}${rawX} ${rawY}`;
          if (slam) return `${command}${x} ${(y + 15 * weight).toFixed(2)}`;
          if (frontLeg && y > 560) {
            y = 560 + (y - 560) * 0.44;
            x += 35;
          }
          const angle = ((52 * Math.PI) / 180) * weight;
          const dx = x - 900,
            dy = y - 620;
          const bentX = 900 + dx * Math.cos(angle) - dy * Math.sin(angle);
          let bentY = 620 + dx * Math.sin(angle) + dy * Math.cos(angle) + 80 * weight;
          // The tallest forward horn folds toward the forehead in the raised pose.
          // Compress only its upper reach, keeping the muzzle and chest visibly
          // higher without sending the horn through the arch's stone crown.
          if (bentY < -170) bentY = -170 + (bentY + 170) * 0.4;
          return `${command}${bentX.toFixed(2)} ${bentY.toFixed(2)}`;
        });
      const rear = pose(),
        slam = pose(true);
      if (rear === rest && slam === rest) return path;
      return `<path d="${rest}"${attrs}><animate data-motion="hunllef-upright-facet" attributeName="d" values="${rest};${rest};${rear};${rear};${slam};${rest};${rest};${rest}" keyTimes="0;.15;.36;.44;.48;.54;.6;1" dur="12s" repeatCount="indefinite" calcMode="spline" keySplines=".42 0 .58 1;.42 0 .58 1;0 0 1 1;.55 0 1 .4;.2 .7 .4 1;.42 0 .58 1;0 0 1 1"/></path>`;
    });
  if (facetIndex !== 64)
    throw new Error('Hunllef refinement: expected 64 original facets, got ' + facetIndex);
  const revised =
    svg.slice(0, from) +
    marker.replace('>', ' data-motion="hunllef-upright-stomp">') +
    model +
    svg.slice(end);
  return (
    revised +
    `<g data-motion="hunllef-two-paw-impact" opacity="0"><animate attributeName="opacity" values="0;0;.82;.3;0;0" keyTimes="0;.47;.485;.53;.61;1" dur="12s" repeatCount="indefinite"/><path d="M91 457 L102 462 L115 457 L126 464 L139 458 M104 462 L98 470 L85 472 M128 463 L136 471 L151 474 M94 501 L107 507 L122 501 L137 509 L152 502 M108 507 L102 516 L87 519 M140 508 L148 517 L165 519" fill="none" stroke="#e9767c" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/></g>`
  );
}
function labyrinthHunllefMotion(model) {
  labyrinthHunllefMotion.nextId = (labyrinthHunllefMotion.nextId || 0) + 1;
  const id = 'labyrinth-hunllef-opening-' + labyrinthHunllefMotion.nextId;
  // The central room contains a fully corrupted beast. Keep the existing split
  // model's silhouette, replacing the cyan rear facets with dark crimson here.
  const colors = [
    ['#285868', '#5b273d'],
    ['#4c94a3', '#984157'],
    ['#80ced8', '#d15b70'],
    ['#b6e4e2', '#f5a195'],
    ['#559bab', '#bb5267'],
    ['#93d8dc', '#e08287'],
    ['#529aa9', '#bb5267'],
    ['#a6dddd', '#f5a195'],
    ['#294f62', '#482835'],
    ['#386e81', '#763245'],
    ['#5c9cae', '#a74759'],
  ];
  model = model
    .replace(/<ellipse\b[^>]*\/>/, '')
    .replace(/stroke-width="[^"]+"/g, 'stroke-width=".55"');
  for (const [before, after] of colors) model = model.replaceAll(before, after);
  const gait = (start, finalStart, pivot, delay) => {
    const from = model.indexOf('<path d="' + start);
    const last = model.indexOf('<path d="' + finalStart, from);
    if (from < 0 || last < 0) throw new Error('Labyrinth Hunllef: missing leg facets');
    const end = model.indexOf('/>', last) + 2;
    const leg = model.slice(from, end);
    model =
      model.slice(0, from) +
      `<g><animateTransform attributeName="transform" type="rotate" values="-3 ${pivot};3 ${pivot};-3 ${pivot}" dur="1.6s" begin="${delay}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.5;1" keySplines=".42 0 .58 1;.42 0 .58 1"/>${leg}</g>` +
      model.slice(end);
  };
  gait('M951 431 L1029 465', 'M1018 655 L981 695', '990 475', 0);
  gait('M464 537 L533 573', 'M478 750 L589 727', '470 537', -0.8);
  gait('M925 520 L957 572', 'M932 753 L899 785', '960 560', -0.8);
  gait('M644 430 L710 491', 'M584 862 L613 877', '644 430', 0);
  return `<defs><clipPath id="${id}"><path d="M-26 57 L-29 14 L-26 -22 L-13 -45 L2 -55 L21 -36 L29 -9 L27 31 L19 58Z"/></clipPath></defs>
    <g data-motion="labyrinth-hunllef-behind-rune" clip-path="url(#${id})" pointer-events="none" aria-hidden="true">
      <path d="M-26 45 L0 30 L27 44 V58 H-26Z" fill="#342332" stroke="#733044" stroke-width=".7"/>
      <path d="M-24 49 H24 M-24 55 H22 M-13 40 L-10 58 M5 34 L8 58" fill="none" stroke="#6e3042" stroke-width=".7"/>
      <g transform="translate(0 14)"><g>
        <animateTransform attributeName="transform" type="translate" values="8 0;-8 0;-8 0;8 0;8 0" keyTimes="0;.42;.5;.92;1" dur="16s" repeatCount="indefinite" calcMode="spline" keySplines=".3 0 .7 1;0 0 1 1;.3 0 .7 1;0 0 1 1"/>
        <g><animateTransform attributeName="transform" type="scale" values="1 1;1 1;-1 1;-1 1;1 1" keyTimes="0;.46;.48;.96;1" dur="16s" repeatCount="indefinite" calcMode="discrete"/>
          <g transform="scale(.24) translate(-180 -350)">${model}</g>
        </g>
      </g></g>
    </g>`;
}
function gauntletSceneMotion(scene, svg) {
  const appendGroup = (marker, effect) => {
    const from = svg.indexOf(marker);
    if (from < 0) throw new Error(`Gauntlet scene ${scene}: missing group ${marker}`);
    const groups = /<\/?g\b[^>]*>/g;
    groups.lastIndex = svg.indexOf('>', from) + 1;
    let depth = 1,
      match;
    while ((match = groups.exec(svg))) {
      depth += match[0].startsWith('</g') ? -1 : 1;
      if (depth === 0) {
        svg = svg.slice(0, match.index) + effect + svg.slice(match.index);
        return;
      }
    }
    throw new Error('Gauntlet motion: subject group is unclosed');
  };

  if (scene === 0) {
    svg = uprightHunllefMotion(svg);
  } else if (scene === 1) {
    // A broad reflection sweeps inside the blade's actual crystal silhouette.
    // This is changing material light, with no independent projectile or orbit.
    const from = svg.indexOf('<path d="M162 106 L189 121');
    if (from < 0) throw new Error('Gauntlet motion: Blade of Saeldor silhouette changed');
    const end = svg.indexOf('/>', from) + 2;
    const silhouette = svg.slice(from, end);
    gauntletSceneMotion.nextId = (gauntletSceneMotion.nextId || 0) + 1;
    const id = 'cg-crystal-refraction-' + gauntletSceneMotion.nextId;
    const reflection = `<defs><clipPath id="${id}">${silhouette}</clipPath><linearGradient id="${id}-light" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f5b1a1" stop-opacity="0"/><stop offset=".4" stop-color="#ffe0c2" stop-opacity=".8"/><stop offset=".6" stop-color="#f5b1a1" stop-opacity=".5"/><stop offset="1" stop-color="#f5b1a1" stop-opacity="0"/></linearGradient></defs><g data-motion="saeldor-crystal-refraction" clip-path="url(#${id})"><g><animateTransform attributeName="transform" type="translate" values="0 394;0 66;0 394" keyTimes="0;.78;1" dur="9s" begin="-1.8s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;.85;.85;0;0" keyTimes="0;.06;.71;.78;1" dur="9s" begin="-1.8s" repeatCount="indefinite"/><path d="M135 -22 L239 -53 L239 -11 L135 20Z" fill="url(#${id}-light)" stroke="none"/><path d="M135 -10 L239 -41 L239 -34 L135 -3Z" fill="#ffe0c2" stroke="none" opacity=".34"/></g></g>`;
    // Insert in the blade group; the foreground bow retains its natural occlusion.
    appendGroup('<g transform="translate(-24 22) rotate(-32 180 300)"', reflection);
  } else if (scene === 3) {
    // Corrupt Deposit is mined with a corrupted pickaxe. A visible crystal-headed
    // tool strikes the existing deposit, then one irregular ore chip falls away.
    // The existing central door and its upright glyph are untouched.
    const tool = `<g data-motion="corrupt-deposit-pickaxe" transform="translate(315 459)"><g><animateTransform attributeName="transform" type="rotate" values="10;30;-8;-8;10;10" keyTimes="0;.25;.38;.46;.63;1" dur="10s" begin="-1.6s" repeatCount="indefinite"/><path d="M-4 7 L-3 -59 L4 -61 L4 4 L0 10Z" fill="#625661" stroke="#30303a" stroke-width="2" stroke-linejoin="round"/><path d="M-2 3 L-1 -52 L1 -54 L1 5Z" fill="#a18688" stroke="none"/><path d="M-28 -51 L-21 -64 L-5 -72 L11 -71 L22 -64 L28 -53 L13 -61 L0 -63 L-12 -57Z" fill="#de5c70" stroke="#7d314a" stroke-width="2" stroke-linejoin="round"/><path d="M-21 -64 L-5 -72 L11 -71 L22 -64 L5 -66 L-7 -64 L-18 -58Z" fill="#f58c8b" stroke="#b44b60" stroke-width="1"/><path d="M5 -66 L22 -64 L28 -53 L13 -61 L0 -63Z" fill="#7b2b43" stroke="none"/></g></g>`;
    const chip = `<g data-motion="mined-corrupt-ore" opacity="0"><animateMotion path="M309 401 Q328 400 330 428 Q334 467 317 515" keyPoints="0;0;0;1;1" keyTimes="0;.38;.4;.72;1" calcMode="linear" dur="10s" begin="-1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0;.95;.95;0;0" keyTimes="0;.385;.405;.68;.75;1" dur="10s" begin="-1.6s" repeatCount="indefinite"/><g><animateTransform attributeName="transform" type="rotate" values="0;0;0;145;145" keyTimes="0;.38;.4;.72;1" dur="10s" begin="-1.6s" repeatCount="indefinite"/><path d="M-5 -2 L-1 -8 L5 -4 L7 4 L0 7 L-6 3Z" fill="#de5c70" stroke="#7d314a" stroke-width="1.3"/><path d="M-5 -2 L-1 -8 L5 -4 L0 1Z" fill="#f58c8b" stroke="#b44b60" stroke-width=".7"/><path d="M0 1 L7 4 L0 7 L-6 3Z" fill="#7b2b43" stroke="none"/></g></g>`;
    const strike = `<g data-motion="deposit-strike" opacity="0"><animate attributeName="opacity" values="0;0;.7;0;0" keyTimes="0;.375;.395;.46;1" dur="10s" begin="-1.6s" repeatCount="indefinite"/><path d="M302 403 L295 399 M308 404 L312 396 M310 409 L319 407" fill="none" stroke="#f58c8b" stroke-width="2" stroke-linecap="round"/></g>`;
    svg += tool + chip + strike;
  }
  return svg;
}
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
    // The Wiki models share a heavy shoulder, forked brow and hooked muzzle.
    // Draw their facets in the model's plane, joining corrupted forequarters
    // to crystalline hindquarters; keep the crystal colours in every edition.
    const facet = (d, fill, stroke = '#253238', width = 2.1) =>
      path(d, fill, stroke, width).replace('/>', ' vector-effect="non-scaling-stroke"/>');
    return `${ellipse(181, 504, 126, 19, '#29313b', '#69716e', 1.8)}
      <g transform="translate(25 174) scale(.2 .34)">
      ${facet('M1142 178 L1319 188 L1399 251 L1444 335 L1470 397 L1505 436 L1545 550 L1467 554 L1427 507 L1422 448 L1380 427 L1404 385 L1404 321 L1366 275 L1316 238 L1162 225Z', '#285868', '#294f62', 2.5)}
      ${facet('M1319 188 L1399 251 L1444 335 L1470 397 L1422 448 L1404 385 L1404 321 L1366 275 L1316 238 L1162 225 L1142 178Z', '#4c94a3', '#294f62', 1.4)}
      ${facet('M1399 251 L1444 335 L1470 397 L1438 393 L1404 321Z M1470 397 L1505 436 L1545 550 L1467 493 L1438 393Z', '#80ced8', '#386e81', 1.3)}
      ${facet('M1427 507 L1422 448 L1467 493 L1545 550 L1467 554Z', '#b6e4e2', '#5c9cae', 1.3)}
      ${facet('M951 431 L1029 465 L1105 484 L1099 573 L1065 654 L982 706 L938 741 L899 761 L920 723 L857 738 L913 690 L1018 613 L1028 556 L968 526Z', '#285868', '#294f62', 2.4)}
      ${facet('M1105 484 L1099 573 L1065 654 L982 706 L938 741 L899 761 L920 723 L982 669 L1050 613 L1068 554 L1041 513Z', '#559bab', '#294f62', 1.5)}
      ${facet('M1018 655 L981 695 L938 741 L899 761 L920 723 L857 738 L913 690 L986 650Z', '#a6dddd', '#5c9cae', 1.4)}
      ${facet('M464 537 L533 573 L583 630 L632 720 L628 784 L547 813 L488 807 L514 779 L441 804 L430 782 L478 750 L589 727 L563 671 L498 636 L439 597Z', '#353440', '#382d39', 2.4)}
      ${facet('M533 573 L583 630 L632 720 L628 784 L599 775 L591 713 L554 663 L498 636 L439 597 L464 537Z', '#68515a', '#522e41', 1.4)}
      ${facet('M589 727 L632 720 L628 784 L547 813 L488 807 L514 779 L441 804 L430 782 L478 750Z', '#bb4057', '#522e41', 1.8)}
      ${facet('M478 750 L589 727 L617 744 L514 779 L441 804 L430 782Z M547 813 L599 775 L628 784Z', '#e9767c', '#a84555', 1.1)}
      ${facet('M361 267 L397 232 L476 177 L614 142 L671 142 L745 177 L825 197 L956 155 L1057 105 L1175 99 L1210 133 L1165 227 L1088 329 L1030 425 L937 464 L841 517 L714 566 L623 544 L528 507 L422 468 L359 407 L326 345Z', '#285868', '#253238', 2.8)}
      ${facet('M361 267 L397 232 L476 177 L614 142 L628 155 L549 225 L494 252 L423 290 L395 355 L322 424 L308 386 L332 311Z', '#ed8986', '#8f354d', 1.5)}
      ${facet('M614 142 L671 142 L745 177 L825 197 L794 231 L709 269 L650 313 L560 300 L535 257 L549 225 L628 155Z', '#bb4057', '#713244', 1.7)}
      ${facet('M614 142 L628 155 L591 199 L552 184 L549 225 L535 257 L494 252 L423 290 L397 232 L476 177Z', '#e56972', '#a84555', 1.2)}
      ${facet('M628 155 L671 142 L745 177 L695 164 L662 207 L591 199Z', '#f39b8b', '#a84555', 1.2)}
      ${facet('M535 257 L560 300 L650 313 L692 282 L709 269 L794 231 L825 197 L862 226 L825 286 L781 345 L712 371 L632 361 L553 341 L467 353 L423 290 L494 252Z', '#8c364e', '#522e41', 1.7)}
      ${facet('M825 197 L956 155 L951 264 L905 303 L879 369 L812 415 L781 345 L825 286 L862 226Z', '#80ced8', '#386e81', 1.8)}
      ${facet('M956 155 L947 232 L904 269 L880 309 L841 383 L812 415 L781 345 L825 286 L862 226Z', '#b6e4e2', '#5c9cae', 1.3)}
      ${facet('M951 264 L969 331 L1030 425 L937 464 L841 517 L714 566 L680 514 L725 432 L782 386 L812 415 L879 369 L905 303Z', '#285868', '#294f62', 1.9)}
      ${facet('M782 386 L841 517 L714 566 L680 514 L725 432Z', '#559bab', '#294f62', 1.4)}
      ${facet('M781 345 L812 415 L782 386 L725 432 L680 514 L645 533 L614 489 L616 407 L657 353 L712 371Z', '#353440', '#382d39', 2.1)}
      ${facet('M616 407 L657 353 L712 371 L725 432 L680 514 L645 533 L629 477Z', '#62505b', '#382d39', 1.5)}
      ${facet('M476 377 L553 341 L632 361 L657 353 L616 407 L614 489 L645 533 L588 557 L528 507 L422 468 L359 407 L395 355 L423 290 L467 353Z', '#713244', '#522e41', 2.1)}
      ${facet('M476 377 L553 341 L632 361 L588 401 L562 448 L528 507 L474 493 L435 454 L422 404Z', '#c74758', '#713244', 1.8)}
      ${facet('M474 493 L528 507 L588 557 L558 644 L487 629 L443 573 L420 516 L435 454Z', '#8f354d', '#522e41', 1.8)}
      ${facet('M528 507 L588 557 L558 644 L522 614 L487 629 L477 559Z', '#bb4057', '#713244', 1.5)}
      ${facet('M929 369 L961 304 L957 159 L1033 88 L1114 45 L1063 118 L1120 70 L1228 33 L1182 138 L1212 131 L1148 268 L1092 400 L1039 532 L1018 598 L1066 634 L1019 704 L956 784 L879 827 L791 841 L819 816 L769 822 L816 785 L892 737 L949 674 L981 622 L931 580 L898 520 L886 444Z', '#4c94a3', '#294f62', 2.7)}
      ${facet('M957 159 L1033 88 L1114 45 L1063 118 L1057 272 L959 340Z', '#80ced8', '#386e81', 1.7)}
      ${facet('M957 159 L1033 88 L1114 45 L1040 152 L959 340Z', '#b6e4e2', '#5c9cae', 1.3)}
      ${facet('M1063 118 L1120 70 L1228 33 L1182 138 L1115 285 L1072 367 L1039 532 L957 572 L925 520 L959 340 L1057 272Z', '#80ced8', '#386e81', 1.9)}
      ${facet('M1120 70 L1228 33 L1182 138 L1115 285 L1072 367 L1039 532 L1016 470 L1078 298 L1114 168Z', '#b6e4e2', '#5c9cae', 1.3)}
      ${facet('M1182 138 L1212 131 L1148 268 L1092 400 L1039 532 L1016 470 L1078 298Z', '#4c94a3', '#294f62', 1.4)}
      ${facet('M929 369 L956 328 L1057 272 L984 437 L925 520 L886 444Z', '#559bab', '#294f62', 1.7)}
      ${facet('M1057 272 L1032 383 L984 437 L925 520 L956 328Z', '#93d8dc', '#386e81', 1.3)}
      ${facet('M925 520 L957 572 L981 622 L949 674 L892 737 L816 785 L769 822 L819 816 L791 841 L879 827 L956 784 L1019 704 L1066 634 L1018 598 L1039 532Z', '#285868', '#294f62', 2.1)}
      ${facet('M981 622 L1019 654 L981 710 L932 753 L879 798 L819 816 L791 841 L879 827 L956 784 L1019 704 L1066 634Z', '#529aa9', '#294f62', 1.4)}
      ${facet('M932 753 L899 785 L879 827 L791 841 L819 816 L769 822 L816 785 L863 758 L827 798 L879 770Z', '#b6e4e2', '#5c9cae', 1.3)}
      ${facet('M644 430 L710 491 L760 552 L733 628 L700 732 L687 824 L658 897 L593 927 L522 961 L536 916 L391 950 L442 917 L350 901 L457 867 L523 857 L560 824 L588 757 L611 673 L605 618 L570 565 L593 485Z', '#353440', '#382d39', 2.8)}
      ${facet('M644 430 L710 491 L760 552 L733 628 L700 732 L687 824 L658 897 L616 912 L637 838 L664 745 L692 644 L702 579 L671 521 L624 471Z', '#62505b', '#382d39', 1.6)}
      ${facet('M644 430 L624 471 L671 521 L702 579 L692 644 L664 745 L637 838 L613 877 L584 862 L617 787 L641 675 L643 606 L622 566 L593 485Z', '#8b6973', '#522e41', 1.4)}
      ${facet('M560 824 L584 862 L613 877 L637 838 L616 912 L593 927 L522 961 L536 916 L391 950 L442 917 L350 901 L457 867 L523 857Z', '#c74758', '#522e41', 2.1)}
      ${facet('M457 867 L523 857 L560 824 L584 862 L544 891 L442 917 L350 901Z', '#e9767c', '#a84555', 1.3)}
      ${facet('M584 862 L613 877 L616 912 L593 927 L522 961 L536 916 L391 950 L442 917 L544 891Z', '#ed8986', '#a84555', 1.3)}
      ${facet('M250 452 L246 415 L272 363 L287 304 L319 289 L338 270 L278 217 L225 168 L178 129 L134 72 L103 0 L59 89 L67 163 L36 215 L0 282 L123 257 L177 279 L214 298 L256 362Z', '#bb4057', '#522e41', 2.6)}
      ${facet('M103 0 L91 118 L124 177 L178 214 L225 259 L269 301 L287 304 L319 289 L338 270 L278 217 L225 168 L178 129 L134 72Z', '#ed8986', '#a84555', 1.5)}
      ${facet('M59 89 L67 163 L36 215 L0 282 L123 257 L178 214 L124 177 L91 118 L103 0Z', '#c74758', '#713244', 1.4)}
      ${facet('M272 363 L319 289 L338 270 L344 326 L310 418 L288 491 L251 496 L246 449Z', '#62505b', '#522e41', 1.8)}
      ${facet('M288 491 L310 418 L359 357 L407 322 L467 353 L510 359 L560 402 L540 460 L495 509 L429 516 L405 508 L373 539 L335 587 L287 608 L214 601 L243 546 L262 510Z', '#a73c52', '#253238', 2.6)}
      ${facet('M310 418 L359 357 L407 322 L467 353 L510 359 L438 402 L380 436 L323 459 L288 491Z', '#e56972', '#8f354d', 1.7)}
      ${facet('M467 353 L510 359 L560 402 L540 460 L495 509 L429 516 L405 508 L407 459 L438 402Z', '#353440', '#382d39', 1.8)}
      ${facet('M510 359 L560 402 L540 460 L495 509 L465 489 L481 449 L479 409Z', '#68515a', '#522e41', 1.4)}
      ${facet('M323 459 L380 436 L407 459 L405 508 L373 539 L335 587 L287 608 L263 577 L295 511Z', '#713244', '#522e41', 1.5)}
      ${facet('M322 489 L362 455 L373 464 L344 499 L320 508Z', '#211f2a', '#a84555', 1.4)}
      ${facet('M330 489 L355 465 L359 473 L337 497Z', '#dd646f', '#dd646f', 0.6)}
      ${facet('M270 496 L315 468 L381 445 L455 423 L471 381 L529 333 L550 184 L565 235 L597 299 L630 397 L601 425 L559 450 L523 478 L468 498 L405 491 L351 523 L289 543 L262 527Z', '#bb4057', '#522e41', 2.7)}
      ${facet('M270 496 L315 468 L381 445 L455 423 L471 381 L529 333 L550 184 L553 305 L553 382 L506 408 L447 438 L377 473 L324 500 L289 511Z', '#ed8986', '#a84555', 1.5)}
      ${facet('M550 184 L565 235 L597 299 L630 397 L601 425 L559 450 L523 478 L468 498 L405 491 L447 438 L506 408 L553 382 L553 305Z', '#a64b56', '#713244', 1.5)}
      ${facet('M601 425 L559 450 L523 478 L468 498 L405 491 L447 438 L506 408Z', '#c74758', '#713244', 1.4)}
      ${facet('M270 496 L289 511 L289 543 L267 589 L247 605 L214 601 L243 546 L262 527Z', '#e56972', '#a84555', 1.9)}
      ${facet('M287 608 L335 587 L373 539 L405 508 L429 516 L400 560 L363 594 L333 622 L316 645 L290 642 L273 626 L247 605Z', '#211f2a', '#253238', 2.1)}
      ${facet('M247 605 L273 626 L290 642 L316 645 L333 622 L362 614 L347 644 L319 657 L285 650 L256 629Z', '#8f354d', '#522e41', 1.6)}
      ${facet('M285 607 L293 638 L319 659 L349 665 L400 662 L367 643 L349 622 L329 593 L309 595Z', '#bb4057', '#522e41', 2.2)}
      ${facet('M285 607 L293 638 L319 659 L349 665 L400 662 L345 648 L321 626 L309 595Z', '#e9767c', '#a84555', 1.2)}
      </g>`;
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

  function gauntletRune(upright = false) {
    // Vector outlines traced from the supplied barrier reference, recoloured crimson.
    // Undo the close-up's perspective on the front door so its strokes sit square.
    const perspective = upright ? 'matrix(1 .18 -.06 1 5.16 -14.4)' : '';
    return `<g transform="translate(-43.2 -46.44) scale(.54) ${perspective}" fill-rule="evenodd">
      <path d="M33 102 L25 102 L29 98 L46 94 L48 92 L59 90 L68 86 L71 87 L70 78 L65 68 L50 83 L48 83 L48 76 L54 69 L57 59 L45 53 L33 73 L28 97 L26 97 L23 92 L24 89 L22 88 L22 74 L25 63 L33 48 L27 45 L18 45 L18 43 L24 40 L40 39 L47 31 L50 30 L47 23 L45 23 L45 21 L40 18 L40 16 L51 16 L61 22 L67 18 L74 16 L87 18 L93 11 L105 7 L98 19 L99 23 L101 23 L108 29 L120 25 L129 26 L129 28 L125 29 L116 36 L125 46 L128 55 L130 56 L132 64 L132 75 L130 80 L124 70 L121 60 L106 43 L96 52 L96 54 L99 60 L107 67 L108 73 L94 68 L92 65 L90 65 L88 71 L88 83 L133 82 L128 86 L89 97 L89 102 L94 114 L110 100 L110 106 L106 110 L101 123 L112 127 L121 115 L130 86 L133 90 L134 101 L132 109 L130 112 L129 120 L122 132 L128 132 L135 135 L131 136 L130 138 L116 138 L106 148 L114 157 L116 157 L115 159 L102 158 L99 155 L93 156 L87 160 L73 159 L69 163 L69 165 L58 170 L58 167 L62 163 L64 156 L62 157 L53 151 L50 151 L46 154 L33 155 L34 152 L44 147 L45 144 L43 144 L34 135 L27 121 L27 104 L29 104 L35 118 L40 123 L40 125 L52 137 L57 137 L58 135 L60 135 L60 133 L65 128 L62 127 L60 122 L52 115 L51 111 L53 110 L57 113 L60 113 L66 116 L68 119 L70 119 L72 116 L72 101Z M48 45 L56 37 L58 37 L61 43 L61 51 L55 49 L55 47 L48 47Z M84 39 L86 59 L84 58 L81 65 L81 86 L79 86 L73 64 L68 60 L67 43 L64 37 L64 32 L66 33 L71 30 L85 30Z M106 108 L105 107 L104 109 L102 109 L94 119 L88 112 L85 102 L85 95 L88 96 L121 84 L84 85 L85 66 L89 58 L91 58 L96 64 L101 66 L96 61 L92 53 L101 43 L107 41 L111 45 L114 44 L113 47 L117 51 L119 51 L118 53 L125 60 L130 72 L130 66 L127 60 L127 56 L125 56 L118 41 L112 36 L112 34 L114 34 L116 30 L118 31 L118 29 L121 28 L117 28 L113 30 L113 32 L108 33 L102 27 L94 24 L95 16 L99 11 L95 13 L89 19 L89 21 L74 20 L70 22 L68 21 L62 25 L57 25 L57 23 L55 23 L53 20 L47 19 L50 22 L51 26 L53 26 L55 31 L52 31 L50 34 L48 34 L41 41 L41 43 L28 43 L33 44 L33 46 L36 45 L36 47 L39 46 L39 48 L33 54 L32 60 L28 67 L26 75 L26 88 L31 70 L38 57 L45 50 L53 52 L54 54 L56 53 L56 56 L61 59 L58 64 L59 66 L57 67 L58 69 L55 73 L58 71 L58 69 L60 70 L62 64 L65 63 L65 65 L70 69 L75 88 L71 88 L59 93 L52 94 L50 96 L47 95 L46 97 L44 96 L43 98 L41 97 L37 99 L76 97 L76 109 L74 118 L70 123 L68 123 L66 119 L62 119 L58 116 L61 120 L63 120 L66 128 L68 129 L65 131 L62 137 L56 140 L53 140 L48 136 L46 137 L46 135 L39 129 L37 124 L31 118 L32 116 L30 114 L32 122 L31 124 L34 130 L45 143 L50 145 L50 147 L45 148 L44 151 L49 148 L54 148 L68 155 L62 165 L67 163 L66 161 L68 161 L72 156 L85 157 L96 152 L100 152 L104 155 L106 154 L106 156 L109 156 L104 151 L103 146 L108 143 L108 140 L110 142 L110 140 L115 135 L124 135 L120 133 L118 134 L118 129 L120 129 L120 126 L122 126 L126 118 L129 110 L128 108 L130 108 L130 101 L118 124 L112 130 L105 129 L98 124 L100 116 L103 110Z M59 46 L58 41 L53 43 L57 45 L57 47Z M80 121 L78 125 L78 141 L79 145 L86 145 L88 143 L91 143 L89 141 L89 125 L85 122 L82 113Z M92 131 L92 137 L95 145 L90 146 L90 148 L75 148 L74 124 L78 119 L81 104 L83 105 L83 110 L85 109 L84 112 L86 111 L85 114 L88 120 L92 124Z M93 32 L103 36 L103 38 L101 38 L91 47 L91 32Z M63 139 L65 139 L70 134 L70 147 L59 145 L59 143Z M63 143 L68 145 L68 139Z M77 67 L78 69 L79 62 L82 57 L82 33 L68 35 L71 58 L75 62Z M87 54 L86 48Z M116 171 L112 172 L114 168 L116 168Z M98 137 L97 129 L100 129 L102 131 L105 130 L104 132 L106 131 L106 133 L108 132 L109 134 L102 140 L102 142 L99 142Z M54 97 L50 97 L53 95 L60 96Z M93 37 L94 41 L97 37Z M69 95 L76 96 L61 96Z M86 43 L85 45 L85 32Z M94 135 L93 124Z M28 75 L27 80Z M84 154 L72 155Z M101 138 L105 135 L100 134Z" fill="#752538"/>
      <path d="M86 73 L86 66 L89 59 L91 59 L95 64 L104 68 L95 58 L93 51 L99 45 L101 45 L101 43 L107 41 L108 43 L113 45 L113 47 L124 59 L128 72 L130 74 L130 65 L128 63 L127 56 L125 55 L118 40 L116 40 L112 36 L116 31 L122 28 L117 28 L111 32 L107 32 L103 27 L95 24 L96 16 L99 11 L95 13 L89 20 L74 19 L67 21 L62 25 L58 25 L52 19 L46 18 L50 22 L54 31 L49 33 L40 43 L24 42 L39 47 L33 53 L28 65 L29 67 L26 74 L26 88 L31 72 L38 60 L38 57 L46 50 L61 58 L52 77 L59 70 L61 70 L62 65 L65 64 L69 68 L70 74 L73 78 L75 88 L61 92 L59 91 L34 99 L45 100 L76 98 L76 109 L74 112 L74 117 L72 118 L70 123 L65 118 L57 115 L61 120 L63 120 L64 125 L67 128 L62 137 L54 140 L47 136 L39 128 L39 126 L31 116 L31 113 L29 112 L30 122 L34 130 L45 143 L50 145 L40 153 L45 152 L49 149 L55 149 L67 155 L62 165 L66 164 L72 157 L86 157 L96 152 L99 152 L105 156 L109 156 L103 149 L105 145 L111 142 L111 140 L115 136 L130 136 L118 133 L118 131 L123 125 L123 122 L130 109 L131 93 L126 106 L127 108 L124 110 L117 124 L112 129 L104 128 L98 122 L106 106 L94 118 L88 112 L88 106 L86 105 L86 96 L101 92 L109 88 L115 88 L123 84 L85 85Z M33 102 L26 102 L26 100 L30 98 L59 89 L61 90 L72 87 L70 78 L65 68 L50 83 L48 83 L49 75 L54 69 L54 66 L56 65 L58 59 L48 53 L45 53 L40 58 L40 61 L33 73 L27 95 L28 97 L26 97 L24 93 L23 74 L26 66 L25 63 L34 48 L18 43 L24 40 L40 40 L50 30 L48 23 L46 23 L40 16 L54 17 L56 20 L61 22 L67 18 L74 16 L88 18 L94 11 L104 7 L98 19 L99 23 L101 23 L108 29 L112 29 L117 26 L129 26 L129 28 L117 34 L116 37 L120 40 L120 42 L122 42 L128 55 L130 56 L130 61 L132 64 L131 78 L129 79 L129 77 L127 76 L123 67 L122 60 L107 43 L103 44 L96 51 L96 54 L99 60 L107 67 L108 73 L97 69 L92 64 L90 64 L88 71 L88 83 L133 82 L128 86 L89 97 L89 105 L94 114 L108 101 L110 101 L110 106 L104 113 L101 119 L101 123 L111 128 L115 124 L125 107 L124 105 L130 87 L133 90 L134 101 L132 104 L132 109 L129 119 L127 120 L122 132 L127 132 L135 135 L131 136 L130 138 L116 138 L106 148 L106 150 L115 158 L103 158 L100 155 L96 154 L87 160 L73 159 L69 163 L69 165 L58 169 L63 161 L64 156 L61 156 L54 151 L49 151 L45 154 L33 155 L34 152 L40 150 L46 145 L35 136 L32 128 L27 121 L27 104 L29 105 L39 124 L54 138 L61 135 L65 128 L52 114 L51 111 L66 116 L68 119 L70 119 L73 109 L73 101Z M78 69 L83 54 L81 48 L81 38 L83 33 L68 35 L71 58 L75 62 L77 70Z M84 39 L84 48 L86 55 L81 65 L79 86 L78 78 L73 67 L74 65 L68 59 L67 42 L65 40 L64 33 L72 30 L85 30Z M68 140 L67 139 L63 144 L68 145Z M81 113 L80 121 L77 126 L79 138 L78 145 L87 145 L91 143 L89 140 L89 124 L85 121Z M104 138 L101 142 L99 141 L98 129 L109 134Z M97 35 L101 36 L102 38 L100 38 L96 43 L93 44 L93 46 L91 46 L91 33Z M75 134 L74 125 L78 119 L82 104 L83 111 L91 123 L91 136 L94 145 L91 145 L88 148 L75 148Z M59 46 L58 41 L53 43 L57 47Z M93 42 L98 37 L92 36Z M101 139 L105 135 L102 135 L100 133Z M60 143 L70 135 L71 142 L69 144 L69 147 L61 145Z M61 44 L61 51 L56 49 L55 47 L49 46 L49 44 L51 44 L56 38 L59 39Z" fill="#ee5b58"/>
    </g>`;
  }

  function runeDoor(x, y, scale = 1, upright = false) {
    return `<g transform="translate(${x} ${y}) scale(${scale})">
      ${path('M-39 66 L-42 28 L-39 -26 L-25 -53 L-5 -72 L13 -68 L33 -46 L42 -14 L40 33 L34 66Z', '#393138', '#27272f', 2.7)}
      ${path('M-39 -26 L-25 -53 L-5 -72 L13 -68 L-7 -51 L-29 -16 L-32 36 L-39 66 L-42 28Z', '#82757b', '#514751', 1.5)}
      ${path('M13 -68 L33 -46 L42 -14 L40 33 L34 66 L25 46 L29 7 L23 -30 L8 -51Z', '#60545e', '#423b44', 1.5)}
      ${path('M-26 57 L-29 14 L-26 -22 L-13 -45 L2 -55 L21 -36 L29 -9 L27 31 L19 58Z', upright ? '#19141f' : '#391d2b', '#9b3c53', 1.5)}
      ${path('M-26 35 L-11 46 L1 31 L17 47 L26 35 L19 58 H-26Z', '#581d30', '#752538', 1)}
      ${upright ? labyrinthHunllefMotion(hunllef()) : ''}${gauntletRune(upright)}
    </g>`;
  }

  function labyrinthPhren(x, y, scale = 1) {
    // Phren Roots are a twisted dark trunk with one curved crystal crown.
    return `<g transform="translate(${x} ${y}) scale(${scale})">
      ${path('M-30 20 L-20 -4 L-1 -12 L19 -5 L30 15 L17 32 L-8 35Z', '#514952', '#2c2d35', 2.2)}
      ${path('M-30 20 L-20 -4 L-9 10 L-8 35Z M2 -9 L19 -5 L30 15 L11 24Z', '#73656c', '#46404a', 1.3)}
      ${path('M-10 15 L8 -14 L12 -35 L-1 -49 L-7 -72 L-1 -92 L14 -89 L8 -70 L15 -54 L27 -37 L25 -14 L11 19 L4 26Z', '#34343c', '#272831', 2.4)}
      ${path('M8 19 L25 -14 L27 -37 L15 -54 L8 -70 L14 -89 L5 -78 L3 -61 L17 -39 L16 -16Z', '#55505b', '#35343f', 1.4)}
      ${path('M0 -49 L-21 -43 L-10 -65 L-32 -67 L-19 -77 L-8 -73Z M16 -36 L37 -49 L32 -60 L21 -53Z', '#494651', '#2e3039', 1.5)}
      ${path('M-6 -78 L-10 -105 L-2 -132 L19 -157 L40 -177 L43 -152 L26 -123 L10 -98 L9 -72 L-1 -69Z', '#ad354f', '#4a2c3c', 2.2)}
      ${path('M-6 -78 L-10 -105 L-2 -132 L19 -157 L40 -177 L33 -152 L12 -123 L0 -98 L2 -74Z', '#e36573', '#a53e55', 1.2)}
      ${path('M40 -177 L43 -152 L26 -123 L10 -98 L9 -72 L2 -74 L0 -98 L12 -123 L33 -152Z', '#782a43', '#4a2c3c', 1)}
      ${path('M0 -136 L-15 -148 L-7 -126Z M11 -112 L20 -100 L8 -102Z', '#e36573', '#943449', 1.2)}
      ${line('M0 -127 L16 -150 L34 -170 M-4 -102 L-2 -86 M-14 6 L-19 20 M18 3 L11 22', '#f49389', 1.1)}
    </g>`;
  }

  function labyrinthGrym(x, y, scale = 1) {
    return `<g transform="translate(${x} ${y}) scale(${scale})">
      ${path('M-38 10 L-26 -1 L-15 3 L-7 -8 L8 -10 L32 2 L43 16 L27 29 H-15Z', '#4b4751', '#303039', 2)}
      ${path('M-28 14 L-38 -18 L-25 -32 L-40 -53 L-36 -80 L-31 -54 L-13 -30 L-27 -13 L-17 10Z M-8 19 L-5 -20 L-19 -48 L-12 -65 L-2 -51 L6 -25 L5 9Z M12 20 L26 -14 L16 -42 L22 -69 L28 -44 L38 -14 L25 19Z', '#565b31', '#303c2b', 2.3)}
      ${line('M-27 4 L-32 -15 L-19 -30 L-34 -53 M-1 10 L1 -24 L-10 -53 M20 8 L31 -13 L22 -43', '#8d9154', 2.2)}
      ${path('M-29 -57 L-40 -72 L-48 -68 L-51 -57 L-44 -48 L-35 -45Z', '#ced6a2', '#515e36', 2)}
      ${path('M-35 -50 L-44 -55 L-46 -64 L-43 -68 L-37 -62Z', '#f0ecd0', '#8f9b67', 1)}
    </g>`;
  }

  function labyrinthDeposit(x, y, scale = 1) {
    return `<g transform="translate(${x} ${y}) scale(${scale})">
      ${path('M-29 15 L-33 -6 L-21 -29 L-9 -37 L0 -61 L19 -74 L27 -50 L19 -18 L29 3 L27 27 L2 37 L-22 31Z', '#49434d', '#292c35', 2.4)}
      ${path('M-29 15 L-33 -6 L-21 -29 L-9 -37 L-11 -11 L-20 6 L-22 31Z M-9 15 L19 -18 L29 3 L6 21 L-22 31Z', '#645761', '#3d3642', 1.5)}
      ${path('M-9 -37 L0 -86 L33 -121 L25 -83 L3 -66 L-6 -45Z', '#de5c70', '#7d314a', 2)}
      ${path('M-9 -37 L0 -86 L33 -121 L25 -104 L8 -79 L2 -65Z', '#f58c8b', '#b44b60', 1.1)}
      ${path('M33 -121 L25 -83 L3 -66 L-6 -45 L-1 -71 L17 -95Z', '#7b2b43', '#4a2c3c', 1)}
      ${path('M-19 7 L-7 -18 L19 -39 L22 -16 L4 -4 L-8 5Z', '#cc4c62', '#7d314a', 1.7)}
      ${path('M-19 7 L-7 -18 L19 -39 L13 -24 L-3 -11 L-8 5Z', '#ee8a89', '#b44b60', 1.1)}
      ${line('M-23 29 L1 35 L24 26 M-25 10 L-10 14 M10 4 L22 9', '#a98687', 1.3)}
    </g>`;
  }

  function labyrinth() {
    // Bevelled squares widen toward the viewer instead of reading as brickwork.
    const rows = [290, 310, 335, 366, 404, 450, 506, 574];
    const tileX = (column, y) => 180 + column * (y - 225) * 0.36;
    const floor = rows
      .slice(0, -1)
      .map((y, row) => {
        const lower = rows[row + 1];
        return Array.from({ length: 13 }, (_, column) => {
          const c = column - 6;
          const a = tileX(c, y),
            b = tileX(c + 1, y);
          const d = tileX(c, lower),
            e = tileX(c + 1, lower);
          const midX = (a + b + d + e) / 4;
          const midY = (y + lower) / 2;
          return `${path(`M${a + 1} ${y + 1} L${b - 1} ${y + 1} L${e - 1} ${lower - 1} L${d + 1} ${lower - 1}Z`, (row + column) % 3 ? '#642f3b' : '#743746', '#342733', 1.2)}${path(`M${a + 3} ${y + 3} L${b - 3} ${y + 3} L${midX} ${midY}Z`, '#894450', '#894450', 0.4)}${path(`M${midX} ${midY} L${e - 3} ${lower - 3} L${d + 3} ${lower - 3}Z`, '#4a2634', '#4a2634', 0.4)}${line(`M${a + 2} ${y + 2} L${b - 2} ${y + 2} L${e - 2} ${lower - 2}`, '#a85860', 0.8)}`;
        }).join('');
      })
      .join('');
    return `${path('M20 282 H340 V550 H20Z', '#392b35', '#292b35', 2)}${floor}
      ${path('M20 306 V215 L35 177 L64 156 L91 167 L122 199 L125 304 L98 351 L65 370Z M237 310 L236 208 L254 174 L284 157 L314 177 L340 214 V312 L302 367 L266 354Z', '#514a55', '#292b35', 3)}
      ${path('M20 215 L35 177 L64 156 L91 167 L122 199 L89 192 L68 182 L37 218Z M236 208 L254 174 L284 157 L314 177 L340 214 L307 204 L287 184 L258 201Z', '#81717a', '#4d414f', 1.7)}
      ${path('M20 236 L38 222 L43 268 L31 290 L20 282Z M97 207 L122 199 L125 304 L98 351 L83 314 L99 275Z M237 246 L257 227 L264 277 L249 312 L266 354 L237 310Z M314 215 L340 214 V312 L322 330 L312 297 L324 267Z', '#373640', '#2b2c35', 1.4)}
      ${path('M20 303 L40 285 L51 306 L39 332 L65 370 L31 346Z M92 170 L119 190 L99 215 L84 207 L67 182Z M270 168 L284 157 L310 174 L288 183Z M300 334 L312 309 L321 330 L302 367 L283 362Z', '#695b67', '#493d4b', 1.3)}
      ${path('M104 302 L104 189 L120 161 L142 147 H216 L241 171 L255 200 L255 304 L224 331 H133Z', '#514b56', '#292b35', 3)}
      ${path('M104 189 L120 161 L142 147 H216 L241 171 L223 194 L191 172 L145 171 L126 197Z', '#88777c', '#4c414d', 1.7)}
      ${path('M104 221 L126 197 L134 234 L120 264 L133 294 L133 331 L104 302Z M226 200 L241 171 L255 200 V304 L224 331 L231 290 L219 257Z', '#37343f', '#2b2c35', 1.4)}
      ${path('M112 190 L130 174 L137 192 L122 208Z M218 159 L241 171 L226 200 L217 191 L221 175Z M111 274 L127 263 L133 293 L121 308 L106 300Z M231 279 L251 268 L249 298 L229 314Z', '#73626e', '#514450', 1.4)}
      ${runeDoor(180, 241, 1.01, true)}
      <g transform="translate(60 284) skewY(-11)">${runeDoor(0, 0, 0.57)}</g>
      <g transform="translate(301 285) skewY(11)">${runeDoor(0, 0, 0.57)}</g>
      ${[-1, 1].map((side) => `<g transform="translate(180 0) scale(${side} 1)">${path('M96 238 L113 226 L125 238 L124 260 L111 275 L95 263Z', '#663844', '#46303b', 1.6)}${path('M102 241 L113 235 L119 242 L118 258 L111 265 L102 258Z', '#d54966', '#a13952', 1.4)}${path('M106 244 L113 240 L116 245 L115 255 L110 260 L106 255Z', '#ef7182', '#d54966', 0.8)}</g>`).join('')}
      ${labyrinthGrym(69, 340, 0.43)}
      ${path('M20 383 L40 354 L64 352 L88 369 L98 407 L82 435 L48 438 L20 420Z M266 391 L279 364 L310 352 L334 374 L340 400 V431 L306 443 L279 427Z', '#514952', '#2a2b34', 2.7)}
      ${path('M20 383 L40 354 L64 352 L88 369 L67 382 L43 380 L31 400Z M266 391 L279 364 L310 352 L334 374 L310 390 L281 382Z', '#827079', '#4e414e', 1.7)}
      ${path('M67 382 L88 369 L98 407 L82 435 L71 412Z M306 391 L334 374 L340 400 V431 L306 443 L313 417Z', '#393641', '#2b2b34', 1.4)}
      ${labyrinthPhren(75, 486, 0.81)}${labyrinthDeposit(287, 493, 0.78)}
      ${path('M151 478 L164 459 L190 455 L211 474 L205 498 L181 510 L155 497Z', '#625661', '#30303a', 2.3)}
      ${path('M151 478 L164 459 L190 455 L211 474 L185 481Z', '#a18688', '#63515f', 1.4)}
      ${ellipse(180, 473, 25, 8, '#b49c96', '#403440', 1.7)}${ellipse(180, 473, 17, 4, '#8b3a50', '#d67a83', 1.2)}
      ${path('M190 463 L200 433 L206 426 L207 437 L196 465Z', '#9e98a5', '#40333f', 1.6)}
      ${line('M177 503 L193 497 M155 482 L158 494', '#a5868d', 1.2)}
      ${path('M125 525 L143 509 L172 517 L194 510 L221 519 L232 534 L207 546 L179 539 L151 547Z', '#663141', '#a85667', 1.7)}
      ${line('M143 520 L160 527 L177 522 L197 529 L212 523 M157 536 L175 532 L194 538', '#ca737a', 1.4)}`;
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

  function prifddinasMotes() {
    // Keep the original twelve sparse floating positions. Bigger pale faces
    // make the individual fragments readable at a normal window size.
    const shards = [
      [122, 134, 10.2, -11],
      [240, 128, 9.4, 14],
      [87, 246, 11.2, -13],
      [281, 248, 10.2, 19],
      [122, 284, 8.1, 11],
      [237, 281, 10.2, -16],
      [113, 430, 9.4, -9],
      [244, 441, 8.8, 16],
      [65, 488, 10.2, -15],
      [317, 490, 8.8, 12],
      [128, 487, 8.1, 15],
      [237, 515, 9.4, -12],
    ];
    const fragments = shards
      .map(([x, y, size, tilt], i) => {
        const width = size * 0.48;
        const fragment = `<g transform="rotate(${tilt})">
      ${i % 3 === 0 ? `<path d="M0 ${size + 2} L-.7 ${size + 10}" fill="none" stroke="#c4e3e0" stroke-width="1.1" opacity=".4"/>` : ''}
      <path d="M0 ${-size} L${width} 0 L0 ${size} L${-width} 0Z" fill="#99dedb" stroke="#5babae" stroke-width=".8"/>
      <path d="M0 ${-size} L0 ${size} L${-width} 0Z" fill="#c7efce" stroke="none"/>
      <path d="M0 ${-size} L${width} 0 L0 ${size * 0.54}Z" fill="#f5f8df" stroke="none"/>
      <path d="M0 ${-size * 0.66} L0 ${size * 0.28}" fill="none" stroke="#fffce9" stroke-width=".75"/>
    </g>`;
        return `<g transform="translate(${x} ${y})"><g class="prif-crystal-shard" style="animation-duration:${8 + (i % 4)}s;animation-delay:-${i * 1.35}s">${fragment}</g></g>`;
      })
      .join('');

    // Tower crown and leaf-roof tip, then the two foreground crystal tips.
    // Four separate twinkles keep the city clear and avoid a glittering cloud.
    const points = [
      [180, 112, 12.5],
      [86, 175, 11],
      [83, 467, 12],
      [284, 460, 12.5],
    ];
    const glints = points
      .map(([x, y, size], i) => {
        const neck = size * 0.25;
        return `<g transform="translate(${x} ${y})"><g class="prif-crystal-spark" style="animation-delay:-${i * 2.1}s">
      <circle r="${size * 1.4}" fill="#a7e9d9" opacity=".12"/>
      <path d="M0 ${-size} L${neck} ${-neck} L${size} 0 L${neck} ${neck} L0 ${size} L${-neck} ${neck} L${-size} 0 L${-neck} ${-neck}Z" fill="#fffce9" stroke="#3e777e" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M0 ${-size} V${size} L${-neck} ${neck} L${-size} 0 L${-neck} ${-neck}Z" fill="#c7efce" stroke="none"/>
      <circle r="1.35" fill="#fffce9"/>
    </g></g>`;
      })
      .join('');

    return `<g data-motion="prif-crystal-sparkle" pointer-events="none" aria-hidden="true">
    <style>
      .prif-crystal-shard { opacity:.9; animation:prif-crystal-float 9s ease-in-out infinite; }
      @keyframes prif-crystal-float {
        0%,100% { transform:translate(0,2px); opacity:.78; }
        50% { transform:translate(1.5px,-6px); opacity:1; }
      }
      .prif-crystal-spark { opacity:.32; transform:scale(.8); animation:prif-crystal-twinkle 8.4s ease-in-out infinite; }
      @keyframes prif-crystal-twinkle {
        0%,12%,100% { opacity:.28; transform:scale(.7); }
        25% { opacity:1; transform:scale(1.15); }
        39%,82% { opacity:.32; transform:scale(.8); }
      }
      @media(prefers-reduced-motion:reduce) {
        .prif-crystal-shard { animation:none; opacity:.9; transform:none; }
        .prif-crystal-spark { animation:none; opacity:.72; transform:scale(.75); }
      }
    </style>
    ${fragments}${glints}
  </g>`;
  }

  function frameOrnaments(count, index, uid, celebrate, { anchors }) {
    return anchors
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
        illustration = `${path('M180 70 L222 109 L284 139 L316 192 V368 H44 V192 L78 139 L137 109Z', '#aecac0', '#6c958e', 1.7)}${path('M180 70 L174 181 L139 236 L77 139 L137 109Z', '#d2dfcb', '#91b2a3', 1.3)}${ellipse(242, 177, 24, 24, '#e8e6b7', '#bac99c', 1.5)}${line('M63 218 L93 204 L109 210 M253 233 L278 215 L302 223', '#e3ecce', 1.5)}${prifddinas()}${prifddinasMotes()}`;
      }
      return `${panes}${arch}${scene === 2 ? illustration : gauntletSceneMotion(scene, illustration)}${line('M62 540 H298', colours[4], 1.3)}`;
    },
  });
  return { art, shrineMarkup, sceneColors };
};
