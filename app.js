import { 
  state, 
  saveState, 
  loadState, 
  saveAutoBackup, 
  getBackupHistory, 
  applyBackup, 
  runStateDiagnostics,
  getStageInfo,
  resetStateToDefault,
  ADMIN_PASSWORD,
  DAYS,
  XP_LEVEL_THRESHOLD,
  XP_DAILY_BONUS,
  XP_PER_TASK,
  MEGA_POKEMON,
  EVOLUTIONS
} from './state.js';

import { playSound, playActivePokemonCry } from './audio.js';

// DOM Elements
const pokemonSprite = document.getElementById('pokemon-sprite');
const partnerNameEl = document.getElementById('partner-name');
const levelEl = document.getElementById('pokemon-level');
const currentXpEl = document.getElementById('current-xp');
const nextLevelXpEl = document.getElementById('next-level-xp');
const xpBarFill = document.getElementById('xp-bar-fill');

const rewardSelect = document.getElementById('reward-select');
const rewardSelectContainer = rewardSelect.parentElement;
const megaRewardSelect = document.getElementById('mega-reward-select');
const megaRewardSelectContainer = megaRewardSelect.parentElement;

const weeklyBadgeSlot = document.getElementById('weekly-badge-slot');
const badgeStatusEl = document.getElementById('badge-status');

const megaWeeksCountEl = document.getElementById('mega-weeks-count');
const megaSlots = document.querySelectorAll('.mega-slot');

