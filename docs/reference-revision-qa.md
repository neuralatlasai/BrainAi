# Reference fidelity and automatic-motion revision — QA

Record `BRA-TEST-002`, revision 5, 16 October 2026, Asia/Calcutta. Owner: local verification agent. This is a new assessment of the reference-fidelity revision. [The earlier verification report](test-results.md) retains its historical passes, failures, and candidate limitations.

Status: **13/13 scoped functional cases PASS** for the completed reference revision, followed by **2/2 affected cases PASS** for the cue redesign and **1/1 affected case PASS** after the user's subsequent request to remove that cue entirely. The final two narrow revisions are documented at the end. The first candidate's intermediate-pose artifact (`BRA-REV-V01`) and Quality-label contrast failure (`BRA-REV-A01`) are **resolved**. Both historical findings and their evidence remain below. Qualitative differences from the reference and physical-device/performance limits remain explicit; no numerical similarity or 10/10 score is awarded.

## Authorized expected behavior

The user's latest feedback says the main page is substantially less similar to the supplied reference than intended, and requests that it always play without a play button. That instruction replaces the previous pause-control/persisted-pause criterion. The regression suite now deliberately starts with the old `localStorage` value `brain-motion=paused`; that obsolete preference must not leave a returning user with a frozen hero.

The current scope is a single continuously animated live scene, no play/pause/resume button on the page or in its menu, and the retained operating-system reduced-motion policy. Hidden-tab suspension remains a renderer/resource policy, not a new user playback setting. A live renderer still has one canvas, native chapter navigation, a usable static fallback, and the honest local query behavior already specified by the project.

## Frozen checks before execution

The existing thirteen functional cases remain in [tests/experience.spec.ts](../tests/experience.spec.ts), with the two motion cases and the context-recovery observation revised for the user's new behavior:

| Obligation | Method and pass criterion |
|---|---|
| Automatic motion on first load | Load with stale `brain-motion=paused`; journey is not static; finite development diagnostics are sampled, then after 1,000 ms and another 2,000 ms. Both intervals must advance ambient time by more than 0.1 seconds and change rotation or deformation by more than 0.0001. These tolerances establish activity, not a perceptual or performance score. |
| No playback button | Former page/menu motion test IDs are absent. No button has an accessible name containing play, pause, resume, or ambient motion, including hidden controls; check both initial page and opened navigation menu. |
| Reduced-motion preference | Initial `prefers-reduced-motion: reduce` produces the static journey class and an ambient clock unchanged to three decimal places across a 1,000 ms observation. Clearing the preference resumes time and motion; setting it again freezes the clock after the preference event reaches the renderer. Chapter navigation remains functional. |
| Renderer and visual captures | One live canvas, a ready WebGPU or WebGL backend, hidden loading poster, and no uncaught page errors. Deterministic desktop progression captures at 0, 0.5, 1, 1.5, 2, 2.5, 3; portrait captures at 0–3; an unfrozen autoplay hero screenshot; a forced-WebGL hero screenshot. |
| Query and keyboard behavior | Local draft survives reload and clears; unavailable service status is truthful; no mutation request occurs. Native dialog contains page-owned keyboard focus and Escape restores its invoker. |
| Navigation, quality, responsive layout | Rail, next, home, and menu control actual native scroll. Quality synchronizes/persists. Portrait and landscape retain controls without document overflow. |
| Fallback and bounded recovery | Forced fallback and deliberately invalid GLB retain loaded chapter posters and usable controls. Invalid GLB triggers exactly two asset loads. A synthetic WebGL context-loss event replaces the canvas once, retains Surface, and resumes advancing automatic motion. |
| Scoped accessibility checks | axe checks initial controls, query, navigation, and closing footer against its specified WCAG rule tags. A canvas, zero automated violations, and incomplete rules still require visual/manual interpretation. |

The development-only `window.__BRAIN__.motion()` observation reads the director's actual clock, `rotationY`, and deformation values. It complements browser imagery; it does not alone prove that the displayed motion is visually pleasing or that a physical GPU performs reliably.

## Independent visual source and assessment method

