import { state } from './state.js';

let guideModal = null;
let closeGuideBtn = null;
let guideTasksList = null;
let openGuideBtn = null;

export function initGuide() {
  guideModal = document.getElementById('guide-modal');
  closeGuideBtn = document.getElementById('close-guide-modal-btn');
  guideTasksList = document.getElementById('guide-tasks-list');
  openGuideBtn = document.getElementById('open-guide-btn');

  if (openGuideBtn) {
    openGuideBtn.addEventListener('click', openGuide);
  }
  if (closeGuideBtn) {
    closeGuideBtn.addEventListener('click', closeGuide);
  }

  // Close modal on clicking background
  if (guideModal) {
    guideModal.addEventListener('click', (e) => {
      if (e.target === guideModal) {
        closeGuide();
      }
    });
  }
}

export function openGuide() {
  if (!guideModal) initGuide();
  renderGuide();
  if (guideModal) {
    guideModal.classList.remove('hidden');
  }
}

export function closeGuide() {
  if (guideModal) {
    guideModal.classList.add('hidden');
  }
}

export function renderGuide() {
  if (!guideTasksList) return;
  guideTasksList.innerHTML = '';

  const tasks = state.tasks || [];
  tasks.forEach(task => {
    const itemEl = document.createElement('div');
    itemEl.className = 'guide-item';
    
    const instructions = task.instructions || 'No specific rules set for this activity.';
    const emoji = task.emoji || '📝';

    itemEl.innerHTML = `
      <div class="guide-item-emoji">${emoji}</div>
      <div class="guide-item-details">
        <div class="guide-item-name">${task.name}</div>
        <div class="guide-item-instructions">${instructions}</div>
      </div>
    `;
    guideTasksList.appendChild(itemEl);
  });
}