const changePartnerBtn = document.getElementById('change-partner-btn');
const partnerModal = document.getElementById('partner-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const partnerOptionsContainer = document.getElementById('pokemon-options-container');

const adminBtn = document.getElementById('admin-btn');
const adminModal = document.getElementById('admin-modal');
const adminDiagnosticsBtn = document.getElementById('admin-diagnostics-btn');
const adminExportBtn = document.getElementById('admin-export-btn');
const adminImportBtn = document.getElementById('admin-import-btn');
const adminWipeBtn = document.getElementById('admin-wipe-btn');
const closeAdminModalBtn = document.getElementById('close-admin-modal-btn');
const toggleDebugSidebar = document.getElementById('toggle-debug-sidebar');

// Testing Panel Elements
const testMilestoneMinusOneBtn = document.getElementById('test-milestone-minus-one');
const testNearEvolveBtn = document.getElementById('test-near-evolve');
const testNearLevelupBtn = document.getElementById('test-near-levelup');
const testWeek1Btn = document.getElementById('test-week-1');
const testWeek2Btn = document.getElementById('test-week-2');
const testWeek3Btn = document.getElementById('test-week-3');
const testWeek4Btn = document.getElementById('test-week-4');

// Confirm Modal Elements
const confirmModal = document.getElementById('confirm-modal');
const confirmTitle = document.getElementById('confirm-title');
const confirmMessage = document.getElementById('confirm-message');
const confirmYesBtn = document.getElementById('confirm-yes-btn');
const confirmNoBtn = document.getElementById('confirm-no-btn');

// Eevee Modal Elements
const eeveeModal = document.getElementById('eevee-modal');

// Debug Sidebar Element
const debugSidebar = document.getElementById('debug-sidebar');

// Audio control footer elements
const volumeSlider = document.getElementById('volume-slider');
const muteToggleBtn = document.getElementById('mute-toggle-btn');

// DOM Cache for Optimization
let domCache = {
  taskTotals: {},
  dayTotals: {},
  checkboxes: {}
};
let gridRebuildCount = 0;

// Initialize
loadState();
preloadImages();
renderState(true);
setupEventListeners();

function preloadImages() {
  const imagesToPreload = [];
  MEGA_POKEMON.forEach(p => {
    imagesToPreload.push(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`);
  });
  
  const families = ['25', '4', '1', '7', '133'];
  families.forEach(fid => {
    const evo = EVOLUTIONS[fid];
    if (evo) {
      if (evo.stages) {
        evo.stages.forEach(s => {
          imagesToPreload.push(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${s.id}.png`);
        });
      }
      if (evo.options) {
        evo.options.forEach(o => {
          imagesToPreload.push(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${o.id}.png`);
        });
      }
    }
  });

  imagesToPreload.forEach(url => {
    const img = new Image();
    img.src = url;
  });
}

function showCustomConfirm(title, message, onYesCallback, onNoCallback) {
  if (!confirmModal || !confirmTitle || !confirmMessage || !confirmYesBtn || !confirmNoBtn) {
    if (confirm(message)) {
      onYesCallback();
    } else if (onNoCallback) {
      onNoCallback();
    }
    return;
  }
  
  confirmTitle.textContent = title;
  confirmMessage.innerHTML = message.replace(/\n/g, '<br>');
  confirmModal.classList.remove('hidden');
  
  const handleYes = () => {
    confirmModal.classList.add('hidden');
    confirmYesBtn.removeEventListener('click', handleYes);
    confirmNoBtn.removeEventListener('click', handleNo);
    onYesCallback();
  };
  
  const handleNo = () => {
    confirmModal.classList.add('hidden');
    confirmYesBtn.removeEventListener('click', handleYes);
    confirmNoBtn.removeEventListener('click', handleNo);
    if (onNoCallback && typeof onNoCallback === 'function') {
      onNoCallback();
    }
  };
  
  confirmYesBtn.addEventListener('click', handleYes);
  confirmNoBtn.addEventListener('click', handleNo);
}

function showCustomNotification(title, message, imageUrl = null, isMega = false, callback = null) {
  const notifModal = document.createElement('div');
  notifModal.className = `modal notif-modal ${isMega ? 'mega-celebration' : ''}`;
  
  let imageHtml = '';
  if (imageUrl) {
    imageHtml = `<img src="${imageUrl}" class="notif-img ${isMega ? 'evolution-glow' : ''}">`;
  }
  
  notifModal.innerHTML = `
    <div class="modal-content pixel-art-border">
      <h2>${title}</h2>
      ${imageHtml}
      <p style="white-space: pre-line; margin: 15px 0;">${message}</p>
      <button class="pixel-btn notif-close-btn">Awesome!</button>
    </div>
  `;
  
  document.body.appendChild(notifModal);
  
  const closeBtn = notifModal.querySelector('.notif-close-btn');
  closeBtn.addEventListener('click', () => {
    notifModal.classList.add('hidden');
    setTimeout(() => {
      notifModal.remove();
      if (callback) callback();
    }, 300);
  });
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
      <div class="reward-history-info">
        <span class="reward-history-date">${formattedDate}</span>
        <span class="reward-history-details">Week ${item.weekNumber} • ${item.partner} (LV ${item.level})</span>
      </div>
      <span class="reward-history-name ${item.type === 'mega' ? 'mega' : ''}">
        ${item.type === 'mega' ? '👑 ' : '🎁 '}${item.reward}
      </span>
    `;
    listContainer.appendChild(itemEl);
  });
}

function renderBackupHistory() {
  const listContainer = document.getElementById('backup-history-list');
  if (!listContainer) return;
  
  listContainer.innerHTML = '';
  
  const history = getBackupHistory();
  if (history.length === 0) {
    listContainer.innerHTML = '<p class="no-backups">No backups available yet.</p>';
    return;
  }
  
  history.forEach((backup, idx) => {
    const backupEl = document.createElement('div');
    backupEl.className = 'backup-item';
    
    const dateStr = new Date(backup.timestamp).toLocaleString();
    const family = backup.state.partnerFamily || '25';
    const stats = backup.state.partnersData[family] || { level: 1 };
    const stageInfo = getStageInfo(family, stats.stageId || family);
    const partnerName = stageInfo.currentStage.name;
    const completedWeeks = backup.state.megaWeeks || 0;
    
    backupEl.innerHTML = `
      <div class="backup-info">
        <span class="backup-date">${dateStr}</span>
        <span class="backup-details">${partnerName} (LV ${stats.level}) • Week ${completedWeeks + 1}</span>
      </div>
      <button class="pixel-btn info small restore-backup-btn" data-index="${idx}">Restore</button>
    `;
    listContainer.appendChild(backupEl);
  });
  
  // Attach listeners
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
          adminModal.classList.add('hidden');
        }
      }
    );
  }
}