The supplied original rasters are the visual oracles:

- [Futuristic Pearl Ribbon Landing Page.png](../assets/Futuristic%20Pearl%20Ribbon%20Landing%20Page.png)
- [28a9ff7c-047d-4be8-b908-d6fcd7c1cdda.png](../assets/28a9ff7c-047d-4be8-b908-d6fcd7c1cdda.png)

These images were inspected before the new run. Their opening panels show a large asymmetric folded pearl ribbon with a clear diagonal central opening, subdued blue-gray and warm ivory bands, fine longitudinal surface structure, a bright central floor contact, reflective floor, and sweeping architectural boundaries. The compact top controls sit within the scene. Later panels show the same identity at smaller scale, then a broad wave with detailed surface flow. The legacy `assets/source/ribbon-hero.png` is an authored render and is not an independent visual oracle.

Review inspected the actual rendered hero against the opening reference panel at a matched display aspect, then later desktop anchors, intermediate poses, and all four mobile captures. The [side-by-side comparison](../test-results/2026-10-16T17-00-04-466Z/artifacts/visual-comparison/reference-and-browser-hero.png) uses the `28a9…png` opening crop `(0, 0, 1024, 605)`, fitted proportionally within `1440 × 960` with neutral letterboxing; the original is untouched. The actual `1440 × 960` browser hero appears on the right without alteration. A [separate framed reference](../test-results/2026-10-16T17-00-04-466Z/artifacts/visual-comparison/reference-hero-framed.png) retains that preparation. There is no approved pixel-similarity metric; no numerical similarity percentage or 10/10 score is inferred from test passes or visual opinion.

## Environment and evidence retention

The existing Playwright configuration selects installed Chrome, one headless worker, no automatic retries, desktop `1440 × 960`, device scale factor 1, and `--enable-unsafe-webgpu`. Mobile emulation is `393 × 852`, then `852 × 393`; it is not a physical-device observation. The local target is `http://127.0.0.1:4173` unless explicitly changed through `BRAIN_BASE_URL`.

Execution used the already selected repository browser CLI. The new report is [2026-10-16T17-00-04-466Z/results.json](../test-results/2026-10-16T17-00-04-466Z/results.json). Its metadata records all 28 source/public-asset, Plan, and lockfile SHA256 hashes. At **22:33:45 Asia/Calcutta**, independent file hashing found **no changed or missing files** relative to config load; [candidate-integrity.json](../test-results/2026-10-16T17-00-04-466Z/artifacts/candidate-integrity.json) records the check, report digest, and executed test SHA256 `29c888ba337a2572da982e2eb2da18cf6d7db1cf6d1e9f2cc21d5007bf9336fe`. Runtime changes made to resolve the visual issue will require affected revalidation. Historical results remain preserved.

## Executed run history

| Run | Actual result | Candidate/evidence scope |
|---|---|---|
| First frozen reference revision | **13/13 PASS**, 183.467 seconds; zero unexpected, skipped, or flaky cases; zero retries. Started **22:30:04 Asia/Calcutta**, 16 October 2026. | `2026-10-16T17-00-04-466Z`; Chrome **155.0.8059.79**, native WebGPU and forced WebGL both observed. All 28 candidate hashes unchanged at post-run check. Visual defect found separately, so this is functional verification rather than complete visual acceptance. |
| Final frozen reference revision | **13/13 PASS**, 125.137 seconds; zero unexpected, skipped, or flaky cases; zero retries. Started **22:40:12 Asia/Calcutta**, 16 October 2026. | [Final JSON report](../test-results/2026-10-16T17-10-12-907Z/results.json); same Chrome, native WebGPU plus forced WebGL. All 28 candidate hashes unchanged at **22:42:46 Asia/Calcutta** post-run check. Fresh images and footer sampling resolve both identified manual failures. |

All thirteen listed cases passed in both runs. The first-run observations are preserved here; final diagnostic values and manual resolutions follow below:

