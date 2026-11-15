# CHECKPOINT 92

This document contains a complete, chronological record of user requests, system
configurations, version progress, and active schema definitions for the
application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **Run the feature review panel on the CP90/CP91 Vault changes** (owner, 2026-11-14). Verdict *approved with mitigations*. Findings: the non-tappable Stars to Spend card had a "press me" candy lip and lift (UX Rule 12); the "N more ⭐" hint was 4.34:1 contrast (fails AA); the calm button's hover stuck on iPads; "Pokemon" missing its accent; the 5-star price lived in two places; the PRD still described a pulsing button; celebrating only at 5 stars nudged spending over saving; the prism card borrows the 🌈 Prism Star look.
- [x] **"Fix the changes and do the housekeeping"** (owner): ring instead of lip, `#475569` hint (~7:1), hover-only shade, accent fix, `COMMON_COST` / `RARE_COST` / `LEGENDARY_COST` exported from `pokemon_data.js`, PRD §3.3 updated, TC139 extended. Commit `c00324d`.
- [x] **Design call #2 (prism card vs. Prism Star)**: owner, "leave #2 as is".
- [x] **Design call #1: prototype options, then "Option 3"** (owner). Mockups (tier chips / savings track / next-goal line) in conv `dab41077`. Built the next-goal line: at 5+ the hint reads "N more ⭐ for Rare" (5–9), "N more ⭐ for Legendary" (10–14), "Legendary ready!" (15+); the shop button names the best tier ("Ready for a Normal / Rare Pokémon!", "Ready for any Pokémon, even a Legendary!") instead of "Ready to Unlock!". Commit `ece5776`.
- [x] **Ultra Necrozma shared by both branches**: owner, "leave as is, it's an edge case".
- [x] **Add Kirlia** (owner: "No one has a Gardevoir or Gallade, so it's okay to add Kirlia for everyone"). Ralts → Kirlia (Lv 5) → Gardevoir / Gallade choice (Lv 10) → Megas (Lv 15). Commit `6db5a59`.
- [x] **"The scroll bar on the right hand side goes beyond the top and bottom edge of the modal"** (owner, Android tablet screenshot of the partner picker). Commit `aac9a9c`.
- [x] **Fix the TC85 flake and add one shared spacing setting for the scrolling kid modals** (owner, after asking why the scrollbar fix took long). Commit `73c1e8b`.
- [ ] **Owner check on the tablet after reloading to `v300`**: partner picker scrollbar stays inside the rounded corners; Vault at < 5, 5–9, 10–14 and 15+ stars; a Ralts reaching Lv 5 becomes Kirlia.
- [ ] **Carried:** owner review of the icon picker PRD (`docs/prd_activity_icon_picker.md`, TC140 reserved), CP91 phone checks, CP90 phone/tablet checks, CP88 milestones/Alden VQA, CP87 Week over manual test, CP86 visual check, CP85 tablet check, CP84 VQA, Kepler's Thursday star acceptance.

### Known Follow-ups / Nice-to-haves

- [ ] **Ultra Necrozma shared by both branches** (owner: leave as is). A Dawn Wings partner dropping from Lv 10 to 9 resolves to Dusk Mane (`getBranchPath` takes the first match). A fix needs a persisted `branchId` (V20).
- [ ] **Scrollbar fix not verified on a real device by the agent**: no Android emulator on the cloudtop; desktop Chrome and the css rig only.
- [ ] **Lyra can't read the next-goal line**; she still relies on the calm → prism switch. The savings-track mockup (Option 2) is the pre-reader alternative if it ever matters.
- [ ] **Other kid shells with inner scrolling lists** (Badges, Guide, Level-up) were not touched; they don't scroll the rounded shell itself.
- [ ] Carried from CP89: existing high-level partners pick up new forms lazily; panel not run on Megas/forms.
- [ ] Carried from CP88: a past unwon week that met its goal only through a ticked rest day now reads not complete; `tools/css_rig/capture.js` works as-is for `--only=modal` runs (~90 s).
- [ ] Carried from CP87: `activeDay` shared across tablets; Admin › Start a new week opens the plain Reset confirm; "THIS WEEK'S BADGE" legacy fallback; Change Week Start Day consolidation edge; deferred style.css cleanup items; phone Big Buttons Vault 50.5px; `#vault-debug-panel` styling; Goal column tight at ~1024px; Unicorn Phase 1 gaps / Phase 2 companions; star shower ignores reduced motion; §7 Phase 3 (V20, **TC116** reserved); kid-side inline styles; `viewport-fit=cover`.

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Production Branch**: `main`
*   **Target Audience**: Kepler (7yo), Lyra (5yo) & Alden (under 5)
*   **Current Version**: Service Worker cache **`poke-chart-cache-v300`**. Asset tags: `style.css?v=11.51`, `app.js?v=11.51` + all 14 importmap entries `?v=11.51`, `particles.js?v=10.8`. App label still `v1.8.0 (v58)`.
*   **Admin Password**: family Parent PIN at `users/{uid}.adminPassword` (legacy fallback `"zxcv"`). Never commit backup codes.
*   **Local Server URL**: `http://localhost:8000/` (or `http://crsjain.c.googlers.com:8000/`).
*   **Git Policy**: Committed to `prototype/pokemon-badge-collection`, merged to `main`. No mid-session pushes. Stage explicit paths.
*   **Test Suite**: **127 blocks, 126 unique numbers** (`dupes:12`; gaps 40, 43, 44; max **141**; TC116 and TC140 reserved; next free **142**). `node run_headless_tests.js` ~30 s.

