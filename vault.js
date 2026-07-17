import { state, saveState, formatLocalDate } from './state.js';

// DOM elements cache
let vaultModal = null;
let closeVaultBtn = null;
let vaultGrid = null;
let statEarned = null;
let statTraded = null;
let statRemaining = null;

// Pagination elements cache
let currentPage = 0;
let pagePrevBtn = null;
let pageNextBtn = null;
let pageInfoSpan = null;
let paginationContainer = null;
let globalTooltip = null;

// Inline Trading DOM Cache
let tradeOpenBtn = null;
let tradeModal = null;
let closeTradeBtn = null;
let tradeGateScreen = null;
let tradePanelScreen = null;
let tradePasswordInput = null;
let tradePasswordSubmitBtn = null;
let tradePasswordError = null;
let tradeAvailableCount = null;
let tradeCountMinusBtn = null;
let tradeCountPlusBtn = null;
let tradeCountValue = null;
let tradeCancelBtn = null;
let tradeConfirmBtn = null;

let selectedTradeCount = 1;

// Admin panel DOM elements cache
let adminEarned = null;
let adminTradedInput = null;
let adminRemaining = null;

export function initVault() {
  vaultModal = document.getElementById('vault-modal');
  closeVaultBtn = document.getElementById('close-vault-modal-btn');
  vaultGrid = document.getElementById('vault-grid');
  
  statEarned = document.getElementById('vault-stat-earned');
  statTraded = document.getElementById('vault-stat-traded');
  statRemaining = document.getElementById('vault-stat-remaining');

  // Pagination elements
  pagePrevBtn = document.getElementById('vault-page-prev');
  pageNextBtn = document.getElementById('vault-page-next');
  pageInfoSpan = document.getElementById('vault-page-info');
  paginationContainer = document.getElementById('vault-pagination');
  globalTooltip = document.getElementById('global-star-tooltip');

  // Trading Modal bindings
  tradeOpenBtn = document.getElementById('vault-trade-open-btn');
  tradeModal = document.getElementById('vault-trade-modal');
  closeTradeBtn = document.getElementById('close-trade-modal-btn');
  tradeGateScreen = document.getElementById('trade-screen-gate');
  tradePanelScreen = document.getElementById('trade-screen-panel');
  tradePasswordInput = document.getElementById('trade-gate-password');
  tradePasswordSubmitBtn = document.getElementById('trade-gate-submit-btn');
  tradePasswordError = document.getElementById('trade-gate-error');
  tradeAvailableCount = document.getElementById('trade-available-count');
  tradeCountMinusBtn = document.getElementById('trade-count-minus');
  tradeCountPlusBtn = document.getElementById('trade-count-plus');
  tradeCountValue = document.getElementById('trade-count-value');
  tradeCancelBtn = document.getElementById('trade-cancel-btn');
  tradeConfirmBtn = document.getElementById('trade-confirm-btn');

  if (pagePrevBtn) {
    pagePrevBtn.addEventListener('click', () => {
      if (currentPage > 0) {
        currentPage--;
        renderVault();
      }
    });
  }
  if (pageNextBtn) {
    pageNextBtn.addEventListener('click', () => {
      currentPage++;
      renderVault();
    });
  }

  // Bind close events
  if (closeVaultBtn) {
    closeVaultBtn.addEventListener('click', closeVault);
  }
  
  if (vaultModal) {
    vaultModal.addEventListener('click', (e) => {
      if (e.target === vaultModal) {
        closeVault();
      }
    });
  }

  // Bind Inline Trading Flow
  if (tradeOpenBtn) {
    tradeOpenBtn.addEventListener('click', openTradeFlow);
  }
  if (closeTradeBtn) {
    closeTradeBtn.addEventListener('click', closeTradeFlow);
  }
  if (tradeCancelBtn) {
    tradeCancelBtn.addEventListener('click', closeTradeFlow);
  }
  if (tradePasswordSubmitBtn) {
    tradePasswordSubmitBtn.addEventListener('click', verifyTradePassword);
  }
  if (tradePasswordInput) {
    tradePasswordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        verifyTradePassword();
      }
    });
  }
  if (tradeCountMinusBtn) {
    tradeCountMinusBtn.addEventListener('click', () => {
      if (selectedTradeCount > 1) {
        selectedTradeCount--;
        updateTradePanelUI();
      }
    });
  }
  if (tradeCountPlusBtn) {
    tradeCountPlusBtn.addEventListener('click', () => {
      const earned = state.starVault.earnedDates.length;
      const traded = state.starVault.totalTraded || 0;
      const available = Math.max(0, earned - traded);
      if (selectedTradeCount < available) {
        selectedTradeCount++;
        updateTradePanelUI();
      }
    });
  }
  if (tradeConfirmBtn) {
    tradeConfirmBtn.addEventListener('click', () => {
      state.starVault.totalTraded = (state.starVault.totalTraded || 0) + selectedTradeCount;
      saveState();
      
      // Trigger particles celebration
      if (window.CelebrationEngine && window.CelebrationEngine.triggerCelebration) {
        window.CelebrationEngine.triggerCelebration(false);
      }
      
      closeTradeFlow();
      renderVault();

    });
  }

  // Close trade modal on clicking background
  if (tradeModal) {
    tradeModal.addEventListener('click', (e) => {
      if (e.target === tradeModal) {
        closeTradeFlow();
      }
    });
  }

  bindAdminElements();
}

