# Browser verification

Record `BRA-TEST-001`, revision 4, 2026-10-16, Asia/Calcutta. Assessment owner: local verification agent. Expected behavior comes from the supplied brief now archived as `docs/original-plan.md`, the user’s local implementation request, and the requirement mapping in `implementation-review.md`. NeuralSkills TEST 2.0.0 guidance was read alongside its shared contracts.

Status: tests authored and executed; **13/13 scoped functional cases PASS**, followed by **3/3 affected cases PASS on final footer CSS**. Runtime source/public assets, Plan, and lockfile hashes were unchanged during each cited run. Only `src/styles/interface.css` changed between the full functional run and final affected run. Tests are generated from the brief and therefore are not an independent proof of aesthetic fidelity. Supplied raster references remain the independent visual comparison source. No external release, ISO certification, or all-device performance claim is made.

## Environment and reproducibility

- Local Vite development server: `http://127.0.0.1:4173`.
- Windows, installed Google Chrome `155.0.8059.79`, headless, one worker, no automatic retries.
- Playwright `1.64.1`; axe-core invoked through `@axe-core/playwright`.
- Desktop viewport `1440 × 960`; mobile viewport emulation `393 × 852`, then landscape `852 × 393`. Device scale factor 1. Mobile emulation is not a physical-device observation.
- Native WebGPU scene and deliberately forced WebGL compatibility backend are tested separately. The development `?fallback=1` hook tests static-mode behavior.
- Timestamped JSON reports, screenshots, and failure traces remain under `test-results/`; repeated runs do not overwrite previous failures. The final config includes SHA256 hashes of runtime source/public assets, the lockfile, and Plan at config load in report metadata.

Run with the server already listening:

```powershell
npm run typecheck
npx playwright test
```

Optional `BRAIN_BASE_URL` changes the server; `BRAIN_BROWSER_PATH` chooses a browser executable; `BRAIN_TEST_RUN` assigns an explicit evidence-folder name. The config chooses installed Chrome when present and otherwise uses Playwright-managed Chromium. It does not install a browser.

## Preserved run history

| Run | Observation | Evidence |
|---|---|---|
| Initial renderer smoke | 1/1 passed, 54.1 seconds overall; actual live canvas and four desktop anchor captures. | `test-results/2026-10-16T15-24-16-746Z/results.json`; early artifact directory was `2026-10-16T15-24-19-753Z` because worker config generated its own timestamp. The config now shares one run ID. |
| First full run | **8 passed, 3 failed**, 3.6 minutes. Tests, source, and assets were still under active development; use this run as defect discovery rather than final candidate acceptance. | `test-results/2026-10-16T15-26-28-657Z/results.json`, associated screenshots and traces. |
| Corrected cases | **3/3 passed**, 54.5 seconds. Dialog page focus/Escape, static fallback through Stillness, and all three axe panels passed after source fixes and the documented harness correction. | `test-results/2026-10-16T15-31-47-025Z/results.json`; runtime source/public hashes retained in config metadata. |
| Interrupted candidate run | First live desktop case timed out during startup; worker cleanup took 11.6 minutes. The following five cases completed successfully before cancellation: WebGL, query, dialog, chapter navigation, and motion persistence. Root reported a pending geometry correction, so the remaining stale run was stopped; no final acceptance is inferred. | `test-results/2026-10-16T15-36-50-362Z/artifacts/`; timeout context/trace retained. Ctrl+C did not finalize the JSON reporter. Concurrent activity/mutable candidate limit diagnosis; browser starvation is an inference, not a proven cause. |
| Complete pre-lifecycle run | **11/11 passed**, 95.265 seconds, zero retries, skips, failures, or flaky cases. Started 2026-10-16 at 21:22:15 Asia/Calcutta. Native WebGPU and forced WebGL both observed. | `test-results/2026-10-16T15-52-15-560Z/results.json`; source/public hashes unchanged during that run. Subsequent lifecycle/poster changes required revalidation. |
| Lifecycle run | **13/13 passed**, 78.240 seconds; invalid-asset and synthetic context-loss tests added. Superseded for final-candidate claims because FrameDirector initialization changed during this run. | `test-results/2026-10-16T15-59-12-141Z/results.json`; the sole changed runtime hash was `src/scene/FrameDirector.tsx`. Historical passes retained. |
| Final complete run | **13/13 passed**, 96.020 seconds, zero retries, skips, failures, or flaky cases. Started 2026-10-16 at **21:31:34 Asia/Calcutta**. Native WebGPU and forced WebGL both observed. | `test-results/2026-10-16T16-01-34-329Z/results.json`; candidate hashes in `config.metadata.candidateAtConfigLoad` were rechecked afterward with **no changed files**. This includes refreshed desktop/mobile poster assets. |
| Final CSS affected run | **3/3 passed**, 20.854 seconds, zero retries, skips, failures, or flaky cases. Started 2026-10-16 at **21:37:14 Asia/Calcutta**. Quality/persistence, mobile frames/controls, and four-state axe checks passed. | `test-results/2026-10-16T16-07-14-536Z/results.json`; final CSS SHA256 `b857ec4179dd63d6adc19c7f5c500c7212ae7024194dfb5408a7453c0899091a`. Hash comparison against full13 found only this CSS changed; no files changed during the targeted run. |

