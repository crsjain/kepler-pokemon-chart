# Manual Test Plan: Badge Retraction, Calm Setback Notices & Fix Last Week

**Covers commits:** `ecce894` (badge retraction), `dca2241` (calm notices), `20926bf` (Fix last week)
**Build:** cache `poke-chart-cache-v217`, modules `?v=10.89`, `style.css?v=11.00`
**Specs:** [`prd_parent_edit_last_week.md`](prd_parent_edit_last_week.md), [`_agents/rules/ux-guidelines.md`](../_agents/rules/ux-guidelines.md) Rule 11 (tonal matching) and Rule 17 (floating dock)
**Automated coverage:** TC117 and TC118 in `tests.js` (`node run_headless_tests.js`)

---

## 0. Setup

| Where | How |
| :--- | :--- |
| **Local (staging)** | `python3 -m http.server 8000` and `./run_emulator.sh`, then open `http://localhost:8000/`. Sign in as `crsjain+staging@gmail.com` / `food3333`. Parent PIN: `zxcv`, or the family PIN if one is set. |
| **Prod** | `https://crsjain.github.io/kepler-pokemon-chart/`, after the wrap-up deploy. Hard-refresh once. |

- [ ] **Cache check:** DevTools › Application › Cache Storage shows `poke-chart-cache-v217`.
- [ ] **Test child:** use a throwaway child, or export a backup code first (Admin › 💾 Data). Section 1 ticks a full week.
- [ ] **Debug helpers (local only):** Admin › 💾 Data › **Advanced** › **Debug Sidebar** switch. In the sidebar, check **Future Edits** to tick future days and start a new week early. It resets on page reload, so re-check it after refreshing.
- [ ] **Rewards chosen:** pick a Weekly and a Mega reward first, or ticking is blocked.

---

## 1. Badge retraction (bug fix)

**Goal:** unticking after a weekly success takes the badge back, so Reset can't archive the week as won.

1. With **Future Edits** on, tick every required activity for the whole week.
   - [ ] **🎉 WEEKLY SUCCESS!** appears with the week's badge.
   - [ ] Close it and choose **Not Yet** on "Start New Training Week?".
   - [ ] The weekly badge slot shows the badge in color. Badge Case (🏆) lists it.
2. Untick **one** required pokeball (e.g. Thursday Math Practice).
   - [ ] The badge slot goes back to a locked silhouette.
   - [ ] Badge Case no longer lists this week's badge.
   - [ ] Admin › Rewards › claimed-rewards history no longer lists this week's weekly reward entry.
   - [ ] The **Reset / Start new week** button is disabled again (unless Future Edits is on).
3. Re-tick the same pokeball.
   - [ ] **🎉 WEEKLY SUCCESS!** fires again, and the badge returns exactly once (no duplicate in Badge Case).
4. **Earlier copy survives** (optional, local): use debug **Add Rand** until the case holds an older copy of the current target badge, then repeat steps 1–2.
   - [ ] The older copy stays in Badge Case after the untick.

---

## 2. Calm setback notices

### 2.1 "BADGE LOCKED AGAIN"
At step 1.2 above, a notice should appear:
- [ ] Title **🔒 BADGE LOCKED AGAIN**. No 😢 and no "Oh no".
- [ ] Body names the activity that's now short: *"Math Practice still needs one more check this week. Finish all your goals to win the <Badge> Badge and your reward!"*
- [ ] The badge image is **greyed out** (grayscale, faded), not full color.
- [ ] Button reads **"I'll win it back! 💪"** in the neutral blue style (not celebratory yellow), and the 💪 doesn't wrap onto its own line.
- [ ] No confetti, no fanfare sound.
- [ ] Only **one** modal is open.

### 2.2 Devolve notice
1. Bring the active partner to exactly an evolution level with 0–4 XP (e.g. Pikachu → Raichu at L10). Use debug level tools, or tick until it evolves.
2. Untick one pokeball so the level drops below the evolution level.
   - [ ] Title **🔄 TIME TO TRAIN** (was "😢 POKÉMON DEVOLVED 😢").
   - [ ] Body: *"<Child>'s <Raichu> went back to <Pikachu> for now. Earn more XP to evolve again!"* No "Oh no".
   - [ ] Button **"Let's get it back! 🚀"**, neutral style.

### 2.3 Both at once: only one modal
1. Set up both conditions: the week is won (section 1, step 1), and the partner is at an evolution level with < 20 XP.
2. Untick a pokeball that both drops the week below its goals and causes a devolve.
   - [ ] Only **🔒 BADGE LOCKED AGAIN** appears, with no stacked **🔄 TIME TO TRAIN** behind it.
   - [ ] The partner still devolved (check the trainer card sprite and level).

---

## 3. Fix last week

**Preparing an archived week (local):** with Future Edits on, win a week (section 1, step 1) and tap **Let's Go! 🚀** on "Start New Training Week?". The previous week is now archived. Untick nothing yet.