function openTradeFlow() {
  if (!tradeModal) return;
  
  if (tradeGateScreen) tradeGateScreen.classList.remove('hidden');
  if (tradePanelScreen) tradePanelScreen.classList.add('hidden');
  if (tradePasswordInput) {
    tradePasswordInput.value = '';
    tradePasswordInput.focus();
  }
  if (tradePasswordError) tradePasswordError.classList.add('hidden');
  
  selectedTradeCount = 1;
  tradeModal.classList.remove('hidden');
}

function verifyTradePassword() {
  if (!tradePasswordInput) return;
  const pw = tradePasswordInput.value;
  if (pw === 'zxcv') {
    if (tradeGateScreen) tradeGateScreen.classList.add('hidden');
    if (tradePanelScreen) tradePanelScreen.classList.remove('hidden');
    
    const earned = state.starVault.earnedDates.length;
    const traded = state.starVault.totalTraded || 0;
    const available = Math.max(0, earned - traded);
    
    if (tradeAvailableCount) tradeAvailableCount.textContent = available;
    
    selectedTradeCount = Math.min(1, available);
    updateTradePanelUI();
  } else {
    if (tradePasswordError) tradePasswordError.classList.remove('hidden');
    if (tradePasswordInput) {
      tradePasswordInput.value = '';
      tradePasswordInput.focus();
    }
  }
}

function updateTradePanelUI() {
  const earned = state.starVault.earnedDates.length;
  const traded = state.starVault.totalTraded || 0;
  const available = Math.max(0, earned - traded);
  
  if (tradeCountValue) tradeCountValue.textContent = selectedTradeCount;
  
  if (tradeCountMinusBtn) tradeCountMinusBtn.disabled = selectedTradeCount <= 1;
  if (tradeCountPlusBtn) tradeCountPlusBtn.disabled = selectedTradeCount >= available;
  if (tradeConfirmBtn) tradeConfirmBtn.disabled = selectedTradeCount <= 0;
}

function closeTradeFlow() {
  if (tradeModal) {
    tradeModal.classList.add('hidden');
  }
}

function bindAdminElements() {
  adminEarned = document.getElementById('admin-vault-earned');
  adminTradedInput = document.getElementById('admin-vault-traded-input');
  adminRemaining = document.getElementById('admin-vault-remaining');

  const plusBtn = document.getElementById('admin-vault-traded-plus');
  const minusBtn = document.getElementById('admin-vault-traded-minus');
  const saveBtn = document.getElementById('admin-save-vault-btn');

  if (plusBtn && adminTradedInput) {
    plusBtn.addEventListener('click', () => {
      adminTradedInput.value = parseInt(adminTradedInput.value || 0) + 1;
      updateAdminRemaining();
    });
  }

  if (minusBtn && adminTradedInput) {
    minusBtn.addEventListener('click', () => {
      const val = parseInt(adminTradedInput.value || 0);
      if (val > 0) {
        adminTradedInput.value = val - 1;
        updateAdminRemaining();
      }
    });
  }

  if (adminTradedInput) {
    adminTradedInput.addEventListener('input', updateAdminRemaining);
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const tradedVal = parseInt(adminTradedInput.value || 0);
      state.starVault.totalTraded = tradedVal;
      saveState();

      if (window.__test_helpers__) {
        console.log('Saved vault settings:', state.starVault);
      }
    });
  }
}

