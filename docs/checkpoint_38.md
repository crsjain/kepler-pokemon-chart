# CHECKPOINT 38

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for the application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **Retained Completed Task State on Exception Toggle**: When exceptions are set on completed tasks, the task state is retained without resetting the checkmark (done).
- [x] **Header Refactoring**: Centralize column state into `getColumnState()` and `getWeekColumnStates()` in `date_utils.js` (done).
- [x] **Onix Evolution into Steelix**: Onix (`95`) now evolves into Steelix (`208`) at Level 5 (and devolves back to Onix below Level 5). Onix displays the evolution sparkle `✨` in the Pokémon Shop, and Steelix is properly registered in `EVOLVED_POKEMON_IDS` (done).

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Target Audience**: Kepler & Lyra (gamified training chart)
*   **Current Version**: `v1.9.1` / Service Worker cache `poke-chart-cache-v101` / Asset tag `v=9.4`
*   **Local Server URL**: `http://localhost:8000/`
*   **Admin Password**: `zxcv` (Default fallback, configurable in Parent Admin Panel)
*   **Firebase Projects**: Prod (`pokemon-chart-3154f`), Staging (`kepler-pokemon-chart-staging`)
*   **Test Suite**: 67/67 tests passing (100% headless pass rate via `node run_headless_tests.js`)

---

## 3. Active V18 State Schema

```javascript
export let state = {
  version: 18,
  activePartnerInstanceId: '172',
  partnerFamily: '172', // Default Pichu Family
  weekStartDay: 0, // Default Sunday (0) to Saturday (6)
  idleTimeout: 10, // Default 10 minutes
  adminPassword: 'zxcv', // Configurable parent admin passcode
  timezoneOffset: 'default', // Configurable App Timezone ('default' or IANA string)
  weeklyRewardOptions: [...DEFAULT_WEEKLY_REWARDS],
  megaRewardOptions: [...DEFAULT_MEGA_REWARDS],
  excused: {}, // key format: "YYYY-MM-DD-task" -> boolean
  weeklyHistory: {}, // key format: "YYYY-MM-DD" -> { weekStartDay, reward, megaReward, weeklyClaimed, badgeId, xpEarned, megaWeeks }
  partnersData: {
    '172': { familyId: '172', level: 1, xp: 0, stageId: '172' },
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
  activeDay: new Date().getDay(),
  weekStartDate: 'YYYY-MM-DD',
  pendingWeekStartDate: null, // "YYYY-MM-DD" or null — set during Case A future mid-cycle shift
  starVault: {
    earnedDates: [],
    totalTraded: 0
  },
  collectedBadges: [],
  badgePool: [...],
  activeWeeklyBadgeId: 172
};
```

---

## 4. Work Accomplished

1. **Implemented Onix ➔ Steelix Evolution Line**:
   - Added `208: "Steelix"` to `POKEMON_MAP` in [`pokemon_data.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/pokemon_data.js).
   - Added `208` to `TIER_1_IDS` in [`pokemon_data.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/pokemon_data.js).
   - Defined `EVOLUTIONS['95']` with stage 1 (Level 1 Onix `95`) and stage 2 (Level 5 Steelix `208`).
   - Added `208` to `EVOLVED_POKEMON_IDS` set in [`pokemon_data.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/pokemon_data.js) so Steelix is recognized as an evolved stage and not listed as a base unevolved item in the shop.
   - Added `208: "Steel"` to `POKEMON_TYPES` in [`pokemon_data.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/pokemon_data.js).

2. **Shop Sparkle Integration**:
   - Confirmed that adding `EVOLUTIONS['95']` enables the sparkle indicator (`✨`, "Can evolve! ✨") on the Onix item card in the shop automatically via [`shop.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/shop.js).

3. **Automated Unit & E2E Regression Tests**:
   - Added **Test Case 67: Onix -> Steelix Evolution Line & Shop Sparkle** in [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js) asserting:
     - Static data integrity (`POKEMON_MAP`, `POKEMON_TYPES`, `EVOLUTIONS`, `EVOLVED_POKEMON_IDS`).
     - Shop card display with sparkle badge for Onix and exclusion of evolved form Steelix from direct purchasing.
     - Live partner progression (gaining XP to reach Level 5 evolves Onix to Steelix; dropping below Level 5 devolves back to Onix).
   - Ran `node run_headless_tests.js`: **67/67 tests passed (100%)**.

4. **Cache & Asset Invalidation**:
   - Bumped `service-worker.js` cache name to `poke-chart-cache-v101`.
   - Bumped `index.html` asset query strings to `?v=9.4`.

---

## 5. Files and Code

### Edited Files
*   [`pokemon_data.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/pokemon_data.js):
    - Added `208: "Steelix"` to `POKEMON_MAP`.
    - Added `208` to `TIER_1_IDS`.
    - Added `EVOLUTIONS['95']` stage progression (`95` @ Lv 1 ➔ `208` @ Lv 5).
    - Added `208` to `EVOLVED_POKEMON_IDS`.
    - Added `208: "Steel"` to `POKEMON_TYPES`.
*   [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js):
    - Imported `POKEMON_MAP, EVOLUTIONS, EVOLVED_POKEMON_IDS`.
    - Added Test Case 67 for Onix/Steelix evolution line & shop sparkle.
*   [`service-worker.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js):
    - Bumped cache to `poke-chart-cache-v101`.
*   [`index.html`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html):
    - Bumped asset query strings to `?v=9.4`.
*   [`docs/checkpoint_38.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_38.md):
    - Generated Checkpoint 38 documentation.
