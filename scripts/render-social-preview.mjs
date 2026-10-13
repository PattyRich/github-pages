// Run with Playwright available locally or in PRAYNR_PREVIEW_RUNTIME (node_modules).
// PRAYNR_PREVIEW_BROWSER optionally selects an installed Chromium executable.
import { createRequire } from 'node:module';
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
  await page.goto('http://127.0.0.1:4177/social-preview.html');
  await page.locator('.social-preview-board .tile-wrapper').nth(24).waitFor();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images, (image) => image.decode()));
  });
  await page.locator('.social-preview-window svg').nth(1).waitFor();
  if (errors.length) throw new Error(errors.join('\n'));
  const output = path.join(frontend, 'public/praynr-social-preview-v2.png');
  await page.screenshot({ path: output, animations: 'disabled' });
  console.log(`Saved 1200 x 630 social preview: ${output}`);
} finally {
  await browser?.close();
  await server.close();
}
