// Capture a sample hunt through the real tracker controls in an isolated browser context.
// Requires Playwright, ffmpeg and ffprobe. The context never contacts the production API.
// PRAYNR_PREVIEW_RUNTIME and PRAYNR_PREVIEW_BROWSER work as in render-social-preview.mjs.
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const frontend = path.join(root, 'apps/frontend');
const temp = path.join(root, '.tmp/kc-demo');
const media = path.join(frontend, 'public/media');
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
  server: { host: '127.0.0.1', port: 4189, strictPort: true, open: false },
});
const origin = 'http://127.0.0.1:4189';
const viewport = { width: 1600, height: 900 };
let browser;

const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
async function camera(page) {
  await page.evaluate(() => window.scrollTo(0, document.querySelector('.hero').offsetTop + 5));
}

function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', windowsHide: true });
  if (result.error || result.status !== 0) throw result.error || new Error(result.stderr);
  return result.stdout;
}

async function configure(page) {
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    return url.hostname === '127.0.0.1' || url.protocol === 'data:'
      ? route.continue()
      : route.abort();
  });
}

async function openHunt(page) {
  await page.goto(`${origin}/glass-kc/index.html?api=${encodeURIComponent(origin)}`);
  await page.locator('#choose-toa').click();
  await page.locator('#tracker-content').waitFor();
  if (await page.locator('#journal-setup').isVisible()) {
    await page.locator('#start-kc').fill('0');
    await page.locator('#begin-journal').click();
  }
  if (
    (await page.locator('#account-toggle').isVisible()) &&
    (await page.locator('#account-panel').getAttribute('data-collapsed')) !== 'true'
  ) {
    await page.locator('#account-toggle').click();
  }
  await page.locator('#window-workshop summary').click();
  await page.locator('#window-workshop [data-frame="gilded"]').click();
  await page.locator('#window-workshop summary').click();
  await camera(page);
}

try {
  await mkdir(temp, { recursive: true });
  await mkdir(media, { recursive: true });
  await server.listen();
  browser = await chromium.launch({
    headless: true,
    ...(process.env.PRAYNR_PREVIEW_BROWSER
      ? { executablePath: process.env.PRAYNR_PREVIEW_BROWSER }
      : {}),
  });
  const preparation = await browser.newContext({ viewport, reducedMotion: 'no-preference' });
  const page = await preparation.newPage();
  await configure(page);
  await openHunt(page);
  await page.evaluate(() => {
    for (let i = 0; i < 94; i += 1) document.getElementById('record-kill').click();
  });
  await camera(page);
  await page.screenshot({ path: path.join(temp, 'initial.png') });
  if (process.argv.includes('--inspect')) {
    console.log(`Prepared a sample ToA hunt, screenshot: ${path.join(temp, 'initial.png')}`);
  } else {
    const storageState = await preparation.storageState();
    await preparation.close();
    const recording = await browser.newContext({
      viewport,
      storageState,
      reducedMotion: 'no-preference',
      recordVideo: { dir: temp, size: viewport },
    });
    const film = await recording.newPage();
    const errors = [];
    film.on('pageerror', (error) => errors.push(error.message));
    await configure(film);
    await openHunt(film);
    await film.evaluate(() => document.fonts.ready);
    await pause(500);
    const started = performance.now();
    const at = async (milliseconds) =>
      pause(Math.max(0, milliseconds - (performance.now() - started)));

    await at(2000);
    await film.locator('#record-kill').click();
    await at(3500);
    await film.locator('#mark-drop').click();
    await at(4500);
    await film.locator('#pane-label').fill('Demo: Lightbearer');
    await at(6000);
    await film.locator('#pane-save').click();
    await at(7500);
    await camera(film);
    for (let i = 0; i < 5; i += 1) {
      await at(9000 + i * 1000);
      await film.locator('#record-kill').click();
    }
    await at(14300);
    await camera(film);
    await at(15500);
    await film.locator('.glass-completion-visit').click();
    await at(18000);
    await pause(1000);
    if (errors.length) throw new Error(errors.join('\n'));
    const video = film.video();
    await recording.close();
    const raw = await video.path();
    const rawDuration = Number(
      run('ffprobe', [
        '-v',
        'error',
        '-show_entries',
        'format=duration',
        '-of',
        'default=noprint_wrappers=1:nokey=1',
        raw,
      ]).trim()
    );
    const output = path.join(media, 'kc-trackers-demo-v1.mp4');
    run('ffmpeg', [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-i',
      raw,
      '-ss',
      String(Math.max(0, rawDuration - 19)),
      '-t',
      '18',
      '-vf',
      'scale=1280:720:flags=lanczos,fps=30',
      '-c:v',
      'libx264',
      '-preset',
      'slow',
      '-crf',
      '18',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      '-an',
      output,
    ]);
    run('ffmpeg', [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-ss',
      '14',
      '-i',
      output,
      '-frames:v',
      '1',
      '-q:v',
      '2',
      path.join(media, 'kc-trackers-poster-v1.jpg'),
    ]);
    const metadata = JSON.parse(
      run('ffprobe', [
        '-v',
        'error',
        '-show_entries',
        'stream=codec_name,width,height,pix_fmt:format=duration,size',
        '-of',
        'json',
        output,
      ])
    );
    const duration = Number(metadata.format.duration);
    if (
      Math.abs(duration - 18) > 0.1 ||
      metadata.streams[0]?.width !== 1280 ||
      metadata.streams[0]?.height !== 720
    )
      throw new Error('Demo export dimensions or duration are incorrect.');
    const uploadDate = new Date().toISOString();
    await writeFile(
      path.join(temp, 'metadata.json'),
      JSON.stringify({ uploadDate, ...metadata }, null, 2)
    );
    const watchPage = path.join(frontend, 'kc-trackers/index.html');
    await writeFile(
      watchPage,
      (await readFile(watchPage, 'utf8')).replace(
        /"uploadDate": "[^"]+"/,
        `"uploadDate": "${uploadDate}"`
      )
    );
    console.log(`Saved real-UI demo and poster: ${output}`);
    console.log(JSON.stringify(metadata));
  }
} finally {
  await browser?.close();
  await server.close();
}
