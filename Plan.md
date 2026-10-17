# Brain AI — reviewed implementation plan

Reviewed on 16 October 2026 with the two supplied assets and NeuralSkills PLAN, DESIGN, BUILD, and TEST v2.0.0. The original design brief is preserved below; its original bytes are archived in [docs/original-plan.md](docs/original-plan.md).

## Revision 2: reference fidelity and continuous motion

The user’s 16 October 2026 feedback takes precedence over the original playback-control requirements below: substantially improve resemblance to the supplied reference and animate automatically without a play/pause button. Remove playback controls and ignore the obsolete saved pause preference. Continue to respect the operating system’s reduced-motion setting and suspend work in hidden tabs.

This revision re-authors the asymmetric folded silhouette and cupped blue shoulder, adds filtered longitudinal pearl detail, moves framing toward the reference’s upper arch/lower point, and replaces the generic torus/platform setting. A clean architectural matte derived from the supplied reference sits behind the live ribbon, live planar reflection, and native shadows. The matte contains no sculpture or interface. It remains the same setting through the four chapters.

Verification must check the reference’s first hero panel against the actual browser at matching proportions. Functional test passes do not establish a visual similarity percentage. Updated evidence is in [docs/reference-revision-qa.md](docs/reference-revision-qa.md).

---

The implementation uses React, strict TypeScript, Vite, React Three Fiber, Three.js WebGPURenderer/node materials, GSAP, and Zustand. Work is local to this project. The reference imagery guides the sculpture, material palette, and architectural composition.

| Work package | Concrete deliverable | Verification |
|---|---|---|
| Review and contracts | [Requirements, decisions, and 10-point rubric](docs/implementation-review.md) | Source references and explicit gaps |
| Geometry | Closed solid ribbon, corresponding poses, editable Blender scene, reproducible GLB script | Endpoint and intermediate-pose review; numeric seam/normal checks |
| Experience | One persistent canvas, four measured chapters, native scrolling, separately framed mobile composition | Actual browser captures and motion recording |
| Interface | Immediate query entry, native dialogs, chapter navigation, automatic motion and quality controls | Keyboard, focus, autoplay, and axe checks |
| Recovery | Matching chapter posters, bounded renderer compatibility recovery, intact HTML controls | Forced fallback and WebGL tests |
| Handoff | Local app, source, lockfile, [run instructions](README.md), [test evidence](docs/test-results.md) | TypeScript, production build, and Playwright results |

Acceptance: assess the ten rubric items against actual results. A requested 10/10 is a target, not a score established by generated code or passing tests. Finalized brand artwork, a real AI service contract, and named physical-device validation were not supplied. The query experience therefore stores a local draft and reports the unavailable connection honestly.

Implementation order: stationary hero → chapter anchors → intermediate morph continuity → interface/recovery → responsive and accessibility checks → captured handoff. Retain failed findings and rerun affected checks after corrections. See the linked evidence for current verification status.

---
## 1. Build the page as a continuous real-time 3D experience

Use **React + TypeScript for the application, React Three Fiber for scene orchestration, Three.js for rendering, and GSAP for scroll choreography**. The main page should behave like a carefully directed sequence of connected compositions—not a conventional landing page with animated images.

Preserve the approved reference’s four visual elements: the folded ribbon, the restrained architectural setting, the expanded wave surface, and the closing sculptural platform. Remove galaxies, floating spheres, particles, luminous outlines, holographic panels, and decorative objects unrelated to the central form.

**The visual hierarchy must remain: geometry → material detail → lighting → motion → interface controls.** Do not attempt to compensate for weak geometry with effects.

### Selected implementation stack

