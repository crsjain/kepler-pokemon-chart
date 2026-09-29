/**
 * Reward editor — extracted from app.js as a pure move (PRD §7), then made
 * inline for the active child (PRD v2.0 §11.5 Phase 4).
 *
 * There is ONE editor subtree (#rewards-editor). It is re-parented:
 *  - into #admin-rewards-editor-host (Admin > Rewards) for the active child,
 *    with a dark sticky Save/Discard bar and a dirty dot on the tab;
 *  - back into #edit-rewards-modal for a non-active child opened from a
 *    Family row (Q3a), with the stacked-sheet Cancel / Save Rewards.
 * IDs therefore stay unique in both modes.
 *
 * app.js wires this module through initRewardsAdmin(). Bindings that app.js or
 * the test helpers REASSIGN (profilesList, activeProfileId, the
 * saveProfileRewardsToCloudFn mock seam) are passed as getters / late-binding
 * arrows, never as values. Defaults are loud so a missed wiring shows up as a
 * console error instead of silently doing nothing.
 */
import { state, saveState } from './state.js';
import { DEFAULT_WEEKLY_REWARDS, DEFAULT_MEGA_REWARDS } from './migrations.js';

const notInjected = (name, fallback) => (...args) => {
  console.error(`rewards_admin: ${name} not injected`);
  return fallback;
};

let deps = {
  getProfilesList: notInjected('getProfilesList', []),
  getActiveProfileId: notInjected('getActiveProfileId', null),
  saveRewards: notInjected('saveRewards', Promise.resolve()),
  renderRewardDropdowns: notInjected('renderRewardDropdowns'),
  showCustomNotification: notInjected('showCustomNotification'),
  showCustomConfirm: notInjected('showCustomConfirm')
};

export function initRewardsAdmin(callbacks) {
  if (callbacks) {
    deps = { ...deps, ...callbacks };
  }
}

const getProfilesList = () => deps.getProfilesList();
const getActiveProfileId = () => deps.getActiveProfileId();
const saveProfileRewardsToCloudFn = (...args) => deps.saveRewards(...args);
const renderRewardDropdowns = (...args) => deps.renderRewardDropdowns(...args);
const showCustomNotification = (...args) => deps.showCustomNotification(...args);
// Routine success is a toast (PRD v2.0 §11.5); falls back to a notification.
const showToast = (title, message) => (deps.showToast ? deps.showToast(title, message) : deps.showCustomNotification(title, message));
// Rule 11 (same contract as admin.js adminNotice): neutral "Got it" in the admin
// secondary style for errors/warnings; success copy is untouched.
const adminNotice = (title, message) =>
  deps.showCustomNotification(title, message, null, false, null, 'adm-surface', 'Got it', 'adm-secondary');

const editRewardsModal = document.getElementById('edit-rewards-modal');
const editRewardsTitle = document.getElementById('edit-rewards-title');
const weeklyRewardsList = document.getElementById('weekly-rewards-list');
const newWeeklyRewardInput = document.getElementById('new-weekly-reward-input');
const addWeeklyRewardBtn = document.getElementById('add-weekly-reward-btn');
const megaRewardsList = document.getElementById('mega-rewards-list');
const newMegaRewardInput = document.getElementById('new-mega-reward-input');
const addMegaRewardBtn = document.getElementById('add-mega-reward-btn');
const editRewardsCancelBtn = document.getElementById('edit-rewards-cancel-btn');
const editRewardsSaveBtn = document.getElementById('edit-rewards-save-btn');
const rewardsEditor = document.getElementById('rewards-editor');
const rewardsEditorActions = document.getElementById('rewards-editor-actions');
const rewardsEditorStatus = document.getElementById('rewards-editor-status');
const rewardsEditorError = document.getElementById('rewards-editor-error');
const sheetContent = editRewardsModal ? editRewardsModal.querySelector('.modal-content') : null;
const inlineHost = document.getElementById('admin-rewards-editor-host');
const inlineEmpty = document.getElementById('admin-rewards-empty');

