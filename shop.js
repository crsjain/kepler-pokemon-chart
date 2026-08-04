import { state, saveState } from './state.js';
import { POKEMON_MAP, EVOLUTIONS, getPokemonName, EVOLVED_POKEMON_IDS, POKEMON_TYPES, LEGENDARY_POKEMON_IDS } from './pokemon_data.js';
import { playSound } from './audio.js';

// DOM elements
let shopModal;
let closeShopBtn;
let browseScreen;
let confirmScreen;
let backToBrowseBtn;
let itemsGrid;
let availableStarsText;
let filterTypeSelect;
let filterLegendaryCheckbox;
let filterLegendaryLabel;
let filterClearBtn;

let confirmSprite;
let confirmName;
let confirmDesc;
let holdBtn;
let holdProgressCircle;
let holdBtnText;

// Animation Overlay DOM elements
let animOverlay;
let animStarSourceContainer;
let animStarSourceCount;
let animTitle;
let animStarSlotsCircle;
let animPokemonSprite;
let animLockContainer;
let animLockIcon;

let audioCtx = null;

let selectedPokemonId = null;
let holdTimer = null;
let holdProgressInterval = null;
let holdStartTime = null;
let HOLD_DURATION = (location.search.includes('runTests=true') || location.search.includes('headless=true')) ? 300 : 3000; // 3s, or 300ms for tests

let renderAppStateCallback = null;

export function initShop(callbacks = {}) {
  renderAppStateCallback = callbacks.renderAppState || null;

  shopModal = document.getElementById('pokemon-shop-modal');
  if (!shopModal) return;

  closeShopBtn = document.getElementById('close-shop-modal-btn');
  browseScreen = document.getElementById('shop-screen-browse');
  confirmScreen = document.getElementById('shop-screen-confirm');
  backToBrowseBtn = document.getElementById('back-to-browse-btn');
  itemsGrid = document.getElementById('shop-items-grid');
  availableStarsText = document.getElementById('shop-available-stars');
  filterTypeSelect = document.getElementById('shop-filter-type');
  filterLegendaryCheckbox = document.getElementById('shop-filter-legendary');
  filterLegendaryLabel = document.getElementById('shop-filter-legendary-label');
  filterClearBtn = document.getElementById('shop-filter-clear-btn');

  confirmSprite = document.getElementById('shop-confirm-sprite');
  confirmName = document.getElementById('shop-confirm-name');
  confirmDesc = document.getElementById('shop-confirm-desc');
  holdBtn = document.getElementById('shop-hold-unlock-btn');
  holdProgressCircle = document.getElementById('hold-progress-circle');
  holdBtnText = document.getElementById('shop-hold-btn-text');

  animOverlay = document.getElementById('shop-unlock-animation-overlay');
  animStarSourceContainer = document.getElementById('anim-star-source-container');
  animStarSourceCount = document.getElementById('anim-star-source-count');
  animTitle = document.getElementById('anim-title');
  animStarSlotsCircle = document.getElementById('anim-star-slots-circle');
  animPokemonSprite = document.getElementById('anim-pokemon-sprite');
  animLockContainer = document.getElementById('anim-lock-container');
  animLockIcon = document.getElementById('anim-lock-icon');

  if (closeShopBtn) {
    closeShopBtn.addEventListener('click', closeShop);
  }
  if (backToBrowseBtn) {
    backToBrowseBtn.addEventListener('click', showBrowse);
  }
  
  if (filterTypeSelect) {
    filterTypeSelect.addEventListener('change', showBrowse);
  }
  if (filterLegendaryCheckbox) {
    filterLegendaryCheckbox.addEventListener('change', showBrowse);
  }
  if (filterClearBtn) {
    filterClearBtn.addEventListener('click', () => {
      if (filterTypeSelect) filterTypeSelect.value = 'all';
      if (filterLegendaryCheckbox) filterLegendaryCheckbox.checked = false;
      showBrowse();
    });
  }

  // Setup hold-to-unlock gesture events
  if (holdBtn) {
    holdBtn.addEventListener('mousedown', startHold);
    holdBtn.addEventListener('touchstart', (e) => {
      e.preventDefault(); // prevent mouse emulation
      startHold();
    });

    holdBtn.addEventListener('mouseup', cancelHold);
    holdBtn.addEventListener('mouseleave', cancelHold);
    holdBtn.addEventListener('touchend', cancelHold);
    holdBtn.addEventListener('touchcancel', cancelHold);
  }
}

