# 🧪 Test & Verification Plan: Unearned Badge & Reward Carryover

**Document**: `test_plan_unearned_badge_and_reward_carryover.md`  
**Feature**: Carry over unearned weekly badge & reward to subsequent weeks  
**Target Branch**: `prototype/pokemon-badge-collection`  
**Automated Test**: Test Case 71 in `tests.js` (72 total tests)  
**Audience**: QA, Parents, Pair-Programming Agents  

---

## 🛠️ 1. Environment & Setup

* **Local App URL**: `http://crsjain.c.googlers.com:8000/` or `http://localhost:8000/`
* **Parent Admin Passcode**: `zxcv`
* **Automated Runner**: `node run_headless_tests.js`
* **Browser Cache**: Force-refresh with <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd> (or <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd>) to ensure `service-worker.js` cache `poke-chart-cache-v118` and `app.js?v=10.7` are loaded.

---

## 🤖 2. Automated Test Verification

Run the full automated headless test suite via terminal:

```bash
cd /usr/local/google/home/crsjain/kepler-pokemon-chart
node run_headless_tests.js
```

### Automated Assertions Checked in Test Case 71:
- [x] **Unearned Rollover (`isOldWeek`)**:
  - `state.activeWeeklyBadgeId` is preserved and NOT re-rolled.
  - `state.reward` is preserved and NOT wiped.
  - `rewardSelect.value` continues to reflect the carried-over reward in the UI.
  - `state.weeklyClaimed` resets to `false` for the new week.
  - `state.weeklyHistory[pastWeekStart]` archives `weeklyClaimed: false`, `badgeId`, and `reward`.
  - `state.collectedBadges` does not contain the unearned badge.
- [x] **Mid-Cycle Schedule Shift (`pendingWeekStartDate`)**:
  - Unearned badge and reward carry over across schedule shifts.
- [x] **Subsequent Week Earned Rollover**:
  - When `state.weeklyClaimed === true`, badge is awarded into `collectedBadges`.
  - A new weekly badge is rolled from `badgePool`.
  - `state.reward` resets to empty (`''`) for fresh selection.
  - `state.weeklyClaimed` resets to `false`.

---

## 📋 3. Step-by-Step Manual Test Scenarios

### Test Scenario 1: Standard Unearned Week Rollover (Badge & Reward Carry Over)
**Objective**: Verify that when a week ends without the child completing their tasks, the target Pokémon silhouette and selected reward remain for the new week.

1. Open the training chart (`http://localhost:8000/`).
2. Observe the weekly target Pokémon silhouette in the top-left / progress section (note the shape/species).
3. From the **Weekly Reward** dropdown, select a distinct reward (e.g. `⚡ +20 Mins of Bonus Tablet Time!` or `🍽️ Menu Master: Choose Weekend Breakfast or Dinner!`).
4. Leave several daily tasks incomplete so the weekly goal is NOT met (`weeklyClaimed = false`).
5. Open the Admin Panel (`Admin 🔒` $\rightarrow$ passcode `zxcv`), click **Reset Week Grid** (or trigger week advancement if testing across real week boundaries).
6. **Verify**:
   - [ ] The **target Pokémon silhouette** does NOT change to a different Pokémon; the unearned Pokémon carries over.
   - [ ] The **Weekly Reward dropdown** does NOT reset to placeholder `"Choose a Weekly Reward..."`; it remains set to your chosen reward.
   - [ ] The grid checkboxes reset cleanly for the fresh week of training.
   - [ ] The child's Badge Case (`🏅 Badges`) does NOT contain this Pokémon yet.

---

### Test Scenario 2: Historical Archive Verification (Past Week in History)
**Objective**: Confirm the past unearned week was archived accurately without losing historical record.

1. On the tracker header, click the **`<` (Previous Week)** navigation button to view the archived week.
2. **Verify**:
   - [ ] The historical week is in **Read-Only** mode (banner displayed).
   - [ ] The historical weekly badge shows as unearned / silhouette (or indicates incomplete).
   - [ ] The reward label on that archived week displays the reward that was targeted that week.
