# Product Requirement Document (PRD): Legendary Pokémon Mega & Branching Evolutions

**Status:** Implemented & Verified
**Author:** Jetski & crsjain
**Date:** 2026-08-09
**Applies to State Schema:** V16+

---

## 1. Executive Summary
Legendary Pokémon unlocked in the Star Vault shop formerly remained static and displayed as fully evolved from Level 1 onwards. This feature introduces a **2-stage evolution progression** exclusively for Legendary Pokémon with canonical Mega, Primal, Origin, or alternate battle forms. Legendaries remain in their Base Form across **Levels 1 to 9**, and evolve into their Mega/Primal/Origin Form upon achieving **Level 10**.

For branching evolutions (such as Mewtwo branching into Mega Mewtwo X or Mega Mewtwo Y, Kyurem into Black or White Kyurem, and Calyrex into Ice Rider or Shadow Rider), an interactive choice modal prompts the child to select their preferred battle form upon reaching Level 10.

---

## 2. Target Audience & Core Experience
* **Kepler (Child)**: Gains a rewarding, long-term incentive to level up legendary partners with daily tasks. Reaching Level 10 unlocks an epic, high-tier visual form with custom celebration animations and sounds.
* **Game Consistency**: Adheres to Pokémon canon by only providing evolutions for species with established canonical alternate forms, while preserving standard leveling past Level 10 for all Pokémon.

---

## 3. Canonical Form Mappings & PokeAPI Artwork

| National Dex ID | Base Legendary | Stage Type | Level 10 Form(s) | PokeAPI Artwork ID |
|---|---|---|---|---|
| **150** | Mewtwo | Branching Choice | Mega Mewtwo X / Mega Mewtwo Y | `10043` / `10044` |
| **380** | Latias | Linear Evolution | Mega Latias | `10063` |
| **381** | Latios | Linear Evolution | Mega Latios | `10062` |
| **382** | Kyogre | Primal Reversion | Primal Kyogre | `10077` |
| **383** | Groudon | Primal Reversion | Primal Groudon | `10078` |
| **384** | Rayquaza | Linear Evolution | Mega Rayquaza | `10079` |
| **483** | Dialga | Origin Forme | Origin Dialga | `10245` |
| **484** | Palkia | Origin Forme | Origin Palkia | `10246` |
| **487** | Giratina | Origin Forme | Origin Giratina | `10007` |
| **646** | Kyurem | Branching Choice | Black Kyurem / White Kyurem | `10022` / `10023` |
| **718** | Zygarde | Complete Forme | Complete Zygarde | `10120` |
| **719** | Diancie | Linear Evolution | Mega Diancie | `10075` |
| **720** | Hoopa | Forme Change | Hoopa Unbound | `10086` |
| **800** | Necrozma | Ultra Burst | Ultra Necrozma | `10157` |
| **888** | Zacian | Crowned Form | Crowned Sword Zacian | `10188` |
| **889** | Zamazenta | Crowned Form | Crowned Shield Zamazenta | `10189` |
| **898** | Calyrex | Branching Choice | Ice Rider / Shadow Rider | `10193` / `10194` |

*Note: Legendaries without official Mega/Primal/Origin forms (e.g. Mew #151, Lugia #249, Ho-Oh #250, Celebi #251, Jirachi #385, Arceus #493, Victini #494, Reshiram #643, Zekrom #644, Xerneas #716, Yveltal #717, Koraidon #1007, Miraidon #1008) are marked as `Fully Evolved form!` from Level 1, but can continue earning XP and leveling up.*

---

## 4. Key Mechanics & Rules

### 4.1. Level 1 to 9 Progression & Teasers
* While at Levels 1–9, the partner card displays the **Base Legendary sprite**.
* The helper text underneath the partner card informs the child of their next milestone:
  * **Linear Lines**: `✨ Next Evolution: Mega Rayquaza at LV 10 (X levels to go!)`
  * **Branching Lines**: `✨ Evolves at LV 10 (X levels to go!)`
  * **Non-Mega Legendaries**: `🏆 Fully Evolved form!`

### 4.2. Level 10 Mega Evolution Trigger & Celebration
* Upon reaching Level 10 (100 XP gained):
  * **Linear Lines**: Automatically evolves into the Mega form (`stageId` set to form ID), triggering confetti celebration, sound effects, and a custom evolution modal dialog.
  * **Branching Lines**: Opens the interactive evolution choice dialog populated with official PokeAPI artwork for each option (e.g. Mega Mewtwo X and Mega Mewtwo Y).

### 4.3. Devolution Behavior
* If daily tasks are unchecked causing total XP to drop below Level 10 (e.g. Level 9, 95 XP):
  * The partner devolves back to its Base Form (`stageId` reset to base family ID).
  * A friendly devolution dialog informs the child.
  * Re-reaching Level 10 re-triggers the evolution / choice flow.

### 4.4. Shop & Star Vault Isolation
* In the Star Vault Partner Shop (`shop.js`), all Mega/Primal/Origin form IDs are registered in `EVOLVED_POKEMON_IDS`, preventing them from appearing as purchasable base cards.
* Unlocking a Legendary in the shop costs 10 Stars and initializes the partner at **Level 1 Base Form**.

---

## 5. Verification & Tests
* Headless integration tests in `tests.js` (Test Case 47) verify:
  1. Non-Mega Legendaries remain fully evolved and level up cleanly.
  2. Linear Mega Legendaries evolve at Level 10, persist Mega form at Level 11+, and devolve at Level 9.
  3. Branching Legendaries prompt interactive selection at Level 10 and devolve at Level 9.
