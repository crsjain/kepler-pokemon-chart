# CHECKPOINT 93

This document contains a complete, chronological record of user requests, system
configurations, version progress, and active schema definitions for the
application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **Big Buttons day preview** (owner, 2026-11-15, after a five-expert review in conv `5059c04e`): look at any day of the week without the PIN; the PIN is needed only to edit a past day, and future days read "coming soon". Commit `1fbc865`.
- [x] **"The PIN should only unlock the day"**: in Big Buttons the PIN switches/unlocks the day, and a second tap catches the ball. Commit `cf841d5`.
- [x] **When the edit window ends, stay on the edited day** (locked preview, "This day is locked again.") instead of jumping to Today. Commit `2e597ca`.
- [x] **"The grey outline… is really subtle"**: UX options mockup (conv artifact `preview_day_marker_options`). Owner picked B (purple fill, `3ea1bba`), then after seeing it ("the X doesn't seem centered…", "should we use the exception styling?") chose **"Move to yellow"**: yellow follows the day the cards show and today's pill goes plain white while previewing. Commit `55cb05d`. UX Rule 13.5 / 13.6 amended.
- [x] **"Back to Today" button while viewing another day**. Commit `e4f07c3`; moved into the day title row so the dates row never grows (owner: "Does it make sense to shift the Back to Today button into the purple section…" → "Yes"). Commit `0848df3`.
- [x] **Exception Mode lands back on today**: leaving Exception Mode (Done ✅) in Big Buttons returns to today and clears the preview. Commit `bd17ca3`.
- [x] **"Exceptions mode shouldn't allow me to change the day selected nor show Back to today"**: day headers are inert in Exception Mode (both chart styles), and Back to Today is hidden. Commit `867ceb3`.
- [x] **"The back to today button styling doesn't match the rest of the app"**: the button now uses the week-nav pill skin (Fredoka, borderless stadium, candy lip), and ⚡ gets a dark outline so it shows on yellow. Commit `9d86056`.
- [x] **"The vertical alignment in these sections looks off"** (partner + badge cards). UX options A/B/C; owner picked **C**: the partner card hugs its content and the badge card takes the extra height (header at top, badge 60→88px, centred with its status); the XP row is grouped "XP … 85 / 100". Commit `5ba75da`. UX Rule 12.
- [x] **Princess background sparkles easter egg** (owner: "occasional animated sparkles… sparingly… in the pink background"). Owner decisions: **purely decorative for now**; frequency changed the same day from 45–90 s to **every 20–45 s**. Commits `0c5a4e6`, `cf975fb`.
- [ ] **Owner check on the tablet after reloading to `v313`**: day preview + yellow pill + Back to Today in both themes; Exception Mode headers inert; left cards with Milestones on/off; sparkles in the Unicorn theme.
- [ ] **Carried from CP92:** tablet check at `v300` (partner picker scrollbar, Vault tiers, Ralts → Kirlia), icon picker PRD review (`docs/prd_activity_icon_picker.md`, TC140 reserved), CP91 phone checks, CP90 phone/tablet checks, CP88 milestones/Alden VQA, CP87 Week over manual test, CP86 visual check, CP85 tablet check, CP84 VQA, Kepler's Thursday star acceptance.

### Known Follow-ups / Nice-to-haves

