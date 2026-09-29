import { 
  state, 
  saveState, 
  loadState, 
  runStateDiagnostics,
  replaceState,
  ADMIN_PASSWORD,
  DAYS,
  getStageInfo
} from './state.js';
import { formatLocalDate } from './date_utils.js';

let appCallbacks = {
  renderState: () => {},
  showCustomConfirm: () => {},
  showCustomNotification: () => {},
  renderAdminProfilesList: () => {},
  exportCloudData: async () => { return null; },
  importCloudData: async () => {},
  wipeData: async () => {},
  reload: () => location.reload(),
  getActiveProfileName: () => null
};

function renderState(...args) {
  appCallbacks.renderState(...args);
}

function showCustomConfirm(...args) {
  return appCallbacks.showCustomConfirm(...args);
}

function showCustomNotification(...args) {
  appCallbacks.showCustomNotification(...args);
}

/** Flags a #confirm-modal call as an Admin surface (admin button dialect). */
const ADMIN_SURFACE = { surface: 'admin' };

/**
 * Rule 11: Admin errors and warnings get a neutral "Got it" CTA in the admin
 * secondary style (never "Awesome!", never the disabled-looking .greyed-out).
 * Each notification is a fresh body-level node, so the class can't leak.
 */
export function adminNotice(title, message) {
  appCallbacks.showCustomNotification(title, message, null, false, null, 'adm-surface', 'Got it', 'adm-secondary');
}

/* ---------------------------------------------------------------------------
 * Toast (PRD v2.0 §11.5): routine success only. Body-level `.notif-modal.toast`
 * that keeps the h2 / .notif-body-text / .notif-close-btn contract (TC1/TC58),
 * role=status, no backdrop, 4s auto-dismiss paused on hover/focus, and a new
 * toast replaces the previous one. Errors stay modal (adminNotice).
 * ------------------------------------------------------------------------- */
const TOAST_MS = 4000;
let activeToast = null;

export function showAdminToast(title, message) {
  if (activeToast) activeToast.dismiss(true);

  const el = document.createElement('div');
  el.className = 'modal notif-modal toast adm-surface';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.innerHTML = `
    <div class="modal-content">
      <h2></h2>
      <div class="notif-body-text"></div>
      <button type="button" class="pixel-btn notif-close-btn adm-tertiary" aria-label="Dismiss">OK</button>
    </div>`;
  el.querySelector('h2').textContent = title;
  el.querySelector('.notif-body-text').textContent = message;
  document.body.appendChild(el);

  let timer = null;
  let removed = false;
  const toast = {
    dismiss(immediate) {
      if (removed) return;
      removed = true;
      clearTimeout(timer);
      if (activeToast === toast) activeToast = null;
      el.classList.add('hidden');
      if (immediate) el.remove();
      else setTimeout(() => el.remove(), 300);
    }
  };
  const arm = () => { clearTimeout(timer); timer = setTimeout(() => toast.dismiss(false), TOAST_MS); };
  const pause = () => clearTimeout(timer);
  el.addEventListener('mouseenter', pause);
  el.addEventListener('mouseleave', arm);
  el.addEventListener('focusin', pause);
  el.addEventListener('focusout', arm);
  el.querySelector('.notif-close-btn').addEventListener('click', () => toast.dismiss(false));
  activeToast = toast;
  arm();
  return el;
}

/* ---------------------------------------------------------------------------
 * Inline "Saved ✓" for auto-saving Settings controls (aria-live=polite, 2s).
 * ------------------------------------------------------------------------- */
function flashAdminSaved(fromEl) {
  const card = fromEl && fromEl.closest('.adm-card');
  const status = card && card.querySelector('[data-admin-saved-status]');
  if (!status) return;
  status.textContent = 'Saved ✓';
  status.classList.add('is-visible');
  clearTimeout(status._admTimer);
  status._admTimer = setTimeout(() => {
    status.classList.remove('is-visible');
    status.textContent = '';
  }, 2000);
}

/* ---------------------------------------------------------------------------
 * Backup code dialog (#admin-restore-dialog): replaces window.prompt() for
 * "Restore from code…" (read mode) and the clipboard-failure fallback (copy
 * mode). `validate(code)` returns {ok:true, value} or {ok:false, title, message};
 * the dialog shows errors inline and stays open. Test seam: with a mock set,
 * the dialog is bypassed and errors fall back to adminNotice (TC16/TC24).
 * ------------------------------------------------------------------------- */
let readBackupCodeMock = null;
let backupDialogState = null;

export function setReadBackupCodeMock(fn) {
  readBackupCodeMock = typeof fn === 'function' ? fn : null;
}

function readBackupCode({ title, description, validate }) {
  if (readBackupCodeMock) {
    const code = readBackupCodeMock();
    if (!code) return Promise.resolve(null);
    const result = validate(String(code).trim());
    if (!result.ok) {
      adminNotice(result.title, result.message);
      return Promise.resolve(null);
    }
    return Promise.resolve(result.value);
  }
  return openBackupDialog({ mode: 'read', title, description, validate });
}

function showBackupCode({ title, description, code }) {
  return openBackupDialog({ mode: 'copy', title, description, code });
}

function backupDialogEls() {
  return {
    dialog: document.getElementById('admin-restore-dialog'),
    title: document.getElementById('admin-restore-title'),
    desc: document.getElementById('admin-restore-desc'),
    input: document.getElementById('admin-restore-input'),
    error: document.getElementById('admin-restore-error'),
    submit: document.getElementById('admin-restore-submit-btn'),
    cancel: document.getElementById('admin-restore-cancel-btn')
  };
}

function openBackupDialog(opts) {
  const els = backupDialogEls();
  if (!els.dialog) return Promise.resolve(null);
  if (backupDialogState) closeBackupDialog(null);
  const copyMode = opts.mode === 'copy';
  els.title.textContent = opts.title;
  els.desc.textContent = opts.description || '';
  els.input.value = copyMode ? (opts.code || '') : '';
  els.input.readOnly = copyMode;
  els.error.textContent = '';
  els.error.classList.add('hidden');
  els.submit.textContent = copyMode ? 'Done' : 'Restore';
  els.cancel.classList.toggle('hidden', copyMode);
  els.dialog.dataset.mode = opts.mode;
  const returnFocus = document.activeElement;
  els.dialog.classList.remove('hidden');
  return new Promise(resolve => {
    backupDialogState = { ...opts, resolve, returnFocus };
    setTimeout(() => {
      if (!backupDialogState) return;
      els.input.focus();
      if (copyMode) els.input.select();
    }, 30);
  });
}