export function openPokemonShop() {
  if (!shopModal) initShop();
  if (shopModal) {
    if (filterTypeSelect) filterTypeSelect.value = 'all';
    if (filterLegendaryCheckbox) filterLegendaryCheckbox.checked = false;
    shopModal.classList.remove('hidden');
    showBrowse();
  }
}

function closeShop() {
  if (shopModal) {
    shopModal.classList.add('hidden');
  }
  cancelHold();
}

function getBuyablePokemonIds() {
  const allIds = Object.keys(POKEMON_MAP).map(Number);
  return allIds.filter(id => !EVOLVED_POKEMON_IDS.has(id));
}

function showBrowse() {
  if (browseScreen) browseScreen.classList.remove('hidden');
  if (confirmScreen) confirmScreen.classList.add('hidden');
  selectedPokemonId = null;
  cancelHold();
  
  updateFilterUI();

  const earnedCount = state.starVault.earnedDates.length;
  const tradedCount = state.starVault.totalTraded || 0;
  const remainingStars = Math.max(0, earnedCount - tradedCount);

  if (availableStarsText) availableStarsText.textContent = remainingStars;

  if (!itemsGrid) return;
  itemsGrid.innerHTML = '';

  const buyableIds = getBuyablePokemonIds();
  const selectedType = filterTypeSelect ? filterTypeSelect.value : 'all';
  const legendaryOnly = filterLegendaryCheckbox ? filterLegendaryCheckbox.checked : false;

  let filteredIds = buyableIds;
  if (selectedType !== 'all') {
    filteredIds = filteredIds.filter(id => POKEMON_TYPES[id] === selectedType);
  }
  if (legendaryOnly) {
    filteredIds = filteredIds.filter(id => LEGENDARY_POKEMON_IDS.has(id));
  }

  const isLocked = remainingStars < 10;

  filteredIds.forEach(id => {
    const name = getPokemonName(id);
    const card = document.createElement('div');
    card.className = `shop-item-card ${isLocked ? 'locked' : 'affordable'}`;
    card.dataset.id = id;

    card.innerHTML = `
      <div class="shop-item-sprite-container">
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png" class="shop-item-sprite" alt="${name}" loading="lazy">
        ${isLocked ? '<div class="shop-item-lock-badge">🔒</div>' : ''}
      </div>
      <span class="shop-item-name">${name}</span>
      <div class="shop-item-price-container">
        ${isLocked ? `
          <div class="shop-item-progress-bg">
            <div class="shop-item-progress-fill" style="width: ${remainingStars * 10}%;"></div>
          </div>
          <span class="shop-item-progress-text">${remainingStars}/10 Stars</span>
        ` : `
          <span class="shop-item-price-tag">⭐ 10</span>
        `}
      </div>
    `;

    card.addEventListener('click', () => {
      selectPokemon(id);
    });

    itemsGrid.appendChild(card);
  });
}

function updateFilterUI() {
  const selectedType = filterTypeSelect ? filterTypeSelect.value : 'all';
  const legendaryOnly = filterLegendaryCheckbox ? filterLegendaryCheckbox.checked : false;

  if (filterLegendaryLabel) {
    if (legendaryOnly) {
      filterLegendaryLabel.classList.add('active');
    } else {
      filterLegendaryLabel.classList.remove('active');
    }
  }

  const isDirty = selectedType !== 'all' || legendaryOnly;
  if (filterClearBtn) {
    if (isDirty) {
      filterClearBtn.classList.remove('hidden-opacity');
    } else {
      filterClearBtn.classList.add('hidden-opacity');
    }
  }
}

function selectPokemon(id) {
  selectedPokemonId = id;
  const name = getPokemonName(id);

  if (confirmSprite) {
    confirmSprite.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  }
  if (confirmName) {
    confirmName.textContent = name;
  }
  if (confirmDesc) {
    confirmDesc.textContent = `Ready to welcome ${name} to your team for 10 Stars? 🌟`;
  }

  const earnedCount = state.starVault.earnedDates.length;
  const tradedCount = state.starVault.totalTraded || 0;
  const remainingStars = Math.max(0, earnedCount - tradedCount);

  if (holdBtn) {
    if (remainingStars < 10) {
      holdBtn.disabled = true;
      holdBtn.classList.add('disabled');
      if (holdBtnText) holdBtnText.textContent = `Earn ${10 - remainingStars} more stars!`;
      const svg = holdBtn.querySelector('svg');
      if (svg) svg.style.display = 'none';
    } else {
      holdBtn.disabled = false;
      holdBtn.classList.remove('disabled');
      if (holdBtnText) holdBtnText.textContent = 'Hold Down to Unlock! 🔓';
      const svg = holdBtn.querySelector('svg');
      if (svg) svg.style.display = 'block';
      resetHoldProgress();
    }
  }

  if (browseScreen) browseScreen.classList.add('hidden');
  if (confirmScreen) confirmScreen.classList.remove('hidden');
}