// 'inline' (Admin > Rewards, active child) | 'sheet' (#edit-rewards-modal) | null
let editorMode = null;
let draftBaseline = null;
let saving = false;

let editingProfileId = null;
let tempWeeklyRewards = [];
let tempMegaRewards = [];
// Draft selection (Phase 0a): an inline rename of the selected reward updates
// these, never state.reward / state.megaReward. Only Save Rewards commits them.
// Only tracked when editing the active child (a non-active child's selection
// is not in `state`).
let editingActiveChild = false;
let tempSelectedReward = null;
let tempSelectedMega = null;
let selectionAtOpen = { reward: null, mega: null };
let editingRewardState = { type: null, index: -1 };
let draggedRewardInfo = null;

/**
 * Edit Rewards modal: add weekly/mega reward, cancel, and cloud save.
 */
export function bindRewardsEditorEvents() {
  if (addWeeklyRewardBtn) {
    addWeeklyRewardBtn.addEventListener('click', () => {
      const val = newWeeklyRewardInput.value.trim();
      if (val && !tempWeeklyRewards.some(r => r.value === val || r.text === val)) {
        tempWeeklyRewards.push({ value: val, text: val });
        renderEditRewardsLists();
        newWeeklyRewardInput.value = '';
      }
    });
  }

  if (addMegaRewardBtn) {
    addMegaRewardBtn.addEventListener('click', () => {
      const val = newMegaRewardInput.value.trim();
      if (val && !tempMegaRewards.some(r => r.value === val || r.text === val)) {
        tempMegaRewards.push({ value: val, text: val });
        renderEditRewardsLists();
        newMegaRewardInput.value = '';
      }
    });
  }

  if (editRewardsCancelBtn) {
    editRewardsCancelBtn.addEventListener('click', () => {
      if (editorMode === 'inline') {
        // Discard: back to the saved lists; the editor stays open inline.
        const hadFocus = rewardsEditorActions && rewardsEditorActions.contains(document.activeElement);
        loadRewardsDraft(editingProfileId);
        if (hadFocus && newWeeklyRewardInput) newWeeklyRewardInput.focus({ preventScroll: true });
        return;
      }
      closeRewardsSheet();
    });
  }

  if (editRewardsSaveBtn) {
    editRewardsSaveBtn.addEventListener('click', () => {
      const hadFocus = rewardsEditorActions && rewardsEditorActions.contains(document.activeElement);
      commitRewardsDraft().then(ok => {
        if (ok && hadFocus && editorMode === 'inline' && newWeeklyRewardInput) {
          newWeeklyRewardInput.focus({ preventScroll: true });
        }
      });
    });
  }

  // Enter in an add field adds the reward (keyboard parity with the button).
  [[newWeeklyRewardInput, addWeeklyRewardBtn], [newMegaRewardInput, addMegaRewardBtn]].forEach(([input, btn]) => {
    if (!input || !btn) return;
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        btn.click();
      }
    });
  });
}

/**
 * Save for both modes. Resolves true on success. A reject keeps the draft and
 * shows an inline error (§6.3 async states); the editor stays open.
 */
