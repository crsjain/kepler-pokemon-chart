# Kepler's Pokémon Training Chart 🎮⚡

A gamified weekly behavior and task reward chart styled with a Pokémon theme for Kepler. This app is designed to run in a browser and can be added to the home screen of a tablet or smartphone to act like a native app. Kepler can earn XP, level up his partner Pokémon, and unlock weekly badges!

## Features

- 👾 **Retro Pokémon UI**: Immersive retro game font and pixel aesthetics.
- 🦊 **Multi-Partner Training**: Kepler can choose to train different partners (Pikachu, Charmander, Bulbasaur, Squirtle, Eevee, Onix). XP and Levels are tracked **individually** for each Pokémon, encouraging him to train them all!
  - **Starter Pikachu & Shop Pichu**: New trainers start with a Level 1 **Pikachu** (protected by a `minStageId` floor so it never devolves into Pichu and evolves into Raichu at Level 10). **Pichu** remains available in the Partner Shop so children can adopt and raise a Pichu to Level 5 if they want additional Pikachu!
  - **Eevee Branching Evolution**: Reaching Level 5 with Eevee unlocks a branching evolution modal allowing Kepler to choose between 8 different evolutions (Vaporeon, Jolteon, Flareon, Espeon, Umbreon, Leafeon, Glaceon, Sylveon) with individual sprites.
  - **Onix & Steelix Evolution**: Train Onix (Rock-type) from Level 1 to Level 5 to trigger an authentic evolution event into Steelix (Steel-type), complete with devolution support and partner shop integration.
  - **Partner Pokémon Showcase Modal & Easter Egg Tap**: Tap the partner sprite on the Trainer Card to open an authentic collectible card modal featuring an enlarged, hero-sized partner Pokémon sprite (250px on desktop, 210px on mobile), Pokédex number, elemental type pill, matching pixel-art LV badge ('Press Start 2P'), a slimmed stats card, and evolution helper text. Tapping the enlarged sprite triggers a playful easter egg bounce animation with an authentic 8-bit chime!
- 🪙 **Star Vault & Partner Shop**:
  - Daily totals completed are saved as stars in the **Star Vault**.
  - **Star Streak Color Legend**: A simple at-a-glance legend shows what each star color means as streaks grow (🌟 `Day 1-2 Yellow`, 🥈 `Day 3-4 Silver`, 📘 `Day 5-9 Blue`, 🌈 `Day 10+ Prism`).
  - Spend 5, 10, or 15 stars from your vault to purchase and unlock new partners from the **Partner Shop** featuring 100+ different Pokémon (including Legendaries like Galarian Moltres)!
  - Filter shop items dynamically by type (Fire, Water, Grass, Dark, Flying, etc.) or cost tier, and sort by Dex #, A–Z, Cost, or Type (`Sort: Type ⚡`, with Dex # tiebreaker).
  - Clean card layout with a 26px top status rail (`✨` can-evolve marker in the top-left corner, `🔒` in the top-right on locked cards, 64px sprite), full single-line names with zero truncation (including Charmander and `G. Moltres`), interactive "CAUGHT!" / `CAUGHT ×2` ribbons, and vertically aligned star progress bars.