3. Click the **`>` (Next Week)** button to return to the active current week.
4. **Verify**:
   - [ ] The active week still has the carried-over badge silhouette and chosen reward.

---

### Test Scenario 3: Earning the Carried-Over Badge in the Subsequent Week
**Objective**: Verify that once the child succeeds in the new week, the carried-over badge is properly unlocked and collected, and the system transitions to a new badge and fresh reward selection for the following cycle.

1. In the current week (holding the carried-over badge and reward):
2. Complete all required task cells for the week until the **Weekly Milestone** celebration triggers:
   - Celebration sound plays.
   - Weekly reward container highlights with `.earned` status.
3. Advance to the next week by clicking **"Start New Training Week? 📅"** or **Reset Week Grid**.
4. **Verify**:
   - [ ] The carried-over badge is officially awarded with a celebration popup.
   - [ ] Click **🏅 Badges / Open Badge Case**: The carried-over Pokémon now appears in the badge collection grid!
   - [ ] A **brand new Pokémon silhouette** is now rolled and displayed for the upcoming week.
   - [ ] The **Weekly Reward dropdown** resets back to `"Choose a Weekly Reward..."` so the child can pick a new reward.
   - [ ] `Mega Milestone` counter increments by 1 week (e.g., Week 1 $\rightarrow$ Week 2 of 4).

---

### Test Scenario 4: Mid-Cycle Schedule Shift Rollover (`pendingWeekStartDate`)
**Objective**: Verify that changing the week start day mid-cycle preserves unearned badges and rewards when transitioning into the new schedule.

1. Open Admin Panel (`Admin 🔒` $\rightarrow$ passcode `zxcv`).
2. Change **Week Start Day** (e.g., from Sunday to Monday).
3. Notice the scheduled change notification card ("Current chart ends... New chart starts...").
4. With the weekly goal unearned, trigger the scheduled transition (or advance date to the shift start date).
5. **Verify**:
   - [ ] The new chart launches starting on the updated day of the week.
   - [ ] The unearned badge silhouette carries over intact.
   - [ ] The selected weekly reward carries over intact.
   - [ ] No badges are awarded, and no new badge is prematurely rolled.

---

### Test Scenario 5: Multi-Week Rollover Persistence
**Objective**: Ensure that if a child experiences multiple incomplete weeks in a row, the badge and reward continue carrying over indefinitely until earned.

1. Start with Badge A and Reward A.
2. Advance 1 week without completing tasks $\rightarrow$ verify Badge A and Reward A carry over.
3. Advance a second week without completing tasks $\rightarrow$ verify Badge A and Reward A STILL carry over.
4. **Verify**:
   - [ ] The pool does not leak badges.
   - [ ] The badge is not lost or replaced after multiple unearned cycles.

---

### Test Scenario 6: Manual Reset Within Same Week
**Objective**: Ensure resetting the current week manually does not erase the active badge or chosen reward.

1. Within the active week, select a reward.
2. Click **Reset Week Grid** (manual reset in same week).
3. **Verify**:
   - [ ] Grid checkboxes are cleared.
   - [ ] Chosen reward is still selected in the dropdown.
   - [ ] Active badge silhouette is unchanged.

---

## 🎯 4. Acceptance Criteria & Sign-Off Checklist

| Test Item | Expected Result | Pass / Fail |
| :--- | :--- | :---: |
| **Unearned Week Badge Rollover** | Active badge silhouette does not re-roll; carries over to next week. | `[ ]` |
| **Unearned Week Reward Rollover** | Weekly reward dropdown does not clear; carries over to next week. | `[ ]` |
| **Past Week Archive** | `weeklyHistory` records `weeklyClaimed: false` with correct badge & reward. | `[ ]` |
| **Subsequent Earning Flow** | Earning carried-over badge awards it to Badge Case, rolls next badge, and resets reward. | `[ ]` |
| **Mid-Cycle Schedule Shifts** | Shifting week start day retains unearned badge & reward. | `[ ]` |
| **Automated Test Suite** | All 72 tests in `tests.js` pass with 100% success rate (`node run_headless_tests.js`). | `[x]` |
