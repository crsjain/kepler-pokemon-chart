import { TIER_1_IDS, EVOLUTIONS } from './pokemon_data.js';
import { formatLocalDate, getWeekStart, getDateOfColumn } from './date_utils.js';


export const DEFAULT_WEEKLY_REWARDS = [
  { value: "Bonus Tablet Time", text: "⚡ +20 Mins of Bonus Tablet Time!" },
  { value: "Choose Meal", text: "🍽️ Menu Master: Choose Weekend Breakfast or Dinner!" },
  { value: "Parent Playtime", text: "🎮 30-Min Playing Pokémon with a Parent!" },
  { value: "Blanket Fort", text: "🏰 Master Builder: Giant Living Room Blanket Fort!" },
  { value: "One Hour Rule", text: "👑 The Boss: Make 1 Family Rule for an Hour!" },
  { value: "Art Project", text: "🎨 Craft Master: Get a Special Art/Drawing Project!" },
  { value: "Lego Challenge", text: "🧱 Lego Challenge: Parent Builds Whatever You Design!" },
  { value: "Bike Route", text: "🚲 Adventure Guide: Pick the Weekend Bike/Scooter Route!" }
];

export const DEFAULT_MEGA_REWARDS = [
  { value: "Booster Pack", text: "💥 Game Time!: Open a Pokémon Card Pack!" },
  { value: "Dessert Outing", text: "🍦 Sweet Victory: Special Dessert Outing!" },
  { value: "New Book", text: "📚 Epic Upgrade: Pick a New Book!" },
  { value: "Clay Set", text: "🧱 Clay Studio: Get an Air-Dry Clay Set!" },
  { value: "Science Kit", text: "🔬 Mad Scientist: Get a Cool Science Kit!" },
  { value: "Bike Trip", text: "🚲 Trail Blazer: Weekend Bike Trip to a New Trail!" },
  { value: "Shoe Laces", text: "👟 Speed Runner: Neon/Glow-in-the-Dark Laces!" }
];