## First full-run case results

| Case / requirement | Result | Observed behavior |
|---|---|---|
| Live scene / BRA-R01–R04 | PASS | One visible live canvas; loading poster hidden after readiness; deterministic desktop form/space/surface/stillness captures; no uncaught page errors during that case. |
| WebGL compatibility / BRA-R01, R09 | PASS | Forced WebGL backend reached ready and produced a live hero screenshot. |
| Honest query / BRA-R10 | PASS | Empty/whitespace submission disabled; nonempty query reports unavailable service; draft survives reload in sessionStorage and can be cleared; no POST/PUT/PATCH/DELETE request observed; no fabricated processing/ready state. |
| Native modal focus / BRA-R08 | HARNESS DEFECT | Initial textarea focus passed. The test incorrectly treated native browser-UI focus as background-page focus. Diagnostic showed `BODY` only while `document.hasFocus()` was false, next Tab returned inside the dialog, and Escape restored the query button. Corrected assertion requires all in-document keyboard focus to stay inside modal; browser chrome remains permitted. Original failed result retained. |
| Native chapter navigation / BRA-R02, R04 | PASS | Rail, next, home, and menu chapter actions change native scroll and active chapter; query remains available. |
| Motion preference / BRA-R08 | PASS | Pause control accessible state and local preference persist after reload; menu control stays synchronized. |
| Reduced motion / BRA-R08–R09 | PASS | Initial preference produces stable/static chapter policy; runtime preference changes update control and journey policy. |
| Static fallback / BRA-R09 | FAIL | Stillness chapter could not become active from its rail button after fallback shortened the scroll track. Earlier static chapter/poster checks passed. Reported to BUILD for anchor remeasurement. |
| Quality settings / BRA-R11 | PASS | Low/high selections synchronize between menu/footer and persist after reload. |
| Responsive controls / BRA-R09 | PASS (scoped) | Four mobile frames captured; no horizontal document overflow; query dialog within portrait viewport; header query control remains available in landscape. This does not itself approve all mobile silhouettes. |
| Scoped axe / BRA-R08 | FAIL | Main controls had zero violations. Query privacy note had 4.19:1 contrast (`#7c7261` on `#f4f1e9`, 10px) versus 4.5:1 requirement. Navigation analysis was not reached after the query assertion. Harness now uses per-panel soft assertions to collect every panel while retaining any failure. |

## Final lifecycle and recovery verification

All eleven original cases passed again against the final lifecycle code and regenerated posters. Two added cases exercise actual failure/recovery behavior:

| Case / requirement | Result | Observed behavior and scope |
|---|---|---|
| Invalid GLB / BRA-R09 | PASS | The actual `/models/ribbon.glb` request was fulfilled with deliberately invalid data. Exactly two asset requests occurred: initial load and one automatic compatibility attempt. The experience settled to static mode with no canvas, a loaded visible poster, working query/error handling, and reachable Stillness. Normal interface use did not trigger further automatic retries. |
| Context-loss recovery / BRA-R09 | PASS | A cancelable `webglcontextlost` event was dispatched to the live forced-WebGL canvas at the actual Surface scroll anchor with ambient motion enabled. The old canvas detached, exactly one replacement asset load occurred, the renderer returned ready using WebGL, and Surface/motion preference remained selected. The recovered screenshot shows the expected wave composition. This tests the event/recovery contract; it is a synthetic event, not an observation of a physical GPU fault. |

The context-loss test keeps motion enabled so static snapping cannot mask a recovered renderer beginning at the wrong chapter. Readiness lifecycle checks include the revised frame initialization and callback/cleanup guards.

## Final footer contrast impact

After the full functional run, root’s manual pixel check found footer text contrast of **4.33–4.41:1** on the actual rendered floor gradient. Root darkened only footer foreground declarations in `src/styles/interface.css`: footer color `#514c42`, and chapter-caption/quality-label color `#575044`. TypeScript, model geometry, materials, images/posters, and product state behavior were unchanged. Runtime/public hash comparison independently confirmed that CSS was the sole changed file.

The retained13/13 functional observations remain applicable because the correction changes foreground color and not navigation, storage, query, renderer, or recovery code. Impacted quality/footer state, mobile composition/controls, and accessibility states were rechecked in the final3-case run rather than silently inheriting older visual results. The axe case now opens controls, query, navigation, and closing footer, with native Escape between dialogs and Stillness selected before the footer check.

