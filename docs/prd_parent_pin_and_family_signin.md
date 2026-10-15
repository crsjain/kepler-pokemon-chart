# PRD: Parent PIN & Family Sign-in

**Status:** Shipped on `prototype/pokemon-badge-collection` (2026-10-15). Owner: crsjain.
**Supersedes:** the per-child "parent passcode" model described in
[`prd_parent_past_day_approval.md`](prd_parent_past_day_approval.md) §2 and
[`prd_admin_panel_redesign.md`](prd_admin_panel_redesign.md) §11 (Q11 passcode card).

## 1. Problem

The app had two secrets with no in-app explanation:

1. **Family login.** A Firebase Auth email + password that guards Firestore from the internet. It could not be changed or reset in the app.
2. **Parent passcode.** A string (`state.adminPassword`, default `"zxcv"`) that gates Admin, past-day approval and "+ Add Child". It's checked client-side against *whichever child's state is loaded*.

The passcode was meant to be family-wide but was stored per child, and the copies drifted apart:

| # | Drift path | Status |
| :--- | :--- | :--- |
| D1 | New children were seeded from the template (`zxcv`) | **Fixed:** they inherit `getParentPasscode()` |
| D2 | Picker "+ Add Child" on a cold boot checked the module default (`zxcv`) | **Fixed:** every gate checks the family PIN |
| D3 | Per-child "Restore from code" brought back the backup's passcode | **Fixed:** restore keeps the family PIN |
| D4 | Family restore (`setDoc`) brings back the passcode from export time | Accepted: whole-family restore is intentionally total |
| D5 | Stale whole-state writes could revert one child's copy | **Fixed by construction:** child copies are no longer authoritative |

"Sign Out Family" was also ungated. Kids can reach it through Switch Trainer, and signing a tablet out forces the long family password.

## 2. Owner decisions (2026-10-15)

| # | Decision |
| :--- | :--- |
| P1 | **One family-wide Parent PIN of 4–6 digits**, entered on an **on-screen number keypad**. |
| P2 | Family sign-in stays a separate secret, **"once per device"**, with **both** a reset email and an in-app change-password form. |
| P3 | The prod and staging family inboxes are monitored, so the reset email is a valid recovery path. |
| P4 | **Sign Out Family asks for the Parent PIN.** |

## 3. Design

### 3.1 Source of truth

- The family PIN lives at the **doc-level** field `users/{uid}.adminPassword`. `saveAdminPasswordToCloud` already wrote this field; until now it was never read.
- `subscribeToProfiles` passes it as `familyMeta.adminPassword`, and `handleProfilesUpdate` calls `setFamilyPasscode()` (admin.js) before the picker or any prompt can open.
- `getParentPasscode()` precedence: **family field → active child's `state.adminPassword` → `ADMIN_PASSWORD`**. Families that never changed their passcode keep working with no migration.
- Changing the PIN sets the family value optimistically and writes **only the doc-level field** (`buildFamilyPasscodeUpdate`). Since §7 Phase 2, per-child copies are no longer written: new children and per-child restores carry none, and existing copies are read only as a fallback until Phase 3 removes them.
- Signing out clears the family PIN in memory.
- **No schema bump.** The field is doc-level, outside `state`, so `LATEST_SCHEMA_VERSION` stays V19.

### 3.2 Prompt modes (`#password-modal`)

| Stored value | Mode | UI |
| :--- | :--- | :--- |
| 4–6 digits | **PIN** (`.pin-mode`) | `#password-keypad` (1–9, Clear, 0, ⌫; 56px keys). The input has `inputmode="none"` so the tablet's soft keyboard never covers the keypad, while a physical keyboard still types. Non-digits are stripped. Entry **auto-submits** at the stored PIN's length. |
| Anything else (`zxcv`, old text passcodes) | **Legacy** | The text field as before, plus `#password-legacy-hint` ("Set a 4–6 digit PIN in Admin › Family…"). Admin › Family shows `#admin-pin-status`. |

