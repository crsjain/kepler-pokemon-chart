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
    { id: 384, name: 'Rayquaza' }
  ];

  // Evolution configurations
  const EVOLUTIONS = {
    '25': {
      stages: [
        { level: 1, id: '25', name: 'Pikachu' },
        { level: 5, id: '26', name: 'Raichu' }
      ]
    },
    '4': {
      stages: [
        { level: 1, id: '4', name: 'Charmander' },
        { level: 5, id: '5', name: 'Charmeleon' },
        { level: 10, id: '6', name: 'Charizard' }
      ]
    },
    '1': {
      stages: [
        { level: 1, id: '1', name: 'Bulbasaur' },
        { level: 5, id: '2', name: 'Ivysaur' },
        { level: 10, id: '3', name: 'Venusaur' }
      ]
    },
    '7': {
      stages: [
        { level: 1, id: '7', name: 'Squirtle' },
        { level: 5, id: '8', name: 'Wartortle' },
        { level: 10, id: '9', name: 'Blastoise' }
      ]
    },
    '133': {
      stages: [
        { level: 1, id: '133', name: 'Eevee' }
      ],
      options: [
        { id: '134', name: 'Vaporeon' },
        { id: '135', name: 'Jolteon' },
        { id: '136', name: 'Flareon' },
        { id: '196', name: 'Espeon' },
        { id: '197', name: 'Umbreon' },
        { id: '470', name: 'Leafeon' },
        { id: '471', name: 'Glaceon' },
        { id: '700', name: 'Sylveon' }
      ]
    }
  };

  // State V4 (Eevee evolution choice)
  let state = {
    version: 4,
    partnerFamily: '25', // Default Pikachu Family
    partnersData: {
      '25': { level: 1, xp: 0 },
      '4': { level: 1, xp: 0 },
      '1': { level: 1, xp: 0 },
      '7': { level: 1, xp: 0 },
      '133': { level: 1, xp: 0, evolvedId: null }
    },
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

  function getStageInfo(familyId, stageId) {
    const evo = EVOLUTIONS[familyId];
    if (!evo) return { currentStage: { id: familyId, name: 'Unknown' }, nextStage: null, startLevel: 1, endLevel: null };
    
    // Special case for Eevee family
    if (familyId === '133' && stageId !== '133') {
      const chosen = evo.options.find(opt => opt.id === stageId);
      if (chosen) {
        return {
          currentStage: { level: 5, id: chosen.id, name: chosen.name },
          nextStage: null,
          startLevel: 5,
          endLevel: null
        };
      }
    }
    
    let currentStageIndex = 0;
    if (evo.stages) {
      const idx = evo.stages.findIndex(s => s.id === stageId);
      if (idx !== -1) {
        currentStageIndex = idx;
      }
    }
    
    const currentStage = evo.stages[currentStageIndex];
    let nextStage = null;
    if (familyId === '133' && stageId === '133') {
      nextStage = { level: 5, id: 'choice', name: 'Evolution Choice' };
    } else {
      nextStage = evo.stages[currentStageIndex + 1] || null;
    }
    
    const startLevel = currentStage.level;
    const endLevel = nextStage ? nextStage.level : null;
    
    return {
      currentStage,
      nextStage,
      startLevel,
      endLevel
    };
  }

  function loadState() {
    try {
      const savedState = localStorage.getItem('kepler_pokemon_training_v2');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed && typeof parsed === 'object') {
          state = { ...state, ...parsed };
          
          // Migration from V2 to V3
          if (!state.partnerFamily) {
            state.partnerFamily = state.partnerId || '25';
            state.partnersData = {
              '25': { level: 1, xp: 0 },
              '4': { level: 1, xp: 0 },
              '1': { level: 1, xp: 0 },
              '7': { level: 1, xp: 0 },
              '133': { level: 1, xp: 0 }
            };
            // Transfer old level and xp to current family
            if (state.partnersData[state.partnerFamily]) {
              state.partnersData[state.partnerFamily].level = state.level || 1;
              state.partnersData[state.partnerFamily].xp = state.xp || 0;
            }
            // Clean up old values
            delete state.level;
            delete state.xp;
            delete state.partnerId;
            delete state.partnerName;
            state.version = 3;
            saveState(); // Save migrated state immediately
          }

          // Migration from V3 to V4 (Eevee evolvedId)
          if (state.version === 3) {
            if (state.partnersData['133']) {
              state.partnersData['133'].evolvedId = null;
            }
            state.version = 4;
            saveState();
          }

          // Migration from V4 to V5 (stageId for all, no devolution)
          if (state.version === 4) {
            const families = ['25', '4', '1', '7', '133'];
            families.forEach(fid => {
              if (state.partnersData[fid]) {
                if (fid === '133') {
                  state.partnersData[fid].stageId = state.partnersData[fid].evolvedId || '133';
                  delete state.partnersData[fid].evolvedId;
                } else {
                  const lvl = state.partnersData[fid].level || 1;
                  const evo = EVOLUTIONS[fid];
                  let index = 0;
                  if (evo) {
                    for (let i = 1; i < evo.stages.length; i++) {
                      if (lvl >= evo.stages[i].level) {
                        index = i;
                      } else {
                        break;
                      }
                    }
                  }
                  state.partnersData[fid].stageId = evo ? evo.stages[index].id : fid;
                }
              }
            });
            state.version = 5;
            saveState();
          }
          
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
    const pokemonIds = [25, 26, 4, 5, 6, 1, 2, 3, 7, 8, 9, 133, 135];
    const imagesToPreload = [
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10034.png',
      ...MEGA_POKEMON.map(pkmn => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pkmn.id}.png`),
      ...pokemonIds.map(id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`)
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

  function renderPartnerSelector() {
    const container = document.getElementById('pokemon-options-container');
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
        <span class="partner-select-stats">LV ${stats.level} • ${stats.xp}/100 XP</span>
      `;

      optionDiv.addEventListener('click', () => {
        state.partnerFamily = familyId;
        saveState();
        renderState();
        partnerModal.classList.add('hidden');
      });

      container.appendChild(optionDiv);
    });
  }

  function renderState() {
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
    rewardSelect.value = state.reward || '';
    megaRewardSelect.value = state.megaReward || '';

    // 5. Render Grid Checkboxes
    checkboxes.forEach(cb => {
      const key = `${cb.dataset.day}-${cb.dataset.task}`;
      cb.checked = !!state.grid[key];
    });

    // 6. Update Progress
    renderProgress();

    // Auto-trigger Eevee evolution if they are in inconsistent state (Level >= 5 but not evolved)
    if (family === '133' && stats.level >= 5 && stats.stageId === '133') {
      showEeveeEvolutionDialog();
    }
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
      renderPartnerSelector();
      partnerModal.classList.remove('hidden');
    });

    closeModalBtn.addEventListener('click', () => {
      partnerModal.classList.add('hidden');
    });

    // Reset current week only
    resetBtn.addEventListener('click', () => {
      showCustomConfirm(
        "Start New Week? 📅",
        "Ready to start the next week and continue progress towards a Mega Milestone? Your Pokémon levels will NOT be lost!",
        () => {
          resetWeekGrid();
        }
      );
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
          version: 3,
          partnerFamily: '25',
          partnersData: {
            '25': { level: 1, xp: 0 },
            '4': { level: 1, xp: 0 },
            '1': { level: 1, xp: 0 },
            '7': { level: 1, xp: 0 },
            '133': { level: 1, xp: 0 }
          },
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

    // Testing Panel Actions
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

  // Testing Panel Helper Functions
  function setMilestoneMinusOne() {
    if (!state.reward) state.reward = "Test Reward";
    if (!state.megaReward) state.megaReward = "Test Mega Reward";

    state.grid = {};
    
    // Requirements: piano:7, math:7, reading:7, writing:5, chinese:5
    for (let d = 0; d < 7; d++) {
      state.grid[`${d}-piano`] = true;
      state.grid[`${d}-math`] = true;
      state.grid[`${d}-reading`] = true;
    }
    for (let d = 0; d < 5; d++) {
      state.grid[`${d}-writing`] = true;
    }
    // Chinese needs 5, we set 4
    for (let d = 0; d < 4; d++) {
      state.grid[`${d}-chinese`] = true;
    }
    
    state.weeklyClaimed = false;
    
    saveState();
    renderState();
  }

  function setNearEvolution() {
    const family = state.partnerFamily;
    const stats = state.partnersData[family];
    const evo = EVOLUTIONS[family];
    
    if (!evo) return;
    
    let targetLevel = 4;
    
    if (family === '133') {
      targetLevel = 4;
      stats.evolvedId = null; // Reset choice for testing
    } else {
      let nextStage = null;
      for (let i = 0; i < evo.stages.length; i++) {
        if (evo.stages[i].level > stats.level) {
          nextStage = evo.stages[i];
          break;
        }
      }
      
      if (nextStage) {
        targetLevel = nextStage.level - 1;
      } else {
        targetLevel = evo.stages[1].level - 1;
      }
    }
    
    stats.level = targetLevel;
    stats.xp = XP_LEVEL_THRESHOLD - XP_PER_TASK; // 95 XP
    
    saveState();
    renderState();
  }

  function setNearLevelUp() {
    const family = state.partnerFamily;
    const stats = state.partnersData[family];
    stats.xp = XP_LEVEL_THRESHOLD - XP_PER_TASK; // 95 XP
    saveState();
    renderState();
  }

  function setWeek(weekNum) {
    state.megaWeeks = weekNum - 1;
    state.weeklyClaimed = false;
    state.grid = {};
    
    if (!state.reward) state.reward = `Week ${weekNum} Reward`;
    if (!state.megaReward) state.megaReward = "Mega Reward";
    
    saveState();
    renderState();
  }

  function addXp(amount) {
    if (amount === 0) return;
    
    const family = state.partnerFamily;
    const stats = state.partnersData[family];
    const oldLevel = stats.level;
    let totalXp = stats.xp + amount;
    
    let levelIncreased = false;
    let levelDecreased = false;
    let evolved = false;
    let newLevel = oldLevel;
    let newXp = totalXp;
    
    if (totalXp >= XP_LEVEL_THRESHOLD) {
      newLevel += 1;
      newXp = totalXp - XP_LEVEL_THRESHOLD;
      levelIncreased = true;
      
      // Check evolution
      const evo = EVOLUTIONS[family];
      if (evo && evo.stages) {
        const currentStageIndex = evo.stages.findIndex(s => s.id === stats.stageId);
        if (currentStageIndex !== -1) {
          let newStageIndex = 0;
          for (let i = 1; i < evo.stages.length; i++) {
            if (newLevel >= evo.stages[i].level) {
              newStageIndex = i;
            } else {
              break;
            }
          }
          if (newStageIndex > currentStageIndex) {
            evolved = true;
            stats.stageId = evo.stages[newStageIndex].id;
          }
        }
      }
    } else if (totalXp < 0) {
      if (newLevel > 1) {
        newLevel -= 1;
        newXp = XP_LEVEL_THRESHOLD + totalXp;
        levelDecreased = true;
      } else {
        newXp = 0;
      }
    } else {
      newXp = totalXp;
    }

    stats.level = newLevel;
    stats.xp = newXp;

    if (levelIncreased) {
      saveAutoBackup();
      
      // Special Eevee evolution choice trigger
      if (family === '133' && newLevel === 5 && stats.stageId === '133') {
        showEeveeEvolutionDialog();
      } else if (evolved) {
        const evo = EVOLUTIONS[family];
        const newStage = evo.stages.find(s => s.id === stats.stageId);
        const newStageIndex = evo.stages.findIndex(s => s.id === stats.stageId);
        const oldStage = evo.stages[newStageIndex - 1] || evo.stages[0];
        
        CelebrationEngine.triggerCelebration(true); // Mega celebration
        playSound('badge');
        showCustomNotification(
          "✨ POKEMON EVOLVED! ✨",
          `Congratulations! Kepler's ${oldStage.name} evolved into ${newStage.name}!`,
          `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${newStage.id}.png`,
          true,
          null
        );
      } else {
        triggerLevelUpAnimation();
        playSound('levelUp');
      }
    } else if (levelDecreased) {
      saveAutoBackup();
    }
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
    // Clean up any old theme classes
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
      // Clean up theme class first
      slot.classList.remove(`badge-theme-${index + 1}`);
      
      if (isUnlocked) {
        slot.innerHTML = `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pkmn.id}.png" alt="${pkmn.name}" class="mega-slot-img">`;
        slot.classList.add('unlocked');
        slot.classList.add(`badge-theme-${index + 1}`);
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
          const family = state.partnerFamily;
          const stats = state.partnersData[family];
          const activePokemon = getStageInfo(family, stats.stageId).currentStage;
          showCustomNotification(
            "📛 POKEMON BADGE EARNED! 📛",
            `Awesome job, Kepler! You earned your ${currentBadge.name} Badge & Weekly Reward:\n\n"${rewardSelect.value || 'A cool reward'}"`,
            `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${activePokemon.id}.png`,
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

  function showCustomConfirm(title, message, onYesCallback, onNoCallback = null) {
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    
    confirmModal.classList.remove('hidden');
    
    // Rebuild buttons to clear previous listeners
    const yesBtn = document.getElementById('confirm-yes-btn');
    const newYesBtn = yesBtn.cloneNode(true);
    yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
    
    const noBtn = document.getElementById('confirm-no-btn');
    const newNoBtn = noBtn.cloneNode(true);
    noBtn.parentNode.replaceChild(newNoBtn, noBtn);
    
    newYesBtn.addEventListener('click', () => {
      confirmModal.classList.add('hidden');
      if (onYesCallback && typeof onYesCallback === 'function') {
        onYesCallback();
      }
    });
    
    newNoBtn.addEventListener('click', () => {
      confirmModal.classList.add('hidden');
      if (onNoCallback && typeof onNoCallback === 'function') {
        onNoCallback();
      }
    });
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
    renderState();
    
    // Trigger celebration
    CelebrationEngine.triggerCelebration(true); // Mega celebration
    playSound('badge');
    showCustomNotification(
      "✨ EEVEE EVOLVED! ✨",
      `Congratulations! Kepler's Eevee evolved into ${evolvedName}!`,
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${evolvedId}.png`,
      true,
      null
    );
  }
});
