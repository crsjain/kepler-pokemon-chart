# Manual Test Plan: Modal Theme Alignment (Pokémon Center & Pastel Castle) + Unicorn Big Buttons (`✨`)

**Covers commits:** `796ef4c` (Unicorn Big Buttons `✨` day title), `f26dd54` (Modal theme alignment Q1–Q4), `7935d80` (Documentation sync)  
**Build:** cache `poke-chart-cache-v259`, modules `?v=11.22`, `style.css?v=11.23`  
**Specs:** [`prd_unicorn_princess_theme.md`](prd_unicorn_princess_theme.md) (§10.6–§10.7), [`prd_simplified_chart_style.md`](prd_simplified_chart_style.md), [`../_agents/rules/ux-guidelines.md`](../_agents/rules/ux-guidelines.md) (Rules 5, 8, 11, 12, 17, 19, 20, 21)  
**Automated coverage:** `TC62`, `TC91`, `TC100`, `TC127` (§6b), and `TC128` (§7b) in [`../tests.js`](../tests.js) (`node run_headless_tests.js`)

---

## 0. Setup

| Where | How |
| :--- | :--- |
| **Local (staging)** | Ensure `python3 -m http.server 8000` is running, then open `http://crsjain.c.googlers.com:8000/` (or `http://localhost:8000/`). Parent PIN: `zxcv` (or the family PIN if set). |
| **Prod** | `https://crsjain.github.io/kepler-pokemon-chart/`, after the wrap-up deploy. Hard-refresh once. |

- [ ] **Cache check:** Hard-refresh (`Cmd/Ctrl + Shift + R`). DevTools › Application › Cache Storage shows `poke-chart-cache-v259`.
- [ ] **Debug helpers (local):** Open **🔒 Admin** › **💾 Data** › **Advanced & troubleshooting** › turn on **Debug Sidebar**. Use it to quickly trigger level-ups, evolutions, or weekly badge wins.

---

## 1. Theme Switching & Big Buttons Day Title (`⚡` vs. `✨`)

1. Open **🔒 Admin** › **🗓️ Settings** › **Look & Feel** card at the bottom:
   - Set **🎨 Chart theme** to `⚡ Pokémon Training` and **🧸 Chart style** to `Big Buttons`.
   - Close Admin.
   - [ ] The day banner header (`#simplified-day-title`) starts with **`⚡`** (e.g., `⚡ Today — Friday` or `⚡ <Day>'s Quests`).
2. Reopen **🔒 Admin** › **🗓️ Settings** › **Look & Feel**, switch **🎨 Chart theme** to `🦄 Unicorn & Princess`, and close Admin:
   - [ ] The day banner header immediately switches to **`✨`** (e.g., `✨ Today — Friday` or `✨ <Day>'s Quests`).
   - [ ] Switching **🧸 Chart style** between `Big Buttons` and `Standard` keeps the Unicorn theme intact.

---

## 2. Group B — Kid Collection & Progression Modals

Check each modal in **⚡ Pokémon Training** first, then switch to **🦄 Unicorn & Princess** and re-check:

### 2.1 Partner Showcase Modal (`#partner-showcase-modal`)
*Tap the active partner sprite on the Trainer Card.*
- [ ] **Shell:** Borderless `26px` white panel with soft blue (`pokemon`) or plum (`unicorn`) elevation shadow; no dark charcoal outer border.
- [ ] **Eyebrow (`#showcase-role-label`):** Reads **`TRAINER <NAME>`** in Pokémon and **`PRINCESS <NAME>`** in Unicorn.
- [ ] **Level Badge (Q3):** `.level-badge` inside the stats card is a rounded `Nunito` pill (`LV 5`, `border-radius: 999px`) matching the main Trainer Card header (no rectangular pixel-art box).
- [ ] **Primary CTA (`#showcase-ok-btn`):** Reads **`Let's Go Train! 🚀`** (blue `#2563eb` with navy lip) in Pokémon and **`Let's Go Sparkle! ✨`** (amethyst `#7e22ce` with plum lip) in Unicorn.
- [ ] **Easter Egg:** Tapping the large sprite bounces and plays the 8-bit chime.

### 2.2 Change Partner Modal (`#partner-modal`)
*Tap `Change Partner` on the Trainer Card.*
- [ ] **Shell & Tray:** `26px` white panel; partner cards sit inside a sunken `--sk-tray` well (`#d6e8ff` pale sky in Pokémon, `#efd3fb` soft lavender in Unicorn).
- [ ] **Cards:** White `18px` cards with a `0 4px 0` candy lip (`#9cc2f2` blue in Pokémon, `#e0a6f2` orchid in Unicorn). The active partner card shows a glowing yellow/gold border (`#ffcb05` / `#facc15`).
- [ ] **Get More Partners CTA:** Warm gold/amber button (`#f59e0b` / `#fde047`) with dark ink text.

### 2.3 Star Vault Modal (`#vault-modal`)
*Tap the `Vault` gem / jewel-box tile.*
- [ ] **Outer Shell & Stat Cards:** `26px` white panel; the 3 top summary cards (`Available Stars`, `Current Streak`, `Longest Streak`) sit on `--sk-tray` cards with candy lips and `--sk-ink` titles.
- [ ] **Inner Star Cabinet (Q2):** `.vault-grid-container` keeps the deep dark **Cosmic Nebula** (`#0f172a` → `#1e1b4b`) background in **both** themes so Yellow, Silver, Blue, and Prism stars pop with maximum contrast.
- [ ] **Footer CTAs:** `Spend in Shop 🏪` uses the primary blue/amethyst button; `Done` uses the neutral slate pill.