### 3.1 Admin entry point and copy
1. Open **⚙️ Admin** › **🗓️ Settings**.
   - [ ] A **Fix last week** row sits under "Tonight's exceptions".
   - [ ] The button names the dates, e.g. **"✏️ Fix Oct 11 - 17"** (no year, no comma).
   - [ ] Help text: *"…Only the most recent week can be fixed — older weeks stay locked so their stars and badges are settled."*
   - [ ] On tablet and phone widths the row stacks cleanly, with no clipped button text.
2. **No archived week:** switch to a brand-new child (or use the Add-a-child flow).
   - [ ] The button is disabled, labelled **"✏️ Fix last week"**, and the help says *"Available after your first week is reset."*

### 3.2 Entering edit mode
Tap **✏️ Fix …**:
- [ ] Admin closes. The grid shows last week's dates in the header range.
- [ ] Editable cells have a soft **amber** tint at full opacity. Rest 💤 and hatched cells don't.
- [ ] A bottom dock shows **✏️ EDITING LAST WEEK** (coral, uppercase, not button-like), a countdown timer, the note *"Stars & XP update · badges don't change"*, and **Done ✅** as the only button.
- [ ] **◀ Prev** and **Next ▶** are disabled. Hovering shows *"Only last week can be fixed"*.
- [ ] The dock doesn't cover the bottom of the page (the grid can scroll clear of it).
- [ ] The top mini-HUD is unaffected.

### 3.3 Ticking and unticking
1. Pick a day with exactly one required activity missing. Tap that pokeball.
   - [ ] Check sound, then the XP float **+20 XP! 🎉** and a day-complete burst.
   - [ ] That day's Daily Total changes ❌ → 🌟.
   - [ ] Partner XP bar goes up by 20 (a level-up celebration is fine if it crosses 100).
   - [ ] **No** weekly-success modal, no "BADGE LOCKED AGAIN", and the badge slot/Badge Case doesn't change.
   - [ ] Open **Star Vault**: that date now has a star, and the streak continues through it (rest days bridge it).
2. Tap the same pokeball again (untick).
   - [ ] 🌟 → ❌, partner XP goes down by 20, and the Vault star is removed.
   - [ ] If the XP loss causes a devolve, **🔄 TIME TO TRAIN** appears (calm copy).
3. Tick a ✨ bonus cell.
   - [ ] **+10 XP (Bonus!)**, and the Great Ball shows.
4. Tap a 💤 rest cell.
   - [ ] Nothing happens.

### 3.4 "Week now meets every goal" heads-up
Setup: an archived week saved as **not won** that's one tick from meeting every goal. To create one locally, archive a week by changing the start day (Admin › Settings › week start, "Case B" immediate shift) while one activity is short, then reopen Fix last week.
- [ ] Tick the last missing pokeball. The dock note turns gold: *"Last week now meets every goal 🎉 — badges don't update; give the reward in person."*
- [ ] No badge is added, the Mega Milestone count doesn't change, and no weekly-success modal opens.
- [ ] Untick it. The note returns to *"Stars & XP update · badges don't change"*.

### 3.5 Ways the mode ends
For each, re-enter Fix last week first:
- [ ] **Done ✅:** the dock hides, the grid returns to the current week, and Prev/Next work again.
- [ ] **Timer runs out** (set Admin › Settings › Parent edit window to **1 min** and wait): you're returned to the current week, and **Edit Window Closed 🔒** appears with *"Parent edit window ended. Back to this week!"*
- [ ] **Open ⚙️ Admin** during the mode: the mode ends, and closing Admin shows the current week.
- [ ] **Switch Trainer** to another child: the mode ends. The other child's chart isn't editable, and no dock is shown.
- [ ] **Refresh the page:** the mode is gone (it isn't saved).

### 3.6 Kids can't edit past weeks
After the mode ends:
- [ ] Use **◀ Prev** to view last week. Tapping pokeballs does nothing (cells are dimmed, inputs disabled).
- [ ] View the week before last. It's read-only, and there's no way to start Fix last week for it.
- [ ] With **🔒 Approve past days** on (Lyra), the current week's past-day PIN flow still works as before.

---

## 4. Regression spot checks

- [ ] Normal tick and untick in the current week: XP floats, Daily Total stars, sounds unchanged.
- [ ] **Set Exceptions** (Exception Mode) still opens its own dock with Done ✅. It doesn't fight the Fix last week dock.
- [ ] Past-day approval (Lyra): the PIN keypad → **🗝️ Parent Edit Active** dock with **Lock Now 🔒** (red), not the last-week labels.
- [ ] A normal end-of-week reset still archives correctly, and the badge carries over when the week wasn't won.
- [ ] `node run_headless_tests.js` is 100% green.

---

## 5. Prod acceptance: Kepler's Thursday star

After deploying:
1. Select **Kepler**, then **⚙️ Admin** › **🗓️ Settings** › **✏️ Fix Oct 11 - 17**.
2. Tap **Thursday's Math Practice** pokeball.
   - [ ] **+20 XP! 🎉**, and Thursday's Daily Total ❌ → 🌟.
   - [ ] The Umbreon badge for that week is unchanged.
3. Tap **Done ✅**.
4. Open **Star Vault**.
   - [ ] The streak runs Wed 10/14 → Thu 10/15 → Fri 10/16 with no break. Sat 10/17 💤 bridges it, and the current week continues the count.
