# PRD: Parent Approval & Timed Grace Window for Past Day Editing

**Document**: `docs/prd_parent_past_day_approval.md`  
**Version**: 1.0.0  
**Status**: Decisions Locked — Ready for Implementation (not yet started)  
**Authors**: crsjain & Jetski  
**Target Systems**: `state.js` (Schema V18/V19), `app.js`, `admin.js`, `style.css`, `tests.js`  
**Companion Standards**: [`_agents/rules/ux-guidelines.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/_agents/rules/ux-guidelines.md) (Rules 6, 8, 10, 11, 12, 17), [`docs/prd_column_state_machine.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_column_state_machine.md)  

---

## 1. Executive Summary & Problem Statement

### 1.1 The Multi-Child Problem
The Kepler Pokémon Chart is deployed for siblings with different developmental capabilities:
* **Kepler (7yo)**: Possesses high intrinsic motivation, self-regulation, and honesty. He checks off chores as they are genuinely completed and can be trusted to navigate past days to record missed chores without adult supervision.
* **Lyra (5yo)**: Tactile, highly curious, and driven by immediate sensory feedback. If given the affordance, she clicks every available Pokéball on the screen—including retroactively checking uncompleted chores across past days.

### 1.2 Current System Vulnerability
Under the current Column State Machine ([`docs/prd_column_state_machine.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_column_state_machine.md)), past days in the active week are designated as `SELECTABLE_PAST`:
1. Clicking a past header or cell triggers a simple modal: *"Switch Day? 📅 Switch active day to Tuesday to check this task?"*.
2. A single tap on the primary button promotes that past day to `ACTIVE_PAST`.
3. In `ACTIVE_PAST`, all 5 task Pokéballs become fully interactive without further gates. A 5-year-old can easily spam-click 20+ past chores, artificially inflating XP, leveling up partner Pokémon, and undermining the habit-building integrity of the chart.

### 1.3 Proposed Solution (Option 2: Per-Profile Policy + Timed Grace Window)
1. **Per-Profile Configuration**: Add a profile-level setting `lockPastDays: boolean` (configured in Admin Profile Settings). Kepler stays on `false` (preserving his autonomy); Lyra is set to `true`.
2. **Parent Passcode Gate**: When `lockPastDays` is active, clicking any past header or cell prompts for the Parent Admin Passcode (`adminPassword`, default `"zxcv"`).
3. **Timed Grace Window (Parent Session)**: Entering the passcode successfully activates a **configurable Grace Window** (`1 / 2 / 5 minutes`, default **2 minutes**), configured per-profile in the Admin Panel. During this window, the parent and child can freely review and toggle any past tasks without repetitive passcode prompts.
4. **Bottom Floating Dock (UX Rule 17)**: A discreet, high-contrast session dock at the bottom of the screen displays remaining time (`🗝️ Parent Edit Active: 01:45`) with an instant `[Lock Now 🔒]` button.
5. **Auto-Relock & Auto-Return**: When the countdown reaches `0:00` (or if the user taps `[Lock Now]` or `[Back to Today]`), past editing immediately relocks, and the active column safely reverts to **Today**.

---

## 2. Architecture & State Management

### 2.1 State Schema Integration
To ensure complete backward compatibility with existing profiles and zero cloud sync friction:

* **Per-Profile State Architecture**: In this application, each profile owns its own complete, independent `state` blob in Firestore stored at `profiles.${profileId}.state` (see `saveProfileStateToCloud()` in [firebase.js](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/firebase.js)). Both feature settings reside as top-level fields on `state` and are strictly scoped to the active profile:
  - **`state.lockPastDays`** (type `boolean`, default `false`): Enables or disables the passcode gate on past days. Kepler remains on `false` (unrestricted); Lyra is set to `true` (passcode required).
    - **Defensive Fallback**: Read as `Boolean(state && state.lockPastDays)`. Undefined in legacy records or cloud state cleanly evaluates to `false`.
  - **`state.parentGraceMinutes`** (type `number`, default `2`, allowed values `[1, 2, 5]`): Duration of the grace window once unlocked. Configured per-profile so different children can have tailored edit windows (e.g. 1 minute for a younger child requiring closer supervision, 5 minutes for older children or comprehensive catch-up sessions).
    - **Defensive Fallback**: `const mins = [1, 2, 5].includes(state.parentGraceMinutes) ? state.parentGraceMinutes : 2;`
* **Zero Cross-Profile Leakage**: Because each profile carries its own state blob, setting either `lockPastDays` or `parentGraceMinutes` on one profile does not overwrite or affect another profile.
* **Zero Cloud Migration Overhead**: Does not require an immediate database rewrite or schema bump; defaults are handled gracefully on profile read/save and self-repaired by `runStateDiagnostics()`.

### 2.2 In-Memory Session State (Runtime Only)
The timed grace session is strictly **in-memory** and NEVER persisted to `localStorage` or Firebase:
```javascript
// Runtime-only session variables in app.js
let parentGraceExpiresAt = 0; // Epoch timestamp ms
let parentGraceIntervalId = null;

function getParentGraceMs() {
  const mins = [1, 2, 5].includes(state.parentGraceMinutes) ? state.parentGraceMinutes : 2;
  return mins * 60 * 1000;
}

export function isParentGraceActive() {
  return Date.now() < parentGraceExpiresAt;
}
```
*Rationale*: Storing session timers in memory guarantees that refreshing the page, closing the PWA, or switching devices immediately locks the chart, preventing stale unlocked sessions if a parent leaves the browser.

### 2.3 Interaction Flow Diagram

```mermaid
flowchart TD
    A[User clicks past header or past cell] --> B{lockPastDays enabled for active profile?}
    B -- No (e.g. Kepler) --> C[Show existing 'Switch Day? 📅' confirm modal]
    B -- Yes (e.g. Lyra) --> D{isParentGraceActive()?}
    D -- Yes (Timer Running) --> E[Directly switch day / toggle chore without modal]
    D -- No (Locked) --> F[Show promptParentPassword modal]
    F --> G{Password correct?}
    G -- No --> H[Show 'Wrong Code!' error]
    G -- Yes --> I[Start Grace Timer for configured duration]
    I --> J[Mount Bottom Floating Dock with countdown & Lock Now]
    I --> K[Switch activeDay to selected past day & toggle chore]
    
    J --> L{User taps Lock Now OR Back to Today?}
    L -- Yes --> M[Clear Timer, Unmount Dock, Revert to Today]
    J --> N{Timer reaches 0:00?}
    N -- Yes --> M
```

---

## 3. UI/UX Specifications (Adherence to [`ux-guidelines.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/_agents/rules/ux-guidelines.md))