function startHold() {
  if (!selectedPokemonId) return;
  const earnedCount = state.starVault.earnedDates.length;
  const tradedCount = state.starVault.totalTraded || 0;
  const remainingStars = Math.max(0, earnedCount - tradedCount);
  if (remainingStars < 10) return;

  playSound('hold_start');
  
  holdStartTime = Date.now();
  resetHoldProgress();

  holdProgressInterval = setInterval(updateHoldProgress, 50);
  holdTimer = setTimeout(completeUnlock, HOLD_DURATION);
}

function cancelHold() {
  if (holdTimer) {
    clearTimeout(holdTimer);
    holdTimer = null;
  }
  if (holdProgressInterval) {
    clearInterval(holdProgressInterval);
    holdProgressInterval = null;
  }
  if (holdStartTime) {
    playSound('uncheck');
  }
  holdStartTime = null;
  resetHoldProgress();
}

function resetHoldProgress() {
  if (holdProgressCircle) {
    holdProgressCircle.style.strokeDashoffset = '100.53';
  }
}

function updateHoldProgress() {
  if (!holdStartTime || !holdProgressCircle) return;
  const elapsed = Date.now() - holdStartTime;
  const pct = Math.min(100, (elapsed / HOLD_DURATION) * 100);
  
  const circumference = 100.53;
  const offset = circumference - (pct / 100) * circumference;
  holdProgressCircle.style.strokeDashoffset = offset;
}

function completeUnlock() {
  if (holdTimer) clearTimeout(holdTimer);
  if (holdProgressInterval) clearInterval(holdProgressInterval);
  holdTimer = null;
  holdProgressInterval = null;
  holdStartTime = null;

  const id = selectedPokemonId;
  selectedPokemonId = null;

  triggerUnlockFlow(id);
}

function triggerUnlockFlow(pokemonId) {
  playUnlockAnimation(pokemonId, () => {
    // Spend 10 stars
    state.starVault.totalTraded = (state.starVault.totalTraded || 0) + 10;
    
    const instanceId = `${pokemonId}_${Date.now()}`;
    
    if (!state.partnersData) state.partnersData = {};
    state.partnersData[instanceId] = {
      familyId: String(pokemonId),
      level: 1,
      xp: 0,
      stageId: String(pokemonId)
    };
    
    state.activePartnerInstanceId = instanceId;
    state.partnerFamily = String(pokemonId);
    
    saveState();
    
    if (renderAppStateCallback) {
      renderAppStateCallback(true);
    }

    // Trigger visual feedback glow on main screen active partner sprite
    const mainPokemonSprite = document.getElementById('pokemon-sprite');
    if (mainPokemonSprite) {
      mainPokemonSprite.classList.add('new-unlock-glow');
      setTimeout(() => {
        mainPokemonSprite.classList.remove('new-unlock-glow');
      }, 3000); // 3 seconds total (2 bounce loop cycles)
    }
    
    closeShop();
  });
}

function getAnimDuration(baseMs) {
  const isTest = location.search.includes('runTests=true') || location.search.includes('headless=true');
  if (isTest) {
    return Math.min(50, baseMs / 20); // Scale down by 20x, max 50ms
  }
  return baseMs;
}

function playDing(index) {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    // Scale pitches for 10 dings: C5 (523.25) to C6 (1046.50)
    const startFreq = 523.25; // C5
    const endFreq = 1046.50; // C6
    const step = (endFreq - startFreq) / 9;
    const freq = startFreq + step * index;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    
    const volumeMultiplier = 0.5;
    gain.gain.setValueAtTime(0.04 * volumeMultiplier, now);
    gain.gain.exponentialRampToValueAtTime(0.001 * volumeMultiplier, now + 0.3);
    
    osc.start(now);
    osc.stop(now + 0.3);
  } catch (e) {
    console.warn("Ding sound failed:", e);
  }
}

