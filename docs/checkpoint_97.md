# CHECKPOINT 97

This document contains a complete, chronological record of user requests, system
configurations, version progress, and active schema definitions for the
application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **"Create an option in the big button view that allows me to hide the weekly and mega milestone rewards but KEEP the badges"** (owner, 2026-11-23). Assessed with the feature panel (one 3-choice control beat two switches; delta review of the revised PRD passed). Built as the **🎁 Rewards view** dropdown under Big Buttons: `🏆 Badges, Mega Milestones & Physical Rewards` / `🏅 Badges & Mega Milestones` / `⭐ Badges only` (names chosen by the owner). Owner decisions R1–R7 in [PRD §10.7](prd_simplified_chart_style.md):
  - Reduced views mean **no physical reward** ("if she wants one I'll turn on the rewards"); the motivational quote is hidden in both.
  - **Lyra and Alden both use ⭐ Badges only** (Lyra doesn't get the Mega card or Mega celebration). 🏅 stays available.
  - A picked reward is never dropped silently: the parent picks **Start next week** (default), **Switch now** or **Cancel**. A reward carried over from an unwon week is dropped when the pending view starts (owner pick "1A").
  - Past no-reward weeks show one line instead of empty pickers, **only in the 🏆 view** (owner, 2026-11-25, after VQA found it leaking into 🏅).
  - Commits `86c9c72`, `73c1a2e`, `dd89d57`, `0986fa4`; TC146 (new), TC134 (updated).
- [x] **"This modal is no longer accurate as past training history can be edited only for the last week"** (Change Week Start Day confirm). Copy now: *"Applying this change saves your current chart to history. You can still fix its check marks with ✏️ Fix last week, but the new start day can't be undone."* Commit `885ccc3`, TC64.
- [x] **"Give me a test plan in an .md file"** → [`test_plan_rewards_view.md`](test_plan_rewards_view.md) (`f7a8dbb`, listed in `_agents/AGENTS.md`).
- [x] **Reward system TL;DR** for a friend (chat only, no code).
- [x] **Wrap-up** (owner).
- [ ] **Owner VQA at `v323`** per [`test_plan_rewards_view.md`](test_plan_rewards_view.md), especially the stacked Rewards view row on a phone and the bottom panel with no pickers.
- [ ] **Prod rollout** (test plan §9): reload both tablets to `v323`; Alden already reads as ⭐ Badges only; set **Lyra → ⭐ Badges only** (Start next week if she has a reward picked).
- [ ] **Carried from CP96/CP95/CP93:** see [Checkpoint 96 §1](checkpoint_96.md).

### Known Follow-ups / Nice-to-haves

- [x] **README line on bonus balls was stale**: the "Goal Column Counts" bullet said a completed ✨ bonus "can make up a missed day". Fixed after the CP97 deploy at owner request (docs-only follow-up commit).
- [ ] **Older tablet builds** show rewards for a child on 🏅 Badges & Mega Milestones until they update (only ⭐ is mirrored to the legacy `hideMilestones` field). Harmless; reload tablets before switching a child.
- [ ] **Legacy past weeks with no reward saved** (e.g. Alden's weeks from before `rewardsView` existed) read "No rewards this week" in the 🏆 view; there's no record of which view they used.
- [ ] **Unwon carried-over reward + pending view (R6)** is only exercised automatically (TC146) or by applying a Change Week Start Day on a test child; a real Sunday rollover hasn't been watched yet.
- [ ] Carried: everything in [Checkpoint 96 Known Follow-ups](checkpoint_96.md).

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Production Branch**: `main`
*   **Target Audience**: Kepler (7yo), Lyra (5yo) & Alden (under 5)
*   **Current Version**: Service Worker cache **`poke-chart-cache-v323`**. Asset tags: `style.css?v=11.72`, `app.js?v=11.72` + all **16** importmap entries `?v=11.72`, `particles.js?v=10.8`. App label still `v1.8.0 (v58)`.
*   **Admin Password**: family Parent PIN at `users/{uid}.adminPassword` (legacy fallback `"zxcv"`). Never commit backup codes.
*   **Local Server URL**: `http://localhost:8000/` (or `http://crsjain.c.googlers.com:8000/`).
*   **Git Policy**: Committed to `prototype/pokemon-badge-collection`, merged to `main`. No mid-session pushes. Stage explicit paths.
*   **Test Suite**: **133 blocks, 132 unique numbers** (`dupes:12`; gaps 40, 43, 44; max **146**; TC116 reserved; next free **147**). `node run_headless_tests.js` ~37 s, ~3,920 asserts.

---

## 3. Active V19 State Schema

Unchanged from [Checkpoint 88 §3](checkpoint_88.md), plus three **optional** fields. **No schema bump or migration.**

```javascript
// Per child (optional; absent = defaults)
rewardsView: 'badges' | 'simple',          // absent = 'full'. Legacy hideMilestones: true reads as 'simple'.
hideMilestones: true,                       // still written, mirrored: true only when rewardsView === 'simple'
pendingRewardsView: 'full' | 'badges' | 'simple', // set by "Start next week"; applied at the next week archive

// weeklyHistory[weekStart] entries may now carry:
rewardsView: 'badges' | 'simple'            // written when the week ended with rewards hidden
```

`rewardsView` is in `WIPE_PRESERVED_KEYS`; `pendingRewardsView` is not.

---

## 4. Work Accomplished

### Rewards view: three choices under Big Buttons (PRD §10.7)
* **`state.js`**: `getRewardsView`, `setRewardsView` (mirrors `hideMilestones`), `rewardsHidden` (Big Buttons and not full), `REWARDS_VIEWS`; `milestonesHidden` now means Big Buttons + `'simple'`.
* **`app.js`**: `body[data-rewards]` beside `body[data-milestones]`; tick gate, claims and reward boxes keyed on `rewardsHidden()`; Mega celebration and "Week N" copy keyed on `milestonesHidden()`; unwon Start New Week copy drops "and reward" when rewards are hidden. `archivedRewardsViewField()` on all four archive paths and `applyPendingRewardsView()` after each (incl. the mid-week Change Week Start Day path); a pending view that hides rewards clears `reward`/`megaReward` (R6). Past weeks: `pastWeekNoRewardsNote()` → `.bottom-section[data-past-rewards]` + `#past-week-rewards-note`, only when rewards are shown. Admin refresh shows a pending value plus the status line.
* **`admin.js`**: `#admin-rewards-view-select` handler; confirm with **Start next week** / **Switch now** (third button) / **Cancel** (`backdrop: 'cancel'`), shown only when going from 🏆 to a reduced view with a reward picked.
* **`index.html`**: switch replaced by the dropdown (row id `#admin-milestones-row` kept, now `.adm-setting-row-stacked`), status line, `#past-week-rewards-note`.
* **`style.css`**: rewards/milestones hide rules split; stacked Admin row (dropdown full width at every size); past-week note styling; amber pending status.

### Change Week Start Day copy
* **`app.js`**: the Case B "⚠️ Permanent Schedule Change" text now points to ✏️ Fix last week. **`docs/prd_historical_weeks.md`** updated.

### Tests
* **TC146** (new): legacy mapping, dropdown, 🏅 main screen / no tick gate / week-4 Mega with no reward boxes or claims, archive records `rewardsView`, past-week note in 🏆 only (none in 🏅/⭐), confirm Cancel / Start next week / pending apply + carried reward dropped / Switch now, ⭐ hides Mega.
* **TC134**: drives the dropdown (`'simple'`) instead of the old switch. **TC64**: asserts the new copy.

---

## 5. Files and Code

### Created Files
* [`docs/checkpoint_97.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_97.md): this file.
* [`docs/test_plan_rewards_view.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/test_plan_rewards_view.md): manual test plan for the Rewards view and the copy fix.

### Edited Files
* [`state.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/state.js), [`app.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js), [`admin.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/admin.js), [`index.html`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html) (`?v=11.72`), [`style.css`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/style.css), [`service-worker.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js) (`v323`), [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js), [`README.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/README.md), [`docs/prd_simplified_chart_style.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_simplified_chart_style.md) (§10.7), [`docs/prd_historical_weeks.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_historical_weeks.md), [`_agents/AGENTS.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/_agents/AGENTS.md) (test plan list).

---

## 6. Validation Instructions

1. Reload to `v323` (Admin › Data › Reload latest version if stale).
2. Follow [`test_plan_rewards_view.md`](test_plan_rewards_view.md) on a test child on local staging (§1–§8), then the prod rollout in §9.
3. Quick prod check: Alden's Admin › Look & Feel shows **⭐ Badges only**; set Lyra to **⭐ Badges only**; Kepler is unchanged.
4. **Automated Suite**: run `node run_headless_tests.js`; verify 100% pass.