- [ ] **Standard grid deliberately unchanged** (owner was told): it still ticks right after the PIN, still returns to today when the edit window ends, and keeps the picked day after Exception Done. Only Big Buttons got the preview rules.
- [ ] **Mega Milestone card can also stretch** (Milestones on, chart taller than the left column). Option C only redistributes height inside the trainer card; the Mega card was not touched.
- [ ] **Sparkles: tap-to-burst** was offered and deferred by the owner ("purely decorative for now"). The idea: tapping a sparkle bursts into a tiny silent heart shower via `particles.js`.
- [ ] **Sparkles in the css rig**: the rig runs in `idle-mode` (`body.idle-mode * { animation: none }`), and sparkles are timer-driven, so full rig captures never show them. Verified with a patched scratch copy of `capture.js`.
- [ ] Carried from CP92: Ultra Necrozma shared by both branches (needs V20 `branchId`); scrollbar fix not verified on a real device; Lyra can't read the Vault next-goal line; other kid shells with inner scrolling lists untouched; CP89 lazy forms; CP88 rest-day goal edge; CP87 list (`activeDay` shared across tablets, Admin Start a new week confirm, legacy badge title fallback, week-start consolidation edge, style.css cleanup items, phone Vault 50.5px, `#vault-debug-panel`, Goal column at ~1024px, Unicorn Phase 2, star shower ignores reduced motion, §7 Phase 3 V20 / **TC116** reserved, kid-side inline styles, `viewport-fit=cover`).

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Production Branch**: `main`
*   **Target Audience**: Kepler (7yo), Lyra (5yo) & Alden (under 5)
*   **Current Version**: Service Worker cache **`poke-chart-cache-v313`**. Asset tags: `style.css?v=11.62`, `app.js?v=11.62` + all **15** importmap entries `?v=11.62` (new: `sparkles.js`), `particles.js?v=10.8`. App label still `v1.8.0 (v58)`.
*   **Admin Password**: family Parent PIN at `users/{uid}.adminPassword` (legacy fallback `"zxcv"`). Never commit backup codes.
*   **Local Server URL**: `http://localhost:8000/` (or `http://crsjain.c.googlers.com:8000/`).
*   **Git Policy**: Committed to `prototype/pokemon-badge-collection`, merged to `main`. No mid-session pushes. Stage explicit paths.
*   **Test Suite**: **130 blocks, 129 unique numbers** (`dupes:12`; gaps 40, 43, 44; max **144**; TC116 and TC140 reserved; next free **145**). `node run_headless_tests.js` ~35 s, 3812 asserts.

---

## 3. Active V19 State Schema

Unchanged from [Checkpoint 88 §3](checkpoint_88.md). **No schema bump or migration.** The Big Buttons preview (`bigButtonsPreviewCol`) is runtime-only and never persisted; sparkles keep no state.

---

## 4. Work Accomplished

### Big Buttons day preview (`1fbc865` … `867ceb3`)
* **`app.js`**: runtime `bigButtonsPreviewCol` with `setBigButtonsPreview` / `clearBigButtonsPreview` / `touchBigButtonsPreview`. Any day pill previews without the PIN. Past days show a padlock (`.preview-needs-pin`) and the PIN only unlocks the day (`if (fromSimplified) return;` in the `withParentApproval` callback). Future days read "coming soon". The preview auto-returns after 60 s idle (1.5 s in tests), on `visibilitychange`, and on profile/week change, Exception Mode, Fix last week or grace end. When the grace window ends the edited day stays on screen as a locked preview. `stopExceptionMode` returns Big Buttons to today. `handleDayColumnSelect` returns early in Exception Mode, and `startExceptionMode` calls `updateBackToTodayButton()`.
* **Back to Today**: `updateBackToTodayButton(colStates)` drives both `#back-to-today-btn` (under the dates, Standard grid) and the new `#simplified-back-to-today-btn` (right of the day title in Big Buttons; "⚡ Today" below 520px via `.btt-long` / `.btt-short`; negative block margins keep the 26px row). Both share `goBackToToday`, render `<span class="btt-bolt">⚡</span>`, and are hidden in Exception Mode and past weeks.
* **`style.css`**: yellow follows the previewed day (`--sk-now-bg` / `--sk-now-lip`), and today's pill goes plain white while previewing. `.layout-container.exception-mode .day-header { pointer-events: none; cursor: default }`. The banner button uses the week-nav pill skin, and `.back-to-today-pill .btt-bolt` gets a double dark drop-shadow.
* **Docs**: `prd_simplified_chart_style.md` §3.3–3.4; UX Rule 13.5 / 13.6.

### Left column alignment, option C (`5ba75da`)
* **`style.css`** (skin): in landscape, `.trainer-card { grid-template-rows: auto 1fr }`. `.weekly-badge-card` uses `justify-content: flex-start`, and its badge slot is `flex: 1 1 60px; max-height: 88px; aspect-ratio: 1; margin-top: auto` with status `margin-bottom: auto`. In the XP label, `#current-xp { margin-left: auto }` groups "85 / 100" on the right.
* Repro needs `body[data-milestones="hidden"]` at ≥1024px landscape. UX Rule 12 bullet "Stretched panels stay top-aligned".

