# CHECKPOINT 15

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for Kepler's Pokémon Training Chart app. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests
*   **None** (All requested features and fixes have been successfully implemented and verified).

---

## 2. User & Project Metadata
*   **Admin Password**: `"zxcv"`
*   **Target Audience**: Kepler (7 years old)
*   **Local Server URL**: `http://localhost:8000/` (dev server) and `http://127.0.0.1:8085/` (headless test server)
*   **Git Policy**: Do NOT push changes to GitHub during the session. Git push must only be executed at the end of the session.
*   **Sprites Repository**: Official PokéAPI assets fetched from GitHub Raw.
*   **Audio volume**: Default 50%
*   **Active Branch**: `prototype/pokemon-badge-collection`

---

## 3. Active V13 State Schema
```javascript
export let state = {
  version: 11,
  partnerFamily: '25', // Default Pikachu Family
  excused: {}, // key format: "day-task" -> boolean
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
  grid: {}, // key format: "day-task" -> boolean
  tasks: [
    { id: 'piano', name: 'Piano Practice', req: 7, emoji: '🎹', concept: 'Level up!', instructions: 'Play all pieces 3x and work on hard parts.' },
    { id: 'math', name: 'Math Practice', req: 7, emoji: '🧮', concept: 'Intellect +1', instructions: "Complete today's worksheet or 15 mins on math app." },
    { id: 'reading', name: 'Reading Time', req: 7, emoji: '📚', concept: 'Explore new zones!', instructions: '15min reading out loud w/30s summary.' },
    { id: 'writing', name: 'Writing', req: 5, emoji: '✏️', concept: 'Skill mastery', instructions: 'Write at least 3 clean sentences w/punctuation.' },
    { id: 'chinese', name: 'Chinese', req: 5, emoji: '💮', concept: 'Character master!', instructions: 'Practice reading current vocabulary card set 2x.' }
  ],
  rewardHistory: [],
  megaRewardHistory: [],
  volume: 50,
  claimedRewardsHistory: [],
  activeDay: new Date().getDay(),
  weekStartDate: formatLocalDate(getSunday(new Date())),
  starVault: {
    earnedDates: [],
    totalTraded: 0
  },
  collectedBadges: [],
  badgePool: TIER_1_IDS.filter(id => id !== 25),
  activeWeeklyBadgeId: 25
};
```

---

## 4. Work Accomplished
1.  **Implemented Task Instructions Guide Modal (Option #4)**:
    *   Created `guide.js` to manage the modal rendering and visibility logic for the Task Guide. Tapping "📖 Guide" in the grid column header opens the guide.
    *   Exposed task instructions configuration inside the Parent Admin Panel, transforming `.admin-task-item` into a clean two-row vertical stack. The second row houses a full-width input field enabling parents to edit instructions dynamically.
    *   Added automated self-healing validation in `state.js` to detect missing `instructions` fields on existing stored user states and safely backfill them with default rules (e.g., Piano: "Play all pieces 3x...", Reading: "15min reading out loud...").
    *   Wrote integration test (`Test Case 20` in `tests.js`) which verifies opening/closing of the guide modal, DOM rendering of default instructions, editing them in the Parent Admin Panel, saving the changes, and verifying the updated rules successfully render in the guide.
2.  **Updated PWA Service Worker Cache**:
    *   Registered `guide.js` in `ASSETS_TO_CACHE` within `service-worker.js`.
    *   Bumped PWA Cache to `poke-chart-cache-v23` and app version to `v1.4.0 (v23)` to trigger the update on all clients.
    *   Updated script/stylesheet query cache-busting strings to `v=6.2` inside `index.html`.

---

## 5. Files and Code

### New Files
*   `[guide.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/guide.js)`: Manages PWA Task Guide modal logic and dynamic lists (lines 1-61).

### Edited Files
*   `[state.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/state.js)`: Expanded default schema tasks and self-healing task validator to support instructions (lines 142-146, 397-401, 555-580).
*   `[index.html](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html)`: Added "📖 Guide" button to grid table column header (lines 117-122) and `#guide-modal` container markup (lines 456-469). Bumped cache versions.
*   `[style.css](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/style.css)`: Added Guide modal styling (lines 2701-2769). Updated `.admin-task-item` structure to column flex layout and added `.admin-task-row` and `.admin-task-instructions` rules (lines 1431-1472).
*   `[admin.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/admin.js)`: Restructured `renderAdminTasksList` to support instructions editing inputs (lines 187-226) and updated `addNewTask`/`saveAdminTasks` (lines 249-253, 267-270, 281-285).
*   `[app.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js)`: Integrated `initGuide`, `openGuide`, `renderGuide` functions, calling it in main entry point and exposing them to `__test_helpers__` (lines 30, 120, 1585, 1586). Bumped version.
*   `[service-worker.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js)`: Added `guide.js` to cache manifest (line 9) and bumped CACHE_NAME to `v23` (line 1).
*   `[tests.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js)`: Added `Test Case 20` for instructions guide modal validation (lines 1445-1552).

---

## 6. Current Work and Next Steps
*   **Next Actions**:
    *   Verify the Task Guide UI looks clean and functions as expected on tablet screen widths.
