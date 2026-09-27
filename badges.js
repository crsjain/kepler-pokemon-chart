import { state, saveState, rollNewWeeklyBadge } from './state.js';
import { getPokemonName, POKEMON_TYPES } from './pokemon_data.js';

let badgeSortMethod = 'date'; // 'date' | 'dex' | 'name' | 'type'
let badgeFilterType = 'all';

// One-shot listener binding guard (see initShop for the full rationale).
let isBadgeCaseInitialized = false;

export function initBadgeCase() {
  const openBtn = document.getElementById('open-badges-btn');
  const closeBtn = document.getElementById('close-badges-modal-btn');
  const modal = document.getElementById('badges-modal');
  const filterTypeSelect = document.getElementById('badges-filter-type');
  const sortSelect = document.getElementById('badges-sort-by');

  // initBadgeCase() re-runs on every Firestore snapshot; bind listeners once.
  if (isBadgeCaseInitialized) return;
  isBadgeCaseInitialized = true;

  if (openBtn) {
    openBtn.addEventListener('click', openBadgeCase);
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  }
  if (filterTypeSelect) {
    filterTypeSelect.addEventListener('change', () => {
      badgeFilterType = filterTypeSelect.value || 'all';
      renderBadgeCaseGrid();
    });
  }
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      badgeSortMethod = sortSelect.value || 'date';
      renderBadgeCaseGrid();
    });
  }
  
  // Close on outside click of the modal content
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  }
}

function syncBadgeControls() {
  const filterTypeSelect = document.getElementById('badges-filter-type');
  const sortSelect = document.getElementById('badges-sort-by');
  if (filterTypeSelect) filterTypeSelect.value = badgeFilterType;
  if (sortSelect) sortSelect.value = badgeSortMethod;
}

export function openBadgeCase() {
  const modal = document.getElementById('badges-modal');
  if (modal) {
    badgeFilterType = 'all';
    badgeSortMethod = 'date';
    syncBadgeControls();
    modal.classList.remove('hidden');
    renderBadgeCaseGrid();
  }
}

export function renderBadgeCaseGrid() {
  const grid = document.getElementById('badges-grid');
  if (!grid) return;

  const filterTypeSelect = document.getElementById('badges-filter-type');
  const sortSelect = document.getElementById('badges-sort-by');
  const selectedType = filterTypeSelect ? filterTypeSelect.value : badgeFilterType;
  const sortBy = sortSelect ? sortSelect.value : badgeSortMethod;
  badgeFilterType = selectedType;
  badgeSortMethod = sortBy;

  grid.innerHTML = '';

  const allBadges = [...(state.collectedBadges || [])];
  if (allBadges.length === 0) {
    grid.innerHTML = `<div class="no-badges">No badges collected yet. Complete your weekly goals to earn them! 🏆</div>`;
    return;
  }

  let badges = allBadges;
  if (selectedType !== 'all') {
    badges = badges.filter(b => (POKEMON_TYPES[b.id] || 'Normal') === selectedType);
  }

  if (badges.length === 0) {
    grid.innerHTML = `<div class="no-badges">No ${selectedType} badges collected yet. Keep training to earn more! 🏆</div>`;
    return;
  }

  if (sortBy === 'dex' || sortBy === 'number') {
    badges.sort((a, b) => a.id - b.id);
  } else if (sortBy === 'name') {
    badges.sort((a, b) => {
      const nameA = (a.name || getPokemonName(a.id)).toLowerCase();
      const nameB = (b.name || getPokemonName(b.id)).toLowerCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return a.id - b.id;
    });
  } else if (sortBy === 'type') {
    badges.sort((a, b) => {
      const typeA = (POKEMON_TYPES[a.id] || 'Normal').toLowerCase();
      const typeB = (POKEMON_TYPES[b.id] || 'Normal').toLowerCase();
      if (typeA < typeB) return -1;
      if (typeA > typeB) return 1;
      return a.id - b.id;
    });
  } else {
    // Default: Sort by Date (newest first)
    badges.sort((a, b) => new Date(b.dateEarned) - new Date(a.dateEarned));
  }

  badges.forEach(badge => {
    const card = document.createElement('div');
    card.className = 'badge-case-card pixel-card';
    card.dataset.id = badge.id;
    card.dataset.type = POKEMON_TYPES[badge.id] || 'Normal';
    
    const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${badge.id}.png`;
    
    card.innerHTML = `
      <div class="badge-case-img-container">
        <img src="${spriteUrl}" alt="${badge.name}" class="badge-case-img" loading="lazy">
      </div>
      <div class="badge-case-info">
        <div class="badge-case-name">${badge.name}</div>
        <div class="badge-case-dex">#${String(badge.id).padStart(3, '0')}</div>
      </div>
    `;
    
    // Add tooltip on hover
    const formattedDate = new Date(badge.dateEarned).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    card.setAttribute('data-tooltip', `Earned: ${formattedDate}`);
    bindTooltipEvents(card);
    
    grid.appendChild(card);
  });
}

function bindTooltipEvents(card) {
  const tooltip = document.getElementById('global-star-tooltip');
  if (!tooltip) return;
  
  card.addEventListener('mouseenter', () => {
    const text = card.getAttribute('data-tooltip');
    if (text) {
      tooltip.textContent = text;
      tooltip.classList.remove('hidden');
      const rect = card.getBoundingClientRect();
      // Center the tooltip horizontally
      tooltip.style.left = `${rect.left + window.scrollX + rect.width / 2}px`;
      // Position above the card
      tooltip.style.top = `${rect.top + window.scrollY - 35}px`;
    }
  });
  
  card.addEventListener('mouseleave', () => {
    tooltip.classList.add('hidden');
  });
}

// Function to award the current badge and roll the next
export function awardCurrentWeeklyBadge() {
  const id = state.activeWeeklyBadgeId;
  const name = getPokemonName(id);
  const dateEarned = new Date().toISOString();
  
  if (!state.collectedBadges) state.collectedBadges = [];
  
  const exists = state.collectedBadges.some(b => b.id === id);
  if (!exists) {
    state.collectedBadges.push({ id, name, dateEarned });
    console.log(`Awarded badge: ${name} (#${id})`);
    saveState();
  }
}