- 📈 **XP & Evolution System**: 
  - Each task checked adds **5 XP**.
  - Clearing all tasks in a day unlocks the **Daily Total (⭐)** and grants a **+15 XP Bonus**.
  - **Milestone XP Bar**: The XP bar displays vertical segment milestones representing levels. Leveling up triggers a bounce animation.
  - 📲 **Sticky Mini-HUD (Mobile/Tablet)**: When scrolling down on smaller viewports (under `1024px` wide), a sticky HUD slides in at the top showing the partner's sprite, name, level, and XP progress bar, allowing Kepler to track progress without scrolling back up. Tapping it smoothly scrolls back to the top.
  - 📅 **Centralized Column State Machine**: The weekly grid uses a single-source-of-truth state machine resolving 8 distinct states (`ACTIVE_TODAY`, `ACTIVE_PAST`, `ACTIVE_FUTURE`, `SELECTABLE_TODAY`, `SELECTABLE_PAST`, `FUTURE_LOCKED`, `SUPERSEDED`, `HISTORICAL`).
    - Active day columns illuminate in Pikachu Yellow (`#ffcb05`) with high-contrast slate text.
    - Future days are locked (`FUTURE_LOCKED`) against accidental child inputs while allowing parents to pre-configure exceptions in Parent Mode.
    - Switching back to Today has zero friction, and switching to past catch-up days is protected with a confirmation dialog.
    - Mid-cycle schedule adjustments forward-hash superseded days with diagonal hatching (`SUPERSEDED`) and tooltips.
    - Capturing a task triggers an authentic 0.4s Pokémon capture wiggle animation on user click.
  - **Adaptive Week Starts & Historical Archives**: Parents can customize the week start day at any time in Admin Settings with intelligent micro-week consolidation, preserving past completed weeks in a historical archive (`◀ Prev Week` / `Next Week ▶`).
  - **Evolution Celebrations**: Reaching Level 5 (and Level 10 for Charmander, Bulbasaur, and Squirtle) triggers a full-screen evolution event! The Pokémon transforms into its next stage (e.g., Pikachu -> Raichu, or Charmander -> Charmeleon -> Charizard) with a custom modal.
- 🏆 **Weekly Badges & Collection**: Reaching the weekly task goals awards Kepler the active weekly badge.
  - **Immediate Case Award**: Badges are added to his permanent case immediately upon grid completion so he can view them without waiting to reset his week.
  - **Badge Case Grid, Filter & Sort**: Open the Case modal to view all earned badges in a 3-column grid (2 columns on mobile), filter by Pokémon type (18 types including Flying), or sort by Date Earned, Dex #, A–Z, or Type using the same filter bar as the Partner Shop.
  - **Mega Milestone Celebrations**: Completing Week 4 triggers a grand Mega Celebration. The modal dynamically displays the **exact 4 weekly badges** Kepler earned to qualify for the milestone reward.
