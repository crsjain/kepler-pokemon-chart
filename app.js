document.addEventListener('DOMContentLoaded', () => {
  // Constants
  const XP_PER_TASK = 5;
  const XP_DAILY_BONUS = 15;
  const XP_LEVEL_THRESHOLD = 100;
  const ADMIN_PASSWORD = "0130";

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
      const volumeMultiplier = (state.volume !== undefined ? state.volume : 50) / 100;

      if (type === 'check') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.08); // A5
        gain.gain.setValueAtTime(0.05 * volumeMultiplier, now);
        gain.gain.exponentialRampToValueAtTime(0.01 * volumeMultiplier, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'uncheck') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now); // A3
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.12); // A2
        gain.gain.setValueAtTime(0.05 * volumeMultiplier, now);
        gain.gain.exponentialRampToValueAtTime(0.01 * volumeMultiplier, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'levelUp') {
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        osc.type = 'triangle';
        notes.forEach((freq, idx) => {
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        });
        gain.gain.setValueAtTime(0.1 * volumeMultiplier, now);
        gain.gain.exponentialRampToValueAtTime(0.01 * volumeMultiplier, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'badge') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
        gain.gain.setValueAtTime(0.08 * volumeMultiplier, now);
        gain.gain.exponentialRampToValueAtTime(0.01 * volumeMultiplier, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      }
    } catch (e) {
      console.warn('Audio playback failed or blocked:', e);
    }
  }

  function playActivePokemonCry() {
    try {
      const family = state.partnerFamily || '25';
      const stats = state.partnersData[family] || { level: 1, xp: 0, stageId: family };
      const stageInfo = getStageInfo(family, stats.stageId || family);
      const activePokemon = stageInfo.currentStage;
      
      if (activePokemon && activePokemon.id) {
        const cryUrl = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${activePokemon.id}.ogg`;
        const audio = new Audio(cryUrl);
        audio.volume = (state.volume !== undefined ? state.volume : 50) / 100;
        audio.play().catch(err => {
          console.warn("Failed to play pokemon cry:", err);
        });
      }
    } catch (e) {
      console.warn("Error playing active pokemon cry:", e);
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

  // State V8 (Dynamic Tasks, Reward History, Volume, Claimed Rewards History)
  let state = {
    version: 8,
    partnerFamily: '25', // Default Pikachu Family
    partnersData: {
      '25': { level: 1, xp: 0, stageId: '25' },
      '4': { level: 1, xp: 0, stageId: '4' },
      '1': { level: 1, xp: 0, stageId: '1' },
      '7': { level: 1, xp: 0, stageId: '7' },
      '133': { level: 1, xp: 0, stageId: '133' }
    },
    reward: '',
    megaReward: '',
    megaWeeks: 0,
    weeklyClaimed: false,
    debugSidebarEnabled: false,
    grid: {}, // key format: "day-task" -> boolean
    tasks: [
      { id: 'piano', name: 'Piano Practice', req: 7, emoji: '🎹', concept: 'Level up!' },
      { id: 'math', name: 'Math Practice', req: 7, emoji: '🧮', concept: 'Intellect +1' },
      { id: 'reading', name: 'Reading Time', req: 7, emoji: '📚', concept: 'Explore new zones!' },
      { id: 'writing', name: 'Writing', req: 5, emoji: '✏️', concept: 'Skill mastery' },
      { id: 'chinese', name: 'Chinese', req: 5, emoji: '💮', concept: 'Character master!' }
    ],
    rewardHistory: [],
    megaRewardHistory: [],
    volume: 50,
    claimedRewardsHistory: []
  };

  // DOM Cache for Optimization
  let domCache = {
    taskTotals: {},
    dayTotals: {},
    checkboxes: {}
  };
  let gridRebuildCount = 0;

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



  // Initialize
  loadState();
  preloadImages();
  renderState(true);
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

          // Migration from V5 to V6 (Debug Sidebar Toggle)
          if (state.version === 5) {
            state.debugSidebarEnabled = false;
            state.version = 6;
            saveState();
          }

          // Migration from V6 to V7 (Dynamic Tasks, Reward History, Volume)
          if (state.version === 6) {
            state.tasks = [
              { id: 'piano', name: 'Piano Practice', req: 7, emoji: '🎹', concept: 'Level up!' },
              { id: 'math', name: 'Math Practice', req: 7, emoji: '🧮', concept: 'Intellect +1' },
              { id: 'reading', name: 'Reading Time', req: 7, emoji: '📚', concept: 'Explore new zones!' },
              { id: 'writing', name: 'Writing', req: 5, emoji: '✏️', concept: 'Skill mastery' },
              { id: 'chinese', name: 'Chinese', req: 5, emoji: '💮', concept: 'Character master!' }
            ];
            state.rewardHistory = [];
            state.megaRewardHistory = [];
            state.volume = 50;
            state.version = 7;
            saveState();
          }
          
          // Migration from V7 to V8 (Claimed Rewards History)
          if (state.version === 7) {
            state.claimedRewardsHistory = [];
            state.version = 8;
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
      const historyStr = localStorage.getItem('kepler_pokemon_backups_history');
      let history = [];
      if (historyStr) {
        history = JSON.parse(historyStr) || [];
      }
      
      const backupEntry = {
        timestamp: new Date().toISOString(),
        state: JSON.parse(JSON.stringify(state))
      };
      
      history.unshift(backupEntry);
      if (history.length > 3) {
        history = history.slice(0, 3);
      }
      
      localStorage.setItem('kepler_pokemon_backups_history', JSON.stringify(history));
      localStorage.setItem('kepler_pokemon_training_backup', JSON.stringify(state));
      console.log('Auto-backup saved in history.');
    } catch (e) {
      console.error('Error saving auto-backup to localStorage:', e);
    }
  }

  function renderBackupHistory() {
    const listContainer = document.getElementById('backup-history-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    
    try {
      const historyStr = localStorage.getItem('kepler_pokemon_backups_history');
      if (!historyStr) {
        listContainer.innerHTML = '<p class="no-backups">No backups available yet.</p>';
        return;
      }
      
      const history = JSON.parse(historyStr) || [];
      if (history.length === 0) {
        listContainer.innerHTML = '<p class="no-backups">No backups available yet.</p>';
        return;
      }
      
      history.forEach((backup, index) => {
        const date = new Date(backup.timestamp);
        const formattedDate = date.toLocaleString();
        
        const family = backup.state.partnerFamily || '25';
        const stats = backup.state.partnersData[family] || { level: 1 };
        const stageInfo = getStageInfo(family, stats.stageId || family);
        const partnerName = stageInfo.currentStage.name;
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'backup-item';
        itemDiv.innerHTML = `
          <div class="backup-info">
            <span class="backup-date">${formattedDate}</span>
            <span class="backup-context">${partnerName} (LV ${stats.level}) • W${(backup.state.megaWeeks || 0) + 1}</span>
          </div>
          <button class="pixel-btn small warning restore-backup-btn" data-index="${index}">Restore</button>
        `;
        
        listContainer.appendChild(itemDiv);
      });
      
      listContainer.querySelectorAll('.restore-backup-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.target.dataset.index);
          restoreBackupFromHistory(idx);
        });
      });
      
    } catch (e) {
      console.error('Error rendering backup history:', e);
      listContainer.innerHTML = '<p class="no-backups">Error loading history.</p>';
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
    
    history.forEach(entry => {
      const date = new Date(entry.date);
      const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      const typeLabel = entry.type === 'mega' ? '🔮 MEGA' : '📛 WEEKLY';
      const typeClass = entry.type === 'mega' ? 'reward-history-name mega' : 'reward-history-name';
      
      const itemDiv = document.createElement('div');
      itemDiv.className = 'reward-history-item';
      itemDiv.innerHTML = `
        <div class="reward-history-info">
          <span class="reward-history-date">${formattedDate}</span>
          <span class="reward-history-details">${typeLabel} • Week ${entry.weekNumber} • ${entry.partner} (LV ${entry.level})</span>
          <span class="${typeClass}">"${entry.reward}"</span>
        </div>
      `;
      
      listContainer.appendChild(itemDiv);
    });
  }

  function restoreBackupFromHistory(index) {
    try {
      const historyStr = localStorage.getItem('kepler_pokemon_backups_history');
      if (!historyStr) return;
      const history = JSON.parse(historyStr) || [];
      const backup = history[index];
      
      if (backup) {
        showCustomConfirm(
          "Restore Backup? 📋",
          `Restore progress from ${new Date(backup.timestamp).toLocaleString()}? Current progress will be overwritten.`,
          () => {
            state = backup.state;
            saveState();
            renderState(true);
            alert("Restored successfully!");
            adminModal.classList.add('hidden');
          }
        );
      }
    } catch (e) {
      console.error('Error restoring backup:', e);
      alert('Failed to restore backup.');
    }
  }

  function runStateDiagnostics() {
    let issues = [];
    let fixed = [];
    
    if (!state.partnersData) {
      state.partnersData = {};
      issues.push("Missing partnersData container.");
      fixed.push("Initialized empty partnersData.");
    }
    
    const families = ['25', '4', '1', '7', '133'];
    families.forEach(fid => {
      if (!state.partnersData[fid]) {
        state.partnersData[fid] = { level: 1, xp: 0, stageId: fid };
        issues.push(`Missing partner data for family ${fid}.`);
        fixed.push(`Initialized default data for family ${fid}.`);
      } else {
        const pData = state.partnersData[fid];
        if (typeof pData.level !== 'number' || pData.level < 1) {
          issues.push(`Invalid level for family ${fid}: ${pData.level}`);
          pData.level = 1;
          fixed.push(`Reset level to 1 for family ${fid}.`);
        }
        if (typeof pData.xp !== 'number' || pData.xp < 0 || pData.xp >= 100) {
          issues.push(`Invalid XP for family ${fid}: ${pData.xp}`);
          pData.xp = Math.max(0, Math.min(99, pData.xp));
          fixed.push(`Clamped XP for family ${fid} between 0 and 99.`);
        }
        if (!pData.stageId) {
          const evo = EVOLUTIONS[fid];
          let index = 0;
          if (evo && fid !== '133') {
            for (let i = 1; i < evo.stages.length; i++) {
              if (pData.level >= evo.stages[i].level) {
                index = i;
              } else {
                break;
              }
            }
            pData.stageId = evo.stages[index].id;
          } else {
            pData.stageId = fid;
          }
          issues.push(`Missing stageId for family ${fid}.`);
          fixed.push(`Set stageId to ${pData.stageId} based on level.`);
        } else {
          const evo = EVOLUTIONS[fid];
          if (fid === '133') {
            const isValidEeveeStage = pData.stageId === '133' || evo.options.some(opt => opt.id === pData.stageId);
            if (!isValidEeveeStage) {
              issues.push(`Invalid stageId for Eevee family: ${pData.stageId}`);
              pData.stageId = '133';
              fixed.push(`Reset Eevee stageId to '133'.`);
            }
          } else if (evo) {
            const isValidStage = evo.stages.some(s => s.id === pData.stageId);
            if (!isValidStage) {
              issues.push(`Invalid stageId for family ${fid}: ${pData.stageId}`);
              pData.stageId = fid;
              fixed.push(`Reset stageId to ${fid} for family ${fid}.`);
            }
          }
        }
      }
    });
    
    if (!state.grid || typeof state.grid !== 'object') {
      state.grid = {};
      issues.push("Grid was missing or invalid.");
      fixed.push("Reset grid to empty.");
    }

    if (!state.tasks || !Array.isArray(state.tasks) || state.tasks.length === 0) {
      state.tasks = [
        { id: 'piano', name: 'Piano Practice', req: 7, emoji: '🎹', concept: 'Level up!' },
        { id: 'math', name: 'Math Practice', req: 7, emoji: '🧮', concept: 'Intellect +1' },
        { id: 'reading', name: 'Reading Time', req: 7, emoji: '📚', concept: 'Explore new zones!' },
        { id: 'writing', name: 'Writing', req: 5, emoji: '✏️', concept: 'Skill mastery' },
        { id: 'chinese', name: 'Chinese', req: 5, emoji: '💮', concept: 'Character master!' }
      ];
      issues.push("Tasks list was missing or invalid.");
      fixed.push("Reset to default tasks.");
    }
    
    if (!state.claimedRewardsHistory || !Array.isArray(state.claimedRewardsHistory)) {
      state.claimedRewardsHistory = [];
      issues.push("Claimed rewards history was missing or invalid.");
      fixed.push("Initialized empty claimed rewards history.");
    }
    
    if (state.version !== 8) {
      issues.push(`State version mismatch. Current: ${state.version}, Expected: 8`);
      state.version = 8;
      fixed.push("Forced state version to 8.");
    }
    
    if (fixed.length > 0) {
      saveState();
      renderState(true);
      
      const issueList = issues.map(i => `• ${i}`).join('\n');
      const fixList = fixed.map(f => `• ${f}`).join('\n');
      
      showCustomNotification(
        "🛠️ DIAGNOSTICS COMPLETE 🛠️",
        `Diagnostics found and fixed ${fixed.length} issues:\n\nISSUES:\n${issueList}\n\nFIXES:\n${fixList}`,
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/max-remedy.png',
        false,
        null
      );
    } else {
      showCustomNotification(
        "✅ DIAGNOSTICS HEALTHY ✅",
        "Diagnostics completed. State is 100% healthy! No issues found.",
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/max-remedy.png',
        false,
        null
      );
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

  function updateGridCheckboxes() {
    for (const key in domCache.checkboxes) {
      if (domCache.checkboxes[key]) {
        domCache.checkboxes[key].checked = !!state.grid[key];
      }
    }
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

    const day = cb.dataset.day;
    const task = cb.dataset.task;
    const key = `${day}-${task}`;
    const wasChecked = !!state.grid[key];
    const isChecked = cb.checked;
    const tasks = state.tasks || [];

    const wasDayFullyChecked = tasks.length > 0 && tasks.every(t => {
      if (t.id === task) return wasChecked;
      return !!state.grid[`${day}-${t.id}`];
    });

    state.grid[key] = isChecked;

    const isDayFullyChecked = tasks.length > 0 && tasks.every(t => !!state.grid[`${day}-${t.id}`]);

    let xpGained = 0;
    if (isChecked && !wasChecked) {
      xpGained += XP_PER_TASK;
      playSound('check');
    } else if (!isChecked && wasChecked) {
      xpGained -= XP_PER_TASK;
      playSound('uncheck');
    }

    if (isDayFullyChecked && !wasDayFullyChecked) {
      xpGained += XP_DAILY_BONUS;
      const totalCell = document.querySelector(`.day-total-cell[data-day="${day}"]`);
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
  }

  function renderRewardDropdowns() {
    const weeklyGroup = rewardSelect.querySelector('.recent-rewards-group');
    if (weeklyGroup) {
      weeklyGroup.innerHTML = '';
      const history = state.rewardHistory || [];
      if (history.length > 0) {
        weeklyGroup.classList.remove('hidden');
        history.forEach(r => {
          const opt = document.createElement('option');
          opt.value = r;
          opt.textContent = r;
          weeklyGroup.appendChild(opt);
        });
      } else {
        weeklyGroup.classList.add('hidden');
      }
    }
    
    const megaGroup = megaRewardSelect.querySelector('.recent-rewards-group');
    if (megaGroup) {
      megaGroup.innerHTML = '';
      const history = state.megaRewardHistory || [];
      if (history.length > 0) {
        megaGroup.classList.remove('hidden');
        history.forEach(r => {
          const opt = document.createElement('option');
          opt.value = r;
          opt.textContent = r;
          megaGroup.appendChild(opt);
        });
      } else {
        megaGroup.classList.add('hidden');
      }
    }
  }

  function addRewardToHistory(reward, type) {
    if (!reward) return;
    const historyKey = type === 'weekly' ? 'rewardHistory' : 'megaRewardHistory';
    if (!state[historyKey]) state[historyKey] = [];
    
    state[historyKey] = state[historyKey].filter(r => r !== reward);
    state[historyKey].unshift(reward);
    if (state[historyKey].length > 5) {
      state[historyKey] = state[historyKey].slice(0, 5);
    }
    saveState();
  }

  function renderAdminTasksList() {
    const container = document.getElementById('admin-tasks-list');
    if (!container) return;
    
    container.innerHTML = '';
    const tasks = state.tasks || [];
    
    tasks.forEach((task, index) => {
      const item = document.createElement('div');
      item.className = 'admin-task-item';
      item.dataset.index = index;
      
      const emojis = ['🎹', '🧮', '📚', '✏️', '💮', '🎨', '🏰', '👑', '🧱', '🚲', '⚡', '🍽️', '🎮', '👟', '🔬', '⭐', '📝', '🏃'];
      let emojiOptionsHtml = '';
      emojis.forEach(e => {
        emojiOptionsHtml += `<option value="${e}" ${task.emoji === e ? 'selected' : ''}>${e}</option>`;
      });
      if (!emojis.includes(task.emoji)) {
        emojiOptionsHtml += `<option value="${task.emoji}" selected>${task.emoji}</option>`;
      }
      
      item.innerHTML = `
        <select class="task-emoji-select" data-index="${index}">
          ${emojiOptionsHtml}
        </select>
        <input type="text" value="${task.name}" class="task-name-input" data-index="${index}" placeholder="Activity Name">
        <input type="number" min="1" max="7" value="${task.req}" class="task-req-input" data-index="${index}" placeholder="Days">
        <button class="pixel-btn small danger remove-task-btn" title="Delete Activity" data-index="${index}">
          <svg class="delete-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
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
        if ((parsed.level !== undefined || parsed.partnersData !== undefined) && parsed.grid !== undefined) {
          if (confirm("Are you sure you want to restore this backup? It will overwrite current progress!")) {
            state = { ...state, ...parsed };
            saveState();
            loadState(); // Run migrations if imported old version
            renderState(true); // Force grid rebuild
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
        <span class="partner-select-stats">LV ${stats.level}<br>${stats.xp}/100 XP</span>
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

  function renderState(rebuildGrid = false) {
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

  function setupEventListeners() {
    // Dropdowns
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

    // Partner Selection
    changePartnerBtn.addEventListener('click', () => {
      renderPartnerSelector();
      partnerModal.classList.remove('hidden');
    });

    closeModalBtn.addEventListener('click', () => {
      partnerModal.classList.add('hidden');
    });

    // Play Cry on Sprite Click
    pokemonSprite.addEventListener('click', () => {
      playActivePokemonCry();
    });

    // Reset current week only
    resetBtn.addEventListener('click', () => {
      const isMegaMilestoneCompleted = state.megaWeeks === 3 && state.weeklyClaimed;
      const confirmMessage = isMegaMilestoneCompleted
        ? "Ready to start the next week and continue progress towards a NEW Mega Milestone? Your Pokémon levels will NOT be lost!"
        : "Ready to start the next week and continue progress towards a Mega Milestone? Your Pokémon levels will NOT be lost!";
        
      showCustomConfirm(
        "Start New Week? 📅",
        confirmMessage,
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
        renderBackupHistory();
        renderAdminTasksList();
        renderClaimedRewardsHistory();
      } else if (password !== null) {
        alert('Wrong Code! Try again, Parent!');
      }
    });

    closeAdminModalBtn.addEventListener('click', () => {
      adminModal.classList.add('hidden');
    });

    // Admin Modal Actions
    if (adminDiagnosticsBtn) {
      adminDiagnosticsBtn.addEventListener('click', () => {
        runStateDiagnostics();
      });
    }

    adminExportBtn.addEventListener('click', () => {
      exportState();
    });

    adminImportBtn.addEventListener('click', () => {
      importState();
    });

    adminWipeBtn.addEventListener('click', () => {
      if (confirm('WARNING: This will completely reset Kepler back to Level 1 and wipe all saved progress. Proceed?')) {
        state = {
          version: 8,
          partnerFamily: '25',
          partnersData: {
            '25': { level: 1, xp: 0, stageId: '25' },
            '4': { level: 1, xp: 0, stageId: '4' },
            '1': { level: 1, xp: 0, stageId: '1' },
            '7': { level: 1, xp: 0, stageId: '7' },
            '133': { level: 1, xp: 0, stageId: '133' }
          },
          reward: '',
          megaReward: '',
          megaWeeks: 0,
          weeklyClaimed: false,
          debugSidebarEnabled: false,
          grid: {},
          tasks: [
            { id: 'piano', name: 'Piano Practice', req: 7, emoji: '🎹', concept: 'Level up!' },
            { id: 'math', name: 'Math Practice', req: 7, emoji: '🧮', concept: 'Intellect +1' },
            { id: 'reading', name: 'Reading Time', req: 7, emoji: '📚', concept: 'Explore new zones!' },
            { id: 'writing', name: 'Writing', req: 5, emoji: '✏️', concept: 'Skill mastery' },
            { id: 'chinese', name: 'Chinese', req: 5, emoji: '💮', concept: 'Character master!' }
          ],
          rewardHistory: [],
          megaRewardHistory: [],
          volume: 50,
          claimedRewardsHistory: []
        };
        saveState();
        renderState(true);
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

    // Toggle Debug Sidebar
    if (toggleDebugSidebar) {
      toggleDebugSidebar.addEventListener('change', (e) => {
        state.debugSidebarEnabled = e.target.checked;
        saveState();
        renderDebugSidebarVisibility();
      });
    }

    // Volume Control
    const volumeSlider = document.getElementById('volume-slider');
    const soundIcon = document.querySelector('.sound-icon');
    if (volumeSlider) {
      volumeSlider.value = state.volume !== undefined ? state.volume : 50;
      volumeSlider.addEventListener('input', (e) => {
        state.volume = parseInt(e.target.value);
        saveState();
        updateVolumeIcon();
      });
    }
    if (soundIcon) {
      soundIcon.addEventListener('click', () => {
        if (state.volume > 0) {
          state.oldVolume = state.volume;
          state.volume = 0;
        } else {
          state.volume = state.oldVolume || 50;
        }
        if (volumeSlider) volumeSlider.value = state.volume;
        saveState();
        updateVolumeIcon();
        playSound('check');
      });
    }

    // Dynamic Tasks Editor Buttons
    const adminAddTaskBtn = document.getElementById('admin-add-task-btn');
    const adminSaveTasksBtn = document.getElementById('admin-save-tasks-btn');
    if (adminAddTaskBtn) {
      adminAddTaskBtn.addEventListener('click', addNewTask);
    }
    if (adminSaveTasksBtn) {
      adminSaveTasksBtn.addEventListener('click', saveAdminTasks);
    }
  }

  function flashElement(element) {
    if (!element) return;
    element.classList.remove('flash-attention');
    // Force reflow
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
        state.megaReward = ''; // Clear mega reward on loop reset
        flashMega = true;
      }
      state.weeklyClaimed = false;
      state.reward = ''; // Clear weekly reward for new week
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

  // Testing Panel Helper Functions
  function setMilestoneMinusOne() {
    if (!state.reward) state.reward = "Test Reward";
    if (!state.megaReward) state.megaReward = "Test Mega Reward";

    state.grid = {};
    
    // Fill all tasks to max, except the last one which gets max - 1
    const tasks = state.tasks || [];
    tasks.forEach((task, idx) => {
      const isLast = idx === tasks.length - 1;
      const fillCount = isLast ? task.req - 1 : task.req;
      
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
    
    if (!evo) return;
    
    let targetLevel = 4;
    
    if (family === '133') {
      targetLevel = 4;
      stats.stageId = '133'; // Reset choice for testing
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
        const numStages = evo.stages.length;
        if (numStages > 1) {
          targetLevel = evo.stages[numStages - 1].level - 1;
        } else {
          targetLevel = 4;
        }
      }
      
      // Reset stageId to match the targetLevel for testing
      let stageIdx = 0;
      for (let i = 1; i < evo.stages.length; i++) {
        if (targetLevel >= evo.stages[i].level) {
          stageIdx = i;
        } else {
          break;
        }
      }
      stats.stageId = evo.stages[stageIdx].id;
    }
    
    stats.level = targetLevel;
    stats.xp = XP_LEVEL_THRESHOLD - XP_PER_TASK; // 95 XP
    
    saveState();
    renderState(false);
  }

  function setNearLevelUp() {
    const family = state.partnerFamily;
    const stats = state.partnersData[family];
    stats.xp = XP_LEVEL_THRESHOLD - XP_PER_TASK; // 95 XP
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
    const tasks = state.tasks || [];
    
    // 1. Calculate Task Totals (Across the Week)
    const taskTotals = {};
    tasks.forEach(t => { taskTotals[t.id] = 0; });
    
    tasks.forEach(task => {
      DAYS.forEach(day => {
        if (state.grid[`${day}-${task.id}`]) {
          taskTotals[task.id]++;
        }
      });

      // Update grid cells in the "GOAL" column from cache
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

    // 2. Calculate Daily Totals (For ⭐ Daily Total row visual decoration) from cache
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
      
      // Record Claimed Reward(s)
      const family = state.partnerFamily;
      const stats = state.partnersData[family];
      const activePokemon = getStageInfo(family, stats.stageId).currentStage;
      
      if (!state.claimedRewardsHistory) state.claimedRewardsHistory = [];
      
      // Always record weekly reward
      state.claimedRewardsHistory.unshift({
        date: new Date().toISOString(),
        reward: state.reward || 'A cool reward',
        type: 'weekly',
        weekNumber: state.megaWeeks + 1,
        partner: activePokemon.name,
        level: stats.level
      });
      
      // Record mega reward if Week 4 completed
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
    const tasks = state.tasks || [];
    if (tasks.length === 0) return false;
    
    const taskTotals = {};
    tasks.forEach(t => { taskTotals[t.id] = 0; });
    
    tasks.forEach(task => {
      DAYS.forEach(day => {
        if (state.grid[`${day}-${task.id}`]) {
          taskTotals[task.id]++;
        }
      });
    });

    return tasks.every(task => taskTotals[task.id] >= task.req);
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
    renderState(false);
    
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

  // Register Service Worker for PWA offline support
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js')
        .then(reg => console.log('Service Worker registered successfully.', reg.scope))
        .catch(err => console.log('Service Worker registration failed:', err));
    });
  }

  // Test Mode setup
  if (location.search.includes('runTests=true')) {
    window.__app_state__ = state;
    window.__test_helpers__ = {
      resetState: () => {
        state.partnerFamily = '25';
        state.partnersData = {
          '25': { level: 1, xp: 0, stageId: '25' },
          '4': { level: 1, xp: 0, stageId: '4' },
          '1': { level: 1, xp: 0, stageId: '1' },
          '7': { level: 1, xp: 0, stageId: '7' },
          '133': { level: 1, xp: 0, stageId: '133' }
        };
        state.reward = '';
        state.megaReward = '';
        state.megaWeeks = 0;
        state.weeklyClaimed = false;
        state.grid = {};
        state.claimedRewardsHistory = [];
        gridRebuildCount = 0; // Reset rebuild counter for clean test run
        saveState();
        renderState(true); // Force rebuild
      },
      renderState: (rebuildGrid) => renderState(rebuildGrid)
    };
    
    // Load test script dynamically
    const script = document.createElement('script');
    script.src = 'tests.js';
    document.body.appendChild(script);
  }
});
