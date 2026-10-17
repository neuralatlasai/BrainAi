import { BufferAttribute, BufferGeometry, Float32BufferAttribute } from 'three';

/**
 * A single closed, solid ribbon, with corresponding vertices in every pose.
 * The authored loop is intentionally skewed: its upper shoulder sits to the
 * right of the low fold, and its two sides differ in width and depth.
 * Units are metres; Y is up and the principal viewing direction is +Z.
 */
export const RIBBON_MORPH_NAMES = ['spatial', 'unfold', 'wave', 'closing'] as const;
export type RibbonPose = 'hero' | (typeof RIBBON_MORPH_NAMES)[number];
type BaseRibbonPose = Exclude<RibbonPose, 'unfold'>;
export type RibbonPoint = [number, number, number];
export interface RibbonGeometryOptions {
  longitudinalSegments?: number;
  widthSegments?: number;
}

const TAU = Math.PI * 2;
// Third-order harmonics soften a diamond-shaped aperture into continuous
// shoulders. The high right shoulder recedes while the narrow low fold comes
// forward: both silhouette and depth are authored, rather than an oval rotated
// in space. This periodic curve has no interpolation knots or hard cusps.
function heroCenter(u: number): RibbonPoint {
  const t = TAU * u;
  const upperShoulderShift = 0.3 * ((1 + Math.sin(t)) * 0.5) ** 2;
  return [
    2.95 * Math.cos(t) + 0.55 * Math.sin(t) + 0.16 * Math.sin(2 * t) - 0.08 * Math.cos(2 * t) - 0.12 + upperShoulderShift,
    1.5 * Math.sin(t) + 0.37 * Math.cos(t) - 0.05 * Math.cos(2 * t) - 0.25 * ((1 - Math.sin(t)) * 0.5) ** 2 - 0.4,
    -0.85 * Math.sin(2 * t) - 0.55 * Math.sin(t) + 0.23 * Math.cos(t),
  ];
}
// The front half unfolds into one broad wave. Its intact return travels
// behind the architecture, rather than being cut away or swapped for a plane.
const WAVE: readonly RibbonPoint[] = [
  [14, -0.35, 0], [10.5, -0.15, 0.2], [7, -1.0, 0.25], [3.5, -0.1, 0.1],
  [0, 0.8, 0], [-3.5, -0.4, 0.2], [-7, -0.9, 0.15], [-10.5, -0.1, 0.1],
  [-14, 0.65, 0], [-16.5, -0.3, -1.5], [-11.5, -0.7, -3.2], [-5.5, -0.15, -3.7],
  [0, 0.35, -3.8], [5.5, -0.8, -3.5], [11.5, -0.25, -3.1], [16.5, -0.15, -1.3],
];

const add = (a: RibbonPoint, b: RibbonPoint): RibbonPoint => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: RibbonPoint, s: number): RibbonPoint => [a[0] * s, a[1] * s, a[2] * s];
const sub = (a: RibbonPoint, b: RibbonPoint): RibbonPoint => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: RibbonPoint, b: RibbonPoint) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: RibbonPoint, b: RibbonPoint): RibbonPoint => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: RibbonPoint): RibbonPoint => scale(a, 1 / Math.max(1e-20, Math.hypot(...a)));
const mix = (a: RibbonPoint, b: RibbonPoint, t: number): RibbonPoint => add(scale(a, 1 - t), scale(b, t));
const wrap = (u: number) => ((u % 1) + 1) % 1;
const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const curveTangents = new WeakMap<readonly RibbonPoint[], RibbonPoint[]>();

