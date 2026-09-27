# CHECKPOINT 64

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for the application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **Starter Pikachu on initial partner set & keep Pichu in Partner Shop**: *"When a child get their initial set of pokemon partners upon account creation, give them a Pikachu instead of a Pichu (even though you have to buy a Pichu in the pokemon shop and evovle it into a Pikachu). This is closer to the game lore, where Pikachu is one of the first pokemon you meet. Leave the Pichu in the pokemon shop so children have to evolve Pichu into Pikachu if they want additional ones."*
  - Added `createStarterPikachu()` and floor-aware `getStageIndexForLevel(evo, level, minStageId)` in `pokemon_data.js`. The starter partner (`partnersData['172']`) stays in the Pichu family (`'172'`) so it shares the family's Level 10 Raichu threshold, but starts at `stageId: '25'` with `minStageId: '25'` so it never devolves into Pichu when leveling up or down below Level 5.
  - Added **Schema V19 migration** in `migrations.js`: converts the bare-key starter (`partnersData['172']`) to a floored Pikachu (`stageId: '25', minStageId: '25'`) when `level < 5`, preserving level and XP. Because `getDefaultStateTemplate()` (V16) and `buildWipedChildState()` both flow through `runMigrations()`, new profiles, wiped profiles, and existing children whose starter Pichu is still below Level 5 all receive the starter Pikachu. Shop-purchased Pichus (`'172_<timestamp>'`) are untouched, and Pichu (`#172`) remains buyable in the Partner Shop while Pikachu (`#25`) stays in `EVOLVED_POKEMON_IDS`.
  - Fixed a latent bug in `runStateDiagnostics()` (`state.js`) that hardcoded `state.version !== 18` and silently downgraded V19 states back to 18; it now compares against `LATEST_SCHEMA_VERSION` exported from `migrations.js`.
  - Covered by **TC95** and updated **TC38** + diagnostics/version assertions.
- [ ] **Admin Redesign implementation** is still awaiting approval of `docs/prd_admin_panel_redesign.md` (unchanged from Checkpoint 61; its reserved test number remains **TC93**).

### Known Follow-ups / Nice-to-haves

- [ ] **Real-device verification of the SW fix & V19 starter migration**: open the deployed GitHub Pages app on the kids' tablet / phone and confirm `poke-chart-cache-v174` activates cleanly and any `< Lv 5` starter Pichu upgrades to Pikachu.
- [ ] **Optional `✨` "can evolve" affordance revisit**: in Pokémon canon `✨` means Shiny, and its `"Can evolve! ✨"` explanation lives only in a hover `title` attribute (invisible on touch tablets). Revisit only if the kids find it confusing.
- [ ] Carried: **Chart Style (under 5) feature itself** needs its own PRD and `feature-review-panel` run before building.
- [ ] Carried: **Wipe button label** ("Wipe All Progress (Reset)") and **Hold-to-unlock for Wipe** (Rule 6), from the Admin Redesign PRD.
- [ ] Carried: **Admin Redesign** PRD §8 phases, pending approval (reserved test number is **TC93**; next free test number is **TC96**).
- [ ] Carried: **Logged-in manual check** of per-child Wipe against real Firestore (Checkpoint 62 §6).
- [ ] Carried: ~8 s zero-risk harness savings (`docs/refactoring_assessment_2026_09_12.md` §6.1).

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Production Branch**: `main`
*   **Target Audience**: Kepler (7yo) & Lyra (5yo)
*   **Current Version**: `v1.10.25` / Service Worker cache **`poke-chart-cache-v174`** / Asset tags `style.css?v=10.64`, **`app.js?v=10.55`**, `particles.js?v=10.3`
*   **Admin Password**: `"zxcv"`
*   **Local Server URL**: `http://localhost:8000/` (or `http://crsjain.c.googlers.com:8000/`)
*   **Git Policy**: Committed to `prototype/pokemon-badge-collection`, merged to `main`. No mid-session pushes. Stage explicit paths, never `git add -A`.
*   **Commit Identity**: local `crsjain <crsjain@gmail.com>`.
*   **Audio/Volume Settings**: Unchanged.
*   **Test Suite**: **82 blocks, 81 unique numbers** (`dupes:12` expected; gaps `40, 43, 44` historical; `93` reserved by `docs/prd_admin_panel_redesign.md`; max **95**, next free **96**). Run via `node run_headless_tests.js` (**~24.8 s**).

---

## 3. Active V19 State Schema

