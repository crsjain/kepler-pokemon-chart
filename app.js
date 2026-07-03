document.addEventListener('DOMContentLoaded', () => {
  // Constants
  const XP_PER_TASK = 5;
  const XP_DAILY_BONUS = 15;
  const XP_LEVEL_THRESHOLD = 100;
  const ADMIN_PASSWORD = "0130";
  // Task Requirements
  const TASK_REQS = {
    piano: 7,
    math: 7,
    reading: 7,
    writing: 5,
    chinese: 5
  };
  
  const TASKS = ['piano', 'math', 'reading', 'writing', 'chinese'];
  const DAYS = [0, 1, 2, 3, 4, 5, 6];
  // 8-Bit Sound Synthesizer (Web Audio API)
  let audioCtx = null;
  function playSound(type) {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      const now = audioCtx.currentTime;
      if (type === 'check') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.08); // A5
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'uncheck') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now); // A3
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.12); // A2
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'levelUp') {
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        osc.type = 'triangle';
        notes.forEach((freq, idx) => {
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        });
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'badge') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      }
    } catch (e) {
      console.warn('Audio playback failed or blocked:', e);
    }
  }
  // Mega Milestone Pokemon
  const MEGA_POKEMON = [
    { id: 658, name: 'Greninja' },
    { id: 382, name: 'Kyogre' },
    { id: 249, name: 'Lugia' },
    { id: 937, name: 'Ceruledge' }
  ];
  // State
  let state = {
    version: 2,
    partnerId: '25', // Default Pikachu
    partnerName: 'Pikachu',
    level: 1,
    xp: 0,
    reward: '',
    megaReward: '',
    megaWeeks: 0,
    weeklyClaimed: false,
    grid: {} // key format: "day-task" -> boolean
  };
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
  
  const notificationModal = document.getElementById('notification-modal');
  const notificationTitle = document.getElementById('notification-title');
  const notificationMessage = document.getElementById('notification-message');
  const notificationBadge = document.getElementById('notification-badge');
  const notificationOkBtn = document.getElementById('notification-ok-btn');
  const resetBtn = document.getElementById('reset-btn');
  const adminBtn = document.getElementById('admin-btn');
  
  // Admin Modal Elements
  const adminModal = document.getElementById('admin-modal');
  const adminRestoreAutoBtn = document.getElementById('admin-restore-auto-btn');
  const adminExportBtn = document.getElementById('admin-export-btn');
  const adminImportBtn = document.getElementById('admin-import-btn');
  const adminWipeBtn = document.getElementById('admin-wipe-btn');
  const closeAdminModalBtn = document.getElementById('close-admin-modal-btn');
  const pokemonOptions = document.querySelectorAll('.pokemon-option');
  const checkboxes = document.querySelectorAll('.pokeball-checkbox input');
  // Cached DOM elements for performance
  const taskTotalCells = {};
  TASKS.forEach(task => {
    taskTotalCells[task] = document.querySelector(`.task-total-cell[data-task="${task}"]`);
  });
  const dayTotalCells = {};
  const dayBadgeIndicators = {};
  DAYS.forEach(day => {
    const cell = document.querySelector(`.day-total-cell[data-day="${day}"]`);
    dayTotalCells[day] = cell;
    if (cell) {
      dayBadgeIndicators[day] = cell.querySelector('.badge-indicator');
    }
  });
  // Initialize
  loadState();
  preloadImages();
  renderState();
  setupEventListeners();
  function loadState() {
    try {
      const savedState = localStorage.getItem('kepler_pokemon_training_v2');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed && typeof parsed === 'object') {
          state = { ...state, ...parsed };
          if (!state.grid || typeof state.grid !== 'object') {
            state.grid = {};
          }
        }
      }
    } catch (e) {
      console.error('Error loading state from localStorage:', e);
    }
  }
  function saveState() {
    try {
      localStorage.setItem('kepler_pokemon_training_v2', JSON.stringify(state));
    } catch (e) {
      console.error('Error saving state to localStorage:', e);
    }
  }
  function saveAutoBackup() {
    try {
      localStorage.setItem('kepler_pokemon_training_backup', JSON.stringify(state));
      console.log('Auto-backup saved.');
    } catch (e) {
      console.error('Error saving auto-backup to localStorage:', e);
    }
  }
  function restoreFromAutoBackup() {
    try {
      const backup = localStorage.getItem('kepler_pokemon_training_backup');
      if (backup) {
        const parsed = JSON.parse(backup);
        if (parsed && typeof parsed === 'object') {
          if (confirm("Are you sure you want to restore from the last auto-backup? This will overwrite current progress.")) {
            state = { ...state, ...parsed };
            saveState();
            renderState();
            alert("Progress restored from auto-backup successfully!");
            adminModal.classList.add('hidden');
          }
        }
      } else {
        alert("No auto-backup found!");
      }
    } catch (e) {
      alert("Error restoring from auto-backup.");
      console.error(e);
    }
  }
  function preloadImages() {
    const imagesToPreload = [
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10034.png',
      ...MEGA_POKEMON.map(pkmn => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pkmn.id}.png`)
    ];
    imagesToPreload.forEach(url => {
      const img = new Image();
      img.src = url;
    });
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
        if (parsed.level !== undefined && parsed.grid !== undefined) {
          if (confirm("Are you sure you want to restore this backup? It will overwrite current progress!")) {
            state = { ...state, ...parsed };
            saveState();
            renderState();
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
      alert("Error parsing backup code. Please try again.");
    }
  }
  function renderState() {
    // 1. Render Partner
    pokemonSprite.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${state.partnerId}.png`;
    partnerNameEl.textContent = state.partnerName;
    // 2. Render Stats
    levelEl.textContent = state.level;
    currentXpEl.textContent = state.xp;
    nextLevelXpEl.textContent = XP_LEVEL_THRESHOLD;
    const xpPercent = Math.min(100, (state.xp / XP_LEVEL_THRESHOLD) * 100);
    xpBarFill.style.width = `${xpPercent}%`;
    // 3. Render Dropdowns
    rewardSelect.value = state.reward || '';
    megaRewardSelect.value = state.megaReward || '';
    // 4. Render Grid Checkboxes
    checkboxes.forEach(cb => {
      const key = `${cb.dataset.day}-${cb.dataset.task}`;
      cb.checked = !!state.grid[key];
    });
    // 5. Update Progress
    renderProgress();
  }
  function setupEventListeners() {
    // Checkbox changes
    checkboxes.forEach(cb => {
      cb.addEventListener('change', (e) => {
        // Validation: Must select prizes first
        if (!state.reward || !state.megaReward) {
          cb.checked = false; // Undo check
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
        const day = cb.dataset.day;
        const task = cb.dataset.task;
        const key = `${day}-${task}`;
        const wasChecked = !!state.grid[key];
        const isChecked = cb.checked;
        // Check if the day WAS fully checked before this change
        const wasDayFullyChecked = TASKS.every(t => {
          if (t === task) return wasChecked;
          return !!state.grid[`${day}-${t}`];
        });
        state.grid[key] = isChecked;
        // Check if the day IS fully checked after this change
        const isDayFullyChecked = TASKS.every(t => !!state.grid[`${day}-${t}`]);
        // Calculate XP diff
        let xpGained = 0;
        if (isChecked && !wasChecked) {
          xpGained += XP_PER_TASK;
          playSound('check');
        } else if (!isChecked && wasChecked) {
          xpGained -= XP_PER_TASK;
          playSound('uncheck');
        }
        // Daily bonus XP logic
        if (isDayFullyChecked && !wasDayFullyChecked) {
          xpGained += XP_DAILY_BONUS;
          // Trigger daily celebration
          const totalCell = dayTotalCells[day];
          if (totalCell) {
            const rect = totalCell.getBoundingClientRect();
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
        renderState();
      });
    });
    // Dropdowns
    rewardSelect.addEventListener('change', () => {
      state.reward = rewardSelect.value;
      saveState();
    });
    megaRewardSelect.addEventListener('change', () => {
      state.megaReward = megaRewardSelect.value;
      saveState();
    });
    // Partner Selection
    changePartnerBtn.addEventListener('click', () => {
      partnerModal.classList.remove('hidden');
    });
    closeModalBtn.addEventListener('click', () => {
      partnerModal.classList.add('hidden');
    });
    pokemonOptions.forEach(option => {
      option.addEventListener('click', () => {
        state.partnerId = option.dataset.id;
        state.partnerName = option.dataset.name;
        saveState();
        renderState();
        partnerModal.classList.add('hidden');
      });
    });
    // Reset current week only
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset this week\'s training grid? Kepler\'s Levels and Mega Milestone progress will NOT be lost.')) {
        resetWeekGrid();
      }
    });
    // Admin Panel (Password protected)
    adminBtn.addEventListener('click', () => {
      const password = prompt('Enter Parent Password to open Admin Panel:');
      if (password === ADMIN_PASSWORD) {
        adminModal.classList.remove('hidden');
      } else if (password !== null) {
        alert('Wrong Code! Try again, Parent!');
      }
    });
    closeAdminModalBtn.addEventListener('click', () => {
      adminModal.classList.add('hidden');
    });
    // Admin Modal Actions
    adminRestoreAutoBtn.addEventListener('click', () => {
      restoreFromAutoBackup();
    });
    adminExportBtn.addEventListener('click', () => {
      exportState();
    });
    adminImportBtn.addEventListener('click', () => {
      importState();
    });
    adminWipeBtn.addEventListener('click', () => {
      if (confirm('WARNING: This will completely reset Kepler back to Level 1 and wipe all saved progress. Proceed?')) {
        state = {
          version: 2,
          partnerId: '25',
          partnerName: 'Pikachu',
          level: 1,
          xp: 0,
          reward: '',
          megaReward: '',
          megaWeeks: 0,
          weeklyClaimed: false,
          grid: {}
        };
        saveState();
        renderState();
        alert('System completely rebooted! Good luck, Kepler!');
        adminModal.classList.add('hidden');
      }
    });
  }
  function resetWeekGrid() {
    if (state.weeklyClaimed) {
      state.megaWeeks += 1;
      if (state.megaWeeks >= 4) {
        state.megaWeeks = 0;
        state.megaReward = ''; // Clear mega reward on loop reset
      }
      state.weeklyClaimed = false;
      state.reward = ''; // Clear weekly reward for new week
    }
    state.grid = {};
    saveState();
    renderState();
  }
  function addXp(amount) {
    if (amount === 0) return;
    
    let totalXp = state.xp + amount;
    
    if (totalXp >= XP_LEVEL_THRESHOLD) {
      state.level += 1;
      state.xp = totalXp - XP_LEVEL_THRESHOLD;
      triggerLevelUpAnimation();
      playSound('levelUp');
      saveAutoBackup();
    } else if (totalXp < 0) {
      if (state.level > 1) {
        state.level -= 1;
        state.xp = XP_LEVEL_THRESHOLD + totalXp;
      } else {
        state.xp = 0;
      }
    } else {
      state.xp = totalXp;
    }
    levelEl.textContent = state.level;
    currentXpEl.textContent = state.xp;
    const xpPercent = Math.min(100, (state.xp / XP_LEVEL_THRESHOLD) * 100);
    xpBarFill.style.width = `${xpPercent}%`;
  }
  function triggerLevelUpAnimation() {
    pokemonSprite.classList.add('level-up');
    setTimeout(() => {
      pokemonSprite.classList.remove('level-up');
    }, 800);
  }
  function renderProgress() {
    // 1. Calculate Task Totals (Across the Week)
    const taskTotals = { piano: 0, math: 0, reading: 0, writing: 0, chinese: 0 };
    
    TASKS.forEach(task => {
      DAYS.forEach(day => {
        if (state.grid[`${day}-${task}`]) {
          taskTotals[task]++;
        }
      });
      // Update grid cells in the "GOAL" column
      const totalCell = taskTotalCells[task];
      if (totalCell) {
        const required = TASK_REQS[task];
        totalCell.textContent = `${taskTotals[task]} / ${required}`;
        
        if (taskTotals[task] >= required) {
          totalCell.classList.add('completed');
        } else {
          totalCell.classList.remove('completed');
        }
      }
    });
    // 2. Calculate Daily Totals (For ⭐ Daily Total row visual decoration)
    DAYS.forEach(day => {
      const allChecked = TASKS.every(task => !!state.grid[`${day}-${task}`]);
      const totalCell = dayTotalCells[day];
      if (totalCell) {
        const indicator = dayBadgeIndicators[day];
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
    // 3. Render Weekly Badge Slot
    if (state.weeklyClaimed) {
      const currentBadge = MEGA_POKEMON[state.megaWeeks];
      if (currentBadge) {
        weeklyBadgeSlot.innerHTML = `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${currentBadge.id}.png" alt="${currentBadge.name}" class="mega-slot-img">`;
        badgeStatusEl.textContent = `${currentBadge.name} Badge Earned!`;
      }
      weeklyBadgeSlot.classList.remove('locked');
      weeklyBadgeSlot.classList.add('unlocked');
      rewardSelectContainer.classList.add('earned');
    } else {
      weeklyBadgeSlot.innerHTML = '<span class="badge-icon">🔒</span>';
      weeklyBadgeSlot.classList.remove('unlocked');
      weeklyBadgeSlot.classList.add('locked');
      badgeStatusEl.innerHTML = "Piano, Math, Reading: 7 days.<br>Writing, Chinese: 5 days.";
      rewardSelectContainer.classList.remove('earned');
    }
    // 4. Render Mega Milestone Progress Tracker
    megaWeeksCountEl.textContent = `${state.weeklyClaimed ? Math.min(4, state.megaWeeks + 1) : state.megaWeeks}`;
    megaSlots.forEach((slot, index) => {
      const pkmn = MEGA_POKEMON[index];
      const isUnlocked = index < state.megaWeeks || (index === state.megaWeeks && state.weeklyClaimed);
      if (isUnlocked) {
        slot.innerHTML = `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pkmn.id}.png" alt="${pkmn.name}" class="mega-slot-img">`;
        slot.classList.add('unlocked');
      } else {
        slot.innerHTML = `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" alt="Locked" class="mega-slot-img locked">`;
        slot.classList.remove('unlocked');
      }
    });
    // Highlight Mega Reward if they have completed 3 weeks and this week is ready
    if ((state.megaWeeks === 3 && state.weeklyClaimed) || state.megaWeeks > 3) {
      megaRewardSelectContainer.classList.add('mega-earned');
    } else {
      megaRewardSelectContainer.classList.remove('mega-earned');
    }
  }
  function checkAndTriggerWeeklySuccess() {
    const weeklySuccess = checkWeeklySuccess();
    
    if (weeklySuccess && !state.weeklyClaimed) {
      state.weeklyClaimed = true;
      saveState();
      saveAutoBackup();
      
      // Render weekly badge immediately
      renderProgress();
      
      setTimeout(() => {
        if (state.megaWeeks === 3) {
          CelebrationEngine.triggerCelebration(true);
          playSound('badge');
          showCustomNotification(
            "🔮 MEGA CELEBRATION! 🔮",
            `MEGA CELEBRATION! Kepler earned a Mega Milestone Reward:\n\n"${megaRewardSelect.value || 'A special reward'}"`,
            'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10034.png',
            true,
            null
          );
        } else {
          CelebrationEngine.triggerCelebration(false);
          playSound('badge');
          const currentBadge = MEGA_POKEMON[state.megaWeeks];
          showCustomNotification(
            "📛 POKEMON BADGE EARNED! 📛",
            `Awesome job, Kepler! You earned your ${currentBadge.name} Badge & Weekly Reward:\n\n"${rewardSelect.value || 'A cool reward'}"`,
            `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${state.partnerId}.png`,
            true,
            null
          );
        }
      }, 500);
    }
  }
  function checkWeeklySuccess() {
    const taskTotals = { piano: 0, math: 0, reading: 0, writing: 0, chinese: 0 };
    
    TASKS.forEach(task => {
      DAYS.forEach(day => {
        if (state.grid[`${day}-${task}`]) {
          taskTotals[task]++;
        }
      });
    });
    return (
      taskTotals.piano >= TASK_REQS.piano &&
      taskTotals.math >= TASK_REQS.math &&
      taskTotals.reading >= TASK_REQS.reading &&
      taskTotals.writing >= TASK_REQS.writing &&
      taskTotals.chinese >= TASK_REQS.chinese
    );
  }
  function showCustomNotification(title, message, badgeUrl = '', bounceBadge = false, onCloseCallback = null) {
    notificationTitle.textContent = title;
    notificationMessage.textContent = message;
    
    if (badgeUrl) {
      notificationBadge.src = badgeUrl;
      notificationBadge.classList.remove('hidden');
      if (bounceBadge) {
        notificationBadge.classList.add('bounce');
      } else {
        notificationBadge.classList.remove('bounce');
      }
    } else {
      notificationBadge.classList.add('hidden');
      notificationBadge.src = '';
    }
    notificationModal.classList.remove('hidden');
    const okBtn = document.getElementById('notification-ok-btn');
    const newOkBtn = okBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);
    newOkBtn.addEventListener('click', () => {
      notificationModal.classList.add('hidden');
      if (onCloseCallback && typeof onCloseCallback === 'function') {
        onCloseCallback();
      }
    });
  }
});
