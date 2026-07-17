import { TIER_1_IDS, TIER_2_IDS, getPokemonName } from './pokemon_data.js';

export const ADMIN_PASSWORD = "zxcv";
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

export function formatLocalDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getSunday(d) {
  const copy = new Date(d.getTime());
  const day = copy.getDay();
  const diff = copy.getDate() - day;
  const sunday = new Date(copy.setDate(diff));
  sunday.setHours(0,0,0,0);
  return sunday;
}

// State V10 (Badge Collection)
export let state = {
  version: 11,
  partnerFamily: '25', // Default Pikachu Family
  excused: {}, // key format: "day-task" -> boolean
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
  claimedRewardsHistory: [],
  activeDay: new Date().getDay(),
  weekStartDate: formatLocalDate(getSunday(new Date())),
  starVault: {
    earnedDates: [],
    totalTraded: 0
  },
  collectedBadges: [],
  badgePool: TIER_1_IDS.filter(id => id !== 25),
  activeWeeklyBadgeId: 25
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

const MIGRATIONS = [
  {
    version: 3,
    migrate: (s) => {
      s.partnerFamily = s.partnerId || '25';
      s.partnersData = {
        '25': { level: 1, xp: 0 },
        '4': { level: 1, xp: 0 },
        '1': { level: 1, xp: 0 },
        '7': { level: 1, xp: 0 },
        '133': { level: 1, xp: 0 }
      };
      if (s.partnersData[s.partnerFamily]) {
        s.partnersData[s.partnerFamily].level = s.level || 1;
        s.partnersData[s.partnerFamily].xp = s.xp || 0;
      }
      delete s.level;
      delete s.xp;
      delete s.partnerId;
      delete s.partnerName;
      return s;
    }
  },
  {
    version: 4,
    migrate: (s) => {
      if (s.partnersData && s.partnersData['133']) {
        s.partnersData['133'].evolvedId = null;
      }
      return s;
    }
  },
  {
    version: 5,
    migrate: (s) => {
      const families = ['25', '4', '1', '7', '133'];
      families.forEach(fid => {
        if (s.partnersData && s.partnersData[fid]) {
          if (fid === '133') {
            s.partnersData[fid].stageId = s.partnersData[fid].evolvedId || '133';
            delete s.partnersData[fid].evolvedId;
          } else {
            const lvl = s.partnersData[fid].level || 1;
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
            s.partnersData[fid].stageId = evo ? evo.stages[index].id : fid;
          }
        }
      });
      return s;
    }
  },
  {
    version: 6,
    migrate: (s) => {
      s.debugSidebarEnabled = false;
      return s;
    }
  },
  {
    version: 7,
    migrate: (s) => {
      s.tasks = [
        { id: 'piano', name: 'Piano Practice', req: 7, emoji: '🎹', concept: 'Level up!' },
        { id: 'math', name: 'Math Practice', req: 7, emoji: '🧮', concept: 'Intellect +1' },
        { id: 'reading', name: 'Reading Time', req: 7, emoji: '📚', concept: 'Explore new zones!' },
        { id: 'writing', name: 'Writing', req: 5, emoji: '✏️', concept: 'Skill mastery' },
        { id: 'chinese', name: 'Chinese', req: 5, emoji: '💮', concept: 'Character master!' }
      ];
      s.rewardHistory = [];
      s.megaRewardHistory = [];
      s.volume = 50;
      return s;
    }
  },
  {
    version: 8,
    migrate: (s) => {
      s.claimedRewardsHistory = [];
      return s;
    }
  },
  {
    version: 9,
    migrate: (s) => {
      s.weekStartDate = formatLocalDate(getSunday(new Date()));
      s.starVault = {
        earnedDates: [],
        totalTraded: 0
      };
      return s;
    }
  },
  {
    version: 10,
    migrate: (s) => {
      console.log("MIGRATING V9 to V10: megaWeeks =", s.megaWeeks);
      s.collectedBadges = [];
      s.badgePool = [...TIER_1_IDS];
      
      const historicalMegaPokemon = [
        { id: 658, name: "Greninja", weekNum: 1 },
        { id: 382, name: "Kyogre", weekNum: 2 },
        { id: 249, name: "Lugia", weekNum: 3 },
        { id: 384, name: "Rayquaza", weekNum: 4 }
      ];
      
      const history = s.claimedRewardsHistory || [];
      const wasWeekCompleted = (weekNum) => {
        if (s.megaWeeks >= weekNum) return true;
        return history.some(h => h.type === 'weekly' && h.weekNumber === weekNum);
      };
      
      historicalMegaPokemon.forEach(pkmn => {
        if (wasWeekCompleted(pkmn.weekNum)) {
          const alreadyEarned = s.collectedBadges.some(b => b.id === pkmn.id);
          if (!alreadyEarned) {
            s.collectedBadges.push({
              id: pkmn.id,
              name: pkmn.name,
              dateEarned: new Date().toISOString()
            });
          }
          s.badgePool = s.badgePool.filter(id => id !== pkmn.id);
        }
      });
      
      const randomIndex = Math.floor(Math.random() * s.badgePool.length);
      s.activeWeeklyBadgeId = s.badgePool.splice(randomIndex, 1)[0];
      return s;
    }
  },
  {
    version: 11,
    migrate: (s) => {
      s.excused = s.excused || {};
      return s;
    }
  }
];

export function loadState() {
  try {
    const savedState = localStorage.getItem(STATE_KEY);
    if (savedState) {
      const parsed = JSON.parse(savedState);
      if (parsed && typeof parsed === 'object') {
        let currentVersion = parsed.version;
        if (currentVersion === undefined) {
          currentVersion = parsed.partnerFamily ? 3 : 2;
        }

        let migratedState = { ...parsed };
        
        MIGRATIONS.forEach(m => {
          if (currentVersion < m.version) {
            console.log(`Migrating state from v${currentVersion} to v${m.version}...`);
            migratedState = m.migrate(migratedState);
            migratedState.version = m.version;
            currentVersion = m.version;
          }
        });

        // Merge migrated state into template default to guarantee key structure
        state = { ...state, ...migratedState };

        if (state.activeDay === undefined) {
          state.activeDay = new Date().getDay();
        }
        
        const versionChanged = (migratedState.version !== parsed.version);
        
        // Auto-diagnostics and self-healing on load
        const { fixed } = runStateDiagnostics();
        if (fixed.length > 0 || versionChanged) {
          saveState();
          console.log(`Auto-saved migrated/healed state. Fixed issues: ${fixed.length}`);
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
    version: 11,
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
    excused: {},
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
    claimedRewardsHistory: [],
    activeDay: new Date().getDay(),
    weekStartDate: getSunday(new Date()).toISOString().split('T')[0],
    starVault: {
      earnedDates: [],
      totalTraded: 0
    },
    collectedBadges: [],
    badgePool: [...TIER_1_IDS],
    activeWeeklyBadgeId: null
  };
  // Roll initial badge
  const randomIndex = Math.floor(Math.random() * state.badgePool.length);
  state.activeWeeklyBadgeId = state.badgePool.splice(randomIndex, 1)[0];
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
    if (history.length > 2) {
      history = history.slice(0, 2);
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

function getColumnDateStr(weekStartDateStr, dayIndex) {
  const baseDate = new Date(weekStartDateStr + 'T00:00:00');
  baseDate.setDate(baseDate.getDate() + dayIndex);
  return formatLocalDate(baseDate);
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

  if (!state.excused || typeof state.excused !== 'object') {
    state.excused = {};
    issues.push("Excused exceptions was missing or invalid.");
    fixed.push("Reset excused to empty.");
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

  if (!state.weekStartDate) {
    state.weekStartDate = formatLocalDate(getSunday(new Date()));
    issues.push("Missing weekStartDate.");
    fixed.push(`Initialized weekStartDate to ${state.weekStartDate}.`);
  }

  if (!state.starVault || typeof state.starVault !== 'object') {
    state.starVault = { earnedDates: [], totalTraded: 0 };
    issues.push("Missing or invalid starVault structure.");
    fixed.push("Initialized default starVault.");
  } else {
    if (!Array.isArray(state.starVault.earnedDates)) {
      state.starVault.earnedDates = [];
      issues.push("Invalid starVault.earnedDates (not an array).");
      fixed.push("Reset starVault.earnedDates to empty array.");
    } else {
      // Deduplicate and filter invalid formats
      const seen = new Set();
      const validDates = [];
      let hadDuplicatesOrInvalid = false;
      
      state.starVault.earnedDates.forEach(dStr => {
        if (typeof dStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dStr)) {
          hadDuplicatesOrInvalid = true;
          issues.push(`Invalid date format in starVault.earnedDates: ${dStr}`);
        } else if (seen.has(dStr)) {
          hadDuplicatesOrInvalid = true;
          issues.push(`Duplicate date in starVault.earnedDates: ${dStr}`);
        } else {
          seen.add(dStr);
          validDates.push(dStr);
        }
      });
      
      if (hadDuplicatesOrInvalid) {
        state.starVault.earnedDates = validDates;
        fixed.push("Cleaned up duplicates and invalid dates in starVault.earnedDates.");
      }
    }
    
    if (typeof state.starVault.totalTraded !== 'number') {
      state.starVault.totalTraded = 0;
      issues.push("Invalid starVault.totalTraded (not a number).");
      fixed.push("Reset starVault.totalTraded to 0.");
    } else if (state.starVault.totalTraded < 0) {
      state.starVault.totalTraded = 0;
      issues.push("Negative starVault.totalTraded.");
      fixed.push("Reset starVault.totalTraded to 0.");
    } else if (state.starVault.totalTraded > state.starVault.earnedDates.length) {
      issues.push(`totalTraded (${state.starVault.totalTraded}) exceeds total earned stars (${state.starVault.earnedDates.length}).`);
      state.starVault.totalTraded = state.starVault.earnedDates.length;
      fixed.push(`Clamped totalTraded to match earned stars count.`);
    }
  }

  // Sync current week's completed days from grid to starVault.earnedDates
  if (state.weekStartDate && state.grid && state.tasks && state.tasks.length > 0) {
    let syncedAny = false;
    const currentWeekDates = DAYS.map(day => getColumnDateStr(state.weekStartDate, day));
    
    DAYS.forEach(day => {
      const allChecked = state.tasks.every(task => !!state.grid[`${day}-${task.id}`] || !!state.excused[`${day}-${task.id}`]);
      const dateStr = currentWeekDates[day];
      const index = state.starVault.earnedDates.indexOf(dateStr);
      
      if (allChecked && index === -1) {
        state.starVault.earnedDates.push(dateStr);
        issues.push(`Completed day ${day} (${dateStr}) was missing from starVault.earnedDates.`);
        fixed.push(`Added ${dateStr} to starVault.earnedDates.`);
        syncedAny = true;
      } else if (!allChecked && index !== -1) {
        state.starVault.earnedDates.splice(index, 1);
        issues.push(`Uncompleted day ${day} (${dateStr}) was present in starVault.earnedDates.`);
        fixed.push(`Removed ${dateStr} from starVault.earnedDates.`);
        syncedAny = true;
      }
    });
    
    if (syncedAny) {
      state.starVault.earnedDates.sort();
    }
  }

  // V10 Badge Validation
  if (!state.collectedBadges || !Array.isArray(state.collectedBadges)) {
    state.collectedBadges = [];
    issues.push("Missing or invalid collectedBadges.");
    fixed.push("Initialized empty collectedBadges.");
  }
  if (!state.badgePool || !Array.isArray(state.badgePool)) {
    state.badgePool = [...TIER_1_IDS];
    issues.push("Missing or invalid badgePool.");
    fixed.push("Reset badgePool to Tier 1 IDs.");
  }
  if (state.activeWeeklyBadgeId === undefined || state.activeWeeklyBadgeId === null) {
    state.activeWeeklyBadgeId = 25; // Default Pikachu
    issues.push("Missing activeWeeklyBadgeId.");
    fixed.push("Set activeWeeklyBadgeId to default 25.");
  }

  if (state.version !== 11) {
    issues.push(`State version mismatch. Current: ${state.version}, Expected: 11`);
    state.version = 11;
    fixed.push("Forced state version to 11.");
  }

  if (fixed.length > 0) {
    saveState();
  }

  return { issues, fixed };
}

// Badge Roller and Pool Expansion Logic
export function rollNewWeeklyBadge() {
  if (!state.badgePool || state.badgePool.length < 5) {
    expandBadgePool();
  }
  if (state.badgePool.length === 0) {
    // Fallback if somehow still empty
    state.activeWeeklyBadgeId = 25; // Default back to Pikachu
    saveState();
    return;
  }
  const randomIndex = Math.floor(Math.random() * state.badgePool.length);
  state.activeWeeklyBadgeId = state.badgePool.splice(randomIndex, 1)[0];
  saveState();
}

function expandBadgePool() {
  const collectedIds = new Set((state.collectedBadges || []).map(b => b.id));
  
  // Try Tier 2 first
  const tier2Available = TIER_2_IDS.filter(id => !collectedIds.has(id));
  
  if (tier2Available.length > 0) {
    state.badgePool = [...(state.badgePool || []), ...tier2Available];
    console.log(`Expanded badge pool with ${tier2Available.length} Tier 2 Pokémon.`);
  } else {
    // Fallback to random Gen 1-8 (1 to 898)
    const newBatch = [];
    while (newBatch.length < 50) {
      const randomId = Math.floor(Math.random() * 898) + 1;
      if (!collectedIds.has(randomId) && !newBatch.includes(randomId)) {
        newBatch.push(randomId);
      }
      // Infinite loop guard (if they collected almost all 898)
      if (collectedIds.size + newBatch.length >= 898) {
        break;
      }
    }
    state.badgePool = [...(state.badgePool || []), ...newBatch];
    console.log(`Expanded badge pool with ${newBatch.length} random Pokémon.`);
  }
  saveState();
}

