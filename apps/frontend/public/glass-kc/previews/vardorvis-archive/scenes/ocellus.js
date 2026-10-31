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
/* global GLASS_NEW_SCENES */
GLASS_NEW_SCENES.ocellus = (h, c, id) => {
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
  for (let i = 0; i < slabs.length; i++) cosmos += p(slabs[i][0], cosmicColors[i], '#302a43', 1.1);
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
  let voidFloor = p('M35 476 L110 448 L252 450 L326 487 L294 536 H64Z', '#171725', '#80609b', 1.8);
  voidFloor += p('M93 473 L219 465 L270 495 L219 524 L103 512 L72 491Z', '#5e5c67', '#ae64c9', 2.2);
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
  smallArm += p('M120 253 L131 255 L118 271 L102 278 L91 287 L83 282 L102 269Z', '#a1a58a', 'none');
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
