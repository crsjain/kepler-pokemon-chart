import { 
  state, 
  saveState, 
  loadState, 
  runStateDiagnostics,
  replaceState,
  ADMIN_PASSWORD,
  DAYS,
  getStageInfo,
  getBackupHistory,
  applyBackup
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
  reload: () => location.reload()
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

export function promptParentPassword(onSuccess, customDescription = 'Enter Parent Password to open Admin Panel:') {
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
  adminAddTaskBtn = document.getElementById('admin-add-task-btn');
  adminSaveTasksBtn = document.getElementById('admin-save-tasks-btn');

  if (adminBtn) {
    adminBtn.addEventListener('click', () => {
      promptParentPassword(() => {
        adminModal.classList.remove('hidden');
        renderAdminTasksList();
        renderBackupHistory();
        renderClaimedRewardsHistory();
        appCallbacks.renderAdminProfilesList();
      });
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
    closeAdminModalBtn.addEventListener('click', () => {
      adminModal.classList.add('hidden');
    });
  }

  if (adminModal) {
    adminModal.addEventListener('click', (e) => {
      if (e.target === adminModal) {
        adminModal.classList.add('hidden');
      }
    });
  }

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
      showCustomConfirm(
        "Wipe All Progress? 🚨",
        "This will completely erase all levels, XP, and badges, and restore defaults! This cannot be undone.",
        async () => {
          try {
            if (appCallbacks.wipeData) {
              await appCallbacks.wipeData();
            } else {
              localStorage.clear();
            }
            appCallbacks.reload();
          } catch (err) {
            showCustomNotification("Wipe Failed ❌", err.message);
          }
        },
        null,
        "Wipe Everything",
        "Cancel",
        "pixel-btn danger",
        "pixel-btn greyed-out"
      );
    });
  }

  if (adminAddTaskBtn) {
    adminAddTaskBtn.addEventListener('click', addNewTask);
  }
  if (adminSaveTasksBtn) {
    adminSaveTasksBtn.addEventListener('click', saveAdminTasks);
  }

  // Passcode Update handler
  const changePasscodeBtn = document.getElementById('admin-change-passcode-btn');
  const newPasscodeInput = document.getElementById('admin-new-passcode-input');
  
  if (changePasscodeBtn && newPasscodeInput) {
    changePasscodeBtn.addEventListener('click', () => {
      const newPasscode = newPasscodeInput.value.trim();
      if (!newPasscode) {
        appCallbacks.showCustomNotification("Passcode Error ❌", "Passcode cannot be empty!");
        return;
      }
      if (newPasscode.length < 4) {
        appCallbacks.showCustomNotification("Passcode Error ❌", "Passcode must be at least 4 characters!");
        return;
      }
      
      // Save local state
      state.adminPassword = newPasscode;
      saveState();
      
      newPasscodeInput.value = '';
      
      if (appCallbacks.saveAdminPassword) {
        appCallbacks.saveAdminPassword(newPasscode)
          .then(() => {
            appCallbacks.showCustomNotification("Passcode Updated 🔑", "Parent Admin passcode updated successfully!");
          })
          .catch(err => {
            console.error("Cloud passcode update failed:", err);
            appCallbacks.showCustomNotification("Passcode Warning ⚠️", "Passcode saved locally, but failed to sync to database: " + err.message);
          });
      } else {
        appCallbacks.showCustomNotification("Passcode Updated 🔑", "Parent Admin passcode updated successfully!");
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
      adminModal.classList.remove('hidden');
      renderAdminTasksList();
      renderBackupHistory();
      renderClaimedRewardsHistory();
    }
  } else {
    passwordError.classList.remove('hidden');
  }
}

function renderAdminTasksList() {
  const container = document.getElementById('admin-tasks-list');
  if (!container) return;
  
  container.innerHTML = '';
  const tasks = state.tasks || [];
  const activeTasks = tasks.filter(t => t.active !== false);
  
  activeTasks.forEach((task) => {
    const item = document.createElement('div');
    item.className = 'admin-task-item';
    item.dataset.taskId = task.id;
    
    item.innerHTML = `
      <div class="admin-task-row">
        <select class="task-emoji-select">
          <option value="🎹" ${task.emoji === '🎹' ? 'selected' : ''}>🎹</option>
          <option value="🧮" ${task.emoji === '🧮' ? 'selected' : ''}>🧮</option>
          <option value="📚" ${task.emoji === '📚' ? 'selected' : ''}>📚</option>
          <option value="✏️" ${task.emoji === '✏️' ? 'selected' : ''}>✏️</option>
          <option value="💮" ${task.emoji === '💮' ? 'selected' : ''}>💮</option>
          <option value="🧪" ${task.emoji === '🧪' ? 'selected' : ''}>🧪</option>
          <option value="🎨" ${task.emoji === '🎨' ? 'selected' : ''}>🎨</option>
          <option value="🏃" ${task.emoji === '🏃' ? 'selected' : ''}>🏃</option>
          <option value="🧹" ${task.emoji === '🧹' ? 'selected' : ''}>🧹</option>
          <option value="🥦" ${task.emoji === '🥦' ? 'selected' : ''}>🥦</option>
          <option value="📝" ${task.emoji === '📝' ? 'selected' : ''}>📝</option>
        </select>
        <input type="text" class="task-name-input" value="${task.name}">
        <button class="pixel-btn danger remove-task-btn" data-task-id="${task.id}">
          <svg class="delete-icon" viewBox="0 0 448 512" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0H284.2C296.3 0 307.4 6.8 312.8 17.7L320 32H384C401.7 32 416 46.3 416 64C416 81.7 401.7 96 384 96H64C46.3 96 32 81.7 32 64C32 46.3 46.3 32 64 32H128L135.2 17.7zM32 128H416V448C416 483.3 387.3 512 352 512H96C60.7 512 32 483.3 32 448V128zM96 176C96 162.7 85.3 152 72 152C58.7 152 48 162.7 48 176V408C48 421.3 58.7 432 72 432C85.3 432 96 421.3 96 408V176z"/>
          </svg>
        </button>
      </div>
      <div class="admin-task-instructions">
        <span class="instructions-label">Instructions:</span>
        <input type="text" class="task-instructions-input" value="${task.instructions || ''}" placeholder="What ${state.childName || 'Trainer'} needs to do (e.g. Play pieces 3x)">
      </div>
    `;
    container.appendChild(item);
  });
  
  container.querySelectorAll('.remove-task-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const taskId = e.currentTarget.dataset.taskId;
      removeTask(taskId);
    });
  });
}

