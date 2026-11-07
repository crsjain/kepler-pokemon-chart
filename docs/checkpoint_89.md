# CHECKPOINT 89

This document contains a complete, chronological record of user requests, system
configurations, version progress, and active schema definitions for the
application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **Zygarde evolves every 5 levels** (owner, 2026-11-06): "evolving every 5 levels instead of 10 typical of legendary pokemon b/c there are so many levels". Owner dropped Zygarde Cell and chose the levels: **Zygarde Core (Lv 1) → 10% Forme (5) → 50% Forme (10) → 100% Forme (15) → Mega Zygarde (20)**. "100% Forme" kept at the owner's wording (official name: Complete Forme). Commit `2182d87`.
  - PokeAPI has no Zygarde Core, so it uses the app-only id `90718` and a local image, `images/zygarde-core.png` (official art, from serebii.net; the owner's Bulbagarden link returns 403 to scripts).
- [x] **"Zygarde Core should show up in the pokemon store instead of Zygarde b/c the lowest level pokemon is the one that can be purchased."** The Shop now names a family by its first stage (`getShopName`), with the first stage's art. Commit `acbd3d0`.
- [x] **Megas and forms for Shop Pokémon** (owner asked for a survey, then "implement all your recommendations", 2026-11-07). Level rule, stated by the owner: **normal and rare Pokémon evolve every 5 levels, legendaries every 10, legendaries with a series of forms (Zygarde, Necrozma) every 5.** 35 families changed. See §4 and `prd_legendary_evolutions.md` §3.2. Commit `2bd8fee`.
  - Double-checked first: none of the recommended forms existed (Charizard ended at Charizard).
- [x] **Heracross, Mawile and Absol Mega Evolve at Lv 5** (was Lv 10), to match the rule. Commit `880abb4`.
- [x] **Add Moltres** ("there's Galarian Moltres but not the normal Moltres"), then **Articuno and Zapdos** ("yes"). Legendary, 15 stars, Gen 1 badge pool. Commits `4532d2c`, `ef9a0bd`.

### Known Follow-ups / Nice-to-haves

- [ ] **Existing high-level partners pick up new forms lazily.** A partner already at or above a new Mega level gets the Mega at its next level-up (diagnostics don't re-stage linear lines). Lines that now end in a choice (Charizard, Raichu, Garchomp, Lucario, Absol, Lycanroc and Toxtricity below their level, Deoxys, Ogerpon) open the choice dialog on the next render. This most likely affects Kepler's and Lyra's starter Raichus if Lv 15+. Intentional; revisit only if the owner wants an immediate re-stage.
- [ ] **Ultra Necrozma is shared by both Necrozma branches**, so a partner dropping from Ultra (Lv 9) always goes back to Dusk Mane (the first option), even if it came from Dawn Wings. A `branchId` field would fix it but needs a persisted field. Not worth it yet.
- [ ] **Ralts skips Kirlia** (Ralts → Gardevoir/Gallade at Lv 5). Adding Kirlia would push the choice to Lv 10 and re-stage owned Gardevoirs. Not requested.
- [ ] **Feature review panel was not run** on the Megas/forms change: the owner asked to implement it directly.
- [ ] Carried from CP88:
  - A past unwon week that met its goal only through a ticked rest day now reads not complete.
  - `tools/css_rig/capture.js` probably needs the same Chrome flags as `run_headless_tests.js`.
- [ ] Carried from CP87:
  - `activeDay` is shared across tablets.
  - Admin › Start a new week still opens the plain Reset confirm.
  - The "THIS WEEK'S BADGE" legacy fallback.
  - The Change Week Start Day consolidation edge.
  - Deferred style.css cleanup items.
  - Phone Big Buttons Vault is 50.5px.
  - `#vault-debug-panel` styling.
  - Goal column tight at ~1024px.
  - Unicorn Phase 1 gaps / Phase 2 companions.
  - Star shower ignores reduced motion.
  - §7 Phase 3 (V20, **TC116** reserved).
  - Kid-side inline styles.
  - `viewport-fit=cover`.

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Production Branch**: `main`
*   **Target Audience**: Kepler (7yo), Lyra (5yo) & Alden (under 5)
*   **Current Version**: Service Worker cache **`poke-chart-cache-v289`**. Asset tags: `style.css?v=11.41` (unchanged), `app.js?v=11.47` + all 14 importmap entries `?v=11.47`, `particles.js?v=10.8`. App label still `v1.8.0 (v58)`.
*   **Admin Password**: family Parent PIN at `users/{uid}.adminPassword` (legacy fallback `"zxcv"`). Never commit backup codes.
*   **Local Server URL**: `http://localhost:8000/` (or `http://crsjain.c.googlers.com:8000/`).
*   **Git Policy**: Committed to `prototype/pokemon-badge-collection`, merged to `main`. No mid-session pushes. Stage explicit paths.
*   **Test Suite**: **125 blocks, 124 unique numbers** (`dupes:12`; gaps 40, 43, 44; max **138**; TC116 reserved; next free **139**). `node run_headless_tests.js` ~32–43 s.

---

## 3. Active V19 State Schema

Unchanged from [Checkpoint 88 §3](checkpoint_88.md). **No schema bump or migration.**

New `stageId` values are only new form ids (e.g. `'10034'` Mega Charizard X, `'90718'` Zygarde Core). Saved partners stay valid:
- Lycanroc `745` is now "Midday Lycanroc", a branch option.
- Toxtricity `849` is now "Amped Toxtricity".
- Mega Absol `10057` is a branch option.
- Ultra Necrozma `10157` is on both Necrozma paths.

TC138 (G) asserts that diagnostics leave all four alone.

---

## 4. Work Accomplished

### Evolution engine: forms that keep evolving after a choice
* **`pokemon_data.js`**:
  - An `options` entry may carry `next: [{ level, id, name }]`.
  - `getBranchPath(evo, stageId)` finds a stage on a chosen path.
  - `resolveStageId(familyId, level, stageId, minStageId)` is the single resolver. It keeps the branch choice and returns the pre-branch stage while a choice is pending.
* **`app.js`**:
  - `addXp` uses `resolveStageId` for every family.
  - `selectBranchEvolution` lands on the right later stage (a Lv 12 Ralts picking Gallade → Mega Gallade).
  - The choice dialog and its celebration name the current form ("Evolve Charizard!", not "Charmander").
  - Preload includes `next` stages.
* **`state.js`**:
  - `getStageInfo` follows `next` (helper text: "Next Evolution: Mega Gardevoir at LV 10").
  - Diagnostics accept stages on a chosen path and step a too-high stage back.
  - In branching families with linear stages, diagnostics leave pre-branch stages alone (as linear families always did) and apply the starter Pikachu `minStageId` floor. Both regressed when Charizard and Raichu gained options (TC63, TC95).

### Sprite helpers
* **`pokemon_data.js`**:
  - `getArtworkUrl(id)` / `getSpriteUrl(id)` with `LOCAL_ARTWORK` (Zygarde Core).
  - `getFirstStageId(familyId)`.
  - All 29 hand-built PokeAPI URLs in `app.js`, `badges.js` and `shop.js` now go through these helpers.
  - Small mini-HUD sprites fall back to artwork for `10301` (Mega Zygarde).
* **`shop.js`**:
  - Cards, confirm, unlock animation and adoption use the family's first stage (`getFirstStageId`, `getShopName`).
  - Adoption sets `stageId` to the first stage.

### Forms added (levels follow the owner's rule)
* Final form (Lv 10) → **Mega at Lv 15**: Venusaur, Blastoise, Alakazam, Gengar, Gyarados, Dragonite, Meganium, Feraligatr, Ampharos, Tyranitar, Sceptile, Blaziken, Swampert, Metagross, Emboar, Delphox, Greninja.
* **Lv 15 choices**: Charizard (Mega X / Y), Raichu incl. starter Pikachu (Mega X / Y), Garchomp (Mega / Mega Z).
* Final form (Lv 5) → **Mega at Lv 10**: Clefable, Steelix, Houndoom. **Lucario**: Lv 10 choice of Mega / Mega Z.
* **Lv 5 single-stage Megas**: Heracross, Mawile, Absol (Mega / Mega Z choice).
* Chosen at Lv 5 → **Mega at Lv 10**: Gardevoir, Gallade, Scizor, Slowbro.
* **Lv 5 choices**: Lycanroc (Midday / Midnight / Dusk), Toxtricity (Amped / Low Key).
* **Legendaries**:
  - Mega Zeraora at Lv 10.
  - Deoxys: Lv 10 choice of Forme.
  - Ogerpon: Lv 10 choice of Mask.
  - Necrozma: Lv 5 choice of Dusk Mane / Dawn Wings → Ultra Necrozma at Lv 10 (unchanged level).
* **Zygarde**: Core → 10% → 50% → 100% Forme → Mega, every 5 levels.
* All new form ids are in `POKEMON_MAP`, `POKEMON_TYPES` and `EVOLVED_POKEMON_IDS` (not sold separately). Every one has PokeAPI official artwork and a small sprite.
* Skipped on purpose: regional variants, Gigantamax, in-battle form switches.

### Shop additions
* **Articuno (#144, Ice), Zapdos (#145, Electric), Moltres (#146, Fire)**: legendary (15 stars), in `TIER_1_IDS` (Gen 1 badge pool), no evolutions.

### Tests
* **TC137**: Zygarde chain and levels, Shop card "Zygarde Core" with local art, adoption as Core, evolve at Lv 5, Mega Zygarde fully evolved.
* **TC138**:
  - Every form is named, typed and not buyable, and levels follow the rule.
  - Live checks: Mega Venusaur; Charizard X/Y dialog (titled "Charizard"); Gardevoir → Mega Gardevoir and back; Lv 12 Ralts → Mega Gallade; Dawn Wings → Ultra; saved partners pass diagnostics; Mega Zeraora; Deoxys Formes.
* **TC67** (Mega Steelix stage), **TC80** (Mega Heracross at Lv 5), **TC77** (Articuno/Zapdos/Moltres cards).
* Testing gotcha: to level a partner, use `helpers.addXp(n)` + `helpers.renderState(false)`. Checkbox clicks depend on the mocked "today".

---

## 5. Files and Code

### Created Files
* [`images/zygarde-core.png`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/images/zygarde-core.png): Zygarde Core artwork (precached by the service worker).
* [`docs/checkpoint_89.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_89.md): this file.

### Edited Files
* [`pokemon_data.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/pokemon_data.js), [`state.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/state.js), [`app.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js), [`shop.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/shop.js), [`badges.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/badges.js), [`index.html`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html), [`service-worker.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js) (`v289`), [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js).
* [`README.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/README.md), [`docs/prd_legendary_evolutions.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_legendary_evolutions.md) (§3.1 Zygarde, §3.2 Megas/forms), [`docs/test_plan_pokemon_shop_evolutions.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/test_plan_pokemon_shop_evolutions.md).

---

## 6. Validation Instructions

1. **Shop**: open the Partner Shop.
   - Zygarde's card reads "Zygarde Core" with the green Core art.
   - Articuno, Zapdos and Moltres are listed at 15 stars.
2. **Evolutions** (Admin › Data › Advanced › Debug Sidebar to jump levels):
   - A Venusaur reaching Lv 15 becomes Mega Venusaur.
   - A Lv 15 Charizard opens "Evolve Charizard!" with Mega Charizard X / Y.
   - A Gardevoir reaching Lv 10 becomes Mega Gardevoir.
   - A Heracross reaching Lv 5 becomes Mega Heracross.
3. **Starter Raichu**: on the kids' tablets, a Lv 15+ Raichu should offer Mega Raichu X / Y.
4. If stale: Admin › Data › Reload latest version (`v289`).
5. **Automated Suite**: run `node run_headless_tests.js`; verify 100% pass.
