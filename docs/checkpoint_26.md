# CHECKPOINT 26

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

---

## 2. User & Project Metadata
*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Target Audience**: Kepler (7-10 years old)
*   **Current Version**: `v1.7.3` / Service Worker cache `v67`
*   **Active Port**: `8085` (running Python web server)
*   **Firebase Emulator Project**: `demo-pokemon-chart`
*   **Parent Email**: `crsjain+staging@gmail.com`
*   **Admin Password**: `zxcv` (Default fallback, configurable in Parent Admin Panel)

---

## 3. Active V16 State Schema
```javascript
export let state = {
  version: 16,
  activePartnerInstanceId: '25',
  partnerFamily: '25', // Default Pikachu Family (kept for compatibility)
  weekStartDay: 0, // Default Sunday (0) to Saturday (6)
  idleTimeout: 10, // Default 10 minutes
  adminPassword: 'zxcv', // Configurable parent admin passcode
  timezoneOffset: 'default', // Configurable App Timezone ('default' or IANA string)
  weeklyRewardOptions: [...DEFAULT_WEEKLY_REWARDS],
  megaRewardOptions: [...DEFAULT_MEGA_REWARDS],
  excused: {}, // key format: "YYYY-MM-DD-task" -> boolean
  weeklyHistory: {}, // key format: "YYYY-MM-DD" -> { weekStartDay, reward, megaReward, weeklyClaimed, badgeId, xpEarned }
  partnersData: {
    '25': { familyId: '25', level: 1, xp: 0, stageId: '25' },
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
  activeWeeklyBadgeId: 25,
  unlockedPartners: {
    '25': { familyId: '25', level: 1, xp: 0, stageId: '25' }
  }
};
```

---

## 4. Work Accomplished
*   **3-Tier Star Economy**: Added `getPokemonCost(id)` resolving costs dynamically (15 for Legendaries, 10 for Rares, 5 for Normal/Base). Added type filters and cost dropdown filter.
*   **Accelerando Swarm Unlock (Option A)**: Implemented accelerating timings and rattling animations for star unlocks.
*   **Evolution Sparkle Indicators**: Added bouncing sparkle `✨` symbol to cards with evolution configuration in the app.
*   **Pokédex Database Cleanup**: Removed evolved forms from the shop. Replaced them with base forms and mapped their evolution structures.
*   **Evolution Choice Dialog Visual Revamp**: Refactored grid to centered flex container with type-specific soft radial background glows and hover scaling.
*   **Devolution Warning CTA Update**: Support devolution warning button to `"Let's get it back! 🚀"` styled in warning slate-blue.
*   **Environment Detection Fix**: Expanded local environment detection in `firebase.js` to recognize Cloudtop workstation domain names (`*.googlers.com`, `*.corp.google.com`) and local port `8085` automatically as local emulator hosts.
*   **Past Week Badge Rollover (Option 1)**: Refactored past week badge rendering and week rollover. Past training weeks render either a color badge (`Badge Earned!`), black silhouette (`The Pokémon Fled!`), or Pokéball icon (`Archived Training Week`) depending on whether goals were completed or if they are legacy archive weeks.
*   **Environment Status Banner**: Implemented top status banners dynamically displaying `🔌 Running in Emulator Mode` (slate-grey) or `⚠️ Running in Staging Environment` (orange) depending on browser location context.
*   **Parent Passcode Configurator**: Added a Parent Passcode change module inside the admin settings. Updates save locally and sync across all family profiles on Cloud Firestore in real-time.
*   **Friendly Timezone Offset Dropdown**: Added a non-technical App Timezone dropdown (`Automatic`, `Pacific Time`, `Mountain Time`, `Central Time`, `Eastern Time`) that automatically resolves Daylight Saving Time (DST) changes under the hood.
*   **Active Column Range Boundary**: Highlighting today's day column in yellow is now strictly limited to when today's calendar date actually falls within the viewed week range, resolving incorrect highlighting on stale active weeks.

---

## 5. Files and Code
### Edited Files
*   [pokemon_data.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/pokemon_data.js): Added Scyther, Honedge, Larvesta, Rookidee, Toxel, Tinkatink, Fidough, and Charcadet base form mappings and type evolution rules.
*   [shop.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/shop.js): Implemented cost filter selector, accelerando unlock swarm formulas, and shop grid cards sparkle rendering.
*   [app.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js): Configured custom E2E warning CTAs, environment status banners, passcode cloud synchronization callbacks, and timezone dropdown event listener logic.
*   [style.css](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/style.css): Appended options grid styling, environment warning banner classes, and Option 1 active header details.
*   [index.html](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html): Inserted environment banner container, parent passcode settings group, and friendly App Timezone selector elements.
*   [firebase.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/firebase.js): Expanded `isLocal` detection and defined `saveAdminPasswordToCloud` to propagate passcode changes family-wide.
*   [state.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/state.js): Added template definitions for passcode and timezone offset key integration, mapping default dates to timezone offset helper.
*   [date_utils.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/date_utils.js): Implemented `getLocalDate()` supporting target timezone translations and auto-DST calculations.
*   [service-worker.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js): Bumped cache version to `v67` to invalidate outdated local caches on reload.
*   [tests.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js): Added Test Cases 48, 49, and 50 validating Sunday highlighting, Option 1 badging, and passcode update E2E workflows.

---

## 6. Validation Instructions
1. Navigate to: `http://127.0.0.1:8085/index.html?exposeState=true&useEmulator=true`
2. Verify you see the slate banner at the top: `🔌 Running in Emulator Mode. Do not use with production credentials.`
3. Open **Parent Admin Panel** (default passcode `zxcv`).
   * Select **App Timezone** -> `Pacific Time (US & Canada)` and verify Sunday is highlighted (if today is Sunday local time).
   * Enter a new passcode (e.g. `abcd`) under **Parent Passcode** and click **Update Passcode**. Verify that logging out and trying to open the panel with `zxcv` fails, while `abcd` works.
4. Verify all 50 E2E tests pass by running: `node run_headless_tests.js`.
