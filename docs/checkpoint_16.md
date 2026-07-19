# Checkpoint 16: Codebase Refactoring & UI/UX Polish

This document contains a complete record of user requests, system configurations, version progress, and active schema definitions for Kepler's Pokémon Training Chart app. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

*   - [x] Option to allow starting a week on another day (Friday start).
*   - [x] Dynamic Start Day Warning (gentle shift confirmation for empty grid, detailed screenshot tip warning for active progress grid).
*   - [x] Standardize Modal CTAs (Cancel/Dismissive on Left, Confirm/Primary on Right).
*   - [x] Restructure Parent Admin Quick Actions (Group settings, Sync, Debug, and isolate Destructive Wipe button in a red Danger Zone).
*   - [x] Fix Admin Option Spacing (Even vertical card margins on desktop).
*   - [x] Implement Phase 1 Refactoring (Decouple migrations to `migrations.js`, date helpers to `date_utils.js`, constants to `pokemon_data.js`, and debounced cloud saves).
*   - [x] Create a Phase 2 Future Architecture Roadmap (`phase2_recommendations.md`).

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Target Audience**: Kepler (7 years old) and Lyra (5 years old)
*   **Current Version**: `v1.4.8 (v31)` / Service Worker cache `v31`
*   **Active Port**: `8085` (running Python web server)
*   **Firebase Emulator Project**: `demo-pokemon-chart` (Firestore UI on port `4000`, DB on `8080`)
*   **Parent Email**: `crsjain@gmail.com`
*   **Admin Password**: `zxcv`

---

## 3. Active V12 State Schema

```javascript
export function getDefaultStateTemplate() {
  return {
    version: 12,
    partnerFamily: '25', // Default Pikachu Family
    weekStartDay: 0, // Default Sunday (0) to Saturday (6)
    partnersData: {
      '25': { level: 1, xp: 0, stageId: '25' },
      '4': { level: 1, xp: 0, stageId: '4' },
      '1': { level: 1, xp: 0, stageId: '1' },
      '7': { level: 1, xp: 0, stageId: '7' },
      '133': { level: 1, xp: 0, stageId: '133' }
    },
    reward: '',
    megaReward: '',
    megaWeeks: 0,
    weeklyClaimed: false,
    debugSidebarEnabled: false,
    grid: {}, // key format: "dayIndex-taskId" -> boolean
    excused: {}, // key format: "dayIndex-taskId" -> boolean
    tasks: [
      { id: 'piano', name: 'Piano Practice', emoji: '🎹', concept: 'Level up!', instructions: 'Play all pieces 3x and work on hard parts.' },
      { id: 'math', name: 'Math Practice', emoji: '🧮', concept: 'Intellect +1', instructions: "Complete today's worksheet or 15 mins on math app." },
      { id: 'reading', name: 'Reading Time', emoji: '📚', concept: 'Explore new zones!', instructions: '15min reading out loud w/30s summary.' },
      { id: 'writing', name: 'Writing', emoji: '✏️', concept: 'Skill mastery', instructions: 'Write at least 3 clean sentences w/punctuation.' },
      { id: 'chinese', name: 'Chinese', emoji: '💮', concept: 'Character master!', instructions: 'Practice reading current vocabulary card set 2x.' }
    ],
    rewardHistory: [],
    megaRewardHistory: [],
    volume: 50,
    claimedRewardsHistory: [],
    activeDay: new Date().getDay(),
    weekStartDate: formatLocalDate(getWeekStart(new Date(), 0)),
    starVault: {
      earnedDates: [],
      totalTraded: 0
    },
    collectedBadges: [],
    badgePool: [...TIER_1_IDS],
    activeWeeklyBadgeId: null
  };
}
```

---

## 4. Work Accomplished

### A. Decoupled & Modularized Code (Phase 1 Refactoring)
*   **Migrations Extract**: Created [migrations.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/migrations.js) and moved all historical schema migrations (v3 through v12). Added a unified `runMigrations` wrapper.
*   **Date Utils Extract**: Created [date_utils.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/date_utils.js) containing pure date functions: `formatLocalDate`, `getWeekStart`, and `getSunday`.
*   **Curated Data Decoupling**: Centralized configuration variables (`EVOLUTIONS`, `STARTER_OPTIONS`, `MEGA_POKEMON`, `STARTER_FAMILIES`) inside [pokemon_data.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/pokemon_data.js).
*   **Reduced state.js Noise**: Stripped all static mappings and migration logic out of [state.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/state.js), reducing its footprint by 350+ lines.
*   **Cleaned Imports**: Updated `app.js`, `vault.js`, and `tests.js` to load helpers from the new modules.

### B. Network Optimization (Debounced Saves)
*   **Debounced Firestore Hook**: Implemented `debounceWithFlush` (1.5-second wait) inside [app.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js). Multiple checkbox checks are now throttled into a single Firestore cloud update instead of spawning parallel requests.
*   **Synchronous Close Flush**: Wired a `beforeunload` listener to flush any pending debounced state changes to Firestore synchronously when closing the tab, preventing data loss.

### C. UX & Alignment Improvements
*   **Spacing Gap**: Added `gap: 16px` to `.quick-actions-section` inside [style.css](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/style.css) so parent options and the Danger Zone card do not touch when the parent card stretches.
*   **Standardized Modals**: Swapped Cancel/No (grey, left) and Confirm/Yes (color, right) positions in all dialog templates.
*   **Dynamic Change Day Warnings**: Shows a simple Header Confirmation modal if the grid has no checked items, and runs the full detailed warning (with Best Practice tip) only when checked items exist.

---

## 5. Files and Code

### Created Files
*   `[date_utils.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/date_utils.js)`: Pure date formatters.
*   `[migrations.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/migrations.js)`: Unified app schema migrations.

### Edited Files
*   `[state.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/state.js)`: Cleaned up code; imports helpers; uses `runMigrations` inside `loadState` and `replaceState`.
*   `[pokemon_data.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/pokemon_data.js)`: Curated game evolutions maps and configs.
*   `[app.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js)`: Debounced cloud saving; imports from new date utils and pokemon data modules.
*   `[vault.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/vault.js)`: Updated date utilities import.
*   `[style.css](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/style.css)`: Flex gap spacing corrections.
*   `[tests.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js)`: Fixed test case 21 reward choices; updated date utility imports.

---

## 6. Validation Instructions

1.  **Start Local Env**: Run `./run_emulator.sh` and make sure your server is active (`python3 -m http.server 8085`).
2.  **Verify Tests**: Load `http://localhost:8085/?runTests=true` and confirm all 22 test cases pass.
3.  **Verify Migrations**: Load `http://localhost:8085/?runMigrationTest=true` and confirm schema migrations compile cleanly.
4.  **Manual UI Check**:
    *   Log in, open the Parent Admin Panel, and confirm cards in "Quick Actions" have a visual 16px gap between sections on desktop.
    *   Try changing the "Week Start Day" from Sunday to Monday on an empty grid (should show a gentle prompt).
    *   Check a task, then try changing it again (should show the full warning dialog with the "Best Practice" box).