A wrong entry shows the inline "That's not the code — try again." line, clears the field and refocuses it. Since 2026-10-15 the line is a **burnt-orange warning** (`#c2410c` on an amber tint `#fff7ed` with a `#ea580c` border; 4.88:1, AA), so a parent can't miss it. It's still never red, with no shake, animation or sound (Q8; Rule 11 warning tone).

Title: "Parent PIN 🔑". Gates and copy:

- Admin entry: "Enter the Parent PIN to open Admin."
- Past-day approval: "…unlock editing for previous days (N-minute window):"
- Picker "+ Add Child": "…add a child."
- Sign Out Family: "…sign this device out."

### 3.3 Admin › Family

- **Parent PIN 🔑** card: New PIN / Confirm (numeric, `maxlength=6`). Validation: empty → "Enter a new PIN."; not 4–6 digits → "Use 4 to 6 digits (numbers only)."; mismatch → inline error. Success shows the "PIN Updated 🔑" toast.
- **Family sign-in ✉️** card (`#admin-signin-card`):
  - Shows the signed-in email.
  - **Send reset email** (secondary): 30 s cooldown, inline confirmation.
  - **Change password** (secondary): reveals Current / New (≥6) / Confirm with **Update password** as the card's only primary. It re-authenticates, then calls `updatePassword`.
  - Copy warns that changing the password **signs out every other device** (Firebase revokes their refresh tokens).
  - Both actions are disabled when the device isn't signed in.
- Firebase errors map to calm copy through `describeAuthError()` (admin.js): `too-many-requests`, `invalid-credential`, `network-request-failed`, `weak-password`, and others.

### 3.4 Family login modal

- Inline styles moved to `style.css` (Rule 8).
- New subtitle: "Sign in once on each device… Daily approvals use the Parent PIN."
- **Forgot password?** is a 44px text link. It emails a reset link to the typed address through `sendPasswordResetEmail`, using Firebase's hosted action page. It's throttled to one send per 30 s. In emulator mode, the link appears in the emulator log.
- Enter in the password field submits. Raw Firebase error strings are replaced with mapped copy.

## 4. Threat model

The PIN is a **speed bump for a 7-year-old**, not security. Firestore rules check only the family UID, so devtools on a signed-in tablet bypasses it. The family sign-in is the real boundary against strangers on the internet. A numeric PIN is easier to shoulder-surf, so masked input and auto-submit keep the entry short. Change the PIN if Kepler learns it.

## 5. Tests

- **TC110:**
  - Family PIN precedence over a drifted child copy.
  - Snapshot meta handling (`null` falls back; no meta leaves the PIN untouched).
  - The picker's "+ Add Child" rejects `zxcv`.
  - The Sign Out gate (Cancel and a wrong PIN never reach the confirm).
  - A new child inherits the PIN.
  - A per-child restore keeps the PIN.
- **TC111:**
  - Keypad layout, size and Rule 8.
  - Append, ⌫ and Clear.
  - Auto-submit on wrong and right entries.
  - Physical-keyboard digit stripping.
  - Legacy mode (no keypad, hint shown, letters allowed).
  - The Family-card nudge.
- **TC112:**
  - Login modal Rule 8, copy and 44px link.
  - Forgot password: empty email, success, throttle, mapped error.
  - Admin card when signed out (disabled) and signed in.
  - Reset email with cooldown.
  - Change-password validation, wrong current password, success toast.
- **Updated:** TC50 and TC100 (numeric PINs, new copy, reset `setFamilyPasscode(null)`); TC97 (title "Parent PIN 🔑"); the TC98 export-hint copy.
- **TC114** (§7 Phase 1): backfill resolver, write-if-absent cases, skipped transaction, retry after failure, family-restore normalisation (unit + end to end).
- **TC115** (§7 Phase 1): Forgot PIN? link (always shown; signed out → hint + Sign in hand-off to Family sign-in; 44px, Rule 8), forgot mode swap, empty/wrong password copy, success → Admin › Family with New PIN focused, reset on reopen.
- **Seams:** `setEnsureFamilyPasscodeMock(fn | null)`, `resolveLegacyFamilyPasscode`, `normalizeFamilyBackup`, `setFamilyAuthMock({ …, reauth })`, `setFamilyPasscode`, `getParentPasscode`, `setFamilyAuthMock({ email, sendReset, changePassword } | null)`, and `triggerProfilesUpdate(profiles, familyMeta)`.

