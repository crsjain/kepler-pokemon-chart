# CHECKPOINT 95

This document contains a complete, chronological record of user requests, system
configurations, version progress, and active schema definitions for the
application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **"I don't want bonus balls to be counted in the numerator, so that only weeks with 7 stars will receive a weekly milestone"** (screenshot: Nov 8–14, Writing read `4 / 1 ✅` with the only required day, Saturday, missed, so the week was won with 6 🌟 + ❌). This reverses the 2026-11-04 decision ("keep them as a way to make up a day"). Owner decisions 2026-11-16:
  - Applies from **2026-11-15** (this week) on; past weeks keep the old math so Nov 8–14 still reads `4 / 1 ✅` beside the badge it won.
  - The Goal cell shows required ticks only (e.g. `0 / 1`), no `+N` bonus count.
  - 💤 rest days still lower the goal (a week with one rest day is won with 6 🌟 + 💤).
  - Commit `2ced7c5`, TC145.
- [ ] **Owner check after reloading to `v318`**: on this week's chart, a row whose only missing day is required but with completed bonus balls reads `N / M` without ✅ and the badge isn't awarded; ticking the required day wins it.
- [ ] **Carried from CP94:** iPad check at `v317` (icon picker landscape/portrait, search, paste, single shop pop); CP93 tablet check at `v313`; CP92 tablet check at `v300`; CP91 phone checks; CP90 phone/tablet checks; CP88 milestones/Alden VQA; CP87 Week over manual test; CP86 visual check; CP85 tablet check; CP84 VQA; Kepler's Thursday star acceptance.

### Known Follow-ups / Nice-to-haves

- [ ] **The cutoff is per date, not per week.** `countsTowardGoal` compares each tick's date to `2026-11-15`. With the Sunday week start that lines up with a week boundary; if a child's week start day is changed to straddle Nov 15, that one week would mix both rules. Harmless after this week.
- [ ] **Parents can still excuse a missed day after the fact** by cycling it to ✨ or 💤 in Exception Mode (that removes it from the denominator). This is intended parent discretion, not a loophole for kids.
- [ ] **TC133 flaked once** at the CP94 wrap-up; it passed in every full run this session. Keep watching for a wall-clock or ordering dependency.
- [ ] Carried from CP94: single Chinese characters (福) can't be icons; search data is English-only; Emoji ≤ 14 cap; dialog fit checked by screenshot only; no skin-tone variants from search; plus the CP93 list.

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Production Branch**: `main`
*   **Target Audience**: Kepler (7yo), Lyra (5yo) & Alden (under 5)
*   **Current Version**: Service Worker cache **`poke-chart-cache-v318`**. Asset tags: `style.css?v=11.67`, `app.js?v=11.67` + all **16** importmap entries `?v=11.67`, `particles.js?v=10.8`. App label still `v1.8.0 (v58)`.
*   **Admin Password**: family Parent PIN at `users/{uid}.adminPassword` (legacy fallback `"zxcv"`). Never commit backup codes.
*   **Local Server URL**: `http://localhost:8000/` (or `http://crsjain.c.googlers.com:8000/`).
*   **Git Policy**: Committed to `prototype/pokemon-badge-collection`, merged to `main`. No mid-session pushes. Stage explicit paths.
*   **Test Suite**: **132 blocks, 131 unique numbers** (`dupes:12`; gaps 40, 43, 44; max **145**; TC116 reserved; next free **146**). `node run_headless_tests.js` ~36 s, ~3,880 asserts.

---

## 3. Active V19 State Schema

Unchanged from [Checkpoint 88 §3](checkpoint_88.md). **No schema bump or migration**: the new rule is a date cutoff in code, not stored state.

---

## 4. Work Accomplished

### Bonus balls no longer make up a missed day
* **`state.js`**: `countsTowardGoal(task, dateStr)` returns `false` for a ✨ bonus tick dated on/after `DEFAULT_BONUS_NO_MAKEUP_START` (`'2026-11-15'`). Test hook `setBonusNoMakeupStartMock(dateStr | null)`. Because the Goal column (`renderProgress`), the weekly win (`weekMeetsEveryGoal`) and "still needs N more checks" (`getShortTasksThisWeek`) all use this one function, they change together. Bonus days were already excluded from the denominator (`getTaskRequiredDays`), so the week is won only when every required day is ticked. Daily stars, +10 XP, Great Ball / crown and "Super Trainer!" are unchanged.
* **`docs/prd_rest_day_passes_and_bonus_tasks.md`** §2.1 rule 2 and **`README.md`** (Elective Bonus Tasks bullet) record the reversal.

### Tests
* **TC145** (new): the screenshot scenario (Sun–Fri bonus with 4 done, Saturday required and missed) reads `0 / 1` and doesn't win; ticking Saturday → `1 / 1 ✅`; Saturday as 💤 → `0 / 0 ✅`.
* **TC136**: the bonus make-up assertion now runs with the cutoff mocked to `9999-12-31` (the pre-cutoff rule).

---

## 5. Files and Code

### Created Files
* [`docs/checkpoint_95.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_95.md): this file.

### Edited Files
* [`state.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/state.js), [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js), [`index.html`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html) (`?v=11.67`), [`service-worker.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js) (`v318`), [`README.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/README.md), [`docs/prd_rest_day_passes_and_bonus_tasks.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_rest_day_passes_and_bonus_tasks.md).

---

## 6. Validation Instructions

1. Reload to `v318` (Admin › Data › Reload latest version if stale).
2. **Last week (Nov 8–14)**: Prev → Writing still reads `4 / 1 ✅` and the badge is unchanged.
3. **This week**: for an activity with a ✨ bonus day, complete the bonus but leave a required day unticked → its Goal reads e.g. `0 / 1` with no ✅, and the weekly badge isn't awarded. Tick the required day → `1 / 1 ✅`.
4. A 💤 rest day still lowers that activity's goal.
5. **Automated Suite**: run `node run_headless_tests.js`; verify 100% pass.
