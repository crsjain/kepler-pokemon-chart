# CHECKPOINT 86

This document contains a complete, chronological record of user requests, system
configurations, version progress, and active schema definitions for the
application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **"Mega Milestone panel shows each past week as it was"** (owner, 2026-11-02). PRD: [`docs/prd_mega_milestone_past_weeks.md`](prd_mega_milestone_past_weeks.md).
  - **Ask:** on a past week, the 🔮 Mega card (counter + 4 slots) must show the card when that week finished. Example: 5 straight wins → 1, 2, 3, 4, then 1. The current week stays live. Both themes, both chart styles.
  - **Prod symptoms and causes:**
    - Kepler showed 0/4 on every week, and Lyra showed her live Latios + Flareon on every week. Cause: `renderProgress()` always drew the live cycle.
    - Lyra's "THIS WEEK'S BADGE" showed Flareon on both Jul 27 and Aug 3. Cause: before `29ae1b2` (2026-08-10), `resetWeekGrid` archived a won week **after** rolling the next badge.
  - **Phase 1** (`9578884`, TC132): `getMegaSlotsForWeek(weekStart)` rebuilds past weeks from `weeklyHistory`.
    - `megaWeeks` is the week's slot index, archived before the increment.
    - Earlier slots come from the cycle's earlier won weeks.
    - An entry with no `megaWeeks` inherits from the previous entry. If that's impossible, all slots are locked and the counter is hidden.
    - A won week with no `badgeId` shows "?".
    - The current week and the Mega pop-up are unchanged.
  - **Phase 2** (`456ecd7`, TC133): the immediate **Change Week Start Day** confirm on a won week now awards/rolls the badge, advances `megaWeeks` (resetting at 4) and clears `weeklyClaimed`/`reward`, like the scheduled path. Before, the win carried into the new chart and was archived twice.
  - **Phase 3** (owner data fix, no code): the owner chose this over a display-time repair. Restored in prod 2026-11-02 15:19Z and verified in the family code:
    - Kepler `weeklyHistory["2026-07-27"].badgeId` 135 → **155 Cyndaquil**.
    - Lyra `weeklyHistory["2026-07-27"].badgeId` 136 → **381 Latios**.
  - **Owner decisions Q1–Q7:** see PRD §5. Unwon weeks keep the existing UX ("The Pokémon Fled", own slot locked). The legacy fallback is infer, then lock. The prod family has **0** won weeks without `badgeId`. The pop-up is not touched.
- [ ] **Owner visual check** with the test plan (local restore of the family code, expected values per week for both kids, Phase 2 on Alden, post-deploy iPad check). The plan lives in the conversation folder `e4893aed-…/mega_past_weeks_test_plan.md`, not the repo.
- [ ] **Carried:**
  - Owner tablet check from CP85 (plan_style_css_cleanup §8).
  - VQA of CP84 items.
  - Prod acceptance of Kepler's Thursday star via Fix last week.

### Known Follow-ups / Nice-to-haves

- [ ] The "THIS WEEK'S BADGE" card still has its legacy earned-date fallback for weeks with no `badgeId`. It wasn't touched (out of scope); it isn't hit in prod data.
- [ ] Change Week Start Day "smart consolidation" (`recentAnchorKey`) branch: if the current week is won *and* folds into an earlier unclaimed micro-week, the win isn't archived as its own entry. This is rare and was left as is (PRD Phase 2 scope was the won-week carry-over).
- [ ] Carried from CP85:
  - Deferred style.css cleanup items (plan §5).
  - `prd_week_over_start_new_week.md` (approved, not implemented, **TC131** reserved).
  - Phone Big Buttons Vault 50.5px.
  - `#vault-debug-panel` styling.
  - Goal column tight at ~1024px.
  - Unicorn Phase 1 gaps / Phase 2 companions.
  - Star shower ignores reduced motion.
  - §7 Phase 3 (V20, **TC116** reserved).
  - Kid-side inline styles.
  - `viewport-fit=cover`.