---

## 3. Active V19 State Schema

Unchanged from [Checkpoint 88 §3](checkpoint_88.md). **No schema bump or migration.** Kirlia is a data change in `EVOLUTIONS`; an unchosen Ralts saved as `280` at Lv 10+ is moved to Kirlia (`281`) by `runStateDiagnostics` on load.

---

## 4. Work Accomplished

### Star Vault: panel fixes (`c00324d`)
* **`style.css`** (`skin-modals`): `.can-afford` card uses `box-shadow: 0 0 0 2px #c4b5fd` (orchid `#d7a3ef` in Unicorn), no lift; `.stat-need` ink `#475569`; `.locked-shop:hover` inside `@media (hover: hover)`.
* **`pokemon_data.js`**: exports `COMMON_COST` 5, `RARE_COST` 10, `LEGENDARY_COST` 15; `getPokemonCost` uses them. **`vault.js`** imports `COMMON_COST`; "Pokémon" accent.

### Star Vault: next-goal line (`ece5776`)
* **`vault.js`**: `SHOP_TIERS` (Normal / Rare / Legendary, matching the Shop filter), exported `getSpendHint(stars)`, `getReadyCopy(stars)`. `#vault-stat-need` stays visible at 5+.
* **`style.css`**: `.can-afford .stat-need` uses `--sk-today-fg` (same ink as the number).

### Ralts → Kirlia (`6db5a59`)
* **`pokemon_data.js`**: `281: "Kirlia"` (Psychic, in `EVOLVED_POKEMON_IDS`, not sold); family `280` stages Ralts Lv 1 / Kirlia Lv 5; options Gardevoir / Gallade at Lv 10 with Megas at Lv 15.

### Kid modals: scrollbar inside the rounded corners (`aac9a9c`, `73c1e8b`)
* **Cause**: `border-radius` doesn't clip a scroller's own scrollbar, and phone/tablet overlay scrollbars ignore `::-webkit-scrollbar` styling.
* **`style.css`** (`skin-modals`, after the Kid Modal Shells rule): the scrolling shells (partner, Shop, Vault, showcase, kid notif) get a transparent top/bottom border of `--shell-scroll-inset` (12px) with `background-origin: border-box`. Each shell declares only its design padding (`--shell-pad-top` / `--shell-pad-bottom`, default 25px); padding = design − inset, bottom never below `--shell-lip-room` (4px). × pills use `calc(<design top> − inset)`.
* css rig (`--only=modal`): partner picker 0 px diff; others differ only by the shortened scrollbar; phone showcase +2px and phone Vault +1px (4px lip floor).
* **`_agents/rules/ux-guidelines.md`**: Rule 5 records the pattern.

### Tests
* **TC139**: ring/no-lift and hint ink in both themes, price-drift check, next-goal and button copy at 5, 9, 10, 12, 15, 40.
* **Shop test (~L3918)**: expects "Ready for a Normal Pokémon!" at 5 stars.
* **TC138**: Ralts → Kirlia at Lv 5 (no choice yet), choice at Lv 10, Mega Gardevoir at 15 and back at 14, diagnostics move an unchosen Lv 17 Ralts to Kirlia.
* **TC141 (new)**: scrolling shells have 12px transparent borders, border-box background, design − 12px padding, pills moved up; changing `--shell-scroll-inset` moves border, padding and pill together.
* **TC127**: "borderless" accepts the transparent border.
* **TC85**: finishes `.day-header`'s 0.2s background-color transition before reading the colour (flake fix).

---

## 5. Files and Code

### Created Files
* [`docs/checkpoint_92.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_92.md): this file.

### Edited Files
* [`vault.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/vault.js), [`pokemon_data.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/pokemon_data.js), [`style.css`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/style.css), [`index.html`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html), [`service-worker.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js) (`v300`), [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js).
* [`docs/prd_star_vault.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_star_vault.md) (§3.3, manual test), [`docs/prd_legendary_evolutions.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_legendary_evolutions.md) (Ralts row), [`_agents/rules/ux-guidelines.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/_agents/rules/ux-guidelines.md) (Rule 5), [`README.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/README.md).

---

## 6. Validation Instructions

1. **Partner picker on the tablet**: open Choose Your Partner and scroll. The scrollbar should stay inside the rounded top and bottom corners. Check the Shop and Star Vault too.
2. **Star Vault**: fewer than 5 to spend → slate card, "N more ⭐", grey button. 5–9 → prism card with a ring (no lip), "N more ⭐ for Rare", button "Ready for a Normal Pokémon!". 10–14 → "for Legendary" / "Ready for a Rare Pokémon!". 15+ → "Legendary ready!" / "Ready for any Pokémon, even a Legendary!".
3. **Ralts**: a Ralts reaching Lv 5 becomes Kirlia; at Lv 10 the Gardevoir / Gallade choice opens.
4. If stale: Admin › Data › Reload latest version (`v300`).
5. **Automated Suite**: run `node run_headless_tests.js`; verify 100% pass.