### 2.4 Partner Shop Modal (`#pokemon-shop-modal`)
*Tap `Spend in Shop 🏪` from the Vault.*
- [ ] **Header & Balance Pill:** `--sk-ink` title (`Pokémon Partner Shop! 🏪` vs. `Magical Companion Shop! 🦄`); star balance pill has a warm gold border on cream/blush.
- [ ] **Filter Bar:** Search input and Type/Cost/Sort dropdowns sit inside a sunken `--sk-tray` bar (`border-radius: 18px`) as rounded white pills.
- [ ] **Shop Grid & Cards:** Sunken `--sk-tray` scrolling well (transparent scrollbar track, UX Rule 5); white `18px` cards with candy lips; `Hold to Unlock` button fills smoothly.

---

## 3. Group C — Reference & Case Modals (Q1 — Wood/Parchment Retired)

### 3.1 Badge / Royal Gem Case (`#badges-modal`)
*Tap `🏆 Case` (Pokémon) or `👑 Gem Case` (Unicorn) on the Weekly Badge card.*
- [ ] **No Wood/Parchment:** The old `#fdf6e2` cream background and `#8b5a2b` brown wood borders are gone, replaced by the standard `26px` white panel + sunken `--sk-tray` grid well + white candy-lip badge cards.
- [ ] **Header & Counter Copy:** Title reads `<Name>'s Badge Case 🏆` (`pokemon`) vs. `<Name>'s Royal Gem Case 👑` (`unicorn`), and the counter badge reads **`X Gym Badge(s) Collected`** vs. **`X Royal Gem(s) Collected`** (plus matching empty-state text when a filter matches 0 items).
- [ ] **Filter & Sort Pills:** `#badges-filter-type` and `#badges-sort-by` render as rounded `999px` pills with theme borders.

### 3.2 Task Guide Modal (`#guide-modal`)
*In `Standard` chart style, tap `📖 Guide` in the top-left table header.*
- [ ] **Shell & Cards:** `26px` white panel with sunken `--sk-tray` list container and white candy-lip `.guide-card` rows (no brown/tan parchment).
- [ ] **Copy:** Title reads `Pokémon Training Guide 📖` vs. `Royal Practice Guide 📖`; subtitle ends with `earn a pokeball for each task!` vs. `earn a sparkle heart for each quest!`.

---

## 4. Group D — Celebrations, Prompts & Setback Notices

1. **Level-Up / Evolution Modal (`#level-up-modal`)** — *Use the Debug Sidebar (`+1 Lv` or `+20 XP`) to trigger a level-up or evolution:*
   - [ ] `26px` borderless white card, `--sk-ink` title, sunken `--sk-tray` partner showcase box, and yellow/gold `Awesome!` button (`--sk-btn1-bg` with dark `#1e293b` text).
2. **Eevee Branching Evolution Modal (`#eevee-modal`)** — *Switch partner to Eevee and level to 5:*
   - [ ] `26px` white panel, sunken `--sk-tray` grid, white candy-lip evolution cards.
3. **Kid Confirmation Dialog (`#confirm-modal`)** — *In `Standard` mode, click a selectable past day column header to trigger `"Switch Day? 📅"`:*
   - [ ] `24px` borderless white card; primary button (`Yes, Switch!`) is high-contrast blue (`#2563eb`) in Pokémon or amethyst (`#7e22ce`) in Unicorn with white text; secondary button (`Cancel`) is neutral slate (`#cbd5e1`).
4. **Celebration vs. Setback Notification (`.notif-modal`)** — *Complete all tasks for the week (`🎉 WEEKLY SUCCESS!`), then untick one task (`🔒 BADGE LOCKED AGAIN`):*
   - [ ] `🎉 WEEKLY SUCCESS!` uses the celebratory gold/yellow button (`--sk-btn1-bg`).
   - [ ] `🔒 BADGE LOCKED AGAIN` keeps its greyed-out badge and calm slate-blue button (`"I'll win it back! 💪"`, UX Rule 11).

---

## 5. Group E — Family Neutral Switcher & Parent Quarantine (Q4 & Rules 8, 17, 19)

1. **Switch Trainer Modal (`#profile-select-modal`)** — *Tap `👥 Switch` in the main header:*
   - [ ] **Neutral Pokémon Center Family Surface:** Uses the `26px` white panel, pale sky `#eff6ff` tray, and `#bfdbfe` candy-lip profile cards regardless of which child was active.
   - [ ] **Pokémon Avatar Preserved (Q4):** Every child's card displays their chosen Pokémon official artwork avatar and their name, with **no** theme badge or per-theme card tint.
   - [ ] **Buttons:** `+ Add Child` is primary blue (`#2563eb`); `Sign Out Family` is a quiet red-text secondary pill (`#b91c1c` on `#fef2f2`).
2. **Add Child Modal (`#add-profile-modal`)** — *Tap `+ Add Child` (and enter Parent PIN):*
   - [ ] Clean `26px` white panel, flat `#cbd5e1` input border, sunken `#eff6ff` starter Pokémon grid, and zero inline styles.
3. **Parent Admin Quarantine (`#admin-modal`, `#password-modal`)**:
   - [ ] While a child is in the **Unicorn & Princess** theme, open **🔒 Admin**: the Parent PIN keypad (`#password-modal`), Admin shell (`#admin-modal`), Poké-Blue primary buttons (`#2a71d0`), and destructive hold-to-confirm dialogs remain 100% unchanged in their neutral Parent Admin theme.
