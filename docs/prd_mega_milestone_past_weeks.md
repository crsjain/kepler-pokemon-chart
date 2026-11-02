# PRD: Mega Milestone Panel Shows Each Past Week As It Was

**Document**: `docs/prd_mega_milestone_past_weeks.md`
**Version**: 1.0.0
**Status**: Phases 1–2 implemented locally 2026-11-02 (`9578884`, `456ecd7`; cache v277, modules 11.37), awaiting owner review. Phase 3 (data fix) waiting on the owner.
**Authors**: crsjain & Jetski
**Target Systems**: `app.js`, `tests.js`. **No schema change** (stays V19). No CSS change expected.
**Companion docs**: [`prd_badge_collection.md`](prd_badge_collection.md) (weekly badge + Mega cycle), [`prd_historical_weeks.md`](prd_historical_weeks.md) / [`plan_historical_weeks.md`](plan_historical_weeks.md) (week intervals, start-day changes, "Rolled forward"), [`prd_parent_edit_last_week.md`](prd_parent_edit_last_week.md) (Fix last week freezes badges and Mega), [`_agents/rules/ux-guidelines.md`](../_agents/rules/ux-guidelines.md).
**Reserved tests**: **TC132** (Phase 1), **TC133** (Phase 2).

---

## 1. Problem

When a child pages back to a past week, the 🔮 **MEGA MILESTONE PROGRESS** card (counter `N / 4 Weeks` and the four slots) always shows the **current** cycle. `renderProgress()` fills it from `state.megaWeeks`, `state.weeklyClaimed` and `getMegaSlotBadges()`, whichever week is on screen.

**Prod symptoms (owner, 2026-11-02):**
- **Kepler** shows 0/4 and no badges on every week, including Oct 18–24, when he won Lucario (his 4th badge of that cycle, so the live cycle had just reset).
- **Lyra** shows Latios + Flareon (2/4, her live cycle) on every week.
- **Lyra** also shows Flareon in "THIS WEEK'S BADGE" for both Jul 27–Aug 2 and Aug 3–9. This is a separate data problem (§6, Phase 3).

## 2. Goal and non-goals

**Goal:** a past week's Mega card shows the card **as it stood when that week finished**. Example, 5 won weeks in a row: week 1 → 1 badge, week 2 → 2, week 3 → 3, week 4 → 4 (Mega complete), week 5 → 1 (new cycle). The counter matches. Works in both themes (Pokémon / Unicorn) and both chart styles (Standard / Big Buttons), since they share the same card.

**Non-goals**
- The **current week** keeps today's live behaviour, byte for byte (`getMegaSlotBadges()`).
- The **Mega Milestone pop-up** (`showCustomNotification(..., isMega)`) is not touched. It only opens on a live win and keeps using `getMegaSlotBadges()`.
- No change to badges, rewards, XP, `megaWeeks` or any stored data in Phase 1. Display only.
- "THIS WEEK'S BADGE" card logic is unchanged (including its legacy earned-date fallback).

## 3. Data available (verified 2026-11-02)

Each `weeklyHistory[weekStart]` entry holds `weekStartDay, reward, megaReward, weeklyClaimed, badgeId, xpEarned, megaWeeks`. Every archive path (`resetWeekGrid` claimed / unclaimed-old-week / pending start-day branches, and the Change Week Start Day confirm) stores `megaWeeks` **before** the increment/reset. So `megaWeeks` is **that week's slot index (0–3)**: the slot it filled if won, or the slot that stayed locked if not. V18 back-filled `megaWeeks` for won weeks only.

Only weeks with a history key (plus the current week) are navigable, so skipped calendar weeks never appear and need no handling.

**Owner's prod family (backup 2026-11-02):** 0 won weeks without `badgeId`, 0 entries without `megaWeeks`. Two entries carry the wrong badge (§6).

## 4. Rebuild rule (Phase 1)

For a past week **W** with slot `s`:

