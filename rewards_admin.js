/**
 * Reward editor (#edit-rewards-modal) — extracted from app.js as a pure move.
 * See docs/prd_admin_panel_redesign.md §7.
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
  showCustomNotification: notInjected('showCustomNotification')
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
      editRewardsModal.classList.add('hidden');
      document.querySelector('.layout-container').classList.remove('blurred');
      discardRewardsDraft();
    });
  }

  if (editRewardsSaveBtn) {
    editRewardsSaveBtn.addEventListener('click', async () => {
      if (!editingProfileId) return;
      
      try {
        editRewardsSaveBtn.disabled = true;
        editRewardsSaveBtn.textContent = 'Saving...';
        
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
        editRewardsModal.classList.add('hidden');
        document.querySelector('.layout-container').classList.remove('blurred');
      } catch (err) {
        console.error("Failed to save rewards:", err);
        adminNotice("Error ❌", "Failed to save customized rewards.");
      } finally {
        editRewardsSaveBtn.disabled = false;
        editRewardsSaveBtn.textContent = 'Save Rewards';
        discardRewardsDraft();
      }
    });
  }

  // Admin > Rewards pane launcher (D5): same stacked editor, for the active child.
  const adminCustomizeRewardsBtn = document.getElementById('admin-customize-rewards-btn');
  if (adminCustomizeRewardsBtn) {
    adminCustomizeRewardsBtn.addEventListener('click', () => {
      const activeId = getActiveProfileId();
      const profile = activeId ? getProfilesList().find(p => p.id === activeId) : null;
      if (!profile) {
        adminNotice(
          "No Child Selected 👥",
          "Sign in and pick a child profile first, then customize their rewards here."
        );
        return;
      }
      openEditRewardsModal(profile.id, profile.name);
    });
  }
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

export function openEditRewardsModal(profileId, profileName) {
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
  
  editRewardsTitle.textContent = `Customize Rewards for ${profileName}`;
  renderEditRewardsLists();
  
  // Clear inputs
  newWeeklyRewardInput.value = '';
  newMegaRewardInput.value = '';
  
  editRewardsModal.classList.remove('hidden');
  document.querySelector('.layout-container').classList.add('blurred');
}

function renderEditRewardsLists() {
  renderRewardList(weeklyRewardsList, tempWeeklyRewards, 'weekly');
  renderRewardList(megaRewardsList, tempMegaRewards, 'mega');
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
          <button class="pixel-btn success small save-reward-edit-btn" data-type="${type}" data-index="${idx}" title="Save Changes">
            <svg class="admin-btn-icon" viewBox="0 0 512 512" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.404c-9.998 9.997-26.208 9.997-36.204 0z"/>
            </svg>
          </button>
          <button class="pixel-btn greyed-out small cancel-reward-edit-btn" data-type="${type}" data-index="${idx}" title="Cancel Edit">
            <svg class="admin-btn-icon" viewBox="0 0 352 512" fill="white" xmlns="http://www.w3.org/2000/svg">
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
      };
      
      const performCancel = () => {
        editingRewardState = { type: null, index: -1 };
        renderEditRewardsLists();
      };
      
      saveBtn.addEventListener('click', performSave);
      cancelBtn.addEventListener('click', performCancel);
      
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          performSave();
        } else if (e.key === 'Escape') {
          e.preventDefault();
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
          <button class="pixel-btn info small edit-reward-btn" data-type="${type}" data-index="${idx}" title="Edit Reward">
            <svg class="admin-btn-icon" viewBox="0 0 512 512" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.6 23.7 6.1l120.4-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-91.9 27 27-91.9 203.8-203.8 64.9 64.9L160 399.4zM494.6 119.5l-44.1-44.1c-23.4-23.4-61.4-23.4-84.9 0l-21.7 21.7 64.9 64.9 21.7-21.7c23.4-23.4 23.4-61.4 0-84.9z"/>
            </svg>
          </button>
          <button class="pixel-btn danger small delete-reward-btn" data-type="${type}" data-index="${idx}" title="Delete Reward">
            <svg class="admin-btn-icon" viewBox="0 0 448 512" fill="white" xmlns="http://www.w3.org/2000/svg">
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
