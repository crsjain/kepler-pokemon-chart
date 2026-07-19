import { TIER_1_IDS, EVOLUTIONS } from './pokemon_data.js';
import { formatLocalDate, getWeekStart } from './date_utils.js';

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