- 🔊 **Audio & Bouncy Animations**: Game-synthesized audio beeps play on checkbox toggles, daily totals, and level-ups. Completing milestone events triggers a bouncy card entrance zoom-in transition and plays a triumphant 6-note 8-bit RPG-style victory fanfare (`megaSuccess`).
- 📲 **PWA Offline Support & Boot Skeleton**: Fully compatible as a Progressive Web App. Local code modules load network-first (with cached offline fallback and automatic one-shot reload on stale module errors), while PokeAPI sprites stay cache-first. On launch, an in-place boot skeleton (`Finding your partner…` with a wobbling Pokéball and a 10s retry watchdog) hides placeholder data until the child's real profile renders.
- 💾 **Local Progress Saving**: Progress is saved automatically in the browser's local storage.
- 📖 **Pokémon Training Guide**: Tap the "📖 Guide" button in the grid column header to view task-specific rules (e.g., Piano: "Play all pieces 3x...") describing exactly what needs to be done to earn a pokeball.
- 🔒 **Parent Admin Panel**: Password-protected (`zxcv`) left-navigation dashboard in the footer:
  - **5-Tab Left-Nav Shell & Scope Pill**: Organized into 5 sections across **This child** (`🗓️ Settings`, `✅ Activities`, `🎁 Rewards`) and **Whole family** (`👥 Family`, `💾 Data`), with a live `Editing: <child>` header chip and `THIS CHILD · <NAME>` / `WHOLE FAMILY` card eyebrows. Tablets in portrait (≤ 899px wide), phones, and short landscape screens switch to a horizontal tab strip with roving arrow/Home/End focus. Always opens on `🗓️ Settings`, where each setting is a two-line row (bold name + helper text wired via `aria-describedby`) paired with a compact control on the right: *Tonight's Check-in* (`Set Exceptions`, `Parent edit window`, `🔒 Approve past days` switch) above *Week & Clock* (`Week starts on`, `Time zone`, `Screensaver`).
  - **Cohesive Admin Styling & Modal Dismissal**: At most one Poké Blue primary action per card, tonal-blue secondary buttons (including the footer `Close` button), white Cancel/Discard, and red only inside the Danger Zone and destructive confirms. Form fields are flat and left-aligned with visible labels so they never look like buttons. Routine saves show a bottom-right `✓ Saved` toast instead of a modal pop-up, and clicking/tapping outside any modal overlay (with a pointerdown-to-click drag guard) cleanly closes it—routing through the unsaved-changes guard when edits are pending.
  - **Dynamic Activity Manager (Summary Rows + Draft Model)**: Activities render in a compact summary list (`emoji tile · bold name · 1-line instructions` with `▲▼` reorder, `✏️` edit, and `🗑` delete); tapping `✏️` expands one row at a time into flat labelled fields (`✓` Done). Edits stay in a **draft** with a sticky `Save / Discard` bar, an unsaved dot on the tab, and a three-outcome `Unsaved Changes ✏️` guard (`Save` / `Discard` / `Keep editing`) on tab switch, Close, `✕`, backdrop click, Escape, or Android back. Save merges by id so changes synced from another device are kept, flagging conflicts inline.
  - **Inline Rewards Editor & Sheet**: Edit the active child's Weekly & Mega Milestone rewards inline directly inside `🎁 Rewards` (sharing the sticky `Save / Discard` bar and unsaved guard), or open the restyled pop-up sheet from any non-active child's `Edit Rewards` button in `👥 Family`. Claimed rewards history sits in a collapsible card below.
  - **Backup, Restore & Advanced Tools**: `📋 Copy backup code` / `📥 Restore from code` use an in-app paste dialog (`Restore` / `Cancel`, replacing native `prompt()`). A collapsible `Advanced & troubleshooting` disclosure houses `Run diagnostics` and `Reload latest version` (guarded when offline).
  - **Family Profile & Passcode Management**: `👥 Family` combines the `Children` list (`Edit Rewards`, `Delete`, green `Active` pill, and `+ Add child`—which stays inside Admin without switching the active profile or re-prompting for the passcode) with the `Parent Passcode` card.
  - **Parent Passcode Prompt**: Both the Admin-entry and past-day approval prompts use a calm `Parent passcode 🔑` dialog (`Unlock` / `Cancel`, quiet inline error, no shake or sound).
  - **Parent Approval & Timed Grace Window for Past Days**: Protects against accidental past-day clicks (especially for younger children like 5yo Lyra). Parents can toggle `🔒 Approve past days` per profile in Admin Settings and choose a configurable edit window (`1 min`, `2 min`, `5 min`). Once unlocked via the parent passcode (`zxcv`), a floating bottom dock (`🗝️ Parent Edit Active [Lock Now 🔒]`) displays a digital countdown, allowing frictionless review and correction of past tasks. Editing auto-relocks immediately upon timer expiration, tapping "Lock Now", tapping "Back to Today", or switching profiles, safely returning the active column to Today.
  - **2-Second Hold-to-Confirm on Destructive Actions**: Both `Delete` child (in `👥 Family`) and `Reset this child's progress` (in `💾 Data` → Danger Zone) require pressing and holding the red confirm button for 2 seconds (`Hold 2s to delete <Child>` / `Hold 2s to reset <Child>`) with a live fill bar and a reduced-motion fallback. Reset affects **only the active child**—activities, rewards, settings, and other children are untouched.
  - **Chart Style (Coming Soon)**: A greyed-out `🧸 Chart style` card at the bottom of `✅ Activities` (`Big buttons (under 5)` / `Standard (5+)`) marks a planned big-button chart for younger children with only one or two activities.
  - **Screensaver Inactivity Timeout**: Adjust the inactivity timer (1m, 5m, 10m, 15m, 30m, or Never) before the idle screensaver kicks in to pause animations and conserve battery.
  - **Developer Debug Mode**: Toggle the right-aligned Debug Sidebar to test milestones, level up instantly, or force devolution for testing (includes a convenient direct close button on the panel).
