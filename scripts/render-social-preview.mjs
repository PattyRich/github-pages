// Run with Playwright available locally or in PRAYNR_PREVIEW_RUNTIME (node_modules).
// PRAYNR_PREVIEW_BROWSER optionally selects an installed Chromium executable.
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const frontend = path.join(root, 'apps/frontend');
const frontendRequire = createRequire(path.join(frontend, 'package.json'));
const runtimeRequire = process.env.PRAYNR_PREVIEW_RUNTIME
  ? createRequire(path.join(process.env.PRAYNR_PREVIEW_RUNTIME, '../package.json'))
  : frontendRequire;
const { chromium } = runtimeRequire('playwright');
const viteEntry = path.join(
  path.dirname(frontendRequire.resolve('vite/package.json')),
  'dist/node/index.js'
);
const { createServer } = await import(pathToFileURL(viteEntry));
const server = await createServer({
  root: frontend,
  configFile: path.join(frontend, 'vite.config.ts'),
  server: { host: '127.0.0.1', port: 4177, strictPort: true, open: false },
});
let browser;
const previews = [
  {
    feature: 'all',
    query: '',
    output: 'public/praynr-social-preview-v3.png',
    board: true,
    windows: true,
  },
  {
    feature: 'kc-trackers',
    query: '?feature=kc-trackers',
    output: 'public/media/kc-trackers-social-v1.png',
    board: false,
    windows: true,
  },
  {
    feature: 'bingo',
    query: '?feature=bingo',
    output: 'public/media/bingo-social-v1.png',
    board: true,
    windows: false,
  },
];

try {
  await server.listen();
  browser = await chromium.launch({
    headless: true,
    ...(process.env.PRAYNR_PREVIEW_BROWSER
      ? { executablePath: process.env.PRAYNR_PREVIEW_BROWSER }
      : {}),
  });
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    return url.hostname === '127.0.0.1' || url.protocol === 'data:'
      ? route.continue()
      : route.abort();
  });
  for (const preview of previews) {
    errors.length = 0;
    await page.goto(`http://127.0.0.1:4177/social-preview.html${preview.query}`);
    await page.locator(`[data-preview-feature="${preview.feature}"]`).waitFor();
    if (preview.board) {
      await page.locator('.social-preview-board .tile-wrapper').nth(24).waitFor();
    }
    if (preview.windows) {
      await page.locator('.social-preview-window svg').nth(1).waitFor();
    }
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(Array.from(document.images, (image) => image.decode()));
    });
    if (errors.length) throw new Error(`${preview.feature}: ${errors.join('\n')}`);
    const output = path.join(frontend, preview.output);
    await mkdir(path.dirname(output), { recursive: true });
    await page.screenshot({ path: output, animations: 'disabled' });
    console.log(`Saved 1200 x 630 ${preview.feature} social preview: ${output}`);
  }
} finally {
  await browser?.close();
  await server.close();
}
