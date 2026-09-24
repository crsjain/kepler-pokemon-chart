# 🏗️ Senior Staff Engineer Codebase Assessment: Refactoring Sanity Check

- **Originally authored:** September 12, 2026 (Checkpoint 50)
- **Last revised:** September 23, 2026 (Checkpoint 57) — metrics re-measured, Trigger 1 replaced. See [§7 Revision History](#7-revision-history).
- **Context:** Follow-up sanity check to the July 19, 2026 assessment (`.gemini/handoffs/2026-07-19-064631-kepler-pokemon-chart-refactor.md` & `phase2_recommendations.md`)
- **Active Branch:** `prototype/pokemon-badge-collection`
- **Audience:** Engineering leads, PM, and future Jetski pair-programming sessions

> [!IMPORTANT]
> **The verdict below is unchanged: do not refactor.** What changed in the
> September 23 revision is the *evidence*. The original Trigger 1 ("test suite
> exceeds 60 seconds") was measured and found to be an invalid proxy for
> architectural health — see [§4](#4-reassessment-rubric-when-should-we-refactor).

---

## 1. Executive Summary & Verdict

### **Verdict: DO NOT REFACTOR AT THIS TIME**

> **Senior Staff Heuristic:**  
> *"Do not refactor production code unless it is absolutely necessary."*

An in-depth technical assessment of the `kepler-pokemon-chart` repository confirms the Staff Engineer's guidance. Refactoring the codebase at this milestone is **not recommended**. The architecture is stable, resilient, highly performant, and well-aligned with both real-world PWA constraints and AI-assisted (Jetski) rapid iteration.

### Key Health Metrics

| Metric | Sept 12, 2026 (original) | **Sept 23, 2026 (measured)** |
| :--- | :--- | :--- |
| Test suite | 77/77 passing, ~17 s | **76 blocks / 75 unique numbers, 100% green, ~25–30 s** |
| `app.js` | 4,259 lines | **4,487 lines** |
| `style.css` | ~5,900 lines | **6,183 lines** |
| `tests.js` | 6,330 lines | **7,601 lines** |
| Whole-app load + parse + eval | not measured | **1.34 s** |
| End-user performance | 60 fps, zero runtime exceptions | unchanged |

**Shipping Velocity:** Consistently high, and unchanged in this revision. Complex
features (Command Dock, Partner Showcase, Shop Duplicate Repurchasing, Standalone
Galarian Moltres) were each designed, implemented, and verified in single pairing
sessions. Smooth 60 fps execution persists on target client devices (Kepler's 7yo
tablet, Lyra's device, mobile, desktop) with zero reported runtime exceptions or
data corruption.

> [!WARNING]
> **The ~17 s figure was stale from Checkpoint 55 onward.** Checkpoint 54
> measured 24 s after a harness optimization, but Checkpoints 55, 56, and 57 each
> copy-pasted "~17s" into their metadata without re-measuring. The true current
> figure is **~25 s**. Wrap-up must record the *measured* time, never carry the
> previous checkpoint's number forward.

### Codebase Growth Since the Phase 2 Deferral

The original assessment did not quantify growth. It should have — this is the
variable that actually moved:

| Date | `app.js` lines | Note |
| :--- | ---: | :--- |
| 2026-07-02 | 212 | |
| 2026-07-19 | 2,106 | **Phase 2 deferred here** |
| 2026-08-04 | 2,863 | |
| 2026-09-13 | 4,259 | original assessment written |
| 2026-09-23 | **4,487** | this revision |

`app.js` **more than doubled (+113%)** between the July deferral and the
September "no change needed" verdict. This does not by itself justify a refactor
— but it means the verdict is being reaffirmed against a premise that moved, and
it should be tracked explicitly rather than rediscovered.

---

## 2. Retrospective: What Happened to the July 2026 "Phase 2" Plan?

On July 19, 2026 (Checkpoint 16), Phase 1 was completed (extracting migrations, date utils, pokemon configs, debounced cloud saves). A deferred "Phase 2" roadmap was drafted proposing three tasks. Here is how they evaluated over the subsequent 34 checkpoints:

| July 2026 Phase 2 Proposal | Evaluation at Checkpoint 50 | Senior Staff Engineering Assessment |
| :--- | :--- | :--- |
| **1. Modularize `app.js` into layers** (`ui_renderer.js`, `ui_events.js`, `constants.js`) | **Superseded by Domain-Driven Modularity** | **Rejected.** Layer-based modularity (splitting rendering from event listeners) in vanilla JS introduces tight bidirectional coupling, circular dependency risks, and higher cognitive overhead. Instead, the project organically evolved *domain-driven modularity* (`shop.js`, `vault.js`, `badges.js`, `admin.js`, `audio.js`). |
| **2. Incremental DOM updates for weekly grid** (`renderGridTable`) | **Already Implemented!** | **Resolved.** Line 1277 of `app.js` runs `renderState(rebuildGrid = false)` by default, selectively updating only dirty checkboxes (`updateGridCheckboxes`) and badges rather than re-rendering the table DOM. |
| **3. Split `style.css` via `@import`** (`variables.css`, `grid.css`, `modals.css`, `game.css`) | **Intentionally Deferred** | **Rejected.** In a vanilla PWA without a bundler, CSS `@import` creates sequential network waterfalls and complicates Service Worker caching. Single-file CSS guarantees cascade determinism. |

---

## 3. Five-Pillar Engineering Evaluation

### Pillar 1: AI (Jetski) Readability & Context Economics
A common myth is that "micro-files (100–200 lines) are easier for AI coding assistants." For LLM agents operating via tool calls (`view_file`, `grep_search`, `replace_file_content`), the opposite is true:
1. **Context Fragmentation:** If task checking logic is split across `grid_controller.js`, `grid_renderer.js`, `xp_engine.js`, `event_bindings.js`, and `dialog_service.js`, an AI agent must make 8–12 round-trip tool calls across multiple files just to trace a single click interaction. This burns token budget, increases latency, and increases the probability of hallucinating imported variable scopes.
2. **Domain Cohesion:** In the current architecture, task grid and weekly lifecycle logic reside cohesively in `app.js`, while distinct domains (`shop.js`, `vault.js`, `admin.js`) are self-contained. Jetski can inspect, understand, and safely modify functionality in 1–2 tool calls.
3. **Searchability:** Functions have descriptive, unique names (`handleCheckboxChange`, `renderState`, `showCustomConfirm`, `getPokemonCost`). `grep_search` locates exact symbols instantly without traversing deep directory trees.

> [!CAUTION]
> **Sept 23 revision — this pillar has been partially falsified by our own tooling.**
> [`_agents/AGENTS.md` §2](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/_agents/AGENTS.md)
> now carries a standing instruction that `app.js` (4,487), `style.css` (6,183),
> and `tests.js` (7,601) are *"big enough to blow a context window — always grep
> or read line ranges; never dump them whole."*
>
> That rule exists **because** the monolith imposes a real cost on the very
> workflow this pillar claims it optimizes. Both statements are true
> simultaneously:
> - Fragmenting into 12 interdependent micro-files **would be worse** (the
>   context-fragmentation argument above still holds).
> - `app.js` is nonetheless **past the point of comfortable whole-file
>   reasoning**, and agents now pay a navigation tax on every visit.
>
> The original text presented this as settled in favour of the monolith. It is
> not settled — it is a tradeoff that currently still favours the monolith, and
> which will stop doing so if `app.js` keeps growing. See Trigger 1 in §4.

### Pillar 2: Architectural Reality of a Vanilla PWA
The application intentionally uses native browser features without a JavaScript bundler (no Webpack, Vite, or Rollup):
- **Native ES Module Traps:** In native browser `<script type="module">`, circular dependencies throw fatal runtime errors (`ReferenceError: Cannot access 'X' before initialization`). Splitting `app.js` into interconnected modules that share `state`, `playSound()`, `showCustomConfirm()`, and `renderState()` creates immediate circular dependency hazards.
  > [!NOTE]
  > **Corrected Sept 24, 2026 (Checkpoint 61).** The hazard is real but *conditional*: it only bites if an extracted module imports from `app.js`. Verified at `8a3e0e7`: **no module imports `app.js`**, statically or dynamically. The repo already has a working mitigation. `admin.js` receives `showCustomConfirm`, `showCustomNotification`, `renderState` and the cloud/wipe functions through **callback injection** (`initAdmin(appCallbacks)`, [`admin.js:13`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/admin.js#L13), wired at [`app.js:1003`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js#L1003)), and `shop.js` uses the same `initShop(callbacks)` shape. The only outside consumer of an `app.js` export is `tests.js`, via `window.__test_helpers__`. Extraction risk therefore lives in **reassigned module-level `let`s** (ESM importers cannot reassign imported bindings) and **test mock seams**, not in the import graph.
- **Service Worker & Cache Invalidation:** The app relies on `service-worker.js` caching (`ASSETS_TO_CACHE`) and query-string cache busting (`style.css?v=X.XX`, `app.js?v=X.XX`) for offline tablet usage. Every additional split file increases the risk of stale cache mismatches and offline white-screen failures.
- **Cascade Specificity in CSS:** `style.css` (6,183 lines) has carefully tuned cascade specificity for modal overrides and responsive breakpoints. Splitting into multiple files with `@import` risks cascade order anomalies and increases initial page load latency.

### Pillar 3: Empirical Performance & Hardware Constraints
- The UI runs at a consistent 60fps on mobile and tablet browsers.
- The 1.5-second debounced cloud synchronization (`debounceWithFlush`) bundles rapid checkbox taps into a single Firestore write, preventing network thrashing.
- Checkbox toggles trigger targeted updates (`updateGridCheckboxes()`) without destroying or rebuilding DOM nodes.
- Total headless test execution across all 76 test blocks takes **~25–30 s** (four runs on Sept 23 measured 23.2 s, 25 s, 26.3 s and 29.6 s). Previously reported as ~17 s.

> [!NOTE]
> Checkpoint 57 recorded "83 test blocks," which was also wrong. The audit
> command yields **76 blocks / 75 unique numbers** (range 11–39, 41–42, 45–88,
> with 40/43/44 as deliberate historical gaps and `12` the one expected
> duplicate). Notably, the *numbering range* Checkpoint 57 quoted sums to exactly
> 75 — so only the headline count was bad. Another instance of a figure being
> carried forward instead of measured.

#### Measured attribution of a ~26 s run (Sept 23, 2026)

Three instrumented runs were taken to find out *what the suite time is actually
made of*. The result materially changes how this metric should be read:

| Phase | Cost | Related to app architecture? |
| :--- | ---: | :--- |
| Chrome cold start + CDP setup | ~2.6 s | ❌ Fixed harness overhead |
| Deliberate `sleep()` padding | ~6.3 s | ❌ Test design |
| CDP `Network` domain event firehose | ~2.0 s | ❌ Harness configuration |
| **Whole-app fetch + parse + eval** | **~1.34 s** | ✅ **Yes — and only this** |
| DOM work, 2,226 console round-trips, asserts | remainder | ⚠️ Partly |

Supporting measurements:

- `tests.js` contains **571 `sleep()` call sites** declaring **53,140 ms** of raw
  delay. 563 are scaled ×0.1 in headless mode (→ ~5.2 s); 8 use `force: true` and
  run unscaled (→ 1.14 s).
- Disabling the CDP `Network` domain alone cut **2.0 s** off the run.
- The suite emits **2,226 browser console lines** (2,731 total CDP messages).
  `assert()` logs on **success**, not only on failure.
- Navigate fired at 2,556 ms; `Page.loadEventFired` at 3,895 ms. That 1,339 ms
  gap is the entire cost of loading all 24,657 lines of JS/CSS/HTML.

> [!IMPORTANT]
> **The original inference — "~17 s proves there are no bottlenecks" — does not
> follow, and the converse would not follow either.** At most ~5% of suite
> runtime is attributable to the size or structure of the application code.
> Splitting `app.js` would not reduce it; absent a bundler it means the same
> bytes over more HTTP round trips, so page load would likely get *slower*.
>
> Test wall-clock measures **test design**, not architecture. This is why
> Trigger 1 was replaced in §4.

### Pillar 4: Regression Blast Radius
- The project possesses **7,601 lines of comprehensive integration tests** in `tests.js` (6,330 at the original assessment).
- Many test assertions interact directly with DOM hierarchy, event handlers, and exported functions.
- An arbitrary refactor would require rewriting dozens of tests for zero functional gain, risking regressions in core kid-facing workflows (checking daily tasks, leveling up partners, claiming Friday rewards).

### Pillar 5: Product Value vs. Opportunity Cost
- Time spent on cosmetic refactoring is time *not* spent delivering fun features, game mechanics, and motivational tools for Kepler and Lyra.
- In software engineering, refactoring without a measurable functional or operational problem is premature optimization.

---

## 4. Reassessment Rubric: When Should We Refactor?

Keep this checklist for future reviews. **Do not refactor unless at least ONE of
these trigger conditions is met.**

**Review cadence:** re-evaluate at every 10th checkpoint (next: **Checkpoint 60**),
or whenever Trigger 4 is on the table. Record the *measured* numbers each time.

### ~~Trigger 1 (Test Suite Degradation): suite exceeds 60 seconds~~ — RETIRED Sept 23, 2026

> [!CAUTION]
> **This trigger was invalid and has been removed.** Measurement (Pillar 3) shows
> at most ~5% of suite runtime is attributable to application code size or
> structure. It fails in both directions:
>
> - **False positive:** adding sleep-heavy tests to a perfectly healthy codebase
>   trips it, and no refactor would help.
> - **False negative:** `app.js` doubled in size between July and September while
>   the suite got *faster*.
>
> **The project's own history confirms this.** The suite has crossed 30 s twice
> and neither fix involved application code:
>
> | When | Time | What actually fixed it |
> | :--- | :--- | :--- |
> | Checkpoint 28 | ~40 s → 17 s | Debounce 1500→50 ms in test mode; `sleep()` scaled 0.2×; CDP sprite mocking |
> | Checkpoint 54 | ~32 s → 24 s | Launch on `about:blank`; fast CDP port polling; `sleep()` scaled 0.1×; `waitFor()` |
>
> Note also that 60 s is the harness's own `TEST_TIMEOUT_MS` abort watchdog
> ([`run_headless_tests.js:96`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/run_headless_tests.js#L96)),
> not a considered architectural threshold. At 60 s the suite kills itself and
> screenshots.
>
> **If the suite gets slow, tune the harness, not the architecture:** the sleep
> budget (571 call sites, 53 s declared), the CDP `Network` domain (~2 s), and
> `assert()` logging on success (2,226 console lines) are the levers.

### Replacement triggers

- [ ] **Trigger 1a (Test Flakiness):** Any non-deterministic failure across 3
      consecutive runs of `node run_headless_tests.js`. Unlike duration, flakiness
      *is* a genuine architectural smell — it usually indicates hidden shared
      state or ordering coupling. **This is the real signal the old trigger was
      groping for.**
- [ ] **Trigger 1b (Load Weight):** Whole-app fetch + parse + eval exceeds
      **3 seconds** (measure: `Page.navigate` → `Page.loadEventFired` in the
      headless harness). This measures codebase weight *directly*.
      **Current: 1.34 s — 45% of budget.**
- [ ] **Trigger 1c (Context-Window Tax):** A single file grows to the point where
      routine edits require more than ~3 grep/range-read round trips to locate
      and safely change one behaviour. **Current status: `app.js` at 4,487 lines
      is approaching this** — `_agents/AGENTS.md` already forbids reading it
      whole. *Action if tripped:* extract one **cohesive domain** into its own
      module (the `shop.js` / `vault.js` pattern) — never a layer-based split.
- [ ] **Trigger 2 (Tablet / Mobile Frame Drops):** Profiling on Kepler's physical tablet reveals measurable UI jank (>16ms frame times) during task toggles or celebration particles.
- [ ] **Trigger 3 (Build Pipeline Adoption):** The project explicitly chooses to introduce a modern zero-config bundler (e.g., Vite) that provides automatic code-splitting, CSS bundling, and hashed asset management.
- [ ] **Trigger 4 (New Disjoint Domain):** A new major subsystem is introduced that has zero coupling to the main grid (e.g., a "Card Trading Hall" or "Battle Mini-Game"). *Action:* Implement it as a new isolated module (e.g., `arena.js`), continuing the proven pattern of `shop.js` and `vault.js`.
- [ ] **Trigger 5 (Repeated Scope Collisions):** Developers or Jetski experience recurring circular dependency errors or variable collision bugs during routine feature additions.

---

## 5. Ongoing Best Practices for Pair-Programming

1. **Continue Domain-Driven Isolation:** When creating a major new standalone feature, place it in its own module (like `shop.js` or `vault.js`) rather than inflating `app.js`.
2. **Leave Stable Monoliths Alone:** Keep `app.js` and `style.css` unified until one of the trigger criteria above is met.
3. **Preserve E2E Test Rigor:** Always add regression coverage to `tests.js` for new user requests and ensure `node run_headless_tests.js` runs 100% green before session wrapup.
4. **Maintain Cache Invalidation Hygiene:** Always bump `service-worker.js` cache version and `index.html` asset query strings on every JS/CSS change.
5. **Record Measured Metrics, Never Copy Them Forward:** Checkpoints 55–57 each
   copy-pasted "~17s" for suite runtime while the real figure drifted to ~25 s. A
   metric nobody measures is not a safeguard. Wrap-up must paste the actual
   observed wall-clock.

---

## 6. Deferred Cleanup Options (None Currently Recommended)

Recorded so the options survive the session. **Nothing here is urgent** — no
trigger in §4 is currently met. This section answers "*if* we did something, what
would have the best ratio of readability gained to risk taken?"

### 6.1 Zero-Risk Harness Optimization

Independent of any refactor, the suite has ~8 s of easily recoverable runtime.
These touch **only test infrastructure** — no application behaviour, no cache
bump, no risk to the kids' tablets:

| Change | Est. saving | Risk |
| :--- | ---: | :--- |
| Drop `Network.enable` from `run_headless_tests.js` (the `Fetch` domain already handles sprite stubbing) | ~2.0 s | None — only removes logging |
| Make `assert()` log on failure only, with a single summary line on success | ~2–3 s | None — 2,226 fewer CDP round trips |
| Re-tune the remaining 100 ms sleeps toward `waitFor()` polling | ~2–3 s | Low — pattern already proven in Checkpoint 54 |

The suite is at ~25 s against a 60 s abort watchdog, so there is no operational
pressure to do any of this.

### 6.2 `app.js` composition (measured Sept 23, 2026)

4,488 lines across **76 top-level functions**, with **11 exported symbols** —
that export list is the module's public surface and the genuinely risky part of
any extraction. Functional clusters, brace-matched:

| Cluster | Lines | Fns | Verdict |
| :--- | ---: | ---: | :--- |
| `setupEventListeners` (single function) | **764** | 1 | ⚠️ **Split in place — see 6.3** |
| Grid / cell / column core | 679 | 9 | ✅ **Keep.** This is the heart of the app |
| Reward admin (drag, edit, list) | ~~314~~ **373** | ~~6~~ **5** | 🔶 Extraction candidate — boundary corrected in 6.4 |
| `initFirebaseUI` (single function) | 313 | 1 | 🔶 Extraction candidate |
| XP / level / celebration | 277 | 7 | ✅ Keep — tightly coupled to the grid |
| Profile management | 258 | 4 | 🔶 Weak candidate |
| Modal helpers | 185 | 6 | ✅ **Keep.** `showCustomConfirm` / `showCustomNotification` are ~~imported repo-wide~~ *injected* into `admin.js` via `appCallbacks` (corrected Sept 24) |

### 6.3 Highest-value cleanup: split `setupEventListeners` *in place*

**`setupEventListeners` (L2296) is 764 lines — 17% of `app.js` in one function.**
This is the single worst readability offender in the codebase, and fixing it is
**not a refactor in the sense this document has been arguing against.** It does
not move code between files, so it incurs none of the Pillar 2 hazards.

Verified properties that make it safe:

- **Zero references in `tests.js`** — the suite interacts with DOM elements and
  dispatched events, never with the registration function.
- **Not exported**; called exactly once from bootstrap
  ([`app.js:1022`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js#L1022)).
- Splitting it into per-domain binding helpers (`bindGridEvents()`,
  `bindAdminEvents()`, `bindShopEvents()`, …) in the **same file** changes no
  module boundary, adds no `ASSETS_TO_CACHE` entry, and creates no circular
  import risk.

> [!TIP]
> Do this opportunistically the next time you are already editing event wiring.
> It needs no dedicated session and no separate cache bump beyond the normal one.

### 6.4 Module extraction candidates, ranked

Only if Trigger 1c (context-window tax) actually fires. In priority order:

1. **Reward editor → `rewards_admin.js` (~373 lines).** Parent-facing, not
   kid-facing; the cleanest true domain seam left. *Boundary corrected Sept 24
   (Checkpoint 61):* `renderRewardDropdowns`, its helper `populateSelect`, and
   `addRewardToHistory` are **kid-facing** (main-screen reward dropdowns) and
   stay in `app.js`, so the old "it's exported" caveat disappears. The real
   cluster is `openEditRewardsModal`, `renderEditRewardsLists`,
   `renderRewardList`, `bindRewardDragEvents` **and `bindRewardsEditorEvents`**
   (previously omitted), in two places (L3049–3137, L4028–4314). Its five
   mutable `let`s (L359–363) are referenced nowhere else, so they move with it;
   `profilesList` / `activeProfileId` are passed as getters, and
   `saveProfileRewardsToCloudFn` stays in `app.js` behind a late-binding arrow so
   `setSaveProfileRewardsMock` survives. Full plan:
   [`prd_admin_panel_redesign.md` §7](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_admin_panel_redesign.md).
2. **`initFirebaseUI` → alongside `firebase.js` (~313 lines).** One self-contained
   function, not exported, called once at
   [`app.js:1020`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js#L1020).
   Natural home, low coupling.
3. **Profile management (~258 lines).** Weakest of the three — it touches
   `selectProfile`, which reaches into most of the app. Do this last or not at all.

Doing #1 and #2 would bring `app.js` to roughly **3,860 lines** while *following*
the proven `shop.js` / `vault.js` domain pattern rather than the rejected
layer-based split.

> [!WARNING]
> **Do not extract the grid/cell/column core or the modal helpers.** The grid
> cluster is the application's reason for existing and is densely interconnected
> with XP and rendering. `showCustomConfirm` / `showCustomNotification` are
> ~~imported across the repo~~ owned by `app.js` and *injected* into `admin.js`
> (corrected Sept 24). Relocating them gains nothing, and moving them to a module
> that other modules then import would create the very import coupling the
> injection pattern avoids.

### 6.5 The durable rule

`app.js` doubled (2,106 → 4,488) because **new features landed in it by default**,
not because any single decision was wrong. The high-leverage discipline is not
periodic cleanup — it is ensuring **new domains get new modules on arrival**.

The seeded **Admin Panel Redesign**
([`docs/prd_admin_panel_redesign.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_admin_panel_redesign.md))
is the next live test of this rule. It should ship as its own module — and is the
natural moment to take the reward-admin cluster (6.4 #1) with it.

---

## 7. Revision History

### September 24, 2026 (Checkpoint 61) — import-graph claim corrected

**Verdict unchanged.** Spec session for the Admin Panel Redesign re-checked the
extraction premises:

- **"Imported repo-wide" was wrong.** No module imports `app.js`. `admin.js` and
  `shop.js` receive app functions via callback injection. Pillar 2, §6.2 and the
  §6.4 warning are annotated in place.
- **§6.4 #1 cluster boundary was wrong.** Two of the six listed functions are
  kid-facing and one editor function was missing. Corrected to 5 functions /
  ~373 lines. Extraction is recommended as an optional, separate, pure-move commit
  inside the redesign's implementation phase — see the PRD §7.

### September 23, 2026 (Checkpoint 57) — metrics re-measured, Trigger 1 retired

**Verdict unchanged: do not refactor.** Pillars 2, 4 and 5 carry the decision.

Corrections made:

1. **Trigger 1 retired and replaced** (§4) with Triggers 1a/1b/1c. Test wall-clock
   was shown to be an invalid proxy — at most ~5% of runtime tracks application
   structure.
2. **Stale headline metric corrected** (§1): "77/77 in ~17 s" → "83 blocks in
   ~25 s". Checkpoints 55–57 had copy-pasted the old figure.
3. **Growth quantified** (§1): `app.js` 2,106 → 4,487 lines (+113%) since the July
   Phase 2 deferral. Previously untracked.
4. **Pillar 1 caveated** (§3): the AI-readability argument is partially falsified
   by `_agents/AGENTS.md`'s own "never read these files whole" rule.
5. **Pillar 3 rewritten** (§3): the unsupported inference "~17 s proves there are
   no bottlenecks" replaced with a measured phase attribution table.
6. **Pillar 4 line count refreshed** (§3): `tests.js` 6,330 → 7,601.
7. **Review cadence added** (§4): every 10th checkpoint, next at Checkpoint 60.
8. **§6 expanded** into deferred cleanup options: measured `app.js` cluster
   composition, the `setupEventListeners` in-place split, ranked module
   extraction candidates, and an explicit do-not-touch list.

#### Measurement methodology (reproducible)

Two read-only instrumented clones of `run_headless_tests.js` were used; neither
modified any repository file:

- **Phase timing** — timestamps `spawn` → CDP port bind → domains enabled →
  `Page.navigate` → `Page.loadEventFired` → pass sentinel (debug port 9224).
- **CDP isolation** — identical but with `Network.enable` omitted, counting
  console lines and total CDP messages (debug port 9226).

Three runs: real harness ~25 s; instrumented clone 26.3 s (cold start 2.22 s,
suite body 23.0 s); no-Network clone 23.2 s (cold start 1.48 s, suite body
21.0 s).

Sleep budget derived by regex over `tests.js` (`sleep(<n>)` and
`sleep(<n>, true)` call sites, cross-referenced against the `scale = 0.1` factor
at [`tests.js:23-27`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js#L23-L27)).
Growth series derived via `git show <rev>:app.js | wc -l`.

Function sizes in §6 were obtained by **brace matching** from each declaration,
not by measuring distance to the next declaration. The naive approach
overstated several functions materially (`bindRewardDragEvents` 247 → **133**;
`withParentApproval` 173 → **11**) because it counts intervening top-level code.
Cluster totals are sums of brace-matched extents over name-pattern groups, each
function counted once.

### September 12, 2026 (Checkpoint 50) — original assessment

Initial "DO NOT REFACTOR" verdict, July Phase 2 retrospective, five-pillar
evaluation, and the original five-trigger rubric.