/** Periodic C2 interpolating cubic: no second-derivative jumps at pose knots. */
function curve(points: readonly RibbonPoint[], u: number): RibbonPoint {
  const x = wrap(u) * points.length;
  const k = Math.floor(x);
  const t = x - k;
  const n = points.length;
  const p1 = points[k % n]!;
  const p2 = points[(k + 1) % n]!;
  let tangents = curveTangents.get(points);
  if (!tangents) {
    const matrix = points.map((_, i) => {
      const row = new Array<number>(n + 3).fill(0);
      row[i] = 4;
      row[(i + n - 1) % n] = 1;
      row[(i + 1) % n] = 1;
      for (let axis = 0; axis < 3; axis++) row[n + axis] = 3 * (points[(i + 1) % n]![axis]! - points[(i + n - 1) % n]![axis]!);
      return row;
    });
    for (let column = 0; column < n; column++) {
      const divisor = matrix[column]![column]!;
      for (let j = column; j < n + 3; j++) matrix[column]![j]! /= divisor;
      for (let row = 0; row < n; row++) if (row !== column) {
        const factor = matrix[row]![column]!;
        for (let j = column; j < n + 3; j++) matrix[row]![j]! -= factor * matrix[column]![j]!;
      }
    }
    tangents = matrix.map((row) => row.slice(n) as RibbonPoint);
    curveTangents.set(points, tangents);
  }
  const m1 = tangents[k % n]!;
  const m2 = tangents[(k + 1) % n]!;
  return [0, 1, 2].map((axis) => {
    const b = p1[axis]!;
    const c = p2[axis]!;
    return (2 * t ** 3 - 3 * t ** 2 + 1) * b + (t ** 3 - 2 * t ** 2 + t) * m1[axis]! + (-2 * t ** 3 + 3 * t ** 2) * c + (t ** 3 - t ** 2) * m2[axis]!;
  }) as RibbonPoint;
}

function center(pose: BaseRibbonPose, u: number): RibbonPoint {
  if (pose === 'hero' || pose === 'spatial') return heroCenter(u);
  if (pose === 'wave') return curve(WAVE, u);
  if (pose === 'closing') {
    const t = TAU * u;
    const hiddenRearFold = Math.exp(10 * (Math.cos(t - Math.PI * 1.5) - 1));
    return [14 * Math.cos(t), -2.25 - 4.8 * hiddenRearFold, 7 * Math.sin(t) - 2];
  }
  return heroCenter(u);
}

function heroWidth(u: number) {
  const t = TAU * u;
  const leftShoulder = Math.exp(3 * (Math.cos(t - 2.6) - 1));
  const lowFold = Math.exp(5 * (Math.cos(t - 4.6) - 1));
  return 1.08 + 0.14 * Math.cos(t) + 0.05 * Math.sin(t) + 0.14 * leftShoulder - 0.24 * lowFold;
}

const transportedFrames = new Map<BaseRibbonPose, RibbonPoint[]>();
const FRAME_SAMPLES = 4096;
const heroTwist = (u: number) => TAU * u - 0.55 + 0.12 * Math.sin(TAU * u) + 0.12 * Math.sin(2 * TAU * u);
let waveRightAlignment: number | undefined;
function referenceDirection(pose: BaseRibbonPose, u: number, tangent: RibbonPoint) {
  const key = pose === 'spatial' ? 'hero' : pose;
  let directions = transportedFrames.get(key);
  if (!directions) {
    const tangentAt = (at: number) => unit(sub(center(key, at + 0.00002), center(key, at - 0.00002)));
    const initialTangent = tangentAt(0);
    let previousTangent = initialTangent;
    const initialDirection: RibbonPoint = key === 'closing' ? [1, 0, 0] : [initialTangent[1], -initialTangent[0], 0];
    let direction = unit(sub(initialDirection, scale(initialTangent, dot(initialDirection, initialTangent))));
    directions = [direction];
    for (let i = 1; i <= FRAME_SAMPLES; i++) {
      const nextTangent = tangentAt(i / FRAME_SAMPLES);
      const rotation = cross(previousTangent, nextTangent);
      const sine = Math.hypot(...rotation);
      const cosine = Math.max(-1, Math.min(1, dot(previousTangent, nextTangent)));
      if (sine > 1e-12) {
        const axis = scale(rotation, 1 / sine);
        direction = add(add(scale(direction, cosine), scale(cross(axis, direction), sine)), scale(axis, dot(axis, direction) * (1 - cosine)));
      }
      direction = unit(sub(direction, scale(nextTangent, dot(direction, nextTangent))));
      directions.push(direction);
      previousTangent = nextTangent;
    }
    const closureAngle = Math.atan2(dot(initialTangent, cross(directions[FRAME_SAMPLES]!, directions[0]!)), dot(directions[FRAME_SAMPLES]!, directions[0]!));
    directions = directions.map((direction, i) => {
      const axis = tangentAt(i / FRAME_SAMPLES);
      const angle = closureAngle * i / FRAME_SAMPLES;
      return add(scale(direction, Math.cos(angle)), scale(cross(axis, direction), Math.sin(angle)));
    });
    transportedFrames.set(key, directions);
  }
  const sample = wrap(u) * FRAME_SAMPLES;
  const i = Math.floor(sample);
  const interpolated = mix(directions[i]!, directions[i + 1]!, sample - i);
  return unit(sub(interpolated, scale(tangent, dot(interpolated, tangent))));
}

