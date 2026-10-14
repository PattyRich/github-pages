// Preserve and resize Praynr's original giraffe favicon for modern icon slots.
// favicon.ico is the source artwork; this script never replaces it.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'apps/frontend/public');
const ico = await readFile(path.join(output, 'favicon.ico'));
const count = ico.readUInt16LE(4);
let source;

for (let index = 0; index < count; index++) {
  const entry = 6 + index * 16;
  const width = ico[entry] || 256;
  const height = ico[entry + 1] || 256;
  if (width !== 48 || height !== 48) continue;
  const offset = ico.readUInt32LE(entry + 12);
  const headerSize = ico.readUInt32LE(offset);
  if (ico.readUInt16LE(offset + 14) !== 32 || ico.readUInt32LE(offset + 16) !== 0) {
    throw new Error('Expected an uncompressed 32-bit giraffe icon.');
  }
  const image = Buffer.alloc(width * height * 4);
  const pixelStart = offset + headerSize;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const from = pixelStart + ((height - 1 - y) * width + x) * 4;
      const to = (y * width + x) * 4;
      image[to] = ico[from + 2];
      image[to + 1] = ico[from + 1];
      image[to + 2] = ico[from];
      image[to + 3] = ico[from + 3];
    }
  }
  source = { width, image };
  break;
}

if (!source) throw new Error('The original 48px giraffe icon is missing from favicon.ico.');

function chunk(type, data) {
  const payload = Buffer.concat([Buffer.from(type), data]);
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

function sample(x, y, channel) {
  const boundedX = Math.min(source.width - 1, Math.max(0, x));
  const boundedY = Math.min(source.width - 1, Math.max(0, y));
  return source.image[(boundedY * source.width + boundedX) * 4 + channel];
}

function png(size) {
  const pixels = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const sourceX = (x + 0.5) * source.width / size - 0.5;
      const sourceY = (y + 0.5) * source.width / size - 0.5;
      const left = Math.floor(sourceX);
      const top = Math.floor(sourceY);
      const horizontal = sourceX - left;
      const vertical = sourceY - top;
      const corners = [
        [left, top, (1 - horizontal) * (1 - vertical)],
        [left + 1, top, horizontal * (1 - vertical)],
        [left, top + 1, (1 - horizontal) * vertical],
        [left + 1, top + 1, horizontal * vertical],
      ];
      let alpha = 0;
      const color = [0, 0, 0];
      for (const [cornerX, cornerY, weight] of corners) {
        const opacity = sample(cornerX, cornerY, 3) / 255 * weight;
        alpha += opacity;
        for (let channel = 0; channel < 3; channel++) {
          color[channel] += sample(cornerX, cornerY, channel) * opacity;
        }
      }
      const to = y * (size * 4 + 1) + 1 + x * 4;
      for (let channel = 0; channel < 3; channel++) {
        pixels[to + channel] = alpha ? Math.round(color[channel] / alpha) : 0;
      }
      pixels[to + 3] = Math.round(alpha * 255);
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(pixels)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of [96, 192, 512]) {
  const name = size === 96 ? 'favicon.png' : `logo${size}.png`;
  await writeFile(path.join(output, name), png(size));
}
console.log('Restored the original giraffe to the favicon and install PNGs.');
