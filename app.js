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
  // State
  let state = {
    partnerId: '25', // Default Pikachu
    partnerName: 'Pikachu',
    level: 1,
    xp: 0,
    reward: '',
    megaReward: '',
    megaWeeks: 0,
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
  const resetBtn = document.getElementById('reset-btn');
  const claimWeekBtn = document.getElementById('claim-week-btn');
  const adminResetBtn = document.getElementById('admin-reset-btn');
  
  const pokemonOptions = document.querySelectorAll('.pokemon-option');
  const checkboxes = document.querySelectorAll('.pokeball-checkbox input');
  // Canvas Celebration Setup
  const canvas = document.getElementById('celebration-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let animationId = null;
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  // Initialize
  loadState();
  renderState();
  setupEventListeners();
  function loadState() {
    const savedState = localStorage.getItem('kepler_pokemon_training_v2');
    if (savedState) {
      try {
        state = JSON.parse(savedState);
        // Ensure defaults if missing
        if (!state.grid) state.grid = {};
        if (!state.partnerId) state.partnerId = '25';
        if (!state.partnerName) state.partnerName = 'Pikachu';
        if (state.level === undefined) state.level = 1;
        if (state.xp === undefined) state.xp = 0;
        if (state.reward === undefined) state.reward = '';
        if (state.megaReward === undefined) state.megaReward = '';
        if (state.megaWeeks === undefined) state.megaWeeks = 0;
      } catch (e) {
        console.error('Error parsing local storage', e);
      }
    }
  }
  function saveState() {
    localStorage.setItem('kepler_pokemon_training_v2', JSON.stringify(state));
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
    // 5. Update Task Totals, Daily Totals, and Check Weekly Requirements
    updateProgress();
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
        addXp(xpGained);
        saveState();
        updateProgress();
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
    // Claim Successful Week
    claimWeekBtn.addEventListener('click', () => {
      if (!checkWeeklySuccess()) return;
      // Update mega milestone progress
      state.megaWeeks += 1;
      if (state.megaWeeks >= 4) {
        // Trigger MEGA CELEBRATION!
        triggerCelebration(true);
        state.megaWeeks = 0; // Reset for next loop
        alert(`🏆 MEGA CELEBRATION! Kepler earned a Mega Milestone Reward: "${megaRewardSelect.value || 'A special reward'}!"`);
      } else {
        // Trigger Weekly Celebration
        triggerCelebration(false);
        alert(`⭐ Awesome job, Kepler! You earned your Weekly Reward: "${rewardSelect.value || 'A cool reward'}!"`);
      }
      // Reset grid for a new week, keeping partner, levels, etc.
      resetWeekGrid();
    });
    // Admin Reset All (Password protected)
    adminResetBtn.addEventListener('click', () => {
      const password = prompt('Enter Admin Password to wipe all Kepler\'s progress (Counters + Levels):');
      if (password === ADMIN_PASSWORD) {
        if (confirm('WARNING: This will completely reset Kepler back to Level 1 and wipe all saved progress. Proceed?')) {
          state = {
            partnerId: '25',
            partnerName: 'Pikachu',
            level: 1,
            xp: 0,
            reward: '',
            megaReward: '',
            megaWeeks: 0,
            grid: {}
          };
          saveState();
          renderState();
          alert('System completely rebooted! Good luck, Kepler!');
        }
      } else if (password !== null) {
        alert('Wrong Code! Try again, Trainer!');
      }
    });
  }
  function resetWeekGrid() {
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
  function updateProgress() {
    const days = [0, 1, 2, 3, 4, 5, 6];
    const tasks = ['piano', 'math', 'reading', 'writing', 'chinese'];
    
    // 1. Calculate Task Totals (Across the Week)
    const taskTotals = { piano: 0, math: 0, reading: 0, writing: 0, chinese: 0 };
    
    tasks.forEach(task => {
      days.forEach(day => {
        if (state.grid[`${day}-${task}`]) {
          taskTotals[task]++;
        }
      });
      // Update grid cells in the "GOAL" column
      const totalCell = document.querySelector(`.task-total-cell[data-task="${task}"]`);
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
    days.forEach(day => {
      const allChecked = tasks.every(task => !!state.grid[`${day}-${task}`]);
      const totalCell = document.querySelector(`.day-total-cell[data-day="${day}"]`);
      if (totalCell) {
        const indicator = totalCell.querySelector('.badge-indicator');
        if (allChecked) {
          if (indicator.classList.contains('locked')) {
            addXp(XP_DAILY_BONUS);
            saveState();
          }
          indicator.textContent = '🌟';
          indicator.classList.remove('locked');
          indicator.classList.add('unlocked');
        } else {
          if (indicator.classList.contains('unlocked')) {
            addXp(-XP_DAILY_BONUS);
            saveState();
          }
          indicator.textContent = '❌';
          indicator.classList.remove('unlocked');
          indicator.classList.add('locked');
        }
      }
    });
    // 3. Evaluate Weekly Badge Success Requirements
    const weeklySuccess = checkWeeklySuccess();
    
    if (weeklySuccess) {
      weeklyBadgeSlot.innerHTML = '<span class="badge-icon">🏆</span>';
      weeklyBadgeSlot.classList.remove('locked');
      weeklyBadgeSlot.classList.add('unlocked');
      badgeStatusEl.textContent = "Weekly Goal Unlocked!";
      
      // Highlight weekly reward choice dropdown
      rewardSelectContainer.classList.add('earned');
      claimWeekBtn.disabled = false;
      claimWeekBtn.classList.remove('warning');
    } else {
      weeklyBadgeSlot.innerHTML = '<span class="badge-icon">🔒</span>';
      weeklyBadgeSlot.classList.remove('unlocked');
      weeklyBadgeSlot.classList.add('locked');
      badgeStatusEl.textContent = "Piano, Math, Reading: 7 days. Writing, Chinese: 5 days.";
      
      rewardSelectContainer.classList.remove('earned');
      claimWeekBtn.disabled = true;
    }
    // 4. Render Mega Milestone Progress Tracker
    megaWeeksCountEl.textContent = state.megaWeeks;
    megaSlots.forEach((slot, index) => {
      if (index < state.megaWeeks) {
        slot.textContent = '⚽'; // Styled Pokeball
        slot.classList.add('unlocked');
      } else {
        slot.textContent = '❌';
        slot.classList.remove('unlocked');
      }
    });
    // Highlight Mega Reward if they have completed 3 weeks and this week is ready
    if (state.megaWeeks >= 3 && weeklySuccess) {
      megaRewardSelectContainer.classList.add('mega-earned');
    } else {
      megaRewardSelectContainer.classList.remove('mega-earned');
    }
  }
  function checkWeeklySuccess() {
    const days = [0, 1, 2, 3, 4, 5, 6];
    const tasks = ['piano', 'math', 'reading', 'writing', 'chinese'];
    const taskTotals = { piano: 0, math: 0, reading: 0, writing: 0, chinese: 0 };
    
    tasks.forEach(task => {
      days.forEach(day => {
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
  // Particle Engine for Celebrations
  function triggerCelebration(isMega) {
    if (animationId) {
      cancelAnimationFrame(animationId);
      particles = [];
    }
    
    const count = isMega ? 300 : 120;
    const colors = isMega 
      ? ['#7c3aed', '#ff3c3c', '#ffcb05', '#2a71d0', '#4caf50', '#ffffff'] 
      : ['#ffcb05', '#fde68a', '#fbbf24', '#ffffff', '#cbd5e0']; // Gold & stars for weekly
      
    for (let i = 0; i < count; i++) {
      particles.push(createParticle(isMega, colors));
    }
    
    animate();
  }
  function createParticle(isMega, colors) {
    const x = Math.random() * canvas.width;
    const y = isMega ? Math.random() * canvas.height - canvas.height : -20; // Falling from sky
    const size = Math.random() * (isMega ? 15 : 10) + 5;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    return {
      x,
      y,
      size,
      color,
      shape: Math.random() > 0.4 ? 'star' : 'circle',
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * 5 + 3,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1
    };
  }
  function drawStar(x, y, r, p, m, color) {
    ctx.save();
    ctx.beginPath();
    ctx.translate(x, y);
    ctx.moveTo(0, 0 - r);
    for (let i = 0; i < p; i++) {
      ctx.rotate(Math.PI / p);
      ctx.lineTo(0, 0 - (r * m));
      ctx.rotate(Math.PI / p);
      ctx.lineTo(0, 0 - r);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;
    particles.forEach(p => {
      if (p.opacity > 0) {
        active = true;
        
        // Physics
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        
        ctx.globalAlpha = p.opacity;
        if (p.shape === 'star') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation * Math.PI / 180);
          ctx.translate(-p.x, -p.y);
          drawStar(p.x, p.y, p.size, 5, 0.5, p.color);
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, 2 * Math.PI);
          ctx.fillStyle = p.color;
          ctx.fill();
        }
        
        // Decay
        if (p.y > canvas.height - 50) {
          p.opacity -= 0.02;
        }
      }
    });
    if (active) {
      animationId = requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }
});
