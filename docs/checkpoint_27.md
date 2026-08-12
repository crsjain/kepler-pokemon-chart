# CHECKPOINT 27

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for the application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests
- [x] Implement 3-Tier Star Economy (5 / 10 / 15 Stars based on rarity) (done)
- [x] Cost Filter Selector in Shop instead of Legendary checkbox (done)
- [x] Option A Accelerando Swarm Animation for star locks (done)
- [x] Vault spend shortcut threshold lowered to 5 Stars (done)
- [x] Sparkle emoji evolution potential indicator in shop grid & details (done)
- [x] Pokédex database cleanups to only list base forms in the shop (done)
- [x] Branch evolution dialog visual revamp (flex centering & type glows) (done)
- [x] Devolution notification warning button copy ("Let's get it back! 🚀") & color (slate-blue) (done)
- [x] Codify CTA tone matching rules in UX UI Guidelines (done)
- [x] Local environment task tracker empty & warning banner missing (done)
- [x] Option 1 Past Weeks Badges & Rollovers (done)
- [x] Parent Passcode update configurator inside Admin Panel (done)
- [x] Friendly Timezone dropdown selector with Auto-DST support (done)
- [x] Active Day Column calendar range boundaries (done)
- [x] Scrub Pokémon Shop for Basic-Only & Proper Mapping (including Pichu starter, Igglybuff, Munchlax, and mixed linear/branching evolution engine support) (done)

---

## 2. User & Project Metadata
*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Target Audience**: Kepler (7-10 years old)
*   **Current Version**: `v1.8.0` / Service Worker cache `v58`
*   **Active Port**: `8085` (running Python web server)
*   **Firebase Emulator Project**: `demo-pokemon-chart`
*   **Parent Email**: `crsjain+staging@gmail.com`
*   **Admin Password**: `zxcv` (Default fallback, configurable in Parent Admin Panel)

---

## 3. Active V17 State Schema
```javascript
export let state = {
  version: 17,
  activePartnerInstanceId: '172',
  partnerFamily: '172', // Default Pichu Family
  weekStartDay: 0, // Default Sunday (0) to Saturday (6)
  idleTimeout: 10, // Default 10 minutes
  adminPassword: 'zxcv', // Configurable parent admin passcode
  timezoneOffset: 'default', // Configurable App Timezone ('default' or IANA string)
  weeklyRewardOptions: [...DEFAULT_WEEKLY_REWARDS],
  megaRewardOptions: [...DEFAULT_MEGA_REWARDS],
  excused: {}, // key format: "YYYY-MM-DD-task" -> boolean
  weeklyHistory: {}, // key format: "YYYY-MM-DD" -> { weekStartDay, reward, megaReward, weeklyClaimed, badgeId, xpEarned }
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
  tasks: [...],
  rewardHistory: [],
  megaRewardHistory: [],
  volume: 50,
  claimedRewardsHistory: [],
  activeDay: new Date().getDay(),
  weekStartDate: 'YYYY-MM-DD',
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
*   **Basic-Only Pokémon Shop**: Scrubbed the shop to ensure only basic (base) forms are buyable. Moved evolved forms like Pikachu (25), Jigglypuff (39), and Snorlax (143) to `EVOLVED_POKEMON_IDS` to filter them out of the shop.
*   **New Base Forms & Mapping**: Replaced Jigglypuff with Igglybuff (174) and Snorlax with Munchlax (446) as the buyable forms. Added Caterpie, Gastly, Magikarp, Dratini, Ralts, Trapinch, and Beldum lines with proper linear or branching evolution structures.
*   **Mixed Evolution Engine Support**: Upgraded the evolution engine in `app.js` (`renderState` and `addXp`) to support mixed evolution chains that feature both linear stages and branching options (e.g., Cosmog -> Cosmoem -> Solgaleo/Lunala). The engine now dynamically tracks the pre-branching stage instead of assuming the family ID is the only branching trigger.
*   **Default Partner Pichu**: Changed the default starter partner from Pikachu (25) to Pichu (172) in `state.js` to align with the basic-only shop rule. The default active weekly badge was also updated to Pichu (172).
*   **State Migration V17**: Implemented migration version 17 in `migrations.js` to automatically convert existing user profiles containing Pikachu (25), Jigglypuff (39), or Snorlax (143) partners to the new Pichu (172), Igglybuff (174), or Munchlax (446) lines, adjusting their stage and levels to maintain consistency.
*   **Badge Pool Extensions**: Expanded `TIER_1_IDS` and `TIER_2_IDS` in `pokemon_data.js` to include all new basic and intermediate forms so they can be earned as gym badges.
*   **Diagnostics Healing for Mixed Lines**: Updated `runStateDiagnostics` in `state.js` to support version 17 validation and correctly handle/heal partners belonging to mixed linear/branching evolution lines without incorrectly devolving them.
*   **Regression Tests Verification**: Updated `tests.js` to adapt to the Pichu starter, new state version 17, and updated shop content. Verified all changes pass headlessly using `node run_headless_tests.js`.

---

## 5. Verification Results
*   **Local Headless Test Runner**:
    ```bash
    node run_headless_tests.js
    ```
    Output:
    ```
    🎉 All regression tests passed successfully! Grid performance is optimized.
    ✅ Tests passed successfully!
    ```