function frame(pose: BaseRibbonPose, u: number) {
  const p = center(pose, u);
  const tangent = unit(sub(center(pose, u + 0.00008), center(pose, u - 0.00008)));
  // Parallel transport introduces the least possible frame rotation through
  // a bend, including the near-vertical shoulder. Distributed closure keeps
  // the entire framing periodic without any fixed-axis projection singularity.
  const radial = referenceDirection(pose, u, tangent);
  const binormal = unit(cross(tangent, radial));
  // The two edge-on folds sit close to the apex and low point; the full blue
  // face opens along the right shoulder and the warm reverse along the left.
  const twist = heroTwist(u);
  const heroDirection = add(scale(radial, Math.cos(twist)), scale(binormal, Math.sin(twist)));

  const returnAmount = smooth(0.46, 0.61, wrap(u)) * (1 - smooth(0.88, 1, wrap(u)));
  let width = heroWidth(u);
  let direction = heroDirection;
  if (pose !== 'hero' && pose !== 'spatial') {
    const isClosing = pose === 'closing';
    // The front span follows the hero's upper half (right -> left). Its width
    // coordinate points down/back, matching that half's signed orientation.
    let waveDirection = isClosing ? radial : unit(add(scale(radial, -0.64), scale(binormal, 0.77)));
    const waveNormal = unit(cross(tangent, waveDirection));
    // The existing full turn is parked in the concealed return, preserving
    // the strip's framing while the visible half becomes a broad surface.
    const returnTwist = TAU * smooth(isClosing ? 0.66 : 0.52, isClosing ? 0.84 : 0.64, wrap(u));
    // Match the hero's frame through the far right connector. Once beyond
    // that connector the visible wave settles into its broad down/back face.
    if (!isClosing && waveRightAlignment === undefined) {
      const heroTangent = unit(sub(heroCenter(0.00008), heroCenter(-0.00008)));
      const heroRadial = referenceDirection('hero', 0, heroTangent);
      const heroNormal = cross(heroTangent, heroRadial);
      const authoredDirection = add(scale(heroRadial, Math.cos(heroTwist(0))), scale(heroNormal, Math.sin(heroTwist(0))));
      const waveTangent = unit(sub(center('wave', 0.00008), center('wave', -0.00008)));
      const waveRadial = referenceDirection('wave', 0, waveTangent);
      const initialWaveDirection = unit(add(scale(waveRadial, -0.64), scale(cross(waveTangent, waveRadial), 0.77)));
      const projectedHero = unit(sub(authoredDirection, scale(waveTangent, dot(authoredDirection, waveTangent))));
      waveRightAlignment = Math.atan2(dot(waveTangent, cross(initialWaveDirection, projectedHero)), dot(initialWaveDirection, projectedHero)) - 0.23 * Math.sin(0.5);
    }
    const endpointAlignment = isClosing ? 0 : waveRightAlignment! * Math.exp(30 * (Math.cos(TAU * u) - 1));
    const bend = returnTwist + (isClosing ? 0.07 * Math.sin(TAU * u * 2) : 0.23 * Math.sin(TAU * u * 2 + 0.5)) + endpointAlignment;
    waveDirection = add(scale(waveDirection, Math.cos(bend)), scale(waveNormal, Math.sin(bend)));
    const visibleWidth = isClosing ? 4.2 : 1.8 + 0.15 * Math.cos(TAU * u * 2);
    const rearWidth = isClosing ? 0.9 : 1.45;
    const targetWidth = visibleWidth * (1 - returnAmount) + rearWidth * returnAmount;
    direction = waveDirection;
    width = targetWidth;
  }
  direction = unit(sub(direction, scale(tangent, dot(direction, tangent))));
  const normal = unit(cross(tangent, direction));
  // The broad faces gently cup in opposite directions above and below. At the
  // lower turn that cupping lifts the inner silhouette while the two edges
  // meet in the narrow low fold, rather than drawing a uniform oval band.
  const shoulderCrown = 0.32 * Math.exp(3 * (Math.cos(TAU * u) - 1));
  let camber = pose === 'hero' || pose === 'spatial' ? 0.1 + 0.28 * Math.sin(TAU * u) + shoulderCrown : pose === 'closing' ? 0.16 : 0.1;
  // A swept strip folds through itself if its width exceeds the local bend
  // radius. Reserve a positive longitudinal Jacobian across the entire face,
  // smoothly tapering only tight folds; crown and thickness share that budget.
  const epsilon = 0.0002;
  const before = center(pose, u - epsilon);
  const after = center(pose, u + epsilon);
  const derivative = scale(sub(after, before), 1 / (2 * epsilon));
  const second = scale(sub(add(after, before), scale(p, 2)), 1 / epsilon ** 2);
  const speedSquared = Math.max(1e-12, dot(derivative, derivative));
  const widthCurvature = Math.abs(dot(second, direction) / speedSquared);
  const normalCurvature = Math.abs(dot(second, normal) / speedSquared);
  width /= (1 + (width * widthCurvature / 0.68) ** 8) ** 0.125;
  camber /= (1 + (Math.abs(camber) * normalCurvature / 0.14) ** 8) ** 0.125;
  return { p, direction, normal, width, camber, thickness: 0.032 + 0.006 * Math.sin(TAU * u + 0.4) };
}

