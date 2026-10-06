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
  // Wiki Phosani totem models: golden serpent, teal column, plum crest and rune scroll.
  // One carving serves the arena, charging shrine and awakening-window frame.
  function nightmareTotem(x, y, scale = 1, facing = 1, charged = true, motion = false) {
    const eye = charged ? '#73e4b6' : '#31775a';
    const phase = x < 180 ? (y < 300 ? 0 : 3.6) : y < 300 ? 1.2 : 2.4;
    return `<g data-nightmare-totem="true" data-totem-state="${charged ? 'charged' : 'uncharged'}"${motion ? ` class="nightmare-totem-live" style="--totem-phase:-${phase}s"` : ''} transform="translate(${x} ${y}) scale(${scale * facing} ${scale})" stroke="#354347" stroke-width="12" stroke-linejoin="round">
      <g transform="translate(-32.19 -44) scale(.087)">
        <path d="M243 686 L531 677 V1538 Q524 1580 243 1543Z" fill="#397f88"/>
        <path d="M243 686 L326 711 V1556 L243 1543Z" fill="#55959a" stroke="none"/>
        <path d="M452 703 L531 677 V1538 L469 1561Z" fill="#2c626e" stroke="none"/>
        <path d="M243 732 Q384 766 531 712 M243 1082 Q380 1124 531 1072 M243 1442 Q374 1483 531 1445" fill="none" stroke="#2c626e" stroke-width="20"/>
        <path d="M243 763 L326 753 M243 1138 L326 1119 M243 1472 L326 1463" fill="none" stroke="#79afb0" stroke-width="9"/>
        <path d="M75 359 L186 343 L267 245 L327 238 L430 355 L577 295 L627 469 L709 572 L656 695 L613 849 L549 905 L477 738 L396 644 L248 507 L120 474Z" fill="#69526a"/>
        <path d="M327 238 L430 355 L577 295 L530 460 L405 447Z" fill="#806676" stroke-width="8"/>
        <path d="M577 295 L627 469 L709 572 L617 577 L530 460Z" fill="#967786" stroke-width="8"/>
        <path d="M617 577 L709 572 L656 695 L613 849 L571 802Z" fill="#514257" stroke-width="8"/>
        <path d="M461 1023 L535 1037 L579 1103 L533 1173 L598 1185 L567 1261 L594 1315 L533 1404 L493 1445 L467 1347Z" fill="#a9a078"/>
        <path d="M535 1037 L579 1103 L516 1095Z M533 1173 L598 1185 L537 1236Z M567 1261 L594 1315 L540 1305Z" fill="#7d7759" stroke-width="8"/>
        <path d="M343 1268 L469 1206 L537 1115 L552 1180 L566 1239 L540 1313 L513 1369 L477 1404 L418 1421 L363 1437 L313 1439 L252 1431 L220 1436 L190 1420 L167 1410 L183 1390 L173 1368 L186 1342 L185 1324 L242 1307Z" fill="#bab890"/>
        <path d="M343 1268 L377 1295 L309 1321 L242 1307Z M469 1206 L506 1245 L416 1269 L377 1295Z M537 1115 L552 1180 L506 1245 L480 1195Z" fill="#d1c99c" stroke-width="8"/>
        <path d="M242 1307 L309 1321 L263 1386 L190 1420 L167 1410 L183 1390 L173 1368 L186 1342 L185 1324Z M377 1295 L416 1269 L456 1311 L363 1371 L313 1439 L252 1431 L263 1386Z" fill="#a9a078" stroke-width="8"/>
        <path d="M416 1269 L506 1245 L540 1313 L456 1311Z M456 1311 L540 1313 L513 1369 L477 1404 L418 1421 L363 1437 L363 1371Z" fill="#8d8663" stroke-width="8"/>
        <path d="M263 1386 L309 1321 L377 1295 L363 1371 L313 1439 L252 1431Z" fill="#c9c196" stroke-width="8"/>
        <path d="M12 627 L49 534 L75 359 L120 474 L239 439 L267 245 L295 242 L327 421 L432 410 L474 429 L577 295 L530 460 L584 506 L617 577 L709 572 L649 629 L667 715 L646 800 L608 881 L565 946 L521 994 L454 1037 L369 1063 L271 1081 L211 1066 L192 1045 L169 1018 L189 997 L178 964 L194 933 L196 919 L268 897 L399 834 L457 791 L489 734 L458 710 L375 689 L323 741 L207 812 L93 869 L23 857 L12 803 L42 752 L10 718 L6 662 L40 635 L86 644 L120 674 L167 716 L246 696 L303 640 L201 608 L130 563 L110 589Z" fill="#bab890"/>
        <path d="M12 627 L49 534 L75 359 L120 474 L110 547 L110 589Z" fill="#a9a078" stroke-width="8"/>
        <path d="M239 439 L267 245 L295 242 L327 421 L432 410 L474 429 L577 295 L530 460 L474 498 L376 477 L283 508 L120 474Z" fill="#c9c196" stroke-width="8"/>
        <path d="M267 245 L295 242 L327 421 L283 453Z M474 429 L577 295 L530 460 L474 498Z" fill="#a9a078" stroke-width="8"/>
        <path d="M130 563 L201 608 L303 640 L375 689 L458 710 L489 734 L457 791 L399 834 L268 897 L196 919 L231 969 L355 951 L484 876 L551 778 L565 652 L536 549 L474 498 L376 477 L283 508 L110 547Z" fill="#b7af83" stroke-width="8"/>
        <path d="M407 447 L491 499 L511 582 L489 655 L420 687 L464 620 L466 554Z" fill="#8d8663" stroke-width="8"/>
        <path d="M407 447 L466 554 L464 620 L420 687 L442 614 L443 552Z" fill="#d1c99c" stroke-width="7"/>
        <path d="M303 640 L375 689 L323 741 L207 812 L93 869 L23 857 L12 803 L42 752 L167 716Z" fill="#a9a078" stroke-width="8"/>
        <path d="M42 752 L167 716 L207 812 L93 869 L23 857 L12 803Z" fill="#c9c196" stroke-width="8"/>
        <path d="M130 563 L303 640 L246 696 L167 716 L120 674 L86 644Z" fill="${charged ? '#559f82' : '#31775a'}" stroke-width="8"/>
        <path d="M167 716 L246 696 L213 762 L168 790 L120 674Z" fill="${charged ? '#73e4b6' : '#3b8067'}" stroke="none"/>
        <path d="M196 919 L268 897 L326 865 L370 879 L404 814 L489 791 L532 820 L529 884 L501 954 L454 1037 L369 1063 L271 1081 L211 1066 L192 1045 L169 1018 L189 997 L178 964 L194 933Z" fill="#bab890"/>
        <path d="M268 897 L326 865 L370 879 L327 945 L256 984 L196 919Z M404 814 L489 791 L532 820 L468 871 L401 926 L370 879Z" fill="#d1c99c" stroke-width="8"/>
        <path d="M196 919 L256 984 L211 1066 L192 1045 L169 1018 L189 997 L178 964 L194 933Z M327 945 L401 926 L454 963 L369 1063 L271 1081 L256 984Z" fill="#a9a078" stroke-width="8"/>
        <path d="M468 871 L532 820 L529 884 L501 954 L454 963 L401 926Z" fill="#8d8663" stroke-width="8"/>
        <path d="M256 984 L327 945 L369 978 L319 1036 L211 1066Z M369 978 L454 963 L454 1037 L369 1063 L319 1036Z" fill="#c9c196" stroke-width="8"/>
        <path class="nightmare-totem-eye" d="M151 535 L154 508 L165 490 L194 477 L224 487 L228 496 L200 522Z" fill="${eye}" stroke-width="7"/>
        <path d="M164 500 L193 484 L207 489 L174 506Z" fill="${charged ? '#c0f3d3' : '#599774'}" stroke="none"/>
        <path d="M18 710 L5 691 L11 658 L34 638 L60 640 L84 656 L82 689 L59 716Z" fill="#c9c196"/>
        <path d="M33 651 L59 650 L180 732 L170 778 L139 782 L20 697 L21 671Z" fill="#49464d"/>
        <path d="M68 669 L102 685 L80 722 L57 705Z" fill="#8a858c" stroke="none"/>
        <path d="M168 720 L196 723 L215 748 L210 780 L185 804 L152 804 L128 783 L126 753 L140 731Z" fill="#bab890"/>
        <path d="M143 739 L166 726 L189 731 L177 768 L152 790 L133 779 L130 754Z" fill="#d1c99c" stroke="none"/>
        <path d="M68 669 L103 685 L96 721 L84 769 L95 847 L85 959 L94 1057 L81 1165 L78 1288 L61 1256 L47 1320 L43 1262 L34 1191 L38 1080 L31 967 L38 867 L28 787 L43 714Z" fill="#dbd6ca" stroke-width="8"/>
        <path d="M68 669 L103 685 L96 721 L80 713 L53 747 L43 714Z" fill="#f0e8d7" stroke-width="6"/>
        <path d="M79 731 L66 785 L78 857 L69 959 L81 1057 L67 1167 L61 1256" fill="none" stroke="#b5b2aa" stroke-width="7"/>
        <path d="M60 775 L51 798 L61 814 L53 832 L60 849 M56 878 L64 896 L52 904 M57 943 L67 959 L62 977 M57 1030 L69 1041 L58 1056 L66 1075 L57 1096 L63 1113 L55 1144" fill="none" stroke="#a64d62" stroke-width="12"/>
        <path d="M274 118 L282 1 L291 118Z" fill="#d1c99c" stroke-width="6"/>
        <path d="M267 188 L295 188 L317 211 L296 240 L267 245 L242 211Z" fill="#bab890" stroke-width="8"/>
        <path class="nightmare-totem-eye" d="M249 133 L269 118 L292 120 L310 135 L314 161 L300 183 L271 189 L251 175Z" fill="${eye}" stroke-width="8"/>
        <path d="M256 137 L273 123 L290 125 L286 156 L263 166 L252 160Z" fill="${charged ? '#a9edc5' : '#599774'}" stroke="none"/>
        ${
          charged
            ? `<g class="nightmare-totem-energy" fill="#73e4b6" stroke="none">
          <path d="M125 1232 L247 1251 L175 1263 L140 1235 L170 1347 L257 1394 L394 1368 L538 1264 L619 1124 L592 1038 L633 1100 L641 1168 L582 1299 L440 1400 L280 1430 L166 1374Z" opacity=".38"/>
          <path d="M359 1186 L514 1141 L573 1089 L640 990 L658 886 L670 858 L654 1024 L612 1125 L514 1193Z" opacity=".35"/>
          <path d="M286 1292 L412 1247 L501 1163 L550 1115 L521 1211 L405 1298Z" opacity=".25"/>
        </g>`
            : ''
        }
      </g>
    </g>`;
  }
  function shrineCarving(charged = true) {
    return nightmareTotem(0, 0, 1, 1, charged);
  }
  function shrineMarkup(pieces, _index, celebrate = false) {
    const dormantCarving = shrineCarving(false);
    return Array.from({ length: 4 }, (_, i) => {
      const charge = Math.max(0, Math.min(25, pieces - i * 25)),
        awake = charge === 25;
      const newlyAwake = celebrate && awake && (pieces === 100 || pieces === (i + 1) * 25);
      const label = awake
        ? 'AWAKENED'
        : pieces < 100 && i === Math.floor(pieces / 25)
          ? `${charge} / 25`
          : 'WAITING';
      return `<div class="shrine-totem ${awake ? 'awake' : charge > 0 || i === Math.floor(pieces / 25) ? 'charging' : ''} ${newlyAwake ? 'just-awakened' : ''}" style="--shrine-light:#73e4b6"><svg viewBox="-40 -50 80 158" role="img" aria-label="${ordinals[i]} totem: ${awake ? 'awakened' : charge + ' of 25 kills'}"><defs><clipPath id="charge-${i}"><rect x="-40" y="${92 - (charge / 25) * 138}" width="80" height="${(charge / 25) * 138}"/></clipPath><filter id="stone-${i}"><feColorMatrix type="saturate" values="0"/></filter></defs><ellipse cx="0" cy="94" rx="29" ry="5" fill="#73e4b6" opacity="${awake ? 0.2 : 0.04}"/><g filter="url(#stone-${i})" opacity=".28">${dormantCarving}</g><g class="totem-light" clip-path="url(#charge-${i})">${shrineCarving(awake)}</g></svg><small>${label}</small></div>`;
    }).join('');
  }
  // The same long, jointed claw appears in the arena and at each earned frame milestone.
  function graspingHand(x, y, scale = 1, facing = 1, tilt = 0, animated = false) {
    return `<g data-grasping-hand="true" transform="translate(${x} ${y}) rotate(${tilt}) scale(${scale * facing} ${scale})" stroke="#18212f" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-44 -113 L-71 -131 L-91 -157 L-103 -183 L-103 -205 L-94 -221 L-82 -224 L-74 -213 L-88 -199 L-86 -182 L-71 -162 L-51 -147 L-33 -130Z" fill="#6b7e89">${animated ? `<animate attributeName="d" values="M-44 -113 L-71 -131 L-91 -157 L-103 -183 L-103 -205 L-94 -221 L-82 -224 L-74 -213 L-88 -199 L-86 -182 L-71 -162 L-51 -147 L-33 -130Z;M -44 -113 L -70.93 -130.86 L -88.63 -153.2 L -97.74 -175.54 L -95.56 -194.44 L -85.76 -208.19 L -74.58 -210.77 L -68.09 -201.32 L -82.15 -189.29 L -81.69 -174.68 L -68.81 -157.5 L -50.17 -144.61 L -33 -130 Z;M-44 -113 L-71 -131 L-91 -157 L-103 -183 L-103 -205 L-94 -221 L-82 -224 L-74 -213 L-88 -199 L-86 -182 L-71 -162 L-51 -147 L-33 -130Z" keyTimes="0;.5;1" dur="6.6s" begin="${x < 100 ? -3.3 : x > 250 ? -1.6 : -0.2}s" repeatCount="indefinite"/>` : ''}</path>
    <path d="M-26 -140 L-46 -170 L-55 -205 L-54 -241 L-42 -261 L-27 -269 L-12 -260 L-10 -247 L-25 -244 L-34 -228 L-31 -205 L-18 -176 L-5 -151Z" fill="#788b96">${animated ? `<animate attributeName="d" values="M-26 -140 L-46 -170 L-55 -205 L-54 -241 L-42 -261 L-27 -269 L-12 -260 L-10 -247 L-25 -244 L-34 -228 L-31 -205 L-18 -176 L-5 -151Z;M -25.75 -138.59 L -44.23 -164.37 L -51.03 -194.44 L -48.23 -225.38 L -36.7 -242.56 L -23.49 -250 L -10.5 -241.7 L -8.87 -230.53 L -22.26 -227.96 L -30.79 -214.21 L -28.76 -194.44 L -17.2 -169.53 L -4.9 -148.04 Z;M-26 -140 L-46 -170 L-55 -205 L-54 -241 L-42 -261 L-27 -269 L-12 -260 L-10 -247 L-25 -244 L-34 -228 L-31 -205 L-18 -176 L-5 -151Z" keyTimes="0;.5;1" dur="6.6s" begin="${x < 100 ? -3.3 : x > 250 ? -1.6 : -0.2}s" repeatCount="indefinite"/>` : ''}</path>
    <path d="M2 -151 L-5 -188 L-2 -226 L7 -264 L22 -281 L39 -277 L51 -261 L47 -241 L36 -236 L32 -258 L25 -260 L19 -229 L22 -201 L31 -158Z" fill="#899ca4">${animated ? `<animate attributeName="d" values="M2 -151 L-5 -188 L-2 -226 L7 -264 L22 -281 L39 -277 L51 -261 L47 -241 L36 -236 L32 -258 L25 -260 L19 -229 L22 -201 L31 -158Z;M 1.96 -148.04 L -4.72 -179.84 L -1.82 -212.49 L 6.1 -245.14 L 19.14 -262 L 33.93 -258 L 44.57 -242.56 L 41.98 -225.38 L 32.33 -221.08 L 28.06 -239.99 L 21.87 -241.7 L 17.19 -215.07 L 20.5 -191.01 L 30.16 -154.06 Z;M2 -151 L-5 -188 L-2 -226 L7 -264 L22 -281 L39 -277 L51 -261 L47 -241 L36 -236 L32 -258 L25 -260 L19 -229 L22 -201 L31 -158Z" keyTimes="0;.5;1" dur="6.6s" begin="${x < 100 ? -3.3 : x > 250 ? -1.6 : -0.2}s" repeatCount="indefinite"/>` : ''}</path>
    <path d="M30 -143 L51 -171 L68 -204 L84 -223 L103 -226 L119 -214 L126 -194 L115 -181 L105 -188 L105 -204 L98 -208 L87 -194 L76 -165 L59 -130Z" fill="#657d89">${animated ? `<animate attributeName="d" values="M30 -143 L51 -171 L68 -204 L84 -223 L103 -226 L119 -214 L126 -194 L115 -181 L105 -188 L105 -204 L98 -208 L87 -194 L76 -165 L59 -130Z;M 29.62 -141.17 L 48.99 -165.23 L 63.15 -193.59 L 76.48 -209.91 L 93.48 -212.49 L 109.37 -202.18 L 118.23 -184.99 L 109.35 -173.82 L 99.14 -179.84 L 97.52 -193.59 L 90.64 -197.02 L 81.64 -184.99 L 73.44 -160.07 L 59 -130 Z;M30 -143 L51 -171 L68 -204 L84 -223 L103 -226 L119 -214 L126 -194 L115 -181 L105 -188 L105 -204 L98 -208 L87 -194 L76 -165 L59 -130Z" keyTimes="0;.5;1" dur="6.6s" begin="${x < 100 ? -3.3 : x > 250 ? -1.6 : -0.2}s" repeatCount="indefinite"/>` : ''}</path>
    <path d="M-36 -88 L-62 -104 L-86 -119 L-111 -118 L-126 -107 L-126 -92 L-116 -83 L-105 -96 L-94 -99 L-77 -82 L-53 -64 L-31 -65Z" fill="#81939b"/>
    <g fill="#182330" stroke="#121c29" stroke-width="2">
      <path d="M-94 -221 L-82 -229 L-68 -220 L-64 -203 L-72 -187 L-78 -202 L-84 -209 L-91 -205Z">${animated ? `<animate attributeName="d" values="M-94 -221 L-82 -229 L-68 -220 L-64 -203 L-72 -187 L-78 -202 L-84 -209 L-91 -205Z;M -85.76 -208.19 L -74.18 -215.07 L -62.11 -207.33 L -59.5 -192.73 L -68.05 -178.98 L -72.59 -191.87 L -77.61 -197.88 L -84.43 -194.44 Z;M-94 -221 L-82 -229 L-68 -220 L-64 -203 L-72 -187 L-78 -202 L-84 -209 L-91 -205Z" keyTimes="0;.5;1" dur="6.6s" begin="${x < 100 ? -3.3 : x > 250 ? -1.6 : -0.2}s" repeatCount="indefinite"/>` : ''}</path>
      <path d="M-27 -269 L-13 -268 L-3 -254 L-5 -236 L-16 -223 L-14 -245 L-23 -253 L-32 -253Z">${animated ? `<animate attributeName="d" values="M-27 -269 L-13 -268 L-3 -254 L-5 -236 L-16 -223 L-14 -245 L-23 -253 L-32 -253Z;M -23.49 -250 L -11.31 -249 L -2.64 -236.55 L -4.49 -221.08 L -14.57 -209.91 L -12.45 -228.81 L -20.28 -235.69 L -28.21 -235.69 Z;M-27 -269 L-13 -268 L-3 -254 L-5 -236 L-16 -223 L-14 -245 L-23 -253 L-32 -253Z" keyTimes="0;.5;1" dur="6.6s" begin="${x < 100 ? -3.3 : x > 250 ? -1.6 : -0.2}s" repeatCount="indefinite"/>` : ''}</path>
      <path d="M39 -277 L51 -263 L54 -245 L44 -225 L34 -221 L39 -242 L33 -258 L25 -262Z">${animated ? `<animate attributeName="d" values="M39 -277 L51 -263 L54 -245 L44 -225 L34 -221 L39 -242 L33 -258 L25 -262Z;M 33.93 -258 L 44.47 -244.28 L 48.02 -228.81 L 39.97 -211.63 L 31.02 -208.19 L 34.79 -226.24 L 28.93 -239.99 L 21.82 -243.42 Z;M39 -277 L51 -263 L54 -245 L44 -225 L34 -221 L39 -242 L33 -258 L25 -262Z" keyTimes="0;.5;1" dur="6.6s" begin="${x < 100 ? -3.3 : x > 250 ? -1.6 : -0.2}s" repeatCount="indefinite"/>` : ''}</path>
      <path d="M119 -214 L128 -197 L125 -179 L113 -167 L103 -164 L113 -188 L108 -204Z">${animated ? `<animate attributeName="d" values="M119 -214 L128 -197 L125 -179 L113 -167 L103 -164 L113 -188 L108 -204Z;M 109.37 -202.18 L 119.74 -187.57 L 119.1 -172.1 L 108.97 -161.79 L 99.63 -159.21 L 106.69 -179.84 L 100.3 -193.59 Z;M119 -214 L128 -197 L125 -179 L113 -167 L103 -164 L113 -188 L108 -204Z" keyTimes="0;.5;1" dur="6.6s" begin="${x < 100 ? -3.3 : x > 250 ? -1.6 : -0.2}s" repeatCount="indefinite"/>` : ''}</path>
      <path d="M-126 -107 L-137 -92 L-136 -76 L-123 -61 L-123 -82 L-116 -95 L-111 -102Z"/>
    </g>
    <g fill="#b0bdba" stroke="none">
      <path d="M-93 -205 L-95 -184 L-84 -162 L-73 -147 L-79 -166 L-91 -187Z">${animated ? `<animate attributeName="d" values="M-93 -205 L-95 -184 L-84 -162 L-73 -147 L-79 -166 L-91 -187Z;M -86.28 -194.44 L -90.06 -176.4 L -81.41 -157.5 L -71.8 -144.61 L -76.26 -160.93 L -86.01 -178.98 Z;M-93 -205 L-95 -184 L-84 -162 L-73 -147 L-79 -166 L-91 -187Z" keyTimes="0;.5;1" dur="6.6s" begin="${x < 100 ? -3.3 : x > 250 ? -1.6 : -0.2}s" repeatCount="indefinite"/>` : ''}</path>
      <path d="M-43 -244 L-43 -213 L-36 -188 L-22 -164 L-27 -185 L-37 -214 L-35 -239Z">${animated ? `<animate attributeName="d" values="M-43 -244 L-43 -213 L-36 -188 L-22 -164 L-27 -185 L-37 -214 L-35 -239Z;M -38.28 -227.96 L -39.56 -201.32 L -33.99 -179.84 L -21.28 -159.21 L -25.57 -177.26 L -34.01 -202.18 L -31.33 -223.66 Z;M-43 -244 L-43 -213 L-36 -188 L-22 -164 L-27 -185 L-37 -214 L-35 -239Z" keyTimes="0;.5;1" dur="6.6s" begin="${x < 100 ? -3.3 : x > 250 ? -1.6 : -0.2}s" repeatCount="indefinite"/>` : ''}</path>
      <path d="M12 -261 L7 -228 L7 -194 L17 -167 L14 -197 L13 -227 L21 -265Z">${animated ? `<animate attributeName="d" values="M12 -261 L7 -228 L7 -194 L17 -167 L14 -197 L13 -227 L21 -265Z;M 10.49 -242.56 L 6.34 -214.21 L 6.57 -184.99 L 16.39 -161.79 L 13.1 -187.57 L 11.79 -213.35 L 18.27 -246 Z;M12 -261 L7 -228 L7 -194 L17 -167 L14 -197 L13 -227 L21 -265Z" keyTimes="0;.5;1" dur="6.6s" begin="${x < 100 ? -3.3 : x > 250 ? -1.6 : -0.2}s" repeatCount="indefinite"/>` : ''}</path>
      <path d="M82 -205 L67 -171 L49 -145 L59 -149 L77 -175 L91 -205Z">${animated ? `<animate attributeName="d" values="M82 -205 L67 -171 L49 -145 L59 -149 L77 -175 L91 -205Z;M 76.08 -194.44 L 64.35 -165.23 L 48.29 -142.89 L 57.92 -146.33 L 73.66 -168.67 L 84.43 -194.44 Z;M82 -205 L67 -171 L49 -145 L59 -149 L77 -175 L91 -205Z" keyTimes="0;.5;1" dur="6.6s" begin="${x < 100 ? -3.3 : x > 250 ? -1.6 : -0.2}s" repeatCount="indefinite"/>` : ''}</path>
      <path d="M-112 -111 L-91 -111 L-69 -97 L-85 -103 L-104 -104Z"/>
    </g>
    <path d="M-27 6 L-32 -40 L-48 -72 L-57 -109 L-40 -141 L-19 -156 L6 -160 L30 -154 L53 -135 L58 -105 L45 -72 L29 -43 L24 6Z" fill="#637c89">${animated ? `<animate attributeName="d" values="M-27 6 L-32 -40 L-48 -72 L-57 -109 L-40 -141 L-19 -156 L6 -160 L30 -154 L53 -135 L58 -105 L45 -72 L29 -43 L24 6Z;M -27 6 L -32 -40 L -48 -72 L -57 -109 L -39.58 -139.45 L -18.52 -152.34 L 5.83 -155.78 L 29.31 -150.62 L 52.74 -134.3 L 58 -105 L 45 -72 L 29 -43 L 24 6 Z;M-27 6 L-32 -40 L-48 -72 L-57 -109 L-40 -141 L-19 -156 L6 -160 L30 -154 L53 -135 L58 -105 L45 -72 L29 -43 L24 6Z" keyTimes="0;.5;1" dur="6.6s" begin="${x < 100 ? -3.3 : x > 250 ? -1.6 : -0.2}s" repeatCount="indefinite"/>` : ''}</path>
    <path d="M-40 -141 L-19 -156 L6 -160 L30 -154 L16 -128 L-7 -119 L-28 -127Z" fill="#9babaf">${animated ? `<animate attributeName="d" values="M-40 -141 L-19 -156 L6 -160 L30 -154 L16 -128 L-7 -119 L-28 -127Z;M -39.58 -139.45 L -18.52 -152.34 L 5.83 -155.78 L 29.31 -150.62 L 16 -128 L -7 -119 L -28 -127 Z;M-40 -141 L-19 -156 L6 -160 L30 -154 L16 -128 L-7 -119 L-28 -127Z" keyTimes="0;.5;1" dur="6.6s" begin="${x < 100 ? -3.3 : x > 250 ? -1.6 : -0.2}s" repeatCount="indefinite"/>` : ''}</path>
    <path d="M-28 -127 L-7 -119 L-10 -80 L-17 -47 L-13 4 L-27 6 L-32 -40 L-48 -72 L-57 -109Z" fill="#7d929c" stroke="none"/>
    <path d="M16 -128 L30 -154 L53 -135 L58 -105 L45 -72 L29 -43 L24 6 L9 5 L14 -54 L32 -84 L36 -109Z" fill="#3e596c" stroke="none">${animated ? `<animate attributeName="d" values="M16 -128 L30 -154 L53 -135 L58 -105 L45 -72 L29 -43 L24 6 L9 5 L14 -54 L32 -84 L36 -109Z;M 16 -128 L 29.31 -150.62 L 52.74 -134.3 L 58 -105 L 45 -72 L 29 -43 L 24 6 L 9 5 L 14 -54 L 32 -84 L 36 -109 Z;M16 -128 L30 -154 L53 -135 L58 -105 L45 -72 L29 -43 L24 6 L9 5 L14 -54 L32 -84 L36 -109Z" keyTimes="0;.5;1" dur="6.6s" begin="${x < 100 ? -3.3 : x > 250 ? -1.6 : -0.2}s" repeatCount="indefinite"/>` : ''}</path>
    <path d="M-7 -119 L16 -128 L36 -109 L32 -84 L14 -54 L9 5 L-3 5 L-9 -56 L-10 -80Z" fill="#879da4" stroke="none"/>
    <path d="M-27 5 L-32 -37 L-44 -65 L-37 -65 L-24 -42 L-18 5Z M16 5 L22 -44 L34 -66 L32 -41 L24 6Z" fill="#a57ca3" stroke="none"/>
    <g fill="none">
      <path d="M-91 -178 L-82 -178 M-44 -215 L-34 -216 M5 -230 L18 -228 M72 -184 L83 -179 M-83 -109 L-89 -98" stroke="#455c6d" stroke-width="3">${animated ? `<animate attributeName="d" values="M-91 -178 L-82 -178 M-44 -215 L-34 -216 M5 -230 L18 -228 M72 -184 L83 -179 M-83 -109 L-89 -98;M -86.79 -171.24 L -78.21 -171.24 M -40.4 -203.04 L -31.18 -203.9 M 4.52 -215.93 L 16.3 -214.21 M 68.26 -176.4 L 79.08 -172.1 M -83 -109 L -89 -98;M-91 -178 L-82 -178 M-44 -215 L-34 -216 M5 -230 L18 -228 M72 -184 L83 -179 M-83 -109 L-89 -98" keyTimes="0;.5;1" dur="6.6s" begin="${x < 100 ? -3.3 : x > 250 ? -1.6 : -0.2}s" repeatCount="indefinite"/>` : ''}</path>
      <path d="M-41 -132 L-25 -135 M-15 -146 L-3 -143 M14 -148 L25 -143 M38 -134 L48 -126" stroke="#d0ccc1" stroke-width="2.2">${animated ? `<animate attributeName="d" values="M-41 -132 L-25 -135 M-15 -146 L-3 -143 M14 -148 L25 -143 M38 -134 L48 -126;M -40.92 -131.72 L -24.88 -134.3 M -14.77 -143.75 L -2.96 -141.17 M 13.76 -145.47 L 24.69 -141.17 M 37.85 -133.44 L 48 -126;M-41 -132 L-25 -135 M-15 -146 L-3 -143 M14 -148 L25 -143 M38 -134 L48 -126" keyTimes="0;.5;1" dur="6.6s" begin="${x < 100 ? -3.3 : x > 250 ? -1.6 : -0.2}s" repeatCount="indefinite"/>` : ''}</path>
      <path d="M-37 -115 L-22 -98 L-15 -72 M-20 -108 L-3 -99 L10 -108 L28 -102 M28 -120 L20 -91 L7 -65 L5 -27 M-31 -47 L-11 -39 M9 -38 L24 -44" stroke="#344b5c" stroke-width="2.3"/>
      <path d="M-6 -78 L-4 -52 L1 -14 M-44 -89 L-34 -69 L-29 -63" stroke="#bdc5c0" stroke-width="1.8"/>
      <path d="M-76 -217 L-71 -207 M-13 -259 L-8 -250 M44 -267 L48 -254 M120 -205 L122 -193 M-131 -91 L-131 -80" stroke="#66818e" stroke-width="1.5">${animated ? `<animate attributeName="d" values="M-76 -217 L-71 -207 M-13 -259 L-8 -250 M44 -267 L48 -254 M120 -205 L122 -193 M-131 -91 L-131 -80;M -69.63 -204.76 L -65.74 -196.16 M -11.39 -240.84 L -7.08 -233.11 M 38.28 -248 L 42.27 -236.55 M 111.33 -194.44 L 114.6 -184.13 M -131 -91 L -131 -80;M-76 -217 L-71 -207 M-13 -259 L-8 -250 M44 -267 L48 -254 M120 -205 L122 -193 M-131 -91 L-131 -80" keyTimes="0;.5;1" dur="6.6s" begin="${x < 100 ? -3.3 : x > 250 ? -1.6 : -0.2}s" repeatCount="indefinite"/>` : ''}</path>
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
  // Wiki File:Nightmare_staff_detail.png: asymmetric charcoal fork, chain and open plum pendant.
  // Turn the diagonal detail model upright around its collar before placing it in the glass.
  function nightmareStaff(x, y, scale = 1, tilt = 0) {
    return `<g data-relic="nightmare-staff" transform="translate(${x} ${y}) rotate(${tilt}) scale(${scale})" stroke="#292731" stroke-width="8" stroke-linejoin="round">
      <g transform="rotate(40) translate(-415 -620)">
        <path d="M413 593 L436 611 L622 759 L590 789 L404 635Z" fill="#49464d"/>
        <path d="M422 615 L609 768 L597 777 L414 629Z" fill="#68616a" stroke="none"/>
        <path d="M603 753 L624 749 L713 910 L692 948 L587 787Z" fill="#706d59"/>
        <path d="M603 772 L695 917 L692 936 L591 787Z" fill="#918a6c" stroke="none"/>
        <path d="M713 904 L748 909 L1061 1265 L1023 1306 L687 950Z" fill="#49464d"/>
        <path d="M723 918 L1044 1281 L1030 1287 L702 946Z" fill="#68616a" stroke="none"/>
        <path d="M1008 1257 L1069 1241 L1095 1291 L1069 1337 L1029 1314 L995 1286Z" fill="#67445f"/>
        <path d="M1008 1257 L1069 1241 L1044 1290 L1029 1314 L995 1286Z" fill="#896174" stroke-width="5"/>
        <path d="M1044 1290 L1069 1267 L1086 1291 L1069 1337 L1056 1310Z" fill="#3e3945" stroke-width="5"/>
        <path d="M1068 1324 L1133 1282 L1132 1320 L1240 1512 L1058 1363Z" fill="#55394f"/>
        <path d="M1068 1324 L1133 1282 L1107 1347 L1240 1512 L1080 1360Z" fill="#795269" stroke-width="5"/>
        <path d="M1107 1347 L1132 1320 L1240 1512Z" fill="#3e303e" stroke="none"/>
        <path d="M0 159 L170 219 L173 278 L232 316 L317 243 L367 134 L331 12 L367 0 L501 122 L455 171 L445 339 L398 416 L351 475 L317 543 L268 479 L194 500 L108 537 L132 430 L35 366Z" fill="#514c55"/>
        <path d="M0 159 L119 255 L170 219 L173 278 L232 316 L232 353 L145 323 L82 278 L35 366Z" fill="#6f6871" stroke-width="5"/>
        <path d="M0 159 L35 366 L82 278Z" fill="#3e3a45" stroke-width="5"/>
        <path d="M173 278 L232 316 L317 243 L367 134 L331 12 L367 0 L501 122 L455 171 L409 236 L329 307 L232 353Z" fill="#625c66" stroke-width="5"/>
        <path d="M331 12 L367 0 L501 122 L455 171Z" fill="#777079" stroke-width="5"/>
        <path d="M232 353 L329 307 L445 210 L445 339 L398 416 L351 475 L317 543 L268 479Z" fill="#48444e" stroke-width="5"/>
        <path d="M132 430 L232 353 L268 479 L194 500 L108 537Z" fill="#3c3943" stroke-width="5"/>
        <path d="M232 353 L268 479 L317 543 L336 502 L290 411Z" fill="#615a64" stroke="none"/>
        <path d="M315 540 L344 489 L400 486 L428 504 L424 550 L378 583 L305 599 L280 566Z" fill="#67445f"/>
        <path d="M315 540 L344 489 L400 486 L369 526 L305 570 L280 566Z" fill="#896174" stroke-width="5"/>
        <path d="M369 526 L428 504 L424 550 L378 583 L305 599 L305 570Z" fill="#55394f" stroke-width="5"/>
        <path d="M376 598 L416 549 L453 586 L489 503 L473 545 L528 512 L458 590 L415 640 L342 672 L358 637 L320 638Z" fill="#72506b"/>
        <path d="M376 598 L416 549 L430 592 L415 640 L342 672 L358 637Z" fill="#896174" stroke-width="5"/>
        <path d="M430 592 L489 503 L473 545 L528 512 L458 590 L415 640Z" fill="#55394f" stroke-width="5"/>
        <path d="M490 136 L539 179 L566 225 L558 243 L529 250 L506 221 L477 175Z" fill="#625c66"/>
        <path d="M497 153 L523 180 L550 231" fill="none" stroke="#8a818b" stroke-width="7"/>
        <path d="M555 208 L628 208 L649 279 L603 316 L539 306 L530 249" fill="none" stroke="#3c3943" stroke-width="33"/>
        <path d="M564 211 L626 211 L641 276 L602 309 L546 297 L541 254" fill="none" stroke="#777079" stroke-width="8"/>
        <path d="M627 257 L687 340 L664 385 L637 346 L613 280Z" fill="#625c66"/>
        <path d="M627 257 L673 341 L664 385 L643 350Z" fill="#8a818b" stroke-width="5"/>
        <path d="M637 354 L638 432 L718 455 L729 331 L680 326" fill="none" stroke="#3c3943" stroke-width="29"/>
        <path d="M645 363 L645 425 L712 445 L719 337 L687 332" fill="none" stroke="#777079" stroke-width="7"/>
        <path d="M715 415 L735 392 L743 420 L1015 477 L1034 510 L1005 696 L777 723 L748 686 L688 461 L697 415Z M743 420 L825 590 L935 487Z" fill="#67445f" fill-rule="evenodd"/>
        <path d="M743 420 L825 590 L935 487Z" fill="none" stroke="#896174" stroke-width="7"/>
        <path d="M697 415 L715 415 L825 590 L748 648 L688 461Z" fill="#795269" stroke-width="5"/>
        <path d="M743 420 L1015 477 L1034 510 L935 487Z" fill="#896174" stroke-width="5"/>
        <path d="M935 487 L1034 510 L1005 696 L908 620 L748 648Z" fill="#514c55" stroke-width="5"/>
        <path d="M748 648 L908 620 L1005 696 L777 723 L748 686Z" fill="#3e303e" stroke-width="5"/>
        <path d="M825 590 L748 648 L908 620 L935 487Z" fill="#6c5766" stroke-width="5"/>
        <path d="M315 540 L369 526 M359 633 L397 612 M1091 1336 L1107 1347" fill="none" stroke="#a28a9d" stroke-width="6"/>
      </g>
    </g>`;
  }
  // Wiki File:Sleepwalker_(Phosani's_Nightmare).png: steel helm, quilted hauberk, oxblood skirt.
  function inquisitorSleepwalker(x, y, scale = 1, facing = 1, tilt = 0, animated = false) {
    return `<g data-sleepwalker="true" data-walker-kind="inquisitor" transform="translate(${x} ${y}) rotate(${tilt}) scale(${scale * facing} ${scale})" stroke="#302b33" stroke-width="1.8" stroke-linejoin="round">
      <path d="M-17 115 L-4 117 L-9 145 L-15 157 L-32 164 L-36 159 L-22 144Z" fill="#493738">${animated ? `<animate attributeName="d" values="M-17 115 L-4 117 L-9 145 L-15 157 L-32 164 L-36 159 L-22 144Z;M -17 115 L -4.37 116.86 L -14.51 142.86 L -22.71 154 L -41 160.5 L -44.08 155.86 L -27.33 141.93 Z;M-17 115 L-4 117 L-9 145 L-15 157 L-32 164 L-36 159 L-22 144Z;M -17 115 L -3.63 117.14 L -3.49 147.14 L -7.29 160 L -23 167.5 L -27.92 162.14 L -16.67 146.07 Z;M-17 115 L-4 117 L-9 145 L-15 157 L-32 164 L-36 159 L-22 144Z" keyTimes="0;.25;.5;.75;1" dur="5.6s" begin="-1.6s" repeatCount="indefinite"/>` : ''}</path>
      <path d="M6 114 L20 112 L23 143 L17 155 L6 153 L11 140Z" fill="#59403e">${animated ? `<animate attributeName="d" values="M6 114 L20 112 L23 143 L17 155 L6 153 L11 140Z;M 6 114 L 20 112 L 28.14 145 L 24.35 157.86 L 12.98 155.71 L 15.59 141.79 Z;M6 114 L20 112 L23 143 L17 155 L6 153 L11 140Z;M 6 114 L 20 112 L 17.86 141 L 9.65 152.14 L -0.98 150.29 L 6.41 138.21 Z;M6 114 L20 112 L23 143 L17 155 L6 153 L11 140Z" keyTimes="0;.25;.5;.75;1" dur="5.6s" begin="-1.6s" repeatCount="indefinite"/>` : ''}</path>
      <path d="M-22 144 L-15 150 L-19 157 L-32 161 M13 140 L19 145 L14 151" fill="none" stroke="#77524b" stroke-width="1.3">${animated ? `<animate attributeName="d" values="M-22 144 L-15 150 L-19 157 L-32 161 M13 140 L19 145 L14 151;M -27.33 141.93 L -21.43 147.5 L -26.71 154 L -40.45 157.71 M 17.59 141.79 L 24.51 147.14 L 20.61 153.57;M-22 144 L-15 150 L-19 157 L-32 161 M13 140 L19 145 L14 151;M -16.67 146.07 L -8.57 152.5 L -11.29 160 L -23.55 164.29 M 8.41 138.21 L 13.49 142.86 L 7.39 148.43;M-22 144 L-15 150 L-19 157 L-32 161 M13 140 L19 145 L14 151" keyTimes="0;.25;.5;.75;1" dur="5.6s" begin="-1.6s" repeatCount="indefinite"/>` : ''}</path>
      <path d="M-20 52 L18 51 L33 118 L18 125 L-10 126 L-32 118Z" fill="#69583f">${animated ? `<animate attributeName="d" values="M-20 52 L18 51 L33 118 L18 125 L-10 126 L-32 118Z;M -20 52 L 18 51 L 33.55 118.21 L 19.84 125.71 L -12.02 125.21 L -32.55 117.79 Z;M-20 52 L18 51 L33 118 L18 125 L-10 126 L-32 118Z;M -20 52 L 18 51 L 32.45 117.79 L 16.16 124.29 L -7.98 126.79 L -31.45 118.21 Z;M-20 52 L18 51 L33 118 L18 125 L-10 126 L-32 118Z" keyTimes="0;.25;.5;.75;1" dur="5.6s" begin="-1.6s" repeatCount="indefinite"/>` : ''}</path>
      <path d="M-10 56 L10 54 L22 122 L-13 128 L-28 119Z" fill="#874c51">${animated ? `<animate attributeName="d" values="M-10 56 L10 54 L22 122 L-13 128 L-28 119Z;M -10 56 L 10 54 L 23.29 122.5 L -15.39 127.07 L -28.73 118.71 Z;M-10 56 L10 54 L22 122 L-13 128 L-28 119Z;M -10 56 L 10 54 L 20.71 121.5 L -10.61 128.93 L -27.27 119.29 Z;M-10 56 L10 54 L22 122 L-13 128 L-28 119Z" keyTimes="0;.25;.5;.75;1" dur="5.6s" begin="-1.6s" repeatCount="indefinite"/>` : ''}</path>
      <path d="M-7 65 L3 59 L8 93 L-13 126 L-26 117Z" fill="#a26165" stroke="none">${animated ? `<animate attributeName="d" values="M-7 65 L3 59 L8 93 L-13 126 L-26 117Z;M -7 65 L 3 59 L 8 93 L -15.02 125.21 L -26.37 116.86 Z;M-7 65 L3 59 L8 93 L-13 126 L-26 117Z;M -7 65 L 3 59 L 8 93 L -10.98 126.79 L -25.63 117.14 Z;M-7 65 L3 59 L8 93 L-13 126 L-26 117Z" keyTimes="0;.25;.5;.75;1" dur="5.6s" begin="-1.6s" repeatCount="indefinite"/>` : ''}</path>
      <path d="M3 59 L10 54 L22 122 L8 125 L8 93Z" fill="#673f46" stroke="none">${animated ? `<animate attributeName="d" values="M3 59 L10 54 L22 122 L8 125 L8 93Z;M 3 59 L 10 54 L 23.29 122.5 L 9.84 125.71 L 8 93 Z;M3 59 L10 54 L22 122 L8 125 L8 93Z;M 3 59 L 10 54 L 20.71 121.5 L 6.16 124.29 L 8 93 Z;M3 59 L10 54 L22 122 L8 125 L8 93Z" keyTimes="0;.25;.5;.75;1" dur="5.6s" begin="-1.6s" repeatCount="indefinite"/>` : ''}</path>
      <path d="M-22 54 L-14 63 L-16 82 L-27 87 L-31 72Z M18 53 L29 59 L31 77 L20 84 L14 67Z" fill="#93949a"/>
      <path d="M-27 83 L-16 80 L-18 97 L-31 101 L-34 94Z M21 80 L32 75 L35 95 L23 101 L19 92Z" fill="#717a84"/>
      <path d="M-31 98 L-18 95 L-20 111 L-33 117 L-36 108Z M24 98 L35 93 L38 113 L27 121 L23 110Z" fill="#515c68"/>
      <path d="M-15 1 L-28 6 L-32 35 L-25 49 L-17 45 L-18 24Z M16 1 L29 8 L33 34 L27 46 L17 42 L19 22Z" fill="#8e555a"/>
      <path d="M-27 43 L-17 45 L-19 72 L-25 79 L-34 72Z M18 40 L29 43 L36 70 L29 77 L20 69Z" fill="#6e7781"/>
      <path d="M-29 48 L-19 49 L-20 56 L-31 58Z M22 46 L31 47 L33 55 L23 54Z" fill="#a1a0a1" stroke-width="1.1"/>
      <path d="M-25 73 L-19 73 L-18 82 L-23 88 L-30 84 L-32 79Z M29 70 L35 72 L37 80 L32 88 L25 85 L24 80Z" fill="#5a403e"/>
      <path d="M-17 3 L3 8 L20 3 L22 28 L15 55 L-3 62 L-20 54 L-24 27Z" fill="#69573f"/>
      <g stroke="#4f4233" stroke-width="1.1">
        <path d="M-13 12 L-2 19 L-13 28 L-23 20Z M-2 19 L8 12 L20 19 L10 28Z M-13 28 L-2 19 L10 28 L-1 38Z" fill="#8c7551"/>
        <path d="M-13 28 L-1 38 L-12 48 L-21 39Z M10 28 L20 35 L15 49 L-1 38Z" fill="#544534"/>
        <path d="M-12 48 L-1 38 L15 49 L-3 58Z" fill="#826e4d"/>
      </g>
      <path d="M-20 9 L-6 14 L17 13" fill="none" stroke="#493537" stroke-width="5"/>
      <path d="M-9 9 L-1 10 L-3 18 L-11 16Z" fill="#a29c8c" stroke-width="1"/>
      <path d="M-6 11 L-3 12 L-4 15 L-8 14Z" fill="#493d39" stroke="none"/>
      <path d="M-15 -7 L9 -7 L16 5 L2 10 L-19 2Z" fill="#8b4d53"/>
      <path d="M-18 2 L-30 -2 L-39 9 L-36 25 L-24 30 L-13 20Z M17 1 L30 -1 L42 12 L39 27 L25 33 L15 20Z" fill="#93949a"/>
      <path d="M-30 -2 L-18 2 L-23 16 L-38 10Z M30 -1 L42 12 L27 17 L17 1Z" fill="#b6b3b1" stroke-width="1.2"/>
      <path d="M-36 19 L-24 23 L-24 30 L-36 25Z M27 23 L40 18 L39 27 L25 33Z" fill="#626e7b"/>
      <path d="M-21 54 L-12 51 L-4 56 L4 51 L14 54 L12 63 L3 60 L-4 66 L-11 58 L-20 62Z" fill="#954f55" stroke-width="1.2"/>
      <path d="M-16 -35 L-20 -47 L-12 -44 L-7 -51 L-2 -42 L5 -49 L10 -40 L18 -46 L23 -34 L20 -18 L10 -7 L-2 -5 L-17 -14 L-22 -27Z" fill="#8c8d94"/>
      <path d="M-16 -35 L-20 -47 L-12 -44 L-7 -51 L-6 -35 L-15 -29Z M-6 -35 L5 -49 L3 -31 L-5 -25Z M10 -40 L18 -46 L15 -31 L7 -24Z" fill="#b6b3b1" stroke-width="1.1"/>
      <path d="M-22 -27 L-5 -24 L20 -32 L20 -18 L-2 -5 L-17 -14Z" fill="#747681"/>
      <path d="M-5 -24 L20 -32 L20 -18 L-2 -5Z" fill="#535c68" stroke="none"/>
      <path d="M-18 -30 L-10 -28 L-11 -24 L-18 -26Z M-5 -28 L10 -33 L8 -28 L-5 -24Z" fill="#242932" stroke-width=".9"/>
      <path d="M-7 -27 L-12 -17 L-4 -16" fill="none" stroke="#b5b5b5" stroke-width="1.3"/>
      <path d="M-20 -17 L-14 -11 M-30 9 L-25 13 M30 8 L35 12 M-20 92 L-28 94 M25 91 L30 89" fill="none" stroke="#b7a2a4" stroke-width="1.1"/>
    </g>`;
  }
  // Wiki Sleepwalker (1), (3) and (5): long coat, shaggy beard and apron dress.
  function citizenSleepwalker(kind, x, y, scale = 1, facing = 1, tilt = 0, animated = false) {
    const dress = kind === 'dress';
    const coat = kind === 'coat';
    const legs = dress
      ? `<path d="M-22 141 L-7 142 L-11 155 L-27 163 L-34 159 L-26 152Z M12 141 L25 140 L28 156 L19 161 L8 157 L13 151Z" fill="#493a3c">${animated ? `<animate attributeName="d" values="M-22 141 L-7 142 L-11 155 L-27 163 L-34 159 L-26 152Z M12 141 L25 140 L28 156 L19 161 L8 157 L13 151Z;M -29.29 138.17 L -14.37 139.13 L -19.49 151.7 L -36 159.5 L -42.83 155.57 L -34.23 148.8 Z M 19.29 143.83 L 32.2 142.8 L 36.57 159.33 L 28 164.5 L 16.66 160.37 L 21.14 154.17 Z;M-22 141 L-7 142 L-11 155 L-27 163 L-34 159 L-26 152Z M12 141 L25 140 L28 156 L19 161 L8 157 L13 151Z;M -14.71 143.83 L 0.37 144.87 L -2.51 158.3 L -18 166.5 L -25.17 162.43 L -17.77 155.2 Z M 4.71 138.17 L 17.8 137.2 L 19.43 152.67 L 10 157.5 L -0.66 153.63 L 4.86 147.83 Z;M-22 141 L-7 142 L-11 155 L-27 163 L-34 159 L-26 152Z M12 141 L25 140 L28 156 L19 161 L8 157 L13 151Z" keyTimes="0;.25;.5;.75;1" dur="5.6s" begin="${x < 100 ? -1.2 : x > 250 ? -2.6 : -0.3}s" repeatCount="indefinite"/>` : ''}</path>`
      : `<path d="M-19 56 L1 61 L-6 109 L-16 135 L-31 128 L-29 102Z" fill="#6f6872">${animated ? `<animate attributeName="d" values="M-19 56 L1 61 L-6 109 L-16 135 L-31 128 L-29 102Z;M -19 56 L 1.43 61.17 L -10.54 107.23 L -22.77 132.37 L -37.17 125.6 L -32.94 100.47 Z;M-19 56 L1 61 L-6 109 L-16 135 L-31 128 L-29 102Z;M -19 56 L 0.57 60.83 L -1.46 110.77 L -9.23 137.63 L -24.83 130.4 L -25.06 103.53 Z;M-19 56 L1 61 L-6 109 L-16 135 L-31 128 L-29 102Z" keyTimes="0;.25;.5;.75;1" dur="5.6s" begin="${x < 100 ? -1.2 : x > 250 ? -2.6 : -0.3}s" repeatCount="indefinite"/>` : ''}</path>
        <path d="M1 61 L21 55 L29 110 L23 135 L10 131 L5 104Z" fill="#837b81">${animated ? `<animate attributeName="d" values="M1 61 L21 55 L29 110 L23 135 L10 131 L5 104Z;M 1.43 61.17 L 21 55 L 33.63 111.8 L 29.77 137.63 L 16.43 133.5 L 9.11 105.6 Z;M1 61 L21 55 L29 110 L23 135 L10 131 L5 104Z;M 0.57 60.83 L 21 55 L 24.37 108.2 L 16.23 132.37 L 3.57 128.5 L 0.89 102.4 Z;M1 61 L21 55 L29 110 L23 135 L10 131 L5 104Z" keyTimes="0;.25;.5;.75;1" dur="5.6s" begin="${x < 100 ? -1.2 : x > 250 ? -2.6 : -0.3}s" repeatCount="indefinite"/>` : ''}</path>
        <path d="M-19 66 L-11 84 L-19 112 L-27 123 L-29 102Z M6 72 L16 88 L23 126 L11 126 L5 104Z" fill="#57515d" stroke="none">${animated ? `<animate attributeName="d" values="M-19 66 L-11 84 L-19 112 L-27 123 L-29 102Z M6 72 L16 88 L23 126 L11 126 L5 104Z;M -19.86 65.67 L -13.4 83.07 L -23.8 110.13 L -32.74 120.77 L -32.94 100.47 Z M 7.37 72.53 L 18.74 89.07 L 29 128.33 L 17 128.33 L 9.11 105.6 Z;M-19 66 L-11 84 L-19 112 L-27 123 L-29 102Z M6 72 L16 88 L23 126 L11 126 L5 104Z;M -18.14 66.33 L -8.6 84.93 L -14.2 113.87 L -21.26 125.23 L -25.06 103.53 Z M 4.63 71.47 L 13.26 86.93 L 17 123.67 L 5 123.67 L 0.89 102.4 Z;M-19 66 L-11 84 L-19 112 L-27 123 L-29 102Z M6 72 L16 88 L23 126 L11 126 L5 104Z" keyTimes="0;.25;.5;.75;1" dur="5.6s" begin="${x < 100 ? -1.2 : x > 250 ? -2.6 : -0.3}s" repeatCount="indefinite"/>` : ''}</path>
        <path d="M-31 128 L-16 135 L-18 151 L-29 164 L-39 159 L-28 146Z M10 131 L23 135 L29 150 L22 159 L8 161 L4 156 L14 146Z" fill="#493a3c">${animated ? `<animate attributeName="d" values="M-31 128 L-16 135 L-18 151 L-29 164 L-39 159 L-28 146Z M10 131 L23 135 L29 150 L22 159 L8 161 L4 156 L14 146Z;M -37.17 125.6 L -22.77 132.37 L -26.14 147.83 L -38 160.5 L -47.83 155.57 L -35.71 143 Z M 16.43 133.5 L 29.77 137.63 L 37.06 153.13 L 30.83 162.43 L 17 164.5 L 12.57 159.33 L 21.71 149 Z;M-31 128 L-16 135 L-18 151 L-29 164 L-39 159 L-28 146Z M10 131 L23 135 L29 150 L22 159 L8 161 L4 156 L14 146Z;M -24.83 130.4 L -9.23 137.63 L -9.86 154.17 L -20 167.5 L -30.17 162.43 L -20.29 149 Z M 3.57 128.5 L 16.23 132.37 L 20.94 146.87 L 13.17 155.57 L -1 157.5 L -4.57 152.67 L 6.29 143 Z;M-31 128 L-16 135 L-18 151 L-29 164 L-39 159 L-28 146Z M10 131 L23 135 L29 150 L22 159 L8 161 L4 156 L14 146Z" keyTimes="0;.25;.5;.75;1" dur="5.6s" begin="${x < 100 ? -1.2 : x > 250 ? -2.6 : -0.3}s" repeatCount="indefinite"/>` : ''}</path>
        <path d="M-29 133 L-23 140 L-29 151 M16 135 L21 145 L17 153" fill="none" stroke="#655055" stroke-width="1.2">${animated ? `<animate attributeName="d" values="M-29 133 L-23 140 L-29 151 M16 135 L21 145 L17 153;M -35.6 130.43 L -30.2 137.2 L -37.14 147.83 M 22.77 137.63 L 28.63 147.97 L 25.31 156.23;M-29 133 L-23 140 L-29 151 M16 135 L21 145 L17 153;M -22.4 135.57 L -15.8 142.8 L -20.86 154.17 M 9.23 132.37 L 13.37 142.03 L 8.69 149.77;M-29 133 L-23 140 L-29 151 M16 135 L21 145 L17 153" keyTimes="0;.25;.5;.75;1" dur="5.6s" begin="${x < 100 ? -1.2 : x > 250 ? -2.6 : -0.3}s" repeatCount="indefinite"/>` : ''}</path>`;
    const clothes = dress
      ? `<path d="M-19 49 L17 49 L25 84 L41 143 L27 152 L-15 155 L-40 145 L-29 96Z" fill="#a3aa9e">${animated ? `<animate attributeName="d" values="M-19 49 L17 49 L25 84 L41 143 L27 152 L-15 155 L-40 145 L-29 96Z;M -19 49 L 17 49 L 25.83 84 L 45.35 143 L 31.88 152 L -10 155 L -35.54 145 L -27.45 96 Z;M-19 49 L17 49 L25 84 L41 143 L27 152 L-15 155 L-40 145 L-29 96Z;M -19 49 L 17 49 L 24.17 84 L 36.65 143 L 22.12 152 L -20 155 L -44.46 145 L -30.55 96 Z;M-19 49 L17 49 L25 84 L41 143 L27 152 L-15 155 L-40 145 L-29 96Z" keyTimes="0;.25;.5;.75;1" dur="5.6s" begin="${x < 100 ? -1.2 : x > 250 ? -2.6 : -0.3}s" repeatCount="indefinite"/>` : ''}</path>
        <path d="M-8 58 L3 67 L-15 155 L-36 146 L-24 116Z" fill="#b8bca9" stroke="none">${animated ? `<animate attributeName="d" values="M-8 58 L3 67 L-15 155 L-36 146 L-24 116Z;M -8 58 L 3 67 L -10 155 L -31.48 146 L -21.26 116 Z;M-8 58 L3 67 L-15 155 L-36 146 L-24 116Z;M -8 58 L 3 67 L -20 155 L -40.52 146 L -26.74 116 Z;M-8 58 L3 67 L-15 155 L-36 146 L-24 116Z" keyTimes="0;.25;.5;.75;1" dur="5.6s" begin="${x < 100 ? -1.2 : x > 250 ? -2.6 : -0.3}s" repeatCount="indefinite"/>` : ''}</path>
        <path d="M3 67 L17 49 L25 84 L41 143 L27 152 L18 123Z" fill="#7c8580" stroke="none">${animated ? `<animate attributeName="d" values="M3 67 L17 49 L25 84 L41 143 L27 152 L18 123Z;M 3 67 L 17 49 L 25.83 84 L 45.35 143 L 31.88 152 L 21.15 123 Z;M3 67 L17 49 L25 84 L41 143 L27 152 L18 123Z;M 3 67 L 17 49 L 24.17 84 L 36.65 143 L 22.12 152 L 14.85 123 Z;M3 67 L17 49 L25 84 L41 143 L27 152 L18 123Z" keyTimes="0;.25;.5;.75;1" dur="5.6s" begin="${x < 100 ? -1.2 : x > 250 ? -2.6 : -0.3}s" repeatCount="indefinite"/>` : ''}</path>
        <path d="M-19 3 L-30 7 L-35 38 L-23 50 L-13 38Z M18 3 L29 8 L35 39 L23 49 L13 36Z" fill="#65535d"/>
        <path d="M-27 13 L-22 25 L-31 33 M26 17 L20 29 L31 36" fill="none" stroke="#8a7881" stroke-width="2"/>
        <path d="M-19 1 L-6 5 L1 15 L14 1 L24 13 L18 38 L7 47 L-8 45 L-24 33Z" fill="#a3aa9e"/>
        <path d="M-6 5 L-9 20 L-1 29 L10 18 L14 1 L6 7 L1 15Z" fill="#594954"/>
        <path d="M-23 34 L-8 39 L1 49 L-12 56 L-25 48Z M18 35 L8 40 L1 49 L13 56 L24 47Z" fill="#71616c"/>
        <path d="M-21 57 L17 59" stroke="#51464f" stroke-width="4"/>
        <path d="M0 62 L-4 77 L4 82 L3 65Z" fill="#71616c" stroke-width="1.1">${animated ? `<animate attributeName="d" values="M0 62 L-4 77 L4 82 L3 65Z;M 0 62 L -3.58 77 L 4.71 82 L 3 65 Z;M0 62 L-4 77 L4 82 L3 65Z;M 0 62 L -4.42 77 L 3.29 82 L 3 65 Z;M0 62 L-4 77 L4 82 L3 65Z" keyTimes="0;.25;.5;.75;1" dur="5.6s" begin="${x < 100 ? -1.2 : x > 250 ? -2.6 : -0.3}s" repeatCount="indefinite"/>` : ''}</path>`
      : `<path d="M-21 2 L-30 8 L-34 35 L-29 57 L-18 54 L-17 30Z M19 1 L30 8 L35 37 L31 60 L19 57 L18 31Z" fill="#939b93"/>
        <path d="M-30 9 L-21 3 L-22 32 L-28 44 L-33 36Z M23 10 L30 8 L35 37 L31 60 L26 57 L28 32Z" fill="#b0b4a4" stroke="none"/>
        <path d="M-19 1 L-7 -3 L12 -1 L23 9 L20 48 L12 60 L-2 63 L-21 53 L-24 20Z" fill="#a3aa9e"/>
        <path d="M-19 4 L-8 1 L-3 39 L-9 56 L-21 53 L-24 20Z" fill="#b8bca9" stroke="none"/>
        <path d="M12 2 L23 9 L20 48 L12 60 L4 59 L10 36Z" fill="#7c8580" stroke="none"/>
        ${
          coat
            ? `<path d="M-22 1 L-11 -1 L-8 54 L-15 121 L-31 113 L-25 83 L-20 52Z M11 0 L24 5 L20 53 L31 117 L12 124 L4 58Z" fill="#51484d">${animated ? `<animate attributeName="d" values="M-22 1 L-11 -1 L-8 54 L-15 121 L-31 113 L-25 83 L-20 52Z M11 0 L24 5 L20 53 L31 117 L12 124 L4 58Z;M -22 1 L -11 -1 L -8 54 L -11.96 121 L -28.44 113 L -24.23 83 L -20 52 Z M 11 0 L 24 5 L 20 53 L 33.8 117 L 15.21 124 L 4 58 Z;M-22 1 L-11 -1 L-8 54 L-15 121 L-31 113 L-25 83 L-20 52Z M11 0 L24 5 L20 53 L31 117 L12 124 L4 58Z;M -22 1 L -11 -1 L -8 54 L -18.04 121 L -33.56 113 L -25.77 83 L -20 52 Z M 11 0 L 24 5 L 20 53 L 28.2 117 L 8.79 124 L 4 58 Z;M-22 1 L-11 -1 L-8 54 L-15 121 L-31 113 L-25 83 L-20 52Z M11 0 L24 5 L20 53 L31 117 L12 124 L4 58Z" keyTimes="0;.25;.5;.75;1" dur="5.6s" begin="${x < 100 ? -1.2 : x > 250 ? -2.6 : -0.3}s" repeatCount="indefinite"/>` : ''}</path>
          <path d="M-16 3 L-12 2 L-11 54 L-21 117 M17 6 L12 55 L20 120" fill="none" stroke="#776269" stroke-width="3">${animated ? `<animate attributeName="d" values="M-16 3 L-12 2 L-11 54 L-21 117 M17 6 L12 55 L20 120;M -16 3 L -12 2 L -11 54 L -18.2 117 M 17 6 L 12 55 L 22.98 120;M-16 3 L-12 2 L-11 54 L-21 117 M17 6 L12 55 L20 120;M -16 3 L -12 2 L -11 54 L -23.8 117 M 17 6 L 12 55 L 17.02 120;M-16 3 L-12 2 L-11 54 L-21 117 M17 6 L12 55 L20 120" keyTimes="0;.25;.5;.75;1" dur="5.6s" begin="${x < 100 ? -1.2 : x > 250 ? -2.6 : -0.3}s" repeatCount="indefinite"/>` : ''}</path>
          <path d="M-10 58 L6 60" stroke="#493a3c" stroke-width="4"/>`
            : `<path d="M-20 55 L-3 57 L14 53 L20 56 L15 63 L-6 62 L-20 59Z" fill="#51464f"/>`
        }`;
    const hair = coat
      ? `<path d="M9 -45 L19 -37 L21 -22 L15 -10 L8 -6 L10 -22 L6 -31Z M-18 -39 L-22 -28 L-21 -16 L-16 -19 L-14 -31Z" fill="#51484d"/>`
      : dress
        ? `<path d="M-18 -34 L-16 -44 L-4 -50 L10 -47 L21 -34 L17 -16 L19 13 L10 6 L8 -21Z M-17 -28 L-18 5 L-25 10 L-21 -17Z" fill="#51484d"/>
          <path d="M-19 -37 L3 -40 L18 -34 L15 -28 L-20 -30Z" fill="#a3aa9e" stroke-width="1.2"/>`
        : `<path d="M-22 -25 L-20 -41 L-7 -51 L10 -47 L22 -36 L19 -14 L10 -8 L6 -32 L1 -20 L-4 -32 L-10 -24 L-13 -34Z" fill="#51484d"/>
          <path d="M-8 -18 L4 -19 L13 -10 L3 19 L-7 16 L-10 -1Z" fill="#51484d"/>
          <path d="M-3 -11 L-1 9 M3 -9 L2 5" fill="none" stroke="#776269" stroke-width="1.2"/>`;
    return `<g data-sleepwalker="true" data-walker-kind="${kind}" transform="translate(${x} ${y}) rotate(${tilt}) scale(${scale * facing} ${scale})" stroke="#302b33" stroke-width="1.8" stroke-linejoin="round">
      ${legs}${clothes}
      <path d="M-30 ${dress ? 42 : 55} L-21 ${dress ? 44 : 57} L-23 72 L-28 79 L-34 72Z M22 ${dress ? 43 : 57} L32 ${dress ? 41 : 59} L34 74 L29 81 L23 74Z" fill="#939b93"/>
      <path d="M-28 73 L-23 73 L-20 82 L-27 89 L-35 84 L-34 78Z M29 76 L34 76 L38 84 L33 92 L24 88 L24 82Z" fill="#c2c3a2"/>
      <path d="M-9 -14 L8 -14 L12 0 L4 12 L-11 2Z" fill="#adb194"/>
      <path d="M-17 -40 L-4 -49 L9 -44 L19 -33 L16 -16 L5 -6 L-7 -10 L-19 -27Z" fill="#c2c3a2"/>
      <path d="M-4 -49 L9 -44 L19 -33 L16 -16 L5 -6 L1 -18 L6 -32Z" fill="#999f87" stroke="none"/>
      <path d="M-18 -30 L-11 -27 L-5 -29 M1 -29 L9 -27 L14 -30" fill="none" stroke="#737e70" stroke-width="1.5"/>
      <path d="M-6 -28 L-10 -20 L-4 -18 M-8 -13 L0 -12" fill="none" stroke="#737e70" stroke-width="1.2"/>
      ${hair}
    </g>`;
  }
  const walkerKinds = ['coat', 'beard', 'dress', 'inquisitor'];
  function sleepwalker(x, y, scale, facing, tilt, kind = 'inquisitor', animated = false) {
    return kind === 'inquisitor'
      ? inquisitorSleepwalker(x, y, scale, facing, tilt, animated)
      : citizenSleepwalker(kind, x, y, scale, facing, tilt, animated);
  }
  function frameOrnaments(count, index, uid, celebrate, { anchors, crownY }) {
    const colors = sceneColors(index),
      scene = sceneNumber(index),
      completed = Math.floor(count / 25);
    return anchors
      .map(([x, y], i) => {
        const lit = i < completed,
          fresh = celebrate && lit && (count === 100 || completed === i + 1);
        if (!lit) return `<circle cx="${x}" cy="${y}" r="4" fill="#332b22" stroke="#6e5c43"/>`;
        const side = i % 2 === 0 ? -1 : 1;
        let motif = '';
        if (scene === 0)
          motif = `<g transform="translate(${x} ${y - 9}) scale(.42)">${shrineCarving()}</g>`;
        if (scene === 4)
          motif = `<path d="M${x} ${y} Q${x + side * 8} ${crownY + 77} 180 ${crownY}" fill="none" stroke="#73e4b6" stroke-width="3"/><path d="M${x} ${y - 11} l8 11 -8 11 -8 -11Z" fill="#73e4b6" stroke="#a9edc5"/><path d="M180 ${crownY - 12} l8 12 -8 12 -8 -12Z" fill="#73e4b6" stroke="#a9edc5"/>`;
        if (scene === 1)
          motif = `<g transform="translate(${x} ${y})" stroke="#342e38" stroke-width="1.5"><path d="M-11 -8 L-11 -20 L-4 -14 L0 -23 L5 -14 L11 -20 L12 -7 L9 11 L0 19 L-9 11Z" fill="#93939b"/><path d="M-9 -1 L-2 2 M3 2 L10 -1" stroke="#282e37" stroke-width="2.5"/><path d="M0 4 V12" stroke="#c1b7b2"/></g>`;
        if (scene === 3)
          motif = `<ellipse cx="${x}" cy="${y + 16}" rx="16" ry="5" fill="#11141e" stroke="#82708b" stroke-width="1.5"/>${graspingHand(x, y + 15, 0.17, -side)}`;
        if (scene === 5)
          motif = `<path d="M${x} ${y + 33} q${side * 13} 24 0 46" fill="none" stroke="${colors[4]}" stroke-width="2" stroke-dasharray="3 5"/>${sleepwalker(x, y - 9, 0.25, side, 0, walkerKinds[i])}`;
        if (scene === 2) {
          const glow = ['#73b85b', '#669ee9', '#eb9645', '#c6b4d1'][i];
          motif =
            i === 3
              ? nightmareStaff(x - 7, y - 4, 0.028, -8)
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
    <path d="M139 210 L164 187 L185 190 L205 211 L203 230 L190 226 L180 206 L158 208 L142 225 L131 267 L132 302 L121 273 L127 234Z" fill="#aeb7c4">${sceneNumber(index) === 0 ? `<animate attributeName="d" values="M139 210 L164 187 L185 190 L205 211 L203 230 L190 226 L180 206 L158 208 L142 225 L131 267 L132 302 L121 273 L127 234Z;M 139 210 L 164 187 L 185 190 L 205 211 L 204.2 230 L 189.52 226 L 180 206 L 158 208 L 141.4 225 L 125.36 267 L 122.16 302 L 114.64 273 L 125.32 234 Z;M139 210 L164 187 L185 190 L205 211 L203 230 L190 226 L180 206 L158 208 L142 225 L131 267 L132 302 L121 273 L127 234Z" keyTimes="0;.5;1" dur="6.2s" begin="-0.6s" repeatCount="indefinite"/>` : ''}</path>
    <path d="M164 189 L153 211 L139 221 L143 235 L130 285 L132 315 L120 277 L125 235 L138 213Z" fill="#c1c9d1" stroke-width="1.4">${sceneNumber(index) === 0 ? `<animate attributeName="d" values="M164 189 L153 211 L139 221 L143 235 L130 285 L132 315 L120 277 L125 235 L138 213Z;M 164 189 L 153 211 L 138.88 221 L 141.2 235 L 122.2 285 L 120.6 315 L 113.16 277 L 123.2 235 L 138 213 Z;M164 189 L153 211 L139 221 L143 235 L130 285 L132 315 L120 277 L125 235 L138 213Z" keyTimes="0;.5;1" dur="6.2s" begin="-0.6s" repeatCount="indefinite"/>` : ''}</path>
    <path d="M179 198 L193 207 L184 219 L191 244 L177 303 L174 274 L171 237 L161 218Z" fill="#d1d4d8" stroke-width="1.4">${sceneNumber(index) === 0 ? `<animate attributeName="d" values="M179 198 L193 207 L184 219 L191 244 L177 303 L174 274 L171 237 L161 218Z;M 179 198 L 193 207 L 184 219 L 193.88 244 L 170.36 303 L 169.68 274 L 169.64 237 L 161 218 Z;M179 198 L193 207 L184 219 L191 244 L177 303 L174 274 L171 237 L161 218Z" keyTimes="0;.5;1" dur="6.2s" begin="-0.6s" repeatCount="indefinite"/>` : ''}</path>
    <path d="M192 211 L203 220 L206 253 L217 322 L202 293 L191 250 L183 223Z" fill="#b5bcc8" stroke-width="1.4">${sceneNumber(index) === 0 ? `<animate attributeName="d" values="M192 211 L203 220 L206 253 L217 322 L202 293 L191 250 L183 223Z;M 192 211 L 203 220 L 209.96 253 L 229 322 L 210.76 293 L 194.6 250 L 182.76 223 Z;M192 211 L203 220 L206 253 L217 322 L202 293 L191 250 L183 223Z" keyTimes="0;.5;1" dur="6.2s" begin="-0.6s" repeatCount="indefinite"/>` : ''}</path>
    <path d="M140 215 L133 238 L127 273 M181 227 L184 248 L179 280 M197 240 L207 291" fill="none" stroke="#8b99ad" stroke-width="1.2">${sceneNumber(index) === 0 ? `<animate attributeName="d" values="M140 215 L133 238 L127 273 M181 227 L184 248 L179 280 M197 240 L207 291;M 140 215 L 130.84 238 L 120.64 273 M 180.44 227 L 181.76 248 L 174.2 280 M 199.4 240 L 215.52 291;M140 215 L133 238 L127 273 M181 227 L184 248 L179 280 M197 240 L207 291" keyTimes="0;.5;1" dur="6.2s" begin="-0.6s" repeatCount="indefinite"/>` : ''}</path>
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
      const runes = Array.from({ length: 12 }, (_, i) => {
        const angle = (i * Math.PI) / 6;
        return `<path transform="translate(${180 + Math.cos(angle) * 115} ${361 + Math.sin(angle) * 49}) rotate(${i * 30})" d="M-4 -3 L4 -7 L-2 4" fill="none" stroke="#8b9c8d" stroke-width="1.5"/>`;
      }).join('');
      const chargeTraces = [
        [118, 187],
        [242, 187],
        [251, 393],
        [109, 393],
      ]
        .map(
          ([x, y], i) =>
            `<path class="nightmare-charge-trace" style="--charge-phase:-${i * 1.2}s" d="M${x} ${y} L180 322" fill="none" stroke="#c0f3d3" stroke-width="3" stroke-linecap="round" pathLength="100" stroke-dasharray="9 300" opacity=".7"/>`
        )
        .join('');
      const pillars = `${panes}
    <style>
      .nightmare-totem-live .nightmare-totem-eye { animation: nightmare-totem-charge 4.8s linear infinite; animation-delay: var(--totem-phase); }
      .nightmare-totem-live .nightmare-totem-energy { animation: nightmare-totem-ribbons 4.8s linear infinite; animation-delay: var(--totem-phase); }
      .nightmare-charge-trace { animation: nightmare-charge-travel 4.8s linear infinite; animation-delay: var(--charge-phase); }
      .nightmare-heart { animation: nightmare-heart-light 4.8s linear infinite; }
      @keyframes nightmare-totem-charge { 0%, 45%, 100% { fill: #31775a; } 16% { fill: #c0ffdd; } }
      @keyframes nightmare-totem-ribbons { 0%, 45%, 100% { opacity: .15; } 16% { opacity: 1; } }
      @keyframes nightmare-charge-travel { 0% { stroke-dashoffset: 109; } 36%, 100% { stroke-dashoffset: -100; } }
      @keyframes nightmare-heart-light { 0%, 100% { fill: #559f82; } 50% { fill: #bcffde; } }
      @media (prefers-reduced-motion: reduce) {
        .nightmare-totem-live .nightmare-totem-eye, .nightmare-totem-live .nightmare-totem-energy, .nightmare-charge-trace, .nightmare-heart { animation: none; }
        .nightmare-charge-trace { opacity: 0; }
      }
    </style>
    <path d="M180 44 L320 211 V550 H40 V211Z" fill="#172d40"/>
    <path d="M62 550 V224 Q62 139 180 74 Q298 139 298 224 V550Z" fill="#203744" stroke="#50716b" stroke-width="2"/>
    <path d="M77 550 V226 Q77 151 180 93 Q283 151 283 226 V550" fill="none" stroke="#516b72" stroke-width="1.5"/>
    <g stroke="#253d43" stroke-width="2" stroke-linejoin="round">
      <path d="M20 338 L117 284 H243 L340 338 V550 H20Z" fill="#2c484b"/>
      <path d="M20 338 L117 284 L105 340 L20 399Z M243 284 L340 338 V399 L255 340Z" fill="#35545b"/>
      <path d="M117 284 H243 L255 340 H105Z M20 463 L74 420 H286 L340 463 V510 H20Z" fill="#3d595c"/>
      <path d="M20 399 L105 340 H255 L340 399 V463 L286 420 H74 L20 463Z M20 510 H340 V550 H20Z" fill="#30494e"/>
      <path d="M180 284 V550 M105 340 L74 420 L58 550 M255 340 L286 420 L302 550" fill="none" stroke="#50716b" stroke-width="1.2"/>
    </g>
    <ellipse cx="180" cy="362" rx="135" ry="65" fill="#203744" stroke="#648781" stroke-width="2"/>
    <ellipse cx="180" cy="362" rx="102" ry="43" fill="none" stroke="#35545b" stroke-width="10"/>
    ${runes}
    <g fill="none" stroke-linecap="round">
      <path d="M118 187 L180 322 L242 187 M109 393 L180 322 L251 393" stroke="#73e4b6" stroke-width="11" opacity=".18"/>
      <path d="M118 187 L180 322 L242 187 M109 393 L180 322 L251 393" stroke="#a9edc5" stroke-width="2"/>
    </g>
    <g fill="#172d40" stroke="#50716b" stroke-width="1.3">
      <ellipse cx="98" cy="310" rx="28" ry="8"/>
      <ellipse cx="262" cy="310" rx="28" ry="8"/>
      <ellipse cx="84" cy="539" rx="34" ry="10"/>
      <ellipse cx="276" cy="539" rx="34" ry="10"/>
    </g>
    ${chargeTraces}
    ${nightmareTotem(98, 186, 1.35, -1, true, true)}${nightmareTotem(262, 186, 1.35, 1, true, true)}
    <path d="M180 280 L211 322 L180 363 L149 322Z" fill="#31775a" stroke="#253d43" stroke-width="3"/>
    <path class="nightmare-heart" d="M180 280 L180 322 L149 322Z M180 322 L211 322 L180 363Z" fill="#73e4b6" stroke="#559f82" stroke-width="1.3"/>
    <path d="M180 294 V350 M161 322 H199" stroke="#c0f3d3" stroke-width="1.5"/>
    ${nightmareTotem(84, 390, 1.6, -1, true, true)}${nightmareTotem(276, 390, 1.6, 1, true, true)}
    <path d="M180 48 L189 69 L180 87 L171 69Z" fill="#73e4b6" stroke="#33504e" stroke-width="2"/>
    <path d="M139 527 H221 M155 533 H205" stroke="#648781" stroke-width="2"/>`;
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
    ${graspingHand(x, y, handScale, facing, tilt, true)}
    <g transform="translate(${x} ${y}) scale(${scale})" stroke-linejoin="round">
      <path d="M-67 3 Q-31 29 6 21 Q42 23 67 3 L62 16 L47 22 L37 28 L15 25 L-3 30 L-24 24 L-42 26 L-52 18 L-64 14Z" fill="#382c46" stroke="#1d2233" stroke-width="1.8"/>
      <path d="M-55 13 Q-22 28 13 23 M27 21 L48 16" fill="none" stroke="#c08ab4" stroke-width="2"/>
      <path d="M-85 14 L-73 5 L-64 13 L-71 24Z M62 -18 L72 -27 L81 -22 L77 -11Z M40 33 L53 30 L59 39 L45 42Z" fill="#88828d" stroke="#293244" stroke-width="1.5"><animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur="6.6s" begin="${x < 100 ? -3.3 : x > 250 ? -1.6 : -0.2}s" repeatCount="indefinite"/></path>
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
      const dream = `${panes}
    <path d="M20 550 V220 Q20 92 180 18 Q340 92 340 220 V550Z" fill="#1c343b"/>
    <g stroke="#253d43" stroke-width="2" stroke-linejoin="round">
      <path d="M20 220 Q20 92 180 18 L180 58 Q61 125 54 231 V332 L20 355Z" fill="${colors[0]}"/>
      <path d="M180 18 Q340 92 340 220 V355 L306 332 V231 Q299 125 180 58Z" fill="${colors[1]}"/>
      <path d="M54 231 Q61 125 180 58 Q299 125 306 231 V332 L279 317 V226 Q267 144 180 92 Q93 144 81 226 V317 L54 332Z" fill="#35545b"/>
      <path d="M69 231 Q74 138 180 75 Q286 138 291 231" fill="none" stroke="#7e8b9c" stroke-width="1.5"/>
    </g>
    <path d="M180 92 L247 151 L268 229 L234 282 H126 L92 229 L113 151Z" fill="#433746" stroke="#9c8196" stroke-width="2"/>
    <path d="M180 111 L229 157 L246 224 L220 263 H140 L114 224 L131 157Z" fill="#35434e" stroke="#69526a" stroke-width="1.5"/>
    <g stroke="#253d43" stroke-width="2" stroke-linejoin="round">
      <path d="M20 355 L111 278 H249 L340 355 V550 H20Z" fill="#2c484b"/>
      <path d="M20 355 L111 278 L99 339 L20 409Z M249 278 L340 355 V409 L261 339Z" fill="#35545b"/>
      <path d="M111 278 H249 L261 339 H99Z M70 402 H290 L323 477 H37Z" fill="#3d595c"/>
      <path d="M99 339 H261 L290 402 H70Z M37 477 H323 L340 550 H20Z" fill="#30494e"/>
      <path d="M180 278 V550 M99 339 L70 402 M261 339 L290 402 M37 477 H323" fill="none" stroke="#50716b" stroke-width="1.3"/>
    </g>
    <ellipse cx="180" cy="289" rx="71" ry="19" fill="#263940" stroke="#648781" stroke-width="2"/>
    <ellipse cx="180" cy="289" rx="57" ry="12" fill="none" stroke="#8b9c8d" stroke-width="1.2"/>
    <g fill="none" stroke-linecap="round">
      <path d="M43 550 C28 474 47 376 133 294 M317 550 C332 474 313 376 227 294 M100 550 C169 470 101 373 157 301 M260 550 C191 470 259 373 203 301" stroke="#253d43" stroke-width="16"/>
      <path d="M43 550 C28 474 47 376 133 294 M317 550 C332 474 313 376 227 294 M100 550 C169 470 101 373 157 301 M260 550 C191 470 259 373 203 301" stroke="#648781" stroke-width="9"/>
      <path d="M43 550 C28 474 47 376 133 294 M317 550 C332 474 313 376 227 294 M100 550 C169 470 101 373 157 301 M260 550 C191 470 259 373 203 301" stroke="#b4bba1" stroke-width="1.5" stroke-dasharray="1 12"/>
    </g>
    <g transform="translate(94 50) scale(.48)">${boss}</g>
    <g fill="#203339" stroke="#50716b" stroke-width="1.2">
      <ellipse cx="84" cy="407" rx="28" ry="7"/>
      <ellipse cx="276" cy="410" rx="28" ry="7"/>
      <ellipse cx="102" cy="534" rx="40" ry="9"/>
      <ellipse cx="253" cy="532" rx="40" ry="9"/>
    </g>
    <g data-pnm-walker-bob="true"><animateTransform attributeName="transform" type="translate" values="0 0;0 -2.5;0 0;0 -2.5;0 0" keyTimes="0;.25;.5;.75;1" dur="5.6s" begin="-1.2s" repeatCount="indefinite"/>${sleepwalker(85, 303, 0.63, -1, -3, walkerKinds[0], true)}</g><g data-pnm-walker-bob="true"><animateTransform attributeName="transform" type="translate" values="0 0;0 -2.5;0 0;0 -2.5;0 0" keyTimes="0;.25;.5;.75;1" dur="5.6s" begin="-2.6s" repeatCount="indefinite"/>${sleepwalker(275, 304, 0.64, 1, 3, walkerKinds[1], true)}</g>
    <g data-pnm-walker-bob="true"><animateTransform attributeName="transform" type="translate" values="0 0;0 -2.5;0 0;0 -2.5;0 0" keyTimes="0;.25;.5;.75;1" dur="5.6s" begin="-0.3s" repeatCount="indefinite"/>${sleepwalker(104, 376, 0.97, -1, -2, walkerKinds[2], true)}</g><g data-pnm-walker-bob="true"><animateTransform attributeName="transform" type="translate" values="0 0;0 -2.5;0 0;0 -2.5;0 0" keyTimes="0;.25;.5;.75;1" dur="5.6s" begin="-1.6s" repeatCount="indefinite"/>${sleepwalker(252, 378, 0.95, 1, 2, walkerKinds[3], true)}</g>
    <path d="M180 38 L189 62 L180 83 L171 62Z" fill="#c5ccb0" stroke="#33504e" stroke-width="2"/>
    <path d="M180 44 V75" stroke="#e6e1bd" stroke-width="1.5"/>`;
      // Brown diamond-quilted hauberk, oxblood textile and grey steel, as in the current equipment model.
      const armour = `${panes}
    <path d="M180 46 L304 213 V550 H56 V213Z" fill="#392d35"/>
    <path d="M77 550 V224 Q77 135 180 95 Q283 135 283 224 V550" fill="#68464b" stroke="#b89b7a" stroke-width="2"/>
    <path d="M94 550 V229 Q94 155 180 118 Q266 155 266 229 V550" fill="none" stroke="#8b6566" stroke-width="2"/>
    <g stroke="#2e2c34" stroke-width="2.5" stroke-linejoin="round">
      <path d="M139 326 L220 326 L259 512 L221 531 L136 528 L103 509Z" fill="#514535"/>
      <path d="M146 330 L213 330 L236 511 L178 521 L122 508Z" fill="#874c51"><animate attributeName="d" values="M146 330 L213 330 L236 511 L178 521 L122 508Z;M 146 330 L 213 330 L 243.82 509.05 L 186 519 L 129.68 506.08 Z;M146 330 L213 330 L236 511 L178 521 L122 508Z;M 146 330 L 213 330 L 230.14 511.98 L 172 522 L 116.24 508.96 Z;M146 330 L213 330 L236 511 L178 521 L122 508Z" keyTimes="0;.25;.5;.75;1" dur="7.2s" begin="-0.8s" repeatCount="indefinite"/></path>
      <path d="M181 344 L167 512 L195 519 L217 509 L197 341Z" fill="#a26165" stroke="none"><animate attributeName="d" values="M181 344 L167 512 L195 519 L217 509 L197 341Z;M 181.18 343.95 L 174.86 510.03 L 203 517 L 224.73 507.07 L 197.05 340.99 Z;M181 344 L167 512 L195 519 L217 509 L197 341Z;M 180.86 344.02 L 161.1 512.98 L 189 520 L 211.21 509.97 L 196.97 341.01 Z;M181 344 L167 512 L195 519 L217 509 L197 341Z" keyTimes="0;.25;.5;.75;1" dur="7.2s" begin="-0.8s" repeatCount="indefinite"/></path>
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
      // Translate the orbs around an ellipse without rotating their faceted faces.
      const orbitFrames = Array.from({ length: 37 }, (_, i) => {
        const angle = (i * Math.PI * 2) / 36;
        return `${((i / 36) * 100).toFixed(3)}% { transform: translate(${(-113 * Math.sin(angle)).toFixed(2)}px, ${(-189 * Math.cos(angle)).toFixed(2)}px); }`;
      }).join('');
      const orb = (x, y, name, shade, light) =>
        `<g transform="translate(180 302)"><g class="nightmare-orbit-position" style="--orb-x:${x - 180}px;--orb-y:${y - 302}px;--orb-phase:${name === 'Harmonised' ? 0 : name === 'Eldritch' ? -12 : -24}s"><title>${name} orb</title><circle class="nightmare-orbit-glow" r="39" fill="${shade}" opacity=".12"/><circle r="43" fill="none" stroke="${shade}" stroke-width="2"/><circle r="34" fill="${shade}" stroke="#1d2530" stroke-width="4"/><path d="M-23 -20 L0 -30 L21 -17 L28 9 L5 28 L-20 19 L-29 -1Z" fill="none" stroke="${light}" stroke-width="2"/><path d="M-23 -20 L-5 -6 L21 -17 M-5 -6 L5 28 M-5 -6 L-29 -1 M-5 -6 L28 9" fill="none" stroke="#223239" stroke-width="2" opacity=".6"/><path d="M-18 -18 L-5 -23 L-9 -11Z" fill="${light}"/><path d="M-21 15 Q0 32 22 10" fill="none" stroke="#1e2c38" stroke-width="5" opacity=".3"/></g></g>`;
      const staff = `${panes}
    <style>
      .nightmare-orbit-position { transform: translate(var(--orb-x), var(--orb-y)); animation: nightmare-orb-orbit 36s linear infinite; animation-delay: var(--orb-phase); }
      .nightmare-orbit-glow { animation: nightmare-orb-glow 6s ease-in-out infinite; }
      @keyframes nightmare-orb-orbit { ${orbitFrames} }
      @keyframes nightmare-orb-glow { 0%, 100% { opacity: .06; } 50% { opacity: .19; } }
      @media (prefers-reduced-motion: reduce) { .nightmare-orbit-position, .nightmare-orbit-glow { animation: none; } }
    </style>
    <path d="M180 40 L325 250 L302 550 H58 L35 250Z" fill="#242532"/>
    <ellipse cx="180" cy="302" rx="134" ry="198" fill="none" stroke="#8b7b97" stroke-width="2"/>
    <path d="M180 119 L82 410 H280Z" fill="none" stroke="#88799a" stroke-width="2"/>
    <path d="M180 154 V506 M82 410 Q180 484 280 410" fill="none" stroke="#64516f" stroke-width="8" opacity=".5"/>
    ${nightmareStaff(135, 290, 0.2, -8)}
    ${orb(180, 113, 'Harmonised', '#548fdb', '#c2def6')}
    ${orb(82, 410, 'Eldritch', '#68a74e', '#c4e49d')}
    ${orb(280, 410, 'Volatile', '#df863c', '#ffe0a1')}
    <path d="M65 466 L82 476 L99 466 M263 466 L280 476 L297 466 M165 168 L180 179 L195 168" fill="none" stroke="#a99cb6" stroke-width="1.5"/>`;
      return [awakening, armour, staff, claws, pillars, dream][sceneNumber(index)];
    },
  });

  return { art, shrineMarkup, sceneColors };
};
