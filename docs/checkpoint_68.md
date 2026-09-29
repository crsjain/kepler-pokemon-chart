# CHECKPOINT 68

This document contains a complete, chronological record of user requests, system configurations, version progress, and active schema definitions for the application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **Full UX revamp of the Parent Admin Panel — assessment & proposal**: crsjain: *"The current UX does not look cohesive across all tabs … I want a full UX revamp … cohesive and easy to use, taking each form factor into consideration."* A Sr UX Designer audited every tab and stacked flow at 5 form factors (104 screenshots) and wrote a proposal; a second Sr UX Designer reviewed it (Approve with changes, 7 blocking items), the author revised it (rev 2), and the 5-expert `feature-review-panel` approved it with mitigations. Artifacts (outside the repo, in the Jetski brain dir `~/.gemini/jetski/brain/242849bf-ee60-41ae-918c-5f6fbc913648/`): `admin_ux_revamp_proposal.md` (rev 2 + **§13 Owner decisions**), `admin_ux_revamp_review.md`, `admin_ux_revamp_panel_review.md` (incl. the Batch 2 mitigation list), `screenshots/`.
- [x] **Owner decisions (locked 2026-09-28/29)**: tablet → desktop → phone priority; **draft + sticky Save bar** (no auto-save); **activity reordering wanted** (▲▼); **fold Passcode into Family** (6 → 5 tabs); Chart Style placeholder → **bottom of Activities**; keep **"Set Exceptions" / "EDIT MODE"**; **2-second hold** on Delete child / Reset; Poké Blue `#2a71d0` primary **Admin only**; rewards for a non-active child keep the **pop-up editor**; **restyle both passcode prompts**; Add child from Admin **does not switch** profiles; **no file backups** for now; ship in **two batches**.
- [x] **Batch 1 (Phases 0a + 0b) — shipped this checkpoint**:
  - **Phase 0a (`22c6c2b`)**: kid-facing draft-leak fix. Unsaved Add/Remove Activity no longer reaches the kid's chart/stars; Save merges by id; reward rename uses a temp selection. **TC96**.
  - **Phase 0b (`a42c536`)**: admin design tokens + button dialect, passcode prompt restyle (both paths), `adminNotice()` "Got it", Esc layering guard, sticky Save, tablet-portrait top tabs. **TC97**.
  - **White buttons read as form fields (`1edba3a`)**: crsjain: *"I'm not a huge fan of the white buttons as they can easily be mistaken for form fields."* Chose **option A — tonal blue** secondaries; admin fields made flat + labelled.
  - **Labelled Children row buttons (`fac4c0e`)**: crsjain asked for text buttons now that there's space → `Edit Rewards` / `Delete` + `Active` pill.
- [ ] **Batch 2 (Phases 1–5)**: deferred by design — owner uses Batch 1 for a day or two first. Phase 1 components + Settings/Data (restore dialog replacing `prompt()`, "Reload latest version" guard), Phase 2 Activities draft model (three-outcome unsaved guard, ▲▼ reorder, Chart Style to bottom, CSS dirty dot), Phase 3 IA (Family tab with passcode card, Add child in Admin without re-prompt, responsive nav, Android back, roving focus), Phase 4 inline rewards editor for the active child, Phase 5 hold-to-confirm + polish. Apply the panel's Batch 2 mitigations (top item: a test proving no guard appears on a clean Set Exceptions path).

### Known Follow-ups / Nice-to-haves