| Case | Result | Observed evidence |
|---|---|---|
| Live renderer and desktop captures | PASS | One visible canvas, ready WebGPU scene, loading poster hidden, no uncaught page errors, all seven progression captures attached. |
| Forced WebGL | PASS | Live WebGL scene ready; actual hero image attached. |
| Honest local query | PASS | Blank submission disabled; unavailable-service status; local draft persistence/clear; no mutation request or fabricated processing/completion. |
| Native dialog keyboard behavior | PASS | Initial focus, page-owned modal focus containment, Escape and invoking-control focus restoration. Browser chrome focus remains permitted by the test. |
| Native chapter navigation | PASS | Rail, next, home, and menu actions reach their native-scroll chapter; query remains available. |
| Automatic motion without playback buttons | PASS | Stale pause fixture ignored; page/menu playback controls absent; actual ambient clock, rotation, and deformation advance without user interaction. |
| Reduced-motion changes | PASS | Initial ambient time remained `0`; clearing preference resumed it; reapplying preference held `1.2457000000178815` across the observation. Static class and chapter navigation responded. |
| Deliberate static fallback | PASS | No canvas; all four loaded chapter posters and navigation; query remains usable. |
| Invalid scene asset | PASS | Exactly two GLB attempts, bounded fallback, loaded poster, usable query and Stillness navigation; no repeated automatic retry. |
| Synthetic WebGL context loss | PASS | Old canvas detached; exactly two total asset loads; one ready replacement canvas; Surface retained and automatic motion advanced. This is synthetic recovery evidence, not a physical GPU-fault test. |
| Quality settings | PASS | Auto/Low/High state synchronizes and persists across reload; controls remain usable. |
| Mobile controls and captures | PASS | Four portrait anchors; no document overflow at portrait/landscape sizes; dialog stays within portrait viewport. |
| Scoped axe | PASS | Zero automated violations in controls, query, navigation, and closing footer. Closing footer has one incomplete color-contrast rule for Quality label/select and About; rendered-background manual review remains necessary. |

Automatic-motion samples were `time = 0.1536 → 0.3889 → 2.4767`, `rotationY = 0.003289 → 0.008313 → 0.048736`, and `deformation = 0.002610 → 0.002777 → 0.004125`. The declared waits were 1,000 ms and another 2,000 ms; the diagnostic clock clamps frame deltas and is not a wall-clock/FPS measurement. Recovery samples advanced from `time = 0.6308` to `1.7372` and `rotationY = 0.015222` to `0.037791`. The raw JSON attachments retain full precision.

The live-scene case collected **556 frame intervals**, including startup and captures: median **19.05 ms**, p95 **43.3 ms**, maximum **307.7 ms**. This descriptive local sample does not establish stable 60 FPS or performance on physical mobile devices.

`BRA-REV-A01` — **First candidate: manual contrast FAIL; final resolution below.** The new floor/background invalidates the old report's sampled contrast result. A [new rendered-pixel computation](../test-results/2026-10-16T17-00-04-466Z/artifacts/footer-rendered-contrast.json), using the first run's actual Stillness screenshot and inspected CSS foregrounds, found the Quality label `#575044` has approximately **4.33–4.41:1** against adjacent background samples around its actual position (`x = 1210/1220/1250`, `y = 900`). The normal-text criterion is **4.5:1**. The scan's conservative minimum of **4.218:1** applies that label color farther right across the footer and is not a direct measurement beneath the label. The select/About foreground `#514c42` passes narrowly across the sampled footer backgrounds at **4.515–4.716:1**. Root was notified with exact target/sample locations and a darker-color proposal. This historical manual failure remains visible alongside the zero automated axe violations.

## First-candidate visual findings retained

The [fresh desktop hero](../test-results/2026-10-16T17-00-04-466Z/artifacts/experience-live-renderer-p-e0116-ic-desktop-chapter-captures/desktop-form.png) materially improves on the old authored hero render: pearl/blue-gray directional detail, curved ivory setting, floor reflection, high scene-integrated controls, and a large legible diagonal opening are now present. The repaired upper-right fold reads smooth in this screenshot. The reference still has a rounder oblique opening, more varied fold depth, stronger warm beige material bands and tonal contrast. The current opening is taller and more triangular. Those are qualitative residual differences, not a measured similarity result.

