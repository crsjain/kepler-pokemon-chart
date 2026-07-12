# Product Requirement Document (PRD): Weekly Gym Badge Collection

## 1. Objective & Background
To provide Kepler with a long-term sense of achievement, the app features a **Badge Collection Case**. Every week Kepler completes his training goals, he earns a unique Pokémon Gym Badge. 

The system is designed to mimic the core Pokémon experience of "filling the Pokédex" and collecting gym badges, encouraging sustained weekly engagement.

---

## 2. Target Audience
*   **Kepler**: Motivated by collecting new, cute, or powerful Pokémon badges and seeing his collection grow.
*   **Parents**: Can use the rolled weekly badge as a talking point to encourage Kepler ("If you finish your tasks, you get the Eevee badge this week!").

---

## 3. Key Features

### 3.1. Active Weekly Badge Target
*   **UI Placement**: Located in the "Weekly Badge Card" in the trainer card section.
*   **Locked State (Silhouette)**: Before the week is completed, the badge displays as a mystery dark silhouette ("Who's that Pokémon?") to build anticipation.
*   **Unlocked State**: Once the weekly goals are cleared, the full-color artwork is revealed, and the card glows.

### 3.2. Badge Case Modal
*   **Access**: Click the "🏆 Case" button in the weekly badge header.
*   **UI**: Renders a wooden-styled case displaying all collected badges.
*   **Sorting**:
    *   **Date Earned**: Sorts badges chronologically (newest first).
    *   **Dex #**: Sorts badges numerically by their National Pokédex ID.
*   **Empty State**: Shows an encouraging message if no badges have been collected yet.

### 3.3. Dynamic Badge Pool & Roller
*   **Initial Pool**: Starts with curated Tier 1 Pokémon (e.g., starters like Pikachu, Charmander, Bulbasaur, Squirtle, Eevee).
*   **Awarding**: On successful week completion (and subsequent reset), the active badge ID is pushed to `state.collectedBadges` with a timestamp.
*   **Rolling**: A new badge is randomly selected from the remaining pool.
*   **Pool Expansion**:
    *   If the pool drops below 5 badges, it automatically expands.
    *   It first tries to pull from curated **Tier 2** Pokémon (evolutions like Raichu, Charizard, etc.).
    *   If Tier 2 is exhausted, it falls back to rolling random Gen 1-8 Pokémon (IDs 1 to 898).

---

## 4. Technical Schema (State V10+)
Stored in `state`:
*   `collectedBadges`: Array of collected badge objects `[{ id: number, name: string, dateEarned: string }]`.
*   `badgePool`: Array of available Pokémon IDs `[number, ...]`.
*   `activeWeeklyBadgeId`: The ID of the current weekly target badge (number).
