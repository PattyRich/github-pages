/* Original stained-glass study, refined second pass.
 * Visually checked against the current OSRS Wiki detailed item renders:
 * https://oldschool.runescape.wiki/w/File:Ultor_ring_detail.png
 * https://oldschool.runescape.wiki/w/File:Ultor_vestige_detail.png
 * Silver band, crimson Strangler fragment, ochre crossbar and grey block.
 * The finished ring is crafted from the vestige; it is not a direct boss drop.
 * Pass 2: reopened both full item renders and compared the initial enlarged
 * window and 0–24s motion sheet. Darkened the broad outer silver plane, kept
 * the inner bevel lighter so the polygonal hole reads as an opening rather
 * than a flat grey hoop, and enlarged the separate thorned vestige. The ring,
 * crossbar and block remain fixed throughout the reflection cycle. */
/* global GLASS_NEW_SCENES */
GLASS_NEW_SCENES['ultor-ring'] = (h, c, id) => {
  const { p, l, g, ellipse, move, on } = h;
  const ink = '#26232c';
  const band =
    'M217 249 L290 249 L359 283 L450 309 L469 443 L457 520 L413 648 L253 718 L143 718 L61 676 L31 600 L0 484 L23 354 L92 249 L151 207 L217 226Z M106 493 L115 451 L149 417 L217 395 L294 392 L329 411 L350 448 L341 482 L294 526 L231 557 L179 572 L129 549Z';
  const block = 'M289 37 L396 0 L486 144 L462 233 L404 266 L330 226Z';
  const red =
    'M188 125 L271 125 L272 204 L218 327 L217 395 L191 397 L149 417 L115 451 L106 493 L129 549 L179 572 L143 605 L143 718 L61 676 L31 600 L0 484 L1 459 L23 354 L92 249 L151 207 L148 177Z';
  const vestige =
    'M210 8 L132 39 L188 39 L174 87 L90 119 L36 211 L6 242 L23 298 L76 291 L91 317 L107 286 L205 215 L126 220 L154 158 L238 129Z';

  let art = '';
  // A quiet botanical border connects the relic to the Strangler without hiding it.
  art += p(
    'M37 508 L44 427 L38 386 L49 327 L47 279 L61 241 L64 193 L75 174 L71 221 L63 265 L67 301 L56 351 L60 392 L52 436 L48 511Z',
    '#4d303b',
    '#29252b',
    2
  );
  art += p(
    'M50 431 L72 401 L56 408 L65 364 L43 392Z M50 329 L29 307 L43 314 L45 280 L51 305Z M62 245 L87 222 L70 229 L72 205 L60 224Z',
    '#733c45',
    ink,
    1.4
  );
  art += l('M44 496 L51 433 L46 387 L55 328 L53 282 L66 242 L69 199', '#936268', 1.2);
  art += p(
    'M320 510 L311 466 L316 419 L304 381 L310 333 L299 293 L303 244 L290 215 L288 180 L279 158 L294 177 L299 208 L312 240 L308 287 L320 332 L314 378 L325 418 L320 466 L331 511Z',
    '#49323a',
    '#29252b',
    2
  );
  art += p(
    'M308 337 L289 321 L303 324 L297 297 L313 318Z M315 418 L336 390 L324 397 L321 373 L309 397Z M296 209 L275 197 L288 196 L287 177 L298 197Z',
    '#713e48',
    ink,
    1.4
  );
  art += l(
    'M325 499 L315 465 L321 419 L309 381 L315 333 L303 291 L308 244 L295 213 L291 180',
    '#86545f',
    1.2
  );
  art += l(
    'M65 182 L91 153 L114 142 M290 172 L271 147 L247 138 M58 465 L76 455 M303 455 L286 446',
    c[4],
    1.2,
    'opacity=".42"'
  );

  // Inset architectural fragments leave the two relics a distinct, readable silhouette.
  art += p('M67 402 L83 387 L98 390 L106 410 L94 442 L68 453Z', '#49434a', '#877b78', 1.5);
  art += p('M67 402 L83 387 L83 424 L68 453Z', '#62555a', 'none');
  art += l('M73 408 L87 405 M71 429 L90 423', '#a18a85', 1);
  art += p('M270 394 L286 381 L300 400 L295 449 L271 439Z', '#49434a', '#877b78', 1.5);
  art += p('M286 381 L300 400 L295 449 L286 432Z', '#352f39', 'none');

  let ring = '';
  // The hole is genuine negative space; polygon facets follow the detailed model.
  ring += p(band, '#888995', ink, 5, 'fill-rule="evenodd"');
  ring += p(
    'M217 249 L290 249 L359 283 L450 309 L414 340 L327 312 L264 288 L217 296Z',
    '#858593',
    'none'
  );
  ring += p(
    'M217 296 L264 288 L327 312 L414 340 L434 433 L405 421 L376 367 L294 344 L217 341Z',
    '#a2a0ad',
    ink,
    2.5
  );
  ring += p(
    'M217 341 L294 344 L376 367 L405 421 L391 476 L350 448 L329 411 L294 392 L217 395Z',
    '#8b8c99',
    ink,
    2.5
  );
  ring += p(
    'M450 309 L469 443 L457 520 L413 648 L378 598 L409 501 L434 433 L414 340Z',
    '#6d7280',
    ink,
    2.5
  );
  ring += p(
    'M350 448 L341 482 L294 526 L231 557 L179 572 L143 605 L253 603 L337 563 L391 476Z',
    '#a7a6b2',
    ink,
    2.5
  );
  ring += p('M143 605 L253 603 L337 563 L378 598 L413 648 L253 718 L143 718Z', '#92939e', ink, 2.5);
  ring += p('M143 605 L253 603 L253 718 L143 718Z', '#999aa5', 'none');
  ring += p('M337 563 L378 598 L413 648 L253 718 L253 674 L347 626Z', '#80838f', 'none');
  ring += l(
    'M233 271 L288 270 L350 298 M444 373 L451 438 L443 501 M163 699 L251 699 L315 673',
    '#bbb9c3',
    2.4
  );
  ring += l(
    'M223 386 L292 383 L334 404 L361 447 L350 485 M298 530 L234 563 L182 581',
    '#bab8c2',
    2.2
  );
  ring += l('M217 341 L243 340 M401 516 L377 576 M277 624 L316 607', '#6c6d7a', 2.5);

  // Small grey back tab and the ochre bar are behind the crimson fragment.
  ring += p('M19 233 L74 233 L89 262 L52 298Z', '#79848a', ink, 4);
  ring += p('M19 233 L74 233 L62 249 L41 264Z', '#acb4b3', 'none');
  ring += p(
    'M272 149 L305 123 L343 181 L281 223 L231 247 L174 263 L151 240 L190 212Z',
    '#a38e62',
    ink,
    4
  );
  ring += p('M272 149 L305 123 L315 147 L232 204 L174 239 L151 240 L190 212Z', '#c2ae7d', 'none');
  ring += p('M41 180 L125 210 L97 237Z', '#884039', ink, 3);
  ring += p('M41 180 L107 207 L125 210 L97 221Z', '#ae5448', 'none');
  ring += p(red, '#8c403e', ink, 4.5);
  ring += p(
    'M188 125 L271 125 L272 204 L218 327 L191 397 L149 417 L115 451 L106 493 L54 473 L23 354 L92 249 L151 207 L148 177Z',
    '#9d4944',
    ink,
    2.5
  );
  ring += p(
    'M188 125 L271 125 L247 148 L195 147 L170 180 L162 218 L108 272 L78 343 L54 473 L23 354 L92 249 L151 207 L148 177Z',
    '#b2574b',
    'none'
  );
  ring += p(
    'M247 148 L271 125 L272 204 L218 327 L191 397 L149 417 L168 352 L196 276 L229 216Z',
    '#783735',
    ink,
    2.5
  );
  ring += p(
    'M23 354 L54 473 L106 493 L129 549 L179 572 L143 605 L143 718 L61 676 L31 600 L0 484 L1 459Z',
    '#9d6553',
    ink,
    2.5
  );
  ring += p('M0 484 L54 473 L106 493 L129 549 L82 558 L61 676 L31 600Z', '#8a4f48', 'none');
  ring += p('M82 558 L129 549 L179 572 L143 605 L143 718 L61 676Z', '#b07a61', 'none');
  ring += l('M184 163 L170 205 L115 262 M65 344 L48 411 M193 332 L174 384', '#c27260', 2.8);

  // This chunky head is deliberately grey, rather than a jewel or golden setting.
  ring += p(block, '#7c8b8f', ink, 4.5);
  ring += p('M289 37 L396 0 L486 144 L373 185Z', '#9ca8a7', ink, 2.5);
  ring += p('M289 37 L373 185 L404 266 L330 226Z', '#74858a', ink, 2.5);
  ring += p('M373 185 L486 144 L462 233 L404 266Z', '#899698', ink, 2.5);
  ring += p('M396 0 L486 144 L468 153 L385 19Z', '#8a9799', 'none');
  ring += l('M300 48 L365 164 M390 203 L464 174', '#bac2bb', 3.2);
  ring += `<defs><clipPath id="${id}-metal"><path d="${band}" fill-rule="evenodd" clip-rule="evenodd"/><path d="${block}"/></clipPath></defs>`;
  ring += `<g clip-path="url(#${id}-metal)" opacity=".55" data-art-effect="ultor-silver-reflection"><g>${move('-800 0;-800 0;620 0;620 0', '0;.44;.61;1', 16)}${p('M-105 -60 L-73 -60 L256 790 L223 790Z', '#e2e0d1', 'none')}${p('M-61 -60 L-53 -60 L276 790 L268 790Z', '#c6c5bb', 'none')}</g></g>`;
  art += g('translate(72 99) scale(.45)', ring, 'data-relic="ultor-ring"');

  // The fragment rests on a shallow display ledge below the completed ring.
  art += ellipse(184, 486, 75, 11, '#25232d', 'none', 0, 'opacity=".55"');
  art += p('M78 490 L115 469 L257 469 L286 488 L267 505 L101 505Z', '#817774', '#29232c', 2);
  art += p(
    'M78 490 L101 505 L267 505 L286 488 L282 513 L264 529 L105 529 L80 514Z',
    '#514950',
    '#29232c',
    2
  );
  art += p('M101 505 L267 505 L264 529 L105 529Z', '#665c61', 'none');
  art += p('M115 469 L257 469 L267 478 L111 478 L88 490 L78 490Z', '#a39688', 'none');
  art += l('M111 512 H255 M109 520 H253 M93 493 L116 482 M257 482 L274 489', '#a09285', 1.2);
  art += l('M154 508 V526 M219 508 V526', '#453c44', 1.4);

  let fragment = p(vestige, '#8e342e', ink, 6);
  fragment += p(
    'M210 8 L132 39 L188 39 L174 87 L90 119 L36 211 L6 242 L23 298 L76 291 L91 317 L107 286 L205 215 L126 220 L154 158 L238 129Z',
    '#a83e33',
    'none'
  );
  fragment += p('M210 8 L238 129 L189 111 L174 87 L188 39 L132 39Z', '#bd5140', ink, 2.8);
  fragment += p('M90 119 L189 111 L238 129 L154 158 L126 220 L36 211Z', '#a74536', ink, 2.8);
  fragment += p(
    'M36 211 L126 220 L205 215 L107 286 L91 317 L76 291 L23 298 L6 242Z',
    '#7c302d',
    ink,
    2.8
  );
  fragment += p('M90 119 L109 142 L63 217 L36 211Z', '#c65b43', 'none');
  fragment += l('M174 87 L154 115 M45 234 L98 247 L174 225', '#c2694d', 3.5);
  fragment += on(
    p(vestige, '#d37656', 'none'),
    '0;0;.2;0;0',
    '0;.69;.74;.8;1',
    16,
    'data-art-effect="ultor-vestige-pulse"'
  );
  art += g('translate(226 437) rotate(76) scale(.30)', fragment, 'data-relic="ultor-vestige"');

  // Small carved chevrons, rather than lettering, keep the relic display quiet.
  art += l('M168 516 L181 522 L194 516 M173 514 L181 518 L189 514', '#c0a890', 1.2);
  art += p(
    'M76 534 L87 528 L100 534 L93 541 L82 541Z M261 534 L274 528 L287 534 L280 541 L268 541Z',
    '#6a5a61',
    '#9e8584',
    1
  );
  return art;
};
