export const ADMIN_PASSWORD = "0130";
export const DAYS = [0, 1, 2, 3, 4, 5, 6];
export const XP_LEVEL_THRESHOLD = 100;
export const XP_DAILY_BONUS = 15;
export const XP_PER_TASK = 5;

// Mega Milestone Pokemon
export const MEGA_POKEMON = [
  { id: 658, name: 'Greninja' },
  { id: 382, name: 'Kyogre' },
  { id: 249, name: 'Lugia' },
  { id: 384, name: 'Rayquaza' }
];

// Evolution configurations
export const EVOLUTIONS = {
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

export function getStageInfo(familyId, stageId) {
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

// State V8 (Dynamic Tasks, Reward History, Volume, Claimed Rewards History)
export let state = {
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

// Storage Keys
const STATE_KEY = 'kepler_pokemon_training_v2';
const BACKUPS_KEY = 'kepler_pokemon_backups_history';

export function saveState() {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving state to localStorage:', e);
  }
}

export function loadState() {
  try {
    const savedState = localStorage.getItem(STATE_KEY);
    if (savedState) {
      const parsed = JSON.parse(savedState);
      if (parsed && typeof parsed === 'object') {
        // Merge parsed state into default template to ensure keys exist
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

export function updateState(newState) {
  state = { ...state, ...newState };
  saveState();
}

export function resetStateToDefault() {
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
}

export function saveAutoBackup() {
  try {
    const historyStr = localStorage.getItem(BACKUPS_KEY);
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
    
    localStorage.setItem(BACKUPS_KEY, JSON.stringify(history));
    localStorage.setItem('kepler_pokemon_training_backup', JSON.stringify(state));
    console.log('Auto-backup saved in history.');
  } catch (e) {
    console.error('Error saving auto-backup to localStorage:', e);
  }
}

export function getBackupHistory() {
  try {
    const historyStr = localStorage.getItem(BACKUPS_KEY);
    return historyStr ? JSON.parse(historyStr) || [] : [];
  } catch (e) {
    console.error("Error reading backups:", e);
    return [];
  }
}

export function applyBackup(index) {
  const history = getBackupHistory();
  const backup = history[index];
  if (backup) {
    state = backup.state;
    saveState();
    return true;
  }
  return false;
}

export function runStateDiagnostics() {
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
  }

  return { issues, fixed };
}
