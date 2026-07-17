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
  EVOLUTIONS,
  getSunday,
  rollNewWeeklyBadge,
  formatLocalDate
} from './state.js';

const APP_VERSION = 'v1.4.0 (v22)';

import { playSound } from './audio.js';
import { initVault, openVault, checkDayCompleted, renderVault } from './vault.js';
import { getPokemonName, TIER_1_IDS, TIER_2_IDS } from './pokemon_data.js';
import { initBadgeCase, awardCurrentWeeklyBadge, renderBadgeCaseGrid } from './badges.js';
import { initAdmin } from './admin.js';

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
const resetBtn = document.getElementById('reset-btn');
const exceptionsBtn = document.getElementById('exceptions-btn');
const exceptionsDoneBtn = document.getElementById('exceptions-done-btn');
const exceptionsBanner = document.getElementById('exceptions-banner');
const layoutContainer = document.querySelector('.layout-container');

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
const testMegaMinusOneBtn = document.getElementById('test-mega-minus-one');
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
const confirmCheckboxContainer = document.getElementById('confirm-checkbox-container');
const confirmCheckbox = document.getElementById('confirm-checkbox');
const confirmCheckboxText = document.getElementById('confirm-checkbox-text');

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
let isExceptionMode = false;

// Initialize
loadState();
initVault();
initBadgeCase();
initAdmin({
  renderState,
  showCustomConfirm,
  showCustomNotification
});
preloadImages();
renderState(true);
setupEventListeners();

// Render App Version
const versionLabel = document.getElementById('app-version-label');
if (versionLabel) {
  versionLabel.textContent = APP_VERSION;
}

