# Implementation review

Record: `BRA-REVIEW-001`, revision `2`, 2026-10-16, Asia/Calcutta. Author: implementation review agent. Owner: invoking user; implementation consumer: BUILD and TEST agents. The supplied implementation brief is preserved in `docs/original-plan.md`; root subsequently added implementation work packages/status to `Plan.md`.

Status: review **authored**; source inspection **executed**; source and installed Blender observations **verified**; browser implementation, visual acceptance, performance, and accessibility **NOT_RUN in this review**. No separate human approval requirement was found for the authorized local implementation. This report does not approve a production release or award a score.

## Sources and evidence

All observations below were made on 2026-10-16 by the review agent. Source files are local user-supplied material, retained in the repository; no sensitive data was inspected. The requirements remain attributable to the user rather than to generated assumptions.

| Evidence | Source, exact revision, and method | Finding and limitation |
|---|---|---|
| E01 | `docs/original-plan.md` (supplied as `Plan.md` at initial inspection); SHA256 `ad5ccada3b85e9bf044d5ad56c5ed9022338547f6f4bb3769cab1cd69335ceec`; full UTF-8 text inspection | PROVIDED_CONSTRAINT: React/TypeScript, persistent real-time scene, four chapters, material restraint, honest product integration, responsive/accessibility/recovery requirements. Numerical ranges are explicitly starting parameters or release targets. |
| E02 | `assets/28a9ff7c-047d-4be8-b908-d6fcd7c1cdda.png`; SHA256 `4d1341330966d5f355bf9b65116c6d57e687e11f3cdbbab375d8a80f213fd19d`; image inspection | VERIFIED_FACT: four dominant compositions, asymmetric folded loop, pale blue-gray/ivory material, architectural void, wide wave, quiet closing mark. A raster cannot establish topology, material values, camera parameters, or animation. |
| E03 | `assets/Futuristic Pearl Ribbon Landing Page.png`; SHA256 `018896e346ea3fa1bf3e730cb1a92bbe00b5d209e9438a704e5fdf0559e20498`; image inspection | VERIFIED_FACT: related long-page concept with additional close-up/gallery/ornamental details. Those additions do not override Plan sections 1–3 and 8. |
| E04 | NeuralSkills checkout commit `fcdbe05036e2651fd9814601fe834409c99e133a`; read PLAN/DESIGN entrypoints, both procedures, governance, artifact contracts, project context, standards register, platform adapters, intent/architecture templates, gates, evaluation cases | VERIFIED_FACT: version 2.0.0 guidance calls for traceable criteria and separate authored/executed/verified/approved states. The pack does not mandate invented approval ceremonies or establish ISO compliance. No full pack behavioral qualification was run. |
| E05 | `C:\Program Files\Blender Foundation\Blender 5.1\blender.exe --version`; exit 0 | VERIFIED_FACT: Blender **5.1.1**, build hash `b70da489d7f4`, is installed and executable. A `Blender 4.3` directory also exists but had no top-level `blender.exe`. Blender was not on the inspected command path. |
| E06 | Initial `BrainAi` and `assets` directory inventory | VERIFIED_FACT: supplied starting content was `Plan.md`, two PNGs, and `.git`; no `.blend`, `.glb`, approved vector logo, or provider configuration was supplied. Later generated artifacts are outside this starting-source observation. |

The observed need is to turn the supplied detailed brief and raster compositions into a working website. No existing implementation defect is asserted. The inferred need is a reproducible implementation that can be reviewed in the browser; the decisions below are implementation proposals rather than newly approved product requirements.

## Requirements and trace

All requirement revisions are `1`. Source E01 supplies the constraint; E02/E03 supply visual comparison oracles. The user owns acceptance. BUILD owns implementation and TEST owns evidence collection. Detailed generated acceptance methods below are proposed operationalizations of the supplied brief, not a replacement for it.

