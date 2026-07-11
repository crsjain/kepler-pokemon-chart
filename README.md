# Kepler's Pokémon Training Chart 🎮⚡

A gamified weekly behavior and task reward chart styled with a Pokémon theme for Kepler. This app is designed to run in a browser and can be added to the home screen of a tablet or smartphone to act like a native app. Kepler can earn XP, level up his partner Pokémon, and unlock weekly badges!

## Features

- 👾 **Retro Pokémon UI**: Immersive retro game font and pixel aesthetics.
- 🦊 **Multi-Partner Training**: Kepler can choose to train different partners (Pikachu, Charmander, Bulbasaur, Squirtle, Eevee). XP and Levels are tracked **individually** for each Pokémon, encouraging him to train them all!
  - **Eevee Branching Evolution**: Reaching Level 5 with Eevee unlocks a branching evolution modal allowing Kepler to choose between 8 different evolutions (Vaporeon, Jolteon, Flareon, Espeon, Umbreon, Leafeon, Glaceon, Sylveon) with individual sprites.
- 📈 **XP & Evolution System**: 
  - Each task checked adds **5 XP**.
  - Clearing all tasks in a day unlocks the **Daily Total (⭐)** and grants a **+15 XP Bonus**.
  - **Milestone XP Bar**: The XP bar displays vertical segment milestones representing levels. Leveling up triggers a bounce animation.
  - 📅 **Focused Active Day Interactions**: To prevent accidental clicks across different days, checking and unchecking tasks is restricted to the **currently active day** column. To record tasks for a different day, simply click that day's column header (e.g. MON, TUE) to activate it. The active column will light up, allowing inputs.
  - **Evolution Celebrations**: Reaching Level 5 (and Level 10 for Charmander, Bulbasaur, and Squirtle) triggers a full-screen evolution event! The Pokémon transforms into its next stage (e.g., Pikachu -> Raichu, or Charmander -> Charmeleon -> Charizard) with a custom modal.
- 🏆 **Weekly Badges**: Reaching the weekly task goals unlocks a special legendary badge:
  - Week 1: **Greninja Badge**
  - Week 2: **Kyogre Badge**
  - Week 3: **Lugia Badge**
  - Week 4: **Rayquaza Badge** (Triggers Mega Celebration!)
- 🔊 **Audio & Sound Effects**: Game-synthesized beeps play on checkbox toggles, daily totals, and level-ups at a comfortable preset volume.
- 📲 **PWA Offline Support**: Fully compatible as a Progressive Web App. Once loaded, it works entirely offline and caches PokeAPI sprite assets locally.
- 💾 **Local Progress Saving**: Progress is saved automatically in the browser's local storage.
- 🔒 **Parent Admin Panel**: Password-protected (`zxcv`) options dashboard in the footer:
  - **Dynamic Task Manager**: Add, edit, or delete activities, customize goal days (1-7), and save changes instantly.
  - **Claimed Rewards History**: View a list of earned rewards with dates and partner context.
  - **Backup & Restore**: Trigger manual backups, import/export backup codes, or restore from a rolling 2-deep list of automated milestone backups (captured on level-ups and week resets).
  - **Diagnostics & Healing**: Click "Run Diagnostics" to auto-detect and heal any state schema inconsistency.
  - **Developer Debug Mode**: Toggle the right-aligned Debug Sidebar to test milestones, level up instantly, or force devolution for testing.
- 📋 **Integrated Restore Guide**: A quick FAQ inside the Admin Panel details exactly when to use Auto-Backup (accidental resets) vs. Manual Imports (cache clearance/device migration).
- ✍️ **Reward Choice**: Dedicated drop-down options for Kepler to select his weekly and mega (4-week loop) target rewards. "Recent Rewards" are automatically remembered and suggested in the dropdown.

---

## How to Run Locally

1. Open the project folder.
2. Double-click the `index.html` file to open it in any web browser.
3. *Alternative (to test with local server)*: Run the following command in your terminal inside the project directory:
   ```bash
   python3 -m http.server 8000
   ```
   Then open `http://localhost:8000` in your browser.

---

## How to Make It Publicly Accessible (For Tablet / Phone)

To access the app on Kepler's tablet or your phone, the files need to be hosted on the web. Here are three super easy, free ways to do it in under 5 minutes:

### Option 1: Vercel (Easiest, No Git required)
1. Go to [Vercel Direct Upload](https://vercel.com/import/deploy).
2. Drag and drop the `pokemon-reward-chart` folder directly onto the upload area.
3. Vercel will instantly generate a public URL (e.g., `https://keplers-pokemon-chart.vercel.app`) that you can open on any device!

### Option 2: Netlify Drop (No Git required)
1. Go to [Netlify Drop](https://app.netlify.com/drop).
2. Drag and drop the `pokemon-reward-chart` folder.
3. Netlify will host it instantly and give you a shareable link.

### Option 3: GitHub Pages (Best for long-term updates)
1. Create a public repository on GitHub.
2. Push these files (`index.html`, `style.css`, `app.js`, `particles.js`) to the repository.
3. Go to **Settings** -> **Pages** in your repository.
4. Select `main` branch as the build source and click **Save**.
5. Your chart will be live at `https://<your-username>.github.io/<repo-name>`.

---

## How to Add to Home Screen (Mobile/Tablet App Mode)

Once hosted on a public URL, you can run the app without browser bars:
- **On iPad/iPhone (Safari)**: Open the URL, tap the **Share** button (box with up arrow), and select **Add to Home Screen**.
- **On Android (Chrome)**: Open the URL, tap the **three dots** in the top right, and select **Add to screen**.