function updateAdminRemaining() {
  if (!adminEarned || !adminTradedInput || !adminRemaining) return;
  const earned = parseInt(adminEarned.textContent || 0);
  const traded = parseInt(adminTradedInput.value || 0);
  adminRemaining.textContent = Math.max(0, earned - traded);
}

export function updateAdminVaultStats() {
  if (!adminEarned || !adminTradedInput || !adminRemaining) {
    bindAdminElements();
  }
  if (adminEarned && adminTradedInput && adminRemaining) {
    const earned = state.starVault.earnedDates.length;
    const traded = state.starVault.totalTraded || 0;
    adminEarned.textContent = earned;
    adminTradedInput.value = traded;
    adminRemaining.textContent = Math.max(0, earned - traded);
  }
}

export function openVault() {
  if (!vaultModal) initVault();
  
  const stars = getStarsFromDates(state.starVault.earnedDates);
  const isMobile = window.innerWidth <= 480;
  const columns = isMobile ? 5 : 10;
  const pageSize = columns * 4;
  const totalPages = Math.max(1, Math.ceil(stars.length / pageSize));
  
  currentPage = totalPages - 1; // Default to last page
  renderVault();
  if (vaultModal) {
    vaultModal.classList.remove('hidden');
  }
}

export function closeVault() {
  if (vaultModal) {
    vaultModal.classList.add('hidden');
  }
  if (globalTooltip) {
    globalTooltip.classList.add('hidden');
  }
  closeTradeFlow();
}

export function checkDayCompleted(dayIndex, isCompleted) {
  if (!state.weekStartDate) {
    console.error('weekStartDate is missing in state.');
    return;
  }
  const dateStr = getDateOfColumn(state.weekStartDate, dayIndex);
  const index = state.starVault.earnedDates.indexOf(dateStr);

  if (isCompleted) {
    if (index === -1) {
      state.starVault.earnedDates.push(dateStr);
      saveState();
    }
  } else {
    if (index !== -1) {
      state.starVault.earnedDates.splice(index, 1);
      saveState();
    }
  }
}

export function getDateOfColumn(weekStartDateStr, d) {
  const baseDate = new Date(weekStartDateStr + 'T00:00:00');
  baseDate.setDate(baseDate.getDate() + d);
  return formatLocalDate(baseDate);
}

function parseLocalDate(dateStr) {
  const parts = dateStr.split('-');
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

export function getStarsFromDates(dates) {
  if (!dates || dates.length === 0) return [];
  
  // YYYY-MM-DD strings sort alphabetically in chronological order
  const sortedDates = [...dates].sort();
  
  const stars = [];
  let currentStreak = [];
  
  for (let i = 0; i < sortedDates.length; i++) {
    const dateStr = sortedDates[i];
    
    if (currentStreak.length === 0) {
      currentStreak.push(dateStr);
    } else {
      const prevDateStr = currentStreak[currentStreak.length - 1];
      const prevDate = parseLocalDate(prevDateStr);
      const currDate = parseLocalDate(dateStr);
      
      const diffTime = currDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak.push(dateStr);
      } else {
        processStreak(currentStreak, stars);
        currentStreak = [dateStr];
      }
    }
  }
  
  if (currentStreak.length > 0) {
    processStreak(currentStreak, stars);
  }
  
  return stars;
}

function processStreak(streakDates, starsArray) {
  streakDates.forEach((dateStr, index) => {
    const streakDay = index + 1;
    let color = 'yellow';
    if (streakDay >= 3 && streakDay <= 4) color = 'silver';
    else if (streakDay >= 5 && streakDay <= 9) color = 'blue';
    else if (streakDay >= 10) color = 'prism';
    
    starsArray.push({
      date: dateStr,
      streakDay: streakDay,
      color: color
    });
  });
}

