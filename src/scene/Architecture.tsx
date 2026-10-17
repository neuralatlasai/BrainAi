import { useEffect, useMemo } from 'react';
import { Mesh } from 'three';
import { MeshPhysicalNodeMaterial } from 'three/webgpu';
import { abs, color, float, mix, positionWorld, reflector, smoothstep, uv } from 'three/tsl';
import type { RefObject } from 'react';

const FLOOR_Y = -2.62;

export function Architecture({ portalRef }: { portalRef: RefObject<Mesh | null> }) {
  const surfaces = useMemo(() => {
    // The reflector target is a child of the rotated floor: its +Z normal is
    // therefore world +Y. This is a real mirrored camera, not a second sculpture.
    const reflection = reflector({ resolutionScale: 0.5, generateMipmaps: true, bounces: false, samples: 0 });
    const floor = new MeshPhysicalNodeMaterial({
      color: '#e3e5e2', roughness: 0.32, metalness: 0.16,
      clearcoat: 0.12, clearcoatRoughness: 0.42, transparent: true, depthWrite: true,
    });
    const distanceFade = float(1).sub(smoothstep(4, 17, positionWorld.xz.length()));
    const groundTint = mix(color('#c3ced2'), color('#eeece5'), smoothstep(-9, 7, positionWorld.z));
    floor.colorNode = mix(groundTint, reflection.level(float(3.2)).rgb, distanceFade.mul(0.38));
    const farEdge = float(1).sub(smoothstep(0.68, 1, uv().y));
    const sideEdge = float(1).sub(smoothstep(0.29, 0.5, abs(uv().x.sub(0.5))));
    floor.opacityNode = farEdge.mul(sideEdge).mul(0.62);
    return { reflection, floor };
  }, []);

  useEffect(() => () => {
    surfaces.reflection.dispose();
    surfaces.floor.dispose();
  }, [surfaces]);

  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, 0]} receiveShadow>
      <planeGeometry args={[50, 22]} />
      <primitive object={surfaces.floor} attach="material" />
      <primitive object={surfaces.reflection.target} />
    </mesh>

    {[4.5, 5.4, 6.3].map((radius, index) => <mesh
      key={radius}
      position={[0, FLOOR_Y + 0.008 + index * 0.002, -0.15]}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={[1.28, 0.86, 1]}
    >
      <ringGeometry args={[radius, radius + 0.009, 192]} />
      <meshPhysicalMaterial color="#f5f1e7" roughness={0.35} metalness={0.16} transparent opacity={0.47 - index * 0.09} depthWrite={false} />
    </mesh>)}

    {/* The clean architectural plate supplies the aperture. Preserve the
        director's anchor without bringing back the generic circular torus. */}
    <mesh ref={portalRef} visible={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial />
    </mesh>
  </group>;
}