- ✍️ **Reward Customization & Choice**: Dedicated drop-down options for Kepler to select his weekly and mega (4-week loop) target rewards. Available rewards can be customized per profile, and "Recent Rewards" are automatically suggested.
  - **Inline Editing (✏️)**: Parents can edit existing rewards in place with quick save/cancel controls and keyboard shortcuts (<kbd>Enter</kbd> to save, <kbd>Escape</kbd> to cancel).
  - **Drag-and-Drop Reordering (`⠿`)**: Reorder rewards intuitively within each column on both desktop (mouse drag) and mobile/touch devices (touch handle).
  - **Live Main Dropdown Sync**: Dropdowns on the main chart automatically reflect the exact custom sequence and keep Kepler's active selection updated upon renaming.
  - **Unearned Badge & Reward Carryover**: Unearned weekly badges and selected rewards automatically carry over across week rollovers until completed, preserving Kepler's progress without premature pool re-rolls.
- 💤 **Smart Hybrid Rest Day Passes & Bonus Tasks**:
  - **3-State Parent Exception Mode**: Parents can tap any cell in Exception Mode (`Admin 🔒 ➔ Exception Mode ⚠️`) to cycle between Required (`🔴`), Elective Bonus (`✨`), and Rest Day Pass (`💤`).
  - **Parent Command Dock (Floating Bottom Toolbar)**: In Exception Mode, an elevated dock floats at the bottom center of the viewport in deep slate (`rgba(30, 41, 59, 0.96)`) with backdrop blur, anchored in the natural thumb reach zone. Features a clean typographic header (`⚙️ EDIT MODE`), unified cycling stepper (`Click cells to cycle: 🔴 Normal ➔ ✨ Bonus ➔ 💤 Rest`), a secondary `↩ Admin` button that reopens Admin without re-entering the passcode, tactile emerald `Done ✅` CTA, 96px bottom clearance padding on the page container, and fast <kbd>Escape</kbd> key dismissal.
  - **Responsive Viewport Policy (Zero Scroll Tablet/Desktop vs. Horizontal Scroll Mobile)**: Tablets and desktop monitors ($\ge 768\text{px}$) enforce a strict **Zero Horizontal Scroll** policy where the entire week fits 100% within the training card. Mobile phone viewports ($< 768\text{px}$) enable smooth, touch-friendly horizontal momentum scrolling inside the card wrapper with table `min-width: 620px` and comfortable `8px 3px` cell padding, guaranteeing that 36px Pokéball assets maintain at least 54.5px width and never overlap.
  - **Non-Clickable Rest Day Passes (`💤`)**: Floating, borderless emoji on diagonal stripes. In child mode, rest cells are strictly non-clickable (`disabled`, `pointer-events: none; cursor: default;`) to prevent accidental clicks or confusing button affordances during illness or travel.
  - **Elective Bonus Tasks (`✨`)**: Vibrant cyan dashed ring (`#0284c7`) with centered sparkle emoji, clickable for enrichment.
  - **Authentic 2D Great Ball (Super Ball)**: Completing a bonus task transforms the cell into an authentic Great Ball featuring a royal cobalt blue dome (`#2563eb`), dual angled diagonal red pill capsules (`#ef4444`), golden yellow center button (`#ffcb05`), white base dome with crescent shadow, and snug floating `+XP` pill badge.
  - **Child-Friendly Daily Totals & Pokémon Gym Badge Stars**: Daily Total cells display clean status indicators (`🌟` complete, `☆` today in-progress & future unreached, `❌` past missed, `💤` past rest day, `➖` superseded). **Rest days pause the streak:** a day where every activity is rest/bonus and nothing is completed earns no star and neither grows nor breaks the Star Vault streak (silver Day 3 → 5 rest days → silver Day 4); completing any bonus on such a day earns the star. Emojis are rendered with custom Pokémon Gym Badge vector SVGs—crisp 2.6px charcoal outlines (`#2d3748`), Pikachu Yellow fill (`#ffcb05`), warm amber facet shading (`#d97706`), specular apex glints, and 2px retro elevation, paired with subtle recessed ghost star sockets. Completed days (both past and active day) display a soft warm Pikachu-yellow tile background (`rgba(254, 243, 199, 0.45)` with `border-radius: 6px`), with clean static star rendering that eliminates re-render bounce and confusing continuous pulsing.
  - **Landscape Split-View Height Stabilization**: Chart table heights are strictly stabilized between current and historical archived weeks by locking `#badge-status` height to `2.6em` with concise copy (`"Clear all goals to unlock!"`), ensuring sub-pixel identical chart heights across week navigation.
  - **Extended XP Float Readability**: Floating XP notifications feature a 2.5s duration with a 1.5s+ motionless dwell phase in rounded `Fredoka One` typography, horizontal viewport edge clamping, and clean messaging (`+20 XP! 🎉`, `+10 XP Super Trainer! 🚀`).
  - **Smart Rollover Policy**: Elective bonus tasks (`'bonus'`) automatically carry over to new weeks, while temporary rest passes (`'rest'`) automatically expire.