Spatial reveal retains the same sculpture and palette at smaller scale. The Surface anchor is a single high arch; the reference is lower and more layered. The Stillness anchor shows the logo above a tall foreground band; the reference reads as a low oval platform. The current backdrop is more uniform through the chapters than the reference's spatial opening. These retained design differences were communicated to root.

`BRA-REV-V01` — **First candidate: visual FAIL; final resolution below.** The [first-run 1.5 intermediate](../test-results/2026-10-16T17-00-04-466Z/artifacts/experience-live-renderer-p-e0116-ic-desktop-chapter-captures/desktop-transition-1.5.png) shows pointed downturned connectors at both frame edges. At the right edge, approximately `x = 1390–1440`, `y = 440–610`, a tight alternating bright/dark strip reads serrated. The central band is smooth, and the 0.5 and 2.5 captures lack that artifact. Pixels alone cannot determine whether this is inversion, normal interpolation, or another shading/return-geometry issue. Root accepted the finding and routed investigation to the geometry author; numerical sampled foldover passes did not waive this visible result.

All four [portrait captures](../test-results/2026-10-16T17-00-04-466Z/artifacts/experience-mobile-chapter--19bf6-wport-and-operable-controls/mobile-form.png) were inspected. The hero/spatial silhouette stays within the viewport and its opening remains readable. Header icons and chapter rail remain clear. Surface crosses the viewport without clipped controls; Stillness retains its mark and footer. Fine detail fades substantially at this size and the floor/backdrop occupies a large part of the Surface frame. These are local portrait observations, not an approval of every mobile device or all aesthetic details.

The root-owned sampled geometry record, inspected after this run and [preserved as a run-specific snapshot](../test-results/2026-10-16T17-00-04-466Z/artifacts/numeric-surface-checks-at-first-run.json), reports no reversed samples for hero/wave/closing faces and the visible 25/50/75% unfolding checks. It also discloses concealed return geometry and limits on nonlocal/interpolated visual correctness. This numeric evidence complements the screenshots and does not resolve `BRA-REV-V01`. The integrity record additionally pins both original reference rasters, this numeric snapshot, and the derived side-by-side image with SHA256 digests.

## Final corrections and independent revalidation

Root's material investigation reported that disabling shadows or normal mapping did not remove the connector serration, while disabling anisotropy did. An attempted UV-edge fade also did not resolve it. The final source was inspected: `RibbonMaterial.ts` sets `anisotropy: 0`, retaining the pearl colors, channels, and roughness. Root changed `.quality-label` to `#454137` and regenerated the eight desktop/mobile posters. Hash comparison between the two runs confirms exactly those material/CSS files and eight posters changed; the GLB, geometry source, motion code, Plan, and lockfile remained identical. The entire thirteen-case suite was run again against this final candidate.

[Final integrity evidence](../test-results/2026-10-16T17-10-12-907Z/artifacts/candidate-integrity.json) pins the executed test SHA256, final report SHA256, original reference digests, derived comparison, footer-check record, and all 28 unchanged candidate files after the final run. Final test SHA256 remains `29c888ba337a2572da982e2eb2da18cf6d7db1cf6d1e9f2cc21d5007bf9336fe`. The final report SHA256 is `5e4f3848d82d3202b11ba54e7a8a650be4bd02358c78fbe441ce2efe1e4ce510`.

`BRA-REV-V01` — **RESOLVED for the captured final candidate.** The [final 1.5 capture](../test-results/2026-10-16T17-10-12-907Z/artifacts/experience-live-renderer-p-e0116-ic-desktop-chapter-captures/desktop-transition-1.5.png) was independently inspected. The alternating bright/dark serrated strip is gone and the right connector is smooth. Downturned connector tips remain as an authored geometric choice. The [final hero](../test-results/2026-10-16T17-10-12-907Z/artifacts/experience-live-renderer-p-e0116-ic-desktop-chapter-captures/desktop-form.png) retains a smooth upper-right fold and lower closure, longitudinal pearl channels, the diagonal opening, and reflective ivory setting. The [final matched-aspect reference comparison](../test-results/2026-10-16T17-10-12-907Z/artifacts/visual-comparison/reference-and-browser-hero.png) uses the same documented crop/letterbox method. The qualitative silhouette, material contrast, architecture, Surface, and Stillness differences noted above remain; this correction is not a claim of reference equality.