## 6. Follow-ups

- Retiring the per-child PIN copies (`profiles.*.state.adminPassword`) is planned and tracked in **§7** — check its phase table for status and the earliest start date of the next phase.
- Optional: a "This is a parent device" trust toggle (skip the PIN on the parent phone). Parked 2026-10-15: build only if PIN entry on the parent phone proves to be real friction; if built, Admin entry only, 30-day expiry, Sign Out always gated.
- Manual check against real Firebase: the sign-out of other devices after a password change (reset email delivery was verified on prod 2026-10-15). Steps: change the password on the phone (Admin › Family › Change password), reload the kid tablet → expect the Family login modal (without a reload it can take up to ~60 min, the ID-token lifetime). Do it on prod; the emulator doesn't model revocation faithfully.

## 7. Retiring per-child PIN copies (approved 2026-10-15)

### 7.1 Decisions

The evaluation (`adminPassword` read/write map, options, review panel) was approved on **2026-10-15** through the owner's artifact review policy, with its recommended defaults:

| # | Decision (2026-10-15) |
| :--- | :--- |
| R1 | **Option B**: backfill the doc-level field, then remove `adminPassword` from per-child state with a **V20 migration** (`delete s.adminPassword`). Rejected: Option A (ignore at read time), which leaves stale PINs in cloud docs and in child backup codes forever. |
| R2 | **"Forgot PIN?" ships in Phase 1**: re-authenticate with the family sign-in password, then set a new PIN. It turns any lost passcode into a 30-second fix. |
| R3 | **7-day soaks** between phases, plus a manual Firestore-console check that `users/{uid}.adminPassword` exists on prod and staging. |
| R5 | 2026-10-15, crsjain: *"let's start Phase 2 development which should take at least a day before I deploy to prod. In the meantime I'll be using the PIN changes in prod."* Phase 2 development starts now on the separate branch `phase2/stop-per-child-pin-writes` (so a wrap-up of other work can't ship it), and its soak is **shortened from 7 days to at least 1 day** of owner use in prod. The doc-field check stays a hard gate. Phase 3 keeps its 7-day gate. |
| R4 | Restoring a family code **without** the doc field no longer reverts the PIN: derive it from the code's child copies, else keep the current family PIN. Codes that carry the field still restore it (D4). |

### 7.2 Key findings that shaped the plan

- `runStateDiagnostics` never touches `adminPassword`, so it needs no change.
- Pre-v209 clients check `state.adminPassword || ADMIN_PASSWORD`; once copies are erased they accept `zxcv`. Network-first SW (Checkpoint 63) updates any device that opens online, so the soak covers rarely-opened devices.
- `saveProfileStateToCloud` writes the whole `state`, so once `state` stops carrying the key, the next save erases that child's cloud copy. `importFamilyData` is `setDoc` without merge, so an old family code with no doc field deletes it.
- **The one real data-loss path:** shipping the backfill and the V20 removal together. `subscribeToProfiles` (backfill) and `subscribeToProfileState` (`replaceState` → V20 → first-load `saveState`) watch the same doc, so a slow or offline backfill could lose the race and the only copy would be erased. Mitigated by phase separation + the console check, with Forgot PIN as the backstop.
- Backfill can't be a migration (migrations run per child and can't write the doc). It lives in `handleProfilesUpdate`, which sees `familyMeta` and the raw child states, and writes **only if absent inside a `runTransaction`** so it can never overwrite a PIN changed concurrently on another device.
- Drift resolver (pure, exported): ignore empty / non-string / `zxcv` copies → nothing left: write nothing (stay legacy `zxcv`) → prefer a 4–6 digit PIN over text → the value most children share → newest `profiles.{id}.updatedAt`. Text passcodes are copied verbatim, so legacy mode keeps working.

### 7.3 Phases