1. **Slot index.** One forward pass over history in date order. An entry with a valid `megaWeeks` (integer 0–3) uses it. An entry without one inherits from the previous entry: `(m + 1) % 4` after a won week, `m` after an unwon week. If there is no earlier entry to inherit from, W is **unknown** (rule 5).
2. **Earlier slots `0 … s-1`.** Walk the won weeks before W, newest first. Each must have the expected slot (`s-1`, then `s-2`, …). Its `badgeId` fills that slot. The walk stops at the first won week whose slot doesn't match, which is the previous cycle. A slot that the index says was won but whose badge can't be found shows the existing **"?"** placeholder.
3. **W's own slot `s`.** Filled with W's `badgeId` if W was won (`weeklyClaimed`), otherwise locked. A won week without `badgeId` shows "?".
4. **Counter.** `s + 1` if W was won, else `s`.
5. **Unknown slot index** (owner fallback, Q3b): all four slots locked and the counter label hidden.
6. **Slot colours** stay positional (`badge-theme-1…4`), as today. Past weeks never get the `animate-pop` class.

**Prod simulation** (rule applied to the owner's backup, before the Phase 3 data fix):
- Kepler: Jul 6 → 1/4 · Jul 27 → 2/4 · Aug 3 → 3/4 · Aug 10 (cut short, unwon) → 3/4 · Aug 16 → 4/4 · Aug 23 → 0/4 · Aug 30 → Sep 20 → 1 … 4 · Sep 27 → Oct 18 → 1 … 4 (Lucario) · Oct 25 → 0/4.
- Lyra: Jul 27 → 1/4 · Aug 3 → 2/4 · every later week → 2/4.

## 5. Owner decisions (2026-11-02)

| # | Question | Decision |
| :--- | :--- | :--- |
| Q1 | Rebuild from history? | Yes, display only, no schema change. |
| Q2 | Unwon past week | Keep the existing UX: "THIS WEEK'S BADGE" shows the fled silhouette ("🏃 The Pokémon Fled!"), and the Mega card shows the cycle's earlier badges with this week's slot locked. No new badge is added. |
| Q3 | Legacy week with no `megaWeeks` | (a) infer it from earlier history (§4 rule 1); (b) fallback: all slots locked, counter hidden. |
| Q4 | Won week with no `badgeId` | Count them first. Result: **0** in the prod family. The rule shows "?" (existing placeholder). The Mega card does not use the earned-date fallback. |
| Q5 | Duplicate badge in history (Lyra) | Root cause found (§6). Show Latios then Flareon, via a one-time **data fix** (Phase 3, owner's choice over a display-time code repair). Fix the Change Week Start Day bug as Phase 2. |
| Q6 | Week cut short by a start-day change | Treat like any past week (its own slot and won flag). Docs check: `plan_historical_weeks.md` §2.3/§4.1 say an unwon cut-short week shows "Rolled forward to new chart" and `megaWeeks` is not advanced. No doc says a won cut-short week loses its badge. |
| Q7 | Mega pop-up | Not changed (non-goal). |
| — | Retro-completed weeks ("Goal completed retroactively") | Already excluded: they stay `weeklyClaimed: false`, so they never fill a slot (consistent with the 2026-10-22 decision). |
| — | Fix last week | Already safe: it never changes `weeklyClaimed` / `megaWeeks` / `badgeId`, so the card can't move. |
| — | All-rest week | Never won (`weekMeetsEveryGoal` excludes it), so it behaves like an unwon week. |

## 6. Root cause of Lyra's duplicate badge

Before commit `29ae1b2` (2026-08-10), `resetWeekGrid` archived a won week **after** `rollNewWeeklyBadge()`, so the history entry recorded the **next** week's badge. The fix landed on Aug 10, but two entries archived before then are still wrong:

| Child | Week | History says | Truly earned (badge list order + reward claim dates) |
| :--- | :--- | :--- | :--- |
| Lyra | 2026-07-27 | Flareon (136) | **Latios (381)**, earned 2026-08-04 |
| Kepler | 2026-07-27 | Jolteon (135) | **Cyndaquil (155)**, earned 2026-08-03 |

A second, still-live bug was found during research: the **Change Week Start Day** confirm (immediate change, `app.js` "Change Week Start Day? 📅" handler) archives the current week but doesn't award/roll the badge, advance `megaWeeks`, or clear `weeklyClaimed`/`reward`. A won week therefore carries into the new chart already won with the same badge, and the next reset archives that badge a second time. The *scheduled* start-day path in `resetWeekGrid` (`pendingWeekStartDate`) already handles this correctly.

## 7. Review panel (feature-review-panel, 2026-11-02)

**Verdict: APPROVED WITH MITIGATIONS.**

- 🧸 **Child (PASS).** Seeing the badges *he had then* reinforces pride. Today's "0/4 everywhere" erases Lucario. Unwon weeks stay calm: locked Poké Ball slots, no ❌, no new copy. The 3-second scan is unchanged: same card, same slots.
- 🎮 **Economy (PASS).** Display only. No XP, badge, reward or `megaWeeks` change. Retro-completed weeks stay excluded, so no back door into the Mega cycle.
- 🏡 **Parent (PASS).** No setup. The one-off data fix is a backup-code round trip done once by the parent (Phase 3).
- 🎨 **UX (PASS).** Reuses the existing slot markup and theme classes; zero new CSS, zero inline styles. Past weeks drop the pop animation so paging doesn't flash.
- 🛠️ **Eng (PASS with mitigations).** One pure helper, `getMegaSlotsForWeek(weekStart)`. The current week delegates to `getMegaSlotBadges()`, so the live card and pop-up are byte-identical. Mitigations: guard non-integer / out-of-range `megaWeeks`; never read `collectedBadges` order for past weeks (it's unreliable across cycles); TC132 seeds history directly and asserts DOM per week in both themes and chart styles.

## 8. Phases

### Phase 1: past-week Mega card (TC132)
- [x] `getMegaSlotsForWeek(weekStart)` in `app.js` (§4). `renderProgress()` uses it for the counter and slots.
- [x] Current week unchanged (delegates to `getMegaSlotBadges()`); pop-up untouched.
- [x] TC132: 5-week example (1, 2, 3, 4, then 1), an unwon week (earlier badges, own slot locked, counter = slots filled), the cycle reset, a legacy week with no `megaWeeks` (inferred), an unknown week (locked + counter hidden), a won week without `badgeId` ("?"), a retro-completed week (no slot), current week still live; Unicorn theme and Big Buttons.
- [x] Cache bump per AGENTS.md §6.1 (SW `CACHE_NAME`, `app.js?v=` + every importmap entry).
- [x] Full suite green.
- [x] Before/after screenshots of past weeks for both kids (local copy of the owner's history, real sprites; scratch only, not in the repo).

### Phase 2: Change Week Start Day keeps a won week won once (TC133)
- [x] In the immediate Change Week Start Day confirm: if the current week is won, award the badge if not yet collected, archive (unchanged), then roll a new badge, advance `megaWeeks` (reset to 0 and clear `megaReward` at 4), and clear `weeklyClaimed` and `reward`, mirroring the scheduled path in `resetWeekGrid`.
- [x] Unwon weeks unchanged: `megaWeeks` preserved, badge rolls forward ("Rolled forward to new chart").
- [x] TC133 covers won and unwon cases.
- [x] Full suite green.

### Phase 3: one-time data fix for the two Jul 27 entries (owner, no code)
- [x] Jetski provides a local patcher (scratch, outside the repo; backup codes contain the family PIN and the repo is public). It sets `weeklyHistory["2026-07-27"].badgeId` to 381 for Lyra and 155 for Kepler, only if the entry still holds 136 / 135.
- [ ] Owner, per child, just before restoring: Admin › Data › Copy backup code → patch → Restore from code (with that child active, before the kids tick anything).
- [ ] Owner verifies Jul 27 and Aug 3 for both kids after deploy.
