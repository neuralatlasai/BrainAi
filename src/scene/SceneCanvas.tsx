import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ACESFilmicToneMapping, Color, Mesh } from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createRibbonMaterial, createStudioEnvironment } from './materials/RibbonMaterial';
import { Architecture } from './Architecture';
import { FrameDirector } from './FrameDirector';
import { useExperienceStore } from '../state/experienceStore';
import { directorInput } from '../motion/storyboard';

function World({ onReady, onFailure }: { onReady: () => void; onFailure: () => void }) {
  const [ribbon, setRibbon] = useState<Mesh | null>(null);
  const ribbonRef = useRef<Mesh>(null);
  const portalRef = useRef<Mesh>(null);
  const environment = useMemo(createStudioEnvironment, []);
  useEffect(() => {
    let active = true;
    let loaded: Mesh | null = null;
    const loader = new GLTFLoader();
    loader.load('/models/ribbon.glb', (gltf) => {
      gltf.scene.traverse((node) => { if (node instanceof Mesh && !loaded) loaded = node; });
      if (!loaded) { if (active) onFailure(); return; }
      const mesh = loaded as Mesh;
      const previousMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      previousMaterials.forEach((material) => material.dispose());
      if (!active) { mesh.geometry.dispose(); return; }
      mesh.material = createRibbonMaterial();
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      if (active) setRibbon(mesh);
    }, undefined, () => { if (active) onFailure(); });
    return () => {
      active = false;
      if (loaded) {
        const mesh = loaded as Mesh;
        mesh.geometry.dispose();
        const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        for (const texture of material.userData.ownedTextures ?? []) texture.dispose();
        material.dispose();
      }
      environment.dispose();
    };
  }, [environment, onFailure]);
  return <>
    <primitive object={environment} attach="environment" />
    <ambientLight intensity={0.025} />
    <hemisphereLight args={['#fff8ef', '#8c9da8', 0.34]} />
    <directionalLight position={[-6, 7, 4]} intensity={2.05} color="#fff4e7" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.00015} shadow-normalBias={0.025} shadow-radius={12} shadow-intensity={0.28} shadow-camera-left={-15} shadow-camera-right={15} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-camera-near={0.5} shadow-camera-far={40} />
    <directionalLight position={[6, 3, 2]} intensity={0.72} color="#dbe9f1" />
    <directionalLight position={[-1, 4, -6]} intensity={2.3} color="#fff8ec" />
    <Architecture portalRef={portalRef} />
    {ribbon && <primitive object={ribbon} ref={ribbonRef} />}
    {ribbon && <FrameDirector ribbonRef={ribbonRef} portalRef={portalRef} onFirstFrame={onReady} />}
  </>;
}

export default function SceneCanvas({ onReady, onFailure, compatibility = false }: { onReady: () => void; onFailure: () => void; compatibility?: boolean }) {
  const { reducedMotion, quality } = useExperienceStore();
  const [visible, setVisible] = useState(!document.hidden);
  const alive = useRef(true);
  const removeContextListener = useRef<() => void>(() => {});
  useEffect(() => () => { alive.current = false; removeContextListener.current(); }, []);
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    const pointer = (event: PointerEvent) => {
      if (!matchMedia('(pointer:fine)').matches) return;
      directorInput.pointerX = event.clientX / innerWidth * 2 - 1;
      directorInput.pointerY = 1 - event.clientY / innerHeight * 2;
    };
    const leave = () => { directorInput.pointerX = 0; directorInput.pointerY = 0; };
    document.addEventListener('visibilitychange', update);
    window.addEventListener('pointermove', pointer, { passive: true });
    document.addEventListener('pointerleave', leave);
    return () => { document.removeEventListener('visibilitychange', update); window.removeEventListener('pointermove', pointer); document.removeEventListener('pointerleave', leave); };
  }, []);
  const dpr = quality === 'low' ? 1 : quality === 'high' ? 2 : innerWidth < 700 ? 1.25 : 1.5;
  return <Canvas
    aria-hidden="true"
    camera={{ position: [0, 0.5, 12.8], fov: 35, near: 0.1, far: 180 }}
    dpr={dpr}
    frameloop={visible && !reducedMotion ? 'always' : 'demand'}
    shadows="percentage"
    gl={async (props) => {
      const forceWebGL = compatibility || (import.meta.env.DEV && new URLSearchParams(location.search).get('backend') === 'webgl');
      const renderer = new WebGPURenderer({ canvas: props.canvas as HTMLCanvasElement, antialias: true, alpha: true, forceWebGL });
      renderer.toneMapping = ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.9;
      renderer.setClearColor(new Color('#eae7e1'), 0);
      try { await renderer.init(); }
      catch { renderer.dispose(); queueMicrotask(onFailure); throw new Error('Renderer initialization failed'); }
      const canvas = props.canvas as HTMLCanvasElement;
      const contextLost = (event: Event) => { event.preventDefault(); if (alive.current) onFailure(); };
      canvas.addEventListener('webglcontextlost', contextLost, { once: true });
      removeContextListener.current = () => canvas.removeEventListener('webglcontextlost', contextLost);
      const backend = renderer.backend as unknown as { device?: { lost: Promise<{ reason: string }> } };
      void backend.device?.lost.then(({ reason }) => { if (reason !== 'destroyed' && alive.current) onFailure(); });
      return renderer;
    }}
    fallback={<span className="canvas-error" />}
  >
    <World onReady={onReady} onFailure={onFailure} />
  </Canvas>;
}