export function renderState(rebuildGrid = false) {
  const family = state.partnerFamily || '25';
  const stats = state.partnersData[family] || { level: 1, xp: 0, stageId: family };
  const stageInfo = getStageInfo(family, stats.stageId || family);
  const activePokemon = stageInfo.currentStage;

  // 1. Render Partner (Active Evolved Form)
  pokemonSprite.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${activePokemon.id}.png`;
  partnerNameEl.textContent = activePokemon.name;

  // 2. Render Stats
  levelEl.textContent = stats.level;
  currentXpEl.textContent = stats.xp;
  nextLevelXpEl.textContent = XP_LEVEL_THRESHOLD;

  // 3. Render XP Bar with Milestones
  const xpBarMilestones = document.getElementById('xp-bar-milestones');
  if (xpBarMilestones) {
    xpBarMilestones.innerHTML = ''; // Clear previous milestones
  }

  let progressPercent = 0;
  if (stageInfo.endLevel) {
    // We have a next evolution stage
    const stageStartLevel = stageInfo.startLevel;
    const stageEndLevel = stageInfo.endLevel;
    const totalStageLevels = stageEndLevel - stageStartLevel;
    const totalStageXp = totalStageLevels * XP_LEVEL_THRESHOLD;
    
    const currentStageXp = Math.max(0, (stats.level - stageStartLevel) * XP_LEVEL_THRESHOLD + stats.xp);
    progressPercent = Math.min(100, (currentStageXp / totalStageXp) * 100);

    // Render milestones
    if (xpBarMilestones) {
      const numMilestones = totalStageLevels - 1;
      for (let i = 1; i <= numMilestones; i++) {
        const milestoneXp = i * XP_LEVEL_THRESHOLD;
        const milestonePercent = (milestoneXp / totalStageXp) * 100;
        
        const marker = document.createElement('div');
        marker.className = 'xp-milestone-marker';
        marker.style.left = `${milestonePercent}%`;
        xpBarMilestones.appendChild(marker);
      }
    }
  } else {
    // Max evolution stage reached, standard 100 XP bar
    progressPercent = Math.min(100, (stats.xp / XP_LEVEL_THRESHOLD) * 100);
  }
  
  xpBarFill.style.width = `${progressPercent}%`;

  // 4. Render Dropdowns
  renderRewardDropdowns();
  rewardSelect.value = state.reward || '';
  megaRewardSelect.value = state.megaReward || '';

  // 5. Render Grid Table (conditional build vs update)
  if (rebuildGrid) {
    renderGridTable();
  } else {
    updateGridCheckboxes();
    renderProgress();
  }
  updateVolumeIcon();

  // Auto-trigger Eevee evolution if they are in inconsistent state (Level >= 5 but not evolved)
  if (family === '133' && stats.level >= 5 && stats.stageId === '133') {
    showEeveeEvolutionDialog();
  }

  // Render Debug Sidebar Visibility
  renderDebugSidebarVisibility();
}

function renderDebugSidebarVisibility() {
  if (!debugSidebar || !toggleDebugSidebar) return;
  if (state.debugSidebarEnabled) {
    debugSidebar.classList.remove('hidden');
    toggleDebugSidebar.checked = true;
  } else {
    debugSidebar.classList.add('hidden');
    toggleDebugSidebar.checked = false;
  }
}

function updateGridCheckboxes() {
  for (const key in domCache.checkboxes) {
    if (domCache.checkboxes[key]) {
      domCache.checkboxes[key].checked = !!state.grid[key];
    }
  }
}

function renderGridTable() {
  gridRebuildCount++;
  if (location.search.includes('runTests=true')) {
    window.__grid_rebuild_count__ = gridRebuildCount;
  }
  const tbody = document.getElementById('grid-tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  const tasks = state.tasks || [];
  
  tasks.forEach(task => {
    const row = document.createElement('tr');
    row.className = 'task-row';
    row.dataset.task = task.id;
    
    const reqDays = task.req || 5;
    const taskName = task.name || 'Unknown';
    const emoji = task.emoji || '📝';
    
    let html = `
      <td>
        <div class="task-desc">
          <span class="task-emoji">${emoji}</span>
          <div class="task-text-container">
            <span class="task-name">${taskName}</span>
            <span class="task-concept">${task.concept || 'Practice!'}</span>
          </div>
        </div>
      </td>
    `;
    
    for (let d = 0; d < 7; d++) {
      const key = `${d}-${task.id}`;
      const checked = !!state.grid[key];
      html += `
        <td class="checkbox-cell">
          <label class="pokeball-checkbox">
            <input type="checkbox" data-day="${d}" data-task="${task.id}" ${checked ? 'checked' : ''}>
            <span class="pokeball"></span>
          </label>
        </td>
      `;
    }
    
    html += `<td class="task-total-cell" data-task="${task.id}">0 / ${reqDays}</td>`;
    
    row.innerHTML = html;
    tbody.appendChild(row);
  });
  
  const totalRow = document.createElement('tr');
  totalRow.className = 'total-row';
  
  let totalHtml = `
    <td>
      <div class="task-desc total-desc">
        <span class="task-emoji">⭐</span>
        <div class="task-text-container">
          <span class="task-name">Daily Total</span>
          <span class="task-concept">All tasks cleared!</span>
        </div>
      </div>
    </td>
  `;
  
  for (let d = 0; d < 7; d++) {
    totalHtml += `<td class="day-total-cell" data-day="${d}"><div class="badge-indicator locked">❌</div></td>`;
  }
  
  totalHtml += `<td class="empty-cell"></td>`;
  totalRow.innerHTML = totalHtml;
  tbody.appendChild(totalRow);
  
  // Populate DOM Cache for partial updates
  domCache.taskTotals = {};
  tasks.forEach(task => {
    domCache.taskTotals[task.id] = tbody.querySelector(`.task-total-cell[data-task="${task.id}"]`);
  });

  domCache.dayTotals = {};
  DAYS.forEach(day => {
    domCache.dayTotals[day] = tbody.querySelector(`.day-total-cell[data-day="${day}"]`);
  });

  domCache.checkboxes = {};
  const inputs = tbody.querySelectorAll('input[type="checkbox"]');
  inputs.forEach(input => {
    const key = `${input.dataset.day}-${input.dataset.task}`;
    domCache.checkboxes[key] = input;
  });
  
  setupCheckboxListeners();
  renderProgress();
}

function setupCheckboxListeners() {
  const cbs = document.querySelectorAll('.pokeball-checkbox input');
  cbs.forEach(cb => {
    cb.addEventListener('change', handleCheckboxChange);
  });
}

function handleCheckboxChange(e) {
  const cb = e.target;
  
  if (!state.reward || !state.megaReward) {
    cb.checked = false;
    showCustomNotification(
      "⚠️ ATTENTION, TRAINER! ⚠️",
      "Choose your Weekly Reward and Mega Reward first to start training!",
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
      false,
      () => {
        if (!state.reward) {
          rewardSelect.focus();
        } else {
          megaRewardSelect.focus();
        }
      }
    );
    return;
  }

  const isChecked = cb.checked;
  const day = parseInt(cb.dataset.day);
  const taskId = cb.dataset.task;
  const key = `${day}-${taskId}`;

  const tasks = state.tasks || [];
  const wasDayFullyChecked = tasks.length > 0 && tasks.every(task => {
    if (task.id === taskId) return isChecked;
    return !!state.grid[`${day}-${task.id}`];
  });

  state.grid[key] = isChecked;

  if (isChecked) {
    playSound('check');
  } else {
    playSound('uncheck');
  }

  let xpGained = 0;
  if (isChecked) {
    xpGained += XP_PER_TASK;
  } else {
    xpGained -= XP_PER_TASK;
  }

  const isDayFullyChecked = tasks.length > 0 && tasks.every(task => !!state.grid[`${day}-${task.id}`]);
  
  if (isDayFullyChecked && !wasDayFullyChecked) {
    xpGained += XP_DAILY_BONUS;
    const dayCell = domCache.dayTotals[day];
    if (dayCell) {
      const rect = dayCell.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      CelebrationEngine.triggerDailyCelebration(day, x, y);
    }
  } else if (!isDayFullyChecked && wasDayFullyChecked) {
    xpGained -= XP_DAILY_BONUS;
  }

  addXp(xpGained);
  saveState();
  
  checkAndTriggerWeeklySuccess();
  renderState(false);
}

function renderRewardDropdowns() {
  const weeklyGroup = rewardSelect.querySelector('.recent-rewards-group');
  if (weeklyGroup) {
    weeklyGroup.innerHTML = '';
    const history = state.rewardHistory || [];
    if (history.length > 0) {
      history.forEach(r => {
        weeklyGroup.appendChild(new Option(r, r));
      });
      weeklyGroup.style.display = 'block';
    } else {
      weeklyGroup.style.display = 'none';
    }
  }

  const megaGroup = megaRewardSelect.querySelector('.recent-rewards-group');
  if (megaGroup) {
    megaGroup.innerHTML = '';
    const history = state.megaRewardHistory || [];
    if (history.length > 0) {
      history.forEach(mr => {
        megaGroup.appendChild(new Option(mr, mr));
      });
      megaGroup.style.display = 'block';
    } else {
      megaGroup.style.display = 'none';
    }
  }
}

function addRewardToHistory(reward, type) {
  if (!reward) return;
  const historyKey = type === 'weekly' ? 'rewardHistory' : 'megaRewardHistory';
  if (!state[historyKey]) state[historyKey] = [];
  
  const index = state[historyKey].indexOf(reward);
  if (index !== -1) {
    state[historyKey].splice(index, 1);
  }
  state[historyKey].unshift(reward);
  
  if (state[historyKey].length > 5) {
    state[historyKey] = state[historyKey].slice(0, 5);
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
      <select class="task-emoji-select" style="font-size: 1.2rem; width: 50px;">
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
      <input type="text" class="task-name-input pixel-input" value="${task.name}" style="flex: 1; padding: 4px 8px;">
      <div style="display: flex; align-items: center; gap: 5px;">
        <span style="font-size: 0.75rem; color: #475569;">Goal:</span>
        <input type="number" class="task-req-input pixel-input" value="${task.req || 5}" min="1" max="7" style="width: 45px; padding: 4px; text-align: center;">
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

function updateVolumeIcon() {
  const soundIcon = document.querySelector('.sound-icon');
  if (!soundIcon) return;
  const vol = state.volume !== undefined ? state.volume : 50;
  if (vol === 0) {
    soundIcon.textContent = '🔈';
  } else if (vol < 50) {
    soundIcon.textContent = '🔉';
  } else {
    soundIcon.textContent = '🔊';
  }
}

function exportState() {
  const stateStr = JSON.stringify(state);
  navigator.clipboard.writeText(stateStr).then(() => {
    alert("Trainer progress copied to clipboard! Save this code somewhere safe.");
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
        if (confirm("Are you sure you want to restore this backup? It will overwrite current progress!")) {
          state.partnerFamily = parsed.partnerFamily || '25';
          state.partnersData = parsed.partnersData || state.partnersData;
          state.grid = parsed.grid || {};
          state.tasks = parsed.tasks || state.tasks;
          state.reward = parsed.reward || '';
          state.megaReward = parsed.megaReward || '';
          state.megaWeeks = parsed.megaWeeks || 0;
          state.weeklyClaimed = parsed.weeklyClaimed || false;
          state.claimedRewardsHistory = parsed.claimedRewardsHistory || [];
          
          saveState();
          loadState();
          renderState(true);
          alert("Trainer progress restored successfully!");
          adminModal.classList.add('hidden');
        }
      } else {
        alert("Invalid backup code! Make sure you copied the entire code.");
      }
    } else {
      alert("Invalid backup code format!");
    }
  } catch (e) {
    console.error("Error importing state:", e);
    alert("Failed to parse the backup code. Make sure it is copied correctly.");
  }
}

function renderPartnerSelector() {
  const container = partnerOptionsContainer;
  if (!container) return;
  
  container.innerHTML = '';
  
  const families = ['25', '4', '1', '7', '133'];

  families.forEach(familyId => {
    const stats = state.partnersData[familyId] || { level: 1, xp: 0, stageId: familyId };
    const stageInfo = getStageInfo(familyId, stats.stageId || familyId);
    const activePokemon = stageInfo.currentStage;

    const optionDiv = document.createElement('div');
    optionDiv.className = 'pokemon-option';
    optionDiv.dataset.id = familyId;

    optionDiv.innerHTML = `
      <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${activePokemon.id}.png" alt="${activePokemon.name}">
      <span class="partner-select-name">${activePokemon.name}</span>
      <span class="partner-select-stats">LV ${stats.level}<br>${stats.xp}/100 XP</span>
    `;

    optionDiv.addEventListener('click', () => {
      state.partnerFamily = familyId;
      saveState();
      renderState(false);
      partnerModal.classList.add('hidden');
    });

    container.appendChild(optionDiv);
  });
}

function setupEventListeners() {
  rewardSelect.addEventListener('change', () => {
    state.reward = rewardSelect.value;
    addRewardToHistory(state.reward, 'weekly');
    saveState();
    renderRewardDropdowns();
  });

  megaRewardSelect.addEventListener('change', () => {
    state.megaReward = megaRewardSelect.value;
    addRewardToHistory(state.megaReward, 'mega');
    saveState();
    renderRewardDropdowns();
  });

  if (volumeSlider) {
    volumeSlider.value = state.volume !== undefined ? state.volume : 50;
    volumeSlider.addEventListener('input', (e) => {
      const vol = parseInt(e.target.value);
      state.volume = vol;
      saveState();
      updateVolumeIcon();
    });
  }

  if (muteToggleBtn) {
    muteToggleBtn.addEventListener('click', () => {
      if (state.volume > 0) {
        muteToggleBtn.dataset.prevVolume = state.volume;
        state.volume = 0;
      } else {
        const prev = parseInt(muteToggleBtn.dataset.prevVolume || 50);
        state.volume = prev > 0 ? prev : 50;
      }
      if (volumeSlider) volumeSlider.value = state.volume;
      saveState();
      updateVolumeIcon();
    });
  }

  if (pokemonSprite) {
    pokemonSprite.addEventListener('click', () => {
      playActivePokemonCry();
    });
  }

  if (changePartnerBtn) {
    changePartnerBtn.addEventListener('click', () => {
      renderPartnerSelector();
      partnerModal.classList.remove('hidden');
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      partnerModal.classList.add('hidden');
    });
  }

  if (adminBtn) {
    adminBtn.addEventListener('click', () => {
      const password = prompt('Enter Parent Password to open Admin Panel:');
      if (password === ADMIN_PASSWORD) {
        adminModal.classList.remove('hidden');
        renderBackupHistory();
        renderAdminTasksList();
        renderClaimedRewardsHistory();
      } else if (password !== null) {
        alert('Wrong Code! Try again, Parent!');
      }
    });
  }

  closeAdminModalBtn.addEventListener('click', () => {
    adminModal.classList.add('hidden');
  });

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
          : `Diagnostics run successfully! State schema is healthy.`,
        null,
        false,
        null
      );
    });
  }

  adminExportBtn.addEventListener('click', () => {
    exportState();
  });

  adminImportBtn.addEventListener('click', () => {
    importState();
  });

  adminWipeBtn.addEventListener('click', () => {
    showCustomConfirm(
      "Wipe Trainer Progress? ⚠️",
      "Are you sure you want to completely erase Kepler's level, XP, achievements, and rewards?\nThis action cannot be undone!",
      () => {
        resetStateToDefault();
        renderState(true);
        alert('System completely rebooted! Good luck, Kepler!');
        adminModal.classList.add('hidden');
      }
    );
  });

  const adminAddTaskBtn = document.getElementById('admin-add-task-btn');
  const adminSaveTasksBtn = document.getElementById('admin-save-tasks-btn');
  if (adminAddTaskBtn) {
    adminAddTaskBtn.addEventListener('click', addNewTask);
  }
  if (adminSaveTasksBtn) {
    adminSaveTasksBtn.addEventListener('click', saveAdminTasks);
  }

  testMilestoneMinusOneBtn.addEventListener('click', () => {
    setMilestoneMinusOne();
    adminModal.classList.add('hidden');
  });

  testNearEvolveBtn.addEventListener('click', () => {
    setNearEvolution();
    adminModal.classList.add('hidden');
  });

  testNearLevelupBtn.addEventListener('click', () => {
    setNearLevelUp();
    adminModal.classList.add('hidden');
  });

  testWeek1Btn.addEventListener('click', () => { setWeek(1); adminModal.classList.add('hidden'); });
  testWeek2Btn.addEventListener('click', () => { setWeek(2); adminModal.classList.add('hidden'); });
  testWeek3Btn.addEventListener('click', () => { setWeek(3); adminModal.classList.add('hidden'); });
  testWeek4Btn.addEventListener('click', () => { setWeek(4); adminModal.classList.add('hidden'); });

  if (toggleDebugSidebar) {
    toggleDebugSidebar.addEventListener('change', () => {
      state.debugSidebarEnabled = toggleDebugSidebar.checked;
      saveState();
      renderDebugSidebarVisibility();
    });
  }
}

function flashElement(element) {
  if (!element) return;
  element.classList.remove('flash-attention');
  void element.offsetWidth;
  element.classList.add('flash-attention');
  setTimeout(() => {
    element.classList.remove('flash-attention');
  }, 3100);
}

function resetWeekGrid() {
  let flashWeekly = false;
  let flashMega = false;
  
  if (state.weeklyClaimed) {
    state.megaWeeks += 1;
    if (state.megaWeeks >= 4) {
      state.megaWeeks = 0;
      state.megaReward = '';
      flashMega = true;
    }
    state.weeklyClaimed = false;
    state.reward = '';
    flashWeekly = true;
  }
  
  state.grid = {};
  saveState();
  renderState(true);
  
  if (flashWeekly) {
    flashElement(rewardSelect);
  }
  if (flashMega) {
    flashElement(megaRewardSelect);
  }
}

function setMilestoneMinusOne() {
  state.grid = {};
  
  const tasks = state.tasks || [];
  tasks.forEach(task => {
    const fillCount = (task.req || 5) - 1;
    for (let d = 0; d < fillCount; d++) {
      state.grid[`${d}-${task.id}`] = true;
    }
  });
  
  state.weeklyClaimed = false;
  
  saveState();
  renderState(true);
}

function setNearEvolution() {
  const family = state.partnerFamily;
  const stats = state.partnersData[family];
  const evo = EVOLUTIONS[family];
  
  let targetLevel = 4;
  if (family === '133') {
    targetLevel = 4;
  } else if (evo) {
    const stageIdx = evo.stages.findIndex(s => s.id === stats.stageId);
    if (stageIdx !== -1 && stageIdx < evo.stages.length - 1) {
      targetLevel = evo.stages[stageIdx + 1].level - 1;
    } else if (stageIdx === evo.stages.length - 1) {
      targetLevel = evo.stages[stageIdx].level;
    }
  }
  
  stats.level = targetLevel;
  stats.xp = XP_LEVEL_THRESHOLD - XP_PER_TASK;
  
  saveState();
  renderState(false);
}

function setNearLevelUp() {
  const family = state.partnerFamily;
  const stats = state.partnersData[family];
  stats.xp = XP_LEVEL_THRESHOLD - XP_PER_TASK;
  saveState();
  renderState(false);
}

function setWeek(weekNum) {
  state.megaWeeks = weekNum - 1;
  state.weeklyClaimed = false;
  state.grid = {};
  
  if (!state.reward) state.reward = `Week ${weekNum} Reward`;
  if (!state.megaReward) state.megaReward = "Mega Reward";
  
  saveState();
  renderState(true);
}

function addXp(amount) {
  if (amount === 0) return;
  
  const family = state.partnerFamily;
  const stats = state.partnersData[family];
  const oldLevel = stats.level;
  let totalXp = stats.xp + amount;
  
  let levelIncreased = false;
  let evolved = false;
  
  if (totalXp >= XP_LEVEL_THRESHOLD) {
    stats.level += 1;
    totalXp = totalXp - XP_LEVEL_THRESHOLD;
    levelIncreased = true;
  } else if (totalXp < 0) {
    if (stats.level > 1) {
      stats.level -= 1;
      totalXp = XP_LEVEL_THRESHOLD + totalXp;
    } else {
      totalXp = 0;
    }
  }
  
  stats.xp = totalXp;
  
  const evo = EVOLUTIONS[family];
  if (evo && family !== '133' && levelIncreased) {
    let stageIdx = 0;
    for (let i = 1; i < evo.stages.length; i++) {
      if (stats.level >= evo.stages[i].level) {
        stageIdx = i;
      } else {
        break;
      }
    }
    const targetStageId = evo.stages[stageIdx].id;
    if (stats.stageId !== targetStageId) {
      stats.stageId = targetStageId;
      evolved = true;
    }
  }

  if (levelIncreased) {
    if (family === '133' && stats.level >= 5 && stats.stageId === '133') {
      // Eevee evolution choice handles dynamically
    } else if (evolved) {
      const activePokemon = getStageInfo(family, stats.stageId).currentStage;
      CelebrationEngine.triggerCelebration(true);
      playSound('badge');
      showCustomNotification(
        "✨ POKÉMON EVOLVED! ✨",
        `Amazing job! Kepler's ${getStageInfo(family, oldLevel >= 5 ? evo.stages[0].id : family).currentStage.name} evolved into ${activePokemon.name}!`,
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${activePokemon.id}.png`,
        true,
        null
      );
    } else {
      triggerLevelUpAnimation();
      playSound('levelUp');
    }
  }
}

function checkWeeklySuccess() {
  const tasks = state.tasks || [];
  return tasks.length > 0 && tasks.every(task => {
    let checkedDays = 0;
    for (let d = 0; d < 7; d++) {
      if (state.grid[`${d}-${task.id}`]) checkedDays++;
    }
    return checkedDays >= (task.req || 5);
  });
}

function checkAndTriggerWeeklySuccess() {
  const weeklySuccess = checkWeeklySuccess();
  
  if (weeklySuccess && !state.weeklyClaimed) {
    state.weeklyClaimed = true;
    
    const family = state.partnerFamily;
    const stats = state.partnersData[family];
    const activePokemon = getStageInfo(family, stats.stageId).currentStage;
    
    if (!state.claimedRewardsHistory) state.claimedRewardsHistory = [];
    
    state.claimedRewardsHistory.unshift({
      date: new Date().toISOString(),
      reward: state.reward || 'A cool reward',
      type: 'weekly',
      weekNumber: state.megaWeeks + 1,
      partner: activePokemon.name,
      level: stats.level
    });
    
    if (state.megaWeeks === 3) {
      state.claimedRewardsHistory.unshift({
        date: new Date().toISOString(),
        reward: state.megaReward || 'A special reward',
        type: 'mega',
        weekNumber: 4,
        partner: activePokemon.name,
        level: stats.level
      });
    }
    
    saveState();
    saveAutoBackup();
    renderProgress();
    
    CelebrationEngine.triggerCelebration(false);
    playSound('badge');
    
    const weekDisplayNum = state.megaWeeks + 1;
    const isMegaWeek = weekDisplayNum === 4;
    
    let successMessage = `Kepler has completed all training goals for Week ${weekDisplayNum}!\n\n`;
    if (isMegaWeek) {
      successMessage += `🏆 MEGA REWARD UNLOCKED 🏆\n"${state.megaReward || 'Mega Reward'}"\n\n`;
    }
    successMessage += `🎁 WEEKLY REWARD CLAIMED 🎁\n"${state.reward || 'Weekly Reward'}"`;
    
    showCustomNotification(
      isMegaWeek ? "👑 MEGA MILESTONE COMPLETED! 👑" : "🎉 WEEKLY SUCCESS! 🎉",
      successMessage,
      isMegaWeek 
        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${MEGA_POKEMON[3].id}.png`
        : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/badge.png`,
      isMegaWeek,
      () => {
        showCustomConfirm(
          isMegaWeek ? "Start New Mega Cycle? 👑" : "Start New Training Week? 📅",
          isMegaWeek
            ? "Ready to loop back to Week 1 and start working towards a NEW Mega Milestone?"
            : `Are you ready to reset the training grid and start Week ${weekDisplayNum === 4 ? 1 : weekDisplayNum + 1}?`,
          () => {
            resetWeekGrid();
          }
        );
      }
    );
  }
}

function renderProgress() {
  const tasks = state.tasks || [];
  
  const taskTotals = {};
  tasks.forEach(t => { taskTotals[t.id] = 0; });
  
  tasks.forEach(task => {
    DAYS.forEach(day => {
      if (state.grid[`${day}-${task.id}`]) {
        taskTotals[task.id]++;
      }
    });

    const totalCell = domCache.taskTotals[task.id];
    if (totalCell) {
      const required = task.req || 5;
      totalCell.textContent = `${taskTotals[task.id]} / ${required}`;
      
      if (taskTotals[task.id] >= required) {
        totalCell.classList.add('completed');
      } else {
        totalCell.classList.remove('completed');
      }
    }
  });

  DAYS.forEach(day => {
    const allChecked = tasks.length > 0 && tasks.every(task => !!state.grid[`${day}-${task.id}`]);
    const totalCell = domCache.dayTotals[day];
    if (totalCell) {
      const indicator = totalCell.querySelector('.badge-indicator');
      if (indicator) {
        if (allChecked) {
          indicator.textContent = '🌟';
          indicator.classList.remove('locked');
          indicator.classList.add('unlocked');
        } else {
          indicator.textContent = '❌';
          indicator.classList.remove('unlocked');
          indicator.classList.add('locked');
        }
      }
    }
  });

  for (let i = 1; i <= 4; i++) {
    weeklyBadgeSlot.classList.remove(`badge-theme-${i}`);
  }

  if (state.weeklyClaimed) {
    const currentBadge = MEGA_POKEMON[state.megaWeeks];
    if (currentBadge) {
      weeklyBadgeSlot.innerHTML = `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${currentBadge.id}.png" alt="${currentBadge.name}" class="mega-slot-img">`;
      weeklyBadgeSlot.classList.add(`badge-theme-${state.megaWeeks + 1}`);
    }
    badgeStatusEl.textContent = "CLAIMED!";
  } else {
    weeklyBadgeSlot.innerHTML = `<div class="badge-placeholder">?</div>`;
    badgeStatusEl.textContent = "TRAINING...";
  }

  megaWeeksCountEl.textContent = state.megaWeeks;
  
  megaSlots.forEach((slot, index) => {
    slot.innerHTML = '';
    const badge = MEGA_POKEMON[index];
    
    if (index < state.megaWeeks) {
      slot.innerHTML = `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${badge.id}.png" alt="${badge.name}" class="mega-slot-img completed">`;
      slot.classList.add('earned');
    } else if (index === state.megaWeeks && state.weeklyClaimed) {
      slot.innerHTML = `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${badge.id}.png" alt="${badge.name}" class="mega-slot-img completed animate-pop">`;
      slot.classList.add('earned');
    } else {
      slot.innerHTML = `<div class="mega-slot-placeholder">${index + 1}</div>`;
      slot.classList.remove('earned');
    }
  });
}

