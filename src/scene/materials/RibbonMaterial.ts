import { Color, DataTexture, EquirectangularReflectionMapping, FloatType, LinearFilter, LinearMipmapLinearFilter, RepeatWrapping, RGBAFormat } from 'three';
import { MeshPhysicalNodeMaterial } from 'three/webgpu';
import { Fn, abs, attribute, color, float, fwidth, mix, normalViewGeometry, positionViewDirection, positionWorld, sin, smoothstep, uv } from 'three/tsl';

export function createRibbonMaterial(): MeshPhysicalNodeMaterial {
  const material = new MeshPhysicalNodeMaterial({
    color: '#c8c8be', roughness: 0.34, metalness: 0.3,
    // Mirrored width UVs have no stable directional tangent at rounded edges.
    // Isotropic satin preserves a smooth highlight through every morph pose.
    anisotropy: 0,
    transmission: 0, clearcoat: 0.04, clearcoatRoughness: 0.36,
    sheen: 0.06, sheenColor: '#ecf1f1', sheenRoughness: 0.55,
    envMapIntensity: 0.72,
  });

  // The two broad faces need separate mineral tones. Their width UVs mirror,
  // so glTF's preserved face-sign attribute carries that distinction through
  // the folds and all morph poses. Older assets retain a neutral fallback.
  const faceSign = Fn((builder) => {
    if (builder.geometry.hasAttribute('_ribbonside')) return attribute('_ribbonside', 'float');
    if (builder.geometry.hasAttribute('ribbonSide')) return attribute('ribbonSide', 'float');
    return float(0);
  })();
  const blueFace = float(1).sub(smoothstep(-0.45, 0.45, faceSign));
  const along = uv().x.mul(Math.PI * 2);
  const shoulderLight = sin(along.add(0.85)).mul(0.5).add(0.5);
  const warmLight = sin(along.sub(0.4)).mul(0.5).add(0.5);
  const warmMineral = mix(color('#bca994'), color('#e2cfb9'), warmLight);
  const blueMineral = mix(color('#83929e'), color('#b6c7cf'), shoulderLight);
  const pearl = mix(warmMineral, blueMineral, blueFace.mul(0.86).add(shoulderLight.mul(0.14)));
  const edge = smoothstep(0.425, 0.498, abs(uv().y.sub(0.5)));
  const grazing = float(1).sub(abs(normalViewGeometry.dot(positionViewDirection))).pow(3);
  const base = mix(pearl, color('#ecebe3'), edge.mul(0.88).add(grazing.mul(0.08)).clamp(0, 0.94));
  // Longitudinal hairlines gently flow across the surface rather than reading
  // as an evenly striped sheet. Geometry supplies their larger-scale curve.
  const channelPhase = uv().y.mul(Math.PI * 2 * 32)
    .add(sin(along.mul(2)).mul(1.4))
    .add(sin(along.mul(7).add(uv().y.mul(3))).mul(0.15));
  const resolved = float(1).sub(smoothstep(0.45, 2.6, fwidth(channelPhase)));
  const channel = sin(channelPhase).mul(0.5).add(0.5).pow(16).mul(resolved);
  const channelStrength = mix(float(0.085), float(0.17), blueFace);
  material.colorNode = mix(base, color('#f3f0e8'), channel.mul(channelStrength));
  material.roughnessNode = float(0.34).add(channel.mul(0.06)).add(float(1).sub(blueFace).mul(0.035));
  // Conceal the intact return in both the main camera and reflection pass.
  material.maskNode = positionWorld.y.greaterThan(-2.615);

  const size = 2048;
  const normalData = new Uint8Array(size * 4);
  for (let i = 0; i < size; i++) {
    const ridge = Math.sin(i / size * Math.PI * 2 * 32);
    normalData.set([128, Math.round(128 + ridge * 19), 254, 255], i * 4);
  }
  const normal = new DataTexture(normalData, 1, size, RGBAFormat);
  normal.wrapS = normal.wrapT = RepeatWrapping;
  normal.magFilter = LinearFilter;
  normal.minFilter = LinearMipmapLinearFilter;
  normal.generateMipmaps = true;
  normal.needsUpdate = true;
  material.normalMap = normal;
  material.normalScale.set(0.1, 0.1);
  material.userData.ownedTextures = [normal];
  return material;
}

/** Broad area cards over a dark neutral studio reveal the folded satin faces. */
export function createStudioEnvironment(): DataTexture {
  const width = 256, height = 128;
  const data = new Float32Array(width * height * 4);
  const neutral = new Color('#e8e6df');
  const warm = new Color('#fff6e5');
  const cool = new Color('#d8e8f2');
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / width, v = y / height;
      const key = Math.exp(-(((u - 0.22) / 0.105) ** 2 + ((v - 0.27) / 0.15) ** 2)) * 4.2;
      const fill = Math.exp(-(((u - 0.77) / 0.16) ** 2 + ((v - 0.4) / 0.23) ** 2)) * 1.1;
      const horizon = Math.exp(-(((u - 0.45) / 0.28) ** 2 + ((v - 0.52) / 0.045) ** 2)) * 0.42;
      const dark = Math.exp(-(((u - 0.48) / 0.19) ** 2 + ((v - 0.63) / 0.16) ** 2)) * 0.085;
      const base = Math.max(0.018, 0.1 - dark);
      const i = (y * width + x) * 4;
      data[i] = neutral.r * base + warm.r * (key + horizon) + cool.r * fill;
      data[i + 1] = neutral.g * base + warm.g * (key + horizon) + cool.g * fill;
      data[i + 2] = neutral.b * base + warm.b * (key + horizon) + cool.b * fill;
      data[i + 3] = 1;
    }
  }
  const texture = new DataTexture(data, width, height, RGBAFormat, FloatType);
  texture.mapping = EquirectangularReflectionMapping;
  texture.needsUpdate = true;
  return texture;
}