function submitBackupDialog() {
  const st = backupDialogState;
  if (!st) return;
  if (st.mode === 'copy') {
    closeBackupDialog(true);
    return;
  }
  const els = backupDialogEls();
  const code = els.input.value.trim();
  const result = code
    ? st.validate(code)
    : { ok: false, message: 'Paste a backup code first.' };
  if (!result.ok) {
    els.error.textContent = result.message;
    els.error.classList.remove('hidden');
    els.input.focus();
    return;
  }
  closeBackupDialog(result.value);
}

function closeBackupDialog(value) {
  const st = backupDialogState;
  backupDialogState = null;
  const els = backupDialogEls();
  if (els.dialog) els.dialog.classList.add('hidden');
  if (els.input) els.input.value = '';
  if (!st) return;
  if (st.returnFocus && st.returnFocus.isConnected && typeof st.returnFocus.focus === 'function') {
    st.returnFocus.focus();
  }
  st.resolve(value);
}

function bindBackupDialog() {
  const els = backupDialogEls();
  if (!els.dialog) return;
  els.submit.addEventListener('click', submitBackupDialog);
  els.cancel.addEventListener('click', () => closeBackupDialog(null));
  els.dialog.addEventListener('click', (e) => {
    if (e.target === els.dialog) closeBackupDialog(null);
  });
}

/* ---------------------------------------------------------------------------
 * Focus management: Tab stays inside the top-most admin layer. Layers above
 * Admin that belong to other flows (passcode, add child) are left alone.
 * ------------------------------------------------------------------------- */
const FOCUSABLE = 'button, [href], input, select, textarea, summary, [tabindex]:not([tabindex="-1"])';

function isShown(id) {
  const el = document.getElementById(id);
  return !!el && !el.classList.contains('hidden');
}

function topAdminLayer() {
  if (!adminModal || adminModal.classList.contains('hidden')) return null;
  if (isShown('password-modal') || isShown('add-profile-modal')) return null;
  if (isShown('admin-restore-dialog')) return document.getElementById('admin-restore-dialog');
  const confirmEl = document.getElementById('confirm-modal');
  if (confirmEl && !confirmEl.classList.contains('hidden')) {
    return confirmEl.getAttribute('data-surface') === 'admin' ? confirmEl : null;
  }
  if (document.querySelector('.notif-modal:not(.hidden):not(.toast)')) return null;
  if (isShown('edit-rewards-modal')) return document.getElementById('edit-rewards-modal');
  return adminModal;
}

function trapAdminFocus(e) {
  const layer = topAdminLayer();
  if (!layer) return;
  const items = [...layer.querySelectorAll(FOCUSABLE)]
    .filter(el => !el.disabled && el.tabIndex !== -1 && el.getClientRects().length > 0);
  if (items.length === 0) return;
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  if (!layer.contains(active)) {
    e.preventDefault();
    (e.shiftKey ? last : first).focus();
  } else if (e.shiftKey && active === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  }
}

/** A higher layer is open above Admin: Escape must not close Admin under it (X16). */
function isLayerAboveAdminOpen() {
  const open = id => {
    const el = document.getElementById(id);
    return !!el && !el.classList.contains('hidden');
  };
  return open('confirm-modal') || open('edit-rewards-modal') || open('password-modal') ||
    open('add-profile-modal') || open('admin-restore-dialog') ||
    !!document.querySelector('.notif-modal:not(.hidden):not(.toast)');
}

// DOM elements cache
let adminBtn = null;
let adminModal = null;
let passwordModal = null;
let passwordInput = null;
let passwordSubmitBtn = null;
let passwordCancelBtn = null;
let passwordError = null;

let adminDiagnosticsBtn = null;
let adminExportBtn = null;
let adminImportBtn = null;
let adminCloudExportBtn = null;
let adminCloudImportBtn = null;
let adminWipeBtn = null;
let adminForceUpdateBtn = null;
let closeAdminModalBtn = null;
let adminAddTaskBtn = null;
let adminSaveTasksBtn = null;
let passwordSuccessCallback = null;

export function promptParentPassword(onSuccess, customDescription = 'Enter the parent passcode to open Admin.') {
  passwordSuccessCallback = onSuccess;
  if (passwordInput) passwordInput.value = '';
  if (passwordError) passwordError.classList.add('hidden');
  
  const descEl = document.getElementById('password-prompt-desc');
  if (descEl) {
    descEl.textContent = customDescription;
  }
  
  if (passwordModal) {
    passwordModal.classList.remove('hidden');
    setTimeout(() => passwordInput.focus(), 50);
  }
}

