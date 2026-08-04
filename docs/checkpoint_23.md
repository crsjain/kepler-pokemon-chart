# CHECKPOINT 23

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for the application. **Use this document to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests
- [x] Limit Historical Week Navigation (done)
- [x] Historical Day Header Treatments (done)
- [x] Forced Today Active Day (done)
- [x] Isolated Test Account (done)
- [x] Week Start Day Switch bug (done)
- [x] Future Day Locking (done)
- [x] Reward Selection UI Reset Bug (done)
- [x] Partner Devolution: Allow Pokemon to devolve to their previous stage if XP/level drops below the evolution threshold (done)

---

## 2. User & Project Metadata
*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Target Audience**: Kepler (7 years old) and Lyra (5 years old)
*   **Current Version**: `v1.7.1 (v57)` / Service Worker cache `v57`
*   **Active Port**: `8085` (running Python web server)
*   **Firebase Emulator Project**: `demo-pokemon-chart` (Firestore UI on port `4000`, DB on `8080`, Auth on `9099` - running in background)
*   **Parent Email**: `crsjain@gmail.com`
*   **Admin Password**: `zxcv`
*   **Git Policy**: Dev branch commits and pushes to origin. Merges to main to deploy.

---

## 3. Active V15 State Schema
```javascript
export let state = {
  version: 15,
  partnerFamily: '25', // Default Pikachu Family
  weekStartDay: 0, // Default Sunday (0) to Saturday (6)
  idleTimeout: 10, // Default 10 minutes
  weeklyRewardOptions: [...DEFAULT_WEEKLY_REWARDS],
  megaRewardOptions: [...DEFAULT_MEGA_REWARDS],
  excused: {}, // key format: "YYYY-MM-DD-task" -> boolean
  weeklyHistory: {}, // key format: "YYYY-MM-DD" -> { weekStartDay, reward, megaReward, weeklyClaimed, badgeId, xpEarned }
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
  weekStartDate: formatLocalDate(getWeekStart(new Date(), 0)),
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
*   **Partner Devolution**: Modified `addXp()` in `app.js` to check for evolution stage changes whenever the level changes (either increases or decreases). If the level drops below the threshold for the current evolution stage, the partner is devolved back to the appropriate lower stage.
*   **Eevee Devolution Handling**: Added special case for Eevee (family `133`) to devolve it back to Eevee (stage `133`) if its level drops below 5.
*   **Improved Evolution Notifications**: Refactored evolution notification in `app.js` to correctly resolve and display the immediate previous stage name (e.g. "Charmeleon evolved into Charizard" instead of "Charmander evolved into Charizard" for 3-stage lines).
*   **Added Test Case 37**: Added regression tests in `tests.js` covering both regular partner devolution (Pikachu -> Raichu -> Pikachu) and Eevee devolution (Vaporeon -> Eevee) triggered by checkbox unchecking.

---

## 5. Files and Code
### Edited Files
*   [app.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js): Updated `addXp` to handle devolution and improve evolution notifications (lines 2250-2321).
*   [tests.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js): Added **Test Case 37** for partner devolution (lines 2659-2730).

---

## 6. Validation Instructions

### Local Manual Verification
1. Launch the app locally: `http://127.0.0.1:8085/index.html`.
2. Choose a partner that is close to leveling up/evolving (or use Admin panel to set level).
    - *Example*: Pikachu at Level 4, with enough tasks completed to level up to 5 on checking one more box.
3. Check the task box to trigger level up to 5. Verify the partner evolves to Raichu.
4. Uncheck the same task box to drop the level back to 4.
5. Verify that:
    - The level indicator updates back to LV 4.
    - The partner sprite and name revert back to Pikachu.
    - A custom notification appears: "😢 POKÉMON DEVOLVED 😢 ... Pikachu devolved back into Pikachu..." (or similar for other Pokemon).
