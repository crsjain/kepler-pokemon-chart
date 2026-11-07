# CHECKPOINT 90

This document contains a complete, chronological record of user requests, system
configurations, version progress, and active schema definitions for the
application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **Make Stars to Spend exciting once a Pokémon is affordable** (owner, 2026-11-07, with a Star Vault screenshot at 100 / 15 / 85). A Senior Staff UX review proposed: calm below 5, A Gold Ticket, B Pokéball tokens, C tier chips, D silhouette peek, E one-shot motion, plus F1/F2 rainbow number at the owner's request. Mockups are in conv `f7c3ee0b` (`star_vault_mockups.html`, `option_a_pastel_prism.html`).
  - **Owner decisions:** Option A on a **pastel prism** card instead of gold; **no "READY!" badge**, "going between the calm theme and prism background is good enough"; skip the feature panel.
  - Commit `36b2937`, TC139.
- [x] **Freeze the TRAINING TASK column on phones** in the Standard grid "so it's easy to see the task names as I scroll to days in the latter half of the week". Commit `201b47c`.
- [x] **Make that column narrower on phones**: "remove the descriptions 'Intellect +1' 'Skill mastery' and have the task names wrap". Commit `ac367bd`.
- [ ] **More activity icons → grid emoji picker, in its own session** (owner, 2026-11-07). The owner skipped the quick fix (a longer `<select>` with `<optgroup>`s). Plan: tapping the icon tile in Admin › Activities opens a popover grid grouped as School, Languages, Music & Art, Sports, Chores, Healthy habits, Kindness (~60 curated emoji, avoiding the newest Unicode ones that older iPads show as blank boxes), plus an "Any emoji…" field that accepts exactly one emoji (e.g. checked with `Intl.Segmenter`). Today's picker: `TASK_EMOJI_CHOICES` in `admin.js` (~L1505); an activity's off-list emoji is kept. No schema change needed.
- [ ] **Owner check on a phone**: the frozen column and wrapped names (§6), and the Stars to Spend card at < 5 and ≥ 5 on the kids' tablets after reloading to `v292`.
- [ ] **Carried:** owner VQA of the milestones switch and Alden rollout (CP88); CP87 Week over manual test; CP86 visual check; CP85 tablet check; CP84 VQA; Kepler's Thursday star acceptance.

### Known Follow-ups / Nice-to-haves

- [ ] **The Star Vault's yellow shop button still pulses forever** (`.pixel-btn.ready-to-unlock`, `animation: pulse 1.5s infinite`). The UX review suggested replacing it with a one-shot motion (Option E) so only one thing moves; not requested.
- [ ] **"Ready" logic uses only the cheapest price (5).** The card and button don't tell a child that 10 or 15 stars can buy a Rare or Legendary (Option C in the review). Not requested.
- [ ] **Feature review panel was not run** on either change; the owner asked to implement directly.
- [ ] Carried from CP89: existing high-level partners pick up new forms lazily; Ultra Necrozma shared by both branches; Ralts skips Kirlia; panel not run on Megas/forms.
- [ ] Carried from CP88: a past unwon week that met its goal only through a ticked rest day now reads not complete; `tools/css_rig/capture.js` probably needs the `run_headless_tests.js` Chrome flags.
- [ ] Carried from CP87: `activeDay` shared across tablets; Admin › Start a new week opens the plain Reset confirm; "THIS WEEK'S BADGE" legacy fallback; Change Week Start Day consolidation edge; deferred style.css cleanup items; phone Big Buttons Vault 50.5px; `#vault-debug-panel` styling; Goal column tight at ~1024px; Unicorn Phase 1 gaps / Phase 2 companions; star shower ignores reduced motion; §7 Phase 3 (V20, **TC116** reserved); kid-side inline styles; `viewport-fit=cover`.

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Production Branch**: `main`
*   **Target Audience**: Kepler (7yo), Lyra (5yo) & Alden (under 5)
*   **Current Version**: Service Worker cache **`poke-chart-cache-v292`**. Asset tags: `style.css?v=11.44`, `app.js?v=11.48` + all 14 importmap entries `?v=11.48`, `particles.js?v=10.8`. App label still `v1.8.0 (v58)`.
*   **Admin Password**: family Parent PIN at `users/{uid}.adminPassword` (legacy fallback `"zxcv"`). Never commit backup codes.
*   **Local Server URL**: `http://localhost:8000/` (or `http://crsjain.c.googlers.com:8000/`).
*   **Git Policy**: Committed to `prototype/pokemon-badge-collection`, merged to `main`. No mid-session pushes. Stage explicit paths.
*   **Test Suite**: **126 blocks, 125 unique numbers** (`dupes:12`; gaps 40, 43, 44; max **139**; TC116 reserved; next free **140**). `node run_headless_tests.js` ~32–34 s.