- [ ] **Closing Admin with unsaved activity edits discards them silently** until Phase 2's guard lands (sticky Save mitigates).
- [ ] Settings cards stack in one ≤600px column on tablet/desktop (220px selects no longer fit two across) — revisit with Phase 1 card components.
- [ ] Other inline `z-index` styles (Rule 8 debt) outside `#password-modal` — Phase 5.
- [ ] `viewport-fit=cover` and SVG icon sprite deliberately kept out of Batch 1 (kid HUD notch risk) — Phase 3.
- [ ] Carried: **Chart Style (under 5)** needs its own PRD before it's built.
- [ ] Carried: logged-in manual check of the per-child reset (and now the Activities merge-by-id save) against real Firestore.
- [ ] Carried: ~8 s zero-risk harness savings (assessment §6.1).
- [ ] Fold the revamp proposal into `docs/prd_admin_panel_redesign.md` v2.0 when Batch 2 starts.

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Production Branch**: `main`
*   **Target Audience**: Kepler (7yo) & Lyra (5yo)
*   **Current Version**: `v1.10.28` / Service Worker cache **`poke-chart-cache-v183`** / Asset tags `style.css?v=10.70`, `app.js?v=10.60` (+ all 13 `<script type="importmap">` entries `?v=10.60`), `particles.js?v=10.4`
*   **Admin Password**: `"zxcv"`
*   **Local Server URL**: `http://localhost:8000/` (or `http://crsjain.c.googlers.com:8000/`)
*   **Git Policy**: Committed to `prototype/pokemon-badge-collection`, merged to `main`. No mid-session pushes. Stage explicit paths, never `git add -A`.
*   **Commit Identity**: local `crsjain <crsjain@gmail.com>`.
*   **Audio/Volume Settings**: Unchanged.
*   **Test Suite**: **85 blocks, 84 unique numbers** (`dupes:12` expected; gaps `40, 43, 44` historical; max **97**, next free **98**). **~27 s.**

---

## 3. Active V19 State Schema

Unchanged from [Checkpoint 64 §3](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_64.md). No new persisted field and no migration (drafts live in the DOM / module-local temps only).

---

## 4. Work Accomplished