```javascript
{
  version: 19,
  activePartnerInstanceId: '172',
  partnerFamily: '172', // Pichu family; the starter begins at the Pikachu stage (V19)
  weekStartDay: 0,
  idleTimeout: 10,
  adminPassword: 'zxcv',
  lockPastDays: false,        // Per-profile past-day editing passcode gate (default: false)
  parentGraceMinutes: 2,      // Per-profile parent edit grace window duration in minutes (1 | 2 | 5)
  timezoneOffset: 'default',
  weeklyRewardOptions: [...DEFAULT_WEEKLY_REWARDS],
  megaRewardOptions: [...DEFAULT_MEGA_REWARDS],
  excused: {}, // key format: "YYYY-MM-DD-task" -> 'bonus' | 'rest' | boolean (legacy true = 'rest')
  weeklyHistory: {}, // key format: "YYYY-MM-DD" -> { weekStartDay, reward, megaReward, weeklyClaimed, badgeId, xpEarned, megaWeeks }
  partnersData: {
    '172': { familyId: '172', level: 1, xp: 0, stageId: '25', minStageId: '25' },
    '4': { familyId: '4', level: 1, xp: 0, stageId: '4' },
    '1': { familyId: '1', level: 1, xp: 0, stageId: '1' },
    '7': { familyId: '7', level: 1, xp: 0, stageId: '7' },
    '133': { familyId: '133', level: 1, xp: 0, stageId: '133' }
  },
  reward: '',
  megaReward: '',
  megaWeeks: 0,
  weeklyClaimed: false,
  debugSidebarEnabled: false,
  grid: {}, // key format: "YYYY-MM-DD-task" -> boolean
  tasks: [
    { id: 'piano', name: 'Piano Practice', emoji: '🎹', concept: 'Level up!', instructions: 'Play all pieces 3x and work on hard parts.', active: true, createdAt: '2026-07-01', deletedAt: null },
    { id: 'math', name: 'Math Practice', emoji: '🧮', concept: 'Intellect +1', instructions: "Complete today's worksheet or 15 mins on math app.", active: true, createdAt: '2026-07-01', deletedAt: null },
    { id: 'reading', name: 'Reading Time', emoji: '📚', concept: 'Explore new zones!', instructions: '15min reading out loud w/30s summary.', active: true, createdAt: '2026-07-01', deletedAt: null },
    { id: 'writing', name: 'Writing', emoji: '✏️', concept: 'Skill mastery', instructions: 'Write at least 3 clean sentences w/punctuation.', active: true, createdAt: '2026-07-01', deletedAt: null },
    { id: 'chinese', name: 'Chinese', emoji: '💮', concept: 'Character master!', instructions: 'Practice reading current vocabulary card set 2x.', active: true, createdAt: '2026-07-01', deletedAt: null }
  ],
  rewardHistory: [],
  megaRewardHistory: [],
  volume: 50,
  claimedRewardsHistory: [],
  activeDay: 0,               // 0..6 (getLocalDate('default').getDay())
  weekStartDate: 'YYYY-MM-DD',
  starVault: {
    earnedDates: [],          // "YYYY-MM-DD" strings
    totalTraded: 0
  },
  collectedBadges: [],        // { id, name, dateEarned, megaWeeks }
  badgePool: [...TIER_1_IDS], // minus activeWeeklyBadgeId
  activeWeeklyBadgeId: 172
}
```

> [!NOTE]
> **Schema bumped V18 → V19** (`migrations.js`). Added optional per-partner `minStageId` floor on the starter (`partnersData['172']`). `LATEST_SCHEMA_VERSION` is now exported from `migrations.js` (derived from `MIGRATIONS[MIGRATIONS.length - 1].version`) and consumed by `runStateDiagnostics()`.

---

## 4. Work Accomplished

### Starter Pikachu with `minStageId` Floor & Schema V19 (`ebc25c9`)

* **`pokemon_data.js`**:
  - Added `STARTER_PIKACHU_INSTANCE_ID = '172'`, `STARTER_PIKACHU_STAGE_ID = '25'`, and `createStarterPikachu()` returning `{ familyId: '172', level: 1, xp: 0, stageId: '25', minStageId: '25' }`.
  - Added `getStageIndexForLevel(evo, level, minStageId)` to compute a partner's stage index while clamping to `minStageId` when present and valid in `evo.stages`.
* **`migrations.js`**:
  - Added V19 migration: upgrades `s.partnersData['172']` (when in family `'172'` and `level < 5`) to `stageId: '25'` and `minStageId: '25'`, preserving level and XP. Leaves shop-purchased Pichu instances (`'172_<timestamp>'`) and `level >= 5` starters untouched.
  - Exported `LATEST_SCHEMA_VERSION` derived from the last entry in `MIGRATIONS`.
