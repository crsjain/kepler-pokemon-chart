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

import { playSound } from './audio.js';

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

// Badge Case Elements
const badgeCaseGrid = document.getElementById('badge-case-grid');
const badgeCaseCountEl = document.getElementById('badge-case-count');

const changePartnerBtn = document.getElementById('change-partner-btn');
const partnerModal = document.getElementById('partner-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const partnerOptionsContainer = document.getElementById('pokemon-options-container');
const resetBtn = document.getElementById('reset-btn');

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

// Password Modal Elements
const passwordModal = document.getElementById('password-modal');
const passwordInput = document.getElementById('password-input');
const passwordSubmitBtn = document.getElementById('password-submit-btn');
const passwordCancelBtn = document.getElementById('password-cancel-btn');
const passwordError = document.getElementById('password-error');

// Eevee Modal Elements
const eeveeModal = document.getElementById('eevee-modal');
const evolutionHelper = document.getElementById('evolution-helper');

// Debug Sidebar Element
const debugSidebar = document.getElementById('debug-sidebar');

// Audio control footer elements


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
  const imagesToPreload = [
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/star-piece.png'
  ];
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

function showCustomConfirm(title, message, onYesCallback, onNoCallback, yesLabel = "Let's Go! 🚀", noLabel = "Not Yet", yesClass = "pixel-btn info", noClass = "pixel-btn") {
  if (!confirmModal || !confirmTitle || !confirmMessage || !confirmYesBtn || !confirmNoBtn) {
    if (confirm(message)) {
      onYesCallback();
    } else if (onNoCallback && typeof onNoCallback === 'function') {
      onNoCallback();
    }
    return;
  }
  
  confirmTitle.textContent = title;
  confirmMessage.innerHTML = message.replace(/\n/g, '<br>');
  
  // Set custom labels
  confirmYesBtn.textContent = yesLabel;
  confirmNoBtn.textContent = noLabel;
  
  // Apply classes
  confirmYesBtn.className = yesClass;
  confirmNoBtn.className = noClass;
  
  confirmModal.classList.remove('hidden');
  
  confirmYesBtn.onclick = () => {
    confirmModal.classList.add('hidden');
    confirmYesBtn.onclick = null;
    confirmNoBtn.onclick = null;
    if (onYesCallback) onYesCallback();
  };
  
  confirmNoBtn.onclick = () => {
    confirmModal.classList.add('hidden');
    confirmYesBtn.onclick = null;
    confirmNoBtn.onclick = null;
    if (onNoCallback && typeof onNoCallback === 'function') {
      onNoCallback();
    }
  };
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
      <div class="notif-body-text" style="white-space: pre-line; margin: 15px 0;">${message}</div>
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

  // XP Bar always shows progress to next level (0-100%)
  const progressPercent = Math.min(100, (stats.xp / XP_LEVEL_THRESHOLD) * 100);
  xpBarFill.style.width = `${progressPercent}%`;


  // Update Evolution Helper text
  if (evolutionHelper) {
    if (stageInfo.nextStage) {
      const levelsLeft = stageInfo.endLevel - stats.level;
      if (family === '133') {
        evolutionHelper.innerHTML = `✨ Evolves at LV ${stageInfo.endLevel} (${levelsLeft} ${levelsLeft === 1 ? 'level' : 'levels'} to go!)`;
      } else {
        evolutionHelper.innerHTML = `✨ Next Evolution: <strong>${stageInfo.nextStage.name}</strong> at LV ${stageInfo.endLevel} (${levelsLeft} ${levelsLeft === 1 ? 'level' : 'levels'} to go!)`;
      }
    } else {
      evolutionHelper.innerHTML = `🏆 Fully Evolved form!`;
    }
  }

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
  updateActiveColumnUI();


  // Auto-trigger Eevee evolution if they are in inconsistent state (Level >= 5 but not evolved)
  if (family === '133' && stats.level >= 5 && stats.stageId === '133') {
    showEeveeEvolutionDialog();
  }

  // Render Debug Sidebar Visibility
  renderDebugSidebarVisibility();

  // Render Badge Case
  renderBadgeCase();
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

function updateActiveColumnUI() {
  const activeDay = state.activeDay !== undefined ? state.activeDay : new Date().getDay();
  
  const headers = document.querySelectorAll('.day-header');
  headers.forEach(th => {
    const day = parseInt(th.dataset.day);
    if (day === activeDay) {
      th.classList.add('active-day');
    } else {
      th.classList.remove('active-day');
    }
  });

  const tbody = document.getElementById('grid-tbody');
  if (!tbody) return;

  const rows = tbody.querySelectorAll('tr.task-row, tr.total-row');
  rows.forEach(row => {
    const checkCells = row.querySelectorAll('td.checkbox-cell');
    checkCells.forEach(cell => {
      const input = cell.querySelector('input');
      if (input) {
        const d = parseInt(input.dataset.day);
        if (d === activeDay) {
          cell.classList.add('active-column');
        } else {
          cell.classList.remove('active-column');
        }
      }
    });
    
    const totalCells = row.querySelectorAll('td.day-total-cell');
    totalCells.forEach(cell => {
      const d = parseInt(cell.dataset.day);
      if (d === activeDay) {
        cell.classList.add('active-column');
      } else {
        cell.classList.remove('active-column');
      }
    });
  });
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
  
  const day = parseInt(cb.dataset.day);
  if (day !== state.activeDay) {
    cb.checked = !cb.checked;
    return;
  }
  
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
    // Add temporary badge to current week
    const dateStr = getDateForWeekday(day);
    const family = state.partnerFamily;
    const stats = state.partnersData[family];
    const activePokemon = getStageInfo(family, stats.stageId).currentStage;
    if (!state.currentWeekBadges) state.currentWeekBadges = {};
    state.currentWeekBadges[day] = {
      partnerId: activePokemon.id,
      name: activePokemon.name,
      date: dateStr
    };
  } else if (!isDayFullyChecked && wasDayFullyChecked) {
    xpGained -= XP_DAILY_BONUS;
    // Remove temporary badge
    if (state.currentWeekBadges) {
      delete state.currentWeekBadges[day];
    }
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
            state.badgeCase = parsed.badgeCase || [];
            state.currentWeekBadges = parsed.currentWeekBadges || {};
            
            saveState();
            loadState();
            renderState(true);
            showCustomNotification("RESTORE SUCCESS", "Trainer progress restored successfully!");
            adminModal.classList.add('hidden');
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

    if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      showCustomConfirm(
        "Reset Week Grid? 📅",
        "Are you ready to reset the training grid for this week?\nYour level, XP, and badges will not be affected.",
        () => {
          resetWeekGrid();
        }
      );
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

  // Header day clicks
  const headers = document.querySelectorAll('.day-header');
  headers.forEach(th => {
    th.addEventListener('click', () => {
      const clickedDay = parseInt(th.dataset.day);
      if (state.activeDay !== clickedDay) {
        const today = new Date().getDay();
        if (clickedDay !== today) {
          const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          const dayName = daysOfWeek[clickedDay];
          showCustomConfirm(
            "Switch Day? 📅",
            `Are you sure you want to switch to ${dayName}?\nThis is different from today.`,
            () => {
              state.activeDay = clickedDay;
              saveState();
              updateActiveColumnUI();
            },
            null,
            "Switch Anyway",
            "Keep Today",
            "pixel-btn greyed-out",
            "pixel-btn info"
          );
        } else {
          // Switching back to today has no friction
          state.activeDay = clickedDay;
          saveState();
          updateActiveColumnUI();
        }
      }
    });
  });

  if (adminBtn) {
    adminBtn.addEventListener('click', () => {
      passwordInput.value = '';
      passwordError.classList.add('hidden');
      passwordModal.classList.remove('hidden');
      setTimeout(() => passwordInput.focus(), 50);
    });
  }

  function handlePasswordSubmit() {
    const password = passwordInput.value;
    if (password === ADMIN_PASSWORD) {
      passwordModal.classList.add('hidden');
      adminModal.classList.remove('hidden');
      renderBackupHistory();
      renderAdminTasksList();
      renderClaimedRewardsHistory();
    } else {
      passwordError.classList.remove('hidden');
      passwordInput.value = '';
      passwordInput.focus();
    }
  }

  if (passwordSubmitBtn) {
    passwordSubmitBtn.addEventListener('click', handlePasswordSubmit);
  }

  if (passwordCancelBtn) {
    passwordCancelBtn.addEventListener('click', () => {
      passwordModal.classList.add('hidden');
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handlePasswordSubmit();
      } else if (e.key === 'Escape') {
        passwordModal.classList.add('hidden');
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
        showCustomNotification("SYSTEM REBOOTED", "System completely rebooted! Good luck, Kepler!");
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
  
  // Commit current week badges to permanent case
  if (state.currentWeekBadges) {
    if (!state.badgeCase) state.badgeCase = [];
    Object.keys(state.currentWeekBadges).forEach(day => {
      state.badgeCase.push(state.currentWeekBadges[day]);
    });
    state.currentWeekBadges = {};
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
    
    let successMessage = `Kepler has completed all training goals for <strong>Week ${weekDisplayNum}</strong>!<br><br>`;
    if (isMegaWeek) {
      successMessage += `<div class="reward-box mega"><div class="reward-box-header">🏆 MEGA REWARD UNLOCKED 🏆</div><div class="reward-box-name">${state.megaReward || 'Mega Reward'}</div></div><br>`;
    }
    successMessage += `<div class="reward-box"><div class="reward-box-header">🎁 WEEKLY REWARD CLAIMED 🎁</div><div class="reward-box-name">${state.reward || 'Weekly Reward'}</div></div>`;
    
    showCustomNotification(
      isMegaWeek ? "👑 MEGA MILESTONE COMPLETED! 👑" : "🎉 WEEKLY SUCCESS! 🎉",
      successMessage,
      isMegaWeek 
        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${MEGA_POKEMON[3].id}.png`
        : null,
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
      badgeStatusEl.textContent = `${currentBadge.name} Badge Earned!`;
    }
    weeklyBadgeSlot.classList.remove('locked');
    weeklyBadgeSlot.classList.add('unlocked');
    weeklyBadgeSlot.classList.add(`badge-theme-${state.megaWeeks + 1}`);
    rewardSelectContainer.classList.add('earned');
  } else {
    weeklyBadgeSlot.innerHTML = `<div class="badge-placeholder">?</div>`;
    weeklyBadgeSlot.classList.remove('unlocked');
    weeklyBadgeSlot.classList.add('locked');
    rewardSelectContainer.classList.remove('earned');

    // Dynamic requirements summary
    const tasks = state.tasks || [];
    if (tasks.length === 0) {
      badgeStatusEl.textContent = "No activities configured. Add some in Admin Panel!";
    } else {
      const groups = {};
      tasks.forEach(t => {
        const days = t.req || 5;
        if (!groups[days]) groups[days] = [];
        groups[days].push(t.name);
      });
      const summaryParts = Object.keys(groups)
        .map(Number)
        .sort((a, b) => b - a)
        .map(days => {
          const names = groups[days].join(', ');
          return `${names}: ${days} day${days > 1 ? 's' : ''}`;
        });
      badgeStatusEl.innerHTML = summaryParts.join('. ') + '.';
    }
  }

  megaWeeksCountEl.textContent = `${state.weeklyClaimed ? Math.min(4, state.megaWeeks + 1) : state.megaWeeks}`;
  megaSlots.forEach((slot, index) => {
    const pkmn = MEGA_POKEMON[index];
    const isUnlocked = index < state.megaWeeks || (index === state.megaWeeks && state.weeklyClaimed);
    
    slot.classList.remove(`badge-theme-${index + 1}`);
    
    if (isUnlocked) {
      slot.innerHTML = `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pkmn.id}.png" alt="${pkmn.name}" class="mega-slot-img ${index === state.megaWeeks && state.weeklyClaimed ? 'animate-pop' : ''}">`;
      slot.classList.add('unlocked');
      slot.classList.add(`badge-theme-${index + 1}`);
    } else {
      slot.innerHTML = `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" alt="Locked" class="mega-slot-img locked">`;
      slot.classList.remove('unlocked');
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

function getDateForWeekday(targetDayIndex) {
  const today = new Date();
  const todayIndex = today.getDay(); // 0-6
  const diff = targetDayIndex - todayIndex;
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + diff);
  return targetDate.toISOString().split('T')[0]; // YYYY-MM-DD
}

function renderBadgeCase() {
  if (!badgeCaseGrid || !badgeCaseCountEl) return;

  badgeCaseGrid.innerHTML = '';

  const permanentBadges = state.badgeCase || [];
  const temporaryBadges = state.currentWeekBadges || {};

  const totalBadgesCount = permanentBadges.length + Object.keys(temporaryBadges).length;
  badgeCaseCountEl.textContent = totalBadgesCount;

  if (totalBadgesCount === 0) {
    badgeCaseGrid.innerHTML = '<p class="no-badges-msg">Your Badge Case is empty. Clear all tasks in a day to earn a badge!</p>';
    return;
  }

  // Render permanent badges
  permanentBadges.forEach(badge => {
    const slot = document.createElement('div');
    slot.className = 'badge-slot-case has-badge';
    slot.innerHTML = `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${badge.partnerId}.png" alt="${badge.name}" class="badge-case-img" title="${badge.name} (${badge.date})">`;
    badgeCaseGrid.appendChild(slot);
  });

  // Render temporary badges (current week)
  Object.keys(temporaryBadges).forEach(day => {
    const badge = temporaryBadges[day];
    const slot = document.createElement('div');
    slot.className = 'badge-slot-case has-badge temp-badge';
    slot.innerHTML = `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${badge.partnerId}.png" alt="${badge.name}" class="badge-case-img temp" title="${badge.name} (Pending - ${badge.date})">`;
    badgeCaseGrid.appendChild(slot);
  });
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
    renderState: (rebuildGrid) => renderState(rebuildGrid),
    ADMIN_PASSWORD: ADMIN_PASSWORD,
    saveState: saveState
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