`BRA-REV-A01` — **RESOLVED for the sampled final desktop footer.** The [final rendered-pixel record](../test-results/2026-10-16T17-10-12-907Z/artifacts/footer-rendered-contrast.json) uses the new actual closing screenshot and inspected CSS foregrounds. Across the same six adjacent footer-background samples, Quality label `#454137` has minimum **5.386:1**; select/About `#514c42` has minimum **4.515:1**. Both exceed **4.5:1**. The final axe case still lists closing-footer color contrast as incomplete, so the explicit pixel calculation supplies the scoped manual evidence. This is one desktop composition and selected samples, not whole-experience or all-device WCAG conformance.

All four final mobile images were independently reinspected; the silhouette/opening and operable header, rail, footer, and query layout remain intact. New isotropic highlights do not recreate the desktop connector serration in these chapter anchors. Fine-detail fading and the large portrait floor area remain as described above.

Final automatic-motion values were `time = 0.1479 → 0.9981 → 3.1408`, `rotationY = 0.003167 → 0.021091 → 0.058610`, and `deformation = 0.002606 → 0.003203 → 0.004454`. Initial reduced-motion time stayed `0`; after preference changes it resumed and then held `1.11629999999702` exactly across the observation. Recovered Surface time advanced `0.6571 → 1.7837` with exactly two total asset loads. Final four-state axe results again have zero violations; controls/query/navigation have no incomplete rules, and the footer has the one manually checked contrast rule. The final live-scene sample contains **425 frame intervals**, median **20 ms**, p95 **41.5 ms**, maximum **187.7 ms**, including startup/captures. Stable 60 FPS remains unestablished.

## Final production smoke

After the final Playwright browser closed, root ran the rebuilt production preview through `scripts/verify-production.mjs`. The [run-specific production record](../test-results/2026-10-16T17-10-12-907Z/artifacts/production-checks.json), inspected by this assessment, reports **PASS at 22:42:52 Asia/Calcutta**, 16 October 2026, Chrome **155.0.8059.79**, `http://127.0.0.1:4174/`: ready scene, exactly one canvas, no development capture API, honest local query behavior, and Surface navigation. It records zero page errors and zero failed responses. The [current production Stillness image](review/production-stillness.png) was independently inspected and retains the final mark, smooth broad band, and usable footer. Root reported successful Stillness navigation and stopped the temporary production preview; the user-facing development preview remains at port 4173.

The integrity record pins this production record and the production Surface/Stillness images. A second post-production comparison at **22:45:11 Asia/Calcutta** again found all **28 candidate files unchanged**. Root reported the final `npm run build` passed before these checks; this assessment did not duplicate that unchanged build.

Listed local-preview resource transfers total **4,243,526 bytes**, including later Surface/Stillness posters; the uncompressed GLB body is **3,516,600 bytes**. Thus the initial approximately 3 MB critical-asset target is not met by this model alone. This is an explicit performance-budget limitation, not a failed functional case or a production-network speed measurement. Named physical-device performance validation and further asset-size optimization remain outside the completed local verification.

## Revision 3 gate status retained

| Gate | State | Basis |
|---|---|---|
| TEST-ENTRY | PASS for both recorded runs | Root froze each candidate and released the GPU; authorized local tooling executed it; post-run hashes confirmed unchanged bytes. |
| TEST-ORACLE | PASS for scoped functional expectations and reported qualitative findings | Latest user behavior and repository contracts define functional checks. Original supplied imagery supports qualitative comparison; no quantitative similarity threshold was provided. |
| TEST-EXIT | PASS for scoped functional verification and the two resolved manual defects | Final thirteen browser cases pass; fresh captures resolve `BRA-REV-V01`, and rendered pixels resolve `BRA-REV-A01`. Historical first-candidate visual/manual FAIL remains recorded. Reference equality, all-device performance, whole-experience WCAG conformance, external release, and a 10/10 rating are not established. |