export function initAdmin(callbacks) {
  if (callbacks) {
    appCallbacks = { ...appCallbacks, ...callbacks };
  }
  adminBtn = document.getElementById('admin-btn');
  adminModal = document.getElementById('admin-modal');
  passwordModal = document.getElementById('password-modal');
  passwordInput = document.getElementById('password-input');
  passwordSubmitBtn = document.getElementById('password-submit-btn');
  passwordCancelBtn = document.getElementById('password-cancel-btn');
  passwordError = document.getElementById('password-error');

  adminDiagnosticsBtn = document.getElementById('admin-diagnostics-btn');
  adminExportBtn = document.getElementById('admin-export-btn');
  adminImportBtn = document.getElementById('admin-import-btn');
  adminCloudExportBtn = document.getElementById('admin-cloud-export-btn');
  adminCloudImportBtn = document.getElementById('admin-cloud-import-btn');
  adminWipeBtn = document.getElementById('admin-wipe-btn');
  adminForceUpdateBtn = document.getElementById('admin-force-update-btn');
  closeAdminModalBtn = document.getElementById('close-admin-modal-btn');
  const closeAdminHeaderBtn = document.getElementById('close-admin-header-btn');
  adminAddTaskBtn = document.getElementById('admin-add-task-btn');
  adminSaveTasksBtn = document.getElementById('admin-save-tasks-btn');

  if (adminBtn) {
    adminBtn.addEventListener('click', () => {
      promptParentPassword(() => {
        openAdminPanel();
      });
    });
  }

  // Left-nav switching: toggles .hidden / aria-selected only, never re-renders a
  // pane (unsaved #admin-tasks-list edits must survive a tab switch).
  const adminNav = document.getElementById('admin-nav');
  if (adminNav) {
    adminNav.addEventListener('click', (e) => {
      const btn = e.target.closest('.admin-nav-btn');
      if (!btn || !adminNav.contains(btn)) return;
      showAdminSection(btn.dataset.adminSection);
      if (typeof btn.scrollIntoView === 'function') {
        btn.scrollIntoView({ inline: 'nearest', block: 'nearest' });
      }
    });
    // Arrow keys move between tabs (both orientations, since the rail becomes
    // top tabs on portrait tablets and phones); Home/End jump to the ends.
    // Activation follows focus: switching panes never re-renders.
    adminNav.addEventListener('keydown', (e) => {
      const btn = e.target.closest('.admin-nav-btn');
      if (!btn) return;
      const tabs = [...adminNav.querySelectorAll('.admin-nav-btn')];
      const i = tabs.indexOf(btn);
      let next = null;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') next = tabs[0];
      else if (e.key === 'End') next = tabs[tabs.length - 1];
      if (!next) return;
      e.preventDefault();
      showAdminSection(next.dataset.adminSection);
      next.focus();
      if (typeof next.scrollIntoView === 'function') {
        next.scrollIntoView({ inline: 'nearest', block: 'nearest' });
      }
    });
  }

  // + Add child (Family): opens the add-child sheet over Admin with no second
  // passcode prompt, and never switches the active profile (Q9).
  const addChildBtn = document.getElementById('admin-add-child-btn');
  if (addChildBtn) {
    addChildBtn.addEventListener('click', () => {
      if (appCallbacks.openAddChild) appCallbacks.openAddChild();
    });
  }

  if (passwordSubmitBtn) {
    passwordSubmitBtn.addEventListener('click', handlePasswordSubmit);
  }
  if (passwordInput) {
    passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handlePasswordSubmit();
      }
    });
  }
  if (passwordCancelBtn) {
    passwordCancelBtn.addEventListener('click', () => {
      passwordModal.classList.add('hidden');
    });
  }

  if (closeAdminModalBtn) {
    closeAdminModalBtn.addEventListener('click', () => requestCloseAdmin());
  }

  if (closeAdminHeaderBtn) {
    closeAdminHeaderBtn.addEventListener('click', () => requestCloseAdmin());
  }

  if (adminModal) {
    adminModal.addEventListener('click', (e) => {
      if (e.target === adminModal) {
        requestCloseAdmin();
      }
    });
  }

  // Registered on document (not window): app.js's window-level Escape handler
  // (showcase modal / Exception Mode) keeps its own precedence. Minimal layer
  // stack: a confirm, notification, rewards editor or passcode prompt open above
  // Admin owns Escape, so Admin never closes underneath it (X16).
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backupDialogState) {
      closeBackupDialog(null);
      return;
    }
    if (e.key === 'Escape' && isUnsavedGuardOpen()) {
      // Guard-specific: Esc = Keep editing. Other admin confirms keep X16.
      document.getElementById('confirm-no-btn').click();
      return;
    }
    if (e.key === 'Tab') {
      trapAdminFocus(e);
      return;
    }
    if (e.key !== 'Escape' || !adminModal || adminModal.classList.contains('hidden')) return;
    if (isLayerAboveAdminOpen()) return;
    // Inline edits that own Escape (reward rename) stop propagation before
    // this runs; anything else closes Admin, and the guard protects a draft.
    requestCloseAdmin();
  });

  // Android back / browser back (PRD v2.0 §11.6 #7): Admin owns one history
  // entry while open, so Back closes Admin (through the guard) instead of
  // leaving the installed PWA.
  window.addEventListener('popstate', handleAdminPopState);

  bindBackupDialog();

  // Auto-saving Settings controls confirm inline instead of with a blocking
  // modal. Week Start is confirm-gated and reports through its own status badge.
  ['admin-parent-grace-select', 'admin-lock-past-days-toggle', 'admin-timezone-select', 'admin-idle-timeout-select']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', () => flashAdminSaved(el));
    });

  window.addEventListener('online', refreshReloadAvailability);
  window.addEventListener('offline', refreshReloadAvailability);
  refreshReloadAvailability();

  if (adminDiagnosticsBtn) {
    adminDiagnosticsBtn.addEventListener('click', () => {
      const { issues, fixed } = runStateDiagnostics();
      if (fixed.length > 0) {
        renderState(true);
      }
      
      const issueList = issues.map(i => `• ${i}`).join('\n');
      const fixList = fixed.map(f => `• ${f}`).join('\n');
      
      showCustomNotification(
        "🛠️ DIAGNOSTICS COMPLETE 🛠️",
        fixed.length > 0 
          ? `Diagnostics found and fixed ${fixed.length} issues:\n\nISSUES:\n${issueList}\n\nFIXES:\n${fixList}`
          : `Diagnostics run complete! No issues found. System state is healthy.`,
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/max-repel.png'
      );
    });
  }

  if (adminExportBtn) {
    adminExportBtn.addEventListener('click', exportState);
  }
  if (adminImportBtn) {
    adminImportBtn.addEventListener('click', importState);
  }
  if (adminCloudExportBtn) {
    adminCloudExportBtn.addEventListener('click', exportCloudState);
  }
  if (adminCloudImportBtn) {
    adminCloudImportBtn.addEventListener('click', importCloudState);
  }
  if (adminForceUpdateBtn) {
    adminForceUpdateBtn.addEventListener('click', forceAppUpdate);
  }
  if (adminWipeBtn) {
    adminWipeBtn.addEventListener('click', () => {
      // Resets ONLY the active child (see wipeActiveChildProgress in app.js).
      const childName = state.childName || 'this child';
      const wipeConfirmHtml = `
        <div class="confirm-detail">
          <div class="schedule-hero-card danger">
            <div class="schedule-hero-label">🚨 RESET PROGRESS</div>
            <div class="schedule-hero-main">${childName}</div>
          </div>
          <div class="transition-warning-callout danger">
            <div class="transition-callout-title">⚠️ Cannot Be Undone</div>
            <div class="transition-callout-desc">This resets ${childName}'s levels, partner Pokémon, XP, badges, stars, and chart history back to the start. ${childName}'s activities, rewards, and settings are kept, and other children are not affected. This cannot be undone.</div>
          </div>
        </div>
      `;
      showCustomConfirm(
        "Wipe All Progress? 🚨",
        wipeConfirmHtml,
        async () => {
          try {
            if (appCallbacks.wipeData) {
              await appCallbacks.wipeData();
            } else {
              localStorage.clear();
            }
            appCallbacks.reload();
          } catch (err) {
            adminNotice("Wipe Failed ❌", err.message);
          }
        },
        null,
        `Reset ${childName}`,
        "Cancel",
        "pixel-btn danger",
        "pixel-btn greyed-out",
        ADMIN_SURFACE
      );
    });
  }

  if (adminAddTaskBtn) {
    adminAddTaskBtn.addEventListener('click', addNewTask);
  }
  if (adminSaveTasksBtn) {
    adminSaveTasksBtn.addEventListener('click', () => {
      const hadFocus = isFocusInSaveBar();
      if (saveAdminTasks() && hadFocus) focusAfterSaveBar();
    });
  }
  const discardTasksBtn = document.getElementById('admin-discard-tasks-btn');
  if (discardTasksBtn) {
    discardTasksBtn.addEventListener('click', () => {
      const hadFocus = isFocusInSaveBar();
      renderAdminTasksList();
      if (hadFocus) focusAfterSaveBar();
    });
  }
  const tasksList = document.getElementById('admin-tasks-list');
  if (tasksList) {
    // Dirty = draft differs from saved state, recomputed on every edit (typing
    // a name back to its saved value makes the draft clean again).
    tasksList.addEventListener('input', refreshActivitiesDirty);
    tasksList.addEventListener('change', refreshActivitiesDirty);
  }

  // Parent passcode (Family card): explicit submit, inline errors, success toast.
  const changePasscodeBtn = document.getElementById('admin-change-passcode-btn');
  const newPasscodeInput = document.getElementById('admin-new-passcode-input');
  const confirmPasscodeInput = document.getElementById('admin-new-passcode-confirm');
  const passcodeError = document.getElementById('admin-passcode-error');
  const showPasscodeError = (message, field) => {
    if (passcodeError) {
      passcodeError.textContent = message;
      passcodeError.classList.remove('hidden');
    }
    if (field) field.focus();
  };
  const clearPasscodeError = () => {
    if (passcodeError) {
      passcodeError.textContent = '';
      passcodeError.classList.add('hidden');
    }
  };
  [newPasscodeInput, confirmPasscodeInput].forEach(el => {
    if (!el) return;
    el.addEventListener('input', clearPasscodeError);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && changePasscodeBtn) {
        e.preventDefault();
        changePasscodeBtn.click();
      }
    });
  });

  if (changePasscodeBtn && newPasscodeInput) {
    changePasscodeBtn.addEventListener('click', () => {
      const newPasscode = newPasscodeInput.value.trim();
      const confirmPasscode = confirmPasscodeInput ? confirmPasscodeInput.value.trim() : newPasscode;
      if (!newPasscode) {
        showPasscodeError('Enter a new passcode.', newPasscodeInput);
        return;
      }
      if (newPasscode.length < 4) {
        showPasscodeError('Use at least 4 characters.', newPasscodeInput);
        return;
      }
      if (confirmPasscode !== newPasscode) {
        showPasscodeError("The two passcodes don't match.", confirmPasscodeInput);
        return;
      }
      clearPasscodeError();

      state.adminPassword = newPasscode;
      saveState();

      newPasscodeInput.value = '';
      if (confirmPasscodeInput) confirmPasscodeInput.value = '';

      if (appCallbacks.saveAdminPassword) {
        appCallbacks.saveAdminPassword(newPasscode)
          .then(() => {
            showAdminToast("Passcode Updated 🔑", "Parent Admin passcode updated successfully!");
          })
          .catch(err => {
            console.error("Cloud passcode update failed:", err);
            adminNotice("Passcode Warning ⚠️", "Passcode saved locally, but failed to sync to database: " + err.message);
          });
      } else {
        showAdminToast("Passcode Updated 🔑", "Parent Admin passcode updated successfully!");
      }
    });
  }
}