---

## How to Run Locally

This app is built from native ES6 modules, so it **must be served over HTTP**.
Opening `index.html` directly from the filesystem (`file://`) will fail — browsers
block module imports on `file://` for security reasons, and the page will show a
"Failed to load application script module" error.

1. In your terminal, from inside the project directory, start a static server:
   ```bash
   python3 -m http.server 8000
   ```
2. Open `http://localhost:8000` in your browser.

*(There is no build step and no `npm install` — the files you edit are the files
that run.)*

---

## How to Make It Publicly Accessible (For Tablet / Phone)

To access the app on Kepler's tablet or your phone, the files need to be hosted on the web. Here are three super easy, free ways to do it in under 5 minutes:

### Option 1: Vercel (Easiest, No Git required)
1. Go to [Vercel Direct Upload](https://vercel.com/import/deploy).
2. Drag and drop the `kepler-pokemon-chart` folder directly onto the upload area.
3. Vercel will instantly generate a public URL (e.g., `https://keplers-pokemon-chart.vercel.app`) that you can open on any device!

### Option 2: Netlify Drop (No Git required)
1. Go to [Netlify Drop](https://app.netlify.com/drop).
2. Drag and drop the `kepler-pokemon-chart` folder.
3. Netlify will host it instantly and give you a shareable link.

### Option 3: GitHub Pages (Best for long-term updates)
1. Create a public repository on GitHub.
2. Push the **entire project folder** to the repository. The app imports a dozen
   ES6 modules at runtime (`state.js`, `migrations.js`, `pokemon_data.js`,
   `date_utils.js`, `admin.js`, `rewards_admin.js`, `vault.js`, `shop.js`, `badges.js`, `guide.js`,
   `audio.js`, `firebase.js`, `modal_backdrop.js`), plus `service-worker.js`, `manifest.json`, and
   `icon.png` — cherry-picking only a few files will deploy a broken site.
3. Go to **Settings** -> **Pages** in your repository.
4. Select `main` branch as the build source and click **Save**.
5. Your chart will be live at `https://<your-username>.github.io/<repo-name>`.

---

## How to Add to Home Screen (Mobile/Tablet App Mode)

Once hosted on a public URL, you can run the app without browser bars:
- **On iPad/iPhone (Safari)**: Open the URL, tap the **Share** button (box with up arrow), and select **Add to Home Screen**.
- **On Android (Chrome)**: Open the URL, tap the **three dots** in the top right, and select **Add to screen**.