| ID | Requirement | Source locator | Observable acceptance / next-stage obligation |
|---|---|---|---|
| BRA-R01 | Use React, TypeScript, Vite, Fiber, Three.js node materials, GSAP/ScrollTrigger, and typed configuration. | Plan §§1, 7, 12 | Type check and production build pass; a single resolved Three.js version; dependency lockfile retained. Renderer experiment precedes final version freeze. |
| BRA-R02 | Keep one persistent viewport canvas and normal semantic HTML scroll chapters. | Plan §2 | Canvas count remains one while scrolling; native scrolling, keyboard navigation, header, and footer function independently of rendering. Body has visually hidden semantic headings rather than marketing copy. |
| BRA-R03 | Compose an asymmetric folded ribbon with a readable central opening, thickness, negative space, and restrained floor contact. | Plan §§3–4; E02/E03 hero | Actual stationary browser frame compared with references before motion work; no stock torus, torus knot, or effect-based substitute. |
| BRA-R04 | Develop the same form through hero, spatial reveal, wave, and closure. | Plan §§2–4 | Independently captured desktop/mobile chapter anchors; continuous forward, reverse, fast-jump, and interrupted transitions retain material and mesh identity. |
| BRA-R05 | Deliver editable Blender geometry and reproducible same-topology deformation assets. | Plan §§4, 10, 12–13 | `.blend`, export script/settings, GLB, and optimization commands exist; compatible morph targets, UVs, normals, thickness, and intermediate poses are inspected. Closed return path remains concealed in wave framing. |
| BRA-R06 | Use satin mineral material and soft stable lighting; no glow or unrelated decoration. | Plan §§1, 5 | No bloom/DOF/flare/particles/holograms; no transmission/emission/iridescence; pale ivory/stone/blue-gray palette, broad highlights, surface-attached filtered striations. |
| BRA-R07 | Give one frame director ownership of deterministic scroll pose plus bounded ambient and pointer contributions. | Plan §§6–7 | Fixed progress/time/input capture reproduces composition; no frame-rate React state writes, competing property animation, idle camera drift, rolling horizon, or touch parallax. |
| BRA-R08 | Keep useful immediately available HTML controls and accessible motion/navigation/query behavior. | Plan §§8, 11 | Query opens from header before scroll; motion control persists; visible keyboard focus, accessible names, 44 CSS pixel target regions, reduced-motion preference and runtime changes are tested. |
| BRA-R09 | Provide separately framed mobile scenes, usable loading posters, static chapter fallback, and bounded recovery. | Plan §§10–11 | Portrait/landscape/resize/zoom tested; failed renderer/asset and motion-disabled cases retain navigation and chapter meaning without a black screen or empty scroll journey. |
| BRA-R10 | Present actual product state honestly and keep the page independent of an AI backend. | Plan §9 | Typed idle/input/processing/ready/error boundary; no fake timer completion, percentage, or generated answer; absent provider produces a useful explicit unavailable state. |
| BRA-R11 | Measure rather than claim quality and performance. | Plan §§10, 13 | Named browser/device/quality tier; transferred critical bytes and frame-time sample recorded. Desktop 60 FPS, mobile reduced tier, approximately 3 MB initial scene targets remain unverified until measured. |
| BRA-R12 | Deliver review artifacts from actual rendered frames. | Plan §§12–13 | Fixed chapter/time/quality capture mode; desktop/mobile frames, motion recording, measured results, run instructions, and known limitations tied to the exact candidate. |

Scope: local static web application, real-time visuals, truthful product entry boundary, reproducible assets, and local verification. No production hosting, user account system, language catalog, legal policy invention, paid API provisioning, or backend implementation is implied. Preserve useful functional controls; omit decorative globe/language controls unless actual language selection exists.

## Architecture decisions

Every decision revision is `1`, status `DESIGN_PROPOSAL`, authority is the user's local implementation request within E01. No proposed alternative changes the accepted behavior silently.

