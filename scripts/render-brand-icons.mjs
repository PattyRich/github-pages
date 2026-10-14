// Render Praynr's giraffe as crisp OSRS-style browser and install icons.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const frontend = path.join(root, 'apps/frontend');
const output = path.join(frontend, 'public');
const css = await readFile(path.join(frontend, 'src/index.css'), 'utf8');

function token(name) {
  const match = css.match(new RegExp(`${name}:\\s*(#[a-f\\d]{6})`, 'i'));
  if (!match) throw new Error(`Missing OSRS theme token: ${name}`);
  return match[1];
}

const colors = {
  background: token('--osrs-bg-brown-dark'),
  surface: token('--osrs-bg-brown'),
  border: token('--osrs-border-dark'),
  gold: token('--osrs-text-gold'),
  beige: token('--osrs-text-beige'),
};

// A 16-pixel giraffe head and spotted neck stays legible beside search results.
// Rectangles use the same palette as the site's OSRS interface.
const pixels = [
  ['border', 5, 1, 2, 4], ['border', 9, 1, 2, 4],
  ['border', 2, 4, 4, 3], ['border', 10, 4, 4, 3],
  ['border', 4, 3, 8, 7], ['border', 10, 6, 5, 4],
  ['border', 5, 9, 6, 7],
  ['gold', 5, 1, 1, 3], ['gold', 9, 1, 1, 3],
  ['gold', 3, 5, 2, 1], ['gold', 11, 5, 2, 1],
  ['gold', 5, 4, 6, 5], ['gold', 11, 7, 3, 2],
  ['gold', 6, 9, 4, 7],
  ['beige', 12, 7, 2, 1], ['beige', 7, 6, 2, 2],
  ['surface', 10, 5, 1, 1], ['surface', 13, 8, 1, 1],
  ['surface', 7, 10, 2, 1], ['surface', 6, 12, 1, 2],
  ['surface', 8, 13, 2, 1], ['surface', 7, 15, 1, 1],
];

function iconSvg(size) {
  const art = pixels
    .map(([color, x, y, width, height]) =>
      `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${colors[color]}"/>`
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 16 16" shape-rendering="crispEdges">
    <rect width="16" height="16" fill="${colors.background}"/>
    ${art}
  </svg>`;
}

function pngChunk(type, data) {
  const label = Buffer.from(type);
  const payload = Buffer.concat([label, data]);
  let crc = 0xffffffff;
  for (const byte of payload) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([length, payload, checksum]);
}

function png(size) {
  const grid = Array.from({ length: 16 * 16 }, () => colors.background);
  for (const [color, x, y, width, height] of pixels) {
    for (let row = y; row < y + height; row++) {
      for (let column = x; column < x + width; column++) {
        grid[row * 16 + column] = colors[color];
      }
    }
  }
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    for (let x = 0; x < size; x++) {
      const hex = grid[Math.floor(y * 16 / size) * 16 + Math.floor(x * 16 / size)];
      const offset = row + 1 + x * 4;
      raw[offset] = Number.parseInt(hex.slice(1, 3), 16);
      raw[offset + 1] = Number.parseInt(hex.slice(3, 5), 16);
      raw[offset + 2] = Number.parseInt(hex.slice(5, 7), 16);
      raw[offset + 3] = 255;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // RGBA, 8 bits per channel.
  header[9] = 6;
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of [96, 192, 512]) {
  const name = size === 96 ? 'favicon.png' : `logo${size}.png`;
  await writeFile(path.join(output, name), png(size));
}

const sizes = [16, 32, 48, 64];
const frames = sizes.map(png);
const header = Buffer.alloc(6 + frames.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(frames.length, 4);
let offset = header.length;
frames.forEach((frame, index) => {
  const entry = 6 + index * 16;
  header[entry] = sizes[index];
  header[entry + 1] = sizes[index];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(frame.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += frame.length;
});
await writeFile(path.join(output, 'favicon.ico'), Buffer.concat([header, ...frames]));
await writeFile(path.join(frontend, 'src/logo.svg'), iconSvg(512));
console.log(`Saved Praynr giraffe icons: ${sizes.join(', ')}px ICO, 96px favicon and install PNGs.`);