| Responsibility | Selected tools | Implementation direction |
|---|---|---|
| Application | React, TypeScript, Vite | Use a typed component architecture and a lightweight application shell. Vite provides a React-compatible build path and produces deployable static assets. [React](https://react.dev/learn/build-a-react-app-from-scratch?utm_source=chatgpt.com) |
| Scene orchestration | `@react-three/fiber` | Maintain the scene through React components, but perform frame-rate updates outside React state reconciliation. React 19 and Fiber 9 are a documented compatible pairing. [Poimandres](https://r3f.docs.pmnd.rs/getting-started/installation?utm_source=chatgpt.com) |
| Rendering | Three.js `WebGPURenderer` | Use WebGPU where available and validate its WebGL 2 backend as the compatibility path. The renderer documents this backend fallback. [Three.js](https://threejs.org/docs/pages/WebGPURenderer.html) |
| Materials and deformation | Three.js Shading Language, `MeshPhysicalNodeMaterial` | Implement the ribbon’s material and procedural deformation with node materials, not disconnected shader patches. [Three.js](https://threejs.org/docs/pages/MeshPhysicalNodeMaterial.html) |
| Scroll choreography | `gsap`, `ScrollTrigger`, `@gsap/react` | Use ScrollTrigger to measure progression and a paused timeline to evaluate the storyboard. Use `useGSAP()` for lifecycle cleanup. [GSAP](https://gsap.com/docs/v3/Plugins/ScrollTrigger/?utm_source=chatgpt.com) |
| Selective scene utilities | `@react-three/drei` | Use targeted utilities such as `PerformanceMonitor`; do not build the visual identity from demonstration components or effect presets. [Poimandres Documentation](https://drei.docs.pmnd.rs/performances/performance-monitor) |
| Discrete application state | Zustand | Store selected chapter, motion preference, menu state, quality tier, and product-session state. Keep continuous animation values in mutable scene references. [GitHub](https://github.com/pmndrs/zustand) |
| Asset authoring and preparation | Blender, glTF Transform | Author the silhouette and compatible deformation states in Blender; optimize exported geometry and textures through a reproducible asset pipeline. [Blender Documentation](https://docs.blender.org/manual/en/latest/addons/scene_gltf2.html?utm_source=chatgpt.com) |
| Verification | Playwright, `@axe-core/playwright` | Automate visual checkpoints, keyboard flows, reduced-motion behavior, and accessibility checks. Supplement automation with physical-device review. [Playwright](https://playwright.dev/docs/test-snapshots) |

Freeze exact dependency versions after the first renderer-compatibility test. Keep the lockfile committed and avoid multiple Three.js versions in the application.

Initialize `WebGPURenderer` through Fiber’s asynchronous `gl` factory and await `renderer.init()` before mounting the live scene. Fiber explicitly supports this initialization pattern. [Poimandres](https://r3f.docs.pmnd.rs/api/canvas)

**Keep one material pipeline.** Do not combine the selected node-material implementation with `onBeforeCompile()` customizations intended for `WebGLRenderer`. Three.js documents that `onBeforeCompile()` is specific to that renderer and recommends node materials and TSL for the newer rendering path. Third-party rendering helpers must pass both backend tests before adoption. [Three.js](https://threejs.org/docs/pages/Material.html)

Node.js should support builds, asset processing, and any required application endpoints. Do not put rendering or animation updates behind server requests.

## 2. Establish the page’s structural architecture

Use **one persistent viewport-sized canvas**, with a normal HTML document supplying scroll distance, semantic structure, and interface controls.

```text
PageRoot
├── Header                         HTML / SVG
├── ScenePoster                    Initial and failure presentation
├── PersistentCanvas               One renderer; viewport-sized
│   ├── CameraRig
│   ├── RibbonSystem
│   ├── ArchitecturalSurfaces
│   ├── LightingRig
│   └── FrameDirector
├── MainScrollTrack                Semantic HTML chapters
│   ├── HeroChapter
│   ├── SpatialChapter
│   ├── WaveChapter
│   └── ClosingChapter
└── Footer                         HTML / SVG
```

Do not create an enormous canvas matching the full document height. Do not mount a separate renderer for each chapter. Preserve the central mesh, materials, camera, and animation state while the user moves through the page.

Treat the stacked compositions in the reference as **four connected chapters of the same visual system**. The browser should render the transition between them rather than reveal unrelated static backgrounds.

Use normal document scrolling. Do not intercept wheel input to enforce a playback speed, trap the user in a scene, or require completion of an animation before continuing.

The body remains visually text-free. Retain semantic headings and descriptions for assistive technologies; navigation, explanatory controls, and any necessary written information belong in the header, footer, or an explicitly opened product interface.

### Layout starting points

The following dimensions, material values, and timing ranges are **proposed implementation parameters**, not measurements recovered from the reference.

Use a desktop scroll length of approximately **600–700 small viewport heights**, distributed across the four chapters. On mobile, compress the journey to approximately **400–500**, with separately composed camera positions.

The extra length must reveal a meaningful change in scale, surface detail, or spatial relationship. Do not create length by repeating the same sculpture or adding empty scroll intervals.

## 3. Implement the complete visual sequence

| Chapter | Initial scroll allocation | Composition | Transition and motion |
|---|---:|---|---|
| **Hero: the unified form** | `180svh` | One large folded ribbon occupying roughly 65–75% of desktop viewport width. Warm ivory background, clear central opening, restrained ground contact. | Begin close to the approved hero composition. Introduce slow surface motion, then a small camera translation that reveals thickness and curvature. |
| **Spatial reveal** | `160svh` | The same form becomes smaller within the restrained curved architectural setting. Architecture frames the object rather than competing with it. | Move backward and slightly laterally. Reveal the architectural surfaces progressively; do not crossfade into an unrelated scene. |
| **Surface expansion** | `200svh` | The ribbon expands into the broad, layered wave composition. The camera approaches enough to reveal fine surface structure. | Stretch and unfold the form through authored deformation states. Preserve the same palette, material identity, and directional flow. |
| **Closure** | `100svh` | The surface settles toward the broad curved platform shown in the reference. The final brand mark and footer controls become the remaining focal elements. | Reduce deformation amplitude and camera motion. End in a stable composition without an automatic reset or a forced return to the top. |

Calculate chapter boundaries from measured DOM anchors rather than scattering hard-coded scroll percentages across components.

### Hero composition

Keep the central opening legible. Its negative space is as important as the ribbon itself.

Avoid a symmetrical torus, a default torus knot, or an endlessly rotating infinity symbol. The approved form depends on controlled asymmetry: different fold depths, varying ribbon width, and a deliberate balance between the near and far surfaces.

Maintain separation between the ribbon and the background through tonal depth and soft shading—not a glowing outline.

The hero should be visually complete while stationary. Animation should reveal its construction, not make an otherwise weak composition appear interesting.

### Spatial composition

Use only the architectural surfaces needed to support the reference: a floor, a broad curved boundary, and a restrained opening or recess.

Do not turn this chapter into an interior-design scene. No furniture, people, vegetation, skyline, or additional narrative props.

Keep the transition physically coherent. The viewer should recognize that the camera has moved around the same visual subject.

### Expanded surface composition

The wave must retain the ribbon’s material and fine longitudinal structure. It must not suddenly become water, fabric, terrain, or a collection of separate ribbons.

Allow portions of the geometry to leave the frame. Cropping can communicate scale without adding more objects.

### Closing composition

The closing platform should feel like the geometry settling into the page boundary. Avoid placing a conventional rectangular footer over an unrelated 3D background.

Keep the final frame quiet and usable. The user must be able to access navigation immediately, without waiting for the motion to finish.

## 4. Author the central geometry deliberately

Use **Blender-authored geometry with compatible morph targets**, supplemented by low-amplitude procedural motion in the browser.

Blender supports curve-based mesh construction, and its glTF exporter supports shape keys as morph targets. Use those capabilities to preserve control over the silhouette while preparing a runtime-friendly asset. [Blender Documentation](https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/operations/curve_to_mesh.html?utm_source=chatgpt.com)

### Geometry requirements

Build the ribbon as a surface with visible, controlled thickness. Its edges should not look like an infinitely thin paper plane.

Author several approved poses on the same topology: the hero fold, the spatial-reveal pose, an intermediate unfolding pose, the expanded wave, and the closing pose. Preserve vertex correspondence, UV orientation, and appropriate normals throughout the sequence.

**Do not attempt to morph a closed ribbon directly into a topologically different open surface.** For the wave chapter, keep the return portion of the closed geometry outside the camera frame, or author a deliberately concealed transition. Do not introduce a visible tear, disappearing edge, or sudden mesh replacement.

A suitable deformation contract is:

\[
P(u,v,s,t)
=
P_0(u,v)
+
\sum_k w_k(s)\,\Delta P_k(u,v)
+
a(s)\,D(u,v,t)
\]

Here, \(s\) is scroll progression, \(t\) is the controlled animation clock, \(\Delta P_k\) are authored morph-target displacements, and \(D\) is a small periodic deformation. Keep the ambient term subordinate to the authored shape.

The scroll path should define the large transformation. The time-dependent term should supply only the subtle continuous movement.

### Normal and shadow correctness

When a shader changes the surface position, update the associated surface-normal calculation. Position displacement alone is not sufficient for the intended moving highlights.

For a parameterized surface, the geometric normal follows:

\[
N =
\frac{\partial_u P \times \partial_v P}
{\left\|\partial_u P \times \partial_v P\right\|}
\]

Use an equivalent analytic or appropriately approximated calculation for the implemented deformation. Keep tangent direction consistent with the longitudinal material detail.

Any live shadow representation must follow the same deformation. Do not allow the visible ribbon to move while its shadow retains the undeformed silhouette.

Inspect intermediate poses, not just endpoints. Reject self-intersections, pinched surfaces, UV seams, shading discontinuities, and folds whose thickness visibly collapses.

## 5. Build a restrained material, not a shiny effect

Use `MeshPhysicalNodeMaterial` for the ribbon, with authored color, roughness, and directional surface detail. It provides the node-material equivalent of Three.js’s physical material model. [Three.js](https://threejs.org/docs/pages/MeshPhysicalNodeMaterial.html)

The intended appearance is **satin mineral or finely brushed composite**, not chrome, glass, liquid metal, or translucent plastic.

| Material property | Starting direction | Visual constraint |
|---|---|---|
| Base color | Ivory, soft stone, subdued blue-gray | Restrained variation along the ribbon; no rainbow or animated color cycling. |
| Roughness | Approximately `0.42–0.62` | Broad, soft highlights rather than sharp reflections. |
| Metalness | Approximately `0.0–0.2` | Retain material depth without making the object mirror-like. |
| Anisotropy | Approximately `0.15–0.3`, where useful | Align the response with the ribbon’s longitudinal structure. |
| Transmission | `0` | Do not turn the ribbon into glass. |
| Iridescence and dispersion | `0` | No angle-dependent rainbow effects. |
| Emission | `0` | No self-illumination, glowing edges, or artificial light strips. |
| Clearcoat | Begin at `0` | Add only after a specific visual justification, not as a default enhancement. |

Physical-material features have different per-pixel costs; enabling more of them is not inherently better. Three.js explicitly notes the additional cost of its advanced physical shading features. [Three.js](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)

### Fine-detail treatment

Separate detail into three scales.

**Large scale:** fold geometry, width variation, thickness, and the silhouette.

**Intermediate scale:** shallow longitudinal channels or material bands that become visible during the close-up.

**Micro scale:** subtle directional normal and roughness variation.

Implement fine striations as filtered material detail rather than thousands of independent line meshes. Avoid a wireframe appearance. The reference’s fine structure should read as a property of the surface, not a technical grid drawn over it.

Fade high-frequency detail as its projected spacing becomes too small. Test this during movement: a still image can look clean while the same detail produces distracting shimmer in motion.

Keep material patterns attached to the surface coordinates. Do not use screen-space patterns that appear to slide over the ribbon as the camera moves.

### Lighting and color management

Use a neutral studio environment with a broad key-light appearance and gentle fill. Keep highlights soft and exposure stable throughout the journey.

The visible background should remain the controlled ivory architectural composition. An environment texture used for lighting does not need to appear as scenery.

Maintain an explicit linear rendering workflow: color textures require the appropriate color-space assignment, normal and roughness textures are non-color data, and display output needs the correct conversion. Three.js warns that incorrect or duplicated conversions can produce washed-out or excessively dark results. [Three.js](https://threejs.org/manual/pages/color-management.html)

Approve the scene **without bloom, depth-of-field blur, chromatic aberration, lens flare, or a heavy post-processing stack**. The ribbon and its surface detail must remain clear across the frame.

## 6. Make movement continuous, but precisely constrained

Use three independent motion contributions:

\[
\text{Scene state}
=
\text{scroll-directed pose}
+
\text{ambient surface motion}
+
\text{bounded pointer response}
\]

Assign one owner to each contribution. Do not let several animation systems write to the same camera transform or material uniform.

### Scroll-directed movement

The main storyboard should be deterministic: the same scroll position must produce the same principal composition, regardless of how quickly the user arrived there.

Use smooth camera paths and quaternion interpolation for orientation. Keep the horizon level. Avoid camera rolls, sudden field-of-view changes, and repeated movement through the central opening.

Begin with a vertical field of view around **30–40 degrees**, then tune framing against the approved reference. Prefer actual camera translation over repeated zoom effects.

### Ambient movement

Begin with a **16–28-second cycle** and surface displacement around **0.3–0.8% of the object’s characteristic width**. These are tuning ranges, not fixed requirements.

The object should retain its identity at every point in the cycle. No gelatinous wobble, abrupt breathing, rubber-like stretching, or perpetual 360-degree rotation.

When scrolling stops, the camera should settle. Only the restrained surface motion should continue.

### Pointer response

Use a small offset, approximately **±1 degree** initially, with a damped return. Apply it only to fine-pointer devices.

Do not move the whole scene aggressively toward the cursor. Do not replace the native cursor with a large animated ornament. Touch users must not receive simulated mouse parallax.

### Frame-independent smoothing

For a value approaching a target, use time-based damping:

\[
x_{t+\Delta t}
=
x_t+
\left(1-e^{-\Delta t/\tau}\right)(x^\*-x_t)
\]

This is preferable to a fixed interpolation fraction when the intended response must remain consistent across refresh rates. Fiber’s performance guidance likewise recommends delta-based updates and mutation inside `useFrame`, rather than frame-rate React state changes. [Poimandres](https://r3f.docs.pmnd.rs/advanced/pitfalls)

## 7. Use one scene-update authority

ScrollTrigger should update a target progression reference. A single scene director should consume that reference and apply the resulting frame.

```text
Native scroll
    → measured chapter progression
    → targetProgress reference
    → FrameDirector
        → evaluate authored storyboard
        → evaluate ambient deformation
        → apply bounded pointer response
        → update camera, morph weights, uniforms
    → render
```

A suitable frame-driver contract is:

```text
onFrame(delta):
    read visibility, motion preference, quality tier, interaction state

    clamp excessive delta after suspension
    advance ambient clock only when ambient motion is enabled

    resolve target storyboard position
    damp presentation position unless reduced motion is enabled

    evaluate paused timeline at presentation position
    apply authored camera pose and morph weights

    apply bounded ambient deformation
    apply bounded pointer offset

    commit the scene once
```

GSAP should evaluate storyboard parameters; it should not independently animate the same Three.js properties that the frame director owns.

Use `useGSAP()` to create and clean up ScrollTriggers and timelines. Keep component-local listeners and any separately created animation resources under explicit cleanup ownership. [GSAP](https://gsap.com/resources/React/)

Do not recreate geometry, materials, vectors, or shader graphs every frame. Update existing values. Avoid mounting and unmounting the central scene as chapters change; Fiber’s guidance specifically identifies resource recreation and indiscriminate remounting as performance hazards. [Poimandres](https://r3f.docs.pmnd.rs/advanced/pitfalls)

Use continuous rendering while the page is visible and ambient motion is enabled. When motion is paused or reduced, switch to demand-driven rendering and invalidate only when a visible state changes. Fiber supports this pattern explicitly. [Poimandres](https://r3f.docs.pmnd.rs/advanced/scaling-performance)

## 8. Integrate the logo, header, and footer into the composition

### Logo

Use the approved vector mark as the identity source. Until that asset is supplied, treat the symbol in the reference as a provisional visual reference—not a finalized logo specification.

Match the sculpture through proportion, subdued tonal treatment, and edge character. Do not add orbiting rings, animated sparkles, or another miniature 3D scene inside the logo.

Render the header mark as SVG. Keep it stable, crisp, and clickable even when the 3D renderer is loading or unavailable.

### Header

The header should occupy the page’s upper boundary without looking like a separate toolbar.

Start with a desktop alignment region of roughly **80–96 CSS pixels**, horizontal inset of **40–64 pixels**, and a compact logo. Use a transparent or background-matched surface without a heavy border, pill container, or glass-blur panel.

Keep only controls with an actual product function. The initial specification should contain the brand/home action, access to the query experience, and navigation or settings. Include a language control only when language selection is implemented.

The query entry point must be available immediately; do not require users to finish the visual journey before using the product.

On hover or keyboard focus, use a restrained contrast or stroke change. Avoid magnetic movement that shifts the clickable target.

### Footer

Use the closing geometry to lead naturally into a normal HTML footer. Keep the same base color and alignment system.

The footer may contain concise written navigation, accessibility settings, and required legal links. Do not add a multi-column marketing block or repeat the header’s entire control set.

Keep footer controls operable independently of the canvas. A renderer failure must not remove navigation.

### Interaction clarity

Use generous hit regions—**44 × 44 CSS pixels or larger as the design target**—even when the visible icon is smaller.

Do not make functional controls as faint as decorative surface details. Meaningful graphical controls need sufficient contrast; WCAG’s non-text contrast guidance specifies a 3:1 requirement for relevant visual information against adjacent colors. [W3C](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)

## 9. Define product behavior separately from visual atmosphere

The sculptural motion is the page’s visual language. It must not be presented as evidence that a model is thinking, searching, or completing a task.

Expose a typed integration boundary for the actual product state:

```ts
type ExperienceState =
  | "idle"
  | "input"
  | "processing"
  | "ready"
  | "error";
```

Map real state transitions to restrained visual changes. For example, input may slightly stabilize the form; processing may introduce a controlled deformation; completion may settle it.

Do not use a timer to manufacture completion. Do not display a visual percentage unless the backend supplies meaningful progress.

Keep written query entry and status information within the header’s expanded interaction area or route into the dedicated product experience. Do not hide required instructions or errors merely to preserve the text-free body.

The landing-page renderer should not depend on the intelligence backend being available. Visual navigation, motion controls, and fallback presentation must continue to work independently.

## 10. Build loading, performance, and recovery into the design

### Asset pipeline

Export the approved ribbon and its deformation data as glTF/GLB. Use glTF Transform to inspect, prune, and compress the asset. Its tooling includes geometry and animation compression with Meshopt and texture-compression operations. [glTF Transform](https://gltf-transform.dev/cli)

Use one selected geometry-compression path rather than shipping competing decoder stacks unnecessarily. Configure `GLTFLoader` with the corresponding decoder. For Basis-compressed KTX2 textures, configure `KTX2Loader` against the active renderer before loading; its documented workflow includes GPU-format support detection. [Three.js](https://threejs.org/docs/pages/GLTFLoader.html)

Self-host production assets, decoder files, and lighting textures under versioned paths.

### Initial performance budgets

Treat these as release targets to validate on named test devices—not as claims about performance already achieved.

| Area | Initial target |
|---|---|
| Desktop motion | Stable 60 FPS on the agreed target devices; inspect frame-time distribution, not only average FPS. |
| Mobile motion | Prefer 60 FPS at reduced complexity; provide a deliberate lower-cost tier where necessary. |
| Desktop pixel ratio | Begin around `1.25–1.5`; increase only after measurement. |
| Mobile pixel ratio | Begin around `1.0–1.25`. |
| Critical first-scene assets | Aim for approximately 3 MB or less transferred, with later detail deferred. |
| Startup presentation | Show the approved poster and usable HTML controls before live 3D is ready. |
| Quality changes | Require sustained evidence and hysteresis; do not oscillate between tiers. |

Use measured performance to lower pixel ratio, detail frequency, secondary shadow cost, and geometry complexity in that order where appropriate. Preserve the central silhouette and color treatment.

Drei’s `PerformanceMonitor` provides performance callbacks and a fallback mechanism for repeated quality oscillation; use it as an input to the quality policy rather than allowing it to make unbounded changes. [Poimandres Documentation](https://drei.docs.pmnd.rs/performances/performance-monitor)

### Loading sequence

Render the header, footer structure, and a composition-matched poster first. Load the renderer and critical scene assets asynchronously. Prepare the materials before revealing the live result.

Replace the poster only after the first valid scene frame. Match its camera, background, and exposure closely enough to avoid a visible jump.

Do not display a cinematic loading sequence that unnecessarily delays a usable page.

### Failure behavior

On renderer initialization failure, attempt the validated compatibility path once. If initialization still fails, retain the static presentation.

On asset failure, preserve the existing composition and expose a retry action in the interface. Do not clear the canvas to black.

On device or context loss, preserve the current chapter and application state. Bound recovery attempts and return to the poster when recovery is unsuccessful.

Provide static chapter compositions for the non-3D experience. A fallback must not become six viewports of empty space.

## 11. Implement accessibility and responsive behavior as first-class states

Include a persistent, discoverable motion control. Respect `prefers-reduced-motion` at initial load and when it changes.

For reduced motion, disable ambient deformation, pointer parallax, and continuous camera travel. Present stable chapter compositions with direct or restrained transitions.

WCAG includes requirements concerning automatically moving content and mechanisms to pause, stop, or hide it under specified conditions. Interaction-triggered animation also has dedicated guidance. Build explicit user control rather than relying solely on an operating-system preference. [W3C](https://www.w3.org/WAI/WCAG21/Understanding/pause-stop-hide.html?utm_source=chatgpt.com)

Provide keyboard-operable navigation, visible focus states, accessible names for icon controls, and appropriate alternatives for meaningful visuals. Do not make drag gestures or 3D raycasting the only way to perform an action. [W3C](https://www.w3.org/TR/WCAG22/?utm_source=chatgpt.com)

Author the mobile composition separately. Reframe the ribbon vertically, maintain its central opening, simplify architecture, and keep controls clear of device safe areas.

Do not shrink the desktop scene uniformly and accept whatever crop results. Test portrait, landscape, viewport resizing, browser zoom, and touch scrolling.

## 12. Organize the implementation around reviewable responsibilities

```text
src/
  app/
    MainPage.tsx
    Header.tsx
    Footer.tsx
    ExperienceEntry.tsx

  scene/
    SceneCanvas.tsx
    FrameDirector.tsx
    CameraRig.tsx
    Ribbon.tsx
    Architecture.tsx
    LightingRig.tsx

  scene/materials/
    RibbonMaterial.ts
    SurfaceDetail.ts
    Deformation.ts

  motion/
    storyboard.ts
    cameraPaths.ts
    chapterAnchors.ts
    motionPolicy.ts

  state/
    experienceStore.ts

  quality/
    qualityProfiles.ts
    performanceController.ts
    recoveryPolicy.ts

  styles/
    tokens.css
    layout.module.css

  tests/
    visual.spec.ts
    navigation.spec.ts
    accessibility.spec.ts
    recovery.spec.ts
```

Keep camera paths, material parameters, and chapter transitions in typed configuration rather than embedding unexplained numbers throughout JSX.

Store the Blender source, export settings, asset-processing commands, and reference renders alongside the implementation workflow. A developer must be able to regenerate the production assets without manually reconstructing the process.

## 13. Approve the result through explicit visual and functional gates

**First gate: the stationary hero.** Match the reference’s silhouette, central opening, fold relationships, material restraint, and negative space in the actual browser. Do this before building the full scroll sequence.

**Second gate: the four chapter compositions.** Approve each camera anchor independently, including mobile variants. Verify that the same material identity survives every transformation.

**Third gate: motion continuity.** Review forward scrolling, reverse scrolling, fast jumps, interruption, and idle motion. Reject camera discontinuities, surface shimmer, mesh intersections, and changes that feel like unrelated scene replacements.

**Fourth gate: operational behavior.** Test keyboard access, reduced motion, low-quality mode, slow loading, failed assets, renderer failure, and backend unavailability.

For automated visual tests, expose a development-only capture mode with fixed chapter progression, fixed animation time, fixed quality tier, and deterministic inputs. Use stable browser and operating-system baselines; Playwright notes that screenshot output can vary across execution environments. [Playwright](https://playwright.dev/docs/test-snapshots)

Because the canvas is viewport-fixed, a conventional full-page screenshot will not capture the complete storyboard correctly. Capture each approved progression point separately and assemble the long-page review from those actual rendered frames.

The final handoff should contain the working page, editable 3D source, reproducible asset pipeline, desktop and mobile reference frames, a motion recording, and measured performance results.

**The acceptance standard is not the number of effects implemented. It is whether one coherent form remains exceptionally well composed, materially convincing, continuously controlled, and usable from the first frame to the footer.**