function removeTask(taskId) {
  if (!state.tasks) return;
  const taskToRemove = state.tasks.find(t => t.id === taskId);
  if (!taskToRemove) return;
  
  const taskName = taskToRemove.name || 'Activity';
  const taskEmoji = taskToRemove.emoji || '📝';
  
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
      taskToRemove.active = false;
      taskToRemove.deletedAt = formatLocalDate(new Date());
      renderAdminTasksList();
    },
    null,
    "Remove Activity",
    "Keep Activity",
    "pixel-btn danger",
    "pixel-btn greyed-out"
  );
}

function addNewTask() {
  if (!state.tasks) state.tasks = [];
  const newId = `task_${Date.now()}`;
  state.tasks.push({
    id: newId,
    name: 'New Activity',
    emoji: '📝',
    concept: 'Keep practicing!',
    instructions: '',
    active: true,
    createdAt: formatLocalDate(new Date()),
    deletedAt: null
  });
  renderAdminTasksList();
}

function generateSlug(text) {
  return text.toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')     // Remove non-word chars (except spaces and hyphens)
    .replace(/[\s_]+/g, '-')       // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '');     // Trim leading/trailing hyphens
}

function saveAdminTasks() {
  const container = document.getElementById('admin-tasks-list');
  if (!container) return;
  
  const items = container.querySelectorAll('.admin-task-item');
  let hasError = false;
  
  const tasksToDelete = new Set();
  
  items.forEach(item => {
    const taskId = item.dataset.taskId;
    const emoji = item.querySelector('.task-emoji-select').value;
    const name = item.querySelector('.task-name-input').value.trim();
    const instructions = item.querySelector('.task-instructions-input').value.trim();
    
    if (!name) {
      showCustomNotification("Activity Error ❌", "Activity name cannot be empty!");
      hasError = true;
      return;
    }
    
    const isNew = taskId.startsWith('task_');
    let targetTask = state.tasks.find(t => t.id === taskId);
    
    if (isNew) {
      // Check if there is a soft-deleted task with the same name to reactivate
      const deletedMatch = state.tasks.find(t => t.active === false && t.name.toLowerCase() === name.toLowerCase());
      if (deletedMatch) {
        deletedMatch.active = true;
        deletedMatch.deletedAt = null;
        deletedMatch.emoji = emoji;
        deletedMatch.instructions = instructions;
        tasksToDelete.add(taskId);
        return;
      } else {
        // Generate slug ID
        let slugId = generateSlug(name);
        if (!slugId) slugId = 'activity';
        
        let finalId = slugId;
        let counter = 2;
        while (state.tasks.some(t => t.id === finalId)) {
          finalId = `${slugId}-${counter}`;
          counter++;
        }
        
        if (targetTask) {
          targetTask.id = finalId;
        }
      }
    }
    
    if (targetTask) {
      targetTask.emoji = emoji;
      targetTask.name = name;
      targetTask.instructions = instructions;
    }
  });
  
  if (hasError) return;
  
  if (tasksToDelete.size > 0) {
    state.tasks = state.tasks.filter(t => !tasksToDelete.has(t.id));
  }
  
  saveState();
  renderState(true);
  renderAdminTasksList();
  showCustomNotification("Activities Saved ✨", "Activities saved successfully!");
}