function handlePasswordSubmit() {
  const password = passwordInput.value;
  const currentPassword = state.adminPassword || ADMIN_PASSWORD;
  if (password === currentPassword) {
    passwordModal.classList.add('hidden');
    if (passwordSuccessCallback) {
      passwordSuccessCallback();
      passwordSuccessCallback = null;
    } else {
      openAdminPanel();
    }
  } else {
    // Calm, inline, silent (approval PRD Stage 1): no shake, no sound, no modal.
    // Clear and refocus so the next try is easy.
    passwordError.classList.remove('hidden');
    passwordInput.value = '';
    passwordInput.focus();
  }
}

const ADMIN_LANDING_SECTION = 'today';

/**
 * Shows exactly one admin pane. Class/ARIA toggling only — never re-renders.
 */
function showAdminSection(section) {
  const modal = adminModal || document.getElementById('admin-modal');
  if (!modal || !section) return;
  modal.querySelectorAll('.admin-nav-btn').forEach(btn => {
    const selected = btn.dataset.adminSection === section;
    btn.setAttribute('aria-selected', selected ? 'true' : 'false');
    // Roving tabindex (WAI-ARIA tabs): only the selected tab is in the Tab order.
    btn.tabIndex = selected ? 0 : -1;
  });
  modal.querySelectorAll('.admin-pane').forEach(pane => {
    pane.classList.toggle('hidden', pane.dataset.adminSection !== section);
  });
}

/**
 * Refreshes the read-only "Editing: <child>" chip and the Data pane's
 * "This child (<name>)" label. The name comes from a getter so it is always
 * current (activeProfileId / profilesList are reassigned by sync and tests).
 * With no active profile the chip hides — never "Editing: undefined".
 */
export function refreshAdminScopeChip() {
  const name = appCallbacks.getActiveProfileName ? appCallbacks.getActiveProfileName() : null;
  document.querySelectorAll('[data-admin-child-name]').forEach(el => {
    el.textContent = name ? ` (${name})` : '';
  });
  document.querySelectorAll('[data-admin-scope-eyebrow="child"]').forEach(el => {
    el.textContent = name ? `This child · ${name}` : 'This child';
  });
  const chip = document.getElementById('admin-scope-chip');
  if (!chip) return;
  if (name) {
    chip.textContent = `Editing: ${name}`;
    chip.title = `"This child" sections change ${name}'s settings only`;
    chip.classList.remove('hidden');
  } else {
    chip.textContent = '';
    chip.removeAttribute('title');
    chip.classList.add('hidden');
  }
}

/**
 * Opens the panel on Today (D6: no remembered section), refreshes the chip,
 * and renders the dynamic lists.
 */
function openAdminPanel() {
  if (!adminModal) return;
  showAdminSection(ADMIN_LANDING_SECTION);
  refreshAdminScopeChip();
  refreshReloadAvailability();
  adminModal.classList.remove('hidden');
  renderAdminTasksList();
  renderClaimedRewardsHistory();
  appCallbacks.renderAdminProfilesList();
  pushAdminHistoryEntry();
  const activeTab = adminModal.querySelector('.admin-nav-btn[aria-selected="true"]');
  if (activeTab && typeof activeTab.scrollIntoView === 'function') {
    activeTab.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  }
  // Focus moves into the dialog (the selected tab) and returns to ⚙️ on close.
  if (activeTab) activeTab.focus({ preventScroll: true });
}