export function renderVault() {
  const earnedCount = state.starVault.earnedDates.length;
  const tradedCount = state.starVault.totalTraded || 0;
  const remainingCount = Math.max(0, earnedCount - tradedCount);

  if (statEarned) statEarned.textContent = earnedCount;
  if (statTraded) statTraded.textContent = tradedCount;
  if (statRemaining) statRemaining.textContent = remainingCount;

  // Toggle Spend Button state (disabled if nothing to spend)
  const tradeBtn = document.getElementById('vault-trade-open-btn');
  if (tradeBtn) {
    tradeBtn.disabled = remainingCount <= 0;
    if (remainingCount <= 0) {
      tradeBtn.classList.add('disabled');
      tradeBtn.textContent = 'Earn Stars to spend!';
    } else {
      tradeBtn.classList.remove('disabled');
      tradeBtn.textContent = '✨ Spend Stars for a Reward! ✨';
    }
  }

  if (!vaultGrid) return;
  vaultGrid.innerHTML = '';

  const stars = getStarsFromDates(state.starVault.earnedDates);

  const isMobile = window.innerWidth <= 480;
  const columns = isMobile ? 5 : 10;
  const rowsPerPage = 4;
  const pageSize = columns * rowsPerPage;

  const totalPages = Math.max(1, Math.ceil(stars.length / pageSize));
  if (currentPage >= totalPages) currentPage = totalPages - 1;
  if (currentPage < 0) currentPage = 0;

  const startIndex = currentPage * pageSize;
  const pageStars = stars.slice(startIndex, startIndex + pageSize);

  for (let i = 0; i < pageSize; i++) {
    const slotEl = document.createElement('div');
    slotEl.className = 'vault-star-slot';

    if (i < pageStars.length) {
      const star = pageStars[i];
      const starEl = document.createElement('div');
      starEl.className = `vault-star-wrapper ${star.color}`;
      starEl.innerHTML = `
        <svg class="vault-star-svg" viewBox="0 0 24 24">
          <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.21l8.2-1.192z"/>
        </svg>
      `;

      starEl.addEventListener('mouseenter', () => {
        if (!globalTooltip) globalTooltip = document.getElementById('global-star-tooltip');
        if (globalTooltip) {
          globalTooltip.innerHTML = `<div style="font-size: 0.85rem;">🌟 ${star.date}</div><div style="font-size: 0.72rem; color: #38bdf8; margin-top: 3px;">Streak Day ${star.streakDay} (${star.color.toUpperCase()})</div>`;
          globalTooltip.classList.remove('hidden');
          const rect = starEl.getBoundingClientRect();
          let top = rect.top - globalTooltip.offsetHeight - 8;
          let left = rect.left + (rect.width / 2) - (globalTooltip.offsetWidth / 2);
          if (left < 10) left = 10;
          if (left + globalTooltip.offsetWidth > window.innerWidth - 10) {
            left = window.innerWidth - globalTooltip.offsetWidth - 10;
          }
          if (top < 10) {
            top = rect.bottom + 8;
          }
          globalTooltip.style.top = `${top}px`;
          globalTooltip.style.left = `${left}px`;
        }
      });

      starEl.addEventListener('mouseleave', () => {
        if (globalTooltip) globalTooltip.classList.add('hidden');
      });

      slotEl.appendChild(starEl);
    } else {
      slotEl.classList.add('empty');
      const mount = document.createElement('div');
      mount.className = 'empty-holder-mount';
      mount.innerHTML = `
        <svg viewBox="0 0 24 24">
          <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.21l8.2-1.192z"/>
        </svg>
      `;
      slotEl.appendChild(mount);
    }
    vaultGrid.appendChild(slotEl);
  }

  if (!paginationContainer) paginationContainer = document.getElementById('vault-pagination');
  if (!pageInfoSpan) pageInfoSpan = document.getElementById('vault-page-info');
  if (!pagePrevBtn) pagePrevBtn = document.getElementById('vault-page-prev');
  if (!pageNextBtn) pageNextBtn = document.getElementById('vault-page-next');

  if (paginationContainer) {
    paginationContainer.classList.remove('hidden');
    if (pageInfoSpan) pageInfoSpan.textContent = `Page ${currentPage + 1} of ${totalPages}`;
    if (pagePrevBtn) pagePrevBtn.disabled = currentPage === 0;
    if (pageNextBtn) pageNextBtn.disabled = currentPage >= totalPages - 1;
  }
}
