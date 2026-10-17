import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, Mesh, PerspectiveCamera, Vector3 } from 'three';
import type { RefObject } from 'react';
import { createStoryboard, directorInput } from '../motion/storyboard';
import { useExperienceStore } from '../state/experienceStore';

interface Props { ribbonRef: RefObject<Mesh | null>; portalRef: RefObject<Mesh | null>; onFirstFrame: () => void; }

export function FrameDirector({ ribbonRef, portalRef, onFirstFrame }: Props) {
  const { camera, size, invalidate, gl, setDpr } = useThree();
  const first = useRef(true);
  const readinessFrames = useRef<number[]>([]);
  const mounted = useRef(true);
  const clock = useRef(0);
  const presentation = useRef(directorInput.target);
  const performanceWindow = useRef({ seconds: 0, frames: 0, slowWindows: 0, lowered: false });
  const pointer = useMemo(() => new Vector3(), []);
  const pointerTarget = useMemo(() => new Vector3(), []);
  const mobile = size.width < 700;
  const { timeline, frame } = useMemo(() => createStoryboard(mobile), [mobile]);
  useEffect(() => () => { timeline.kill(); }, [timeline]);
  useEffect(() => () => {
    mounted.current = false;
    readinessFrames.current.forEach(cancelAnimationFrame);
  }, []);
  useEffect(() => useExperienceStore.subscribe(() => invalidate()), [invalidate]);
  useEffect(() => {
    const update = () => invalidate();
    addEventListener('scroll', update, { passive: true });
    return () => removeEventListener('scroll', update);
  }, [invalidate]);

  useFrame((_, rawDelta) => {
    const state = useExperienceStore.getState();
    const delta = Math.min(rawDelta, 0.05);
    const ambientEnabled = !state.reducedMotion && !directorInput.capture && !document.hidden;
    const staticPosition = state.reducedMotion;
    const target = staticPosition ? Math.round(directorInput.target) : directorInput.target;
    presentation.current = staticPosition || directorInput.capture ? target : MathUtils.damp(presentation.current, target, 6, delta);
    timeline.time(presentation.current, false);
    if (ambientEnabled) clock.current += delta;
    pointerTarget.set(ambientEnabled ? directorInput.pointerX : 0, ambientEnabled ? directorInput.pointerY : 0, 0);
    pointer.lerp(pointerTarget, 1 - Math.exp(-delta * 3));
    camera.position.copy(frame.camera);
    camera.position.x += pointer.x * 0.09;
    camera.position.y += pointer.y * 0.06;
    camera.lookAt(frame.lookAt);
    if (camera instanceof PerspectiveCamera) {
      const fov = size.width < 700 ? 37 : 35;
      if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
    }
    const ribbon = ribbonRef.current;
    if (ribbon) {
      ribbon.scale.setScalar(frame.objectScale);
      const cycle = clock.current * Math.PI / 11;
      ribbon.rotation.y = pointer.x * 0.012 + (ambientEnabled ? Math.sin(cycle) * 0.075 : 0);
      ribbon.rotation.x = pointer.y * 0.008 + (ambientEnabled ? Math.sin(cycle * 0.83 + 0.4) * 0.035 : 0);
      ribbon.position.y = -2.1 * frame.closing + (ambientEnabled ? Math.sin(cycle * 0.73) * 0.035 : 0);
      ribbon.rotation.z = size.width < 700 ? 0.48 * (1 - frame.wave) * (1 - frame.closing) : 0;
      const weights = ribbon.morphTargetInfluences;
      if (weights) {
        const unfold = ambientEnabled ? (Math.sin(cycle) + 1) * 0.0025 * (1 - frame.wave) * (1 - frame.closing) : 0;
        weights[0] = 0;
        weights[1] = frame.unfold + unfold * (1 - frame.unfold);
        weights[2] = frame.wave;
        weights[3] = frame.closing;
        directorInput.deformation = weights[1];
      }
      directorInput.ambientTime = clock.current;
      directorInput.rotationY = ribbon.rotation.y;
    }
    if (portalRef.current) {
      portalRef.current.scale.set(1.6 + (1 - frame.architecture) * 0.5, 0.85 + (1 - frame.architecture) * 0.8, 1);
      portalRef.current.position.y = 3.2 + (1 - frame.architecture) * 4.5;
    }
    if (first.current) {
      first.current = false;
      // Reveal only after the browser has had a frame to present the rendered scene.
      readinessFrames.current.push(requestAnimationFrame(() => {
        if (!mounted.current) return;
        readinessFrames.current.push(requestAnimationFrame(() => {
          if (mounted.current) onFirstFrame();
        }));
      }));
    }
    if (import.meta.env.DEV && directorInput.frameTimes.length < 600 && rawDelta < 0.5) directorInput.frameTimes.push(rawDelta * 1000);
    if (state.quality === 'auto' && !performanceWindow.current.lowered && ambientEnabled && rawDelta < 0.25) {
      const sample = performanceWindow.current;
      sample.seconds += rawDelta;
      sample.frames++;
      if (sample.seconds > 2) {
        sample.slowWindows = sample.seconds / sample.frames > 0.03 ? sample.slowWindows + 1 : 0;
        sample.seconds = 0;
        sample.frames = 0;
        if (sample.slowWindows >= 3) { setDpr(1); sample.lowered = true; }
      }
    }
    if ('backend' in gl && import.meta.env.DEV) document.documentElement.dataset.backend = (gl as unknown as { backend: { isWebGPUBackend?: boolean } }).backend.isWebGPUBackend ? 'webgpu' : 'webgl';
  });
  return null;
}