function exportState() {
  const stateStr = JSON.stringify(state);
  navigator.clipboard.writeText(stateStr).then(() => {
    showCustomNotification("EXPORT SUCCESS 📋", "Trainer progress copied to clipboard! Save this code somewhere safe.");
  }).catch(err => {
    prompt("Could not auto-copy. Please copy this backup code manually:", stateStr);
  });
}

function importState() {
  const code = prompt("Paste your Trainer backup code here:");
  if (!code) return;

  try {
    const parsed = JSON.parse(code);
    if (parsed && typeof parsed === 'object') {
      if ((parsed.level !== undefined || parsed.partnersData !== undefined) && parsed.grid !== undefined) {
        showCustomConfirm(
          "Restore Backup? ⚠️",
          "Are you sure you want to restore this backup? It will overwrite current progress!",
          () => {
            replaceState(parsed);
            saveState();
            renderState(true);
            showCustomNotification("RESTORE SUCCESS", "Trainer progress restored successfully!");
            const adminModal = document.getElementById('admin-modal');
            if (adminModal) adminModal.classList.add('hidden');
          }
        );
      } else {
        showCustomNotification("IMPORT ERROR", "Invalid backup code! Make sure you copied the entire code.");
      }
    } else {
      showCustomNotification("IMPORT ERROR", "Invalid backup code format!");
    }
  } catch (e) {
    console.error("Error importing state:", e);
    showCustomNotification("IMPORT ERROR", "Failed to parse the backup code. Make sure it is copied correctly.");
  }
}

async function exportCloudState() {
  try {
    const data = await appCallbacks.exportCloudData();
    if (!data) {
      showCustomNotification("EXPORT FAILED ❌", "No cloud data found. Ensure you are logged in and have profiles.");
      return;
    }
    const dataStr = JSON.stringify(data);
    navigator.clipboard.writeText(dataStr).then(() => {
      showCustomNotification("CLOUD EXPORT SUCCESS 📋", "Full Family backup copied to clipboard! Save this code somewhere safe.");
    }).catch(err => {
      prompt("Could not auto-copy. Please copy this backup code manually:", dataStr);
    });
  } catch (err) {
    console.error("Cloud export failed:", err);
    showCustomNotification("EXPORT ERROR ❌", "Failed to export cloud data: " + err.message);
  }
}

