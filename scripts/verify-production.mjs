import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const installed = join(process.env.PROGRAMFILES ?? 'C:\\Program Files', 'Google/Chrome/Application/chrome.exe');
const browser = await chromium.launch({ headless: true, ...(existsSync(installed) ? { executablePath: installed } : {}) });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
const errors = [], failedResponses = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('response', (response) => { if (response.status() >= 400) failedResponses.push({ url: response.url(), status: response.status() }); });
await mkdir('docs/review', { recursive: true });
try {
  await page.goto(process.env.BRAIN_PRODUCTION_URL ?? 'http://127.0.0.1:4174/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-renderer-status="ready"]').waitFor({ timeout: 45_000 });
  assert.equal(await page.locator('canvas').count(), 1);
  assert.equal(await page.evaluate(() => typeof window.__BRAIN__), 'undefined', 'Development capture API must not ship');
  await page.getByTestId('query-button').click();
  await page.getByTestId('query-input').fill('Production smoke test');
  await page.getByTestId('query-submit').click();
  assert.equal(await page.locator('[data-experience-state="error"]').count(), 1);
  await page.keyboard.press('Escape');
  await page.getByTestId('chapter-2').click();
  await page.waitForFunction(() => document.querySelector('[data-testid="chapter-2"]')?.getAttribute('aria-current') === 'step');
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 800)));
  await page.screenshot({ path: 'docs/review/production-surface.png' });
  await page.getByTestId('chapter-3').click();
  await page.waitForFunction(() => document.querySelector('[data-testid="chapter-3"]')?.getAttribute('aria-current') === 'step');
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 800)));
  await page.screenshot({ path: 'docs/review/production-stillness.png' });
  const resources = await page.evaluate(() => performance.getEntriesByType('resource').map(({ name, encodedBodySize, transferSize }) => ({ name, encodedBodySize, transferSize })));
  const result = { checkedAt: new Date().toISOString(), result: 'passed', browser: browser.version(), url: page.url(), assertions: ['Production scene ready', 'Exactly one canvas', 'No development capture API', 'Honest local query boundary', 'Surface chapter navigation'], errors, failedResponses, resources, limitations: 'One local production build on installed Chrome. Transfer bytes reflect local preview server settings.' };
  assert.deepEqual(errors, []);
  assert.deepEqual(failedResponses, []);
  await writeFile('docs/review/production-checks.json', JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ result: result.result, assertions: result.assertions, errors, failedResponses }, null, 2));
} finally {
  await browser.close();
}