---

## 3. Active V19 State Schema

Unchanged from [Checkpoint 88 §3](checkpoint_88.md). **No schema bump or migration.** Both changes are display-only: the Stars to Spend card reads the existing `starVault.earnedDates` / `totalTraded`.

---

## 4. Work Accomplished

### Star Vault: Stars to Spend card (calm → pastel prism)
* **`vault.js`**: `renderVault()` toggles `.can-afford` on `.stat-spendable` when stars to spend ≥ `MIN_POKEMON_COST` (5, the Common price) and fills `#vault-stat-need` with "N more ⭐" below it. The shop button's existing threshold now uses the same constant instead of two hard-coded 5s.
* **`index.html`**: `#vault-stat-need` hint under the number; the label's ⭐ is wrapped in `.stat-star`.
* **`style.css`** (`skin-modals` section, both themes): calm card `#f1f5f9` / `#cbd5e1` with `--sk-text`; `.can-afford` = pastel prism gradient (`#fee2e2 → #fef3c7 → #dcfce7 → #dbeafe → #f3e8ff`), lavender lip `0 4px 0 #c4b5fd` (orchid `#d7a3ef` in Unicorn), `translateY(-2px)`, number 2.2rem (1.9rem ≤ 480px), ink `--sk-today-fg`. No animation.
  - Gotchas: the ⭐ emoji disappears on the pale yellow band, so `.stat-star` gets a thin dark drop-shadow outline. `.stat-label` is a flex row, which collapses the space after the wrapped ⭐, so `.stat-star` has `margin-right: 0.3em`.

### Phones: frozen, narrow TRAINING TASK column
* **`style.css`** (`grid` section, `@media (max-width: 767px)`):
  - `th.task-col-header` and `td:first-child` are `position: sticky; left: 0` (header z-index 3, cells 2) with an opaque background (white; `#f7fafc` for the Daily Total row and row hover). With `border-collapse` the right border doesn't travel with sticky cells, so it is drawn as `box-shadow: inset -2px 0 0 #e2e8f0` plus a soft edge shadow.
  - Table `min-width` 620 → **560px** with the column at **21%** (~128px, was ~177px), so day columns stay ~54px (≥ 50px invariant) and about four days show beside the frozen column on a 390px phone.
  - `.task-concept` descriptions hidden; task names 0.85rem and wrap; emoji 1.3rem / 26px; first-column insets 8px.
  - Tablets and desktop unchanged; Big Buttons unaffected.
* **Docs:** UX Rule 13C (`_agents/rules/ux-guidelines.md`) records the 560px minimum and the frozen column; `prd_rest_day_passes_and_bonus_tasks.md` and its test plan updated from 620px.

### Tests
* **TC139**: calm at 0 / 3 stars with "5 more ⭐" / "2 more ⭐"; prism (gradient computed) at exactly 5 after trading and at 15; spending back to 4 returns to calm with "1 more ⭐"; no READY badge.
* **TC74**: now asserts the mobile `.weekly-grid { min-width: 560px }`.

---

## 5. Files and Code

### Created Files
* [`docs/checkpoint_90.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_90.md): this file.

### Edited Files
* [`vault.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/vault.js), [`style.css`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/style.css), [`index.html`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html), [`service-worker.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js) (`v292`), [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js).
* [`README.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/README.md), [`_agents/rules/ux-guidelines.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/_agents/rules/ux-guidelines.md), [`docs/prd_rest_day_passes_and_bonus_tasks.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_rest_day_passes_and_bonus_tasks.md), [`docs/test_plan_rest_day_passes_and_bonus_tasks.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/test_plan_rest_day_passes_and_bonus_tasks.md).

---

## 6. Validation Instructions

1. **Stars to Spend**: open the Star Vault.
   - With fewer than 5 stars to spend: plain slate card with "N more ⭐".
   - With 5 or more: pastel prism card with a bigger number; no badge. Check the Unicorn theme too (plum number, orchid lip).
2. **Phone grid** (a phone, or a browser narrower than 768px, Standard chart style):
   - Scroll the week sideways: the TRAINING TASK header, task names and "Daily Total" stay put while the days slide under them.
   - No descriptions under task names; long names wrap to two lines; about four days visible.
   - A tablet still shows the full week with descriptions.
3. If stale: Admin › Data › Reload latest version (`v292`).
4. **Automated Suite**: run `node run_headless_tests.js`; verify 100% pass.