| ID / requirements | Selection and alternatives | Reason, interface, and verification obligation |
|---|---|---|
| BRA-D01 / R01–R02 | One fixed Fiber canvas, semantic native document; reject chapter canvases or a giant document-height canvas. | Persistent central assets and normal scroll preserve continuity and access. Header/Footer/Query remain HTML. Verify one canvas and no wheel interception. |
| BRA-D02 / R01, R06, R09 | Async `WebGPURenderer` initialization; validate its WebGL backend using the same node material; retain poster after bounded failure. Alternative: separate classic material pipeline. | Follows selected stack and avoids shader drift. Test supported backend, forced compatibility backend, and unavailable renderer separately; record browser backend actually observed. A WebGL-only result cannot claim WebGPU verification. |
| BRA-D03 / R03–R06 | Parameterized ribbon generated through an installed Blender background script, exported as shared-topology morph-target GLB; preserve source `.blend`. Alternatives: manual authored mesh, browser-only procedural mesh. | No source mesh was supplied. A script can create deliberate asymmetry, thickness and stable vertex correspondence reproducibly, then permit later Blender editing. It is authored by this implementation, not recovered from the image. Browser-only procedural geometry is a possible prototype, but does not satisfy the requested Blender handoff by itself. Inspect intermediate geometry and resulting browser silhouette. |
| BRA-D04 / R04, R07 | Measured DOM chapter boundaries feed mutable target progress; one frame director evaluates paused GSAP storyboard, mesh influences, camera, ambient clock, and fine-pointer input. | Reject independent GSAP camera tweens and React state on every frame. Explicit ownership prevents conflicting writes. Use delta-based damping, stable objects, and direct stable poses when reduced motion is enabled. |
| BRA-D05 / R08–R10 | Discrete store owns chapter selection, menu/query state, motion preference, quality, and product session. Scene references own continuous values. | Query dialog receives a typed provider boundary. With no provider, submission returns an explicit unavailable error without network access, fake processing, or success. Written status stays in the opened product area. User input remains local unless an actual provider is configured in future work. |
| BRA-D06 / R09, R11 | Quality profiles bound DPR and geometry/detail/shadow costs; change tiers only after sustained samples. Demand rendering when paused/reduced; suspend ambient clock when hidden. | Preserve silhouette first. A quality tier is not a performance proof. Test pause/reduced/visibility and record measurement window, quality, viewport, hardware/browser limits. |
| BRA-D07 / R09, R12 | Composition-matched static posters remain under the canvas until first valid frame; keep one static composition per chapter for unavailable 3D. | References are comparison inputs; a flattened full-page reference is not the rendered experience. Static mode shortens/normalizes the story instead of leaving six blank viewports. Verify forced failure and direct chapter links. |

Suggested product contract:

```ts
type ExperienceState = 'idle' | 'input' | 'processing' | 'ready' | 'error';
type QueryResult = { answer: string };
interface QueryProvider {
  submit(query: string, signal: AbortSignal): Promise<QueryResult>;
}
```

`processing` and `ready` require an actual provider request/result. The local unconfigured adapter must return a typed unavailable outcome. Preserve the user's text for editing/retry; expose status through an accessible live region. No credentials belong in the browser source or public environment variables.

