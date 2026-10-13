// Render Praynr's install and browser icons from the site's actual OSRS font.
// Run with Playwright and sharp available locally or in PRAYNR_PREVIEW_RUNTIME
// (a node_modules directory). PRAYNR_PREVIEW_BROWSER selects installed Chromium.
// Example: node scripts/render-brand-icons.mjs
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const frontend = path.join(root, 'apps/frontend');
const output = path.join(frontend, 'public');
const runtimeRequire = createRequire(
  process.env.PRAYNR_PREVIEW_RUNTIME
    ? path.join(process.env.PRAYNR_PREVIEW_RUNTIME, '../package.json')
    : path.join(frontend, 'package.json')
);
const { chromium } = runtimeRequire('playwright');
const sharp = runtimeRequire('sharp');
const css = await readFile(path.join(frontend, 'src/index.css'), 'utf8');
const font = await readFile(path.join(frontend, 'src/assets/fonts/osrs.ttf'));

function token(name) {
  const match = css.match(new RegExp(`${name}:\\s*(#[a-f\\d]{6})`, 'i'));
  if (!match) throw new Error(`Missing OSRS theme token: ${name}`);
  return match[1];
}

const colors = {
  background: token('--osrs-bg-brown-dark'),
  surface: token('--osrs-bg-brown'),
  border: token('--osrs-border-dark'),
  bevel: token('--osrs-border-light'),
  gold: token('--osrs-text-gold'),
};

// The font is already pixel art. Extract its native 16px bitmap, then enlarge
// pixels at integer scale so every size remains sharp rather than interpolated.
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PRAYNR_PREVIEW_BROWSER
    ? { executablePath: process.env.PRAYNR_PREVIEW_BROWSER }
    : {}),
});
let glyph;
try {
  const page = await browser.newPage();
  glyph = await page.evaluate(async (base64Font) => {
    const face = new FontFace(
      'osrsFont',
      `url(data:font/ttf;base64,${base64Font})`
    );
    await face.load();
    document.fonts.add(face);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 32;
    const context = canvas.getContext('2d');
    context.font = '16px osrsFont';
    context.fillText('P', 0, 16);
    const pixels = context.getImageData(0, 0, 32, 32).data;
    const points = [];
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        if (pixels[(y * 32 + x) * 4 + 3] > 127) points.push([x, y]);
      }
    }
    if (!points.length) throw new Error('The OSRS font did not render a P.');
    const minX = Math.min(...points.map(([x]) => x));
    const minY = Math.min(...points.map(([, y]) => y));
    return {
      width: Math.max(...points.map(([x]) => x)) - minX + 1,
      height: Math.max(...points.map(([, y]) => y)) - minY + 1,
      points: points.map(([x, y]) => [x - minX, y - minY]),
    };
  }, font.toString('base64'));
} finally {
  await browser.close();
}

function iconSvg(size) {
  const scale = Math.max(1, Math.floor((size * 0.64) / (glyph.height + 1)));
  const originX = Math.floor((size - (glyph.width + 1) * scale) / 2);
  const originY = Math.floor((size - (glyph.height + 1) * scale) / 2);
  const edge = Math.max(1, Math.round(size / 32));
  const radius = Math.round(size * 0.09375);
  const points = glyph.points
    .map(
      ([x, y]) =>
        `<rect x="${x * scale}" y="${y * scale}" width="${scale}" height="${scale}"/>`
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${colors.background}"/>
    <rect x="${edge}" y="${edge}" width="${size - edge * 2}" height="${size - edge * 2}" rx="${radius}" fill="${colors.border}"/>
    <rect x="${edge * 2}" y="${edge * 2}" width="${size - edge * 4}" height="${size - edge * 4}" rx="${Math.max(0, radius - edge)}" fill="${colors.bevel}"/>
    <rect x="${edge * 3}" y="${edge * 3}" width="${size - edge * 6}" height="${size - edge * 6}" rx="${Math.max(0, radius - edge * 2)}" fill="${colors.surface}"/>
    <g shape-rendering="crispEdges" fill="${colors.border}" transform="translate(${originX + scale} ${originY + scale})">${points}</g>
    <g shape-rendering="crispEdges" fill="${colors.gold}" transform="translate(${originX} ${originY})">${points}</g>
  </svg>`;
}

async function png(size) {
  return sharp(Buffer.from(iconSvg(size))).png().toBuffer();
}

// All meaningful artwork in the 512px icon is within the maskable safe circle
// (40% of width around the center). The full-bleed brown and bevel can crop.
for (const size of [192, 512]) {
  await writeFile(path.join(output, `logo${size}.png`), await png(size));
}

const sizes = [16, 24, 32, 64];
const frames = await Promise.all(sizes.map(png));
const header = Buffer.alloc(6 + frames.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(frames.length, 4);
let offset = header.length;
frames.forEach((frame, index) => {
  const entry = 6 + index * 16;
  header[entry] = header[entry + 1] = sizes[index];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(frame.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += frame.length;
});
await writeFile(path.join(output, 'favicon.ico'), Buffer.concat([header, ...frames]));
console.log(`Saved Praynr OSRS-font icons: ${sizes.join(', ')}px ICO, 192px and 512px PNG.`);