/**
 * Evaluates the broad face of the rounded rectangular strip. `v` is the
 * transverse coordinate [-1,1]; `side` selects its two faces. Use the geometry
 * factory for seamless rounded edges and correctly differentiated normals.
 */
export function evaluateRibbonPose(pose: RibbonPose, u: number, v: number, side = 1): RibbonPoint {
  if (pose === 'unfold') return mix(evaluateRibbonPose('hero', u, v, side), evaluateRibbonPose('wave', u, v, side), 0.5);
  const f = frame(pose, u);
  const transverse = Math.max(-1, Math.min(1, v));
  const depth = side * f.thickness * Math.pow(Math.max(0, 1 - transverse ** 4), 0.25);
  return add(f.p, add(scale(f.direction, transverse * f.width), scale(f.normal, f.camber * (1 - transverse ** 2) * (1 + 0.35 * transverse) + depth)));
}

function surface(pose: RibbonPose, u: number, q: number): RibbonPoint {
  // A genuine vertex midpoint preserves both correspondence and the entire
  // direct morph path. Interpolating then normalizing antipodal frame vectors
  // would instead manufacture tight curls that do not exist in either pose.
  if (pose === 'unfold') return mix(surface('hero', u, q), surface('wave', u, q), 0.5);
  const theta = q * TAU;
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const f = frame(pose, u);
  // Superellipse cross-section: wide satin faces, a shallow visible thickness,
  // and rounded edges rather than infinitely thin, double-sided triangles.
  const v = Math.sign(c) * Math.sqrt(Math.abs(c));
  const d = Math.sign(s) * Math.sqrt(Math.abs(s));
  return add(f.p, add(scale(f.direction, v * f.width), scale(f.normal, f.camber * (1 - v ** 2) * (1 + 0.35 * v) + d * f.thickness)));
}