async function importCloudState() {
  const code = prompt("Paste your FULL FAMILY Trainer backup code here (This will overwrite ALL profiles!):");
  if (!code) return;

  try {
    const parsed = JSON.parse(code);
    if (parsed && typeof parsed === 'object' && parsed.profiles) {
      showCustomConfirm(
        "Restore Full Cloud Backup? ⚠️",
        "Are you sure you want to restore this full backup? It will completely overwrite ALL profiles and progress in the cloud!",
        async () => {
          try {
            await appCallbacks.importCloudData(parsed);
            showCustomNotification("RESTORE SUCCESS", "Full family progress restored successfully!");
            const adminModal = document.getElementById('admin-modal');
            if (adminModal) adminModal.classList.add('hidden');
          } catch (err) {
            console.error("Cloud restore failed:", err);
            showCustomNotification("RESTORE ERROR ❌", "Failed to restore cloud data: " + err.message);
          }
        },
        null,
        "Restore Everything",
        "Cancel",
        "pixel-btn danger",
        "pixel-btn greyed-out"
      );
    } else {
      showCustomNotification("INVALID CODE ❌", "The provided code is not a valid full family backup.");
    }
  } catch (e) {
    showCustomNotification("PARSE ERROR ❌", "Failed to parse backup code: " + e.message);
  }
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

function renderBackupHistory() {
  const listContainer = document.getElementById('backup-history-list');
  if (!listContainer) return;
  
  listContainer.innerHTML = '';
  
  const history = getBackupHistory().slice(0, 2);
  if (history.length === 0) {
    listContainer.innerHTML = '<p class="no-backups">No backups available yet.</p>';
    return;
  }
  
  history.forEach((backup, idx) => {
    const backupEl = document.createElement('div');
    backupEl.className = 'backup-item';
    
    const dateStr = new Date(backup.timestamp).toLocaleString(undefined, {
      month: 'numeric',
      day: 'numeric',
      year: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    const family = backup.state.partnerFamily || '25';
    const stats = backup.state.partnersData[family] || { level: 1 };
    const stageInfo = getStageInfo(family, stats.stageId || family);
    const partnerName = stageInfo.currentStage.name;
    const completedWeeks = backup.state.megaWeeks || 0;
    
    backupEl.innerHTML = `
      <div class="backup-info">
        <span class="backup-details">${partnerName} (LV ${stats.level}) • Week ${completedWeeks + 1}</span>
        <span class="backup-date">${dateStr}</span>
      </div>
      <button class="pixel-btn info small restore-backup-btn" data-index="${idx}">Restore</button>
    `;
    listContainer.appendChild(backupEl);
  });
  
  listContainer.querySelectorAll('.restore-backup-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.dataset.index);
      restoreBackupFromHistory(idx);
    });
  });
}

function restoreBackupFromHistory(index) {
  const history = getBackupHistory();
  const backup = history[index];
  
  if (backup) {
    showCustomConfirm(
      "Restore Backup? 📋",
      `Restore progress from ${new Date(backup.timestamp).toLocaleString()}? Current progress will be overwritten.`,
      () => {
        if (applyBackup(index)) {
          renderState(true);
          showCustomNotification("RESTORE SUCCESS", "Progress restored successfully!");
          const adminModal = document.getElementById('admin-modal');
          if (adminModal) adminModal.classList.add('hidden');
        }
      }
    );
  }
}

function forceAppUpdate() {
  showCustomConfirm(
    "Force App Update? 🚀",
    "This will clear the asset cache and force the app to reload the latest code from the server. Your progress (levels, badges, history) will NOT be lost.",
    () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          const promises = registrations.map(r => r.unregister());
          return Promise.all(promises);
        }).then(() => {
          if ('caches' in window) {
            return caches.keys().then(keys => {
              return Promise.all(keys.map(key => caches.delete(key)));
            });
          }
        }).then(() => {
          location.reload();
        }).catch(err => {
          console.error("Error during force update:", err);
          location.reload();
        });
      } else {
        if ('caches' in window) {
          caches.keys().then(keys => {
            return Promise.all(keys.map(key => caches.delete(key)));
          }).then(() => {
            location.reload();
          });
        } else {
          location.reload();
        }
      }
    },
    null,
    "Update App",
    "Cancel",
    "pixel-btn warning",
    "pixel-btn"
  );
}



