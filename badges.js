import { state, saveState, rollNewWeeklyBadge } from './state.js';
import { getPokemonName } from './pokemon_data.js';

let badgeSortMethod = 'date'; // 'date' or 'dex'

export function initBadgeCase() {
  const openBtn = document.getElementById('open-badges-btn');
  const closeBtn = document.getElementById('close-badges-modal-btn');
  const modal = document.getElementById('badges-modal');
  const sortByDateBtn = document.getElementById('sort-badges-date');
  const sortByDexBtn = document.getElementById('sort-badges-dex');

  if (openBtn) {
    openBtn.addEventListener('click', openBadgeCase);
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  }
  if (sortByDateBtn) {
    sortByDateBtn.addEventListener('click', () => {
      badgeSortMethod = 'date';
      updateSortButtons();
      renderBadgeCaseGrid();
    });
  }
  if (sortByDexBtn) {
    sortByDexBtn.addEventListener('click', () => {
      badgeSortMethod = 'dex';
      updateSortButtons();
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

function updateSortButtons() {
  const sortByDateBtn = document.getElementById('sort-badges-date');
  const sortByDexBtn = document.getElementById('sort-badges-dex');
  if (!sortByDateBtn || !sortByDexBtn) return;
  
  if (badgeSortMethod === 'date') {
    sortByDateBtn.classList.add('active');
    sortByDexBtn.classList.remove('active');
  } else {
    sortByDateBtn.classList.remove('active');
    sortByDexBtn.classList.add('active');
  }
}

export function openBadgeCase() {
  const modal = document.getElementById('badges-modal');
  if (modal) {
    modal.classList.remove('hidden');
    updateSortButtons();
    renderBadgeCaseGrid();
  }
}

export function renderBadgeCaseGrid() {
  const grid = document.getElementById('badges-grid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  let badges = [...(state.collectedBadges || [])];
  
  if (badgeSortMethod === 'dex') {
    badges.sort((a, b) => a.id - b.id);
  } else {
    // Default: Sort by Date (newest first)
    badges.sort((a, b) => new Date(b.dateEarned) - new Date(a.dateEarned));
  }
  
  if (badges.length === 0) {
    grid.innerHTML = `<div class="no-badges" style="grid-column: 1/-1; text-align: center; font-family: 'Fredoka One', cursive; color: #64748b; padding: 40px 0;">No badges collected yet. Complete your weekly goals to earn them! 🏆</div>`;
    return;
  }
  
  badges.forEach(badge => {
    const card = document.createElement('div');
    card.className = 'badge-case-card pixel-card';
    
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
  if (state.weeklyClaimed) {
    const id = state.activeWeeklyBadgeId;
    const name = getPokemonName(id);
    const dateEarned = new Date().toISOString();
    
    if (!state.collectedBadges) state.collectedBadges = [];
    
    // Avoid double adding
    const exists = state.collectedBadges.some(b => b.id === id);
    if (!exists) {
      state.collectedBadges.push({ id, name, dateEarned });
      console.log(`Awarded badge: ${name} (#${id})`);
    }
    
    rollNewWeeklyBadge();
  }
}