- [x] Resolved: the "Mega slot '?' edge case" from CP85. Past weeks no longer index `collectedBadges`; "?" now appears only for a genuinely missing `badgeId`.

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Production Branch**: `main`
*   **Target Audience**: Kepler (7yo) & Lyra (5yo)
*   **Current Version**: Service Worker cache **`poke-chart-cache-v277`**. Asset tags: `style.css?v=11.38` (unchanged), `app.js?v=11.37` + all 14 importmap entries `?v=11.37`, `particles.js?v=10.8`. App label still `v1.8.0 (v58)`.
*   **Admin Password**: family Parent PIN at `users/{uid}.adminPassword` (legacy fallback `"zxcv"`). Never commit backup codes: they carry the PIN and the repo is public.
*   **Local Server URL**: `http://localhost:8000/` (or `http://crsjain.c.googlers.com:8000/`).
*   **Git Policy**: Committed to `prototype/pokemon-badge-collection`, merged to `main`. No mid-session pushes. Stage explicit paths.
*   **Test Suite**: **119 blocks, 118 unique numbers** (`dupes:12`; gaps 40, 43, 44; max **133**; TC116 and TC131 reserved; next free **134**). `node run_headless_tests.js` ~36 s.

---

## 3. Active V19 State Schema

Unchanged from [Checkpoint 82 §3](checkpoint_82.md). **No schema bump or migration this session.** The rebuild reads existing `weeklyHistory` fields only (`weeklyClaimed`, `badgeId`, `megaWeeks`).

---

## 4. Work Accomplished

### Mega Milestone card on past weeks (Phase 1)
* **`app.js`**: new `getMegaSlotsForWeek()` next to `getMegaSlotBadges()`.
  - `renderProgress()` uses it for `#mega-weeks-count` and the `.mega-slot`s.
  - It hides `.mega-counter-label` when the slot index is unknown.
  - `animate-pop` is applied only on the live week.
* **`tests.js`**: TC132 covers, in Pokémon/Standard and Unicorn/Big Buttons:
  - the 5-win example and the cycle reset;
  - an unwon retro-completed week;
  - a legacy entry (inferred slot, missing badge "?");
  - an unknown entry;
  - the live current week.

### Change Week Start Day on a won week (Phase 2)
* **`app.js`**: the "Change Week Start Day? 📅" confirm handler now counts a won week once (see §1).
* **`tests.js`**: TC133 covers week 3 won (slot advances, badge collected once, cut-short week's Mega card reads 3/4) and week 4 won (cycle reset).

### Docs
* **`docs/prd_mega_milestone_past_weeks.md`**: problem, data, rebuild rule, owner decisions, root causes, review panel, phases with status.
* **`_agents/AGENTS.md`**: reference-table row for the PRD.
* **`README.md`**: "Mega Milestone on Past Weeks" bullet.

---

## 5. Files and Code

### Created Files
* [`docs/prd_mega_milestone_past_weeks.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_mega_milestone_past_weeks.md): PRD.
* [`docs/checkpoint_86.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_86.md): this file.

### Edited Files
* [`app.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js): `getMegaSlotsForWeek`, `renderProgress` Mega block, Change Week Start Day won-week handling.
* [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js): TC132, TC133.
* [`index.html`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html): `app.js` + importmap `?v=11.37`.
* [`service-worker.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js): `poke-chart-cache-v277`.
* [`_agents/AGENTS.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/_agents/AGENTS.md), [`README.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/README.md).

---

## 6. Validation Instructions

1. **Past weeks** (after deploy, both kids). Prev through the weeks and compare:
   - **Kepler:** Jul 27 → 2/4 Greninja · Cyndaquil; Aug 3 → 3/4; Aug 10 (Rolled Forward) → 3/4; Aug 16 → 4/4 (+Gengar); Aug 23 → 0/4; Oct 18 → 4/4 Mawile · Gyarados · Umbreon · Lucario; Oct 25 → 0/4.
   - **Lyra:** Jul 27 → 1/4 Latios (badge card Latios); Aug 3 → 2/4 Latios · Flareon; later weeks → 2/4 with "The Pokémon Fled".
2. **Current week**: unchanged (Kepler 0/4, Lyra 2/4).
3. If stale: Admin › Data › Reload latest version (`v277`).
4. **Automated Suite**: run `node run_headless_tests.js`; verify 100% pass.