/** Focus goes back to the ⚙️ opener when Admin closes (if it is still visible). */
function returnFocusFromAdmin() {
  if (adminBtn && adminBtn.isConnected && adminBtn.getClientRects().length > 0) {
    adminBtn.focus({ preventScroll: true });
  }
}

/**
 * Hides the panel and drops any Activities draft by rebuilding the list from
 * `state`. Callers that may hold a draft go through requestCloseAdmin().
 */
function closeAdminPanel() {
  if (!adminModal) return;
  adminModal.classList.add('hidden');
  renderAdminTasksList();
  releaseAdminHistoryEntry();
  returnFocusFromAdmin();
}

/* ---------------------------------------------------------------------------
 * Unsaved-changes guard (PRD v2.0 §11.5). Every Admin close — ✕, footer Close,
 * Esc, backdrop, Set Exceptions, Android back — calls requestCloseAdmin().
 * Clean draft: closes at once (the nightly path never sees a dialog).
 * Dirty draft: Save & close / Keep editing (default; Esc + backdrop) / Discard.
 * ------------------------------------------------------------------------- */
let unsavedGuardOpen = false;

function isUnsavedGuardOpen() {
  if (!unsavedGuardOpen) return false;
  const cm = document.getElementById('confirm-modal');
  if (!cm || cm.classList.contains('hidden')) {
    unsavedGuardOpen = false;
    return false;
  }
  return true;
}

export function requestCloseAdmin(onClosed) {
  const done = () => { if (typeof onClosed === 'function') onClosed(); };
  if (!adminModal || adminModal.classList.contains('hidden')) {
    done();
    return;
  }
  if (!isActivitiesDirty()) {
    closeAdminPanel();
    done();
    return;
  }
  if (isUnsavedGuardOpen()) return;
  openUnsavedGuard(done);
}

function openUnsavedGuard(done) {
  const n = countActivityChanges();
  const keepEditing = () => { unsavedGuardOpen = false; };
  unsavedGuardOpen = true;
  showCustomConfirm(
    'Unsaved Changes ✏️',
    `You have ${n} unsaved change${n === 1 ? '' : 's'} in Activities.`,
    () => {
      unsavedGuardOpen = false;
      // A failed save (empty name, conflict) keeps Admin open with the draft.
      if (saveAdminTasks()) {
        closeAdminPanel();
        done();
      }
    },
    keepEditing,
    'Save & close',
    'Keep editing',
    'pixel-btn',
    'pixel-btn',
    {
      ...ADMIN_SURFACE,
      backdrop: 'cancel',
      onCancel: keepEditing,
      third: {
        label: 'Discard',
        className: 'pixel-btn',
        onClick: () => {
          unsavedGuardOpen = false;
          closeAdminPanel();
          done();
        }
      }
    }
  );
}

/* Android back: one history entry while Admin is open. A non-back close pops
   it again (ignoring the popstate that causes). Ownership is read from
   history.state with a per-load token, never from a flag that direct hides or
   reloads could leave stale — so Close never calls back() into another
   document. */
const ADMIN_HISTORY_TOKEN = `kpc-admin-${Date.now()}-${Math.random().toString(36).slice(2)}`;
let ignoreNextAdminPop = false;

function ownsAdminHistoryEntry() {
  try {
    return !!(history.state && history.state.kpcAdmin === ADMIN_HISTORY_TOKEN);
  } catch (err) {
    return false;
  }
}

function pushAdminHistoryEntry() {
  if (ownsAdminHistoryEntry()) return;
  try {
    history.pushState({ kpcAdmin: ADMIN_HISTORY_TOKEN }, '');
  } catch (err) {
    /* history unavailable: Back simply behaves as before */
  }
}

function releaseAdminHistoryEntry() {
  if (!ownsAdminHistoryEntry()) return;
  ignoreNextAdminPop = true;
  try {
    history.back();
  } catch (err) {
    ignoreNextAdminPop = false;
  }
}

function handleAdminPopState() {
  if (ignoreNextAdminPop) {
    ignoreNextAdminPop = false;
    return;
  }
  if (!adminModal || adminModal.classList.contains('hidden')) return;
  if (isActivitiesDirty()) {
    pushAdminHistoryEntry(); // stay in Admin; the next Back asks again
    if (!isUnsavedGuardOpen()) openUnsavedGuard(() => {});
    return;
  }
  closeAdminPanel();
}

const TASK_EMOJI_CHOICES = ['🎹', '🧮', '📚', '✏️', '💮', '🧪', '🎨', '🏃', '🧹', '🥦', '📝'];

/**
 * Builds one Activities row. `isNew` marks a draft-only row (data-new="1")
 * that does not exist in state.tasks until Save Activities.
 */
