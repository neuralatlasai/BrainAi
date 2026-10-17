import { Vector3 } from 'three';
import gsap from 'gsap';

export const chapters = [
  { id: 'form', name: 'Form', description: 'An asymmetric pearl ribbon, folded around an open center.' },
  { id: 'space', name: 'Space', description: 'The form recedes into a quiet, curved architectural setting.' },
  { id: 'surface', name: 'Surface', description: 'The same ribbon unfolds into an expansive sculptural wave.' },
  { id: 'stillness', name: 'Stillness', description: 'The surface settles into a quiet sculptural platform.' },
] as const;

export interface SceneFrame {
  camera: Vector3;
  lookAt: Vector3;
  objectScale: number;
  wave: number;
  unfold: number;
  closing: number;
  architecture: number;
}

const desktopCameras = [
  new Vector3(0, 0.4, 11.8),
  new Vector3(0.7, 1.15, 20),
  new Vector3(0, 2.4, 13.4),
  new Vector3(0, 8, 14),
];
const mobileCameras = [
  new Vector3(0, 0.65, 26.5),
  new Vector3(0.3, 1.7, 26),
  new Vector3(0, 3, 22),
  new Vector3(0, 10, 28),
];
const lookAts = [new Vector3(0, -0.55, 0), new Vector3(0, -0.4, 0), new Vector3(0, -0.25, 0), new Vector3(0, -0.55, 0)];

/** One paused timeline evaluates mutable scene parameters, never Three object transforms. */
export function createStoryboard(mobile: boolean) {
  const cameras = mobile ? mobileCameras : desktopCameras;
  const frame: SceneFrame = {
    camera: cameras[0].clone(), lookAt: lookAts[0].clone(),
    objectScale: 1, wave: 0, unfold: 0, closing: 0, architecture: 0,
  };
  const timeline = gsap.timeline({ paused: true, defaults: { ease: 'sine.inOut', duration: 1 } });
  for (let i = 0; i < 3; i++) {
    timeline.to(frame.camera, { x: cameras[i + 1].x, y: cameras[i + 1].y, z: cameras[i + 1].z }, i);
    timeline.to(frame.lookAt, { x: lookAts[i + 1].x, y: lookAts[i + 1].y, z: lookAts[i + 1].z }, i);
  }
  timeline.to(frame, { objectScale: 0.92, architecture: 1 }, 0);
  timeline.to(frame, { objectScale: 1.12, architecture: 0.45 }, 1);
  timeline.to(frame, { unfold: 1, duration: 0.5 }, 1);
  timeline.to(frame, { unfold: 0, wave: 1, duration: 0.5 }, 1.5);
  timeline.to(frame, { objectScale: 1, wave: 0, closing: 1, architecture: 0.3 }, 2);
  return { timeline, frame };
}

export const directorInput = { target: 0, pointerX: 0, pointerY: 0, capture: false, frameTimes: [] as number[], ambientTime: 0, rotationY: 0, deformation: 0 };
