# Brain AI — Form in motion

A local React + TypeScript website based on `Plan.md` and the supplied pearl-ribbon references. One persistent React Three Fiber canvas renders the same solid ribbon through Form, Space, Surface, and Stillness. Native document scrolling drives a paused GSAP storyboard; a single frame director owns scene updates.

## Run

Requires Node.js 24 or later. From this directory:

```powershell
npm ci
npm run dev
```

Open http://127.0.0.1:4173/. Use the header markers or native scroll to explore. The search icon opens a local question draft; the globe opens the experience information; the menu contains chapter navigation and quality controls. Animation starts automatically and continues while the page is visible, without a play/pause button. The page follows the operating system's reduced-motion preference. Quality preferences persist; the obsolete saved pause preference is ignored.

```powershell
npm run typecheck
npm run build
npm test
```

Tests use installed Chrome when available, otherwise Playwright Chromium (`npx playwright install chromium`). Start the dev server before testing. `BRAIN_BROWSER_PATH` selects another browser executable; `BRAIN_BASE_URL` selects another local test server.

## Source and assets

- `src/app`: semantic document, accessible controls, dialogs, loading and recovery.
- `src/scene`: one WebGPU renderer with a WebGL compatibility backend, node material, architecture, lighting and frame director.
- `src/motion`: measured DOM chapter anchors and typed camera/morph choreography.
- `src/state`: discrete preferences in Zustand; continuous scene data stays outside React state.
- `src/scene/geometry/ribbonGeometry.ts`: editable parameterized solid-ribbon source with shared topology and normal morph targets.
- `assets/source/ribbon.blend`: editable Blender scene, named shape keys, lights and review cameras.
- `public/models/ribbon.glb`: runtime mesh, approximately 3.52 MB with 512 longitudinal segments; no external geometry decoder required.
- `assets/source/architecture-v2.png`: ImageGen clean architectural matte derived from the supplied reference, with the sculpture and interface removed. Its optimized WebP is composited behind the live 3D ribbon and reflected floor.
- `docs/review`: actual desktop/mobile frames, intermediate compositions, browser metadata and a motion recording.

Regenerate geometry with `npm run assets:author`. Then create the Blender source:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.1\blender.exe' --background --python scripts/blender-author.py
```

The Blender script can also run with another Blender executable on PATH. Add `-- --render-preview` for preview renders. The mesh has a closed thick cross-section and four corresponding morph targets; its return remains intact below the floor during expansion. `node scripts/audit-ribbon-surface.mjs` checks surface orientation and continuity, including visible intermediate poses. The repaired upper-right fold and browser close-up evidence are recorded in `docs/revision`.

Capture real browser review frames and regenerate matching posters:

```powershell
node scripts/capture-review.mjs
python scripts/prepare-posters.py --from-review
```

Poster processing needs Python with `Pillow==11.2.1`. The source PNGs remain in `assets`. `prepare-posters.py` without `--from-review` restores reference-derived posters.

## Product integration and verification limits

No AI backend or credentials were supplied. Questions remain in sessionStorage and are never sent. `ExperienceAdapter` in `Interface.tsx` defines the service boundary; the application reports the missing connection and produces no synthetic answer or completion timer. The sculpture runs independently.

The SVG mark is provisional. The local prototype has not been published. The reference-fidelity and automatic-motion revision is documented in `docs/reference-revision-qa.md`; earlier browser checks remain in `docs/test-results.md`. Physical-device validation and final visual acceptance remain separate from automated checks. The requested 10-point review rubric is in `docs/implementation-review.md`.

The NeuralSkills PLAN/DESIGN/BUILD/TEST v2.0.0 guidance was read from source commit `fcdbe05036e2651fd9814601fe834409c99e133a`. We used traceable requirements, bounded component ownership, explicit integration limits and observed test results. This is not a claim of ISO certification or full NeuralSkills pack qualification.
