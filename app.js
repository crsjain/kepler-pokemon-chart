document.addEventListener('DOMContentLoaded', () => {
 // Constants
 const XP_PER_TASK = 5;
 const XP_DAILY_BONUS = 15;
 const XP_LEVEL_THRESHOLD = 100;
 const GOAL_DAYS = 5; // Kepler needs at least 5 days out of 7
 // State
 let state = {
   partnerId: '25', // Default Pikachu
   partnerName: 'Pikachu',
   level: 1,
   xp: 0,
   reward: '',
   grid: {} // key format: "day-task" -> boolean
 };
 // DOM Elements
 const pokemonSprite = document.getElementById('pokemon-sprite');
 const partnerNameEl = document.getElementById('partner-name');
 const levelEl = document.getElementById('pokemon-level');
 const currentXpEl = document.getElementById('current-xp');
 const nextLevelXpEl = document.getElementById('next-level-xp');
 const xpBarFill = document.getElementById('xp-bar-fill');
 const rewardInput = document.getElementById('reward-input');
 const weeklyBadgeSlot = document.getElementById('weekly-badge-slot');
 const badgeStatusEl = document.getElementById('badge-status');
 const changePartnerBtn = document.getElementById('change-partner-btn');
 const partnerModal = document.getElementById('partner-modal');
 const closeModalBtn = document.getElementById('close-modal-btn');
 const resetBtn = document.getElementById('reset-btn');
 const pokemonOptions = document.querySelectorAll('.pokemon-option');
 const checkboxes = document.querySelectorAll('.pokeball-checkbox input');
 // Initialize
 loadState();
 renderState();
 setupEventListeners();
 function loadState() {
   const savedState = localStorage.getItem('kepler_pokemon_training');
   if (savedState) {
     try {
       state = JSON.parse(savedState);
       // Fallbacks for older data structures
       if (!state.grid) state.grid = {};
       if (!state.partnerId) state.partnerId = '25';
       if (!state.partnerName) state.partnerName = 'Pikachu';
       if (state.level === undefined) state.level = 1;
       if (state.xp === undefined) state.xp = 0;
       if (state.reward === undefined) state.reward = '';
     } catch (e) {
       console.error('Error parsing local storage', e);
     }
   }
 }
 function saveState() {
   localStorage.setItem('kepler_pokemon_training', JSON.stringify(state));
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
   // 3. Render Reward Input
   rewardInput.value = state.reward || '';
   // 4. Render Grid Checkboxes
   checkboxes.forEach(cb => {
     const key = `${cb.dataset.day}-${cb.dataset.task}`;
     cb.checked = !!state.grid[key];
   });
   // 5. Update and Render Totals
   updateDailyTotals();
 }
 function setupEventListeners() {
   // Checkbox changes
   checkboxes.forEach(cb => {
     cb.addEventListener('change', (e) => {
       const day = cb.dataset.day;
       const task = cb.dataset.task;
       const key = `${day}-${task}`;
       const wasChecked = state.grid[key];
       const isChecked = cb.checked;
       state.grid[key] = isChecked;
       // Calculate XP diff
       let xpGained = 0;
       if (isChecked && !wasChecked) {
         xpGained += XP_PER_TASK;
       } else if (!isChecked && wasChecked) {
         xpGained -= XP_PER_TASK;
       }
       // Apply XP changes
       addXp(xpGained);
      
       // Save & Render totals dynamically
       saveState();
       updateDailyTotals();
     });
   });
   // Reward Input change
   rewardInput.addEventListener('input', () => {
     state.reward = rewardInput.value;
     saveState();
   });
   // Partner Modal
   changePartnerBtn.addEventListener('click', () => {
     partnerModal.classList.remove('hidden');
   });
   closeModalBtn.addEventListener('click', () => {
     partnerModal.classList.add('hidden');
   });
   pokemonOptions.forEach(option => {
     option.addEventListener('click', () => {
       const id = option.dataset.id;
       const name = option.dataset.name;
       state.partnerId = id;
       state.partnerName = name;
       saveState();
       renderState();
       partnerModal.classList.add('hidden');
     });
   });
   // Reset Grid
   resetBtn.addEventListener('click', () => {
     if (confirm('Are you sure you want to reset Kepler\'s weekly grid? Cumulative Level and XP will NOT be reset.')) {
       state.grid = {};
       saveState();
       renderState();
     }
   });
 }
 function addXp(amount) {
   if (amount === 0) return;
  
   let totalXp = state.xp + amount;
  
   // Level up logic
   if (totalXp >= XP_LEVEL_THRESHOLD) {
     state.level += 1;
     state.xp = totalXp - XP_LEVEL_THRESHOLD;
     triggerLevelUpAnimation();
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
   // Keep updating HUD
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
 function updateDailyTotals() {
   const days = [0, 1, 2, 3, 4, 5, 6];
   const tasks = ['piano', 'math', 'reading', 'writing'];
   let clearedDaysCount = 0;
   days.forEach(day => {
     // Check if all 4 tasks for this day are checked
     const allChecked = tasks.every(task => !!state.grid[`${day}-${task}`]);
     const totalCell = document.querySelector(`.day-total-cell[data-day="${day}"]`);
    
     if (!totalCell) return;
     const indicator = totalCell.querySelector('.badge-indicator');
    
     if (allChecked) {
       if (indicator.classList.contains('locked')) {
         // Newly unlocked daily total! Add bonus XP
         addXp(XP_DAILY_BONUS);
         saveState();
       }
       indicator.textContent = '🌟';
       indicator.classList.remove('locked');
       indicator.classList.add('unlocked');
       clearedDaysCount++;
     } else {
       if (indicator.classList.contains('unlocked')) {
         // Re-locked daily total! Deduct bonus XP
         addXp(-XP_DAILY_BONUS);
         saveState();
       }
       indicator.textContent = '❌';
       indicator.classList.remove('unlocked');
       indicator.classList.add('locked');
     }
   });
   // Update Badge Status
   badgeStatusEl.textContent = `${clearedDaysCount} / ${GOAL_DAYS} Days Cleared`;
   if (clearedDaysCount >= GOAL_DAYS) {
     weeklyBadgeSlot.innerHTML = '<span class="badge-icon">🏆</span>';
     weeklyBadgeSlot.classList.remove('locked');
     weeklyBadgeSlot.classList.add('unlocked');
   } else {
     weeklyBadgeSlot.innerHTML = '<span class="badge-icon">🔒</span>';
     weeklyBadgeSlot.classList.remove('unlocked');
     weeklyBadgeSlot.classList.add('locked');
   }
 }
});


