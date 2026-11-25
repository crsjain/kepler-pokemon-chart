# Manual Test Plan: Rewards view (3 choices) + Change Week Start Day copy

**Covers commits:** `86c9c72` (PRD §10.7), `73c1a2e` (Rewards view), `885ccc3` (Change Week Start Day copy)
**Build:** cache `poke-chart-cache-v323`, all modules + `style.css` `?v=11.72`, `particles.js?v=10.8`
**Spec:** [`prd_simplified_chart_style.md`](prd_simplified_chart_style.md) §10.7 (owner decisions R1–R7); [`prd_historical_weeks.md`](prd_historical_weeks.md) (Permanent Notice)
**Automated coverage:** `TC146` (new), `TC134` (updated for the dropdown), `TC64` (modal copy). Run `node run_headless_tests.js 64,134,146`, then the full suite.
**Supersedes:** §1 of [`test_plan_show_milestones_switch.md`](test_plan_show_milestones_switch.md) (the switch is now a dropdown). The rest of that plan still applies to **⭐ Badges only**.

> [!CAUTION]
> **Switch now** clears the child's picked rewards, and **Change Week Start Day** can't be undone. Run §4–§6 and §8 on a **test child on local staging**, never on Kepler, Lyra or Alden in prod.

---

## 0. Setup

| Where | How |
| :--- | :--- |
| **Local (staging)** | `python3 -m http.server 8000` → `http://crsjain.c.googlers.com:8000/`. Emulator login `crsjain+staging@gmail.com`. Local Parent PIN. |
| **Prod** | `https://crsjain.github.io/kepler-pokemon-chart/`, after the wrap-up deploy (§9 only). |

- [ ] **Cache check:** hard-refresh. Admin › 💾 Data shows the new version, or DevTools › Application › Cache Storage shows `poke-chart-cache-v323`.
- [ ] **Test child:** create or pick a test child, set **🧸 Chart style = Big Buttons**. Note their Mega count (`N / 4 Weeks`).
- [ ] **Debug Sidebar:** Admin › 💾 Data › Advanced › **Debug Sidebar** on. You'll use **Future Edits** and **Mega cycle week**.

---

## 1. Admin dropdown

Open **🔒 Admin › 🗓️ Settings › Look & Feel**.

1. **Chart style = Standard:**
   - [ ] There's **no** "🎁 Rewards view" row (hidden, not greyed out).
2. **Chart style = Big Buttons:**
   - [ ] The **🎁 Rewards view** row appears directly under Chart style, with help text *"\"Badges & Mega Milestones\" skips picking physical rewards each week. \"Badges only\" also hides the Mega Milestone card, for younger children. …"*
   - [ ] The row is **stacked** at every width: label and help on top, the dropdown full width below, so the long option names are never clipped.
   - [ ] The dropdown has exactly three choices: **🏆 Badges, Mega Milestones & Physical Rewards**, **🏅 Badges & Mega Milestones**, **⭐ Badges only**, and starts on **🏆 Badges, Mega Milestones & Physical Rewards**.
   - [ ] No option text is clipped in the dropdown.
3. **Phone width (portrait phone or DevTools ≤ 430px):**
   - [ ] The row wraps cleanly (label/help above, dropdown full width or below). Nothing overflows or overlaps.
4. **Alden (legacy setting):** switch to a child who had the old milestones switch **off** (Alden on local, if present):
   - [ ] The dropdown shows **⭐ Badges only** with no action needed, and his main screen looks exactly as before.

---

## 2. 🏅 Badges & Mega Milestones (no physical rewards)

With **no** rewards picked, choose **🏅 Badges & Mega Milestones**.

- [ ] No confirm dialog opens; an inline **Saved ✓** flashes.

Close Admin. Check **both themes** (Pokémon, then Unicorn) and **landscape + portrait** tablet.

- [ ] **Still visible:** trainer card + XP, **THIS WEEK'S BADGE** card + 🏆 Case, **MEGA MILESTONE PROGRESS** card, the star ribbon, Vault and task cards.
- [ ] **Gone:** both reward pickers (🏆 Weekly / 💥 Mega Milestone Reward Choice) and the motivational quote.
- [ ] The footer shows only version + Switch Trainer + Parent Admin, with **no divider line** above them.
- [ ] 16px gaps between panels; no empty band where the pickers were; the left column and chart line up (landscape).

