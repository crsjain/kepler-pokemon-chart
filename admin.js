import { 
  state, 
  saveState, 
  loadState, 
  runStateDiagnostics,
  ADMIN_PASSWORD,
  DAYS,
  getStageInfo,
  getBackupHistory,
  applyBackup
} from './state.js';

let appCallbacks = {
  renderState: () => {},
  showCustomConfirm: () => {},
  showCustomNotification: () => {}
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
let adminWipeBtn = null;
let closeAdminModalBtn = null;
let adminAddTaskBtn = null;
let adminSaveTasksBtn = null;

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
  adminWipeBtn = document.getElementById('admin-wipe-btn');
  closeAdminModalBtn = document.getElementById('close-admin-modal-btn');
  adminAddTaskBtn = document.getElementById('admin-add-task-btn');
  adminSaveTasksBtn = document.getElementById('admin-save-tasks-btn');

  if (adminBtn) {
    adminBtn.addEventListener('click', () => {
      passwordInput.value = '';
      passwordError.classList.add('hidden');
      passwordModal.classList.remove('hidden');
      setTimeout(() => passwordInput.focus(), 50);
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
  if (adminWipeBtn) {
    adminWipeBtn.addEventListener('click', () => {
      showCustomConfirm(
        "Wipe All Progress? 🚨",
        "This will completely erase all levels, XP, and badges, and restore defaults! This cannot be undone.",
        () => {
          localStorage.clear();
          location.reload();
        },
        null,
        "Wipe Everything",
        "Cancel",
        "pixel-btn danger",
        "pixel-btn"
      );
    });
  }

  if (adminAddTaskBtn) {
    adminAddTaskBtn.addEventListener('click', addNewTask);
  }
  if (adminSaveTasksBtn) {
    adminSaveTasksBtn.addEventListener('click', saveAdminTasks);
  }
}

function handlePasswordSubmit() {
  const password = passwordInput.value;
  if (password === ADMIN_PASSWORD) {
    passwordModal.classList.add('hidden');
    adminModal.classList.remove('hidden');
    renderAdminTasksList();
    renderBackupHistory();
    renderClaimedRewardsHistory();
  } else {
    passwordError.classList.remove('hidden');
  }
}

function renderAdminTasksList() {
  const container = document.getElementById('admin-tasks-list');
  if (!container) return;
  
  container.innerHTML = '';
  const tasks = state.tasks || [];
  
  tasks.forEach((task, idx) => {
    const item = document.createElement('div');
    item.className = 'admin-task-item';
    item.dataset.index = idx;
    
    item.innerHTML = `
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
      <div class="task-goal-container">
        <span class="task-goal-label">Goal:</span>
        <input type="number" class="task-req-input" value="${task.req || 5}" min="1" max="7">
      </div>
      <button class="pixel-btn danger remove-task-btn" data-index="${idx}">
        <svg class="delete-icon" viewBox="0 0 448 512" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0H284.2C296.3 0 307.4 6.8 312.8 17.7L320 32H384C401.7 32 416 46.3 416 64C416 81.7 401.7 96 384 96H64C46.3 96 32 81.7 32 64C32 46.3 46.3 32 64 32H128L135.2 17.7zM32 128H416V448C416 483.3 387.3 512 352 512H96C60.7 512 32 483.3 32 448V128zM96 176C96 162.7 85.3 152 72 152C58.7 152 48 162.7 48 176V408C48 421.3 58.7 432 72 432C85.3 432 96 421.3 96 408V176z"/>
        </svg>
      </button>
    `;
    container.appendChild(item);
  });
  
  container.querySelectorAll('.remove-task-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.dataset.index);
      removeTask(idx);
    });
  });
}

function removeTask(index) {
  if (!state.tasks) return;
  const taskToRemove = state.tasks[index];
  if (confirm(`Remove task "${taskToRemove.name}"? This will delete all checked history for this task.`)) {
    DAYS.forEach(day => {
      delete state.grid[`${day}-${taskToRemove.id}`];
    });
    state.tasks.splice(index, 1);
    renderAdminTasksList();
  }
}

function addNewTask() {
  if (!state.tasks) state.tasks = [];
  const newId = `task_${Date.now()}`;
  state.tasks.push({
    id: newId,
    name: 'New Activity',
    req: 5,
    emoji: '📝',
    concept: 'Keep practicing!'
  });
  renderAdminTasksList();
}

function saveAdminTasks() {
  const container = document.getElementById('admin-tasks-list');
  if (!container) return;
  
  const items = container.querySelectorAll('.admin-task-item');
  let hasError = false;
  
  items.forEach(item => {
    const idx = parseInt(item.dataset.index);
    const emoji = item.querySelector('.task-emoji-select').value;
    const name = item.querySelector('.task-name-input').value.trim();
    const req = parseInt(item.querySelector('.task-req-input').value);
    
    if (!name) {
      alert("Activity name cannot be empty!");
      hasError = true;
      return;
    }
    
    if (isNaN(req) || req < 1 || req > 7) {
      alert("Goal days must be between 1 and 7!");
      hasError = true;
      return;
    }
    
    state.tasks[idx].emoji = emoji;
    state.tasks[idx].name = name;
    state.tasks[idx].req = req;
  });
  
  if (!hasError) {
    saveState();
    renderState(true);
    alert("Activities saved successfully!");
  }
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
            state.partnerFamily = parsed.partnerFamily || '25';
            state.partnersData = parsed.partnersData || state.partnersData;
            state.grid = parsed.grid || {};
            state.tasks = parsed.tasks || state.tasks;
            state.reward = parsed.reward || '';
            state.megaReward = parsed.megaReward || '';
            state.megaWeeks = parsed.megaWeeks || 0;
            state.weeklyClaimed = parsed.weeklyClaimed || false;
            state.claimedRewardsHistory = parsed.claimedRewardsHistory || [];
            state.starVault = parsed.starVault || { earnedDates: [], totalTraded: 0 };
            state.collectedBadges = parsed.collectedBadges || [];
            state.badgePool = parsed.badgePool || state.badgePool;
            state.activeWeeklyBadgeId = parsed.activeWeeklyBadgeId !== undefined ? parsed.activeWeeklyBadgeId : state.activeWeeklyBadgeId;
            state.excused = parsed.excused || {};
            
            saveState();
            loadState();
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
          alert("Restored successfully!");
          const adminModal = document.getElementById('admin-modal');
          if (adminModal) adminModal.classList.add('hidden');
        }
      }
    );
  }
}
