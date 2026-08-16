import { TIER_1_IDS, TIER_2_IDS, getPokemonName, MEGA_POKEMON, STARTER_OPTIONS, STARTER_FAMILIES, EVOLUTIONS, POKEMON_MAP, EVOLVED_POKEMON_IDS } from './pokemon_data.js';
import { formatLocalDate, getWeekStart, getSunday, getDateOfColumn, getLocalDate } from './date_utils.js';
import { runMigrations, DEFAULT_WEEKLY_REWARDS, DEFAULT_MEGA_REWARDS } from './migrations.js';

export const ADMIN_PASSWORD = "zxcv";
export const DAYS = [0, 1, 2, 3, 4, 5, 6];
export const XP_LEVEL_THRESHOLD = 100;
export const XP_DAILY_BONUS = 15;
export const XP_PER_TASK = 5;


export function getStageInfo(familyId, stageId) {
  const evo = EVOLUTIONS[familyId];
  if (!evo) {
    const name = getPokemonName(familyId);
    return { currentStage: { id: String(familyId), name: name }, nextStage: null, startLevel: 1, endLevel: null };
  }
  
  // Branching evolution families (Eevee, Mewtwo, Kyurem, Calyrex, etc.)
  if (evo.options) {
    if (String(stageId) !== String(familyId)) {
      const chosen = evo.options.find(opt => String(opt.id) === String(stageId));
      if (chosen) {
        return {
          currentStage: { level: chosen.level || 5, id: String(chosen.id), name: chosen.name },
          nextStage: null,
          startLevel: chosen.level || 5,
          endLevel: null
        };
      }
    }
    const name = getPokemonName(familyId);
    const branchLevel = (evo.options[0] && evo.options[0].level) || 5;
    return {
      currentStage: { level: 1, id: String(familyId), name: name },
      nextStage: { level: branchLevel, id: 'choice', name: 'Evolution Choice' },
      startLevel: 1,
      endLevel: branchLevel
    };
  }
  
  let currentStageIndex = 0;
  if (evo.stages) {
    const idx = evo.stages.findIndex(s => String(s.id) === String(stageId));
    if (idx !== -1) {
      currentStageIndex = idx;
    }
  }
  
  const currentStage = evo.stages[currentStageIndex];
  const nextStage = evo.stages[currentStageIndex + 1] || null;
  const startLevel = currentStage.level;
  const endLevel = nextStage ? nextStage.level : null;
  
  return {
    currentStage,
    nextStage,
    startLevel,
    endLevel
  };
}


// State V16 (Star Vault & Partner Unlock Shop)
export let state = {
  version: 18,
  activePartnerInstanceId: '172',
  partnerFamily: '172', // Default Pichu Family
  weekStartDay: 0, // Default Sunday (0) to Saturday (6)
  idleTimeout: 10, // Default 10 minutes
  adminPassword: 'zxcv', // Default parent admin passcode
  timezoneOffset: 'default',
  weeklyRewardOptions: [...DEFAULT_WEEKLY_REWARDS],
  megaRewardOptions: [...DEFAULT_MEGA_REWARDS],
  excused: {}, // key format: "YYYY-MM-DD-task" -> boolean
  weeklyHistory: {}, // key format: "YYYY-MM-DD" -> { weekStartDay, reward, megaReward, weeklyClaimed, badgeId, xpEarned, megaWeeks }
  partnersData: {
    '172': { familyId: '172', level: 1, xp: 0, stageId: '172' },
    '4': { familyId: '4', level: 1, xp: 0, stageId: '4' },
    '1': { familyId: '1', level: 1, xp: 0, stageId: '1' },
    '7': { familyId: '7', level: 1, xp: 0, stageId: '7' },
    '133': { familyId: '133', level: 1, xp: 0, stageId: '133' }
  },
  reward: '',
  megaReward: '',
  megaWeeks: 0,
  weeklyClaimed: false,
  debugSidebarEnabled: false,
  grid: {}, // key format: "YYYY-MM-DD-task" -> boolean
  tasks: [
    { id: 'piano', name: 'Piano Practice', emoji: '🎹', concept: 'Level up!', instructions: 'Play all pieces 3x and work on hard parts.', active: true, createdAt: '2026-07-01', deletedAt: null },
    { id: 'math', name: 'Math Practice', emoji: '🧮', concept: 'Intellect +1', instructions: "Complete today's worksheet or 15 mins on math app.", active: true, createdAt: '2026-07-01', deletedAt: null },
    { id: 'reading', name: 'Reading Time', emoji: '📚', concept: 'Explore new zones!', instructions: '15min reading out loud w/30s summary.', active: true, createdAt: '2026-07-01', deletedAt: null },
    { id: 'writing', name: 'Writing', emoji: '✏️', concept: 'Skill mastery', instructions: 'Write at least 3 clean sentences w/punctuation.', active: true, createdAt: '2026-07-01', deletedAt: null },
    { id: 'chinese', name: 'Chinese', emoji: '💮', concept: 'Character master!', instructions: 'Practice reading current vocabulary card set 2x.', active: true, createdAt: '2026-07-01', deletedAt: null }
  ],
  rewardHistory: [],
  megaRewardHistory: [],
  volume: 50,
  claimedRewardsHistory: [],
  activeDay: getLocalDate('default').getDay(),
  weekStartDate: formatLocalDate(getWeekStart(getLocalDate('default'), 0)),
  starVault: {
    earnedDates: [],
    totalTraded: 0
  },
  collectedBadges: [],
  badgePool: TIER_1_IDS.filter(id => id !== 172),
  activeWeeklyBadgeId: 172
};

