# 🧪 Manual & Automated Test Plan: Pokémon Shop Evolutions & Branching Modal

**Document**: `docs/test_plan_pokemon_shop_evolutions.md`  
**Feature Scope**: Priorities 1–6 Evolution Corrections, Restored Stages, Branching Evolution Modal, and Munchlax Bugfix  
**Version**: 1.0.0  
**Test Suite**: Test Case 81 in [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js)  
**Applicable Commits**: `480544a` (`prototype/pokemon-badge-collection`)  

---

## 🛠️ 1. Environment & Setup

* **Local App URL**: [http://crsjain.c.googlers.com:8000/](http://crsjain.c.googlers.com:8000/) (or `http://localhost:8000/`)
* **Parent Admin Passcode**: `zxcv`
* **Automated Runner**: `node run_headless_tests.js`
* **Cache Invalidation Check**:
  - Perform a hard refresh (<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd> or <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd>).
  - Verify Service Worker is at `poke-chart-cache-v148`.
  - Verify asset URLs load with `style.css?v=10.42` and `app.js?v=10.35`.

---

## 📋 2. Summary of Key Changes to Validate

| Priority | Pokémon Line | Change Description | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **P1** | Clefairy (`#35`) ➔ Clefable (`#36`) | Single stage evolution added | Clefairy evolves at LV 5 into Clefable; Clefairy has `✨` in shop. |
| **P1** | Mawile (`#303`) ➔ Mega Mawile (`#10052`) | Mega evolution added | Mawile evolves at LV 10 into Mega Mawile; Mawile has `✨` in shop. |
| **P1** | Absol (`#359`) ➔ Mega Absol (`#10057`) | Mega evolution added | Absol evolves at LV 10 into Mega Absol; Absol has `✨` in shop. |
| **P2** | Togepi (`#175`) ➔ Togetic (`#176`) ➔ Togekiss (`#468`) | 3-stage progression completed | Togepi evolves to Togetic at LV 5, then Togekiss at LV 10. |
| **P3** | Abra (`#63`) ➔ Kadabra (`#64`) ➔ Alakazam (`#65`) | Middle stage restored | Kadabra is no longer skipped at LV 5; Alakazam evolves at LV 10. |
| **P3** | Machop (`#66`) ➔ Machoke (`#67`) ➔ Machamp (`#68`) | Middle stage restored | Machoke is no longer skipped at LV 5; Machamp evolves at LV 10. |
| **P3** | Grubbin (`#736`) ➔ Charjabug (`#737`) ➔ Vikavolt (`#738`) | Middle stage restored | Charjabug is no longer skipped at LV 5; Vikavolt evolves at LV 10. |
| **P4** | Slowpoke (`#79`) ➔ Slowbro (`#80`) OR Slowking (`#199`) | Branching evolution at LV 5 | Auto-triggers the Eevee branching modal; trainer selects form. |
| **P4** | Scyther (`#123`) ➔ Scizor (`#212`) OR Kleavor (`#900`) | Branching evolution at LV 5 | Auto-triggers the Eevee branching modal; trainer selects form. |
| **P5** | Galarian Zigzagoon (`#10174`) ➔ G. Linoone (`#10175`) ➔ Obstagoon (`#863`) | Base card replaced | G. Zigzagoon is the buyable base shop card; Obstagoon is LV 10. |
| **P5** | Kubfu (`#891`) ➔ Single Strike (`#892`) OR Rapid Strike (`#10191`) | Legendary branching at LV 10 | Kubfu is buyable base card (15 ⭐); branches at LV 10 via modal. |
| **P6** | Munchlax (`#446`) | Missing type bugfix | Munchlax now has `"Normal"` type assigned (proper badge styling). |

---

## 🔍 3. Manual Validation Scenarios

### 🛒 Scenario A: Star Vault Pokémon Shop Sparkles & Isolation

1. Open the Kepler Chart in your browser.
2. Scroll to the **Star Vault** section and click **🛍️ Open Pokémon Shop**.
3. **Verify Evolution Sparkles (`✨`) on Base Forms**:
   - [ ] Locate **Clefairy (`#35`)**: Shows `✨` sparkle and tooltip `"Can evolve! ✨"`.
   - [ ] Locate **Mawile (`#303`)**: Shows `✨` sparkle.
   - [ ] Locate **Absol (`#359`)**: Shows `✨` sparkle.
   - [ ] Locate **Togepi (`#175`)**: Shows `✨` sparkle.
   - [ ] Locate **Abra (`#63`)**, **Machop (`#66`)**, **Grubbin (`#736`)**: Show `✨` sparkle.
   - [ ] Locate **Slowpoke (`#79`)** and **Scyther (`#123`)**: Show `✨` sparkle.
   - [ ] Locate **Galarian Zigzagoon (`#10174`)**: Shows `✨` sparkle (replaces Obstagoon).
   - [ ] Scroll to the Legendary section and locate **Kubfu (`#891`)**: Cost is 15 ⭐ and shows `✨` sparkle.
4. **Verify Evolved Forms are Strictly Excluded**:
   - [ ] Search / scan the shop: Confirm **Clefable**, **Mega Mawile**, **Mega Absol**, **Togekiss**, **Kadabra**, **Machoke**, **Charjabug**, **Slowbro**, **Slowking**, **Scizor**, **Kleavor**, **Galarian Linoone**, **Obstagoon**, and **Urshifu** are **NOT** sold as base cards.
5. **Verify Confirmation Dialog Sparkle**:
   - [ ] Click on **Scyther (`#123`)** (or **Clefairy**).
   - [ ] The purchase confirmation popup appears.
   - [ ] Confirm title shows `Scyther ✨` with the animated sparkle badge next to its name.
   - [ ] Click **Cancel**.
6. Close the shop modal.

---

### 🌟 Scenario B: Branching Evolution Modal (Scyther ➔ Scizor or Kleavor)

This scenario demonstrates how branching evolutions appear and function in the evolution modal.

#### Modal Visual Architecture

When a Pokémon with branching options reaches the threshold (LV 5 for Scyther/Slowpoke, LV 10 for Kubfu), the **Eevee Branching Modal (`#eevee-modal`)** dynamically opens:

```
┌───────────────────────────────────────────────────────────────────┐
│                           ✨ Evolve Scyther! ✨                   │
│               Choose your Scyther's evolution form:               │
│                                                                   │
│   ┌───────────────────────────┐   ┌───────────────────────────┐   │
│   │           [ 🖼️ ]          │   │           [ 🖼️ ]          │   │
│   │    Official PokeAPI       │   │    Official PokeAPI       │   │
│   │     Scizor Artwork        │   │     Kleavor Artwork       │   │
│   │                           │   │                           │   │
│   │          Scizor           │   │          Kleavor          │   │
│   │       (Bug / Steel)       │   │        (Bug / Rock)       │   │
│   └───────────────────────────┘   └───────────────────────────┘   │
│            (Option 1)                      (Option 2)             │
└───────────────────────────────────────────────────────────────────┘
```

#### Step-by-Step Test Procedure:

1. Open DevTools Console (<kbd>F12</kbd> or <kbd>Cmd</kbd> + <kbd>Opt</kbd> + <kbd>I</kbd>).
2. Set your active partner to Scyther at Level 4, 95 XP (1 task check away from LV 5):
   ```javascript
   window.__app_state__.activePartnerInstanceId = 'scyther_test';
   window.__app_state__.partnersData['scyther_test'] = {
     familyId: '123',
     level: 4,
     xp: 95,
     stageId: '123'
   };
   window.__test_helpers__.renderState(false);
   ```
3. Look at the chart UI:
   - [ ] The active partner card shows **Scyther (`#123`)** at Level 4.
   - [ ] Evolution helper below the partner says:
     `✨ Next Evolution: Evolution Choice at LV 5 (1 level to go!)`
4. On the current active day (e.g. Wednesday), check any chore box (e.g. Piano):
   - [ ] Scyther gains 5 XP $\rightarrow$ reaches **Level 5**!
   - [ ] The **Branching Evolution Dialog** opens automatically with a smooth backdrop!
   - [ ] Modal title reads: **`Evolve Scyther! ✨`**
   - [ ] Subtitle reads: **`Choose your Scyther's evolution form:`**
   - [ ] Two clickable cards are displayed side by side:
     1. **Scizor**: Official Scizor artwork with Bug styling.
     2. **Kleavor**: Official Kleavor artwork with Rock styling.
5. Click the **Kleavor** option card:
   - [ ] The branching modal smoothly dismisses.
   - [ ] Celebration fireworks burst across the screen and the evolution chime plays.
   - [ ] Notification banner appears:
     `✨ SCYTHER EVOLVED! ✨`  
     `Congratulations! Trainer's Scyther evolved into Kleavor!`
   - [ ] Partner avatar updates to **Kleavor (`#900`)**.
   - [ ] Partner name displays **Kleavor**.
   - [ ] Evolution helper updates (no further evolution).
6. **Test Devolution**:
   - [ ] Uncheck the task cell that pushed Scyther to LV 5:
   - [ ] Scyther drops to Level 4 (95 XP).
   - [ ] Partner automatically devolves back to **Scyther (`#123`)**.
   - [ ] Partner name reverts to **Scyther**.
   - [ ] Avatar reverts to Scyther artwork.

---

### 🐢 Scenario C: Branching Evolution Modal (Slowpoke ➔ Slowbro or Slowking)

1. Set active partner to Slowpoke at Level 4, 95 XP:
   ```javascript
   window.__app_state__.activePartnerInstanceId = 'slowpoke_test';
   window.__app_state__.partnersData['slowpoke_test'] = {
     familyId: '79',
     level: 4,
     xp: 95,
     stageId: '79'
   };
   window.__test_helpers__.renderState(false);
   ```
2. Check any chore box on the active day:
   - [ ] Slowpoke reaches **Level 5**.
   - [ ] Modal opens: **`Evolve Slowpoke! ✨`**
   - [ ] Two options appear: **Slowbro** (`#80`) and **Slowking** (`#199`).
3. Click **Slowking**:
   - [ ] Evolution celebration triggers with Slowking artwork.
   - [ ] Partner card displays **Slowking**.
4. Uncheck the chore box:
   - [ ] Drops to Level 4 $\rightarrow$ Partner devolves back to **Slowpoke**.

---

### 🥊 Scenario D: Branching Legendary Evolution (Kubfu ➔ Single Strike or Rapid Strike Urshifu)

1. Set active partner to Kubfu at Level 9, 95 XP:
   ```javascript
   window.__app_state__.activePartnerInstanceId = 'kubfu_test';
   window.__app_state__.partnersData['kubfu_test'] = {
     familyId: '891',
     level: 9,
     xp: 95,
     stageId: '891'
   };
   window.__test_helpers__.renderState(false);
   ```
2. Check any chore box on the active day:
   - [ ] Kubfu reaches **Level 10**.
   - [ ] Modal opens: **`Evolve Kubfu! ✨`**
   - [ ] Two options appear:
     - **Single Strike Urshifu (`#892`)**
     - **Rapid Strike Urshifu (`#10191`)**
3. Click **Rapid Strike Urshifu**:
   - [ ] Evolution celebration triggers with Rapid Strike Urshifu artwork.
   - [ ] Partner name displays **Urshifu (Rapid)** or **Rapid Strike Urshifu**.
4. Uncheck chore box:
   - [ ] Partner devolves back to **Kubfu**.

---

### 🐣 Scenario E: 3-Stage Progression (Togepi Line)

1. Set active partner to Togepi at Level 4, 95 XP:
   ```javascript
   window.__app_state__.activePartnerInstanceId = 'togepi_test';
   window.__app_state__.partnersData['togepi_test'] = {
     familyId: '175',
     level: 4,
     xp: 95,
     stageId: '175'
   };
   window.__test_helpers__.renderState(false);
   ```
2. Check chore box $\rightarrow$ Partner reaches **Level 5**:
   - [ ] Partner evolves directly into **Togetic (`#176`)** with evolution celebration.
   - [ ] Evolution helper indicates: `✨ Next Evolution: Togekiss at LV 10 (5 levels to go!)`.
3. Advance Togetic to Level 9, 95 XP:
   ```javascript
   window.__app_state__.partnersData['togepi_test'].level = 9;
   window.__app_state__.partnersData['togepi_test'].xp = 95;
   window.__test_helpers__.renderState(false);
   ```
4. Check another chore box $\rightarrow$ Partner reaches **Level 10**:
   - [ ] Partner evolves into **Togekiss (`#468`)** with evolution celebration!
   - [ ] Partner name displays **Togekiss**.

---

### 🦡 Scenario F: Galarian Zigzagoon Base Card & Obstagoon Line

1. Set active partner to Galarian Zigzagoon:
   ```javascript
   window.__app_state__.activePartnerInstanceId = 'gzigzagoon_test';
   window.__app_state__.partnersData['gzigzagoon_test'] = {
     familyId: '10174',
     level: 4,
     xp: 95,
     stageId: '10174'
   };
   window.__test_helpers__.renderState(false);
   ```
2. Check chore box $\rightarrow$ Reaches **Level 5**:
   - [ ] Evolves to **Galarian Linoone (`#10175`)**.
3. Advance to Level 9, 95 XP and check chore box $\rightarrow$ Reaches **Level 10**:
   - [ ] Evolves to **Obstagoon (`#863`)**!

---

### 🍽️ Scenario G: Munchlax Type Display Bugfix (Priority 6)

1. Set active partner to Munchlax:
   ```javascript
   window.__app_state__.activePartnerInstanceId = 'munchlax_test';
   window.__app_state__.partnersData['munchlax_test'] = {
     familyId: '446',
     level: 1,
     xp: 0,
     stageId: '446'
   };
   window.__test_helpers__.renderState(false);
   ```
2. Inspect the Partner Card and Partner Showcase:
   - [ ] Type badge renders **Normal** with solid background styling (e.g. `.type-normal`).
   - [ ] No undefined or missing type labels appear.

---

## 🤖 4. Automated Headless Regression Suite Verification

To execute the entire 81-test end-to-end regression suite (including automated verification of all static schemas, shop sparkles, branching modal selections, and multi-stage lifecycle):

```bash
cd /usr/local/google/home/crsjain/kepler-pokemon-chart
node run_headless_tests.js
```

### Expected Output:
```text
Profiles loaded! Count: 2. Starting suite...
...
Running Test Case 81: Priorities 1-6 Pokémon Shop Evolutions & Branching Modal...
✅ Passed: Pokemon 36 should be Clefable
✅ Passed: Pokemon 10052 should be Mega Mawile
✅ Passed: Pokemon 10057 should be Mega Absol
✅ Passed: Pokemon 468 should be Togekiss
✅ Passed: Pokemon 64 should be Kadabra
✅ Passed: Pokemon 67 should be Machoke
✅ Passed: Pokemon 737 should be Charjabug
✅ Passed: Pokemon 199 should be Slowking
✅ Passed: Pokemon 900 should be Kleavor
✅ Passed: Pokemon 891 should be Kubfu
✅ Passed: Pokemon 892 should be Single Strike Urshifu
✅ Passed: Pokemon 10191 should be Rapid Strike Urshifu
✅ Passed: Pokemon 10174 should be Galarian Zigzagoon
✅ Passed: Pokemon 10175 should be Galarian Linoone
✅ Passed: Munchlax (446) type should be Normal
...
✅ Passed: Eevee modal should open for Slowpoke evolution
✅ Passed: Slowpoke should offer exactly 2 branching options
✅ Passed: Slowpoke should have evolved to Slowking (199)
✅ Passed: Eevee modal should open for Scyther evolution
✅ Passed: Scyther should offer exactly 2 branching options (Scizor and Kleavor)
✅ Passed: Scyther should have evolved to Kleavor (900)
✅ Passed: Eevee modal should open for Kubfu evolution
✅ Passed: Kubfu should offer 2 Urshifu forms
✅ Passed: Kubfu should have evolved to Rapid Strike Urshifu (10191)
...
🎉 All regression tests passed successfully! Grid performance is optimized.
✅ Tests passed successfully!
```

---

## 📌 5. Test Sign-Off Checklist

- [ ] All 81 automated headless tests pass with 0 failures (`node run_headless_tests.js`).
- [ ] Shop displays `✨` sparkle on all 11 basic Pokémon families that can evolve.
- [ ] Evolved forms (Megas, Stage 1/2, Obstagoon, Urshifu) are not purchasable in the shop.
- [ ] Branching evolution modal opens seamlessly for Slowpoke, Scyther, and Kubfu.
- [ ] Selected branching form correctly updates the avatar, name, and level metadata.
- [ ] Devolving restores the base form when chore checks are toggled off.
- [ ] Munchlax renders with `"Normal"` typing without visual defects.