### 2.1 Ticking
- [ ] Tap a card's ball/heart: it catches straight away, XP floats up, and there's **no** "⚠️ ATTENTION, TRAINER! … Choose your Weekly Reward and Mega Reward first" pop-up.

### 2.2 Winning a normal week
Turn on **Future Edits**; Mega count below 3 (e.g. `1 / 4`). Tick every required activity for the week.
- [ ] **🎉 WEEKLY SUCCESS! 🎉** with badge art, confetti and badge sound.
- [ ] The text says *"… completed all training goals for **Week N**!"* (Week number shown, because Mega is visible).
- [ ] **No** 🎁 WEEKLY REWARD box.
- [ ] Admin › 🎁 Rewards claimed history has **no** new entry.
- [ ] The Mega card fills the next slot with this week's badge.

### 2.3 Winning week 4 (Mega)
Debug Sidebar › **Mega cycle week** → week 4. Win the week again.
- [ ] **👑 MEGA MILESTONE COMPLETED! 👑** with Mega confetti and sound, and the 4 badges.
- [ ] **No** 🏆 MEGA REWARD or 🎁 WEEKLY REWARD boxes; no claimed-history entry.

### 2.4 Start New Week wording
Tap **🚀 Start New Week** (or Admin › Tonight's Check-in › Start a new week).
- [ ] **Won week 4:** *"Start New Mega Cycle? 👑"* (Mega is visible in this view).
- [ ] **Unwon week:** *"… Your badge carries over to the new week."* — **no** "and reward".

---

## 3. ⭐ Badges only (Lyra's and Alden's view)

Choose **⭐ Badges only**.
- [ ] The Mega card, both pickers and the quote are gone. Badge card and 🏆 Case stay.
- [ ] Ticking works with no reward pop-up.
- [ ] Winning week 4 shows **WEEKLY SUCCESS** (never Mega) with "this week" copy and no reward boxes.
- [ ] Re-run §2–§7 of [`test_plan_show_milestones_switch.md`](test_plan_show_milestones_switch.md) if you want the full under-5 regression.

---

## 4. A reward is already picked: the confirm (R5)

Set the dropdown back to **🏆 Badges, Mega Milestones & Physical Rewards**, close Admin, and pick a Weekly reward and a Mega reward on the main screen.

Reopen Admin and choose **🏅 Badges & Mega Milestones**:
- [ ] **"Change the rewards view? 🎁"** opens, naming the child and **both** picked rewards by their labels (e.g. *🏰 Master Builder… and 📚 Epic Upgrade…*).
- [ ] It explains that switching now hides the reward(s) and they won't be recorded on a win.
- [ ] Buttons: **Start next week** (blue, primary), **Switch now**, **Cancel**. Focus starts on **Cancel**.

### 4.1 Cancel
- [ ] **Cancel** (and, separately, a tap on the dimmed backdrop) closes it with nothing changed; the dropdown is back on **🏆 Badges, Mega Milestones & Physical Rewards**; the pickers still show the rewards on the main screen.

### 4.2 Start next week
Choose **🏅 Badges & Mega Milestones** again → **Start next week**.
- [ ] The dropdown shows **🏅 Badges & Mega Milestones**, with an amber line under the help text: *"Starts \<Sun, Nov 29\>. \<Child\> keeps this week's reward until then. Choose \"Badges & rewards\" to cancel."* (date = the next week start).
- [ ] Close Admin: the child **still sees both pickers with their rewards**; ticking works normally.
- [ ] Reopen Admin, choose **🏆 Badges, Mega Milestones & Physical Rewards**: the status line disappears (pending cancelled) and nothing else changes. Set it to pending again for §5.

### 4.3 Switch now
On a second test child (or reset picks), pick rewards, then choose **⭐ Badges only** → **Switch now**.
- [ ] Applies immediately: Mega card, pickers and quote are gone.
- [ ] Switch the dropdown back to **🏆 Badges, Mega Milestones & Physical Rewards**: the pickers come back **empty** (the picks were cleared).

---

## 5. The pending view starts at the next week (R5, R6)

Use the child left pending in §4.2.

### 5.1 Won week
With **Future Edits**, win the week, then Admin › Tonight's Check-in › **Start a new week** → Let's Go.
- [ ] The win pop-up (before the reset) still showed the **reward box** — the reward was honoured this week.
- [ ] After the reset: the view is **🏅 Badges & Mega Milestones** (pickers + quote gone, Mega card shown) and the Admin status line is gone.

### 5.2 Unwon week: carried-over reward is dropped (R6)
Set up pending again on a test child with rewards picked and the week **not** won. End the week by applying a **Change Week Start Day** to today or an earlier day (this archives the current week immediately — see §8 for the copy check).
- [ ] After applying: the view is **🏅 Badges & Mega Milestones** and the reward did **not** carry over (turning rewards back on shows empty pickers).
- [ ] The unwon badge **did** carry over (same "THIS WEEK'S BADGE").

> [!NOTE]
> A plain **Start a new week** on a week that hasn't ended and isn't won is a same-week reset, not a new week, so the change correctly **stays pending**.

---

## 6. Past weeks after rewards come back on (R7)

On the child from §2 (several weeks played in **🏅 Badges & Mega Milestones**), switch the dropdown to **🏆 Badges, Mega Milestones & Physical Rewards**. On the main screen tap **◀ Prev Week**:
- [ ] For a week played in Badges & Mega Milestones: both greyed-out pickers are replaced by one centred line **"🏅 Badges & Mega Milestones week: no rewards"**. Its badge and Mega slots show normally.
- [ ] For a week played in Badges only: **"⭐ Badges-only week: no rewards"**.
- [ ] For a week that had rewards picked: the greyed-out pickers show those rewards (unchanged).
- [ ] **Next Week ▶** back to the current week: the live pickers return (empty, ready to pick).
- [ ] Check the line in both themes; no inline styles, readable slate text.
- [ ] Switch the dropdown to **🏅 Badges & Mega Milestones** or **⭐ Badges only** and go **◀ Prev** again: the bottom panel shows **no** note and no pickers, only the toolbar.

---

## 7. Other children, Standard and parent modes

- [ ] **Standard** with the dropdown left on Badges & Mega Milestones: Standard shows the Mega card, pickers and quote anyway, and the reward tick gate is back. Switch back to Big Buttons: the setting is remembered.
- [ ] Switch Trainer to another child: their view is unaffected (the setting is per child).
- [ ] **Exception Mode** → Done ✅: rewards stay hidden afterwards.
- [ ] **Fix last week**: works normally; no reward boxes for a Badges & Mega Milestones child.
- [ ] **Wipe All Progress** on the test child: the Rewards view setting stays (it's a parent setting).

---

## 8. Change Week Start Day copy

Admin › 🗓️ Settings › **Week start day** → pick **today or an earlier day** this week (the immediate-apply case).
- [ ] **Change Week Start Day? 📅** shows **⚠️ Permanent Schedule Change** with: *"Applying this change saves your current chart to history. You can still fix its check marks with **✏️ Fix last week**, but the new start day can't be undone."*
- [ ] It no longer says "past training history cannot be edited".
- [ ] Apply: the **✏️ Fix \<dates\>** button now targets the week just saved, and editing a check mark there works (stars/XP update; badges don't change).
- [ ] Picking a **future** day this week still shows the separate *"Schedule Change: Starting …"* dialog with the "you can modify or revert" notice (unchanged).

---

## 9. Prod rollout

1. Deploy via the wrap-up (`pokemon-session-wrapup`).
2. On **both tablets**: Admin › 💾 Data › **Reload latest version** until each shows cache `v323`.
3. Check **Alden**: the dropdown already shows **⭐ Badges only**; his screen is unchanged.
4. Set **Lyra** → **⭐ Badges only**. If she has a reward picked this week, choose **Start next week**.
   - [ ] The status line shows next Sunday's date; Lyra still sees her reward until then.
   - [ ] After the new week starts: no pickers, no quote, no Mega Milestone card; the weekly badge card shows on both tablets.
5. - [ ] Kepler looks unchanged.

> [!NOTE]
> A tablet still on an older build keeps Alden's and Lyra's ⭐ view (the old `hideMilestones` field is still written for Badges only). Step 2 still comes first so the new dropdown is there.
