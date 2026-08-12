import { state, saveState } from './state.js';
import { POKEMON_MAP, EVOLUTIONS, getPokemonName, EVOLVED_POKEMON_IDS, POKEMON_TYPES, LEGENDARY_POKEMON_IDS, RARE_POKEMON_IDS, getPokemonCost } from './pokemon_data.js';
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
let filterCostSelect;
let shopSortSelect;
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
let HOLD_DURATION = (location.search.includes('runTests=true') || location.search.includes('headless=true')) ? 50 : 3000; // 3s, or 50ms for tests

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
  filterCostSelect = document.getElementById('shop-filter-cost');
  shopSortSelect = document.getElementById('shop-sort-by');
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
  if (filterCostSelect) {
    filterCostSelect.addEventListener('change', showBrowse);
  }
  if (shopSortSelect) {
    shopSortSelect.addEventListener('change', showBrowse);
  }
  if (filterClearBtn) {
    filterClearBtn.addEventListener('click', () => {
      if (filterTypeSelect) filterTypeSelect.value = 'all';
      if (filterCostSelect) filterCostSelect.value = 'all';
      if (shopSortSelect) shopSortSelect.value = 'number';
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
    if (filterCostSelect) filterCostSelect.value = 'all';
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
  const selectedCost = filterCostSelect ? filterCostSelect.value : 'all';

  let filteredIds = buyableIds;
  if (selectedType !== 'all') {
    filteredIds = filteredIds.filter(id => POKEMON_TYPES[id] === selectedType);
  }
  if (selectedCost !== 'all') {
    const targetCost = parseInt(selectedCost, 10);
    filteredIds = filteredIds.filter(id => getPokemonCost(id) === targetCost);
  }

  // Sort logic
  const sortBy = shopSortSelect ? shopSortSelect.value : 'number';
  if (sortBy === 'name') {
    filteredIds.sort((a, b) => {
      const nameA = getPokemonName(a).toLowerCase();
      const nameB = getPokemonName(b).toLowerCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return a - b; // Secondary sort by ID (number)
    });
  } else {
    // Default sort by number (ID)
    filteredIds.sort((a, b) => a - b);
  }

  filteredIds.forEach(id => {
    const name = getPokemonName(id);
    const cost = getPokemonCost(id);
    const isLocked = remainingStars < cost;
    const progressPct = Math.min(100, Math.round((remainingStars / cost) * 100));

    const card = document.createElement('div');
    card.className = `shop-item-card ${isLocked ? 'locked' : 'affordable'}`;
    card.dataset.id = id;
    card.dataset.cost = cost;

    const canEvolve = !!EVOLUTIONS[String(id)] || !!EVOLUTIONS[id];
    const sparkleHtml = canEvolve ? '<span class="shop-item-sparkle animate-bounce-subtle" title="Can evolve! ✨">✨</span>' : '';

    card.innerHTML = `
      <div class="shop-item-sprite-container">
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png" class="shop-item-sprite" alt="${name}" loading="lazy">
        ${isLocked ? '<div class="shop-item-lock-badge">🔒</div>' : ''}
      </div>
      <span class="shop-item-name">${name}${sparkleHtml}</span>
      <div class="shop-item-price-container">
        ${isLocked ? `
          <div class="shop-item-progress-bg">
            <div class="shop-item-progress-fill" style="width: ${progressPct}%;"></div>
          </div>
          <span class="shop-item-progress-text">${Math.min(remainingStars, cost)}/${cost} Stars</span>
        ` : `
          <span class="shop-item-price-tag">⭐ ${cost}</span>
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
  const selectedCost = filterCostSelect ? filterCostSelect.value : 'all';
  const selectedSort = shopSortSelect ? shopSortSelect.value : 'number';

  const isDirty = selectedType !== 'all' || selectedCost !== 'all' || selectedSort !== 'number';
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
  const cost = getPokemonCost(id);

  if (confirmSprite) {
    confirmSprite.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  }
  if (confirmName) {
    const canEvolve = !!EVOLUTIONS[String(id)] || !!EVOLUTIONS[id];
    confirmName.innerHTML = `${name}${canEvolve ? ' <span class="shop-item-sparkle animate-bounce-subtle">✨</span>' : ''}`;
  }
  if (confirmDesc) {
    confirmDesc.textContent = `Ready to welcome ${name} to your team for ${cost} Stars? 🌟`;
  }

  const earnedCount = state.starVault.earnedDates.length;
  const tradedCount = state.starVault.totalTraded || 0;
  const remainingStars = Math.max(0, earnedCount - tradedCount);

  if (holdBtn) {
    if (remainingStars < cost) {
      holdBtn.disabled = true;
      holdBtn.classList.add('disabled');
      if (holdBtnText) holdBtnText.textContent = `Earn ${cost - remainingStars} more stars!`;
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
  const cost = getPokemonCost(selectedPokemonId);
  const earnedCount = state.starVault.earnedDates.length;
  const tradedCount = state.starVault.totalTraded || 0;
  const remainingStars = Math.max(0, earnedCount - tradedCount);
  if (remainingStars < cost) return;

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
  const cost = getPokemonCost(pokemonId);
  
  playUnlockAnimation(pokemonId, cost, () => {
    // Spend stars
    state.starVault.totalTraded = (state.starVault.totalTraded || 0) + cost;
    
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
    return Math.min(40, baseMs / 25); // Fast execution in test mode
  }
  return baseMs;
}

function playDing(index, totalCount) {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    // Scale pitches for totalCount dings: C5 (523.25) to C6 (1046.50) or higher
    const startFreq = 523.25; // C5
    const endFreq = 1046.50; // C6
    const step = totalCount > 1 ? (endFreq - startFreq) / (totalCount - 1) : 0;
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
    gain.gain.exponentialRampToValueAtTime(0.001 * volumeMultiplier, now + 0.25);
    
    osc.start(now);
    osc.stop(now + 0.25);
  } catch (e) {
    console.warn("Ding sound failed:", e);
  }
}

function playUnlockAnimation(pokemonId, starCount, onComplete) {
  if (!animOverlay) return onComplete(); // Safety
  
  animOverlay.classList.remove('hidden');
  
  animPokemonSprite.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
  animPokemonSprite.classList.remove('revealed');
  animLockContainer.classList.remove('shattered', 'rattling');
  animLockIcon.classList.remove('shattered');
  animTitle.classList.add('hidden');
  
  // Calculate source stars count
  const earnedCount = state.starVault.earnedDates.length;
  const tradedCount = state.starVault.totalTraded || 0;
  const remainingStars = Math.max(0, earnedCount - tradedCount);
  
  animStarSourceCount.textContent = remainingStars;
  animStarSourceContainer.classList.remove('hidden');
  
  // Clear and generate starCount slots
  animStarSlotsCircle.innerHTML = '';
  const wrapper = document.querySelector('.anim-lock-wrapper');
  const R = wrapper ? (wrapper.offsetWidth * 0.45) : 115;
  const slots = [];
  
  for (let i = 0; i < starCount; i++) {
    const angle = (2 * Math.PI * i) / starCount - Math.PI / 2;
    const x = R * Math.cos(angle);
    const y = R * Math.sin(angle);
    
    const slot = document.createElement('div');
    slot.className = 'anim-star-slot';
    slot.innerHTML = '⭐';
    slot.style.left = `calc(50% + ${x}px)`;
    slot.style.top = `calc(50% + ${y}px)`;
    
    // Scale slot size slightly for 15 stars to fit comfortably
    if (starCount >= 15) {
      slot.style.fontSize = '1.35rem';
    }
    
    animStarSlotsCircle.appendChild(slot);
    slots.push(slot);
  }
  
  // Generate distinct rhythmic timings based on Star Pricing Tier
  const starParams = [];
  for (let i = 0; i < starCount; i++) {
    if (starCount <= 5) {
      // 5 Stars: Steady energy, no acceleration, taking ~1.2s total
      starParams.push({ launchDelay: 240, flightDuration: 400 });
    } else if (starCount <= 10) {
      // 10 Stars: Starts steady, then accelerates rapidly into lock
      let delay = 200;
      let duration = 380;
      if (i >= 3) {
        delay = Math.max(50, Math.round(200 * Math.pow(0.78, i - 2)));
        duration = Math.max(220, Math.round(380 - (i - 2) * 20));
      }
      starParams.push({ launchDelay: delay, flightDuration: duration });
    } else {
      // 15 Stars: Starts with 3 distinct stars, then cascades into an exponential Star Swarm torrent over ~2.0s
      let delay = 260;
      let duration = 420;
      if (i >= 3) {
        delay = Math.max(35, Math.round(260 * Math.pow(0.70, i - 2)));
        duration = Math.max(180, Math.round(420 - (i - 2) * 22));
      }
      starParams.push({ launchDelay: delay, flightDuration: duration });
    }
  }

  const introDelay = getAnimDuration(400);
  setTimeout(async () => {
    for (let i = 0; i < starCount; i++) {
      const params = starParams[i];
      const flightDuration = getAnimDuration(params.flightDuration);
      const launchDelay = getAnimDuration(params.launchDelay);
      
      await flyStar(i, slots[i], starCount, flightDuration);
      animStarSourceCount.textContent = Math.max(0, remainingStars - 1 - i);
      await new Promise(resolve => setTimeout(resolve, launchDelay));
    }
    
    animStarSourceContainer.classList.add('hidden');
    
    // Lock rattle tension
    animLockContainer.classList.add('rattling');
    const rattleDelay = getAnimDuration(350);
    
    setTimeout(() => {
      animLockContainer.classList.remove('rattling');
      animLockContainer.classList.add('shattered');
      animLockIcon.classList.add('shattered');
      animPokemonSprite.classList.add('revealed');
      
      if (window.CelebrationEngine && window.CelebrationEngine.triggerCelebration) {
        window.CelebrationEngine.triggerCelebration(true);
      }
      
      playSound('unlock');
      
      animTitle.textContent = `${getPokemonName(pokemonId)} Unlocked! 🎉`;
      animTitle.classList.remove('hidden');
      
      const celebrationDelay = getAnimDuration(3000);
      setTimeout(() => {
        animOverlay.classList.add('hidden');
        onComplete();
      }, celebrationDelay);
      
    }, rattleDelay);
    
  }, introDelay);
}

function flyStar(index, slotElement, totalCount, duration) {
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
    
    star.style.transition = `all ${duration}ms cubic-bezier(0.175, 0.885, 0.32, 1.275)`;
    star.style.left = `${targetX}px`;
    star.style.top = `${targetY}px`;
    star.style.transform = 'translate(-50%, -50%) scale(1.4) rotate(360deg)';
    
    let resolved = false;
    const onEnd = () => {
      if (resolved) return;
      resolved = true;
      if (star.parentNode) star.remove();
      slotElement.classList.add('filled');
      playDing(index, totalCount);
      resolve();
    };
    
    star.addEventListener('transitionend', onEnd, { once: true });
    setTimeout(onEnd, duration + 40);
  });
}
