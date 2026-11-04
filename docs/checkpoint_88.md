# CHECKPOINT 88

This document contains a complete, chronological record of user requests, system
configurations, version progress, and active schema definitions for the
application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **"Show milestones & rewards" switch for very young children** (owner, 2026-11-01 → built 2026-11-04). Ask: a chart setup for children under 5–6 (first user: **Alden**) where the `🔮 MEGA MILESTONE PROGRESS` card and the Milestone Reward Choices are not shown.
  - The 5-stage feature panel approved it with mitigations.
  - **Owner decisions** (PRD [`prd_simplified_chart_style.md`](prd_simplified_chart_style.md) §10):
    - D1: a switch under Big Buttons, not a third chart style. It's less code, and a tablet on an old build can't reset the child to Standard.
    - D2: no reward at all.
    - D3: Mega keeps counting in the background.
    - D4: the quote is hidden too.
    - D5: generic for any young child.
  - Help text changed to "For children under 6" at the owner's request.
  - Commits `e0b28a7` (PRD), `f8d81a3` (feature, TC134), `902b42b` (copy). Manual test plan: [`test_plan_show_milestones_switch.md`](test_plan_show_milestones_switch.md) (`8047d76`).
- [x] **Escape closes the "Who is training today?" picker, like the Parent PIN modal** (owner, 2026-11-04).
  - The PIN prompt turned out to have **no** Escape handling, so it was added too.
  - Escape works like the backdrop: the picker closes only when a child is active, and a layer opened from it (Add Child, PIN, confirm, notice) owns Escape first.
  - `c2dbd2c`, TC135.
- [x] **Goal column numerator counted rest days** (owner bug report with a screenshot: Math/Reading/Chinese read `7 / 6` with Friday on 💤).
  - Root cause: a cell ticked and *then* marked rest keeps `grid[key] = true`. The Goal numerator, `weekMeetsEveryGoal` and `getShortTasksThisWeek` counted it, but `getTaskRequiredDays` doesn't. That rest tick could also make up for a missed required day and win the badge.
  - Fix: one rule, `countsTowardGoal()` (`28abe1f`, TC136).
  - **Owner decision:** completed ✨ bonus ticks still count and can make up a missed day (`b66f297`).
- [ ] **Owner VQA** of the switch, using the test plan. Open question in §2 of the plan: in landscape the trainer and badge cards stretch taller to stay level with the chart. Keep that, or make them compact?
- [ ] **Rollout for Alden:** after deploy, reload both tablets to `v283`, *then* set Alden to Big Buttons and switch milestones off.
- [ ] **Carried:** owner manual test of CP87 (Week over); visual check of CP86; tablet check from CP85; VQA of CP84; prod acceptance of Kepler's Thursday star.

### Known Follow-ups / Nice-to-haves

- [ ] **Past weeks after the Goal fix:** a past unwon week that met its goal only through a ticked rest day now reads not complete (no more "✅ Goal completed retroactively!"). Badges and rewards already awarded are unchanged.
- [x] **CP87's "headless CDP scripts hang at `Page.navigate`" is explained:** scratch CDP scripts work once launched with the same Chrome flags as `run_headless_tests.js` (`--password-store=basic --use-mock-keychain --ignore-certificate-errors --allow-insecure-localhost --disable-features=HttpsUpgrades,NetworkChangeNotifier`). `tools/css_rig/capture.js` probably needs the same flags; not changed this session.
- [ ] Carried from CP87:
  - `activeDay` is shared across tablets.
  - Admin › Start a new week still opens the plain Reset confirm.
  - The "THIS WEEK'S BADGE" legacy fallback.
  - The Change Week Start Day consolidation edge.
  - Deferred style.css cleanup items.
  - Phone Big Buttons Vault is 50.5px.
  - `#vault-debug-panel` styling.
  - Goal column tight at ~1024px.
  - Unicorn Phase 1 gaps / Phase 2 companions.
  - Star shower ignores reduced motion.
  - §7 Phase 3 (V20, **TC116** reserved).
  - Kid-side inline styles.
  - `viewport-fit=cover`.

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Production Branch**: `main`
*   **Target Audience**: Kepler (7yo), Lyra (5yo) & Alden (under 5)
*   **Current Version**: Service Worker cache **`poke-chart-cache-v283`**. Asset tags: `style.css?v=11.41`, `app.js?v=11.41` + all 14 importmap entries `?v=11.41`, `particles.js?v=10.8`. App label still `v1.8.0 (v58)`.
*   **Admin Password**: family Parent PIN at `users/{uid}.adminPassword` (legacy fallback `"zxcv"`). Never commit backup codes.
*   **Local Server URL**: `http://localhost:8000/` (or `http://crsjain.c.googlers.com:8000/`).
*   **Git Policy**: Committed to `prototype/pokemon-badge-collection`, merged to `main`. No mid-session pushes. Stage explicit paths.
*   **Test Suite**: **123 blocks, 122 unique numbers** (`dupes:12`; gaps 40, 43, 44; max **136**; TC116 reserved; next free **137**). `node run_headless_tests.js` ~32–35 s.