### 3.1 Parent Floating Dock (UX Rule 17: Spatial Separation of Concerns)
* **Domain Quarantine**: The top viewport is strictly reserved for the child's Mini-HUD. The Parent Grace Dock floats anchored to the bottom center of the screen (`bottom: max(18px, env(safe-area-inset-bottom, 18px))`).
* **Visual Styling**:
  - Background: High-contrast Slate 800 (`rgba(30, 41, 59, 0.96)`) with subtle dark slate border, 24px pill radius, and `backdrop-filter: blur(8px)`.
  - Typography: Crisp white text (`#f8fafc`) with warning-amber icon (`#f59e0b`).
  - Timer Display: Monospace digital countdown (`01:45`) so characters do not jump width during ticks.
  - Action Button: Compact pixel button `.pixel-btn.small.danger` with text `Lock Now 🔒` (minimum 42px touch target per Rule 17).
* **Zero Inline Styles (Rule 8)**: All dimensions, paddings, and media queries defined in `style.css` under `.parent-grace-dock`.

### 3.2 Password Modal Copy (Rule 10 & 11: Tonal Matching)
* Modal title: `Parent Approval Required 🔒`
* Prompt description (duration injected dynamically from `state.parentGraceMinutes`):
  `Enter parent passcode to unlock editing for previous days (${mins}-minute window):`
* Primary CTA: `Unlock 🔓` (neutral slate/info styling, avoiding celebratory colors).
* Secondary CTA: `Cancel` (greyed-out).

### 3.3 Admin Panel Settings UI

Both settings are configured per-profile in the Admin Panel settings block for the active child:

**A. Per-Profile Policy Toggle**:
* **Label**: `🔒 Approve Past Days:`
* **Control**: Styled pixel toggle with label `Ask for passcode` (`#admin-lock-past-days-toggle`).
* **Subtext**: `Requires the parent passcode before this child can edit previous days. Recommended for younger children.`
* Persists to `state.lockPastDays` for the active profile on change.