function buildAdminTaskItem(task, isNew) {
  const item = document.createElement('div');
  item.className = 'admin-task-item';
  item.dataset.taskId = task.id;
  if (isNew) item.dataset.new = '1';

  // Keep a task's own emoji selectable even if it isn't in the picker list, so
  // the select never silently falls back to the first choice.
  const choices = task.emoji && !TASK_EMOJI_CHOICES.includes(task.emoji)
    ? [task.emoji, ...TASK_EMOJI_CHOICES]
    : TASK_EMOJI_CHOICES;
  const emojiOptions = choices
    .map(e => `<option value="${e}" ${task.emoji === e ? 'selected' : ''}>${e}</option>`)
    .join('\n          ');

  item.innerHTML = `
      <div class="admin-task-row">
        <select class="task-emoji-select" aria-label="Activity icon">
          ${emojiOptions}
        </select>
        <input type="text" class="task-name-input" aria-label="Activity name">
        <div class="adm-move-group" role="group" aria-label="Reorder">
          <button type="button" class="pixel-btn adm-icon-btn adm-tertiary move-task-btn" data-dir="up" aria-label="Move activity up" title="Move up">▲</button>
          <button type="button" class="pixel-btn adm-icon-btn adm-tertiary move-task-btn" data-dir="down" aria-label="Move activity down" title="Move down">▼</button>
        </div>
        <button class="pixel-btn adm-icon-btn adm-quiet-danger remove-task-btn" data-task-id="${task.id}" aria-label="Remove activity" title="Remove activity">
          <svg class="delete-icon" viewBox="0 0 448 512" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
            <path d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0H284.2C296.3 0 307.4 6.8 312.8 17.7L320 32H384C401.7 32 416 46.3 416 64C416 81.7 401.7 96 384 96H64C46.3 96 32 81.7 32 64C32 46.3 46.3 32 64 32H128L135.2 17.7zM32 128H416V448C416 483.3 387.3 512 352 512H96C60.7 512 32 483.3 32 448V128zM96 176C96 162.7 85.3 152 72 152C58.7 152 48 162.7 48 176V408C48 421.3 58.7 432 72 432C85.3 432 96 421.3 96 408V176z"/>
          </svg>
        </button>
      </div>
      <div class="admin-task-instructions">
        <span class="instructions-label">Instructions:</span>
        <input type="text" class="task-instructions-input" placeholder="What ${escapeHtml(state.childName || 'Trainer')} needs to do (e.g. Play pieces 3x)">
      </div>
    `;

  // Values are set as properties (never interpolated) so quotes in names are safe.
  item.querySelector('.task-name-input').value = task.name || '';
  item.querySelector('.task-instructions-input').value = task.instructions || '';
  item.querySelector('.remove-task-btn').addEventListener('click', () => removeTask(item));
  item.querySelectorAll('.move-task-btn').forEach(btn => {
    btn.addEventListener('click', () => moveTask(item, btn.dataset.dir === 'up' ? -1 : 1));
  });
  return item;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

/* ---------------------------------------------------------------------------
 * Activities draft model (PRD v2.0 §11.5). The draft is the DOM list. Dirty
 * means "differs from what was rendered from state" — not "was touched" — so
 * editing a name and typing it back leaves the draft clean.
 * ------------------------------------------------------------------------- */
let activitiesBaseline = [];

function readActivityRows(includeRemoved = false) {
  const container = document.getElementById('admin-tasks-list');
  if (!container) return [];
  return [...container.querySelectorAll('.admin-task-item')]
    .filter(item => includeRemoved || item.dataset.removed !== '1')
    .map(item => ({
      item,
      id: item.dataset.taskId,
      isNew: item.dataset.new === '1',
      removed: item.dataset.removed === '1',
      emoji: item.querySelector('.task-emoji-select').value,
      name: item.querySelector('.task-name-input').value.trim(),
      instructions: item.querySelector('.task-instructions-input').value.trim()
    }));
}

function countActivityChanges() {
  const live = readActivityRows();
  const base = activitiesBaseline;
  const baseById = new Map(base.map(b => [b.id, b]));
  const liveIds = new Set(live.map(r => r.id));
  let changes = live.filter(r => r.isNew || !baseById.has(r.id)).length;
  changes += base.filter(b => !liveIds.has(b.id)).length;
  changes += live.filter(r => {
    const b = baseById.get(r.id);
    return b && !r.isNew && (b.emoji !== r.emoji || b.name !== r.name || b.instructions !== r.instructions);
  }).length;
  const kept = live.filter(r => !r.isNew && baseById.has(r.id)).map(r => r.id);
  const baseOrder = base.filter(b => kept.includes(b.id)).map(b => b.id);
  if (kept.join('\n') !== baseOrder.join('\n')) changes += 1;
  return changes;
}

function isActivitiesDirty() {
  return countActivityChanges() > 0;
}

/** Save bar, status line, tab dot and ▲▼ enablement all follow the draft. */
function refreshActivitiesDirty() {
  const n = countActivityChanges();
  const bar = document.getElementById('admin-activities-savebar');
  const status = document.getElementById('admin-activities-dirty-status');
  const tab = document.getElementById('admin-tab-tasks');
  if (bar) bar.classList.toggle('hidden', n === 0);
  if (status) status.textContent = n === 0 ? '' : `● ${n} unsaved change${n === 1 ? '' : 's'}`;
  if (tab) {
    if (n > 0) {
      tab.dataset.dirty = 'true';
      tab.title = 'Activities has unsaved changes';
    } else {
      delete tab.dataset.dirty;
      tab.removeAttribute('title');
    }
  }
  const rows = readActivityRows();
  rows.forEach((r, i) => {
    const up = r.item.querySelector('.move-task-btn[data-dir="up"]');
    const down = r.item.querySelector('.move-task-btn[data-dir="down"]');
    if (up) up.disabled = i === 0;
    if (down) down.disabled = i === rows.length - 1;
  });
}

function isFocusInSaveBar() {
  const bar = document.getElementById('admin-activities-savebar');
  return !!bar && bar.contains(document.activeElement);
}

/** The bar hides after Save/Discard; hand focus to a stable control instead. */
function focusAfterSaveBar() {
  const addBtn = document.getElementById('admin-add-task-btn');
  if (addBtn) addBtn.focus({ preventScroll: true });
}

/**
 * ▲▼ reorder (Q4): moves the row past its nearest visible neighbour. Only
 * active rows are listed, so retired tasks never move (§11.6 #8).
 */
function moveTask(item, dir) {
  const rows = readActivityRows().map(r => r.item);
  const idx = rows.indexOf(item);
  const target = rows[idx + dir];
  if (idx < 0 || !target) return;
  if (dir < 0) target.before(item);
  else target.after(item);
  refreshActivitiesDirty();
  const same = item.querySelector(`.move-task-btn[data-dir="${dir < 0 ? 'up' : 'down'}"]`);
  const other = item.querySelector(`.move-task-btn[data-dir="${dir < 0 ? 'down' : 'up'}"]`);
  (same && !same.disabled ? same : other).focus({ preventScroll: true });
  if (typeof item.scrollIntoView === 'function') item.scrollIntoView({ block: 'nearest' });
}

function renderAdminTasksList() {
  const container = document.getElementById('admin-tasks-list');
  if (!container) return;

  container.innerHTML = '';
  const tasks = state.tasks || [];
  tasks
    .filter(t => t.active !== false)
    .forEach(task => container.appendChild(buildAdminTaskItem(task, false)));
  // Baseline is read back from the DOM so select/trim normalisation can never
  // make a freshly rendered list look dirty.
  activitiesBaseline = readActivityRows().map(({ id, emoji, name, instructions }) => ({ id, emoji, name, instructions }));
  refreshActivitiesDirty();
}

/**
 * Draft-only remove (Phase 0a): hides the row with data-removed="1".
 * state.tasks is untouched until Save Activities applies the soft-delete.
 * An unsaved new row has no history to preserve, so it is dropped without
 * the confirm.
 */
function removeTask(item) {
  if (!item) return;
  if (item.dataset.new === '1') {
    item.remove();
    refreshActivitiesDirty();
    return;
  }

  const taskName = escapeHtml(item.querySelector('.task-name-input').value.trim() || 'Activity');
  const taskEmoji = escapeHtml(item.querySelector('.task-emoji-select').value || '📝');

  const removeTaskHtml = `
    <div class="confirm-detail">
      <div class="schedule-hero-card">
        <div class="schedule-hero-label">🗑️ REMOVE ACTIVITY</div>
        <div class="schedule-hero-main">${taskEmoji} ${taskName}</div>
        <div class="schedule-hero-sub">Hide <strong>"${taskName}"</strong> from your active training chart?</div>
      </div>
      <div class="transition-info-callout">
        <div class="transition-callout-title">ℹ️ History Preserved</div>
        <div class="transition-callout-desc">This activity will no longer appear on your weekly training chart, but all previously earned stars, XP, and past weeks will remain safely saved in history.</div>
      </div>
    </div>
  `;

  showCustomConfirm(
    "Remove Activity? 🗑️",
    removeTaskHtml,
    () => {
      item.dataset.removed = '1';
      item.classList.add('hidden');
      refreshActivitiesDirty();
    },
    null,
    "Remove Activity",
    "Keep Activity",
    "pixel-btn danger",
    "pixel-btn greyed-out",
    ADMIN_SURFACE
  );
}

let newTaskSeq = 0;

/** Draft-only add (Phase 0a): appends a data-new row; state.tasks is untouched. */
function addNewTask() {
  const container = document.getElementById('admin-tasks-list');
  if (!container) return;
  newTaskSeq += 1;
  const item = buildAdminTaskItem({
    id: `task_${Date.now()}_${newTaskSeq}`,
    name: 'New Activity',
    emoji: '📝',
    instructions: ''
  }, true);
  container.appendChild(item);
  refreshActivitiesDirty();
  const nameInput = item.querySelector('.task-name-input');
  if (nameInput) {
    nameInput.focus({ preventScroll: true });
    nameInput.select();
  }
  if (typeof item.scrollIntoView === 'function') item.scrollIntoView({ block: 'nearest' });
}

function generateSlug(text) {
  return text.toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')     // Remove non-word chars (except spaces and hyphens)
    .replace(/[\s_]+/g, '-')       // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '');     // Trim leading/trailing hyphens
}

const TASK_CONFLICT_MESSAGE = 'This activity was changed on another device.';

/**
 * Save Activities (Phase 0a): reads the DOM draft and merges it BY ID onto the
 * *current* state.tasks (which a Firestore snapshot may have replaced while
 * Admin was open). Validates everything first, then applies atomically:
 *   - edited rows update their task in place;
 *   - removed rows soft-delete (active:false + deletedAt), history kept;
 *   - new rows reactivate a same-name soft-deleted task, else get a unique slug id;
 *   - tasks not shown in the list (inactive, or added elsewhere) are kept.
 * A row whose task no longer exists / was removed elsewhere is a conflict:
 * the draft is kept, the row is flagged inline, nothing is written.
 */
function saveAdminTasks() {
  const container = document.getElementById('admin-tasks-list');
  if (!container) return false;

  const rows = readActivityRows(true);
  const liveRows = rows.filter(r => !r.removed);

  if (liveRows.some(r => !r.name)) {
    adminNotice("Activity Error ❌", "Activity name cannot be empty!");
    return false;
  }

  if (!state.tasks) state.tasks = [];
  const tasks = state.tasks;
  const findTask = id => tasks.find(t => t.id === id);

  container.querySelectorAll('.admin-task-conflict').forEach(el => el.remove());
  const conflicts = liveRows.filter(r => {
    if (r.isNew) return false;
    const t = findTask(r.id);
    return !t || t.active === false;
  });
  if (conflicts.length > 0) {
    conflicts.forEach(r => {
      const msg = document.createElement('div');
      msg.className = 'admin-task-conflict';
      msg.setAttribute('role', 'alert');
      msg.textContent = TASK_CONFLICT_MESSAGE;
      r.item.appendChild(msg);
    });
    adminNotice(
      "Couldn't Save ⚠️",
      `${TASK_CONFLICT_MESSAGE} Your changes are still here — remove that activity or close Admin to reload the list, then try again.`
    );
    return false;
  }

  const today = formatLocalDate(new Date());
  const rowTask = new Map();

  rows.filter(r => r.removed && !r.isNew).forEach(r => {
    const t = findTask(r.id);
    if (t && t.active !== false) {
      t.active = false;
      t.deletedAt = today;
    }
  });

  liveRows.filter(r => !r.isNew).forEach(r => {
    const t = findTask(r.id);
    t.emoji = r.emoji;
    t.name = r.name;
    t.instructions = r.instructions;
    rowTask.set(r, t);
  });

  liveRows.filter(r => r.isNew).forEach(r => {
    const deletedMatch = tasks.find(t => t.active === false && (t.name || '').toLowerCase() === r.name.toLowerCase());
    if (deletedMatch) {
      deletedMatch.active = true;
      deletedMatch.deletedAt = null;
      deletedMatch.emoji = r.emoji;
      deletedMatch.instructions = r.instructions;
      rowTask.set(r, deletedMatch);
      return;
    }
    const slugId = generateSlug(r.name) || 'activity';
    let finalId = slugId;
    let counter = 2;
    while (tasks.some(t => t.id === finalId)) {
      finalId = `${slugId}-${counter}`;
      counter++;
    }
    const created = {
      id: finalId,
      name: r.name,
      emoji: r.emoji,
      concept: 'Keep practicing!',
      instructions: r.instructions,
      active: true,
      createdAt: today,
      deletedAt: null
    };
    tasks.push(created);
    rowTask.set(r, created);
  });

  applyDraftOrder(tasks, liveRows.map(r => rowTask.get(r)));

  saveState();
  renderState(true);
  renderAdminTasksList();
  showAdminToast("Activities Saved ✨", "Activities saved successfully!");
  return true;
}

/**
 * ▲▼ order (§11.6 #8): the listed tasks are written back into the array slots
 * they already occupy, in draft order. Every other task — retired ones and any
 * added on another device — keeps its exact index.
 */
function applyDraftOrder(tasks, draftOrdered) {
  const ordered = [...new Set(draftOrdered.filter(Boolean))];
  const members = new Set(ordered);
  const slots = [];
  tasks.forEach((t, i) => { if (members.has(t)) slots.push(i); });
  slots.forEach((slot, k) => { tasks[slot] = ordered[k]; });
}

const COPY_FALLBACK = {
  title: 'Copy this backup code',
  description: "Couldn't copy automatically. The code is selected below — copy it and keep it somewhere safe."
};

function copyBackupCode(code, successTitle, successMessage) {
  const fallback = () => showBackupCode({ ...COPY_FALLBACK, code });
  if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
    fallback();
    return;
  }
  navigator.clipboard.writeText(code)
    .then(() => showAdminToast(successTitle, successMessage))
    .catch(fallback);
}