function playUnlockAnimation(pokemonId, onComplete) {
  if (!animOverlay) return onComplete(); // Safety
  
  animOverlay.classList.remove('hidden');
  
  animPokemonSprite.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
  animPokemonSprite.classList.remove('revealed');
  animLockContainer.classList.remove('shattered');
  animLockIcon.classList.remove('shattered');
  animTitle.classList.add('hidden');
  
  // Calculate source stars count
  const earnedCount = state.starVault.earnedDates.length;
  const tradedCount = state.starVault.totalTraded || 0;
  const remainingStars = Math.max(0, earnedCount - tradedCount);
  
  animStarSourceCount.textContent = remainingStars;
  animStarSourceContainer.classList.remove('hidden');
  
  // Clear and generate slots
  animStarSlotsCircle.innerHTML = '';
  const wrapper = document.querySelector('.anim-lock-wrapper');
  const R = wrapper ? (wrapper.offsetWidth * 0.45) : 115;
  const slots = [];
  
  for (let i = 0; i < 10; i++) {
    const angle = (2 * Math.PI * i) / 10 - Math.PI / 2;
    const x = R * Math.cos(angle);
    const y = R * Math.sin(angle);
    
    const slot = document.createElement('div');
    slot.className = 'anim-star-slot';
    slot.innerHTML = '⭐';
    slot.style.left = `calc(50% + ${x}px)`;
    slot.style.top = `calc(50% + ${y}px)`;
    
    animStarSlotsCircle.appendChild(slot);
    slots.push(slot);
  }
  
  const introDelay = getAnimDuration(600);
  setTimeout(async () => {
    // Sequentially fly 10 stars
    for (let i = 0; i < 10; i++) {
      await flyStar(i, slots[i]);
      animStarSourceCount.textContent = remainingStars - 1 - i;
      // Slight delay between fly starts
      await new Promise(resolve => setTimeout(resolve, getAnimDuration(150)));
    }
    
    animStarSourceContainer.classList.add('hidden');
    
    const revealDelay = getAnimDuration(500);
    setTimeout(() => {
      animLockContainer.classList.add('shattered');
      animLockIcon.classList.add('shattered');
      animPokemonSprite.classList.add('revealed');
      
      if (window.CelebrationEngine && window.CelebrationEngine.triggerCelebration) {
        window.CelebrationEngine.triggerCelebration(true);
      }
      
      playSound('unlock');
      
      animTitle.textContent = `${getPokemonName(pokemonId)} Unlocked! 🎉`;
      animTitle.classList.remove('hidden');
      
      const celebrationDelay = getAnimDuration(3500);
      setTimeout(() => {
        animOverlay.classList.add('hidden');
        onComplete();
      }, celebrationDelay);
      
    }, revealDelay);
    
  }, introDelay);
}

function flyStar(index, slotElement) {
  return new Promise((resolve) => {
    const sourceRect = animStarSourceContainer.getBoundingClientRect();
    const sourceX = sourceRect.left + sourceRect.width / 2;
    const sourceY = sourceRect.top + sourceRect.height / 2;
    
    const slotRect = slotElement.getBoundingClientRect();
    const targetX = slotRect.left + slotRect.width / 2;
    const targetY = slotRect.top + slotRect.height / 2;
    
    const star = document.createElement('div');
    star.className = 'flying-star';
    star.innerHTML = '⭐';
    star.style.left = `${sourceX}px`;
    star.style.top = `${sourceY}px`;
    
    document.body.appendChild(star);
    
    star.offsetWidth; // Reflow
    
    const duration = getAnimDuration(600);
    star.style.transition = `all ${duration}ms cubic-bezier(0.175, 0.885, 0.32, 1.275)`;
    star.style.left = `${targetX}px`;
    star.style.top = `${targetY}px`;
    star.style.transform = 'translate(-50%, -50%) scale(1.5) rotate(360deg)';
    
    star.addEventListener('transitionend', () => {
      star.remove();
      slotElement.classList.add('filled');
      playDing(index);
      resolve();
    }, { once: true });
    
    // Safety fallback in case transitionend doesn't fire
    setTimeout(() => {
      if (star.parentNode) {
        star.remove();
        slotElement.classList.add('filled');
        playDing(index);
        resolve();
      }
    }, duration + 50);
  });
}