function poseAttributes(pose: RibbonPose, longitudinal: number, perimeter: number) {
  const count = (longitudinal + 1) * (perimeter + 1);
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  const epsilon = 0.00004;
  let at = 0;
  for (let i = 0; i <= longitudinal; i++) {
    const u = i / longitudinal;
    for (let j = 0; j <= perimeter; j++) {
      const q = j / perimeter;
      const p = surface(pose, u, q);
      const du = sub(surface(pose, u + epsilon, q), surface(pose, u - epsilon, q));
      const dq = sub(surface(pose, u, q + epsilon), surface(pose, u, q - epsilon));
      const n = unit(cross(dq, du));
      positions.set(p, at);
      normals.set(n, at);
      at += 3;
    }
  }
  const position = new Float32BufferAttribute(positions, 3);
  const normal = new Float32BufferAttribute(normals, 3);
  position.name = pose;
  normal.name = pose;
  return { position, normal };
}

export function createRibbonGeometry(options: RibbonGeometryOptions = {}): BufferGeometry {
  const longitudinal = Math.max(48, Math.floor(options.longitudinalSegments ?? 512));
  // Four equal cross-section quadrants guarantee exact broad-face/edge samples.
  const perimeter = Math.max(12, Math.ceil((options.widthSegments ?? 24) / 2) * 4);
  const columns = perimeter + 1;
  const uv = new Float32Array((longitudinal + 1) * columns * 2);
  const surfaceSide = new Float32Array((longitudinal + 1) * columns);
  const indices: number[] = [];
  for (let i = 0; i <= longitudinal; i++) {
    for (let j = 0; j <= perimeter; j++) {
      const theta = (j / perimeter) * TAU;
      const v = Math.sign(Math.cos(theta)) * Math.sqrt(Math.abs(Math.cos(theta)));
      const at = i * columns + j;
      uv[at * 2] = i / longitudinal;
      uv[at * 2 + 1] = (v + 1) * 0.5;
      surfaceSide[at] = Math.sin(theta) >= 0 ? 1 : -1;
      if (i < longitudinal && j < perimeter) {
        const a = at;
        const b = at + 1;
        const c = at + columns;
        const d = c + 1;
        indices.push(a, b, c, b, d, c);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.name = 'Pearl ribbon · authored closed strip';
  const base = poseAttributes('hero', longitudinal, perimeter);
  geometry.setAttribute('position', base.position);
  geometry.setAttribute('normal', base.normal);
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geometry.setAttribute('ribbonSide', new Float32BufferAttribute(surfaceSide, 1));
  const IndexArray = (longitudinal + 1) * columns > 65535 ? Uint32Array : Uint16Array;
  geometry.setIndex(new BufferAttribute(new IndexArray(indices), 1));
  geometry.morphTargetsRelative = false;
  geometry.morphAttributes.position = [];
  geometry.morphAttributes.normal = [];
  for (const pose of RIBBON_MORPH_NAMES) {
    const target = pose === 'spatial' ? { position: base.position.clone(), normal: base.normal.clone() } : poseAttributes(pose, longitudinal, perimeter);
    target.position.name = pose;
    target.normal.name = pose;
    geometry.morphAttributes.position.push(target.position);
    geometry.morphAttributes.normal.push(target.normal);
  }
  geometry.userData = {
    author: 'Brain · parametric sculpture study',
    topology: 'Closed solid ribbon; rounded rectangular cross-section',
    poses: ['hero', ...RIBBON_MORPH_NAMES],
    uv: 'u follows loop; v follows width on both broad faces',
    longitudinalSegments: longitudinal,
    crossSectionSegments: perimeter,
  };
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}
