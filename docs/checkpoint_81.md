# CHECKPOINT 81

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for the application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **PRDs for Lyra (5yo)** (`6bad081`): Two PRDs, each run through the 5-stage review panel: [`prd_unicorn_princess_theme.md`](prd_unicorn_princess_theme.md) (reserves **TC127**) and [`prd_simplified_chart_style.md`](prd_simplified_chart_style.md) (updates TC89C, adds **TC128**). Owner wants **two independent per-child settings**, `theme` and `chartStyle`.
- [x] **Simplified "Today Focus" Chart Style ("Big Buttons")** (`ea25bc8`): per-child `state.chartStyle` (`'standard' | 'big-buttons'`), set from the Admin › ✅ Activities `🧸 Chart Style` card. The subtext was renamed to "Today focused" at owner request (`ddfb89d`).
- [x] **Floating Stadium Pills layout** (`743d147`): owner picked Option 5 from the UX design studio. Per-task weekly counters (`4 of 5 days` / goal dots) were removed so little kids focus on today. The `0 of 4 done` pill next to the day title was also removed (`36f3973`).
- [x] **Vault / Guide in Big Buttons** (`b71993c`, `c975cee`):
  - The Vault is a tile at the end of the star ribbon (Option B).
  - Owner rejected the 💰 icon, then the amber standard-style look, and picked **"Nebula Sparkle" (Master-Ball purple)**. Requirements: **no hard dark bottom edge or outline**, no star count.
  - The Guide button is removed. Each card's hover `title` shows that activity's Task Guide `instructions` instead (`9431080`).
- [x] **UX review #2, all 5 changes** (`a3ed529`):
  - Jumbo **catch Pokéball** following the Rule 14 matrix. Bonus is a dashed ✨ ring that becomes a Great Ball with `+XP`; rest shows 💤; off-plan shows a muted dash.
  - Warm `#fef3c7` Done tile replaces the green/white one.
  - Subtitles hidden; 62px emoji with a type-colour ring.
  - Darker day labels (`#475569`).
  - Catch wobble with a `playSound('catch')` wobble-wobble-click.
- [x] **Partner sprite in banner removed** (`29c1d47`): redundant with the trainer card. Its hop and "Yay!" bubble went with it.
- [x] **Catch star** (`b64ff95`, `c5efdb6`): there is no persistent star sticker on caught cards. Each catch fires a **star shower** from the ball 0.9s after the tap, using the same `CelebrationEngine.triggerDailyCelebration` canvas burst the grid uses on day-complete.
- [x] **Past-week day highlight** (decision only): in past weeks the previewed day (default: first day) keeps the yellow fill. Owner declined a Poké Blue outline alternative; don't re-propose it.
- [ ] **Unicorn & Princess Sparkle Theme**: PRD written, not built. TC127 is reserved.
- [ ] **Prod acceptance (carried): Kepler's Thursday star**: Admin › Settings › `✏️ Fix Oct 11 - 17` → tick Thu Math → Star Vault streak Wed 10/14 → Fri 10/16.

### Known Follow-ups / Nice-to-haves

