import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const destination = resolve('docs/review');
await mkdir(destination, { recursive: true });
const installed = join(process.env.PROGRAMFILES ?? 'C:\\Program Files', 'Google/Chrome/Application/chrome.exe');
const browser = await chromium.launch({ headless: true, ...(existsSync(installed) ? { executablePath: installed } : {}) });
const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1, recordVideo: { dir: destination, size: { width: 1440, height: 960 } } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
await page.goto(process.env.BRAIN_BASE_URL ?? 'http://127.0.0.1:4173/');
await page.locator('[data-renderer-status="ready"]').waitFor({ timeout: 45_000 });
const chapters = ['form', 'space', 'surface', 'stillness'];

async function settle() {
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(done)))));
}

for (const [profile, viewport] of [['desktop', { width: 1440, height: 960 }], ['mobile', { width: 393, height: 852 }]]) {
  await page.setViewportSize(viewport);
  for (const [index, name] of chapters.entries()) {
    await page.evaluate(() => window.__BRAIN__.resume());
    await page.evaluate((id) => document.getElementById(id).scrollIntoView({ behavior: 'instant' }), name);
    await settle();
    await page.evaluate((position) => window.__BRAIN__.capture(position), index);
    await settle();
    await page.screenshot({ path: join(destination, `${profile}-${name}.png`) });
    // Composition-matched loading and recovery assets contain no duplicate UI.
    await page.addStyleTag({ content: '.experience-ui,.skip-link{visibility:hidden!important}' });
    await page.screenshot({ path: join(destination, `${profile}-${name}-poster.png`) });
    await page.evaluate(() => { for (const style of document.querySelectorAll('style')) if (style.textContent.includes('.experience-ui,.skip-link')) style.remove(); });
  }
}
await page.setViewportSize({ width: 1440, height: 960 });
for (const position of [0.5, 1.25, 1.5, 1.75, 2.5]) {
  await page.evaluate((value) => window.__BRAIN__.capture(value), position);
  await settle();
  await page.screenshot({ path: join(destination, `intermediate-${position}.png`) });
}
await page.evaluate(() => window.__BRAIN__.resume());
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
await settle();
// Record native scrolling. No wheel interception or rendered-frame substitution.
await page.evaluate(() => new Promise((done) => {
  const start = performance.now();
  const max = document.documentElement.scrollHeight - innerHeight;
  const animate = (now) => {
    const t = Math.min(1, (now - start) / 10_000);
    window.scrollTo(0, max * (0.5 - Math.cos(t * Math.PI * 2) / 2));
    if (t < 1) requestAnimationFrame(animate); else done();
  };
  requestAnimationFrame(animate);
}));
const samples = await page.evaluate(() => window.__BRAIN__.frameTimes());
const steady = samples.slice(20).filter((ms) => ms > 0 && ms < 250).sort((a, b) => a - b);
const manifest = {
  capturedAt: new Date().toISOString(), browser: browser.version(),
  backend: await page.locator('html').getAttribute('data-backend'), errors,
  frames: { samples: steady.length, medianMs: steady[Math.floor(steady.length / 2)], p95Ms: steady[Math.floor(steady.length * 0.95)] },
  limitations: 'One local headless browser with native GPU. Includes capture/resizing work; no physical-device or all-device FPS claim.',
};
await writeFile(join(destination, 'capture-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
const video = page.video();
await context.close();
await video.saveAs(join(destination, 'motion-review.webm'));
await video.delete();
await browser.close();
console.log(JSON.stringify(manifest, null, 2));
