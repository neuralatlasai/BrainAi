import { defineConfig } from '@playwright/test';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const chromeCandidates = [
  process.env.BRAIN_BROWSER_PATH,
  join(process.env.PROGRAMFILES ?? 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  join(process.env['PROGRAMFILES(X86)'] ?? 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  join(process.env.LOCALAPPDATA ?? '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
].filter((candidate): candidate is string => Boolean(candidate));
const executablePath = chromeCandidates.find((candidate) => existsSync(candidate));
const run = process.env.BRAIN_TEST_RUN ?? new Date().toISOString().replace(/[:.]/g, '-');
// Workers reload the config; share the parent's run ID instead of splitting evidence folders.
process.env.BRAIN_TEST_RUN = run;

function filesBelow(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(path) : [path];
  });
}
const candidateFiles = [...filesBelow('src'), ...filesBelow('public'), 'package-lock.json', 'Plan.md']
  .filter((path) => existsSync(path)).sort();
const candidateHashes = Object.fromEntries(candidateFiles.map((path) => [path, createHash('sha256').update(readFileSync(path)).digest('hex')]));

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 12_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  metadata: { browserExecutable: executablePath ?? 'Playwright managed Chromium', candidateAtConfigLoad: candidateHashes },
  outputDir: `test-results/${run}/artifacts`,
  reporter: [
    ['list'],
    ['json', { outputFile: `test-results/${run}/results.json` }],
  ],
  use: {
    baseURL: process.env.BRAIN_BASE_URL ?? 'http://127.0.0.1:4173',
    browserName: 'chromium',
    headless: true,
    viewport: { width: 1440, height: 960 },
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
    launchOptions: {
      ...(executablePath ? { executablePath } : {}),
      args: ['--enable-unsafe-webgpu'],
    },
  },
});
