import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRibbonGeometry, RIBBON_MORPH_NAMES } from '../src/scene/geometry/ribbonGeometry.ts';

const longitudinal = 256;
const perimeter = 48;
const geometry = createRibbonGeometry({ longitudinalSegments: longitudinal, widthSegments: perimeter / 2 });
const positions = [geometry.attributes.position, ...geometry.morphAttributes.position];
const normals = [geometry.attributes.normal, ...geometry.morphAttributes.normal];
assert.equal(positions.length, 5, 'Hero plus four corresponding authored poses');
assert.equal(geometry.morphTargetsRelative, false, 'Absolute corresponding morph positions');
const report = [];
function distance(attribute, a, b) {
  return Math.hypot(attribute.getX(a) - attribute.getX(b), attribute.getY(a) - attribute.getY(b), attribute.getZ(a) - attribute.getZ(b));
}
for (let pose = 0; pose < positions.length; pose++) {
  const position = positions[pose], normal = normals[pose];
  assert.equal(position.count, positions[0].count, 'Corresponding vertex count');
  let maxNormalError = 0, maxSeamError = 0;
  for (let i = 0; i < position.count; i++) {
    assert.ok([position.getX(i), position.getY(i), position.getZ(i)].every(Number.isFinite), 'Finite vertex');
    const length = Math.hypot(normal.getX(i), normal.getY(i), normal.getZ(i));
    assert.ok(Number.isFinite(length), 'Finite normal');
    maxNormalError = Math.max(maxNormalError, Math.abs(length - 1));
  }
  for (let i = 0; i <= longitudinal; i++) maxSeamError = Math.max(maxSeamError, distance(position, i * (perimeter + 1), i * (perimeter + 1) + perimeter));
  for (let j = 0; j <= perimeter; j++) maxSeamError = Math.max(maxSeamError, distance(position, j, longitudinal * (perimeter + 1) + j));
  assert.ok(maxNormalError < 1e-5, 'Unit normals');
  assert.ok(maxSeamError < 1e-6, 'Closed cross-section and longitudinal seams');
  report.push({ pose: pose ? RIBBON_MORPH_NAMES[pose - 1] : 'hero', vertices: position.count, maxNormalError, maxSeamError });
}
let midpointError = 0;
for (let i = 0; i < positions[0].array.length; i++) midpointError = Math.max(midpointError, Math.abs(positions[2].array[i] - (positions[0].array[i] + positions[3].array[i]) / 2));
assert.ok(midpointError < 1e-6, 'Unfold matches continuous hero/wave vertex correspondence');
const result = { checkedAt: new Date().toISOString(), result: 'passed', midpointError, poses: report, limitations: 'Numeric topology/normal invariants; visible self-intersections require the independent browser pose review.' };
await mkdir('docs/review', { recursive: true });
await writeFile('docs/review/geometry-checks.json', JSON.stringify(result, null, 2) + '\n');
geometry.dispose();
console.log(JSON.stringify(result, null, 2));
