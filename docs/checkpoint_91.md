# CHECKPOINT 91

This document contains a complete, chronological record of user requests, system
configurations, version progress, and active schema definitions for the
application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **Shop button pops once instead of pulsing forever** (CP90 follow-up, done in an earlier session on 2026-11-08). `.pixel-btn.ready-to-unlock` now plays `shop-ready-pop` once (0.9 s, `backwards` fill, off under `prefers-reduced-motion`). Commit `d9ed02b`, TC139 asserts a single iteration.
- [x] **PRD for the Activities icon picker** (`docs/prd_activity_icon_picker.md`, commit `d618851`, reserves **TC140**). Status: *Draft for owner review*. Not implemented.
- [x] **"The pokemon ball centers are showing above the frozen left column in mobile"** (owner, 2026-11-08, phone screenshot). Pokéball centre buttons (`.pokeball::after`, z-index 10) and `+XP` badges painted over the sticky TRAINING TASK column (z-index 2), because the day cells did not form their own stacking context. Fix: `isolation: isolate` on `th.day-header`, `td.checkbox-cell`, `td.day-total-cell` in the `@media (max-width: 767px)` block of the `grid` section. Commit `4f2a408`, TC74 asserts it.
- [x] **"When stars to spend is below 5, I want the treatment to match the 'Below 5 stays calm' UX"** (owner, 2026-11-08, mockup `star_vault_mockups.html` in conv `f7c3ee0b`). The card was already calm, but the shop button stayed yellow because the skin rule `body[data-theme] #vault-modal #vault-trade-open-btn` shadowed `.pixel-btn.locked-shop`. New skin rule `#vault-trade-open-btn.locked-shop`: `#e2e8f0` fill, `#334155` ink, `0 4px 0 #94a3b8` lip (hover `#cbd5e1`), both themes, still tappable. Commit `33b7e89`, TC139 asserts slate below 5 and not slate at 5+.
- [ ] **Owner review of the icon picker PRD**, then build it (TC140).
- [ ] **Owner check on a phone**: frozen column with no Pokéball centres on top; Vault at < 5 (grey button) and ≥ 5 (yellow, one pop) after reloading to `v295`.
- [ ] **Carried:** CP90 phone/tablet checks; owner VQA of the milestones switch and Alden rollout (CP88); CP87 Week over manual test; CP86 visual check; CP85 tablet check; CP84 VQA; Kepler's Thursday star acceptance.

### Known Follow-ups / Nice-to-haves

- [ ] **"Ready" logic uses only the cheapest price (5).** Nothing tells a child that 10 or 15 stars can buy a Rare or Legendary (Option C in the CP90 review). Not requested.
- [ ] **Feature review panel was not run** on the CP90/CP91 Vault changes; the owner asked to implement directly.
- [ ] Carried from CP89: existing high-level partners pick up new forms lazily; Ultra Necrozma shared by both branches; Ralts skips Kirlia; panel not run on Megas/forms.
- [ ] Carried from CP88: a past unwon week that met its goal only through a ticked rest day now reads not complete; `tools/css_rig/capture.js` probably needs the `run_headless_tests.js` Chrome flags.
- [ ] Carried from CP87: `activeDay` shared across tablets; Admin › Start a new week opens the plain Reset confirm; "THIS WEEK'S BADGE" legacy fallback; Change Week Start Day consolidation edge; deferred style.css cleanup items; phone Big Buttons Vault 50.5px; `#vault-debug-panel` styling; Goal column tight at ~1024px; Unicorn Phase 1 gaps / Phase 2 companions; star shower ignores reduced motion; §7 Phase 3 (V20, **TC116** reserved); kid-side inline styles; `viewport-fit=cover`.

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Production Branch**: `main`
*   **Target Audience**: Kepler (7yo), Lyra (5yo) & Alden (under 5)
*   **Current Version**: Service Worker cache **`poke-chart-cache-v295`**. Asset tags: `style.css?v=11.47`, `app.js?v=11.48` + all 14 importmap entries `?v=11.48` (unchanged; no JS changed this session), `particles.js?v=10.8`. App label still `v1.8.0 (v58)`.
*   **Admin Password**: family Parent PIN at `users/{uid}.adminPassword` (legacy fallback `"zxcv"`). Never commit backup codes.
*   **Local Server URL**: `http://localhost:8000/` (or `http://crsjain.c.googlers.com:8000/`).
*   **Git Policy**: Committed to `prototype/pokemon-badge-collection`, merged to `main`. No mid-session pushes. Stage explicit paths.
*   **Test Suite**: **126 blocks, 125 unique numbers** (`dupes:12`; gaps 40, 43, 44; max **139**; TC116 and **TC140** reserved; next free **141**). `node run_headless_tests.js` ~31–34 s.

---

## 3. Active V19 State Schema

Unchanged from [Checkpoint 88 §3](checkpoint_88.md). **No schema bump or migration.** All changes are CSS-only.

---

## 4. Work Accomplished

### Phones: day cells stay under the frozen task column
* **`style.css`** (`grid` section, `@media (max-width: 767px)`): `isolation: isolate` on `.weekly-grid th.day-header`, `td.checkbox-cell`, `td.day-total-cell`. Each cell's positioned children (Pokéball centre z-index 10, `+XP` badge z-index 10) now stack inside the cell, so the sticky column (z-index 2/3) slides over the whole cell. Verified with a real-app probe at 390×844 scrolled 160px: day-cell pixels hit by `elementFromPoint` over the frozen column went 20 → 0.

### Star Vault: calm shop button below 5
* **`style.css`** (`skin-modals` section): `body[data-theme] #vault-modal #vault-trade-open-btn.locked-shop` (+ `:hover`) matches the mockup's `.cta.calm`. `vault.js` already toggled `.locked-shop` / `.ready-to-unlock`; no JS change.
* Earlier in the day (`d9ed02b`): the ready button's infinite pulse became a single `shop-ready-pop`.

### Tests
* **TC74**: mobile media query must declare `isolation: isolate` on the day cells.
* **TC139**: below 5 the shop button has `.locked-shop`, is not disabled, and computes `rgb(226, 232, 240)`; at 5+ it does not; ready button plays one pop.

---

## 5. Files and Code

### Created Files
* [`docs/checkpoint_91.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_91.md): this file.
* [`docs/prd_activity_icon_picker.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_activity_icon_picker.md): icon picker PRD (draft, TC140).

### Edited Files
* [`style.css`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/style.css), [`index.html`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html) (`style.css?v=11.47`), [`service-worker.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js) (`v295`), [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js), [`README.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/README.md).

---

## 6. Validation Instructions

1. **Phone grid** (a phone, or a browser narrower than 768px, Standard chart style): scroll the week sideways. No yellow Pokéball centres or `+XP` pills should appear on top of the task names.
2. **Star Vault, fewer than 5 to spend**: slate card with "N more ⭐" and a **grey** "Go to Pokémon Shop!" button that still opens the shop. Check the Unicorn theme too.
3. **Star Vault, 5 or more**: pastel prism card and a yellow button that pops once, then sits still.
4. If stale: Admin › Data › Reload latest version (`v295`).
5. **Automated Suite**: run `node run_headless_tests.js`; verify 100% pass.