async function commitRewardsDraft() {
  if (!editingProfileId || saving) return false;
  const mode = editorMode;
  const saveLabel = mode === 'inline' ? 'Save' : 'Save Rewards';
  saving = true;
  let ok = false;
  try {
        setRewardsError('');
        editRewardsSaveBtn.disabled = true;
        editRewardsSaveBtn.textContent = 'Saving…';
        
        await saveProfileRewardsToCloudFn(editingProfileId, tempWeeklyRewards, tempMegaRewards);
        
        // Update profilesList in memory immediately to prevent stale reads on quick reopen
        const profile = getProfilesList().find(p => p.id === editingProfileId);
        if (profile) {
          if (!profile.state) profile.state = {};
          profile.state.weeklyRewardOptions = [...tempWeeklyRewards];
          profile.state.megaRewardOptions = [...tempMegaRewards];
        }
        
        if (editingProfileId === getActiveProfileId()) {
          state.weeklyRewardOptions = [...tempWeeklyRewards];
          state.megaRewardOptions = [...tempMegaRewards];

          // Commit the draft selection (renames of the selected reward), unless
          // a snapshot changed the live selection while the editor was open.
          if (editingActiveChild) {
            if (tempSelectedReward !== selectionAtOpen.reward && state.reward === selectionAtOpen.reward) {
              state.reward = tempSelectedReward;
            }
            if (tempSelectedMega !== selectionAtOpen.mega && state.megaReward === selectionAtOpen.mega) {
              state.megaReward = tempSelectedMega;
            }
          }

          // Verify current active selections
          if (state.reward) {
            const exists = state.weeklyRewardOptions.some(r => r.value === state.reward || r.text === state.reward);
            if (!exists) {
              state.reward = '';
            }
          }
          if (state.megaReward) {
            const exists = state.megaRewardOptions.some(r => r.value === state.megaReward || r.text === state.megaReward);
            if (!exists) {
              state.megaReward = '';
            }
          }

          saveState();
          renderRewardDropdowns();
        }
        
        showToast("Saved ✨", "Rewards customized successfully!");
        ok = true;
  } catch (err) {
    console.error("Failed to save rewards:", err);
    setRewardsError("Couldn't save rewards. Your changes are still here — check the connection and try again.");
  } finally {
    saving = false;
    editRewardsSaveBtn.disabled = false;
    editRewardsSaveBtn.textContent = saveLabel;
  }
  if (ok) {
    if (mode === 'sheet') {
      closeRewardsSheet();
    } else if (mode === 'inline' && editorMode === 'inline') {
      loadRewardsDraft(editingProfileId); // re-baseline on the saved lists
    }
  }
  return ok;
}

function setRewardsError(message) {
  if (!rewardsEditorError) return;
  rewardsEditorError.textContent = message;
  rewardsEditorError.classList.toggle('hidden', !message);
}

function closeRewardsSheet() {
  editRewardsModal.classList.add('hidden');
  document.querySelector('.layout-container').classList.remove('blurred');
  discardRewardsDraft();
  editorMode = null;
  setRewardsError('');
  refreshRewardsDirty();
}

function draftSnapshot() {
  return JSON.stringify([tempWeeklyRewards, tempMegaRewards, tempSelectedReward, tempSelectedMega]);
}

/** True when the inline (active-child) draft differs from what was loaded. */
export function isInlineRewardsDirty() {
  return editorMode === 'inline' && !!editingProfileId && draftBaseline !== null &&
    draftSnapshot() !== draftBaseline;
}

/** Guard "Save & close": saves the inline draft; resolves false on failure. */
export function saveInlineRewards() {
  if (!isInlineRewardsDirty()) return Promise.resolve(true);
  return commitRewardsDraft();
}

/** Admin closed (or Discard in the guard): drop the inline draft. */
export function discardInlineRewards() {
  if (editorMode !== 'inline') return;
  discardRewardsDraft();
  editorMode = null;
  setRewardsError('');
  refreshRewardsDirty();
}

/** Save bar, status line and the Rewards tab's dirty dot follow the draft. */
function refreshRewardsDirty() {
  const dirty = isInlineRewardsDirty();
  if (rewardsEditorActions && editorMode === 'inline') {
    rewardsEditorActions.classList.toggle('hidden', !dirty && !saving);
  }
  if (rewardsEditorStatus) rewardsEditorStatus.textContent = dirty ? '● Unsaved changes' : '';
  const tab = document.getElementById('admin-tab-rewards');
  if (tab) {
    if (dirty) {
      tab.dataset.dirty = 'true';
      tab.title = 'Rewards has unsaved changes';
    } else {
      delete tab.dataset.dirty;
      tab.removeAttribute('title');
    }
  }
}

