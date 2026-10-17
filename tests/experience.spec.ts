import { expect, test } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

declare global {
  interface Window {
    __BRAIN__?: {
      capture: (position: number) => void;
      resume: () => void;
      frameTimes: () => number[];
      motion: () => { time: number; rotationY: number; deformation: number };
    };
  }
}

const chapterNames = ['Form', 'Space', 'Surface', 'Stillness'] as const;
const chapterIds = ['form', 'space', 'surface', 'stillness'] as const;

async function motionSnapshot(page: Page) {
  await expect.poll(() => page.evaluate(() => typeof window.__BRAIN__?.motion)).toBe('function');
  const sample = await page.evaluate(() => window.__BRAIN__!.motion());
  expect(Object.values(sample).every(Number.isFinite), 'Motion diagnostics contain finite numeric values').toBe(true);
  return sample;
}

function expectMotionAdvanced(before: Awaited<ReturnType<typeof motionSnapshot>>, after: Awaited<ReturnType<typeof motionSnapshot>>) {
  expect(after.time, 'Ambient clock advances without an interaction').toBeGreaterThan(before.time + 0.1);
  expect(Math.max(Math.abs(after.rotationY - before.rotationY), Math.abs(after.deformation - before.deformation)), 'Rotation or deformation visibly evolves with the clock').toBeGreaterThan(0.0001);
}

