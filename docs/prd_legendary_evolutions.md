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
| **718** | Zygarde | Five-stage line (§3.1) | Core → 10% → 50% → 100% Forme → Mega Zygarde | `90718`* / `10181` / `718` / `10120` / `10301` |
| **719** | Diancie | Linear Evolution | Mega Diancie | `10075` |
| **720** | Hoopa | Forme Change | Hoopa Unbound | `10086` |
| **800** | Necrozma | Choice, then Ultra Burst (§3.2) | Dusk Mane / Dawn Wings (Lv 5) → Ultra Necrozma (Lv 10) | `10155` / `10156` → `10157` |
| **888** | Zacian | Crowned Form | Crowned Sword Zacian | `10188` |
| **889** | Zamazenta | Crowned Form | Crowned Shield Zamazenta | `10189` |
| **898** | Calyrex | Branching Choice | Ice Rider / Shadow Rider | `10193` / `10194` |

### 3.1. Zygarde: an evolution every 5 levels (owner, 2026-11-06)

Zygarde has more forms than any other legendary, so it evolves every 5 levels instead of once at Lv 10. The Shop sells it as "Zygarde Core" (family `718`, 15 stars): the Shop always shows the lowest stage, which is the one you buy.

| Level | Form | Artwork ID |
|---|---|---|
| 1 | Zygarde Core | `90718`* (local `images/zygarde-core.png`) |
| 5 | Zygarde 10% Forme | `10181` |
| 10 | Zygarde 50% Forme | `718` (PokeAPI's default Zygarde art is the 50% Forme) |
| 15 | Zygarde 100% Forme | `10120` |
| 20 | Mega Zygarde | `10301` |

\* PokeAPI has no Zygarde Core, so `90718` is an app-only ID. `LOCAL_ARTWORK` in `pokemon_data.js` maps it to the image in `images/`. Every sprite URL goes through `getArtworkUrl()` / `getSpriteUrl()`; never build a PokeAPI URL by hand. Zygarde Cell was left out at the owner's request. Mega Zygarde has no small PokeAPI sprite, so the mini HUD shows its artwork. The Shop shows and adopts the first stage (`getFirstStageId()`). Covered by TC137.

| **386** | Deoxys | Forme Choice (§3.2) | Attack / Defense / Speed Forme | `10001` / `10002` / `10003` |
| **807** | Zeraora | Linear Evolution (§3.2) | Mega Zeraora | `10319` |
| **1017** | Ogerpon | Mask Choice (§3.2) | Wellspring / Hearthflame / Cornerstone Mask | `10273` / `10274` / `10275` |

### 3.2. Megas and forms added across the Shop (owner, 2026-11-07)

**Level rule (owner):** normal and rare Pokémon evolve every 5 levels; legendaries every 10; legendaries with a series of forms (Zygarde, Necrozma) every 5 so the line doesn't take forever. A new Mega therefore comes 5 levels after the current final form.

| Family | New path (level) |
|---|---|
| Venusaur, Blastoise, Alakazam, Gengar, Gyarados, Dragonite, Meganium, Feraligatr, Ampharos, Tyranitar, Sceptile, Blaziken, Swampert, Metagross, Emboar, Delphox, Greninja | final form (Lv 10) → Mega (Lv 15) |
| Charizard, Raichu (incl. the starter Pikachu) | Lv 15 choice: Mega X / Mega Y |
| Garchomp | Lv 15 choice: Mega Garchomp / Mega Garchomp Z |
| Clefable, Steelix, Houndoom | final form (Lv 5) → Mega (Lv 10) |
| Lucario | Lv 10 choice: Mega Lucario / Mega Lucario Z |
| Heracross, Mawile | Mega at Lv 5 (was Lv 10; moved to match the rule, owner 2026-11-07) |
| Absol | Lv 5 choice: Mega Absol / Mega Absol Z (was Lv 10) |
| Gardevoir, Gallade, Scizor, Slowbro | chosen at Lv 5 → their Mega at Lv 10 (Slowking, Kleavor have none) |
| Lycanroc, Toxtricity | Lv 5 choice: Midday / Midnight / Dusk; Amped / Low Key |
| Zeraora | Mega Zeraora at Lv 10 |
| Deoxys, Ogerpon | Lv 10 choice of Forme / Mask |
| Necrozma | Lv 5 choice Dusk Mane / Dawn Wings → Ultra Necrozma at Lv 10 (unchanged) |

**Engine:** an `options` entry may carry `next: [{ level, id, name }]`, the stages a chosen form evolves through. `resolveStageId()` (pokemon_data.js) is the single resolver used by `addXp`, the choice dialog (a partner already past a later stage lands on it) and diagnostics. Saved partners stay valid (Lycanroc `745` = Midday, Toxtricity `849` = Amped, Mega Absol `10057`, Ultra Necrozma `10157`). Partners already at or above a new Mega level get the Mega at their next level-up; lines that now end in a choice (Charizard, Raichu, Garchomp, Lucario) open the choice dialog on the next render. Covered by TC138.

Skipped on purpose: regional variants, Gigantamax, and in-battle form switches (Aegislash Blade, Mimikyu Busted, Ash-Greninja).

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