function exportState() {
  copyBackupCode(JSON.stringify(state), "Code Copied 📋", "This child's backup code is on the clipboard. Save it somewhere safe.");
}

function validateChildBackup(code) {
  let parsed;
  try {
    parsed = JSON.parse(code);
  } catch (e) {
    return { ok: false, title: "IMPORT ERROR", message: "That code couldn't be read. Make sure you copied all of it." };
  }
  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, title: "IMPORT ERROR", message: "Invalid backup code format!" };
  }
  if ((parsed.level !== undefined || parsed.partnersData !== undefined) && parsed.grid !== undefined) {
    return { ok: true, value: parsed };
  }
  return { ok: false, title: "IMPORT ERROR", message: "This isn't a child backup code. Make sure you copied the entire code." };
}

async function importState() {
  const name = state.childName || 'this child';
  const parsed = await readBackupCode({
    title: 'Restore from code',
    description: `Paste a child backup code. It replaces ${name}'s current progress.`,
    validate: validateChildBackup
  });
  if (!parsed) return;
  showCustomConfirm(
    "Restore Backup? ⚠️",
    `Restoring overwrites ${name}'s current progress with the backup. This can't be undone.`,
    () => {
      replaceState(parsed);
      saveState();
      renderState(true);
      showCustomNotification("RESTORE SUCCESS", "Trainer progress restored successfully!");
      const adminModalEl = document.getElementById('admin-modal');
      if (adminModalEl) adminModalEl.classList.add('hidden');
    },
    null,
    "Restore",
    "Cancel",
    "pixel-btn danger",
    "pixel-btn greyed-out",
    ADMIN_SURFACE
  );
}