**B. Per-Profile Grace Window Duration**:
* **Label**: `Parent Edit Window:`
* **Control**: `<select id="admin-parent-grace-select">` with options `1 min`, `2 min`, `5 min`.
* **Tooltip**: `How long past-day editing stays unlocked after entering the passcode.`
* Persists to `state.parentGraceMinutes` for the active profile on change, allowing parents to tailor the window to each child's supervision needs.

> [!NOTE]
> The Admin Panel is already dense, and this adds a second control to it. A dedicated left-nav restructure of the Admin Panel is tracked separately in [`docs/prd_admin_panel_redesign.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_admin_panel_redesign.md) and should absorb this setting when built.

---

## 4. 🏛️ Feature Review Panel: 5-Perspective Cross-Functional Review

Conducted per [`_agents/skills/feature-review-panel/SKILL.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/_agents/skills/feature-review-panel/SKILL.md):

### 🚦 Final Executive Verdict: **APPROVED WITH MITIGATIONS**

---

### Stage 1: 🧸 Child Development & Play Psychologist (Kepler & Lyra's Advocate)
* **Cognitive & Scan Friction**: 
  - For Kepler (7yo): Leaving his profile unrestricted (`lockPastDays: false`) is vital. Children who have demonstrated trustworthy self-regulation feel diminished when suddenly subjected to restrictive gates meant for toddlers.
  - For Lyra (5yo): The lock prevents accidental failure cycles where she clicks something she shouldn't, causing parental frustration. When dad unlocks it with her, it transforms chore verification into a warm, co-creative ritual.
* **Emotional Safety**:
  - When locked, tapping a past day must NOT trigger an aggressive "Access Denied" or alarm sound. It should display a calm, friendly prompt asking for parent verification.
* **Sibling Dynamics**:
  - Kepler will see that Lyra's chart requires dad's key while his does not, reinforcing positive maturity and responsibility without creating envy.
* **Verdict**: **PASS**

### Stage 2: 🎮 Game Economy & Habit Loop Designer (Incentive Architect)
* **Chore Priority Integrity**:
  - Eliminates the single largest XP leak in the system. A 5-year-old checking 5 past days could generate 250+ unearned XP, triggering premature evolutions and devaluing Kepler's hard work.
* **Economy Balance**:
  - Zero disruption to daily XP, Star Vault streaks, or Gym Badge progression.
* **Verdict**: **PASS**

### Stage 3: 🏡 Family Operations / "Weary Parent" (crsjain's Reality Check)
* **Parent Administrative Overhead**:
  - Entering a passcode once for a 120-second window is an order of magnitude better than entering a passcode 5 separate times for 5 individual chores.
* **Bedtime Friction & Walk-Away Risk**:
  - *Risk Identified*: If crsjain unlocks the chart, helps Lyra check Piano, and then leaves the room to brush his teeth while 50 seconds remain on the clock, Lyra has an open window to click everything else.
  - *Mitigation*: The floating dock MUST feature a prominent, single-tap **`[Lock Now 🔒]`** button. Additionally, tapping the existing **`[Back to Today]`** button will automatically terminate the grace window immediately.
* **Verdict**: **PASS WITH MITIGATION** (Prominent Lock Now button required).

### Stage 4: 🎨 Senior Staff UX Designer (Sensory & Layout Architecture)
* **UX Guidelines Compliance**:
  - **Rule 17 (Floating Bottom Dock)**: Dock sits at the bottom thumb zone, completely isolated from the top Mini-HUD.
  - **Rule 12 (Spacing & Shadow)**: Flex gap `10px`, zero child margins.
  - **Rule 13.C (Responsive Viewports)**: Floating dock centers with `max-width: 90vw` and wraps gracefully on mobile viewports $<480\text{px}$.
  - **Rule 8 (Zero Inline Styles)**: All rules reside in `style.css`.
* **Visual Clarity on Grid**:
  - *Question*: Should past headers have a visible lock icon?
  - *Recommendation*: Keep headers visually clean (Poké Blue) so the weekly chart remains readable; do not clutter headers with lock glyphs. The prompt on click is sufficient affordance.
* **Verdict**: **PASS**

