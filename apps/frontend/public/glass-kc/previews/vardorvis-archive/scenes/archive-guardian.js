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
/* global GLASS_NEW_SCENES */
GLASS_NEW_SCENES['archive-guardian'] = (h, c, id) => {
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
    turn('0 136 274;0 136 274;-1.2 136 274;0.7 136 274;0 136 274;0 136 274', '0;.24;.43;.64;.79;1')
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
    p('M98 250 L139 252 L181 239 L195 255 L182 300 L157 319 L127 310 L101 291Z', '#20291f', 'none'),
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