function triggerLevelUpAnimation() {
  const container = document.querySelector('.pokemon-display');
  if (!container) return;
  
  container.classList.remove('animate-level-up');
  void container.offsetWidth;
  container.classList.add('animate-level-up');
  
  setTimeout(() => {
    container.classList.remove('animate-level-up');
  }, 1000);
}

function showEeveeEvolutionDialog() {
  const grid = eeveeModal.querySelector('.eevee-options-grid');
  if (!grid) return;
  grid.innerHTML = '';
  
  const options = EVOLUTIONS['133'].options;
  
  options.forEach(opt => {
    const optDiv = document.createElement('div');
    optDiv.className = 'eevee-option';
    optDiv.innerHTML = `
      <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${opt.id}.png" alt="${opt.name}">
      <span class="eevee-option-name">${opt.name}</span>
    `;
    
    optDiv.addEventListener('click', () => {
      selectEeveeEvolution(opt.id, opt.name);
    });
    
    grid.appendChild(optDiv);
  });
  
  eeveeModal.classList.remove('hidden');
}

function selectEeveeEvolution(evolvedId, evolvedName) {
  eeveeModal.classList.add('hidden');
  
  const stats = state.partnersData['133'];
  stats.stageId = evolvedId;
  
  saveState();
  renderState(false);
  
  CelebrationEngine.triggerCelebration(true);
  playSound('badge');
  showCustomNotification(
    "✨ EEVEE EVOLVED! ✨",
    `Congratulations! Kepler's Eevee evolved into ${evolvedName}!`,
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${evolvedId}.png`,
    true,
    null
  );
}

// Test Mode setup
if (location.search.includes('runTests=true')) {
  Object.defineProperty(window, '__app_state__', {
    get: () => state,
    configurable: true
  });
  window.__test_helpers__ = {
    resetState: () => {
      resetStateToDefault();
      gridRebuildCount = 0;
      renderState(true);
    },
    renderState: (rebuildGrid) => renderState(rebuildGrid)
  };
  
  const script = document.createElement('script');
  script.type = 'module';
  script.src = 'tests.js';
  document.body.appendChild(script);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(reg => console.log('Service Worker registered successfully.', reg.scope))
      .catch(err => console.log('Service Worker registration failed:', err));
  });
}
