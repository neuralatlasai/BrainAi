import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRibbonGeometry, evaluateRibbonPose } from '../src/scene/geometry/ribbonGeometry.ts';

const sub = (a, b) => a.map((value, i) => value - b[i]);
const add = (a, b) => a.map((value, i) => value + b[i]);
const scale = (a, scalar) => a.map((value) => value * scalar);
const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a) => scale(a, 1 / Math.max(1e-20, Math.hypot(...a)));
const epsilon = 0.00001;
const samples = 1024;
const results = [];
for (const pose of ['hero', 'wave', 'closing']) {
  const center = (u) => scale(add(evaluateRibbonPose(pose, u, 1), evaluateRibbonPose(pose, u, -1)), 0.5);
  let minimumJacobianRatio = Infinity, reversedSamples = 0;
  let baselineSamplingReversedSamples = 0, baselineSamplingMinimumRawJacobian = Infinity;
  let worst;
  for (let i = 0; i < samples; i++) {
    const u = i / samples;
    const tangent = unit(sub(center(u + epsilon), center(u - epsilon)));
    const direction = unit(sub(evaluateRibbonPose(pose, u, 1), evaluateRibbonPose(pose, u, -1)));
    const normal = cross(tangent, direction);
    const centerSpeed = Math.hypot(...sub(center(u + epsilon), center(u - epsilon))) / (2 * epsilon);
    const width = Math.hypot(...sub(evaluateRibbonPose(pose, u, 1), evaluateRibbonPose(pose, u, -1))) * 0.5;
    for (const side of [-1, 1]) for (let j = -19; j <= 19; j++) {
      const v = j / 20;
      const du = scale(sub(evaluateRibbonPose(pose, u + epsilon, v, side), evaluateRibbonPose(pose, u - epsilon, v, side)), 1 / (2 * epsilon));
      const dv = scale(sub(evaluateRibbonPose(pose, u, v + epsilon, side), evaluateRibbonPose(pose, u, v - epsilon, side)), 1 / (2 * epsilon));
      const ratio = dot(cross(du, dv), normal) / (centerSpeed * width);
      if (side === 1 && j % 2 === 0) {
        if (ratio < 0) baselineSamplingReversedSamples++;
        baselineSamplingMinimumRawJacobian = Math.min(baselineSamplingMinimumRawJacobian, dot(cross(du, dv), normal));
      }
      if (ratio < 0) reversedSamples++;
      if (ratio < minimumJacobianRatio) { minimumJacobianRatio = ratio; worst = { u, v, side }; }
    }
  }
  results.push({ pose, minimumJacobianRatio, reversedSamples, baselineSamplingReversedSamples, baselineSamplingMinimumRawJacobian, worst });
  assert.equal(reversedSamples, 0, `${pose}: no swept-face foldover`);
  assert.ok(minimumJacobianRatio > 0.1, `${pose}: positive longitudinal Jacobian margin`);
}

const geometry = createRibbonGeometry({ longitudinalSegments: samples, widthSegments: 24 });
const visibleIntermediateChecks = [];
for (const fraction of [0.25, 0.5, 0.75]) {
  const point = (u, v, side = 1) => add(scale(evaluateRibbonPose('hero', u, v, side), 1 - fraction), scale(evaluateRibbonPose('wave', u, v, side), fraction));
  const center = (u) => scale(add(point(u, 1), point(u, -1)), 0.5);
  let visibleSamples = 0, reversedSamples = 0, minimumRawJacobian = Infinity;
  let worst;
  for (let i = 0; i < samples; i++) {
    const u = i / samples;
    const tangent = unit(sub(center(u + epsilon), center(u - epsilon)));
    const direction = unit(sub(point(u, 1), point(u, -1)));
    const normal = cross(tangent, direction);
    for (const side of [-1, 1]) for (let j = -19; j <= 19; j++) {
      const v = j / 20;
      const p = point(u, v, side);
      if (p[1] <= -2.615) continue;
      visibleSamples++;
      const du = scale(sub(point(u + epsilon, v, side), point(u - epsilon, v, side)), 1 / (2 * epsilon));
      const dv = scale(sub(point(u, v + epsilon, side), point(u, v - epsilon, side)), 1 / (2 * epsilon));
      const jacobian = dot(cross(du, dv), normal);
      if (jacobian < 0) reversedSamples++;
      if (jacobian < minimumRawJacobian) { minimumRawJacobian = jacobian; worst = { u, v, side, worldY: p[1] }; }
    }
  }
  visibleIntermediateChecks.push({ fraction, visibleSamples, reversedSamples, minimumRawJacobian, worst });
  if (reversedSamples) console.error(JSON.stringify(visibleIntermediateChecks.at(-1)));
  assert.equal(reversedSamples, 0, `No visible interpolated foldover at ${fraction}`);
}
const adjacent = [];
for (let pose = 0; pose < 5; pose++) {
  const position = pose === 0 ? geometry.attributes.position : geometry.morphAttributes.position[pose - 1];
  const normal = pose === 0 ? geometry.attributes.normal : geometry.morphAttributes.normal[pose - 1];
  let maximumPositionStep = 0, maximumNormalStepDegrees = 0, worstNormalStep;
  for (let i = 0; i < samples; i++) for (let j = 0; j < 49; j++) {
    const a = i * 49 + j, b = a + 49;
    maximumPositionStep = Math.max(maximumPositionStep, Math.hypot(position.getX(a) - position.getX(b), position.getY(a) - position.getY(b), position.getZ(a) - position.getZ(b)));
    const product = normal.getX(a) * normal.getX(b) + normal.getY(a) * normal.getY(b) + normal.getZ(a) * normal.getZ(b);
    const degrees = Math.acos(Math.max(-1, Math.min(1, product))) * 180 / Math.PI;
    if (degrees > maximumNormalStepDegrees) { maximumNormalStepDegrees = degrees; worstNormalStep = { u: i / samples, q: j / 48, maxWorldY: Math.max(position.getY(a), position.getY(b)) }; }
  }
  adjacent.push({ pose: ['hero', 'spatial', 'unfold', 'wave', 'closing'][pose], maximumPositionStep, maximumNormalStepDegrees, worstNormalStep });
  assert.ok(maximumPositionStep < 0.2, 'No unstable fixed-reference frame position jumps');
  if (pose < 2) assert.ok(maximumNormalStepDegrees < 8, 'Hero fold has smooth adjacent normals');
}
geometry.dispose();
const report = { checkedAt: new Date().toISOString(), result: 'passed', samples, baselineBeforeRepair: { sampling: '1024 longitudinal samples; v -0.9..0.9 in 0.1 increments; positive face', heroReversedSamples: 317, heroMinimumRawJacobian: -6.6964444485054795, heroMaximumNormalStepDegrees: 17.23518797842409, waveMaximumPositionStep: 0.8652881272222201 }, faceChecks: results, visibleIntermediateChecks, stageFloorCutoffY: -2.615, adjacent, limitations: 'Local sweep foldover and frame continuity checks; nonlocal occlusion and interpolated poses also require visual review. Interpolated return remains concealed below the stage floor.' };
await mkdir('docs/revision', { recursive: true });
await writeFile('docs/revision/geometry-surface-checks.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