/** Moves the one editor subtree and sets the per-mode chrome. */
function mountEditor(mode) {
  if (!rewardsEditor) return;
  const target = mode === 'inline' ? inlineHost : sheetContent;
  if (target && rewardsEditor.parentElement !== target) target.appendChild(rewardsEditor);
  editorMode = mode;
  if (mode === 'inline') {
    rewardsEditorActions.className = 'admin-tasks-actions adm-savebar hidden';
    editRewardsCancelBtn.className = 'pixel-btn adm-tertiary';
    editRewardsCancelBtn.textContent = 'Discard';
    editRewardsSaveBtn.className = 'pixel-btn adm-primary';
    editRewardsSaveBtn.textContent = 'Save';
  } else {
    rewardsEditorActions.className = 'password-prompt-actions';
    editRewardsCancelBtn.className = 'pixel-btn greyed-out';
    editRewardsCancelBtn.textContent = 'Cancel';
    editRewardsSaveBtn.className = 'pixel-btn success';
    editRewardsSaveBtn.textContent = 'Save Rewards';
  }
}

/**
 * Admin > Rewards was shown. Mounts the editor inline for the active child.
 * A dirty draft for the same child survives tab switches; otherwise the
 * lists are (re)loaded so a reopen never shows stale data.
 */
export function showInlineRewards() {
  if (!inlineHost || !rewardsEditor) return;
  if (editorMode === 'sheet' && !editRewardsModal.classList.contains('hidden')) return;
  const activeId = getActiveProfileId();
  const profile = activeId ? getProfilesList().find(p => p.id === activeId) : null;
  if (!profile) {
    discardInlineRewards();
    if (inlineEmpty) inlineEmpty.classList.remove('hidden');
    inlineHost.classList.add('hidden');
    return;
  }
  if (inlineEmpty) inlineEmpty.classList.add('hidden');
  inlineHost.classList.remove('hidden');
  if (editorMode === 'inline' && editingProfileId === profile.id &&
      rewardsEditor.parentElement === inlineHost && isInlineRewardsDirty()) {
    return;
  }
  mountEditor('inline');
  loadRewardsDraft(profile.id);
}