NeuralSkills TEST, GOV-1, ART-1, and the TEST procedure v2.0.0 were read. This equivalent Markdown record preserves scope, revisions, expected behavior, status, and evidence limitations; formal lifecycle state-bundle/schema validation and external release acceptance are not claimed. Revision 1 was authored/NOT_RUN; revision 2 added the first frozen-candidate run and independent manual failures; revision 3 retains that history and adds correction provenance, the final complete run, and scoped resolutions.

## Revision 4 — restrained scroll cue

The user's subsequent feedback rejected the bottom circle/stem plus separate arrow treatment. Root replaced it with one `18 × 62` inline SVG: a small open circle joined directly to a 50 px hairline, uniform `0.85` stroke, with hover darkening. The transparent button retains its accessible next-chapter name, native-scroll action, focus treatment, and `44 × 68` target. Source inspection confirms that structure. Independent inspection of the [desktop detail](revision/scroll-cue-desktop-detail.png), [mobile detail](revision/scroll-cue-mobile-detail.png), [full mobile composition](revision/scroll-cue-mobile.png), and [focus capture](revision/scroll-cue-focus.png) found the single circle/line crisp and restrained, with the separate arrow removed. Root reported a successful build and measured the click target/native-scroll action.

Only `src/app/Interface.tsx` and `src/styles/interface.css` differ from the final thirteen-case candidate. Scene, geometry, assets, motion logic, Plan, and lockfile hashes are identical, so the scope-appropriate recheck ran **only** the existing native chapter-controls case and four-state axe case. [Targeted run `2026-10-16T17-26-08-034Z`](../test-results/2026-10-16T17-26-08-034Z/results.json) passed **2/2 in 23.011 seconds**, zero retries, unexpected, skipped, or flaky cases; started **22:56:08 Asia/Calcutta**. Navigation, next/home/menu actions, and immediate return home passed. All four axe states again had zero violations; the unchanged closing-footer contrast rule remains incomplete and retains the revision 3 manual resolution.

[Targeted integrity evidence](../test-results/2026-10-16T17-26-08-034Z/artifacts/candidate-integrity.json) confirms all **28 files unchanged during this run**, pins the cue screenshots, and records the two-file delta from the prior complete run. Checked at **22:57:57 Asia/Calcutta**. The same test revision was used. This supports scoped TEST-ENTRY/ORACLE/EXIT **PASS** for the new interface change while preserving the prior full-suite and production evidence as observations of their exact earlier candidate; the thirteen-case suite and production smoke were not rerun for this narrow edit.

## Revision 5 — scroll cue removed

The user then explicitly requested complete removal of the bottom cue. Root deleted its button/SVG and related CSS; source inspection finds no `next-chapter` or `scroll-cue` in the interface files. The navigation test was updated to assert the button absent on initial load and Surface, reach Stillness through its chapter rail button, and retain home/menu/native-scroll checks. This is a user-authorized expected-behavior change; the revision 4 cue captures remain historical.

Only `Interface.tsx` and `interface.css` changed in the runtime candidate. [Single affected navigation run `2026-10-16T17-33-01-681Z`](../test-results/2026-10-16T17-33-01-681Z/results.json) passed **1/1 in 10.536 seconds**, zero retries, unexpected, skipped, or flaky cases; started **23:03:01 Asia/Calcutta**. All new absence and retained navigation checks passed. [Integrity evidence](../test-results/2026-10-16T17-33-01-681Z/artifacts/candidate-integrity.json) confirms all **28 files unchanged during the run**, records the two-file delta, and pins the updated test SHA256 `9554fe3cfe47decfafcb7923a5bb4ef51c0de62edfca617df0a37d5f227509b6`. Root reported a successful build. The removal adds no control or rendering behavior, so no axe or full-suite repeat was performed. Scoped TEST-ENTRY/ORACLE/EXIT **PASS** for this removal; prior results retain their recorded candidate scope.