async function exportCloudState() {
  try {
    const data = await appCallbacks.exportCloudData();
    if (!data) {
      adminNotice("EXPORT FAILED ❌", "No cloud data found. Ensure you are logged in and have profiles.");
      return;
    }
    copyBackupCode(JSON.stringify(data), "Family Code Copied 📋", "The family backup code is on the clipboard. It includes the parent passcode — store it privately.");
  } catch (err) {
    console.error("Cloud export failed:", err);
    adminNotice("EXPORT ERROR ❌", "Failed to export cloud data: " + err.message);
  }
}

function validateFamilyBackup(code) {
  let parsed;
  try {
    parsed = JSON.parse(code);
  } catch (e) {
    return { ok: false, title: "PARSE ERROR ❌", message: "That code couldn't be read. Make sure you copied all of it." };
  }
  if (parsed && typeof parsed === 'object' && parsed.profiles) {
    return { ok: true, value: parsed };
  }
  return { ok: false, title: "INVALID CODE ❌", message: "This isn't a family backup code." };
}

async function importCloudState() {
  const parsed = await readBackupCode({
    title: 'Restore family from code',
    description: 'Paste a family backup code. It replaces every child and all progress.',
    validate: validateFamilyBackup
  });
  if (!parsed) return;
  showCustomConfirm(
    "Restore Full Cloud Backup? ⚠️",
    "Restoring completely overwrites ALL children and their progress with the backup. This can't be undone.",
    async () => {
      try {
        await appCallbacks.importCloudData(parsed);
        showCustomNotification("RESTORE SUCCESS", "Full family progress restored successfully!");
        const adminModalEl = document.getElementById('admin-modal');
        if (adminModalEl) adminModalEl.classList.add('hidden');
      } catch (err) {
        console.error("Cloud restore failed:", err);
        adminNotice("RESTORE ERROR ❌", "Failed to restore cloud data: " + err.message);
      }
    },
    null,
    "Restore Everything",
    "Cancel",
    "pixel-btn danger",
    "pixel-btn greyed-out",
    ADMIN_SURFACE
  );
}

function renderClaimedRewardsHistory() {
  const listContainer = document.getElementById('claimed-rewards-history-list');
  if (!listContainer) return;
  
  listContainer.innerHTML = '';
  const history = state.claimedRewardsHistory || [];
  
  if (history.length === 0) {
    listContainer.innerHTML = '<p class="no-rewards">No rewards claimed yet.</p>';
    return;
  }
  
  history.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = 'reward-history-item';
    
    const formattedDate = new Date(item.date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    itemEl.innerHTML = `
      <div class="reward-history-name ${item.type === 'mega' ? 'mega' : ''}">
        <span class="reward-emoji">${item.type === 'mega' ? '👑' : '🎁'}</span>
        <span class="reward-text">${item.reward}</span>
      </div>
      <div class="reward-history-meta">
        ${formattedDate} • Week ${item.weekNumber} • ${item.partner} (LV ${item.level})
      </div>
    `;
    listContainer.appendChild(itemEl);
  });
}



const RELOAD_HINT_ONLINE = 'Reload needs internet. Progress is kept.';
const RELOAD_HINT_OFFLINE = "You're offline. Reload needs internet.";

/** Reload latest version is disabled offline, so a kid tablet is never left without the app. */
function refreshReloadAvailability() {
  const btn = adminForceUpdateBtn || document.getElementById('admin-force-update-btn');
  if (!btn) return;
  const offline = navigator.onLine === false;
  btn.disabled = offline;
  const hint = document.getElementById('admin-force-update-hint');
  if (hint) hint.textContent = offline ? RELOAD_HINT_OFFLINE : RELOAD_HINT_ONLINE;
}

function reloadLatestVersion() {
  const done = () => appCallbacks.reload();
  const clearCaches = () => ('caches' in window)
    ? caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key))))
    : Promise.resolve();
  const unregister = () => ('serviceWorker' in navigator)
    ? navigator.serviceWorker.getRegistrations().then(regs => Promise.all(regs.map(r => r.unregister())))
    : Promise.resolve();
  unregister().then(clearCaches).then(done).catch(err => {
    console.error("Error during reload:", err);
    done();
  });
}

function forceAppUpdate() {
  if (navigator.onLine === false) {
    refreshReloadAvailability();
    adminNotice("You're Offline 📡", "Reloading needs internet. Try again when this device is back online.");
    return;
  }
  showCustomConfirm(
    "Reload the latest version? 🔄",
    "The app will restart and load the newest version. Needs internet. Progress (levels, badges, history) is kept.",
    () => {
      if (navigator.onLine === false) {
        refreshReloadAvailability();
        adminNotice("You're Offline 📡", "Reloading needs internet. Try again when this device is back online.");
        return;
      }
      reloadLatestVersion();
    },
    null,
    "Reload",
    "Cancel",
    "pixel-btn",
    "pixel-btn greyed-out",
    ADMIN_SURFACE
  );
}