/** Drops every editor temp: lists, draft selection, inline-edit and drag state. */
function discardRewardsDraft() {
  editingProfileId = null;
  editingRewardState = { type: null, index: -1 };
  draggedRewardInfo = null;
  tempWeeklyRewards = [];
  tempMegaRewards = [];
  editingActiveChild = false;
  tempSelectedReward = null;
  tempSelectedMega = null;
  selectionAtOpen = { reward: null, mega: null };
  draftBaseline = null;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Family row "Edit Rewards" for a NON-active child (Q3a): the stacked sheet.
 * An unsaved inline draft for the active child is never dropped silently.
 */
export function openEditRewardsModal(profileId, profileName) {
  if (isInlineRewardsDirty()) {
    const activeProfile = getProfilesList().find(p => p.id === editingProfileId);
    const who = activeProfile && activeProfile.name ? `${activeProfile.name}'s` : 'The';
    deps.showCustomConfirm(
      'Unsaved Rewards ✏️',
      `${escapeHtml(who)} reward changes in the Rewards tab aren't saved yet. Discard them and edit ${escapeHtml(profileName)}'s rewards?`,
      () => {
        discardInlineRewards();
        openEditRewardsModal(profileId, profileName);
      },
      null,
      'Discard & continue',
      'Keep editing',
      'pixel-btn danger',
      'pixel-btn',
      { surface: 'admin' }
    );
    return;
  }
  mountEditor('sheet');
  setRewardsError('');
  loadRewardsDraft(profileId);
  editRewardsTitle.textContent = `Customize Rewards for ${profileName}`;
  editRewardsModal.classList.remove('hidden');
  document.querySelector('.layout-container').classList.add('blurred');
  refreshRewardsDirty();
}

/** Loads the saved lists (and, for the active child, the selection) as the draft. */
function loadRewardsDraft(profileId) {
  editingProfileId = profileId;
  editingRewardState = { type: null, index: -1 };
  draggedRewardInfo = null;
  const profile = getProfilesList().find(p => p.id === profileId);
  const pState = (profile && profile.state) ? profile.state : {};
  
  tempWeeklyRewards = (pState.weeklyRewardOptions && pState.weeklyRewardOptions.length > 0)
    ? pState.weeklyRewardOptions.map(r => ({ ...r }))
    : DEFAULT_WEEKLY_REWARDS.map(r => ({ ...r }));
  tempMegaRewards = (pState.megaRewardOptions && pState.megaRewardOptions.length > 0)
    ? pState.megaRewardOptions.map(r => ({ ...r }))
    : DEFAULT_MEGA_REWARDS.map(r => ({ ...r }));

  editingActiveChild = profileId === getActiveProfileId();
  tempSelectedReward = editingActiveChild ? state.reward : null;
  tempSelectedMega = editingActiveChild ? state.megaReward : null;
  selectionAtOpen = { reward: tempSelectedReward, mega: tempSelectedMega };
  draftBaseline = draftSnapshot();
  setRewardsError('');

  // Clear inputs
  newWeeklyRewardInput.value = '';
  newMegaRewardInput.value = '';

  renderEditRewardsLists();
}

function renderEditRewardsLists() {
  renderRewardList(weeklyRewardsList, tempWeeklyRewards, 'weekly');
  renderRewardList(megaRewardsList, tempMegaRewards, 'mega');
  refreshRewardsDirty();
}

/** After an inline rename closes, focus returns to that row's Edit button. */
function focusRewardEditButton(type, idx) {
  const container = type === 'weekly' ? weeklyRewardsList : megaRewardsList;
  const btn = container && container.querySelector(`.edit-reward-btn[data-index="${idx}"]`);
  if (btn) btn.focus({ preventScroll: true });
}

function renderRewardList(container, list, type) {
  container.innerHTML = '';
  if (list.length === 0) {
    container.innerHTML = '<p class="no-items">No rewards configured.</p>';
    return;
  }
  
  list.forEach((item, idx) => {
    const isEditing = editingRewardState.type === type && editingRewardState.index === idx;
    const row = document.createElement('div');
    row.className = 'reward-list-item';
    row.dataset.type = type;
    row.dataset.index = idx;
    
    if (isEditing) {
      row.innerHTML = `
        <input type="text" class="reward-edit-input" value="${escapeHtml(item.text)}" placeholder="Enter reward description...">
        <div class="reward-actions">
          <button class="pixel-btn adm-primary adm-icon-btn save-reward-edit-btn" data-type="${type}" data-index="${idx}" title="Save Changes" aria-label="Save reward name">
            <svg class="admin-btn-icon" viewBox="0 0 512 512" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
              <path d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.404c-9.998 9.997-26.208 9.997-36.204 0z"/>
            </svg>
          </button>
          <button class="pixel-btn adm-tertiary adm-icon-btn cancel-reward-edit-btn" data-type="${type}" data-index="${idx}" title="Cancel Edit" aria-label="Cancel rename">
            <svg class="admin-btn-icon" viewBox="0 0 352 512" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
              <path d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"/>
            </svg>
          </button>
        </div>
      `;
      
      const input = row.querySelector('.reward-edit-input');
      const saveBtn = row.querySelector('.save-reward-edit-btn');
      const cancelBtn = row.querySelector('.cancel-reward-edit-btn');
      
      const performSave = () => {
        const val = input.value.trim();
        if (val) {
          const oldVal = list[idx].value;
          list[idx] = { value: val, text: val };
          if (editingActiveChild && type === 'weekly' && tempSelectedReward === oldVal) {
            tempSelectedReward = val;
          } else if (editingActiveChild && type === 'mega' && tempSelectedMega === oldVal) {
            tempSelectedMega = val;
          }
        }
        editingRewardState = { type: null, index: -1 };
        renderEditRewardsLists();
        focusRewardEditButton(type, idx);
      };
      
      const performCancel = () => {
        editingRewardState = { type: null, index: -1 };
        renderEditRewardsLists();
        focusRewardEditButton(type, idx);
      };
      
      saveBtn.addEventListener('click', performSave);
      cancelBtn.addEventListener('click', performCancel);
      
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          performSave();
        } else if (e.key === 'Escape') {
          // The rename owns Escape: it must not also close Admin or the sheet
          // (admin.js / app.js listen on document / window) (§11.6 #7).
          e.preventDefault();
          e.stopPropagation();
          performCancel();
        }
      });
      
      setTimeout(() => {
        input.focus();
        input.select();
      }, 0);
      
    } else {
      row.setAttribute('draggable', 'true');
      row.innerHTML = `
        <div class="reward-drag-handle" title="Drag to reorder" aria-label="Drag to reorder">⠿</div>
        <span class="reward-item-text" title="${escapeHtml(item.text)}">${escapeHtml(item.text)}</span>
        <div class="reward-actions">
          <button class="pixel-btn adm-secondary adm-icon-btn edit-reward-btn" data-type="${type}" data-index="${idx}" title="Edit Reward" aria-label="Rename ${escapeHtml(item.text)}">
            <svg class="admin-btn-icon" viewBox="0 0 512 512" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
              <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.6 23.7 6.1l120.4-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-91.9 27 27-91.9 203.8-203.8 64.9 64.9L160 399.4zM494.6 119.5l-44.1-44.1c-23.4-23.4-61.4-23.4-84.9 0l-21.7 21.7 64.9 64.9 21.7-21.7c23.4-23.4 23.4-61.4 0-84.9z"/>
            </svg>
          </button>
          <button class="pixel-btn adm-quiet-danger adm-icon-btn delete-reward-btn" data-type="${type}" data-index="${idx}" title="Delete Reward" aria-label="Delete ${escapeHtml(item.text)}">
            <svg class="admin-btn-icon" viewBox="0 0 448 512" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
              <path d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0H284.2C296.3 0 307.4 6.8 312.8 17.7L320 32H384C401.7 32 416 46.3 416 64C416 81.7 401.7 96 384 96H64C46.3 96 32 81.7 32 64C32 46.3 46.3 32 64 32H128L135.2 17.7zM32 128H416V448C416 483.3 387.3 512 352 512H96C60.7 512 32 483.3 32 448V128zM96 176C96 162.7 85.3 152 72 152C58.7 152 48 162.7 48 176V408C48 421.3 58.7 432 72 432C85.3 432 96 421.3 96 408V176z"/>
            </svg>
          </button>
        </div>
      `;
      
      const editBtn = row.querySelector('.edit-reward-btn');
      const delBtn = row.querySelector('.delete-reward-btn');
      const textSpan = row.querySelector('.reward-item-text');
      
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        editingRewardState = { type, index: idx };
        renderEditRewardsLists();
      });
      
      textSpan.addEventListener('click', () => {
        editingRewardState = { type, index: idx };
        renderEditRewardsLists();
      });
      
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const listToUpdate = type === 'weekly' ? tempWeeklyRewards : tempMegaRewards;
        listToUpdate.splice(idx, 1);
        editingRewardState = { type: null, index: -1 };
        renderEditRewardsLists();
      });
      
      bindRewardDragEvents(row, type, idx, container);
    }
    
    container.appendChild(row);
  });
}

