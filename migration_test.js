import { loginFamily, db, auth } from './firebase.js';
import { collection, getDocs, deleteDoc, doc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

console.log("🚀 Starting Kepler Chart Migration Test...");

function assert(condition, message) {
  if (!condition) {
    console.error("❌ Assert Failed: " + message);
    throw new Error(message);
  } else {
    console.log("✅ Passed: " + message);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function cleanupTestProfiles() {
  const user = auth.currentUser;
  if (!user) {
    console.error("No user logged in for cleanup");
    return;
  }
  console.log("Cleaning up test profiles...");
  const profilesRef = collection(db, 'users', user.uid, 'profiles');
  const snapshot = await getDocs(profilesRef);
  let deletedCount = 0;
  for (const docSnapshot of snapshot.docs) {
    const name = docSnapshot.data().name;
    if (name && name.startsWith('KeplerMigrated_')) {
      await deleteDoc(doc(db, 'users', user.uid, 'profiles', docSnapshot.id));
      console.log(`Deleted test profile: ${name} (${docSnapshot.id})`);
      deletedCount++;
    }
  }
  console.log(`Cleanup complete. Deleted ${deletedCount} profiles.`);
}

async function runMigrationTest() {
  try {
    // 1. Setup V9 state in localStorage
    const v9State = {
      version: 9,
      megaWeeks: 2, // should result in 2 retroactive badges (Greninja and Kyogre)
      weeklyClaimed: false,
      activeDay: 0,
      partnerFamily: '25',
      weekStartDate: "2026-07-13",
      grid: {
         '0-piano': true,
         '0-math': true,
         '0-reading': true,
         '0-writing': true,
         '0-chinese': true
      },
      tasks: [
        { id: 'piano', name: 'Piano Practice', emoji: '🎹', concept: 'Level up!', instructions: 'Play all pieces 3x and work on hard parts.' },
        { id: 'math', name: 'Math Practice', emoji: '🧮', concept: 'Intellect +1', instructions: "Complete today's worksheet or 15 mins on math app." },
        { id: 'reading', name: 'Reading Time', emoji: '📚', concept: 'Explore new zones!', instructions: '15min reading out loud w/30s summary.' },
        { id: 'writing', name: 'Writing', emoji: '✏️', concept: 'Skill mastery', instructions: 'Write at least 3 clean sentences w/punctuation.' },
        { id: 'chinese', name: 'Chinese', emoji: '💮', concept: 'Character master!', instructions: 'Practice reading current vocabulary card set 2x.' }
      ],
      partnersData: {
        '25': { level: 2, xp: 10, stageId: '25' }, // Pikachu level 2
        '4': { level: 1, xp: 0, stageId: '4' },
        '1': { level: 1, xp: 0, stageId: '1' },
        '7': { level: 1, xp: 0, stageId: '7' },
        '133': { level: 1, xp: 0, stageId: '133' }
      },
      starVault: {
        earnedDates: ['2026-07-13'],
        totalTraded: 0
      },
      claimedRewardsHistory: []
    };

    localStorage.setItem('kepler_pokemon_training_v2', JSON.stringify(v9State));
    console.log("Injected V9 state into localStorage.");

    // 2. Perform Login
    console.log("Attempting family login...");
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const loginBtn = document.getElementById('login-submit-btn');

    assert(emailInput !== null, "Email input should exist");
    assert(passwordInput !== null, "Password input should exist");
    assert(loginBtn !== null, "Login button should exist");

    emailInput.value = 'crsjain@gmail.com';
    passwordInput.value = 'food3333';
    loginBtn.click();

    // Wait for login to complete and profile select modal to appear
    await sleep(2000); 

    const profileModal = document.getElementById('profile-select-modal');
    assert(profileModal && !profileModal.classList.contains('hidden'), "Profile select modal should be visible after login");

    // 3. Open Add Profile Modal
    const addProfileOpenBtn = document.getElementById('add-profile-open-btn');
    assert(addProfileOpenBtn !== null, "Add Profile button should exist");
    
    // It will prompt for password
    addProfileOpenBtn.click();
    await sleep(500);

    const passwordModal = document.getElementById('password-modal');
    assert(passwordModal && !passwordModal.classList.contains('hidden'), "Parent password prompt should appear");

    const pwInput = document.getElementById('password-input');
    const pwSubmit = document.getElementById('password-submit-btn');
    
    pwInput.value = 'zxcv'; 
    pwSubmit.click();
    await sleep(1000);

    const addProfileModal = document.getElementById('add-profile-modal');
    assert(addProfileModal && !addProfileModal.classList.contains('hidden'), "Add Profile Modal should open after correct password");

    // 4. Verify Migration Alert Card is visible and has correct info
    const migrationContainer = document.getElementById('migration-option-container');
    assert(migrationContainer && !migrationContainer.classList.contains('hidden'), "Migration option container should be visible");

    const localPartnerLevel = document.getElementById('local-partner-level');
    const localPartnerName = document.getElementById('local-partner-name');
    
    assert(localPartnerLevel.textContent === '2', "Migration card should show Level 2");
    assert(localPartnerName.textContent === 'Pikachu', "Migration card should show Pikachu");

    // 5. Trigger Migration
    const migrateChk = document.getElementById('migrate-local-data-chk');
    assert(migrateChk !== null, "Migrate checkbox should exist");
    migrateChk.checked = true;
    migrateChk.dispatchEvent(new Event('change')); 

    const nameInput = document.getElementById('new-profile-name');
    assert(nameInput !== null, "Name input should exist");
    const testProfileName = "KeplerMigrated_" + Date.now().toString().slice(-4);
    nameInput.value = testProfileName;

    // Select an avatar (e.g. Charizard '6')
    const avatarItem = addProfileModal.querySelector(`.icon-picker-item[data-id="6"]`);
    assert(avatarItem !== null, "Avatar option 6 (Charizard) should exist");
    avatarItem.click();
    await sleep(200);

    const addProfileSubmitBtn = document.getElementById('add-profile-submit-btn');
    addProfileSubmitBtn.click();
    
    console.log("Submitted new profile with migration...");
    // Wait for profile creation, selection and state sync
    await sleep(3000); 

    // 6. Verify Migration Success
    assert(addProfileModal.classList.contains('hidden'), "Add Profile Modal should be closed");
    
    const state = window.__app_state__;
    assert(state !== undefined, "App state should be accessible");
    assert(state.version === 12, "State version should be migrated to 12");
    assert(state.childName === testProfileName, "Child name should match");
    assert(state.partnerFamily === '25', "Partner family should be Pikachu");
    assert(state.partnersData['25'].level === 2, "Pikachu level should be 2");
    
    // Check collected badges
    assert(state.collectedBadges.length === 2, "Should have 2 retroactively awarded badges");
    assert(state.collectedBadges.some(b => b.id === 658), "Should have Greninja badge");
    assert(state.collectedBadges.some(b => b.id === 382), "Should have Kyogre badge");

    // Verify UI rendering
    const uiLevel = document.getElementById('pokemon-level').textContent;
    assert(uiLevel === '2', `UI Level should be 2, got ${uiLevel}`);
    
    const uiPartnerName = document.getElementById('partner-name').textContent;
    assert(uiPartnerName === 'Pikachu', `UI Partner name should be Pikachu, got ${uiPartnerName}`);
    
    // Check if checkmarks are rendered for Day 0 (all tasks completed in our mock)
    const tasks = ['piano', 'math', 'reading', 'writing', 'chinese'];
    tasks.forEach(taskId => {
      const cb = document.querySelector(`input[data-day="0"][data-task="${taskId}"]`);
      assert(cb && cb.checked, `UI Checkbox for day 0 task ${taskId} should be checked`);
    });

    // Check localStorage cleanup
    const oldData = localStorage.getItem('kepler_pokemon_training_v2');
    assert(oldData === null, "Old local storage key should be removed");
    
    const backupDataStr = localStorage.getItem('kepler_pokemon_training_v2_backup');
    assert(backupDataStr !== null, "Backup local storage key should exist");
    const backupData = JSON.parse(backupDataStr);
    assert(backupData.version === 9, "Backup data should be the original V9 state");

    if (location.search.includes('headless=true')) {
      await cleanupTestProfiles();
    }

    console.log("🎉 Migration test passed successfully!");
    
  } catch (error) {
    console.error("❌ Migration Test Failed:", error);
  }
}

// Run the test after a short delay to ensure app is loaded
window.addEventListener('load', () => {
  setTimeout(runMigrationTest, 1000);
});
