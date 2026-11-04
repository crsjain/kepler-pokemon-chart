# Manual Test Plan: "Show milestones & rewards" switch (Big Buttons, children under 5)

**Covers commits:** `e0b28a7` (PRD §10), `f8d81a3` (feature)
**Build:** cache `poke-chart-cache-v280`, modules `?v=11.39`, `style.css?v=11.41`
**Spec:** [`prd_simplified_chart_style.md`](prd_simplified_chart_style.md) §10 (owner decisions D1–D5)
**Automated coverage:** `TC134` (plus `TC128` unchanged) in [`../tests.js`](../tests.js), run with `node run_headless_tests.js 134`

---

## 0. Setup

| Where | How |
| :--- | :--- |
| **Local (staging)** | `python3 -m http.server 8000` running → `http://crsjain.c.googlers.com:8000/`. Emulator login `crsjain+staging@gmail.com`. Use the local Parent PIN. |
| **Prod** | `https://crsjain.github.io/kepler-pokemon-chart/`, after the wrap-up deploy. |

- [ ] **Cache check:** hard-refresh. Admin › 💾 Data shows the new version, or DevTools › Application › Cache Storage shows `poke-chart-cache-v280`.
- [ ] **Test child:** use a test child (or Alden on local). Note their current Mega count (`N / 4 Weeks`) before you start.
- [ ] **Debug Sidebar (local):** Admin › 💾 Data › Advanced › **Debug Sidebar** on. You'll use **Mega cycle week** and **Future Edits** below.

---

## 1. Admin switch: where it appears

Open **🔒 Admin › 🗓️ Settings › Look & Feel**.

1. With **🧸 Chart style = Standard**:
   - [ ] There's **no** "🏆 Show milestones & rewards" row. It's hidden, not greyed out.
2. Select **Big Buttons**:
   - [ ] The row appears **directly under Chart style**, with the help text *"For children under 6: turn off to hide Mega Milestone progress and reward choices. Progress still counts in the background."*
   - [ ] The switch is **on** by default.
3. Turn the switch **off**:
   - [ ] An inline **Saved ✓** flashes; there's no pop-up.
   - [ ] Close and reopen Admin: the switch is still off.
4. Switch the chart style to **Standard** and back to **Big Buttons**:
   - [ ] The row hides under Standard, then reappears **still off** (the setting is remembered).

---

## 2. Main screen with milestones hidden

Big Buttons, switch **off**. Check both themes (🎨 Chart theme: Pokémon, then Unicorn).

- [ ] **🔮 / 👑 MEGA MILESTONE PROGRESS** card is gone.
- [ ] **🏆 Weekly** and **💥 Mega Milestone Reward Choice** pickers are gone.
- [ ] The **motivational quote** is gone.
- [ ] Still visible: trainer card with XP, **POKEMON BADGE / THIS WEEK'S BADGE** card with 🏆 Case, the Big Buttons star ribbon, the Vault and the task cards.
- [ ] The footer shows only the version, Switch Trainer and Parent Admin, with **no divider line above them**.
- [ ] **Landscape tablet:** the left column (trainer + badge cards) and the chart end at the same height. There's a 16px gap above the footer. *Owner call:* are the taller trainer and badge cards, with some empty space, OK?
- [ ] **Portrait tablet:** trainer and badge cards sit side by side above the chart, with even gaps and no empty band where the Mega card was.
- [ ] **Phone (optional):** cards stack cleanly with nothing clipped.

---

## 3. Ticking with no rewards picked

Make sure the child has **no** rewards picked. A fresh week after a win clears them, or use a child who never picked any.

1. Tap a task card's ball (or heart):
   - [ ] It catches immediately and the XP float appears.
   - [ ] **No** "⚠️ ATTENTION, TRAINER! — Choose your Weekly Reward and Mega Reward first" pop-up.
2. Untick and tick again:
   - [ ] Works normally, with no reward pop-up either way.

---

## 4. Winning a week (no reward)

Turn on **Future Edits** in the Debug Sidebar so you can tick every day of the week.

1. With the Mega count below 3 (e.g. `1 / 4`), tick every required activity for the week:
   - [ ] **🎉 WEEKLY SUCCESS! 🎉** with the badge art, confetti and the badge sound.
   - [ ] The text says *"… has completed all training goals **this week**!"* (no "Week N").
   - [ ] There are **no** reward boxes (no 🎁 WEEKLY REWARD, no 🏆 MEGA REWARD).
   - [ ] Admin › Rewards › claimed-rewards history has **no** new entry.
2. Debug Sidebar › **Mega cycle week** → week 4, so `megaWeeks = 3`. Win the week again:
   - [ ] It's still **WEEKLY SUCCESS**: never "👑 MEGA MILESTONE COMPLETED", no Mega confetti or sound, no reward boxes.
3. Untick one cell to drop below the goal:
   - [ ] The calm **🔒 BADGE LOCKED AGAIN** notice shows as usual (unchanged behaviour). Re-tick to win again.

---

## 5. Start New Week dialog wording

Once the week has ended (or with Future Edits / test mode), tap **🚀 Start New Week** under the week dates.

- [ ] **Won week:** title *"Start New Training Week? 📅"*, hero *"Start a New Week"*, sub *"Last week is saved with its badge. Start a fresh grid of training."*
- [ ] **Won week 4:** the same wording. **Never** "Start New Mega Cycle? 👑" or "Begin New Mega Cycle".
- [ ] **Unwon week:** *"A new week has started!"* with *"… Your badge carries over to the new week."* (no "and reward").
- [ ] Tap **Let's Go! 🚀**: the new week starts normally.

---

## 6. Mega keeps counting in the background (D3)

After winning one or more weeks in §4–5 with milestones hidden:

1. Admin › Look & Feel › switch **on** (still Big Buttons):
   - [ ] The Mega card, reward pickers and quote come back.
   - [ ] The Mega count reflects the weeks won while hidden, and the slots show those badges. After a won week 4 the cycle wraps to `0 / 4`, as normal.
   - [ ] Both reward pickers are **empty**. Ticking a card now shows the "Choose your rewards first" pop-up (the normal Standard/Big Buttons flow).
2. Switch the chart style to **Standard** with the milestones switch left **off**:
   - [ ] Standard shows the Mega card, pickers and quote anyway (the switch only applies to Big Buttons).
3. **Prev ◀** to a week won while milestones were hidden:
   - [ ] That week's Mega card shows its slot correctly. The reward pickers show empty (expected).

---

## 7. Other children and parent modes

- [ ] Switch Trainer to a child on Standard or Big Buttons with the switch **on**: their Mega card and pickers look exactly as before.
- [ ] Switch back to the under-5 child: milestones are hidden again (the setting is per child).
- [ ] **Exception Mode** (Admin › Tonight's Check-in): the full-week grid shows; tap Done ✅. Milestones stay hidden afterwards and the main screen looks right.
- [ ] **Fix last week**, if available: works normally; no reward or Mega notes for the child.
- [ ] **Wipe All Progress** for the test child (Admin › Data): the switch stays **off** afterwards (it's a parent setting).

---

## 8. Prod rollout

1. Deploy via the wrap-up.
2. On **both tablets**: Admin › 💾 Data › **Reload latest version** until each shows cache `v280`.
3. Only then set **Alden** → Big Buttons → switch milestones **off**.
   - [ ] Both tablets show Alden without the Mega card, pickers or quote.
   - [ ] Kepler and Lyra look unchanged.

> [!NOTE]
> A tablet still on an older build won't break or reset Alden's setting. It just shows his milestones and asks for rewards until it updates. That's why step 2 comes first.