### Phase 0a — Draft-leak hotfix (`22c6c2b`)
* **`admin.js`**: `addNewTask` appends a DOM-only row (`data-new="1"`, temp id `task_<ts>_<seq>`); removing an existing row confirms then hides it (`data-removed="1"`); neither touches `state.tasks`. `saveAdminTasks` validates everything first, then merges by id onto the current `state.tasks` (soft-delete removed, update edited, reactivate a soft-deleted name match, slug id for new rows, keep tasks not in the list). A row whose task was deleted elsewhere gets `.admin-task-conflict` inline + a "Couldn't Save ⚠️" notice, and nothing is written. New `closeAdminPanel()` (Close, ✕, backdrop, Esc) hides and rebuilds from `state`, discarding drafts. Removing an unsaved new row skips the confirm.
* **`rewards_admin.js`**: inline rename edits `tempSelectedReward` / `tempSelectedMega`; `state.reward` / `megaReward` change only on Save (and only if a snapshot hasn't changed them); Cancel clears temps.
* **`tests.js`**: **TC96** (unsaved add/remove + close, reward rename + cancel, merge with a remote snapshot, reactivation, conflict path). TC58's `state.tasks.pop()` cleanup replaced with a byte-identical-state assert.

### Phase 0b — Admin tokens & hygiene (`a42c536`)
* **`style.css`**: scoped `--adm-*` tokens on `#admin-modal`, `#edit-rewards-modal`, `#password-modal`, `#confirm-modal[data-surface="admin"]`, `.notif-modal.adm-surface`; button variants `adm-primary` / `adm-secondary` / `adm-tertiary` / `adm-danger` / `adm-quiet-danger` / `adm-icon-btn`; 2px `#1d4f90` focus ring; neutral 44px ✕; past-day checkbox → switch; 220px selects; sticky `.admin-tasks-actions`; CSS-only top tabs for 768–899px portrait and `max-height: 500px` landscape; `#password-modal` z-index moved from inline to CSS (170000). Global `.pixel-btn` / `.greyed-out` untouched — kid dialogs pixel-identical (0 px diff on chart, Switch Day?, kid + level-up notifications).
* **`app.js` / `admin.js` / `rewards_admin.js`**: `showCustomConfirm` sets/clears `data-surface` on every open; admin confirms pass `{surface:'admin'}`; `adminNotice()` helper ("Got it", secondary) for admin error/warning notices; admin Escape bails while a higher modal is open; `role="dialog"` / `aria-modal` on Admin.
* **`index.html`**: passcode prompt → "Parent passcode 🔑", Unlock / Cancel, calm inline error (both Admin entry and past-day grace).
* **`tests.js`**: **TC97** (button mapping, one primary per pane, kid colours unchanged, Esc layering, "Got it", sticky Save, 44px targets, passcode prompt).

### Tonal-blue secondaries & flat fields (`1edba3a`)
* **`style.css`**: `adm-secondary` → `#e3edfb` fill, `#1d4f90` text (6.9:1), `#2a71d0` border, `#1d4f90` 3px pixel shadow. Admin fields (inputs, selects, task inputs, rewards add-row, passcode prompt) → flat 1.5px `#7d8ca3` border (3.4:1), inset shadow, left-aligned. New `.adm-field` / `.adm-field-label`.
* **`index.html`**: visible "New passcode" label; 📤 / 📥 on Export / Import. **`tests.js`**: TC97 expects the tonal fill on "Got it".

### Labelled Children row actions (`fac4c0e`)
* **`app.js`** `renderAdminProfilesList`: `Edit Rewards` (`adm-secondary adm-text-btn`) and `Delete` (`adm-quiet-danger adm-text-btn`) with icons; `(Active)` → `Active`. Classes `.edit-rewards-btn` / `.delete-profile-btn` and `data-id` unchanged.
* **`style.css`**: `.adm-text-btn` (44px, icon + label), green `Active` pill, actions wrap under the name below 520px.

---

## 5. Files and Code

### Created Files
* [`docs/checkpoint_68.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/docs/checkpoint_68.md): This checkpoint document.

### Edited Files
* [`admin.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/admin.js): draft-only activities, merge-by-id save, `closeAdminPanel()`, `adminNotice()`, Esc guard.
* [`rewards_admin.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/rewards_admin.js): temp reward selection; admin notices.
* [`app.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/app.js): `data-surface` on confirms, labelled profile-row buttons.
* [`index.html`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/index.html): button variants on admin markup, passcode prompt, passcode label, icons, asset tags.
* [`style.css`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/style.css): admin tokens/buttons/fields/responsive rules.
* [`service-worker.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/service-worker.js): `CACHE_NAME` → `poke-chart-cache-v183`.
* [`tests.js`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/tests.js): TC96, TC97, TC58 cleanup.
* [`README.md`](file:///usr/local/google/home/crsjain/kepler-pokemon-chart/README.md): Parent Admin Panel bullets.

---

## 6. Validation Instructions

1. **Cache**: hard-refresh `https://crsjain.github.io/kepler-pokemon-chart/` and confirm `poke-chart-cache-v183`.
2. **Draft safety**: Admin → Activities → Add Activity → Close without saving → the chart shows no "New Activity" and the day's star is unaffected. Repeat with Remove.
3. **Styling**: every tab has at most one solid blue button; routine buttons are tonal blue; fields are flat, left-aligned; Close/Cancel are white; red only in the Danger Zone and destructive confirms.
4. **Passcode prompts**: tap ⚙️ and a past day (with Approve Past Days on) → both show "Parent passcode 🔑" with Unlock / Cancel; a wrong code shows a quiet inline line.
5. **Children**: rows show `Edit Rewards` / `Delete` and an `Active` pill; on a phone the buttons sit under the name.
6. **Form factors**: portrait iPad shows top tabs; landscape phone shows a compact sheet with reachable lists.
7. **Kid screens**: the chart, Switch Day?, and kid notifications look exactly as before.
8. **Automated Suite**: run `node run_headless_tests.js`; verify 100% pass (85 blocks, 84 unique numbers, including TC96 and TC97).