function bindRewardDragEvents(row, type, idx, container) {
  // Desktop HTML5 drag & drop
  row.addEventListener('dragstart', (e) => {
    draggedRewardInfo = { type, index: idx };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
    setTimeout(() => {
      row.classList.add('dragging');
    }, 0);
  });

  row.addEventListener('dragend', () => {
    row.classList.remove('dragging');
    container.querySelectorAll('.reward-list-item').forEach(el => {
      el.classList.remove('drag-over-top', 'drag-over-bottom');
    });
    draggedRewardInfo = null;
  });

  row.addEventListener('dragover', (e) => {
    if (!draggedRewardInfo || draggedRewardInfo.type !== type) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const rect = row.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    if (e.clientY < midY) {
      row.classList.add('drag-over-top');
      row.classList.remove('drag-over-bottom');
    } else {
      row.classList.add('drag-over-bottom');
      row.classList.remove('drag-over-top');
    }
  });

  row.addEventListener('dragleave', () => {
    row.classList.remove('drag-over-top', 'drag-over-bottom');
  });

  row.addEventListener('drop', (e) => {
    if (!draggedRewardInfo || draggedRewardInfo.type !== type) return;
    e.preventDefault();
    row.classList.remove('drag-over-top', 'drag-over-bottom');

    const fromIdx = draggedRewardInfo.index;
    let toIdx = idx;
    const rect = row.getBoundingClientRect();
    if (e.clientY >= rect.top + rect.height / 2) {
      toIdx++;
    }

    const list = type === 'weekly' ? tempWeeklyRewards : tempMegaRewards;
    if (fromIdx !== toIdx) {
      const [movedItem] = list.splice(fromIdx, 1);
      const insertAt = fromIdx < toIdx ? toIdx - 1 : toIdx;
      list.splice(insertAt, 0, movedItem);
      draggedRewardInfo = null;
      renderEditRewardsLists();
    }
  });

  // Mobile & Touch drag & drop support via handle
  const handle = row.querySelector('.reward-drag-handle');
  if (handle) {
    let currentOverRow = null;

    handle.addEventListener('touchstart', (e) => {
      draggedRewardInfo = { type, index: idx };
      row.classList.add('dragging');
    }, { passive: true });

    handle.addEventListener('touchmove', (e) => {
      if (!draggedRewardInfo || draggedRewardInfo.type !== type) return;
      const touch = e.touches[0];
      const targetElem = document.elementFromPoint(touch.clientX, touch.clientY);
      const targetRow = targetElem ? targetElem.closest('.reward-list-item') : null;

      container.querySelectorAll('.reward-list-item').forEach(el => {
        el.classList.remove('drag-over-top', 'drag-over-bottom');
      });

      if (targetRow && targetRow.dataset.type === type && targetRow !== row) {
        currentOverRow = targetRow;
        const rect = targetRow.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (touch.clientY < midY) {
          targetRow.classList.add('drag-over-top');
        } else {
          targetRow.classList.add('drag-over-bottom');
        }
      } else {
        currentOverRow = null;
      }
    }, { passive: false });

    handle.addEventListener('touchend', () => {
      row.classList.remove('dragging');
      if (!draggedRewardInfo || draggedRewardInfo.type !== type) {
        draggedRewardInfo = null;
        return;
      }

      if (currentOverRow) {
        const fromIdx = draggedRewardInfo.index;
        let toIdx = parseInt(currentOverRow.dataset.index, 10);
        if (currentOverRow.classList.contains('drag-over-bottom')) {
          toIdx++;
        }
        currentOverRow.classList.remove('drag-over-top', 'drag-over-bottom');

        const list = type === 'weekly' ? tempWeeklyRewards : tempMegaRewards;
        if (fromIdx !== toIdx) {
          const [movedItem] = list.splice(fromIdx, 1);
          const insertAt = fromIdx < toIdx ? toIdx - 1 : toIdx;
          list.splice(insertAt, 0, movedItem);
        }
      }

      draggedRewardInfo = null;
      currentOverRow = null;
      renderEditRewardsLists();
    });

    handle.addEventListener('touchcancel', () => {
      row.classList.remove('dragging');
      if (currentOverRow) {
        currentOverRow.classList.remove('drag-over-top', 'drag-over-bottom');
      }
      draggedRewardInfo = null;
      currentOverRow = null;
    });
  }
}