- [ ] **Owner VQA of Big Buttons on the real tablet**: the checklist lives in session scratch (`~/.gemini/jetski/brain/f05c83c6-d9f7-4f31-9401-99005d0fc562/vqa_plan_big_buttons.md`). Focus on §5 (catch wobble, sound, star shower) and the real-finger test.
- [ ] **Phone (≤ 390px) ribbon is tight**: day pills get narrow next to the 56px Vault tile. Accepted, because the app is optimized for tablet/desktop (owner).
- [ ] **Reduced motion**: Big Buttons swaps the wobble for a pop, but the canvas star shower (like the grid's day-complete burst) does not check `prefers-reduced-motion`.
- [ ] **§7 Phase 3: remove `adminPassword` from per-child state (V20)**: earliest 2026-10-26; re-verify the doc field in the Firebase console first. TC116 is reserved.
- [ ] Carried: Mega slot "?" edge (`awardCurrentWeeklyBadge` doesn't push an already-collected badge); claimed-rewards history shows stored values instead of labels; T1–T6 test data expired (regenerate with `make_test_family.py <Sunday>`); real-Firebase sign-out check; kid-side inline styles (Rule 8); `viewport-fit=cover`; test-harness sleep savings.

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Production Branch**: `main`
*   **Target Audience**: Kepler (7yo) & Lyra (5yo)
*   **Current Version**: Service Worker cache **`poke-chart-cache-v247`**. Asset tags: `style.css?v=11.12`, `app.js?v=11.16` (+ all 14 importmap entries `?v=11.16`), `particles.js?v=10.4`.
*   **Admin Password**: family Parent PIN at `users/{uid}.adminPassword` (legacy fallback `"zxcv"`).
*   **Local Server URL**: `http://localhost:8000/`. Emulator login `crsjain+staging@gmail.com` / `food3333`.
*   **Git Policy**: Committed to `prototype/pokemon-badge-collection`, merged to `main`. No mid-session pushes. Stage explicit paths.
*   **Commit Identity**: local `crsjain <crsjain@gmail.com>`.
*   **Audio**: new `playSound('catch')` in `audio.js`: three soft square-wave ticks at 0 / 0.3 / 0.6s, then a D5→A5 click at 0.9s. It plays only for Big Buttons catches; the grid keeps `'check'`.
*   **Test Suite**: **114 blocks, 113 unique numbers** (`dupes:12`; gaps 40, 43, 44; max **128**; TC116 and TC127 reserved; next free **129**). `node run_headless_tests.js` ~37–40 s. Under cloudtop load the 60 s watchdog occasionally trips mid-suite with no failed assert; rerun and `git checkout -- screenshot_timeout.png`.

---

## 3. Active V19 State Schema

Unchanged from [Checkpoint 64 §3](checkpoint_64.md) except for one per-child field:

```javascript
chartStyle: 'standard', // 'standard' | 'big-buttons' (docs/prd_simplified_chart_style.md)
```

**No schema version bump or migration.** `chartStyle` is in the default template and in `WIPE_PRESERVED_KEYS`, and `runStateDiagnostics` normalizes missing or invalid values to `'standard'`.

---

## 4. Work Accomplished

### Big Buttons view (`#simplified-today-view`)
* **`index.html`**:
  - The banner holds only `#simplified-day-title`.
  - `.simplified-week-row` wraps the `role="tablist"` `#simplified-day-strip` plus the Vault tile `#open-vault-simplified-btn.simplified-vault-tile`, which contains an inline SVG sparkle.
  - The `🧸 Chart Style` admin card is live, with the "Today focused" subtext.
* **`app.js`**:
  - `renderSimplifiedView()` renders the 7-day ribbon from `getWeekColumnStates`, plus one stadium card per active task.
  - Each card has an emoji with `data-ring`, the name, a Task Guide `instructions` hover `title`, and a `label.pokeball-checkbox.simplified-jumbo-checkbox` holding `input` + `span.pokeball.simplified-catch-ball` (`.just-caught` on a fresh catch) + `.simplified-action-pill.sr-only`.
  - The checkbox handler plays `'catch'` and schedules the star shower 900ms later (skipped if unticked meanwhile).
  - The Guide chip listener is removed.
* **`style.css`**:
  - Stadium cards, 62px emoji rings (Electric / Water / Grass / Fire / Psychic / Flying), warm Done tile.
  - 64px catch ball (58px at ≤ 520px) reusing the grid's Rule 14 selectors, with transparent overrides for the grid's bonus/rest cell backgrounds.
  - `sv-catch-wobble` / `sv-catch-pop`, with a reduced-motion fallback.
  - Nebula Sparkle Vault: `--vault-*` vars, soft shadows only.
  - Day-label contrast.
  - Old action-pill, partner and star-sticker rules removed.
* **`audio.js`**: added the `'catch'` sound.
* **`docs/prd_simplified_chart_style.md`**: kept current with every owner decision above.

### Tests
* **`tests.js` TC128** (Big Buttons) now asserts:
  - Vault: placed in `.simplified-week-row` outside the tablist; no count; SVG icon with no emoji; borderless with no `0px 4px 0px` edge.
  - Header: no Guide button or header chips; no partner sprite.
  - Cards: catch ball present, with sr-only action text; concept subtitle hidden; hover = Task Guide instructions; emoji ring present.
  - Catching: the caught ball's top is red `#ff3c3c`; the Done tile is `#fef3c7`; `.just-caught` is applied on a fresh catch; there is no persistent star after the 500ms window (`sleep(520, true)`, because headless `sleep` is scaled ×0.1); the star shower fires from the ball, checked via a `CelebrationEngine` spy.

---

## 5. Files and Code

### Created Files
* [`docs/prd_unicorn_princess_theme.md`](prd_unicorn_princess_theme.md): Unicorn & Princess theme PRD (not yet built).
* [`docs/prd_simplified_chart_style.md`](prd_simplified_chart_style.md): Big Buttons PRD.
* [`docs/checkpoint_81.md`](checkpoint_81.md): this checkpoint.

### Edited Files
* [`index.html`](../index.html): Big Buttons markup, Vault tile SVG, Chart Style card copy, `?v=11.16` / `style.css?v=11.12`.
* [`app.js`](../app.js): `renderSimplifiedView`, catch sound + star shower, Guide chip removal.
* [`style.css`](../style.css): all `.simplified-*` styling described above.
* [`audio.js`](../audio.js): `'catch'` sound.
* [`state.js`](../state.js): `chartStyle` default, preserved key, diagnostics.
* [`admin.js`](../admin.js): Chart Style card wiring.
* [`service-worker.js`](../service-worker.js): `poke-chart-cache-v247`.
* [`tests.js`](../tests.js): TC89C update, TC128.
* [`README.md`](../README.md): Chart Style bullet (no longer "Coming Soon").

---

## 6. Validation Instructions

1. **Cache**: hard-refresh and confirm `poke-chart-cache-v247`.
2. **Switch Lyra to Big Buttons**: Admin › ✅ Activities › 🧸 Chart Style › Big Buttons ("Today focused").
3. **Header & ribbon**: the title has no counter and no Pokémon icon. The purple Nebula Sparkle Vault sits at the end of the star ribbon, with no dark edge, and opens the Star Vault.
4. **Cards**: big ringed emoji and no subtitle. Hovering shows the Task Guide text.
5. **Catch**: tap a card. The ball wobbles 3× with ticks and a click, then a star shower bursts and the card turns cream with a red/yellow ball. Untick to revert.
6. **States**: bonus shows a ✨ ring and becomes a Great Ball with `+XP`; rest shows 💤 and is inert; off-plan shows a dash.
7. **Parent modes**: Exception Mode and Fix last week show the full grid and return to Big Buttons on exit.
8. **Kepler (Standard)**: the grid is unchanged and still plays the short check sound.
9. **Automated Suite**: run `node run_headless_tests.js`; verify 100% pass (114 blocks).
