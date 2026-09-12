# CHECKPOINT 46

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for the application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **Pokémon Shop "Owned vs. Not-Yet-Owned" Visual Indicators with Repurchase Support (Option A)**:
  - User requested: "Option A but the child should be able to repurchase the pokemon again if they want - this is particularly relevant for pokemon like Eevee which have multiple evolution paths."
  - User requested: "Remove the ' • Caught: 5/111' I find it distracting."
  - User requested: "Have the caught call-out go upward past the card boundaries slightly, where highlighted in red in the screneshot."
  - **Option A Visual Indicators (Pokedex Caught Paradigm)**:
    - **Upward Floating Pixel Ribbon (`.shop-item-caught-ribbon`)**: Positioned at `top: -9px; left: 50%; transform: translateX(-50%)` with `'Press Start 2P'` 8-bit font (`0.44rem`). Straddles and extends upward past the card boundary into the user-specified zone, framed by a complete 4-corner border (`border: 1.5px solid #059669; border-radius: 4px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.18)`). Displays `CAUGHT!` or, if multiple copies are owned, dynamic `CAUGHT ×{count}` (e.g. `CAUGHT ×2`). Completely unblocks breathing room around Pokémon artwork and corner stamp.
    - **2D Poké Ball Stamp (`.shop-item-pokeball-badge`)**: Sits in the top-right corner of `.shop-item-sprite-container` replacing the generic lock badge. Rendered purely in CSS (`linear-gradient(to bottom, #ef4444 48%, #1e293b 48%, #1e293b 54%, #ffffff 54%)`) with an inner center button circle, delivering 100% pre-literacy recognition without emoji OS rendering drift (Rule 3).
    - **Celebratory Card Frame (`.shop-item-card.caught`)**: Applies emerald border (`#10b981`) and soft mint gradient (`linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)`).
    - **Scroll Container Clearance**: Updated `.shop-items-grid` to `padding: 12px 8px 8px; gap: 14px 12px;` so the top row's `-9px` callout tab has 3px of comfortable clearance inside the scroll viewport with zero clipping.
    - **Clean Subtitle**: Kept `#shop-screen-browse` subtitle clean and uncluttered (`You have X stars available to spend.`), removing distracting counter text per user request.
  - **Full Repurchase & Multi-Evolution Support**:
    - Cards remain 100% interactive and purchasable:
      - If affordable ($\ge$ cost): Displays green `⭐ cost` price tag with emerald hover lift.
      - If locked ($<$ cost): Displays progress bar `${stars}/${cost} Stars` showing progress toward the next copy, without showing a confusing lock badge on an already-owned friend.
    - **Context-Aware Confirmation Screen (`selectPokemon(id)`)**:
      - For already-caught Pokémon: `You already have ${name} (already on your team)! Ready to welcome another to your team for ${cost} Stars? 🌟`.
      - If multiple copies owned: `You already have ${name} (${count} already on your team)! Ready to welcome another to your team for ${cost} Stars? 🌟`.
      - Hold button CTA displays `Hold Down to Adopt Another! 🔓`.
    - Unlocking an owned Pokémon creates an independent instance in `state.partnersData` (`${pokemonId}_${Date.now()}`), allowing players to level and evolve different instances along separate evolutionary branches (e.g. Vaporeon, Jolteon, Flareon).
- [x] **Cache & Asset Invalidation**:
  - Bumped Service Worker cache to `poke-chart-cache-v135` in `service-worker.js`.
  - Bumped asset tags in `index.html`: `style.css?v=10.30`, `app.js?v=10.23`.