* **`state.js`**:
  - Updated in-memory default `state` to `version: 19` and `'172': createStarterPikachu()`.
  - Updated `cleanupPhantomPartners()` and `runStateDiagnostics()` empty-partner fallbacks to use `createStarterPikachu()`.
  - Updated `runStateDiagnostics()` to validate `minStageId` against the partner's `EVOLUTIONS[fid].stages` (removing invalid cross-family floors), compute missing/mixed-family stages via `getStageIndexForLevel()`, and raise any `stageId` sitting below its `minStageId` floor.
  - Replaced the hardcoded `state.version !== 18` check in `runStateDiagnostics()` with `state.version !== LATEST_SCHEMA_VERSION`.
* **`app.js`**:
  - Updated `addXp()` to compute `stageIdx` via `getStageIndexForLevel(evo, stats.level, stats.minStageId)` so the starter Pikachu never devolves to Pichu on level-up or level-down below Level 5, and evolves into Raichu at Level 10.
  - Exposed `addXp` on `window.__test_helpers__`.
* **`tests.js`**:
  - Added **TC95** testing new-profile migration (`getDefaultStateTemplate()`), `buildWipedChildState()`, V18 → V19 conversion of `< Lv 5` starter Pichus vs. untouched shop-bought Pichus and `Lv 5+` starters, `addXp()` level-up/level-down across Lv 1–2 and Lv 9–10, `runStateDiagnostics()` floor healing/cleanup, and Partner Shop availability of Pichu (`#172`) vs. non-availability of Pikachu (`#25`).
  - Updated **TC38** and version assertions from `18` to `19`.
  - Stabilized **TC94** against the 300ms `modalPopIn` (`scale(0.85) → scale(1)`) CSS entry animation when `body.idle-mode` is not active (`sleep(100)` is scaled to `10ms` in headless mode, which otherwise sampled `54.4px = 64 * 0.85`) by calling `.getAnimations().forEach(a => a.finish())` on `#pokemon-shop-modal .modal-content` before measuring `getBoundingClientRect()`.
* **`_agents/AGENTS.md` & `README.md`**:
  - Updated schema version note to V19 (`LATEST_SCHEMA_VERSION`) in `_agents/AGENTS.md` and documented Starter Pikachu & Shop Pichu in `README.md`.

---

## 5. Files and Code

### Created Files
* [`docs/checkpoint_64.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_64.md): this checkpoint.

### Edited Files
* [`pokemon_data.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/pokemon_data.js): `STARTER_PIKACHU_INSTANCE_ID`, `STARTER_PIKACHU_STAGE_ID`, `createStarterPikachu()`, `getStageIndexForLevel()`.
* [`migrations.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/migrations.js): V19 starter Pikachu migration and `LATEST_SCHEMA_VERSION`.
* [`state.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/state.js): V19 default state, `createStarterPikachu()` fallbacks, `minStageId` diagnostics validation/healing, `LATEST_SCHEMA_VERSION` check.
* [`app.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js): floor-aware `addXp()` stage lookup and `window.__test_helpers__.addXp`.
* [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js): added TC95; updated TC38, diagnostics stage recovery, and schema version assertions to 19.
* [`service-worker.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js): bumped `CACHE_NAME` to `poke-chart-cache-v174`.
* [`index.html`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html): bumped `app.js?v=10.55`.
* [`_agents/AGENTS.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/_agents/AGENTS.md): updated current schema version note to V19.
* [`README.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/README.md): added Starter Pikachu & Shop Pichu bullet.

---

## 6. Validation Instructions

1. **Starter Pikachu on New / Wiped Profiles**: create a new child profile (or run `Admin 🔒 → Wipe All Progress` on a test profile). Verify the active starter is a Level 1 **Pikachu** (`#025`, next evolution **Raichu** at LV 10) and that leveling from Lv 1 → Lv 2 and unchecking tasks back to Lv 1 keeps it as Pikachu.
2. **Existing Profile Upgrade (V19)**: open an existing child profile whose starter Pichu (`'172'`) was below Level 5; verify it upgrades in place to Pikachu while keeping its current level and XP.
3. **Partner Shop Pichu**: open **Change Partner → Pokémon Partner Shop! 🏪**. Confirm **Pichu** (`#172`) is still listed in the shop and **Pikachu** (`#25`) is not directly buyable; adopting a new Pichu starts it as a Level 1 Pichu that evolves into Pikachu at Level 5.
4. **Automated Suite**: run `node run_headless_tests.js`; verify 100% pass across all 82 test blocks (including **TC95**).