---

## 3. Active V19 State Schema

Unchanged from [Checkpoint 82 §3](checkpoint_82.md), plus one **optional** per-child field:

```javascript
hideMilestones: true, // optional; absent = shown. Only applies when chartStyle === 'big-buttons'.
                      // Kept by WIPE_PRESERVED_KEYS. Read only via milestonesHidden(s) in state.js.
```

**No schema bump or migration.** The field is absent by default, diagnostics don't touch it, and old clients keep it (state merges with `Object.assign`).

---

## 4. Work Accomplished

### Show milestones & rewards switch
* **`state.js`**: `milestonesHidden(s)` (Big Buttons && `hideMilestones === true`); `hideMilestones` in `WIPE_PRESERVED_KEYS`.
* **`app.js`**:
  - `renderState` sets `body[data-milestones]` and calls `refreshMilestonesSwitch()`.
  - The reward tick gate is skipped while milestones are hidden.
  - `checkAndTriggerWeeklySuccess`: no claims, no reward boxes, never Mega; "completed all training goals this week!".
  - `openStartNewWeekConfirm`: no Mega-cycle copy ("Start a New Week"; "Your badge carries over").
* **`admin.js`**: `#admin-show-milestones-toggle` sets or deletes `state.hideMilestones`, re-renders and flashes Saved ✓.
* **`index.html`**: `#admin-milestones-row` (switch row) under Chart style, hidden unless Big Buttons.
* **`style.css`** (end of `@section big-buttons`):
  - Hides `.mega-milestone-card`, both reward containers and `.motivational-quote`.
  - Landscape: the chart spans only the trainer row (`grid-row: 2`).
  - Drops the footer divider (`body[data-theme][data-milestones="hidden"] .bottom-section .actions`).

### Escape key
* **`app.js`**: `dismissProfilePicker()` is shared by the backdrop and the window Escape handler, and skips while a layer opened from the picker is on top.
* **`admin.js`**: the document keydown handler cancels an open Parent PIN prompt on Escape and calls `stopPropagation()`, so the picker or Admin underneath stays open.

### Goal column counts
* **`state.js`**: `countsTowardGoal(task, dateStr)`: ticked, not 💤 rest, on the plan.
* **`app.js`**: `renderProgress` (Goal column), `weekMeetsEveryGoal`, `getShortTasksThisWeek` use it.

### Docs
* `prd_simplified_chart_style.md` v1.1.0 §10; `prd_rest_day_passes_and_bonus_tasks.md` (rest-tick rule + bonus decision); new `test_plan_show_milestones_switch.md` (listed in `_agents/AGENTS.md`); `README.md` (3 bullets).

### Tests
* **TC134**: switch visibility, hiding, no tick gate, week-4 win without rewards or Mega, Mega wraps, Standard ignores the field.
* **TC135**: Escape on the picker (active / boot / layers above) and on the PIN prompt (picker and Admin).
* **TC136**: ticked rest day → `6 / 6`, can't win the week; a completed bonus makes up a missed day.

---

## 5. Files and Code

### Created Files
* [`docs/test_plan_show_milestones_switch.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/test_plan_show_milestones_switch.md): manual test plan.
* [`docs/checkpoint_88.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_88.md): this file.

### Edited Files
* [`state.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/state.js), [`app.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js), [`admin.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/admin.js), [`index.html`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html), [`style.css`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/style.css), [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js), [`service-worker.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js) (`v283`).
* [`README.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/README.md), [`_agents/AGENTS.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/_agents/AGENTS.md), [`docs/prd_simplified_chart_style.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_simplified_chart_style.md), [`docs/prd_rest_day_passes_and_bonus_tasks.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_rest_day_passes_and_bonus_tasks.md).

---

## 6. Validation Instructions

1. **Switch:** follow [`test_plan_show_milestones_switch.md`](test_plan_show_milestones_switch.md) §1–7 on the local site, then §8 for the prod rollout.
2. **Escape:** Switch Trainer → Esc closes the picker. Parent Admin → Esc cancels the PIN. Switch Trainer → + Add Child → Esc cancels only the PIN.
3. **Goal column:** in Exception Mode, mark an already-ticked cell 💤 → the row reads `6 / 6`, not `7 / 6`.
4. If stale: Admin › Data › Reload latest version (`v283`).
5. **Automated Suite**: run `node run_headless_tests.js`; verify 100% pass.