- [x] **Automated Regression Suite Verification**:
  - Enhanced **Test Case 76** in `tests.js` validating starter caught state assertions (ribbon, pokeball stamp, `data-caught="true"`), upward negative `top: -9px` and `border-radius: 4px` ribbon geometry, unowned absence assertions, subtitle cleanliness (no distracting caught counter), duplicate repurchase flow on Eevee (#133), and dynamic `CAUGHT ×2` ribbon update upon repurchase.
  - Ran `run_headless_tests.js`: **76/76 tests passing (100% green)**.

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Target Audience**: Kepler (7yo) & Lyra (gamified training chart)
*   **Current Version**: `v1.10.12` / Service Worker cache `poke-chart-cache-v135` / Asset tags `style.css?v=10.30`, `app.js?v=10.23`
*   **Admin Password**: `"zxcv"`
*   **Local Server URL**: `http://localhost:8000/` (or `http://crsjain.c.googlers.com:8000/`)
*   **Git Policy**: Changes committed to local branch `prototype/pokemon-badge-collection`. Pushes executed only via `session-wrapup` skill.
*   **Audio/Volume Settings**: Default volume 50%, synthesized 8-bit web audio chimes.

---

## 3. Active V18 State Schema

```javascript
{
  activePartnerInstanceId: '25',
  partnersData: {
    '25': { familyId: '25', level: 1, xp: 0, stageId: '25' },
    '4': { familyId: '4', level: 1, xp: 0, stageId: '4' },
    '1': { familyId: '1', level: 1, xp: 0, stageId: '1' },
    '7': { familyId: '7', level: 1, xp: 0, stageId: '7' },
    '133': { familyId: '133', level: 1, xp: 0, stageId: '133' },
    '95': { familyId: '95', level: 1, xp: 0, stageId: '95' }
  },
  reward: '',
  megaReward: '',
  megaWeeks: 0,
  weeklyClaimed: false,
  debugSidebarEnabled: false,
  grid: {}, // key format: "YYYY-MM-DD-task" -> boolean
  excused: {}, // key format: "YYYY-MM-DD-task" -> 'bonus' | 'rest' | boolean (legacy true = 'rest')
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
  activeDay: 1,
  weekStartDate: '2026-08-10',
  weekStartDay: 0,
  pendingWeekStartDate: null,
  pendingWeekStartDay: null,
  activeWeeklyBadgeId: 1,
  collectedBadges: [],
  starVault: {
    totalStars: 0,
    earnedDates: [] // Array of "YYYY-MM-DD"
  },
  adminPassword: "zxcv",
  profiles: {
    "kepler": { id: "kepler", name: "Kepler", role: "child" },
    "lyra": { id: "lyra", name: "Lyra", role: "child" }
  },
  activeProfileId: "kepler"
}
```

---

## 4. Work Accomplished

* **Upward Protruding Caught Ribbon**:
  - Positioned `.shop-item-caught-ribbon` with `top: -9px; left: 50%; transform: translateX(-50%)`, `padding: 3px 6px 2.5px`, full 4-corner `border-radius: 4px`, and subtle drop shadow.
  - Placed ribbon directly in the user-highlighted zone straddling and extending above the card's top border.
  - Increased `.shop-items-grid` top padding to `12px` and row gap to `14px` for clean viewport containment without scroll clipping.
* **Repurchase & Evolution Tree Support**:
  - Maintained `getOwnedPokemonCount(pokemonId)` in `shop.js` to accurately count instances across families, stages, and baby forms.
  - Retained `⭐ ${cost}` price tag for affordable caught Pokémon and progress bar for locked caught Pokémon.
  - Updated confirmation modal copy to acknowledge existing team members and prompt for duplicates.
  - Ensured unlocking an owned Pokémon produces an independent instance in `state.partnersData`, updating the ribbon to `CAUGHT ×2`.
* **Automated Regression Verification**:
  - Enhanced **Test Case 76** to verify `top: -9px` and `border-radius: 4px` on the caught ribbon.
  - Verified 100% pass across all 76 tests via `run_headless_tests.js`.
* **Cache Invalidation**:
  - Bumped Service Worker cache to `poke-chart-cache-v135`.
  - Bumped asset tags in `index.html` to `style.css?v=10.30` and `app.js?v=10.23`.

---

## 5. Files and Code

### Created Files
* [`docs/checkpoint_46.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_46.md):
  - Checkpoint 46 documentation.

### Edited Files
* [`style.css`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/style.css):
  - Updated `.shop-item-caught-ribbon` to `top: -9px`, `border-radius: 4px`, `border: 1.5px solid #059669`.
  - Adjusted `.shop-items-grid` to `padding: 12px 8px 8px; gap: 14px 12px;`.
* [`index.html`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html):
  - Bumped asset tags to `style.css?v=10.30` and `app.js?v=10.23`.
* [`service-worker.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js):
  - Bumped cache to `poke-chart-cache-v135`.
* [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js):
  - Enhanced Test Case 76 asserting negative top and border-radius on the caught ribbon.

---

## 6. Validation Instructions

1. **Open the Pokémon Shop**:
   - Tap the Vault / Star counter on the HUD to open the shop modal.
   - Inspect caught cards (e.g. Bulbasaur, Charmander, Pichu, Squirtle, Eevee):
     - Verify the green `CAUGHT!` ribbon extends upward past the card's top border into the crown zone.
     - Observe that the Pokémon sprite below has full breathing room with no visual overlap.
     - Verify the top row of cards has smooth breathing room without clipping against the top edge of the scroll grid.
2. **Automated Suite**:
   - Run `node run_headless_tests.js`: verify 76/76 tests pass (100% green).