export const MIGRATIONS = [
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
      s.weekStartDate = formatLocalDate(getWeekStart(new Date(), 0));
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
  },
  {
    version: 12,
    migrate: (s) => {
      s.weekStartDay = 0; // Default Sunday
      return s;
    }
  },
  {
    version: 13,
    migrate: (s) => {
      s.idleTimeout = 10; // Default 10 minutes
      return s;
    }
  },
  {
    version: 14,
    migrate: (s) => {
      s.weeklyRewardOptions = [...DEFAULT_WEEKLY_REWARDS];
      s.megaRewardOptions = [...DEFAULT_MEGA_REWARDS];
      return s;
    }
  },
  {
    version: 15,
    migrate: (s) => {
      s.weeklyHistory = s.weeklyHistory || {};
      
      // Migrate grid keys from dayIndex-taskId to YYYY-MM-DD-taskId
      if (s.grid && s.weekStartDate) {
        const newGrid = {};
        Object.keys(s.grid).forEach(key => {
          if (key.includes('-')) {
            const parts = key.split('-');
            const dayIndex = parseInt(parts[0]);
            const taskId = parts.slice(1).join('-');
            if (!isNaN(dayIndex) && dayIndex >= 0 && dayIndex <= 6) {
              const dateStr = getDateOfColumn(s.weekStartDate, dayIndex);
              newGrid[`${dateStr}-${taskId}`] = s.grid[key];
            } else {
              newGrid[key] = s.grid[key];
            }
          } else {
            newGrid[key] = s.grid[key];
          }
        });
        s.grid = newGrid;
      }

      // Migrate excused keys from dayIndex-taskId to YYYY-MM-DD-taskId
      if (s.excused && s.weekStartDate) {
        const newExcused = {};
        Object.keys(s.excused).forEach(key => {
          if (key.includes('-')) {
            const parts = key.split('-');
            const dayIndex = parseInt(parts[0]);
            const taskId = parts.slice(1).join('-');
            if (!isNaN(dayIndex) && dayIndex >= 0 && dayIndex <= 6) {
              const dateStr = getDateOfColumn(s.weekStartDate, dayIndex);
              newExcused[`${dateStr}-${taskId}`] = s.excused[key];
            } else {
              newExcused[key] = s.excused[key];
            }
          } else {
            newExcused[key] = s.excused[key];
          }
        });
        s.excused = newExcused;
      }

      // Add lifecycle metadata to tasks
      if (s.tasks) {
        s.tasks = s.tasks.map(task => ({
          ...task,
          active: task.active !== undefined ? task.active : true,
          createdAt: task.createdAt || '2026-07-01',
          deletedAt: task.deletedAt || null
        }));
      }

      // Seeding Hook for Kepler and Lyra (guarded for Node.js environment)
      const seedData = typeof window !== 'undefined' ? window.__seed_historical_data__ : null;
      if (seedData && s.childName) {
        const seed = seedData[s.childName.toLowerCase()];
        if (seed) {
          console.log(`Seeding historical data for ${s.childName}...`);
          if (seed.weeklyHistory) {
            s.weeklyHistory = { ...s.weeklyHistory, ...seed.weeklyHistory };
          }
          if (seed.grid) {
            s.grid = { ...s.grid, ...seed.grid };
          }
          if (seed.excused) {
            s.excused = { ...s.excused, ...seed.excused };
          }
        }
      }

      return s;
    }
  },
  {
    version: 16,
    migrate: (s) => {
      s.activePartnerInstanceId = s.partnerFamily || '25';
      if (s.partnersData) {
        Object.keys(s.partnersData).forEach(key => {
          if (s.partnersData[key] && !s.partnersData[key].familyId) {
            s.partnersData[key].familyId = key;
          }
        });
      } else {
        s.partnersData = {
          '25': { familyId: '25', level: 1, xp: 0, stageId: '25' }
        };
      }
      s.starVault = s.starVault || { earnedDates: [], totalTraded: 0 };
      s.starVault.totalTraded = s.starVault.totalTraded || 0;
      s.starVault.earnedDates = s.starVault.earnedDates || [];
      return s;
    }
  },
  {
    version: 17,
    migrate: (s) => {
      // Migrate Pikachu family (25) to Pichu family (172)
      if (s.partnersData) {
        const updatedPartnersData = {};
        Object.keys(s.partnersData).forEach(instId => {
          const partner = s.partnersData[instId];
          if (partner.familyId === '25') {
            partner.familyId = '172';
            const lvl = partner.level || 1;
            if (lvl >= 10) {
              partner.stageId = '26'; // Raichu
            } else if (lvl >= 5) {
              partner.stageId = '25'; // Pikachu
            } else {
              partner.stageId = '172'; // Pichu
            }
            if (instId === '25') {
              updatedPartnersData['172'] = partner;
              if (s.activePartnerInstanceId === '25') {
                s.activePartnerInstanceId = '172';
              }
            } else {
              updatedPartnersData[instId] = partner;
            }
          } else {
            updatedPartnersData[instId] = partner;
          }
        });
        s.partnersData = updatedPartnersData;
      }
      if (s.partnerFamily === '25') {
        s.partnerFamily = '172';
      }
      if (s.unlockedPartners) {
        const updatedUnlocked = {};
        Object.keys(s.unlockedPartners).forEach(instId => {
          const partner = s.unlockedPartners[instId];
          if (partner.familyId === '25') {
            partner.familyId = '172';
            const lvl = partner.level || 1;
            if (lvl >= 10) {
              partner.stageId = '26';
            } else if (lvl >= 5) {
              partner.stageId = '25';
            } else {
              partner.stageId = '172';
            }
            if (instId === '25') {
              updatedUnlocked['172'] = partner;
            } else {
              updatedUnlocked[instId] = partner;
            }
          } else {
            updatedUnlocked[instId] = partner;
          }
        });
        s.unlockedPartners = updatedUnlocked;
      }

      // Jigglypuff (39) to Igglybuff (174)
      if (s.partnersData) {
        const updatedPartnersData = {};
        Object.keys(s.partnersData).forEach(instId => {
          const partner = s.partnersData[instId];
          if (partner.familyId === '39') {
            partner.familyId = '174';
            const lvl = partner.level || 1;
            if (lvl >= 10) {
              partner.stageId = '40'; // Wigglytuff
            } else if (lvl >= 5) {
              partner.stageId = '39'; // Jigglypuff
            } else {
              partner.stageId = '174'; // Igglybuff
            }
            if (instId === '39') {
              updatedPartnersData['174'] = partner;
              if (s.activePartnerInstanceId === '39') {
                s.activePartnerInstanceId = '174';
              }
            } else {
              updatedPartnersData[instId] = partner;
            }
          } else {
            if (!updatedPartnersData[instId]) {
              updatedPartnersData[instId] = partner;
            }
          }
        });
        s.partnersData = updatedPartnersData;
      }
      if (s.partnerFamily === '39') {
        s.partnerFamily = '174';
      }
      if (s.unlockedPartners) {
        const updatedUnlocked = {};
        Object.keys(s.unlockedPartners).forEach(instId => {
          const partner = s.unlockedPartners[instId];
          if (partner.familyId === '39') {
            partner.familyId = '174';
            const lvl = partner.level || 1;
            if (lvl >= 10) {
              partner.stageId = '40';
            } else if (lvl >= 5) {
              partner.stageId = '39';
            } else {
              partner.stageId = '174';
            }
            if (instId === '39') {
              updatedUnlocked['174'] = partner;
            } else {
              updatedUnlocked[instId] = partner;
            }
          } else {
            if (!updatedUnlocked[instId]) {
              updatedUnlocked[instId] = partner;
            }
          }
        });
        s.unlockedPartners = updatedUnlocked;
      }

      // Snorlax (143) to Munchlax (446)
      if (s.partnersData) {
        const updatedPartnersData = {};
        Object.keys(s.partnersData).forEach(instId => {
          const partner = s.partnersData[instId];
          if (partner.familyId === '143') {
            partner.familyId = '446';
            const lvl = partner.level || 1;
            if (lvl >= 5) {
              partner.stageId = '143'; // Snorlax
            } else {
              partner.stageId = '446'; // Munchlax
            }
            if (instId === '143') {
              updatedPartnersData['446'] = partner;
              if (s.activePartnerInstanceId === '143') {
                s.activePartnerInstanceId = '446';
              }
            } else {
              updatedPartnersData[instId] = partner;
            }
          } else {
            if (!updatedPartnersData[instId]) {
              updatedPartnersData[instId] = partner;
            }
          }
        });
        s.partnersData = updatedPartnersData;
      }
      if (s.partnerFamily === '143') {
        s.partnerFamily = '446';
      }
      if (s.unlockedPartners) {
        const updatedUnlocked = {};
        Object.keys(s.unlockedPartners).forEach(instId => {
          const partner = s.unlockedPartners[instId];
          if (partner.familyId === '143') {
            partner.familyId = '446';
            const lvl = partner.level || 1;
            if (lvl >= 5) {
              partner.stageId = '143';
            } else {
              partner.stageId = '446';
            }
            if (instId === '143') {
              updatedUnlocked['446'] = partner;
            } else {
              updatedUnlocked[instId] = partner;
            }
          } else {
            if (!updatedUnlocked[instId]) {
              updatedUnlocked[instId] = partner;
            }
          }
        });
        s.unlockedPartners = updatedUnlocked;
      }

      // Update badgePool
      const newTier1Ids = [10, 174, 280];
      if (s.badgePool) {
        newTier1Ids.forEach(id => {
          if (!s.badgePool.includes(id) && !s.collectedBadges.some(b => b.id === id)) {
            s.badgePool.push(id);
          }
        });
      }
      return s;
    }
  },
  {
    version: 18,
    migrate: (s) => {
      if (s.weeklyHistory) {
        const claimedWeeks = Object.keys(s.weeklyHistory)
          .filter(k => s.weeklyHistory[k].weeklyClaimed)
          .sort();
        
        claimedWeeks.forEach((dateStr, index) => {
          s.weeklyHistory[dateStr].megaWeeks = index % 4;
        });
      }
      return s;
    }
  }
];

export function runMigrations(parsedState) {
  let currentVersion = parsedState.version;
  if (currentVersion === undefined) {
    currentVersion = parsedState.partnerFamily ? 3 : 2;
  }

  let migratedState = { ...parsedState };
  
  MIGRATIONS.forEach(m => {
    if (currentVersion < m.version) {
      console.log(`Migrating state from v${currentVersion} to v${m.version}...`);
      migratedState = m.migrate(migratedState);
      migratedState.version = m.version;
      currentVersion = m.version;
    }
  });

  return migratedState;
}
