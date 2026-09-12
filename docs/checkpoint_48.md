# CHECKPOINT 48

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for the application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **Galarian Moltres Standalone Pokémon Shop Addition**:
  - User requested: "My son wants to see Moltres in the pokemon shop. I know there are multiple Moltres versions (galarian, normal, etc)."
  - User decided: "I think the proposal is too complicated. Let's just add Galarian Moltres into the pokemon shop without any evolution linkage to Moltres."
  - **Implementation Summary**:
    - Added **Galarian Moltres** (`#10171`) to `POKEMON_MAP` in `pokemon_data.js`.
    - Added to `TIER_2_IDS`.
    - Assigned **Dark** type (`POKEMON_TYPES[10171] = "Dark"`).
    - Categorized as **Legendary** (`LEGENDARY_POKEMON_IDS.add(10171)`), making it cost 15 Stars.
    - Omitted from `EVOLVED_POKEMON_IDS`, allowing it to naturally appear in the Pokémon Shop as a buyable standalone partner.
    - Omitted from `EVOLUTIONS`, giving it zero evolution linkage to any other Pokémon. It trains and levels smoothly from Level 1 to 10 as Galarian Moltres.
    - Verified full PokeAPI asset availability for official artwork (`.../official-artwork/10171.png`) and 2D pixel sprite (`.../10171.png`).
- [x] **Card Name Truncation Fix (Option 1: Gaming Abbreviation `G. Moltres`)**:
  - User reported: "The name is cutoff. Have the UX Designer advise what to do about this. Is there a way to show an abbreviated name so we don't need to adjust the rest of the cards? Or does this require changing the card sizes?"
  - User selected **Option 1**: Abbreviate card name to standard Pokémon convention `G. Moltres` (10 chars, exact same length as Charmander, fits on 1 line with 0 truncation).
  - Added `POKEMON_SHORT_NAMES = { 10171: "G. Moltres" }` and `getPokemonShortName(id)` helper in `pokemon_data.js`.
  - Updated `shop.js` to render `${shortName}` inside `<span class="shop-item-name" title="${name}">`, preserving full "Galarian Moltres" on hover and in confirmation/showcase/HUD views.
  - Leaves all other cards untouched and card sizes completely unchanged.
- [x] **Cache & Asset Invalidation**:
  - Bumped Service Worker cache to `poke-chart-cache-v138` in `service-worker.js`.
  - Bumped asset query strings in `index.html`: `style.css?v=10.33`, `app.js?v=10.26`.
- [x] **Automated Regression Suite Verification**:
  - Added **Test Case 77** in `tests.js` validating:
    - Card presence in shop with cost 15 stars and Dark type.
    - Card display name `G. Moltres` and full `title="Galarian Moltres"` attribute.
    - Absence of evolution sparkle icon ✨.
    - Filtering by Dark type surfaces Galarian Moltres.
    - Purchasing flow with 15 stars, hold-to-unlock gesture, adoption confirmation (with full name "Galarian Moltres"), and partner data creation.
    - Post-purchase `CAUGHT!` ribbon rendering on shop reopen.
  - Ran `run_headless_tests.js`: **77/77 tests passing (100% green)**.

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Target Audience**: Kepler (7yo) & Lyra (gamified training chart)
*   **Current Version**: `v1.10.15` / Service Worker cache `poke-chart-cache-v138` / Asset tags `style.css?v=10.33`, `app.js?v=10.26`
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

* **Galarian Moltres (`#10171`) Integration**:
  - Registered `10171: "Galarian Moltres"` in `POKEMON_MAP`.
  - Added to `TIER_2_IDS`.
  - Assigned type `Dark` (`POKEMON_TYPES[10171] = "Dark"`).
  - Categorized in `LEGENDARY_POKEMON_IDS` ensuring automatic 15-star pricing via `getPokemonCost()`.
  - Maintained zero evolution linkage, allowing Kepler to directly adopt Galarian Moltres and level it up to Level 10.
* **Option 1 Card Display Abbreviation (`G. Moltres`)**:
  - Added `POKEMON_SHORT_NAMES` and `getPokemonShortName(id)` to [`pokemon_data.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/pokemon_data.js).
  - In [`shop.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/shop.js), rendered `shortName` on the card and preserved full `name` in tooltip and confirmation screens.
  - Eliminated ellipsis truncation on compact 100px cards without modifying grid dimensions or affecting any other cards.
* **Automated Regression Suite Verification**:
  - Enhanced **Test Case 77** in [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js):
    - Verified shop presence, 15-star cost, and Dark type.
    - Verified card display name `G. Moltres` and full title attribute `Galarian Moltres`.
    - Verified type filter filtering for Dark surfaces Galarian Moltres.
    - Verified hold-to-unlock flow, partner assignment, and subsequent `CAUGHT!` ribbon state.
  - Ran `node run_headless_tests.js`: 77/77 tests passed cleanly in ~17s.
* **Cache & Asset Invalidation**:
  - Bumped Service Worker cache to `poke-chart-cache-v138` in [`service-worker.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js).
  - Bumped asset tags in [`index.html`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html) to `style.css?v=10.33` and `app.js?v=10.26`.

---

## 5. Files and Code

### Created Files
* [`docs/checkpoint_48.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_48.md):
  - Checkpoint 48 documentation.

### Edited Files
* [`pokemon_data.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/pokemon_data.js):
  - Added `10171: "Galarian Moltres"` to `POKEMON_MAP`.
  - Added `10171` to `TIER_2_IDS`.
  - Added `10171: "Dark"` to `POKEMON_TYPES`.
  - Added `10171` to `LEGENDARY_POKEMON_IDS`.
  - Added `POKEMON_SHORT_NAMES` and `getPokemonShortName(id)`.
* [`shop.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/shop.js):
  - Used `getPokemonShortName(id)` for card rendering with `title="${name}"`.
* [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js):
  - Added Test Case 77 verifying Galarian Moltres shop listing, `G. Moltres` card abbreviation, filtering, and adoption.
* [`index.html`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html):
  - Bumped asset tags to `style.css?v=10.33` and `app.js?v=10.26`.
* [`service-worker.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js):
  - Bumped cache to `poke-chart-cache-v138`.

---

## 6. Validation Instructions

1. **Open the Pokémon Shop**:
   - Tap the Vault / Star counter on the HUD.
   - Locate **G. Moltres** (via Dark 🌙 filter or scrolling):
     - Verify the name renders cleanly as **`G. Moltres`** on a single line with **zero truncation (`...`)**.
     - Hover over the name to see the full tooltip **`Galarian Moltres`**.
     - Verify the card is priced at ⭐ 15 Stars.
   - Click the card:
     - Verify the hold-to-unlock modal displays the full name **"Galarian Moltres"** with official artwork.
2. **Automated Suite**:
   - Run `node run_headless_tests.js`: verify 77/77 tests pass (100% green).