### Stage 5: 🛠️ Senior Staff Engineer & Chaos Architect (Technical Gatekeeper)
* **Tech Debt & Complexity**:
  - Pure $O(1)$ runtime check. Adding `isParentGraceActive()` into `app.js` requires $<30$ lines of core logic.
  - No database migration required; backward compatible by default (`Boolean(state && state.lockPastDays)`).
* **Chaos & Rapid-Spam Edge Cases**:
  - *Timer Drift*: Use `Date.now() < parentGraceExpiresAt` for validity checks rather than relying purely on `setInterval` tick counts.
  - *Multi-Profile Switching*: If a user switches profile while a grace session is running, `parentGraceExpiresAt` MUST be immediately zeroed out to prevent leaking Lyra's unlocked state into Kepler or vice versa.
  - *Auto-Revert on Expiry*: If the timer expires while `state.activeDay` is pointing to a past day, the timer callback MUST safely call `state.activeDay = todayRealDay; saveState(); updateActiveColumnUI();` so the child is not stranded on an active past day.
  - *Duration Change Mid-Session*: Changing `parentGraceMinutes` in Admin while a session is live MUST NOT retroactively extend or truncate the running window; `parentGraceExpiresAt` is computed once at unlock time.
* **Automated Regression Test Plan (CDP Headless)**:
  - New **Test Case 82** in `tests.js` (use the existing `waitFor()` helper, not fixed sleeps, for any timer-driven assertions):
    1. Verify default profile has `lockPastDays: false` and opens standard confirm modal.
    2. Verify `state.parentGraceMinutes` defaults to `2`, and that `runStateDiagnostics()` repairs an invalid value (e.g. `7`) back to `2`.
    3. Set `lockPastDays: true`; verify past day cell click triggers `promptParentPassword`.
    4. Input incorrect password -> verify error message, day remains locked.
    5. Input correct password -> verify grace window activates, cell toggles, floating dock renders with countdown.
    6. Second past cell click within window -> toggles immediately without password prompt.
    7. Click `Lock Now` button -> verifies grace expires, dock unmounts, next past click prompts password.
    8. Force expiry (inject `parentGraceExpiresAt = Date.now() - 1`) -> verifies auto-revert to Today and auto-relock.
    9. Profile switch mid-session -> verifies `parentGraceExpiresAt` is zeroed and the next past click re-prompts.
* **Verdict**: **PASS**

---

## 5. Resolved Decisions (Locked 2026-09-20)

| # | Decision | Outcome | Rationale |
|---|---|---|---|
| 1 | **Grace Window Duration** | **Option C — Configurable Per-Profile** (`1 / 2 / 5 min`, default **2 min**) | Needs vary by child developmental stage; a per-profile dropdown allows tailoring supervision window to each child. |
| 2 | **Past Header Visuals When Locked** | **Option A — Clean & Unchanged** (Poké Blue, no lock glyph) | Keeps the weekly grid visually calm. A 5-year-old cannot read a lock icon anyway; the passcode modal on tap is the real affordance. |
| 3 | **Default for New Profiles** | **Option A — Default OFF (`false`)** | Preserves today's behavior for every existing profile and requires zero migration. Parents opt-in younger children explicitly. |
| 4 | **Timer Expiration Behavior** | **Option A — Auto-Revert to Today** | Guarantees a child is never left standing on an unlocked past column after the window closes. |

### 5.1 Implementation Order (when we start)
1. Schema + defensive fallbacks (`lockPastDays`, `parentGraceMinutes`) in `state.js` with `runStateDiagnostics()` validation.
2. Grace session module in `app.js` (`isParentGraceActive()`, start/clear, profile-switch teardown, auto-revert on expiry).
3. Gate the two existing past-day entry points: the cell handler (~[`app.js:1776`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js#L1776)) and the header handler (~[`app.js:2314`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js#L2314)).
4. Floating dock markup + `style.css` (`.parent-grace-dock`), zero inline styles.
5. Admin UI: policy toggle + duration dropdown (both live on the active profile's state blob).
6. Test Case 82 in `tests.js`; bump SW cache and asset query strings.

---

## 6. Open Follow-Ups
* **Admin Panel Redesign**: This feature adds two more controls to an already-crowded Admin Panel. A left-nav restructure is seeded in [`docs/prd_admin_panel_redesign.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/prd_admin_panel_redesign.md) for a future session.