| Phase | Scope | Files | Tests | Preconditions / earliest start | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Backfill + safety net** | `resolveLegacyFamilyPasscode` + `ensureFamilyPasscode` (transactional write-if-absent) in `handleProfilesUpdate`; family-import normalisation (R4); **Forgot PIN?** link in `#password-modal` (family password → `reauthenticateWithCredential` → Admin › Family PIN card). Fan-out unchanged. | `app.js`, `firebase.js`, `admin.js`, `index.html`, `style.css`, `service-worker.js` | **TC114** resolver, no-write cases, transaction skip, import with/without the doc field. **TC115** Forgot PIN: wrong password, success opens the PIN card, signed out → hint + Sign in hand-off, Rule 8, 44px. | None. **Earliest 2026-10-15.** | - [x] `54217c5` + `5033759` (2026-10-15, cache v213), deployed with Checkpoint 76 |
| **2. Stop per-child writes** | `saveAdminPasswordToCloud` writes only the doc field; drop `state.adminPassword = newPin` (change-PIN), the add-child copy, and make child restore drop the incoming field. `getParentPasscode` keeps the child tier as a read-only fallback. | `firebase.js`, `admin.js`, `app.js`, `service-worker.js`, `index.html` | TC50 asserts `getParentPasscode()`; TC100 asserts the family PIN and a captured save payload with no `profiles.*` keys; TC110 new/restored child carries no `adminPassword`. | Phase 1 deployed (2026-10-15, cache v213), ≥ 1 day of owner use in prod (R5; was 7 days), doc field verified in the Firestore console (prod + staging). Develop on `phase2/stop-per-child-pin-writes`; merge to the dev branch only to deploy. **Earliest deploy 2026-10-16.** | - [ ] built `96fbe79` on `phase2/stop-per-child-pin-writes` (2026-10-15, cache v214), **not deployed**; tick on deploy |
| **3. Remove the field (V20)** | V20 `delete s.adminPassword`; remove it from the module `state`, `getDefaultStateTemplate` (stays version 16), `WIPE_PRESERVED_KEYS`; `getParentPasscode` = family → `ADMIN_PASSWORD`. Keep the Phase 1 backfill + import normalisation permanently (old family codes). Update §3.1. | `migrations.js`, `state.js`, `admin.js`, `firebase.js`, `tests.js`, `service-worker.js`, `index.html`, this PRD | **TC116** "no passcode lost" fixtures: doc field present; no field + one custom copy; no field + drift `{zxcv, 1357, abcd}`; legacy text only. V20 strips; wipe has no key; restoring an old child backup with `adminPassword` → absent, PIN unchanged. The 9 `version === 19` asserts → `helpers.LATEST_SCHEMA_VERSION`. TC110 precedence rewritten. `run_migration_test.js` unchanged. | Phase 2 live ≥ 7 days; doc field re-verified. **Earliest 2026-10-29** (or Phase 2 ship + 7 days, if later). | - [ ] |

**Change log**

- 2026-10-15 (R5): Phase 2 soak shortened to ≥ 1 day at the owner's request. This is low-risk because Phase 2 only **stops writing** child copies and still reads them as a fallback; nothing is erased until Phase 3. The residual risk: a rarely-opened pre-v209 tablet keeps accepting the PIN that was current before a later change. Phase 3, which actually erases copies, keeps the 7-day gate.

- 2026-10-15 (Phase 1, owner request, `5033759`): the Forgot PIN link is **always shown**. On a device that isn't signed in, there's no family password to check, so forgot mode explains that and its primary becomes **Sign in**, which opens Family sign-in (email focused); after signing in, Forgot PIN? offers the reset. (`54217c5` had briefly hidden the link when signed out.) Offline errors still map to calm copy ("No internet connection…"). Also: on success the gated action is **not** run; the parent lands on Admin › Family with the New PIN field focused, and re-authenticating alone never changes the PIN.

### 7.4 Rollback

- **Phase 1:** revert. The doc field it wrote is the source of truth anyway, so leaving it is harmless; Forgot PIN simply disappears.
- **Phase 2:** revert. The fan-out resumes on the next PIN change; child copies are still in the docs.
- **Phase 3:** revert. v19 diagnostics force `version` 20 → 19 (harmless; V20 is idempotent and re-runs on re-deploy). Child copies are gone, so the reverted code relies on the doc field (a precondition of this phase), with Forgot PIN as the last resort.