// Storage Keys
const STATE_KEY = 'kepler_pokemon_training_v2';
const BACKUPS_KEY = 'kepler_pokemon_backups_history';

let saveListener = null;

export function registerOnSave(callback) {
  saveListener = callback;
}

export function saveState() {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
    if (saveListener) {
      saveListener(state);
    }
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
        const migratedState = runMigrations(parsed);

        // Merge migrated state into template default to guarantee key structure
        Object.assign(state, migratedState);

        if (state.activeDay === undefined) {
          state.activeDay = getLocalDate(state.timezoneOffset).getDay();
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

export function getDefaultStateTemplate() {
  const t = {
    version: 16,
    activePartnerInstanceId: '25',
    partnerFamily: '25',
    weekStartDay: 0,
    idleTimeout: 10,
    adminPassword: 'zxcv',
    timezoneOffset: 'default',
    weeklyRewardOptions: [...DEFAULT_WEEKLY_REWARDS],
    megaRewardOptions: [...DEFAULT_MEGA_REWARDS],
    partnersData: {
      '25': { familyId: '25', level: 1, xp: 0, stageId: '25' },
      '4': { familyId: '4', level: 1, xp: 0, stageId: '4' },
      '1': { familyId: '1', level: 1, xp: 0, stageId: '1' },
      '7': { familyId: '7', level: 1, xp: 0, stageId: '7' },
      '133': { familyId: '133', level: 1, xp: 0, stageId: '133' }
    },
    reward: '',
    megaReward: '',
    megaWeeks: 0,
    weeklyClaimed: false,
    debugSidebarEnabled: false,
    grid: {},
    excused: {},
    weeklyHistory: {},
    tasks: [
      { id: 'piano', name: 'Piano Practice', emoji: '🎹', concept: 'Level up!', instructions: 'Play all pieces 3x and work on hard parts.', active: true, createdAt: '2026-07-01', deletedAt: null },
      { id: 'math', name: 'Math Practice', emoji: '🧮', concept: 'Intellect +1', instructions: "Complete today's worksheet or 15 mins on math app.", active: true, createdAt: '2026-07-01', deletedAt: null },
      { id: 'reading', name: 'Reading Time', emoji: '📚', concept: 'Explore new zones!', instructions: '15min reading out loud w/30s summary.', active: true, createdAt: '2026-07-01', deletedAt: null },
      { id: 'writing', name: 'Writing', emoji: '✏️', concept: 'Skill mastery', instructions: 'Write at least 3 clean sentences w/punctuation.', active: true, createdAt: '2026-07-01', deletedAt: null },
      { id: 'chinese', name: 'Chinese', emoji: '💮', concept: 'Character master!', instructions: 'Practice reading current vocabulary card set 2x.', active: true, createdAt: '2026-07-01', deletedAt: null }
    ],
    rewardHistory: [],
    megaRewardHistory: [],
    volume: 50,
    claimedRewardsHistory: [],
    activeDay: getLocalDate('default').getDay(),
    weekStartDate: formatLocalDate(getWeekStart(getLocalDate('default'), 0)),
    starVault: {
      earnedDates: [],
      totalTraded: 0
    },
    collectedBadges: [],
    badgePool: [...TIER_1_IDS],
    activeWeeklyBadgeId: null
  };
  
  const randomIndex = Math.floor(Math.random() * TIER_1_IDS.length);
  const pool = [...TIER_1_IDS];
  t.activeWeeklyBadgeId = pool.splice(randomIndex, 1)[0];
  t.badgePool = pool;
  return t;
}

export function replaceState(newState) {
  let migrated = runMigrations(newState);

  // Mutate in-place to preserve object references in other files
  for (const key in state) {
    delete state[key];
  }
  Object.assign(state, migrated);
  
  runStateDiagnostics();
}

export function updateState(newState) {
  Object.assign(state, newState);
  saveState();
}

export function resetStateToDefault() {
  const defaults = getDefaultStateTemplate();
  replaceState(defaults);
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
    replaceState(backup.state);
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
  
  // Validate activePartnerInstanceId
  if (!state.activePartnerInstanceId) {
    state.activePartnerInstanceId = state.partnerFamily || '172';
    issues.push("Missing activePartnerInstanceId.");
    fixed.push(`Initialized activePartnerInstanceId to '${state.activePartnerInstanceId}'.`);
  }

  const families = ['172', '4', '1', '7', '133'];
  
  if (state.partnersData) {
    Object.keys(state.partnersData).forEach(instanceId => {
      const pData = state.partnersData[instanceId];
      if (!pData) {
        delete state.partnersData[instanceId];
        issues.push(`Null partner data for instance ${instanceId}.`);
        fixed.push(`Removed null partner instance ${instanceId}.`);
        return;
      }

      if (!pData.familyId) {
        if (families.includes(instanceId)) {
          pData.familyId = instanceId;
        } else {
          const baseId = instanceId.split('_')[0];
          if (POKEMON_MAP[baseId] && !EVOLVED_POKEMON_IDS.has(Number(baseId))) {
            pData.familyId = baseId;
          } else {
            pData.familyId = '172';
          }
        }
        issues.push(`Missing familyId for instance ${instanceId}.`);
        fixed.push(`Set familyId to '${pData.familyId}' for instance ${instanceId}.`);
      }

      const fid = pData.familyId;
      const isValid = POKEMON_MAP[fid] && !EVOLVED_POKEMON_IDS.has(Number(fid));
      if (!isValid) {
        issues.push(`Invalid familyId '${fid}' for instance ${instanceId}.`);
        pData.familyId = '172';
        fixed.push(`Reset familyId to '172' for instance ${instanceId}.`);
      }

      if (typeof pData.level !== 'number' || pData.level < 1) {
        issues.push(`Invalid level for instance ${instanceId}: ${pData.level}`);
        pData.level = 1;
        fixed.push(`Reset level to 1 for instance ${instanceId}.`);
      }
      if (typeof pData.xp !== 'number' || pData.xp < 0 || pData.xp >= 100) {
        issues.push(`Invalid XP for instance ${instanceId}: ${pData.xp}`);
        pData.xp = Math.max(0, Math.min(99, pData.xp));
        fixed.push(`Clamped XP for instance ${instanceId} between 0 and 99.`);
      }
      
      if (!pData.stageId) {
        const evo = EVOLUTIONS[fid];
        let index = 0;
        if (evo && evo.stages) {
          for (let i = 1; i < evo.stages.length; i++) {
            if (pData.level >= evo.stages[i].level) {
              index = i;
            } else {
              break;
            }
          }
          pData.stageId = String(evo.stages[index].id);
        } else {
          pData.stageId = fid;
        }
        issues.push(`Missing stageId for instance ${instanceId}.`);
        fixed.push(`Set stageId to ${pData.stageId} based on level.`);
      } else {
        const evo = EVOLUTIONS[fid];
        if (evo && evo.options) {
          const threshold = evo.options[0]?.level || 5;
          if (pData.level < threshold) {
            if (evo.stages) {
              let expectedIndex = 0;
              for (let i = 1; i < evo.stages.length; i++) {
                if (pData.level >= evo.stages[i].level) {
                  expectedIndex = i;
                } else {
                  break;
                }
              }
              const expectedStageId = String(evo.stages[expectedIndex].id);
              if (String(pData.stageId) !== expectedStageId) {
                issues.push(`Stage ${pData.stageId} invalid for level ${pData.level} (expected ${expectedStageId}) in mixed family ${fid}.`);
                pData.stageId = expectedStageId;
                fixed.push(`Corrected stageId to '${expectedStageId}' for instance ${instanceId}.`);
              }
            } else {
              if (String(pData.stageId) !== String(fid)) {
                issues.push(`Stage ${pData.stageId} invalid for level ${pData.level} in branching family ${fid}.`);
                pData.stageId = fid;
                fixed.push(`Devolved stageId to '${fid}' for instance ${instanceId}.`);
              }
            }
          } else {
            const preBranchStageId = evo.stages ? String(evo.stages[evo.stages.length - 1].id) : String(fid);
            const isValidBranchStage = String(pData.stageId) === preBranchStageId || evo.options.some(opt => String(opt.id) === String(pData.stageId));
            if (!isValidBranchStage) {
              issues.push(`Invalid stageId for branching instance ${instanceId}: ${pData.stageId}`);
              pData.stageId = preBranchStageId;
              fixed.push(`Reset stageId to '${preBranchStageId}'.`);
            }
          }
        } else if (evo && evo.stages) {
          const isValidStage = evo.stages.some(s => String(s.id) === String(pData.stageId));
          if (!isValidStage) {
            issues.push(`Invalid stageId for instance ${instanceId} (family ${fid}): ${pData.stageId}`);
            pData.stageId = fid;
            fixed.push(`Reset stageId to ${fid}.`);
          }
        }
      }
    });
  }

  // Ensure activePartnerInstanceId exists in partnersData
  if (state.partnersData && !state.partnersData[state.activePartnerInstanceId]) {
    issues.push(`activePartnerInstanceId '${state.activePartnerInstanceId}' not found in partnersData.`);
    state.activePartnerInstanceId = Object.keys(state.partnersData)[0] || '172';
    if (!state.partnersData[state.activePartnerInstanceId]) {
      state.partnersData[state.activePartnerInstanceId] = { familyId: '172', level: 1, xp: 0, stageId: '172' };
    }
    fixed.push(`Reset active partner to '${state.activePartnerInstanceId}'.`);
  }
  
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
      { id: 'piano', name: 'Piano Practice', emoji: '🎹', concept: 'Level up!', instructions: 'Play all pieces 3x and work on hard parts.' },
      { id: 'math', name: 'Math Practice', emoji: '🧮', concept: 'Intellect +1', instructions: "Complete today's worksheet or 15 mins on math app." },
      { id: 'reading', name: 'Reading Time', emoji: '📚', concept: 'Explore new zones!', instructions: '15min reading out loud w/30s summary.' },
      { id: 'writing', name: 'Writing', emoji: '✏️', concept: 'Skill mastery', instructions: 'Write at least 3 clean sentences w/punctuation.' },
      { id: 'chinese', name: 'Chinese', emoji: '💮', concept: 'Character master!', instructions: 'Practice reading current vocabulary card set 2x.' }
    ];
    issues.push("Tasks list was missing or invalid.");
    fixed.push("Reset to default tasks.");
  } else {
    let tasksHealed = false;
    state.tasks.forEach(task => {
      if (task.instructions === undefined) {
        const defaults = {
          piano: 'Play all pieces 3x and work on hard parts.',
          math: "Complete today's worksheet or 15 mins on math app.",
          reading: '15min reading out loud w/30s summary.',
          writing: 'Write at least 3 clean sentences w/punctuation.',
          chinese: 'Practice reading current vocabulary card set 2x.'
        };
        task.instructions = defaults[task.id] || '';
        tasksHealed = true;
      }
    });
    if (tasksHealed) {
      issues.push("Some tasks were missing the instructions field.");
      fixed.push("Populated default instructions for missing fields.");
    }
  }
  
  if (!state.claimedRewardsHistory || !Array.isArray(state.claimedRewardsHistory)) {
    state.claimedRewardsHistory = [];
    issues.push("Claimed rewards history was missing or invalid.");
    fixed.push("Initialized empty claimed rewards history.");
  }

  if (!state.weeklyHistory || typeof state.weeklyHistory !== 'object' || Array.isArray(state.weeklyHistory)) {
    state.weeklyHistory = {};
    issues.push("Missing or invalid weeklyHistory container.");
    fixed.push("Initialized empty weeklyHistory.");
  } else {
    Object.keys(state.weeklyHistory).forEach(dateStr => {
      const entry = state.weeklyHistory[dateStr];
      if (!entry || typeof entry !== 'object') {
        delete state.weeklyHistory[dateStr];
        issues.push(`Invalid weeklyHistory entry at ${dateStr}.`);
        fixed.push(`Removed corrupted weeklyHistory entry at ${dateStr}.`);
        return;
      }
      if (typeof entry.weekStartDay !== 'number' || entry.weekStartDay < 0 || entry.weekStartDay > 6) {
        entry.weekStartDay = 0;
        issues.push(`Invalid weekStartDay in weeklyHistory entry at ${dateStr}.`);
        fixed.push(`Set weekStartDay to 0 for weeklyHistory entry at ${dateStr}.`);
      }
      if (entry.weeklyClaimed === undefined) {
        entry.weeklyClaimed = false;
      }
    });
  }

  if (!state.weekStartDate) {
    state.weekStartDate = formatLocalDate(getWeekStart(getLocalDate(state.timezoneOffset), state.weekStartDay));
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
    }
  }

  // Sync current week's completed days from grid to starVault.earnedDates
  if (state.weekStartDate && state.grid && state.tasks && state.tasks.length > 0) {
    let syncedAny = false;
    const currentWeekDates = DAYS.map(day => getColumnDateStr(state.weekStartDate, day));
    
    DAYS.forEach(day => {
      const dateStr = currentWeekDates[day];
      const allChecked = state.tasks.every(task => !!state.grid[`${dateStr}-${task.id}`] || !!state.excused[`${dateStr}-${task.id}`]);
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
    state.activeWeeklyBadgeId = 172; // Default Pichu
    issues.push("Missing activeWeeklyBadgeId.");
    fixed.push("Set activeWeeklyBadgeId to default 172.");
  }

  if (state.idleTimeout === undefined || typeof state.idleTimeout !== 'number' || ![0, 1, 5, 10, 15, 30].includes(state.idleTimeout)) {
    state.idleTimeout = 10;
    issues.push("Missing or invalid idleTimeout.");
    fixed.push("Set idleTimeout to default 10.");
  }

  const isValidOption = (opt) => opt && typeof opt === 'object' && opt.value !== undefined && opt.text !== undefined;

  if (!state.weeklyRewardOptions || !Array.isArray(state.weeklyRewardOptions) || !state.weeklyRewardOptions.every(isValidOption)) {
    state.weeklyRewardOptions = [...DEFAULT_WEEKLY_REWARDS];
    issues.push("Missing or invalid weeklyRewardOptions.");
    fixed.push("Reset weeklyRewardOptions to defaults.");
  }

  if (!state.megaRewardOptions || !Array.isArray(state.megaRewardOptions) || !state.megaRewardOptions.every(isValidOption)) {
    state.megaRewardOptions = [...DEFAULT_MEGA_REWARDS];
    issues.push("Missing or invalid megaRewardOptions.");
    fixed.push("Reset megaRewardOptions to defaults.");
  }

  if (state.version !== 18) {
    issues.push(`State version mismatch. Current: ${state.version}, Expected: 18`);
    state.version = 18;
    fixed.push("Forced state version to 18.");
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

export function getTaskRequiredDays(taskId) {
  if (!state.weekStartDate) return 7;
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return 7;
  
  const excusedCount = DAYS.filter(day => {
    const dateStr = getDateOfColumn(state.weekStartDate, day);
    const isExcused = !!state.excused[`${dateStr}-${taskId}`];
    const isOutOfRange = (task.createdAt && dateStr < task.createdAt) || (task.deletedAt && dateStr >= task.deletedAt);
    return isExcused || isOutOfRange;
  }).length;
  return Math.max(0, DAYS.length - excusedCount);
}

export function getEarliestDataWeekStartDate() {
  if (!state.weekStartDate) return null;
  
  let earliest = state.weekStartDate;
  
  // 1. Check weeklyHistory keys
  if (state.weeklyHistory) {
    Object.keys(state.weeklyHistory).forEach(dateStr => {
      if (dateStr < earliest) {
        earliest = dateStr;
      }
    });
  }
  
  // 2. Check starVault.earnedDates
  if (state.starVault && state.starVault.earnedDates) {
    state.starVault.earnedDates.forEach(dateStr => {
      const weekStart = formatLocalDate(getWeekStart(new Date(dateStr + 'T00:00:00'), state.weekStartDay || 0));
      if (weekStart < earliest) {
        earliest = weekStart;
      }
    });
  }
  
  // 3. Check claimedRewardsHistory
  if (state.claimedRewardsHistory) {
    state.claimedRewardsHistory.forEach(entry => {
      if (entry.date) {
        const dateStr = entry.date.split('T')[0];
        const weekStart = formatLocalDate(getWeekStart(new Date(dateStr + 'T00:00:00'), state.weekStartDay || 0));
        if (weekStart < earliest) {
          earliest = weekStart;
        }
      }
    });
  }
  
  return earliest;
}

