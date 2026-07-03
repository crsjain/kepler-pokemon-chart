Kepler's Pokémon Training Chart 🎮⚡
A gamified weekly behavior and task reward chart styled with a Pokémon theme for Kepler. This app is designed to run in a browser and can be added to the home screen of a tablet or smartphone to act like a native app. Kepler can earn XP, level up his partner Pokémon, and unlock weekly badges!

Features
👾 Retro Pokémon UI: Immersive retro game font and pixel aesthetics.
🦊 Choose a Partner: Kepler can choose his partner Pokémon (Pikachu, Charmander, Bulbasaur, Squirtle, Eevee) by clicking "Change Partner".
📈 XP & Level Up System:
Each task checked adds 5 XP.
Clearing all tasks in a day unlocks the Daily Total (⭐) and grants a +15 XP Bonus.
Accumulating 100 XP levels up his partner Pokémon (with leveling-up animations!).
🏆 Weekly Badge: Reaching the goal of task requirements (Piano/Math/Reading: 7 days, Writing/Chinese: 5 days) unlocks the weekly Pokémon badge.
💾 Local Progress Saving: Progress is saved automatically in the browser's local storage. Clicking "Reset Week Grid" clears the weekly checkboxes but keeps Kepler's accumulated Pokémon levels and XP.
🔒 Parent Admin Panel: Password-protected (0130) options panel in the footer allowing parents to trigger manual backups, imports, or roll back progress securely.
🔄 Milestone Auto-Backups: Automatically captures and saves "last known good" snapshots to the browser's storage upon Level Up or Weekly Goal Completion to safeguard against accidental resets.
📋 Integrated Restore Guide: A quick FAQ inside the Admin Panel details exactly when to use Auto-Backup (accidental resets) vs. Manual Imports (cache clearance/device migration).
✍️ Reward Choice: Dedicated drop-down options for Kepler to select his weekly and mega (4-week loop) target rewards.
How to Run Locally
Open the project folder.
Double-click the index.html file to open it in any web browser.
Alternative (to test with local server): Run the following command in your terminal inside the project directory:
bash

python3 -m http.server 8000
Then open http://localhost:8000 in your browser.
How to Make It Publicly Accessible (For Tablet / Phone)
To access the app on Kepler's tablet or your phone, the files need to be hosted on the web. Here are three super easy, free ways to do it in under 5 minutes:

Option 1: Vercel (Easiest, No Git required)
Go to Vercel Direct Upload.
Drag and drop the pokemon-reward-chart folder directly onto the upload area.
Vercel will instantly generate a public URL (e.g., https://keplers-pokemon-chart.vercel.app) that you can open on any device!
Option 2: Netlify Drop (No Git required)
Go to Netlify Drop.
Drag and drop the pokemon-reward-chart folder.
Netlify will host it instantly and give you a shareable link.
Option 3: GitHub Pages (Best for long-term updates)
Create a public repository on GitHub.
Push these files (index.html, style.css, app.js, particles.js) to the repository.
Go to Settings -> Pages in your repository.
Select main branch as the build source and click Save.
Your chart will be live at https://<your-username>.github.io/<repo-name>.
How to Add to Home Screen (Mobile/Tablet App Mode)
Once hosted on a public URL, you can run the app without browser bars:

On iPad/iPhone (Safari): Open the URL, tap the Share button (box with up arrow), and select Add to Home Screen.
On Android (Chrome): Open the URL, tap the three dots in the top right, and select Add to screen.
