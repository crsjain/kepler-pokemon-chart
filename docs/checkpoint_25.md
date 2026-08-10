# CHECKPOINT 25

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for the application. **Use this document to initialize your next pair-programming session.**

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

---

## 2. User & Project Metadata
*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Target Audience**: Kepler (7-10 years old)
*   **Current Version**: `v1.7.2` / Service Worker cache `v66`
*   **Active Port**: `8085` (running Python web server)
*   **Firebase Emulator Project**: `demo-pokemon-chart`
*   **Parent Email**: `crsjain@gmail.com`
*   **Admin Password**: `zxcv`

---

## 3. Active V16 State Schema
```javascript
export let state = {
  version: 16,
  activePartnerInstanceId: '25',
  partnerFamily: '25', // Default Pikachu Family (kept for compatibility)
  weekStartDay: 0, // Default Sunday (0) to Saturday (6)
  idleTimeout: 10, // Default 10 minutes
  adminPassword: 'zxcv', // Default parent admin passcode
  timezoneOffset: 'default',
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
*   **Pokédex Database Cleanup**: Removed evolved forms (Scizor, Aegislash, Volcarona, Corviknight, Toxtricity, Tinkaton, Dachsbun, Armarouge, Ceruledge) from the shop. Replaced them with base forms (Scyther, Honedge, Larvesta, Rookidee, Toxel, Tinkatink, Fidough, Charcadet) and mapped their evolution structures.
*   **Evolution Choice Dialog Visual Revamp**: Refactored grid to flex wrapper to center any option layout (such as Mewtwo's 2 options). Added hover spring scaling and type-specific soft radial background glows.
*   **Devolution Warning CTA Update**: Overrode hardcoded "Awesome!" CTA text inside `showCustomNotification` to support configurable warning messages. Set devolution warning button to `"Let's get it back! 🚀"` styled in warning slate-blue.
*   **Codification of UX Guidelines**: Appended **Rule 11** to `_agents/rules/ux-guidelines.md` to establish tone-matching standards for alert CTAs.

---

## 5. Files and Code
### Edited Files
*   [pokemon_data.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/pokemon_data.js): Added Scyther, Honedge, Larvesta, Rookidee, Toxel, Tinkatink, Fidough, and Charcadet base form mappings, type declarations, evolved forms, and new evolution rules.
*   [shop.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/shop.js): Implemented cost filter selector dropdown, accelerando unlock swarm timing formulas, lock vibration shake, and shop grid cards sparkle rendering.
*   [app.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js): Added configurable CTA parameter for custom alert notifications, wired up the devolution button update, and updated branch evolution dialog cards to dynamically append type classes.
*   [style.css](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/style.css): Appended keyframes for subtle sparkle bounce, added type-specific radial gradients for option choices, and converted options grid to centered flex container.
*   [_agents/rules/ux-guidelines.md](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/_agents/rules/ux-guidelines.md): Added Rule 11 specifying guidelines on microcopy tonal matching and button coloring.
*   [tests.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js): Added E2E assertions for cost filters, 3-tier pricing, accelerando star slot counts, and evolution sparkles.

---

## 6. Validation Instructions
1. Navigate to: `http://127.0.0.1:8085/index.html?exposeState=true&useEmulator=true`
2. Open the browser console and paste the following snippet to inject 10 stars:
   ```javascript
   (function(starCount) {
     __app_state__.starVault.earnedDates = Array.from({length: starCount}, (_, i) => `2026-07-${10+i}`);
     __app_state__.starVault.totalTraded = 0;
     __test_helpers__.saveState();
     __test_helpers__.renderState(true);
   })(10);
   ```
3. Open the **Pokémon Shop** modal:
   * Verify Scyther is available to buy for `⭐ 10` stars, but Scizor is not in the list.
   * Verify Scyther shows the bouncing sparkle `✨` next to its name.
   * Filter the shop by `⭐ 10 Stars (Rare)` and verify only Scyther and other base Rares show.
4. Unlock Scyther (hold for 2 seconds). Notice the 10-star swarm timing is steady at first, then accelerates rapidly.
5. In the grid, level up Scyther to level 5 to verify it evolves into Scizor.
6. Uncheck a task to lower Scyther/Scizor level back to 4. Verify the devolution alert displays **`Let's get it back! 🚀`** in a cool blue button.
