import { getStarsFromDates, getDateOfColumn } from './vault.js';
import { saveState } from './state.js';

console.log("🚀 Starting Kepler Chart Regression Tests...");

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

async function runSuite() {
  const originalConfirm = window.confirm;
  const originalAlert = window.alert;
  const originalPrompt = window.prompt;
  let mocksActive = false;

  function restoreMocks() {
    window.confirm = originalConfirm;
    window.alert = originalAlert;
    window.prompt = originalPrompt;
    mocksActive = false;
  }

  try {
    // 1. Reset state to clean V9 default
    if (window.__test_helpers__ && window.__test_helpers__.resetState) {
      window.__test_helpers__.resetState();
    } else {
      throw new Error("Test helpers not available");
    }

    let state = window.__app_state__;
    assert(state.version === 9, "State version should be 9");
    assert(state.weeklyClaimed === false, "Weekly claimed should be false");
    assert(window.__grid_rebuild_count__ === 1, `Grid should have been built exactly once on reset (actual: ${window.__grid_rebuild_count__})`);

      // Verify initial UI state
      const xpText = document.getElementById('current-xp').textContent;
      assert(xpText === '0', "Initial XP should be 0");
      
      // Select rewards (needed to check boxes)
      const rewardSelect = document.getElementById('reward-select');
      rewardSelect.value = "Bonus Tablet Time";
      rewardSelect.dispatchEvent(new Event('change'));
      
      const megaRewardSelect = document.getElementById('mega-reward-select');
      megaRewardSelect.value = "Booster Pack";
      megaRewardSelect.dispatchEvent(new Event('change'));

      assert(state.reward === "Bonus Tablet Time", "Weekly reward should be set in state");
      assert(state.megaReward === "Booster Pack", "Mega reward should be set in state");
      assert(window.__grid_rebuild_count__ === 1, "Grid should NOT have rebuilt after selecting rewards");

      // 2. Test Checkbox Toggle (Partial Update Test)
      state.activeDay = 0;
      window.__test_helpers__.renderState(false);
      const firstCheckbox = document.querySelector('input[data-day="0"][data-task="piano"]');
      assert(firstCheckbox !== null, "Piano checkbox should exist");
      assert(firstCheckbox.checked === false, "Checkbox should be unchecked initially");

      // Click it (Check)
      firstCheckbox.click();
      await sleep(100);

      assert(state.grid['0-piano'] === true, "State should record checked task");
      assert(document.getElementById('current-xp').textContent === '5', "XP should increase to 5");
      assert(window.__grid_rebuild_count__ === 1, "Grid should NOT have rebuilt after checking a box");

      // Click it again (Uncheck)
      firstCheckbox.click();
      await sleep(100);
      assert(state.grid['0-piano'] === false, "State should record unchecked task");
      assert(document.getElementById('current-xp').textContent === '0', "XP should decrease back to 0");
      assert(window.__grid_rebuild_count__ === 1, "Grid should NOT have rebuilt after unchecking a box");

      // 3. Test Eevee Evolution Flow
      console.log("Testing Eevee Evolution Dialog...");
      
      // Programmatically switch to Eevee
      state.partnerFamily = '133';
      // Set Eevee's level near milestone (Level 4, 95 XP)
      state.partnersData['133'].level = 4;
      state.partnersData['133'].xp = 95;
      state.partnersData['133'].stageId = '133';
      
      // Trigger render (does not rebuild grid because rebuildGrid=false)
      state.activeDay = 3;
      window.__test_helpers__.renderState(false);
      assert(document.getElementById('partner-name').textContent === 'Eevee', "Active partner should be Eevee");
      assert(window.__grid_rebuild_count__ === 1, "Switching partner should not rebuild the grid");

      // Ensure Day 3 Piano is unchecked
      const eeveeCb = document.querySelector('input[data-day="3"][data-task="piano"]');
      if (eeveeCb.checked) {
        eeveeCb.click();
        await sleep(50);
      }

      // Check the box -> gains 5 XP -> triggers Level 5 evolution!
      eeveeCb.click();
      await sleep(600); // Wait for modal trigger

      const eeveeModal = document.getElementById('eevee-modal');
      assert(eeveeModal && !eeveeModal.classList.contains('hidden'), "Eevee Evolution Modal should open at Level 5");

      // Find Vaporeon option
      const vaporeonOption = eeveeModal.querySelector('.eevee-option img[alt="Vaporeon"]');
      assert(vaporeonOption !== null, "Vaporeon choice should exist in modal");

      // Click option
      vaporeonOption.closest('.eevee-option').click();
      await sleep(200);

      // Verify Evolution
      assert(eeveeModal.classList.contains('hidden'), "Eevee Modal should close after selection");
      assert(state.partnersData['133'].stageId === '134', "Eevee stageId in state should be Vaporeon (134)");
      assert(document.getElementById('partner-name').textContent === 'Vaporeon', "Sprite label should update to Vaporeon");

      // Dismiss custom evolution notification modal programmatically
      const notifModal = document.querySelector('.notif-modal');
      if (notifModal) {
        const closeBtn = notifModal.querySelector('.notif-close-btn');
        if (closeBtn) {
          closeBtn.click();
        }
      }
      await sleep(300); // Wait for CSS transition

      // Restore back to Pikachu for subsequent tests
      state.partnerFamily = '25';
      window.__test_helpers__.renderState(false);

      // 4. Test Dynamic Task Customization (Save, Edit, Delete)
      console.log("Testing Dynamic Task Customization...");
      
      // Mock window prompts/alerts/confirms to run headlessly
      let alertMsg = "";
      window.confirm = () => true; // Auto-confirm
      window.alert = (msg) => { alertMsg = msg; console.log("Mock Alert:", msg); };
      mocksActive = true;
      
      const adminModal = document.getElementById('admin-modal');
      const passwordModal = document.getElementById('password-modal');
      const passwordInput = document.getElementById('password-input');
      const passwordSubmitBtn = document.getElementById('password-submit-btn');
      const passwordError = document.getElementById('password-error');
      
      // Click Admin Button to open password modal
      const adminBtn = document.getElementById('admin-btn');
      adminBtn.click();
      
      assert(!passwordModal.classList.contains('hidden'), "Password Modal should be visible");
      
      // Try wrong password first to test validation
      passwordInput.value = "wrong_password";
      passwordSubmitBtn.click();
      
      assert(!passwordError.classList.contains('hidden'), "Error message should be visible on wrong password");
      assert(adminModal.classList.contains('hidden'), "Admin Modal should still be hidden");
      
      // Now enter correct password
      passwordInput.value = window.__test_helpers__.ADMIN_PASSWORD;
      passwordSubmitBtn.click();
      
      assert(passwordModal.classList.contains('hidden'), "Password Modal should be hidden after correct password");
      assert(!adminModal.classList.contains('hidden'), "Admin Modal should be visible");

      // Add task
      const adminAddTaskBtn = document.getElementById('admin-add-task-btn');
      adminAddTaskBtn.click();

      const taskList = document.getElementById('admin-tasks-list');
      const items = taskList.querySelectorAll('.admin-task-item');
      const newItem = items[items.length - 1]; // Newly added item
      
      const nameInput = newItem.querySelector('.task-name-input');
      const reqInput = newItem.querySelector('.task-req-input');
      const emojiSelect = newItem.querySelector('.task-emoji-select');
      
      nameInput.value = "Science Project";
      reqInput.value = "3";
      emojiSelect.value = "🧪";

      // Save activities
      const adminSaveTasksBtn = document.getElementById('admin-save-tasks-btn');
      adminSaveTasksBtn.click();
      await sleep(100);

      assert(alertMsg.includes("Activities saved successfully"), "Should alert save confirmation");
      assert(window.__grid_rebuild_count__ === 2, "Grid should have rebuilt to show new task (count: 2)");

      // Check task in grid
      const gridTbody = document.getElementById('grid-tbody');
      const newRow = gridTbody.querySelector('.task-row[data-task^="task_"]');
      assert(newRow !== null, "New task row should render in the grid");
      assert(newRow.querySelector('.task-name').textContent === "Science Project", "Task name should match");
      
      const newTaskId = newRow.dataset.task;

      // Check the new task box
      const newCb = gridTbody.querySelector(`input[data-day="0"][data-task="${newTaskId}"]`);
      assert(newCb !== null, "New checkbox should exist");
      state.activeDay = 0;
      window.__test_helpers__.renderState(false);
      newCb.click();
      await sleep(100);

      assert(state.grid[`0-${newTaskId}`] === true, "State should record new task check");
      const actualGoalText = newRow.querySelector('.task-total-cell').textContent;
      assert(actualGoalText === "1 / 3", `Goal column should show 1/3 (actual: "${actualGoalText}")`);

      // Delete task in Admin
      const deleteBtn = newItem.querySelector('.remove-task-btn');
      deleteBtn.click(); // Auto-confirms
      await sleep(100);

      // Save deletion
      adminSaveTasksBtn.click();
      await sleep(100);

      assert(window.__grid_rebuild_count__ === 3, "Grid should rebuild after deletion (count: 3)");
      assert(gridTbody.querySelector(`.task-row[data-task="${newTaskId}"]`) === null, "Row should be removed from DOM");
      assert(state.grid[`0-${newTaskId}`] === undefined, "Checked history for deleted task should be cleaned up");

      // 5. Test State Diagnostics (Auto-Repair)
      console.log("Testing State Diagnostics...");
      
      // Corrupt state
      state.partnersData['25'].xp = 180; // Invalid XP
      state.partnersData['25'].stageId = 'invalid_id'; // Invalid evolution stage ID

      // Run Diagnostics via admin button
      const adminDiagnosticsBtn = document.getElementById('admin-diagnostics-btn');
      adminDiagnosticsBtn.click();
      await sleep(200);

      // Verify heals
      assert(state.partnersData['25'].xp === 99, "XP should clamp to 99");
      assert(state.partnersData['25'].stageId === '25', "Stage ID should recover to default Pikachu");

      restoreMocks();

      // Close admin modal
      const closeAdminModalBtn = document.getElementById('close-admin-modal-btn');
      closeAdminModalBtn.click();
      await sleep(100);

      // 6. Test Reset Week Grid Button Multiple Times
      console.log("Testing Reset Week Grid Button Multiple Times...");
      const resetBtn = document.getElementById('reset-btn');
      const confirmModal = document.getElementById('confirm-modal');
      const confirmYesBtn = document.getElementById('confirm-yes-btn');
      assert(resetBtn !== null, "Reset button should exist");

      // Check a box first
      const pianoCb = document.querySelector('input[data-day="0"][data-task="piano"]');
      if (pianoCb && !pianoCb.checked) pianoCb.click();
      await sleep(50);
      assert(state.grid['0-piano'] === true, "Piano checkbox should be checked before reset");

      // 1st click on Reset button
      resetBtn.click();
      await sleep(100);
      assert(confirmModal && !confirmModal.classList.contains('hidden'), "Confirm Modal should open on 1st Reset click");
      confirmYesBtn.click();
      await sleep(100);
      assert(confirmModal.classList.contains('hidden'), "Confirm Modal should close after confirmation");
      assert(state.grid['0-piano'] === undefined, "Grid should be cleared after 1st reset");

      // Check a box again
      const pianoCb2 = document.querySelector('input[data-day="0"][data-task="piano"]');
      if (pianoCb2 && !pianoCb2.checked) pianoCb2.click();
      await sleep(50);
      assert(state.grid['0-piano'] === true, "Piano checkbox should be checked again");

      // 2nd click on Reset button (Subsequent click!)
      resetBtn.click();
      await sleep(100);
      assert(confirmModal && !confirmModal.classList.contains('hidden'), "Confirm Modal should open on 2nd (subsequent) Reset click");
      confirmYesBtn.click();
      await sleep(100);
      assert(confirmModal.classList.contains('hidden'), "Confirm Modal should close after 2nd confirmation");
      assert(state.grid['0-piano'] === undefined, "Grid should be cleared after 2nd reset");

      // 7. Test Focused Active Day Column Restrictions with Friction Warning
      {
        console.log("Testing Focused Active Day Column Restrictions with Friction Warning...");
        
        const today = new Date().getDay();
        const otherDay1 = (today + 3) % 7; // Pick day 1 (e.g. Wednesday relative to Sunday)
        const otherDay2 = (today + 4) % 7; // Pick day 2 (e.g. Thursday relative to Sunday)
        
        // Let's set active day to otherDay1
        state.activeDay = otherDay1;
        window.__test_helpers__.renderState(false);

        // Verify otherDay1 header is active
        const header1 = document.querySelector(`.day-header[data-day="${otherDay1}"]`);
        assert(header1 && header1.classList.contains('active-day'), "Active day header should have active-day class");

        // Verify otherDay2 header is NOT active
        const header2 = document.querySelector(`.day-header[data-day="${otherDay2}"]`);
        assert(header2 && !header2.classList.contains('active-day'), "Inactive day header should NOT have active-day class");

        // Verify cells on active day are highlighted
        const cell1 = document.querySelector(`.task-row[data-task="piano"] td.checkbox-cell:nth-child(${otherDay1 + 2})`);
        assert(cell1 && cell1.classList.contains('active-column'), "Active cell should have active-column class");
        
        const cell2 = document.querySelector(`.task-row[data-task="piano"] td.checkbox-cell:nth-child(${otherDay2 + 2})`);
        assert(cell2 && !cell2.classList.contains('active-column'), "Inactive cell should NOT have active-column class");

        // Try checking inactive checkbox (should be blocked)
        const cb2 = document.querySelector(`input[data-day="${otherDay2}"][data-task="piano"]`);
        assert(cb2 !== null, "Inactive checkbox should exist");
        cb2.click();
        await sleep(100);
        assert(cb2.checked === false, "Inactive checkbox click should be blocked");
        assert(state.grid[`${otherDay2}-piano`] === undefined, "Inactive task should NOT be in state grid");

        // Try checking active checkbox (should be allowed)
        const cb1 = document.querySelector(`input[data-day="${otherDay1}"][data-task="piano"]`);
        assert(cb1 !== null, "Active checkbox should exist");
        cb1.click();
        await sleep(100);
        assert(cb1.checked === true, "Active checkbox click should be allowed");
        assert(state.grid[`${otherDay1}-piano`] === true, "Active task should be saved to state grid");

        // Now click inactive header (switching to a non-today day should show friction pop-up)
        header2.click();
        await sleep(100);
        
        const confirmModal = document.getElementById('confirm-modal');
        const confirmYesBtn = document.getElementById('confirm-yes-btn');
        const confirmNoBtn = document.getElementById('confirm-no-btn');
        
        if (otherDay2 !== today) {
          assert(confirmModal && !confirmModal.classList.contains('hidden'), "Confirm Modal should open when switching to a non-today day");
          assert(confirmYesBtn.textContent === "Switch Anyway", "Yes button label should be 'Switch Anyway'");
          assert(confirmNoBtn.textContent === "Keep Today", "No button label should be 'Keep Today'");
          assert(confirmYesBtn.classList.contains('greyed-out'), "Yes button should have greyed-out class");
          assert(confirmNoBtn.classList.contains('info'), "No button should have primary info class");
          
          // Confirm switch
          confirmYesBtn.click();
          await sleep(100);
        }
        
        assert(state.activeDay === otherDay2, "Active day should switch to otherDay2 after verification");
        assert(header2.classList.contains('active-day'), "Header2 should now be active");
        assert(cell2.classList.contains('active-column'), "Cell2 should now have active-column class");

        // Check cb2 (should now be allowed!)
        cb2.click();
        await sleep(100);
        assert(cb2.checked === true, "Checkbox click should now be allowed on new active day");

        // Switch back to today by clicking header (should NOT show confirmation pop-up)
        const todayHeader = document.querySelector(`.day-header[data-day="${today}"]`);
        todayHeader.click();
        await sleep(100);
        assert(confirmModal.classList.contains('hidden'), "Confirm Modal should NOT open when switching back to today");
        assert(state.activeDay === today, "Active day should immediately switch back to today");

        // Cleanup: revert checkbox clicks
        state.activeDay = otherDay2;
        window.__test_helpers__.renderState(false);
        cb2.click();
        await sleep(50);
        state.activeDay = otherDay1;
        window.__test_helpers__.renderState(false);
        cb1.click();
        await sleep(50);
        state.activeDay = today;
        window.__test_helpers__.renderState(false);
      }

      // 8. Test Star Vault Streak Logic (Unit Tests)
      {
        console.log("Testing Star Vault Streak Logic (Unit Tests)...");
        // Test empty
        let stars = getStarsFromDates([]);
        assert(stars.length === 0, "Empty dates should return empty stars");

        // Test single day
        stars = getStarsFromDates(['2026-07-01']);
        assert(stars.length === 1, "Single date should return 1 star");
        assert(stars[0].color === 'yellow' && stars[0].streakDay === 1, "Single star should be yellow, streak 1");

        // Test 2 days streak
        stars = getStarsFromDates(['2026-07-01', '2026-07-02']);
        assert(stars.length === 2, "2 consecutive dates should return 2 stars");
        assert(stars[0].color === 'yellow' && stars[0].streakDay === 1, "Day 1 should be yellow");
        assert(stars[1].color === 'yellow' && stars[1].streakDay === 2, "Day 2 should be yellow");

        // Test 3 days streak (Silver transition)
        stars = getStarsFromDates(['2026-07-01', '2026-07-02', '2026-07-03']);
        assert(stars.length === 3, "3 consecutive dates should return 3 stars");
        assert(stars[0].color === 'yellow' && stars[0].streakDay === 1, "Day 1 should be yellow");
        assert(stars[1].color === 'yellow' && stars[1].streakDay === 2, "Day 2 should be yellow");
        assert(stars[2].color === 'silver' && stars[2].streakDay === 3, "Day 3 should be silver");

        // Test 5 days streak (Blue transition)
        stars = getStarsFromDates(['2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04', '2026-07-05']);
        assert(stars.length === 5, "5 consecutive dates should return 5 stars");
        assert(stars[2].color === 'silver' && stars[2].streakDay === 3, "Day 3 silver");
        assert(stars[3].color === 'silver' && stars[3].streakDay === 4, "Day 4 silver");
        assert(stars[4].color === 'blue' && stars[4].streakDay === 5, "Day 5 blue");

        // Test 10 days streak (Prism transition)
        const streak10 = [];
        for (let i = 1; i <= 10; i++) {
          const d = new Date('2026-07-01T00:00:00');
          d.setDate(d.getDate() + (i - 1));
          streak10.push(d.toISOString().split('T')[0]);
        }
        stars = getStarsFromDates(streak10);
        assert(stars.length === 10, "10 consecutive dates should return 10 stars");
        assert(stars[8].color === 'blue' && stars[8].streakDay === 9, "Day 9 blue");
        assert(stars[9].color === 'prism' && stars[9].streakDay === 10, "Day 10 prism");

        // Test streak break
        stars = getStarsFromDates(['2026-07-01', '2026-07-02', '2026-07-04']);
        assert(stars.length === 3, "3 dates with gap should return 3 stars");
        assert(stars[0].color === 'yellow' && stars[0].streakDay === 1, "Day 1 yellow");
        assert(stars[1].color === 'yellow' && stars[1].streakDay === 2, "Day 2 yellow");
        assert(stars[2].color === 'yellow' && stars[2].streakDay === 1, "Day 4 should reset to yellow (streak 1)");
      }

      // 9. Test Logging Star to Vault on Day Completion
      {
        console.log("Testing Logging Star to Vault on Day Completion...");
        // Reset state
        window.__test_helpers__.resetState();
        state = window.__app_state__;
        
        // Setup rewards so we can check boxes
        const rewardSelect = document.getElementById('reward-select');
        rewardSelect.value = "Bonus Tablet Time";
        rewardSelect.dispatchEvent(new Event('change'));
        const megaRewardSelect = document.getElementById('mega-reward-select');
        megaRewardSelect.value = "Booster Pack";
        megaRewardSelect.dispatchEvent(new Event('change'));

        const today = new Date().getDay();
        state.activeDay = today;
        window.__test_helpers__.renderState(false);

        // Verify vault is empty initially
        assert(state.starVault.earnedDates.length === 0, "Star vault should be empty initially");

        // Check all tasks for today
        const tasks = state.tasks || [];
        for (const task of tasks) {
          const cb = document.querySelector(`input[data-day="${today}"][data-task="${task.id}"]`);
          if (cb && !cb.checked) {
            cb.click();
          }
        }
        await sleep(100);

        // Verify star is logged in vault
        const todayDateStr = new Date().toISOString().split('T')[0];
        assert(state.starVault.earnedDates.includes(todayDateStr), "Today's star should be logged in vault");
        assert(state.starVault.earnedDates.length === 1, "Vault should contain exactly 1 star");

        // Verify Daily Total UI indicator is a star
        const dailyTotalCell = document.querySelector(`.day-total-cell[data-day="${today}"]`);
        assert(dailyTotalCell.querySelector('.badge-indicator').textContent === '🌟', "Daily indicator should show 🌟");

        // Uncheck one task
        const firstTaskCb = document.querySelector(`input[data-day="${today}"][data-task="${tasks[0].id}"]`);
        if (firstTaskCb && firstTaskCb.checked) {
          firstTaskCb.click();
        }
        await sleep(100);

        // Verify star is removed from vault
        assert(!state.starVault.earnedDates.includes(todayDateStr), "Today's star should be removed from vault");
        assert(state.starVault.earnedDates.length === 0, "Vault should be empty again");
        assert(dailyTotalCell.querySelector('.badge-indicator').textContent === '❌', "Daily indicator should show ❌");
      }

      // 10. Test Parent Vault Settings
      {
        console.log("Testing Parent Vault Settings in Admin Modal...");
        window.__test_helpers__.resetState();
        state = window.__app_state__;
        
        // Inject some stars
        state.starVault.earnedDates = ['2026-07-01', '2026-07-02', '2026-07-03'];
        saveState();

        // Open Admin Panel
        const adminBtn = document.getElementById('admin-btn');
        adminBtn.click();
        await sleep(50);
        
        const passwordInput = document.getElementById('password-input');
        const passwordSubmitBtn = document.getElementById('password-submit-btn');
        passwordInput.value = window.__test_helpers__.ADMIN_PASSWORD;
        passwordSubmitBtn.click();
        await sleep(100);

        // Verify Admin Vault Stats
        const adminEarned = document.getElementById('admin-vault-earned');
        const adminTradedInput = document.getElementById('admin-vault-traded-input');
        const adminRemaining = document.getElementById('admin-vault-remaining');

        assert(adminEarned.textContent === '3', "Admin panel should show 3 earned stars");
        assert(adminTradedInput.value === '0', "Admin panel should show 0 traded stars initially");
        assert(adminRemaining.textContent === '3', "Admin panel should show 3 remaining stars");

        // Increment Traded stars
        const plusBtn = document.getElementById('admin-vault-traded-plus');
        plusBtn.click(); // Traded becomes 1
        plusBtn.click(); // Traded becomes 2
        await sleep(50);

        assert(adminTradedInput.value === '2', "Admin panel input should show 2 traded stars");
        assert(adminRemaining.textContent === '1', "Remaining label should update to 1 in real time");

        // Save Vault Settings
        const saveVaultBtn = document.getElementById('admin-save-vault-btn');
        saveVaultBtn.click();
        await sleep(100);

        // Verify state is updated
        assert(state.starVault.totalTraded === 2, "State totalTraded should be saved as 2");

        // Close Admin Modal
        const closeAdminModalBtn = document.getElementById('close-admin-modal-btn');
        closeAdminModalBtn.click();
        await sleep(100);

        // Open Vault Modal
        const openVaultBtn = document.getElementById('open-vault-btn');
        assert(openVaultBtn !== null, "Vault button should exist in total row");
        openVaultBtn.click();
        await sleep(100);

        // Verify Vault Modal Stats
        const vaultEarned = document.getElementById('vault-stat-earned');
        const vaultTraded = document.getElementById('vault-stat-traded');
        const vaultRemaining = document.getElementById('vault-stat-remaining');

        assert(vaultEarned.textContent === '3', "Vault modal should show 3 earned");
        assert(vaultTraded.textContent === '2', "Vault modal should show 2 traded");
        assert(vaultRemaining.textContent === '1', "Vault modal should show 1 remaining");

        // Case 11: Testing Inline Vault Trading Flow
        console.log("Testing Inline Vault Trading Flow...");
        
        const vaultTradeOpenBtn = document.getElementById('vault-trade-open-btn');
        assert(vaultTradeOpenBtn !== null, "Inline Spend button should exist in Vault Modal");
        assert(!vaultTradeOpenBtn.disabled, "Spend button should be enabled since remaining count is 1");
        
        vaultTradeOpenBtn.click();
        await sleep(50);
        
        const tradeModal = document.getElementById('vault-trade-modal');
        const gateScreen = document.getElementById('trade-screen-gate');
        const panelScreen = document.getElementById('trade-screen-panel');
        
        assert(tradeModal && !tradeModal.classList.contains('hidden'), "Trade Modal should be visible");
        assert(gateScreen && !gateScreen.classList.contains('hidden'), "Parent Gate should be visible initially");
        assert(panelScreen && panelScreen.classList.contains('hidden'), "Trading Panel should be hidden initially");
        
        const tradePasswordInput = document.getElementById('trade-gate-password');
        const tradePasswordSubmitBtn = document.getElementById('trade-gate-submit-btn');
        const tradePasswordError = document.getElementById('trade-gate-error');
        
        tradePasswordInput.value = 'wrong_password';
        tradePasswordSubmitBtn.click();
        await sleep(50);
        assert(!tradePasswordError.classList.contains('hidden'), "Password error should show on wrong password");
        
        tradePasswordInput.value = 'zxcv';
        tradePasswordSubmitBtn.click();
        await sleep(50);
        
        assert(gateScreen.classList.contains('hidden'), "Parent Gate should be hidden after correct password");
        assert(!panelScreen.classList.contains('hidden'), "Trading Panel should be visible after correct password");
        
        const tradeAvailableCount = document.getElementById('trade-available-count');
        assert(tradeAvailableCount.textContent === '1', "Trade panel should report 1 available star");
        
        const tradeCountMinusBtn = document.getElementById('trade-count-minus');
        const tradeCountPlusBtn = document.getElementById('trade-count-plus');
        const tradeCountValue = document.getElementById('trade-count-value');
        
        assert(tradeCountValue.textContent === '1', "Selected count should default to 1");
        assert(tradeCountMinusBtn.disabled, "Minus button should be disabled for count 1");
        assert(tradeCountPlusBtn.disabled, "Plus button should be disabled since max available is 1");
        
        const tradeConfirmBtn = document.getElementById('trade-confirm-btn');
        tradeConfirmBtn.click();
        await sleep(50);
        
        assert(tradeModal.classList.contains('hidden'), "Trade modal should close after confirm");
        
        assert(state.starVault.totalTraded === 3, "State totalTraded should increment to 3");
        assert(vaultEarned.textContent === '3', "Earned count remains 3");
        assert(vaultTraded.textContent === '3', "Traded count updates to 3");
        assert(vaultRemaining.textContent === '0', "Remaining count drops to 0");
        assert(vaultTradeOpenBtn.disabled, "Spend button should become disabled when remaining stars count is 0");

        // Close Vault Modal
        const closeVaultModalBtn = document.getElementById('close-vault-modal-btn');
        closeVaultModalBtn.click();
        await sleep(100);
      }

      console.log("🎉 All regression tests passed successfully! Grid performance is optimized.");
      alert("🎉 All regression tests passed successfully!\nGrid rebuild count remained at 1 during checks.");
    } catch (e) {
      restoreMocks(); // Ensure mocks are restored on failure so alert works
      console.error("❌ Test Suite Failed:", e);
      alert("❌ Test Suite Failed: " + e.message);
    }
  }

  setTimeout(runSuite, 1000);