### Princess background sparkles (`0c5a4e6`, `cf975fb`)
* **`sparkles.js`** (new module): `SPARKLE_MIN_MS` 20000 / `SPARKLE_MAX_MS` 45000. `canSparkle()` requires the Unicorn theme and no reduced motion, hidden tab, open `.modal`, Exception Mode / Fix last week, idle mode or boot skeleton. `pickSparkleSpot()` keeps a random point only if its centre and four probes 14px past the edge land on the sky (`html`, `body`, `.app-container`, `.layout-container`, `.game-header`). `spawnBackgroundSparkles()` adds 1–3 `.bg-sparkle`s (staggered 260 ms), which remove themselves on `animationend` with a timer fallback. `initBackgroundSparkles()` is called from both boot paths with a once-guard.
* **`style.css`** (`skin-unicorn-checkbox` section): `.bg-sparkle-layer` (fixed, `pointer-events: none`, `aria-hidden`), hidden for non-Unicorn themes and reduced motion. `.bg-sparkle` is an inline four-point white/gold SVG with a pink glow and the 1.6 s `bg-sparkle-twinkle` animation.
* **`service-worker.js`** / **`index.html`**: `sparkles.js` added to `ASSETS_TO_CACHE` and the importmap.
* **Docs**: `prd_unicorn_princess_theme.md` §11; `_agents/AGENTS.md` architecture diagram.

### Tests
* **TC142 (extended across the session)**: preview without the PIN, padlock rules, PIN unlocks without catching, locked preview after grace, yellow follows the preview in both themes, Back to Today placement/height/skin (border 0, radius 999px, Fredoka, `.btt-bolt` shadow), Exception Done lands on today.
* **TC17**: 17.1b rewritten so Exception Mode headers are inert, with no Back to Today.
* **TC143 (new)**: badge card header at the top, badge grows to an 88px circle and centres in a 420px card, never below 60px, XP grouped right.
* **TC144 (new)**: 20–45 s interval pinned; Pokémon theme / modal / Exception Mode / idle mode / boot block sparkles; spawned sparkles sit on the sky, are untappable and `aria-hidden`; switching to Pokémon hides any sparkle in flight; sparkles clean up (real-time `sleep(2800, true)`).

---

## 5. Files and Code

### Created Files
* [`sparkles.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/sparkles.js): princess background sparkle easter egg.
* [`docs/checkpoint_93.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_93.md): this file.

### Edited Files
* [`app.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js), [`style.css`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/style.css), [`index.html`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html), [`service-worker.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js) (`v313`), [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js).
* [`docs/prd_simplified_chart_style.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_simplified_chart_style.md) (§3.3–3.4), [`docs/prd_unicorn_princess_theme.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_unicorn_princess_theme.md) (§11), [`_agents/rules/ux-guidelines.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/_agents/rules/ux-guidelines.md) (Rules 12, 13.5, 13.6), [`_agents/AGENTS.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/_agents/AGENTS.md), [`README.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/README.md).

---

## 6. Validation Instructions

1. **Reload** to `v313` (Admin › Data › Reload latest version if stale).
2. **Big Buttons, current week**: tap another day's pill. Its pill turns yellow, today's goes white, and a yellow `⚡ Back to Today (Day)` pill sits at the right of the day title without making the row taller. A past day's ball shows a padlock: the PIN unlocks the day, and a second tap catches it. Future days say "coming soon". Tap Back to Today, or wait 60 s, to return.
3. **Exception Mode** (Big Buttons): day headers can't be tapped and there's no Back to Today. Done ✅ lands on today, so today's hearts can be ticked right away.
4. **Left cards** (landscape tablet, Milestones off): the partner card has no empty bottom, the badge card's header is at the top, and the badge is bigger and centred. XP reads "XP: … 0 / 100".
5. **Lyra (Unicorn theme)**: within about a minute, one to three sparkles twinkle in the pink background, never over a panel. None appear with a popup open, in Exception Mode, or on Kepler's Pokémon chart.
6. **Automated Suite**: run `node run_headless_tests.js`; verify 100% pass.
