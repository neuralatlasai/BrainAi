import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const installed = join(process.env.PROGRAMFILES ?? 'C:\\Program Files', 'Google/Chrome/Application/chrome.exe');
const browser = await chromium.launch({ headless: true, ...(existsSync(installed) ? { executablePath: installed } : {}) });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  await page.goto('http://127.0.0.1:4173/');
  await page.locator('[data-renderer-status="ready"]').waitFor({ timeout: 45_000 });
  await page.evaluate(() => window.__BRAIN__.capture(1.5));
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(done)))));
  await page.screenshot({ path: process.argv[2] ?? 'docs/revision/transition-inspection.png' });
} finally {
  await browser.close();
}