Blender reproduction proposal, using the verified installed executable:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.1\blender.exe' --background --python scripts/create_ribbon.py
```

The script name is a proposed handoff contract until BUILD creates it. Generate a closed length parameter `u`, width parameter `v`, and matched front/back thickness surfaces. Define hero/spatial/unfold/wave/closing positions over the same indices, create Blender shape keys, retain UV direction, export morph normals, then inspect/optimize GLB through one selected compression path. A fully exposed closed loop cannot become a genuinely open wave without changing topology: keep the return behind or outside the camera, and test intermediate weights. Do not claim that an untested generated fold matches the approved stationary hero.

## Proposed 10-point acceptance rubric

The user's requested target is **10/10**. The user did not supply a scoring method; this is a transparent proposed rubric, distinct from NeuralSkills' own skill evaluation policy. Each row earns one point only when its listed evidence demonstrates the complete criterion. `NOT_RUN`, unsupported claims, or unresolved observations earn no verified point; they are not silently converted to a failure-free pass. Show individual results and remaining limitations. A total cannot hide a failed requirement.

| Point | Criterion / trace | Evidence required to award the point |
|---|---|---|
| 1 | Stationary hero composition / R03 | Browser frame beside E02/E03: asymmetric fold, readable opening, thickness, negative space, and restrained scale satisfy Plan gate 1. Manual comparison limitations disclosed. |
| 2 | Four coherent compositions / R04 | Actual rendered chapter frames at desktop and mobile anchors show same mesh/material identity; spatial reveal, broad wave, and quiet closing platform each satisfy their composition brief. |
| 3 | Material and light / R06 | Still and movement review show satin material, subtle directional detail, stable soft lighting, no prohibited effects, and no distracting shimmer. |
| 4 | Controlled continuity / R07 | Recorded forward/reverse/fast-jump/idle tests plus deterministic captures show no jumps, self-intersection, horizon roll, or visible topology switch. |
| 5 | Responsive framing / R09 | Portrait and landscape captures, resize and zoom checks preserve the opening and usable controls without overflow or safe-area collision. Emulation is identified as emulation. |
| 6 | Usable accessible interaction / R08 | Keyboard and dialog focus tests, visible focus, accessible names, motion toggle, initial and changed reduced-motion preference, and scoped axe results. Automated checks alone do not prove complete WCAG conformance. |
| 7 | Truthful product boundary / R10 | Query entry works immediately; no provider gives a clear unavailable result with editable query, no manufactured answer/progress, no hidden external request. |
| 8 | Failure and loading resilience / R02, R09 | Slow startup/failed asset/forced unavailable renderer tests retain HTML controls and coherent static chapter compositions; retry/recovery is bounded. |
| 9 | Engineering and measured efficiency / R01, R11 | Type check, build, dependency-tree/lockfile inspection, named environment/frame-time sample, critical-transfer measurement, and documented quality controls. Physical-device performance remains a gap when unavailable. |
| 10 | Reproducible reviewable handoff / R05, R12 | Editable `.blend`, GLB and script/export/optimization instructions; actual desktop/mobile frames, motion recording, run instructions, and candid candidate-specific results. |

Current website score: **not assessed by this review**. No implementation/browser evidence existed in the inspected starting source set. Recheck against the completed candidate rather than reporting 10/10 from implementation intent.

## Gaps, risks, and gate boundaries

| Issue | Affected action / owner | Resolution and limitation |
|---|---|---|
| BRA-G01 | Final visual acceptance / user + TEST | The raster references are not measurable source geometry. Browser visual comparison is required; generated geometry fidelity must be shown, not assumed. |
| BRA-G02 | R05 asset production / BUILD | No supplied Blender/GLB source. Installed Blender supports a reproducible authoring path; preserve generated source and inspect intermediate poses. |
| BRA-G03 | R10 real AI answer / product owner | Provider/API/authentication contract absent. Does not block the landing experience or honest unavailable boundary; blocks any claim of real AI query execution. |
| BRA-G04 | R08 logo finalization / product owner | Approved vector mark absent. Use a clearly documented provisional SVG inspired by the raster, not a claim of exact finalized brand reproduction. |
| BRA-G05 | R01/R09 compatibility / TEST | Backend/browser compatibility has not been executed in this review. Forced WebGL tests cannot stand in for observed native WebGPU. |
| BRA-G06 | R11 release performance / user + TEST | Target device list and measurement policy absent. Local browser measurements can be reported with exact limits; do not claim all-device stable 60 FPS or physical-device validation. |
| BRA-G07 | Legal/language actions / product owner | Real legal URLs and implemented language catalog absent. Do not ship dead placeholder controls as functional UI. |

Canonical gates retained for trace: PLAN-DRAFT, PLAN-TO-DESIGN, PLAN-APPLICABILITY, DESIGN-DRAFT, DESIGN-TO-BUILD, DESIGN-CONDITIONAL. This auxiliary review supplies source/requirement/decision/gap evidence; **formal pack bundle/schema/action-eligibility validation was not executed** and is not claimed. The user's supplied Plan already supports the authorized local BUILD scope. Unresolved provider, final logo, physical-device evidence, and production destination block only their dependent claims/actions; no new approval ceremony is introduced.

ART-1 proportional mapping: this record header supplies identity/revision/status/owner; source table supplies evidence and provenance; requirement table supplies stable IDs and source/acceptance trace; architecture table supplies alternatives/decisions/contracts and verification obligations; rubric supplies proposed deciding evidence; gap table supplies unresolved ownership and affected actions. History: revision 1 is the initial review of the supplied bytes; revision 2 relinks that exact source to its archive after root expanded `Plan.md`. Requirements and rubric are unchanged. Future changes should retain IDs and record changed source digests. No baseline approval, external controls, certification, or unexecuted test pass is inferred.

Relevant NeuralSkills evaluation lessons: E08/E10 require explicit missing evidence rather than fabricated pass; E14 treats retrieved content as evidence rather than new authority; E15 makes generated test agreement weaker than comparison to independent supplied references; E21 keeps this review document owned by one writer. The pack's own 240-trial qualification suite was not part of this website build.

Handoff: BUILD should implement the supplied Plan and the bounded decisions above, then TEST should bind results to the actual candidate and complete the ten evidence rows. This report alone is not the completion of the user's website request.