function preloadImages() {
  const imagesToPreload = [
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/star-piece.png'
  ];
  if (state.activeWeeklyBadgeId) {
    imagesToPreload.push(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${state.activeWeeklyBadgeId}.png`);
  }
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

export function showCustomConfirm(title, message, onYesCallback, onNoCallback, yesLabel = "Let's Go! 🚀", noLabel = "Not Yet", yesClass = "pixel-btn info", noClass = "pixel-btn", options = {}) {
  if (!confirmModal || !confirmTitle || !confirmMessage || !confirmYesBtn || !confirmNoBtn) {
    if (confirm(message)) {
      onYesCallback(false);
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
  
  // Handle optional checkbox
  if (options.showCheckbox && confirmCheckboxContainer && confirmCheckbox && confirmCheckboxText) {
    confirmCheckboxContainer.classList.remove('hidden');
    confirmCheckboxText.textContent = options.checkboxLabel || "Carry over exceptions";
    confirmCheckbox.checked = !!options.checkboxDefaultChecked;
  } else if (confirmCheckboxContainer) {
    confirmCheckboxContainer.classList.add('hidden');
  }
  
  confirmModal.classList.remove('hidden');
  
  const cleanUpConfirm = () => {
    confirmYesBtn.onclick = null;
    confirmNoBtn.onclick = null;
    confirmModal.onclick = null;
    if (confirmCheckboxContainer) {
      confirmCheckboxContainer.classList.add('hidden');
    }
  };
  
  confirmYesBtn.onclick = () => {
    const checkboxVal = (confirmCheckbox && options.showCheckbox) ? confirmCheckbox.checked : false;
    confirmModal.classList.add('hidden');
    cleanUpConfirm();
    if (onYesCallback) onYesCallback(checkboxVal);
  };
  
  confirmNoBtn.onclick = () => {
    confirmModal.classList.add('hidden');
    cleanUpConfirm();
    if (onNoCallback && typeof onNoCallback === 'function') {
      onNoCallback();
    }
  };
  
  confirmModal.onclick = (e) => {
    if (e.target === confirmModal) {
      confirmModal.classList.add('hidden');
      cleanUpConfirm();
      if (onNoCallback && typeof onNoCallback === 'function') {
        onNoCallback();
      }
    }
  };
}

export function showCustomNotification(title, message, imageUrl = null, isMega = false, callback = null, extraClass = '') {
  const notifModal = document.createElement('div');
  notifModal.className = `modal notif-modal ${isMega ? 'mega-celebration' : ''} ${extraClass}`;
  
  let imageHtml = '';
  if (isMega) {
    imageHtml = `<div class="notif-mega-badges-row">`;
    const badgeIds = [];
    for (let i = 0; i < 4; i++) {
      const historyIndex = state.collectedBadges.length - 4 + i;
      const badge = state.collectedBadges[historyIndex];
      badgeIds.push(badge ? badge.id : null);
    }
    
    badgeIds.forEach((id, idx) => {
      if (id) {
        const imgUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
        const name = getPokemonName(id);
        imageHtml += `
          <div class="notif-badge-slot">
            <div class="notif-badge-wrapper">
              <img src="${imgUrl}" class="notif-badge-img" title="${name}">
            </div>
            <span class="notif-badge-label">Week ${idx + 1}</span>
          </div>
        `;
      } else {
        imageHtml += `
          <div class="notif-badge-slot">
            <div class="notif-badge-wrapper placeholder">?</div>
            <span class="notif-badge-label">Week ${idx + 1}</span>
          </div>
        `;
      }
    });
    imageHtml += `</div>`;
  } else if (imageUrl) {
    imageHtml = `<img src="${imageUrl}" class="notif-img">`;
  }
  
  notifModal.innerHTML = `
    <div class="modal-content pixel-art-border">
      <h2>${title}</h2>
      ${imageHtml}
      <div class="notif-body-text">${message}</div>
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

// Admin panel rendering methods moved to admin.js

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
        evolutionHelper.innerHTML = `✨ Evolves at LV&nbsp;${stageInfo.endLevel} (${levelsLeft} ${levelsLeft === 1 ? 'level' : 'levels'} to go!)`;
      } else {
        evolutionHelper.innerHTML = `✨ Next Evolution: <strong>${stageInfo.nextStage.name}</strong> at LV&nbsp;${stageInfo.endLevel} (${levelsLeft} ${levelsLeft === 1 ? 'level' : 'levels'} to go!)`;
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

  // Render Star Vault
  renderVault();

  // Render Debug Sidebar Visibility
  renderDebugSidebarVisibility();
}

function renderDebugSidebarVisibility() {
  if (!debugSidebar || !toggleDebugSidebar) return;
  const vaultDebug = document.getElementById('vault-debug-panel');
  if (state.debugSidebarEnabled) {
    debugSidebar.classList.remove('hidden');
    if (vaultDebug) vaultDebug.classList.remove('hidden');
    toggleDebugSidebar.checked = true;
  } else {
    debugSidebar.classList.add('hidden');
    if (vaultDebug) vaultDebug.classList.add('hidden');
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
      const excused = !!state.excused[key];
      html += `
        <td class="checkbox-cell ${excused ? 'excused-cell' : ''}">
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
  
  totalHtml += `<td class="vault-cell"><button id="open-vault-btn" class="pixel-btn small warning">⭐ Vault</button></td>`;
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

  const openVaultBtn = tbody.querySelector('#open-vault-btn');
  if (openVaultBtn) {
    openVaultBtn.addEventListener('click', openVault);
  }

  renderProgress();
}

function startExceptionMode() {
  isExceptionMode = true;
  if (exceptionsBanner) {
    exceptionsBanner.classList.remove('hidden');
  }
  if (layoutContainer) {
    layoutContainer.classList.add('exception-mode');
  }
  // Close Parent Admin modal to reveal the grid
  if (adminModal) {
    adminModal.classList.add('hidden');
  }
}

function stopExceptionMode() {
  isExceptionMode = false;
  if (exceptionsBanner) {
    exceptionsBanner.classList.add('hidden');
  }
  if (layoutContainer) {
    layoutContainer.classList.remove('exception-mode');
  }
}

function handleGridClick(e) {
  if (!isExceptionMode) return;
  
  const cell = e.target.closest('.checkbox-cell');
  if (!cell) return;
  
  e.preventDefault(); // Prevent default checkbox toggle behavior from label click
  
  const input = cell.querySelector('input');
  if (!input) return;
  
  const day = parseInt(input.dataset.day);
  const taskId = input.dataset.task;
  const key = `${day}-${taskId}`;
  
  // Toggle excused state
  state.excused[key] = !state.excused[key];
  if (!state.excused[key]) {
    delete state.excused[key];
  } else {
    // If excused, uncheck it
    state.grid[key] = false;
  }
  
  saveState();
  
  // Update cell UI
  updateCellUI(cell, key);
  
  // Update checkbox state visually
  const cb = cell.querySelector('input[type="checkbox"]');
  if (cb) {
    cb.checked = !!state.grid[key];
  }
  
  // Update totals
  updateDayTotalUI(day);
  
  // Update overall progress
  renderProgress();
}

function updateCellUI(cell, key) {
  if (state.excused[key]) {
    cell.classList.add('excused-cell');
  } else {
    cell.classList.remove('excused-cell');
  }
}

function updateDayTotalUI(day) {
  const dayTotalCell = domCache.dayTotals[day];
  if (!dayTotalCell) return;
  
  const tasks = state.tasks || [];
  const allCheckedOrExcused = tasks.length > 0 && tasks.every(task => {
    const k = `${day}-${task.id}`;
    return !!state.grid[k] || !!state.excused[k];
  });
  
  if (allCheckedOrExcused) {
    dayTotalCell.innerHTML = '<div class="badge-indicator unlocked">🌟</div>';
    dayTotalCell.classList.add('unlocked');
    dayTotalCell.classList.remove('locked');
  } else {
    dayTotalCell.innerHTML = '<div class="badge-indicator locked">❌</div>';
    dayTotalCell.classList.add('locked');
    dayTotalCell.classList.remove('unlocked');
  }
  
  checkDayCompleted(day, allCheckedOrExcused);
}

function handleCheckboxChange(e) {
  if (isExceptionMode) return;
  const cb = e.target;
  
  const day = parseInt(cb.dataset.day);
  if (day !== state.activeDay) {
    cb.checked = !cb.checked; // Revert visually first
    
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = daysOfWeek[day];
    showCustomConfirm(
      "Switch Day? 📅",
      `Are you sure you want to switch to ${dayName} to check this task?\nThis is different from today.`,
      () => {
        state.activeDay = day;
        saveState();
        updateActiveColumnUI();
        
        // Restore the user's intended checked state in UI
        cb.checked = !cb.checked;
        
        // Re-run handleCheckboxChange now that activeDay matches
        handleCheckboxChange(e);
      },
      null,
      "Switch Anyway",
      "Keep Today",
      "pixel-btn greyed-out",
      "pixel-btn info"
    );
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
  const wasDayFullyChecked = tasks.length > 0 && tasks.every(task => !!state.grid[`${day}-${task.id}`] || !!state.excused[`${day}-${task.id}`]);

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

  const isDayFullyChecked = tasks.length > 0 && tasks.every(task => !!state.grid[`${day}-${task.id}`] || !!state.excused[`${day}-${task.id}`]);
  
  if (isDayFullyChecked && !wasDayFullyChecked) {
    xpGained += XP_DAILY_BONUS;
    const dayCell = domCache.dayTotals[day];
    if (dayCell) {
      const rect = dayCell.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      CelebrationEngine.triggerDailyCelebration(day, x, y);
    }
    checkDayCompleted(day, true);
  } else if (!isDayFullyChecked && wasDayFullyChecked) {
    xpGained -= XP_DAILY_BONUS;
    checkDayCompleted(day, false);
  }

  addXp(xpGained);
  saveState();
  
  checkAndTriggerWeeklySuccess();
  renderState(false);
}

export function renderRewardDropdowns() {
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
  const tbody = document.getElementById('grid-tbody');
  if (tbody) {
    tbody.addEventListener('change', (e) => {
      if (e.target.matches('.pokeball-checkbox input')) {
        handleCheckboxChange(e);
      }
    });
    tbody.addEventListener('click', handleGridClick);
  }

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
        (carryOver) => {
          resetWeekGrid(carryOver);
        },
        null,
        "Let's Go! 🚀",
        "Not Yet",
        "pixel-btn info",
        "pixel-btn",
        { showCheckbox: true, checkboxLabel: "Carry over exceptions", checkboxDefaultChecked: true }
      );
    });
  }

  if (exceptionsBtn) {
    exceptionsBtn.addEventListener('click', startExceptionMode);
  }
  if (exceptionsDoneBtn) {
    exceptionsDoneBtn.addEventListener('click', stopExceptionMode);
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
        if (isExceptionMode) {
          state.activeDay = clickedDay;
          saveState();
          updateActiveColumnUI();
          return;
        }
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

  // Admin Panel modal events are handled inside admin.js

  testMilestoneMinusOneBtn.addEventListener('click', () => {
    setMilestoneMinusOne();
  });

  testMegaMinusOneBtn.addEventListener('click', () => {
    setMegaMilestoneMinusOne();
  });

  testNearEvolveBtn.addEventListener('click', () => {
    setNearEvolution();
  });

  testNearLevelupBtn.addEventListener('click', () => {
    setNearLevelUp();
  });

  testWeek1Btn.addEventListener('click', () => { setWeek(1); });
  testWeek2Btn.addEventListener('click', () => { setWeek(2); });
  testWeek3Btn.addEventListener('click', () => { setWeek(3); });
  testWeek4Btn.addEventListener('click', () => { setWeek(4); });


  const addTodayBtn = document.getElementById('debug-vault-add-today');
  if (addTodayBtn) {
    addTodayBtn.addEventListener('click', () => {
      const dates = state.starVault.earnedDates;
      let nextDateStr;
      if (dates.length === 0) {
        nextDateStr = formatLocalDate(new Date());
      } else {
        const sorted = [...dates].sort();
        const lastDate = new Date(sorted[sorted.length - 1] + 'T00:00:00');
        lastDate.setDate(lastDate.getDate() + 1);
        nextDateStr = formatLocalDate(lastDate);
      }
      if (!dates.includes(nextDateStr)) {
        dates.push(nextDateStr);
        saveState();
        renderState(false);
      }
    });
  }

  const addYesterdayBtn = document.getElementById('debug-vault-add-yesterday');
  if (addYesterdayBtn) {
    addYesterdayBtn.addEventListener('click', () => {
      const dates = state.starVault.earnedDates;
      let nextDateStr;
      if (dates.length === 0) {
        nextDateStr = formatLocalDate(new Date());
      } else {
        const sorted = [...dates].sort();
        const lastDate = new Date(sorted[sorted.length - 1] + 'T00:00:00');
        // Add 2 days to create a 1-day gap, breaking the streak
        lastDate.setDate(lastDate.getDate() + 2);
        nextDateStr = formatLocalDate(lastDate);
      }
      if (!dates.includes(nextDateStr)) {
        dates.push(nextDateStr);
        saveState();
        renderState(false);
      }
    });
  }

  const injectStreakBtn = document.getElementById('debug-vault-inject-streak');
  if (injectStreakBtn) {
    injectStreakBtn.addEventListener('click', () => {
      const dates = state.starVault.earnedDates;
      let baseDate;
      if (dates.length === 0) {
        baseDate = new Date();
        baseDate.setDate(baseDate.getDate() - 9); // start 9 days ago
      } else {
        const sorted = [...dates].sort();
        baseDate = new Date(sorted[sorted.length - 1] + 'T00:00:00');
        baseDate.setDate(baseDate.getDate() + 1); // start consecutive sequence
      }
      
      for (let i = 0; i < 10; i++) {
        const nextDate = new Date(baseDate.getTime());
        nextDate.setDate(nextDate.getDate() + i);
        const nextDateStr = formatLocalDate(nextDate);
        if (!dates.includes(nextDateStr)) {
          dates.push(nextDateStr);
        }
      }
      saveState();
      renderState(false);
    });
  }

  const clearVaultBtn = document.getElementById('debug-vault-clear');
  if (clearVaultBtn) {
    clearVaultBtn.addEventListener('click', () => {
      state.starVault.earnedDates = [];
      state.starVault.totalTraded = 0;
      saveState();
      renderState(false);
    });
  }

  // Badge Debug Buttons
  const addBadgeBtn = document.getElementById('debug-badge-add-random');
  if (addBadgeBtn) {
    addBadgeBtn.addEventListener('click', () => {
      const collectedIds = new Set((state.collectedBadges || []).map(b => b.id));
      const availableIds = TIER_1_IDS.concat(TIER_2_IDS).filter(id => !collectedIds.has(id));
      if (availableIds.length > 0) {
        const randomId = availableIds[Math.floor(Math.random() * availableIds.length)];
        const name = getPokemonName(randomId);
        if (!state.collectedBadges) state.collectedBadges = [];
        state.collectedBadges.push({
          id: randomId,
          name: name,
          dateEarned: new Date().toISOString()
        });
        saveState();
        renderState(false);
        const badgesModal = document.getElementById('badges-modal');
        if (badgesModal && !badgesModal.classList.contains('hidden')) {
          renderBadgeCaseGrid();
        }
      } else {
        alert("All curated badges collected!");
      }
    });
  }

  const rollBadgeBtn = document.getElementById('debug-badge-roll');
  if (rollBadgeBtn) {
    rollBadgeBtn.addEventListener('click', () => {
      rollNewWeeklyBadge();
      renderState(false);
    });
  }

  const clearBadgesBtn = document.getElementById('debug-badge-clear');
  if (clearBadgesBtn) {
    clearBadgesBtn.addEventListener('click', () => {
      state.collectedBadges = [];
      state.badgePool = TIER_1_IDS.filter(id => id !== state.activeWeeklyBadgeId);
      saveState();
      renderState(false);
      const badgesModal = document.getElementById('badges-modal');
      if (badgesModal && !badgesModal.classList.contains('hidden')) {
        renderBadgeCaseGrid();
      }
    });
  }

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

function resetWeekGrid(carryOverExceptions = false) {
  let flashWeekly = false;
  let flashMega = false;
  
  if (state.weeklyClaimed) {
    const alreadyAwarded = state.collectedBadges.some(b => b.id === state.activeWeeklyBadgeId);
    if (!alreadyAwarded) {
      awardCurrentWeeklyBadge();
    }
    rollNewWeeklyBadge();
    state.megaWeeks += 1;
    if (state.megaWeeks >= 4) {
      state.megaWeeks = 0;
      state.megaReward = '';
      flashMega = true;
    }
    
    // Advance weekStartDate by 7 days to start the next week cycle
    const currentSunday = new Date(state.weekStartDate + 'T00:00:00');
    currentSunday.setDate(currentSunday.getDate() + 7);
    state.weekStartDate = formatLocalDate(currentSunday);

    state.weeklyClaimed = false;
    state.reward = '';
    flashWeekly = true;
  } else {
    state.weekStartDate = formatLocalDate(getSunday(new Date()));
  }
  
  state.grid = {};
  if (!carryOverExceptions) {
    state.excused = {};
  }
  saveState();
  renderState(true);
  
  if (flashWeekly) {
    flashElement(rewardSelect);
  }
  if (flashMega) {
    flashElement(megaRewardSelect);
  }
}

function syncVaultStarsWithGrid() {
  const tasks = state.tasks || [];
  DAYS.forEach(day => {
    const allChecked = tasks.length > 0 && tasks.every(task => !!state.grid[`${day}-${task.id}`]);
    checkDayCompleted(day, allChecked);
  });
}

function setMilestoneMinusOne() {
  state.grid = {};
  
  const tasks = state.tasks || [];
  tasks.forEach((task, index) => {
    // Make only the first task short by 1 day (req - 1). Others are set to full requirement.
    const fillCount = (index === 0) ? (task.req || 5) - 1 : (task.req || 5);
    for (let d = 0; d < fillCount; d++) {
      state.grid[`${d}-${task.id}`] = true;
    }
  });
  
  state.weeklyClaimed = false;
  
  syncVaultStarsWithGrid();
  saveState();
  renderState(true);
}

function setMegaMilestoneMinusOne() {
  state.megaWeeks = 3;
  state.grid = {};
  
  const tasks = state.tasks || [];
  tasks.forEach((task, index) => {
    // Make only the first task short by 1 day. Others are set to full requirement.
    const fillCount = (index === 0) ? (task.req || 5) - 1 : (task.req || 5);
    for (let d = 0; d < fillCount; d++) {
      state.grid[`${d}-${task.id}`] = true;
    }
  });
  
  state.weeklyClaimed = false;
  
  syncVaultStarsWithGrid();
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
  
  syncVaultStarsWithGrid();
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
        false,
        null,
        'evolution-celebration'
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
    awardCurrentWeeklyBadge();
    
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
    
    const weekDisplayNum = state.megaWeeks + 1;
    const isMegaWeek = weekDisplayNum === 4;
    
    CelebrationEngine.triggerCelebration(isMegaWeek);
    playSound(isMegaWeek ? 'megaSuccess' : 'badge');
    
    let successMessage = `<p class="notif-desc">Kepler has completed all training goals for <strong>Week ${weekDisplayNum}</strong>!</p>`;
    successMessage += `<div class="notif-rewards-container">`;
    if (isMegaWeek) {
      successMessage += `<div class="reward-box mega"><div class="reward-box-header">🏆 MEGA REWARD 🏆</div><div class="reward-box-name">${state.megaReward || 'Mega Reward'}</div></div>`;
    }
    successMessage += `<div class="reward-box"><div class="reward-box-header">🎁 WEEKLY REWARD 🎁</div><div class="reward-box-name">${state.reward || 'Weekly Reward'}</div></div>`;
    successMessage += `</div>`;
    
    showCustomNotification(
      isMegaWeek ? "👑 MEGA MILESTONE COMPLETED! 👑" : "🎉 WEEKLY SUCCESS! 🎉",
      successMessage,
      isMegaWeek 
        ? null 
        : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${state.activeWeeklyBadgeId}.png`,
      isMegaWeek,
      () => {
        showCustomConfirm(
          isMegaWeek ? "Start New Mega Cycle? 👑" : "Start New Training Week? 📅",
          isMegaWeek
            ? "Ready to loop back to Week 1 and start working towards a NEW Mega Milestone?"
            : `Are you ready to reset the training grid and start Week ${weekDisplayNum === 4 ? 1 : weekDisplayNum + 1}?`,
          (carryOver) => {
            resetWeekGrid(carryOver);
          },
          null,
          "Let's Go! 🚀",
          "Not Yet",
          "pixel-btn info",
          "pixel-btn",
          { showCheckbox: true, checkboxLabel: "Carry over exceptions", checkboxDefaultChecked: true }
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
      const excusedCount = DAYS.filter(day => !!state.excused[`${day}-${task.id}`]).length;
      const required = Math.max(0, (task.req || 5) - excusedCount);
      totalCell.textContent = `${taskTotals[task.id]} / ${required}`;
      
      if (taskTotals[task.id] >= required) {
        totalCell.classList.add('completed');
      } else {
        totalCell.classList.remove('completed');
      }
    }
  });

  DAYS.forEach(day => {
    const allChecked = tasks.length > 0 && tasks.every(task => !!state.grid[`${day}-${task.id}`] || !!state.excused[`${day}-${task.id}`]);
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
    const badgeId = state.activeWeeklyBadgeId;
    const badgeName = getPokemonName(badgeId);
    if (badgeId) {
      weeklyBadgeSlot.innerHTML = `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${badgeId}.png" alt="${badgeName}" class="mega-slot-img">`;
      badgeStatusEl.textContent = `${badgeName} Badge Earned!`;
    }
    weeklyBadgeSlot.classList.remove('locked');
    weeklyBadgeSlot.classList.add('unlocked');
    weeklyBadgeSlot.classList.add(`badge-theme-${state.megaWeeks + 1}`);
    rewardSelectContainer.classList.add('earned');
  } else {
    const badgeId = state.activeWeeklyBadgeId;
    const badgeName = getPokemonName(badgeId);
    if (badgeId) {
      weeklyBadgeSlot.innerHTML = `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${badgeId}.png" alt="Who's that Pokémon?" class="mega-slot-img silhouette">`;
    } else {
      weeklyBadgeSlot.innerHTML = `<div class="badge-placeholder">?</div>`;
    }
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
    const isUnlocked = index < state.megaWeeks || (index === state.megaWeeks && state.weeklyClaimed);
    
    slot.classList.remove(`badge-theme-${index + 1}`);
    
    if (isUnlocked) {
      let badgeId;
      let badgeName;
      
      if (index < state.megaWeeks) {
        const isCurrentCollected = state.weeklyClaimed && 
          state.collectedBadges.length > 0 && 
          state.collectedBadges[state.collectedBadges.length - 1].id === state.activeWeeklyBadgeId;
        const historyIndex = state.collectedBadges.length - (isCurrentCollected ? 1 : 0) - state.megaWeeks + index;
        const badge = state.collectedBadges[historyIndex];
        badgeId = badge ? badge.id : null;
        badgeName = badge ? badge.name : '';
      } else {
        badgeId = state.activeWeeklyBadgeId;
        badgeName = getPokemonName(badgeId);
      }
      
      if (badgeId) {
        slot.innerHTML = `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${badgeId}.png" alt="${badgeName}" class="mega-slot-img ${index === state.megaWeeks && state.weeklyClaimed ? 'animate-pop' : ''}">`;
      } else {
        slot.innerHTML = `<div class="badge-placeholder">?</div>`;
      }
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
    false,
    null,
    'evolution-celebration'
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
    renderState: (rebuildGrid) => renderState(rebuildGrid),
    ADMIN_PASSWORD: ADMIN_PASSWORD,
    resetWeekGrid: (carryOver) => resetWeekGrid(carryOver),
    renderBadgeCaseGrid: () => renderBadgeCaseGrid(),
    loadState: () => loadState(),
    renderVault: () => renderVault(),
    syncVaultStarsWithGrid: () => syncVaultStarsWithGrid()
  };
  
  const script = document.createElement('script');
  script.type = 'module';
  script.src = 'tests.js?v=' + Date.now();
  document.body.appendChild(script);
}

if ('serviceWorker' in navigator && !location.search.includes('headless=true')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(reg => console.log('Service Worker registered successfully.', reg.scope))
      .catch(err => console.log('Service Worker registration failed:', err));
  });
}
