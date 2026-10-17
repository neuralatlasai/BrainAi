/** Regenerate the deterministic runtime asset: node scripts/author-ribbon.mjs */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Box3, Mesh, MeshPhysicalMaterial, Scene } from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { createRibbonGeometry } from '../src/scene/geometry/ribbonGeometry.ts';

// GLTFExporter consumes browser FileReader for its final Blob assembly.
globalThis.FileReader ??= class FileReader {
  result = null;
  onloadend = null;
  onerror = null;
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((value) => {
      this.result = value;
      this.onloadend?.({ target: this });
    }).catch((error) => this.onerror?.(error));
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((value) => {
      this.result = `data:${blob.type};base64,${Buffer.from(value).toString('base64')}`;
      this.onloadend?.({ target: this });
    }).catch((error) => this.onerror?.(error));
  }
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const geometry = createRibbonGeometry({ longitudinalSegments: 512, widthSegments: 24 });
// Preserve face identity as glTF _RIBBONSIDE (loaded as _ribbonside), allowing
// the runtime to distinguish warm reverse from blue front after deformation.
const material = new MeshPhysicalMaterial({ color: '#d3d8d8', roughness: 0.49, metalness: 0.12, anisotropy: 0.22 });
material.name = 'Pearl mineral · satin';
const ribbon = new Mesh(geometry, material);
ribbon.name = 'Pearl ribbon';
ribbon.updateMorphTargets();
const scene = new Scene();
scene.name = 'Brain · ribbon source';
scene.add(ribbon);
const exporter = new GLTFExporter();
const output = await exporter.parseAsync(scene, { binary: true, onlyVisible: true, includeCustomExtensions: false });
const destination = resolve(root, 'public/models/ribbon.glb');
await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, new Uint8Array(output));
const report = {
  asset: 'public/models/ribbon.glb',
  byteLength: output.byteLength,
  vertices: geometry.attributes.position.count,
  triangles: geometry.index.count / 3,
  morphTargets: Object.keys(ribbon.morphTargetDictionary),
  bounds: { min: geometry.boundingBox.min.toArray(), max: geometry.boundingBox.max.toArray() },
  heroBounds: (() => {
    const bounds = new Box3().setFromBufferAttribute(geometry.attributes.position);
    return { min: bounds.min.toArray(), max: bounds.max.toArray() };
  })(),
  authoring: 'Periodic asymmetric shoulder and low-fold centerline; cupped solid ribbon with continuous corresponding poses',
};
await writeFile(resolve(root, 'public/models/ribbon-manifest.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
geometry.dispose();
material.dispose();