All four final axe states reported zero violations. Query and navigation had no incomplete rules. Controls and closing footer each had one incomplete color-contrast rule because axe could not determine the background under text over the scene gradient/canvas; closing-footer targets include caption, Quality label/select, and About. The actual rendered-pixel/manual check remains the deciding evidence for contrast, not an automated zero-violation count.

The manual finding is **resolved** by inspected `docs/review/footer-contrast.json`, captured on 2026-10-16 at **21:39:39 Asia/Calcutta** from `docs/review/production-stillness.png`. It computes both CSS foreground colors against six adjacent rendered-background samples and records a minimum **5.75:1**, exceeding the **4.5:1** criterion. Caption/Quality checks range 5.75–5.86:1; About/inherited-footer checks range 6.16–6.28:1. Root visually inspected the actual image. This resolves the sampled closing-desktop finding and does not certify every viewport or page.

## Production and geometry evidence

Root’s final production build and local preview smoke **passed after the footer-color correction**. The refreshed inspected record `docs/review/production-checks.json` was captured on 2026-10-16 at **21:39:15 Asia/Calcutta**, using Chrome 155.0.8059.79 at `http://127.0.0.1:4174/`. It records a ready scene, exactly one canvas, absent development capture API, truthful local query behavior, working Surface navigation, zero page errors, and zero failed responses. Listed resource transfers total **2,382,297 bytes**, including Surface and Stillness posters loaded during navigation; these are local preview measurements, not a production-network speed guarantee. Root inspected the production Surface and final Stillness frames. The temporary production server was stopped; development preview at port 4173 remains available and root verified HTTP 200. No further runtime/source changes followed these checks.

`docs/review/geometry-checks.json` records numeric checks passing for all five poses (hero, spatial, unfold, wave, closing), each with 12,593 vertices. Maximum unit-normal error was below `4.5e-8`; maximum seam error was below `9.6e-7`; the unfold midpoint error was `7.16e-7` or less. These numeric invariants complement the browser captures and do not by themselves prove absence of visible intersections. Root owns the build/production and numeric geometry checks; this report inspected their retained records rather than rerunning unchanged checks.

## Visual observations and limits

Independent image inspection found the initial hero to be an asymmetric readable satin band, and the spatial reveal preserved subject identity. Initial wave/closure captures exposed return geometry at frame edges; the closing shape read as a thin bridge with curled ends rather than a broad settled platform. Those findings were reported and corrected. A subsequent intermediate 1.5 capture revealed a crumple; root and geometry author corrected vertex correspondence/orientation before the final run.

Final desktop captures at progression **0, 0.5, 1, 1.5, 2, 2.5, 3** are in `test-results/2026-10-16T16-01-34-329Z/artifacts/experience-live-renderer-p-e0116-ic-desktop-chapter-captures/`. Final portrait mobile anchors 0–3 are in `artifacts/experience-mobile-chapter--19bf6-wport-and-operable-controls/` under the same run. Recovered Surface is `artifacts/experience-synthetic-WebGL-fb41d-apter-and-motion-preference/context-recovered-surface.png`. Native WebGPU backend and Chrome version are recorded in each capture manifest. The final mobile hero shows the whole opening and silhouette. Final 1.5 is a smooth continuous surface without the prior crumple; downturned connectors remain visible near extreme edges as an authored interpretation. Final closure is broad and no longer shows curled end clumps. These observations do not claim pixel equality with the raster.

The final scene test collected **328 raw frame intervals**, including startup and chapter capture transitions: median **17.0 ms**, p95 **31.4 ms**, maximum **346.9 ms**. This descriptive sample does **not** demonstrate stable 60 FPS. A steady-state performance acceptance window and physical-device matrix remain necessary for that claim.

Final axe results and their incomplete/manual limits are recorded in the footer-contrast impact section above; the three-state results from the earlier full13 run remain in its raw report.

Navigation now waits for DOM content and then explicitly checks HTML controls/readiness, rather than waiting for every loading resource before beginning UI assertions. The renderer deadline and test criteria are unchanged.

No 10/10 website score is awarded by this automated suite. Physical devices, Safari/Firefox, exhaustive GPU/device loss, backend execution, and formal full WCAG conformance were not tested. Frame-time arrays are descriptive local observations, not a statistical all-device guarantee. Final regenerated posters are included in this run’s hash manifest and fallback checks; any later runtime/image changes require affected revalidation.

Canonical TEST gates: TEST-ENTRY is supported for these authorized local checks; TEST-ORACLE supports the stated functional expectations but does not establish final aesthetic approval; scoped local browser TEST-EXIT is **PASS** for the pinned functional run plus explicitly impacted final-CSS checks, while broader all-device/performance/visual acceptance is not established. Any later runtime/image changes require affected revalidation. Formal NeuralSkills state-bundle/schema eligibility checks were not run or claimed. Revision4 retains earlier failures/superseded candidates and adds the CSS-only impact decision and final targeted evidence; it does not overwrite historical outcomes.