async function openExperience(page: Page, query = '') {
  await page.goto(`/${query}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('query-button')).toBeVisible();
  await expect(page.locator('[data-renderer-status]')).toHaveAttribute('data-renderer-status', 'ready', { timeout: 45_000 });
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.locator('html')).toHaveAttribute('data-backend', /^(webgpu|webgl)$/);
}

async function openQuery(page: Page) {
  await page.getByTestId('query-button').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByTestId('query-input')).toBeFocused();
}

async function captureChapters(page: Page, testInfo: TestInfo, prefix: string) {
  await expect.poll(() => page.evaluate(() => Boolean(window.__BRAIN__))).toBe(true);
  const captures: Array<{ chapter: string; position: number; path: string }> = [];
  const positions = prefix === 'desktop' ? [0, 0.5, 1, 1.5, 2, 2.5, 3] : [0, 1, 2, 3];
  for (const position of positions) {
    const id = Number.isInteger(position) ? chapterIds[position] : `transition-${position}`;
    await page.evaluate((value) => {
      const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-chapter]'));
      const index = Math.floor(value);
      const start = sections[index].getBoundingClientRect().top + scrollY;
      const end = sections[Math.min(3, index + 1)].getBoundingClientRect().top + scrollY;
      window.scrollTo({ top: start + (end - start) * (value - index), behavior: 'instant' });
    }, position);
    if (Number.isInteger(position)) await expect(page.getByTestId(`chapter-${position}`)).toHaveAttribute('aria-current', 'step');
    await page.evaluate((value) => window.__BRAIN__?.capture(value), position);
    // FrameDirector applies the fixed pose on its next frame; wait for presentation.
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))));
    const path = testInfo.outputPath(`${prefix}-${id}.png`);
    await page.screenshot({ path, animations: 'disabled' });
    await testInfo.attach(`${prefix}-${id}`, { path, contentType: 'image/png' });
    captures.push({ chapter: id, position, path });
    await page.evaluate(() => window.__BRAIN__?.resume());
  }
  await testInfo.attach('capture-manifest', {
    body: JSON.stringify({ browser: page.context().browser()?.version(), viewport: page.viewportSize(), backend: await page.locator('html').getAttribute('data-backend'), captures }, null, 2),
    contentType: 'application/json',
  });
}

test('live renderer presents one canvas and deterministic desktop chapter captures', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openExperience(page);
  await expect(page.locator('.scene-poster')).toHaveClass(/is-hidden/);
  await expect(page.locator('canvas')).toBeVisible();
  await captureChapters(page, testInfo, 'desktop');
  await expect(page.locator('canvas')).toHaveCount(1);
  expect(errors, 'Uncaught JavaScript errors').toEqual([]);
  const samples = await page.evaluate(() => window.__BRAIN__?.frameTimes() ?? []);
  await testInfo.attach('frame-times', {
    body: JSON.stringify({ note: 'Descriptive local sample, including startup; not an all-device performance acceptance result.', samples }, null, 2),
    contentType: 'application/json',
  });
  expect(samples.length).toBeGreaterThan(0);
});

test('forced WebGL backend presents the same live experience', async ({ page }, testInfo) => {
  await openExperience(page, '?backend=webgl');
  await expect(page.locator('html')).toHaveAttribute('data-backend', 'webgl');
  await page.evaluate(() => window.__BRAIN__?.capture(0));
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  const path = testInfo.outputPath('webgl-hero.png');
  await page.screenshot({ path });
  await testInfo.attach('webgl-hero', { path, contentType: 'image/png' });
});

test('query draft remains local, reports unavailable service, and restores after reload', async ({ page }) => {
  const submissions: string[] = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) submissions.push(`${request.method()} ${request.url()}`);
  });
  await openExperience(page);
  await openQuery(page);
  const input = page.getByTestId('query-input');
  const submit = page.getByTestId('query-submit');
  await expect(submit).toBeDisabled();
  await input.fill('   ');
  await expect(submit).toBeDisabled();
  const draft = 'How can a single form become a wider surface?';
  await input.fill(draft);
  await submit.click();
  await expect(page.locator('.query-form')).toHaveAttribute('data-experience-state', 'error');
  await expect(page.getByRole('status').filter({ hasText: 'The intelligence service is not connected.' })).toBeVisible();
  await expect(input).toHaveValue(draft);
  expect(await page.evaluate(() => sessionStorage.getItem('brainai.query.draft'))).toBe(draft);
  await expect(page.locator('[data-experience-state="processing"], [data-experience-state="ready"]')).toHaveCount(0);
  expect(submissions).toEqual([]);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('query-button')).toBeVisible();
  await openQuery(page);
  await expect(input).toHaveValue(draft);
  await page.getByRole('button', { name: 'Clear draft', exact: true }).click();
  await expect(input).toHaveValue('');
  expect(await page.evaluate(() => sessionStorage.getItem('brainai.query.draft'))).toBeNull();
});

test('native dialog contains page keyboard focus and Escape restores its invoking control', async ({ page }, testInfo) => {
  await openExperience(page);
  await openQuery(page);
  await page.getByTestId('query-input').fill('A local question');
  const traversal: Array<{ tag: string | undefined; id: string | undefined; inside: boolean; documentFocus: boolean }> = [];
  for (let index = 0; index < 7; index += 1) {
    await page.keyboard.press('Tab');
    const focus = await page.evaluate(() => ({
      tag: document.activeElement?.tagName,
      id: document.activeElement?.id,
      inside: Boolean(document.querySelector('dialog')?.contains(document.activeElement)),
      documentFocus: document.hasFocus(),
    }));
    traversal.push(focus);
    // Chrome's native modal allows Tab into browser chrome. No background page
    // control may receive focus while the document itself owns keyboard focus.
    expect(focus.inside || !focus.documentFocus, JSON.stringify(focus)).toBe(true);
  }
  await testInfo.attach('focus-traversal', { body: JSON.stringify(traversal, null, 2), contentType: 'application/json' });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByTestId('query-button')).toBeFocused();
  await page.getByTestId('menu-button').click();
  await expect(page.getByTestId('menu-chapter-0')).toBeFocused();
  await page.getByTestId('dialog-close').click();
  await expect(page.getByTestId('menu-button')).toBeFocused();
});

test('chapter controls preserve native scroll navigation and immediate return home', async ({ page }) => {
  await openExperience(page);
  await expect(page.getByTestId('next-chapter')).toHaveCount(0);
  await page.getByTestId('chapter-2').click();
  await expect(page.getByTestId('chapter-2')).toHaveAttribute('aria-current', 'step');
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await expect(page.getByTestId('next-chapter')).toHaveCount(0);
  await page.getByTestId('chapter-3').click();
  await expect(page.getByTestId('chapter-3')).toHaveAttribute('aria-current', 'step');
  await expect(page.getByTestId('next-chapter')).toHaveCount(0);
  await page.getByTestId('home-button').click();
  await expect(page.getByTestId('chapter-0')).toHaveAttribute('aria-current', 'step');
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.getByTestId('menu-button').click();
  await page.getByTestId('menu-chapter-1').click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByTestId('chapter-1')).toHaveAttribute('aria-current', 'step');
  await page.mouse.wheel(0, 300);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await expect(page.getByTestId('query-button')).toBeVisible();
});

test('ambient motion starts automatically despite a stale pause preference and exposes no playback button', async ({ page }, testInfo) => {
  // The user explicitly replaced the former persisted-pause requirement with
  // continuous automatic playback and no play button. Keep stale storage as a
  // migration fixture so returning users cannot inherit a frozen hero.
  await page.addInitScript(() => localStorage.setItem('brain-motion', 'paused'));
  await openExperience(page);
  await expect(page.locator('#journey')).not.toHaveClass(/is-static/);
  await expect(page.getByTestId('motion-toggle')).toHaveCount(0);
  await expect(page.getByTestId('menu-motion-toggle')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /\b(play|pause|resume)\b|ambient motion/i, includeHidden: true })).toHaveCount(0);
  const initial = await motionSnapshot(page);
  await page.waitForTimeout(1_000);
  const afterOneSecond = await motionSnapshot(page);
  await page.waitForTimeout(2_000);
  const afterThreeSeconds = await motionSnapshot(page);
  expectMotionAdvanced(initial, afterOneSecond);
  expectMotionAdvanced(afterOneSecond, afterThreeSeconds);
  await testInfo.attach('automatic-motion-samples', {
    body: JSON.stringify({ staleStorageFixture: 'brain-motion=paused', observationDelaysMs: [1_000, 2_000], initial, afterOneSecond, afterThreeSeconds }, null, 2),
    contentType: 'application/json',
  });
  const path = testInfo.outputPath('autoplay-hero.png');
  await page.screenshot({ path });
  await testInfo.attach('autoplay-hero', { path, contentType: 'image/png' });
  await page.getByTestId('menu-button').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: /\b(play|pause|resume)\b|ambient motion/i, includeHidden: true })).toHaveCount(0);
});

test('reduced-motion preference freezes the ambient clock initially and when it changes', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openExperience(page);
  await expect(page.locator('#journey')).toHaveClass(/is-static/);
  const initialReduced = await motionSnapshot(page);
  await page.waitForTimeout(1_000);
  const settledReduced = await motionSnapshot(page);
  expect(settledReduced.time, 'OS reduced-motion freezes ambient clock').toBeCloseTo(initialReduced.time, 3);
  await page.getByTestId('chapter-2').click();
  await expect(page.getByTestId('chapter-2')).toHaveAttribute('aria-current', 'step');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('#journey')).not.toHaveClass(/is-static/);
  const resumed = await motionSnapshot(page);
  await page.waitForTimeout(1_000);
  const advanced = await motionSnapshot(page);
  expectMotionAdvanced(resumed, advanced);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('#journey')).toHaveClass(/is-static/);
  // Allow the preference event to reach the renderer before observing its clock.
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  const reducedAgain = await motionSnapshot(page);
  await page.waitForTimeout(1_000);
  const frozenAgain = await motionSnapshot(page);
  expect(frozenAgain.time, 'Runtime reduced-motion change freezes ambient clock').toBeCloseTo(reducedAgain.time, 3);
  await testInfo.attach('reduced-motion-samples', {
    body: JSON.stringify({ initialReduced, settledReduced, resumed, advanced, reducedAgain, frozenAgain }, null, 2),
    contentType: 'application/json',
  });
});

test('static fallback has chapter compositions and functional navigation', async ({ page }, testInfo) => {
  await page.goto('/?fallback=1', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-renderer-status]')).toHaveAttribute('data-renderer-status', 'fallback');
  await expect(page.locator('#journey')).toHaveClass(/is-static/);
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(page.getByTestId('retry-button')).toBeVisible();
  for (let index = 0; index < chapterNames.length; index += 1) {
    await page.getByTestId(`chapter-${index}`).click();
    await expect(page.getByTestId(`chapter-${index}`)).toHaveAttribute('aria-current', 'step');
    const poster = page.locator('.scene-poster img');
    await expect(poster).toHaveAttribute('src', `/images/${chapterIds[index]}.webp`);
    await expect.poll(() => poster.evaluate((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0)).toBe(true);
  }
  await openQuery(page);
  await page.keyboard.press('Escape');
  const path = testInfo.outputPath('static-stillness.png');
  await page.screenshot({ path });
  await testInfo.attach('static-stillness', { path, contentType: 'image/png' });
});

test('invalid scene asset exhausts one automatic compatibility attempt and keeps a usable poster', async ({ page }, testInfo) => {
  let assetAttempts = 0;
  await page.route('**/models/ribbon.glb', async (route) => {
    assetAttempts += 1;
    await route.fulfill({ status: 200, contentType: 'application/octet-stream', body: 'deliberately invalid glTF data' });
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('query-button')).toBeVisible();
  await expect(page.locator('[data-renderer-status]')).toHaveAttribute('data-renderer-status', 'fallback', { timeout: 45_000 });
  expect(assetAttempts, 'One initial asset load plus one automatic compatibility load').toBe(2);
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(page.locator('.scene-poster')).not.toHaveClass(/is-hidden/);
  await expect.poll(() => page.locator('.scene-poster img').evaluate((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0)).toBe(true);
  await openQuery(page);
  await page.getByTestId('query-input').fill('Can I still use the interface without 3D?');
  await page.getByTestId('query-submit').click();
  await expect(page.locator('.query-form')).toHaveAttribute('data-experience-state', 'error');
  await page.keyboard.press('Escape');
  await page.getByTestId('chapter-3').click();
  await expect(page.getByTestId('chapter-3')).toHaveAttribute('aria-current', 'step');
  await expect(page.locator('.scene-poster img')).toHaveAttribute('src', '/images/stillness.webp');
  await expect(page.getByTestId('retry-button')).toBeVisible();
  await expect(page.locator('[data-renderer-status]')).toHaveAttribute('data-renderer-status', 'fallback');
  expect(assetAttempts, 'No unbounded automatic asset reloads during normal interface use').toBe(2);
  const path = testInfo.outputPath('invalid-asset-static-poster.png');
  await page.screenshot({ path });
  await testInfo.attach('invalid-asset-static-poster', { path, contentType: 'image/png' });
});

test('synthetic WebGL context loss recovers once and retains chapter with automatic motion', async ({ page }, testInfo) => {
  let assetLoads = 0;
  page.on('request', (request) => { if (new URL(request.url()).pathname === '/models/ribbon.glb') assetLoads += 1; });
  await openExperience(page, '?backend=webgl');
  await page.getByTestId('chapter-2').click();
  await expect(page.getByTestId('chapter-2')).toHaveAttribute('aria-current', 'step');
  await expect.poll(() => page.evaluate(() => Math.abs(scrollY - (document.getElementById('surface')!.getBoundingClientRect().top + scrollY)))).toBeLessThan(1);
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  const oldCanvas = await page.locator('canvas').elementHandle();
  expect(oldCanvas).not.toBeNull();
  await oldCanvas!.evaluate((canvas) => canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
  await expect.poll(() => oldCanvas!.evaluate((canvas) => canvas.isConnected)).toBe(false);
  await expect(page.locator('[data-renderer-status]')).toHaveAttribute('data-renderer-status', 'ready', { timeout: 45_000 });
  await expect(page.locator('html')).toHaveAttribute('data-backend', 'webgl');
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.getByTestId('chapter-2')).toHaveAttribute('aria-current', 'step');
  await expect(page.locator('#journey')).not.toHaveClass(/is-static/);
  const recovered = await motionSnapshot(page);
  await page.waitForTimeout(1_000);
  const recoveredAdvanced = await motionSnapshot(page);
  expectMotionAdvanced(recovered, recoveredAdvanced);
  expect(assetLoads, 'Initial scene and exactly one replacement scene').toBe(2);
  const path = testInfo.outputPath('context-recovered-surface.png');
  await page.screenshot({ path });
  await testInfo.attach('context-recovered-surface', { path, contentType: 'image/png' });
  await testInfo.attach('context-loss-observation', { body: JSON.stringify({ syntheticEvent: true, assetLoads, retainedChapter: 'Surface', automaticMotion: { recovered, recoveredAdvanced } }, null, 2), contentType: 'application/json' });
});

test('quality settings synchronize and persist without breaking controls', async ({ page }) => {
  await openExperience(page);
  await page.getByTestId('menu-button').click();
  const quality = page.getByTestId('quality-menu');
  await expect(quality).toHaveValue('auto');
  await quality.selectOption('low');
  expect(await page.evaluate(() => localStorage.getItem('brain-quality'))).toBe('low');
  await page.keyboard.press('Escape');
  await page.getByTestId('chapter-3').click();
  await expect(page.getByTestId('quality-footer')).toHaveValue('low');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByTestId('menu-button').click();
  await expect(quality).toHaveValue('low');
  await quality.selectOption('high');
  await expect(quality).toHaveValue('high');
  await expect(page.getByTestId('query-button')).toBeVisible();
});

test('mobile chapter frames preserve viewport and operable controls', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await openExperience(page);
  await captureChapters(page, testInfo, 'mobile');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
  await openQuery(page);
  const dialog = await page.getByRole('dialog').boundingBox();
  expect(dialog).not.toBeNull();
  expect(dialog!.x).toBeGreaterThanOrEqual(0);
  expect(dialog!.x + dialog!.width).toBeLessThanOrEqual(394);
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 852, height: 393 });
  await expect(page.getByTestId('query-button')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(852);
});

test('HTML controls and query/navigation dialogs have no scoped axe violations', async ({ page }, testInfo) => {
  await openExperience(page);
  for (const panel of ['controls', 'query', 'navigation', 'closing-footer'] as const) {
    if (panel === 'query') await openQuery(page);
    if (panel === 'navigation') await page.getByTestId('menu-button').click();
    if (panel === 'closing-footer') {
      await page.getByTestId('chapter-3').click();
      await expect(page.getByTestId('chapter-3')).toHaveAttribute('aria-current', 'step');
    }
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    await testInfo.attach(`axe-${panel}`, { body: JSON.stringify(results, null, 2), contentType: 'application/json' });
    expect.soft(results.violations, `axe violations for ${panel}; canvas visual meaning still needs manual review`).toEqual([]);
    if (panel === 'query' || panel === 'navigation') await page.keyboard.press('Escape');
  }
});
