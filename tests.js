import { getStarsFromDates, getDateOfColumn } from './vault.js';
import { saveState, rollNewWeeklyBadge, getSunday, formatLocalDate } from './state.js';

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
    assert(state.version === 11, "State version should be 11");
    assert(state.weeklyClaimed === false, "Weekly claimed should be false");
    assert(window.__grid_rebuild_count__ === 1, `Grid should have been built exactly once on reset (actual: ${window.__grid_rebuild_count__})`);

      // Verify initial UI state
      const xpText = document.getElementById('current-xp').textContent;
      assert(xpText === '0', "Initial XP should be 0");

      // Verify Version Indicator
      const versionLabel = document.getElementById('app-version-label');
      assert(versionLabel !== null, "App version indicator should exist");
      assert(versionLabel.textContent.includes('v1.4.0'), "App version label should display v1.4.0");
      
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

      // Test Force App Update Button (UI Flow only to avoid reload loop)
      {
        console.log("Testing Force App Update Button Flow...");
        const adminForceUpdateBtn = document.getElementById('admin-force-update-btn');
        assert(adminForceUpdateBtn !== null, "Force Update button should exist in admin panel");
        
        const confirmModal = document.getElementById('confirm-modal');
        const confirmNoBtn = document.getElementById('confirm-no-btn');
        assert(confirmModal !== null, "Confirm modal should exist");
        assert(confirmNoBtn !== null, "Confirm No button should exist");
        
        // Click Force Update
        adminForceUpdateBtn.click();
        await sleep(100);
        
        assert(!confirmModal.classList.contains('hidden'), "Confirm modal should be visible after clicking Force Update");
        
        // Click Cancel
        confirmNoBtn.click();
        await sleep(100);
        
        assert(confirmModal.classList.contains('hidden'), "Confirm modal should be hidden after clicking Cancel");
      }

      restoreMocks();

      // Close admin modal by clicking backdrop
      adminModal.click();
      await sleep(100);
      assert(adminModal.classList.contains('hidden'), "Admin Modal should be hidden after backdrop click");

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
          
          // Test click-outside to dismiss modal with default Keep Today callback
          confirmModal.click();
          await sleep(100);
          assert(confirmModal.classList.contains('hidden'), "Confirm Modal should close on clicking outside overlay");
          assert(state.activeDay === otherDay1, "Active day should NOT change on clicking outside confirm modal");

          // Re-trigger the modal to continue test
          header2.click();
          await sleep(100);

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
          streak10.push(formatLocalDate(d));
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
        const todayDateStr = formatLocalDate(new Date());
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

      // 10. Test Inline Vault Trading Flow
      {
        console.log("Testing Inline Vault Trading Flow...");
        window.__test_helpers__.resetState();
        state = window.__app_state__;
        
        // Inject some stars
        state.starVault.earnedDates = ['2026-07-01', '2026-07-02', '2026-07-03'];
        state.starVault.totalTraded = 2; // leaving 1 remaining star
        saveState();

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

        // 11. Test Case 11: Badge Case & Collection
        console.log("Running Test Case 11: Badge Case & Collection...");
        
        // Verify state initial V10 fields
        assert(state.version === 11, "State version should be 11");
        assert(Array.isArray(state.collectedBadges), "collectedBadges should be an array");
        assert(state.collectedBadges.length === 0, "Initially collected badges should be empty");
        assert(Array.isArray(state.badgePool), "badgePool should be an array");
        assert(state.activeWeeklyBadgeId !== null, "activeWeeklyBadgeId should be rolled");
        
        // Test UI Open
        const openBadgesBtn = document.getElementById('open-badges-btn');
        assert(openBadgesBtn !== null, "Open Badge Case button should exist");
        
        const badgesModal = document.getElementById('badges-modal');
        assert(badgesModal.classList.contains('hidden'), "Badges modal should be hidden initially");
        
        openBadgesBtn.click();
        await sleep(100);
        assert(!badgesModal.classList.contains('hidden'), "Badges modal should be open after click");
        
        // Verify empty grid message
        const badgesGrid = document.getElementById('badges-grid');
        assert(badgesGrid.querySelector('.no-badges') !== null, "Should show 'No badges collected yet' message");
        
        // Close modal
        const closeBadgesBtn = document.getElementById('close-badges-modal-btn');
        closeBadgesBtn.click();
        await sleep(100);
        assert(badgesModal.classList.contains('hidden'), "Badges modal should be hidden after close");
        
        // Test Earning Badge
        console.log("Testing earning weekly badge on reset...");
        
        // Setup state to simulate claimed weekly success
        state.weeklyClaimed = true;
        const initialActiveBadge = state.activeWeeklyBadgeId;
        const initialPoolSize = state.badgePool.length;
        
        // Trigger week reset
        window.__test_helpers__.resetWeekGrid();
        await sleep(100);
        
        // Verify badge was added
        assert(state.collectedBadges.length === 1, "Should have collected 1 badge");
        assert(state.collectedBadges[0].id === initialActiveBadge, "Collected badge should match the active weekly target");
        assert(state.weeklyClaimed === false, "weeklyClaimed should reset to false");
        
        // Verify next badge was rolled
        assert(state.activeWeeklyBadgeId !== initialActiveBadge, "New active weekly badge should be rolled");
        assert(state.badgePool.length === initialPoolSize - 1, "Badge pool size should decrease by 1");
        
        // Test Sorting in UI
        openBadgesBtn.click();
        await sleep(100);
        
        // Add one more badge programmatically to test sorting
        const secondBadgeId = state.badgePool[0];
        state.collectedBadges.push({
          id: secondBadgeId,
          name: "Test Pokemon",
          dateEarned: new Date(Date.now() + 10000).toISOString()
        });
        
        // Trigger render
        window.__test_helpers__.renderBadgeCaseGrid();
        
        const cards = badgesGrid.querySelectorAll('.badge-case-card');
        assert(cards.length === 2, "Should show 2 badge cards");
        
        // Sort by Dex
        const sortDexBtn = document.getElementById('sort-badges-dex');
        sortDexBtn.click();
        await sleep(50);
        
        const sortedIds = Array.from(badgesGrid.querySelectorAll('.badge-case-card')).map(card => {
          const dexText = card.querySelector('.badge-case-dex').textContent;
          return parseInt(dexText.replace('#', ''), 10);
        });
        
        assert(sortedIds[0] < sortedIds[1], "Badges should be sorted numerically by Dex #");
        
        // Sort by Date
        const sortDateBtn = document.getElementById('sort-badges-date');
        sortDateBtn.click();
        await sleep(50);
        
        const sortedCards = badgesGrid.querySelectorAll('.badge-case-card');
        const firstCardName = sortedCards[0].querySelector('.badge-case-name').textContent;
        assert(firstCardName === "Test Pokemon", "Badges should be sorted by date (newest first)");
        
        // Test Auto-Expansion
        console.log("Testing Auto-Expansion trigger...");
        state.badgePool = state.badgePool.slice(0, 4);
        const preRollPoolSize = state.badgePool.length;
        
        rollNewWeeklyBadge();
        
        assert(state.badgePool.length > preRollPoolSize, "Badge pool should have expanded");
        
        // Clean up
        closeBadgesBtn.click();
        await sleep(100);

        // 12. Test Case 12: V9 to V10 Migration
        console.log("Running Test Case 12: V9 to V10 Migration (current cycle)...");
        
        const v9State = {
          version: 9,
          megaWeeks: 2,
          weeklyClaimed: false,
          activeDay: 0,
          weekStartDate: "2026-07-05",
          grid: {},
          partnersData: {
            '25': { level: 1, xp: 0 },
            '4': { level: 1, xp: 0 },
            '1': { level: 1, xp: 0 },
            '7': { level: 1, xp: 0 },
            '133': { level: 1, xp: 0 }
          },
          starVault: {
            earnedDates: [],
            totalTraded: 0
          },
          claimedRewardsHistory: []
        };
        
        localStorage.setItem('kepler_pokemon_training_v2', JSON.stringify(v9State));
        window.__test_helpers__.loadState();
        let migratedState = window.__app_state__;
        
        assert(migratedState.version === 11, "Migrated state version should be 11");
        assert(Array.isArray(migratedState.collectedBadges), "collectedBadges should be created");
        assert(migratedState.collectedBadges.length === 2, "Should have retroactively awarded 2 badges based on megaWeeks=2");
        assert(migratedState.collectedBadges[0].id === 658, "1st migrated badge should be Greninja (658)");
        assert(migratedState.collectedBadges[1].id === 382, "2nd migrated badge should be Kyogre (382)");
        assert(!migratedState.badgePool.includes(382), "Kyogre should be filtered from pool");

        console.log("Running Test Case 12 part 2: V9 to V10 Migration (past history)...");
        window.__test_helpers__.resetState();
        await sleep(50);
        
        const v9StateWithHistory = {
          version: 9,
          megaWeeks: 0,
          weeklyClaimed: false,
          activeDay: 0,
          weekStartDate: "2026-07-05",
          grid: {},
          partnersData: {
            '25': { level: 1, xp: 0 },
            '4': { level: 1, xp: 0 },
            '1': { level: 1, xp: 0 },
            '7': { level: 1, xp: 0 },
            '133': { level: 1, xp: 0 }
          },
          starVault: {
            earnedDates: [],
            totalTraded: 0
          },
          claimedRewardsHistory: [
            { type: 'weekly', weekNumber: 1, partner: "Pikachu" },
            { type: 'weekly', weekNumber: 2, partner: "Eevee" }
          ]
        };
        
        localStorage.setItem('kepler_pokemon_training_v2', JSON.stringify(v9StateWithHistory));
        window.__test_helpers__.loadState();
        migratedState = window.__app_state__;
        
        assert(migratedState.version === 11, "Migrated state version should be 11");
        assert(migratedState.collectedBadges.length === 2, "Should award 2 badges based on history");
        assert(migratedState.collectedBadges[0].id === 658, "1st badge is Greninja");
        assert(migratedState.collectedBadges[1].id === 382, "2nd badge is Kyogre");
        assert(!migratedState.badgePool.includes(382), "Kyogre filtered from pool");
        
        // Clean up: Reset state back to default V10
        window.__test_helpers__.resetState();
        await sleep(100);
      }

      // 13. Test Vault Debug Syncing
      console.log("Running Test Case 13: Vault Debug Syncing...");
      {
        // Start with clean default state
        window.__test_helpers__.resetState();
        await sleep(100);
        state = window.__app_state__;

        // Click Milestone -1 Ball button (sets up grid and should sync stars!)
        const testMilestoneBtn = document.getElementById('test-milestone-minus-one');
        assert(testMilestoneBtn !== null, "Milestone -1 Ball debug button should exist");
        testMilestoneBtn.click();
        await sleep(100);

        // Verify grid has completed columns
        const tasks = state.tasks || [];
        // Day 0, 1, 2, 3, 4 should be completed
        for (let d = 0; d < 5; d++) {
          const allChecked = tasks.length > 0 && tasks.every(task => !!state.grid[`${d}-${task.id}`]);
          assert(allChecked === true, `Day ${d} should be fully checked after Milestone -1 Ball`);
          
          // Total cell should show 🌟
          const totalCell = document.querySelector(`.day-total-cell[data-day="${d}"] .badge-indicator`);
          assert(totalCell && totalCell.textContent === '🌟', `Day ${d} total cell should show 🌟`);
        }

        // Verify stars in vault matches!
        assert(state.starVault.earnedDates.length === 5, "Star Vault should have 5 earned dates after Milestone -1 click");

        // Verify UI stats in Vault Modal match
        window.__test_helpers__.renderVault();
        const statEarned = document.getElementById('vault-stat-earned');
        const statRemaining = document.getElementById('vault-stat-remaining');
        assert(statEarned && statEarned.textContent === '5', "Vault stats Earned should show 5");
        assert(statRemaining && statRemaining.textContent === '5', "Vault stats Remaining should show 5");

        // Now test Set Week W4 button (clears grid, should sync stars to 0 for current week)
        const testWeek4Btn = document.getElementById('test-week-4');
        assert(testWeek4Btn !== null, "W4 debug button should exist");
        testWeek4Btn.click();
        await sleep(100);

        // Verify grid is empty and no stars for current week are in vault
        assert(state.starVault.earnedDates.length === 0, "Star Vault should have 0 earned dates after clearing grid");
        
        window.__test_helpers__.renderVault();
        assert(statEarned && statEarned.textContent === '0', "Vault stats Earned should show 0");

        // Clean up
        window.__test_helpers__.resetState();
        await sleep(100);
      }

      // 14. Test Vault Self-Healing Diagnostics
      console.log("Running Test Case 14: Vault Self-Healing Diagnostics...");
      {
        // Setup a corrupted local storage state
        const todayStr = formatLocalDate(new Date());
        const sundayStr = formatLocalDate(getSunday(new Date()));
        
        const corruptedState = {
          version: 10,
          partnerFamily: '25',
          partnersData: {
            '25': { level: 1, xp: 0, stageId: '25' }
          },
          weekStartDate: sundayStr,
          grid: {
            // Day 0 is completed in grid, so it should be synced into the vault!
            '0-piano': true,
            '0-math': true,
            '0-reading': true,
            '0-writing': true,
            '0-chinese': true,
            // Day 1 is NOT completed (piano is missing)
            '1-math': true,
            '1-reading': true,
            '1-writing': true,
            '1-chinese': true
          },
          tasks: [
            { id: 'piano', name: 'Piano Practice', req: 7 },
            { id: 'math', name: 'Math Practice', req: 7 },
            { id: 'reading', name: 'Reading Time', req: 7 },
            { id: 'writing', name: 'Writing', req: 5 },
            { id: 'chinese', name: 'Chinese', req: 5 }
          ],
          starVault: {
            earnedDates: [
              "invalid-date-format", // Should be removed
              sundayStr,             // Sunday (Day 0) - is completed in grid, so it should be kept
              sundayStr,             // Duplicate of Sunday - should be deduplicated!
              "2026-07-10",          // Historical date (outside current week) - should be kept
              // Day 1's date is NOT completed in grid, but let's assume it was present in vault.
              // Since it is inside the current week, it should be auto-removed!
              getDateOfColumn(sundayStr, 1) 
            ],
            totalTraded: -5 // Negative - should be reset to 0 (or clamped)
          }
        };

        localStorage.setItem('kepler_pokemon_training_v2', JSON.stringify(corruptedState));
        
        // Trigger loadState
        window.__test_helpers__.loadState();
        state = window.__app_state__; // Refresh reference

        // Assert on the healed state
        const expectedDates = ["2026-07-10", sundayStr].sort((a, b) => new Date(a) - new Date(b));
        assert(JSON.stringify(state.starVault.earnedDates) === JSON.stringify(expectedDates), 
          `Star Vault earned dates should be healed to ${JSON.stringify(expectedDates)} (actual: ${JSON.stringify(state.starVault.earnedDates)})`);

        assert(state.starVault.totalTraded === 0, `totalTraded should be healed to 0 (actual: ${state.starVault.totalTraded})`);

        // Clean up: Reset state back to default
        window.__test_helpers__.resetState();
        await sleep(100);
        state = window.__app_state__;
      }

      // 15. Test Week Rollover & Debug Milestone Syncing (vault count mismatch fix)
      console.log("Running Test Case 15: Week Rollover & Debug Milestone Syncing...");
      {
        window.__test_helpers__.resetState();
        await sleep(100);
        state = window.__app_state__;

        // Select rewards so tasks can be checked
        const rewardSelect = document.getElementById('reward-select');
        rewardSelect.value = "Bonus Tablet Time";
        rewardSelect.dispatchEvent(new Event('change'));
        const megaRewardSelect = document.getElementById('mega-reward-select');
        megaRewardSelect.value = "Booster Pack";
        megaRewardSelect.dispatchEvent(new Event('change'));

        // Complete 5 columns (Days 0 to 4) of the first week
        const tasks = state.tasks || [];
        for (let d = 0; d < 5; d++) {
          tasks.forEach(task => {
            state.grid[`${d}-${task.id}`] = true;
          });
        }
        
        // Render and sync
        window.__test_helpers__.syncVaultStarsWithGrid();
        window.__test_helpers__.renderState(true);
        await sleep(100);

        // Verify we got 5 earned dates in vault
        const originalSunday = state.weekStartDate;
        assert(state.starVault.earnedDates.length === 5, `Initial week should have earned 5 stars (actual: ${state.starVault.earnedDates.length})`);

        // Set weekly claimed to true (simulating badge claim / week completion success)
        state.weeklyClaimed = true;
        saveState();

        // Call resetWeekGrid
        window.__test_helpers__.resetWeekGrid();
        await sleep(100);
        state = window.__app_state__;

        // Verify weekStartDate has advanced by 7 days
        const expectedNextSunday = new Date(originalSunday + 'T00:00:00');
        expectedNextSunday.setDate(expectedNextSunday.getDate() + 7);
        const expectedNextSundayStr = formatLocalDate(expectedNextSunday);
        
        assert(state.weekStartDate === expectedNextSundayStr, `weekStartDate should have advanced to ${expectedNextSundayStr} (actual: ${state.weekStartDate})`);
        
        // Grid should be empty
        assert(Object.keys(state.grid).length === 0, "Grid should be cleared after week reset");
        
        // Vault should still have 5 historical stars from last week
        assert(state.starVault.earnedDates.length === 5, `Vault should retain 5 historical stars (actual: ${state.starVault.earnedDates.length})`);

        // Click Milestone -1 ball button (populates Days 0 to 4 in new week)
        const testMilestoneBtn = document.getElementById('test-milestone-minus-one');
        assert(testMilestoneBtn !== null, "Milestone -1 Ball button should exist");
        testMilestoneBtn.click();
        await sleep(100);
        state = window.__app_state__;

        // Verify vault has 10 stars! (5 from previous week, 5 from current week)
        assert(state.starVault.earnedDates.length === 10, `Vault should now contain exactly 10 stars (actual: ${state.starVault.earnedDates.length})`);

        // Open vault modal and check UI counters
        window.__test_helpers__.renderVault();
        const statEarned = document.getElementById('vault-stat-earned');
        const statRemaining = document.getElementById('vault-stat-remaining');
        assert(statEarned && statEarned.textContent === '10', "Vault UI Earned should display 10");
        assert(statRemaining && statRemaining.textContent === '10', "Vault UI Remaining should display 10");

        // Clean up
        window.__test_helpers__.resetState();
        await sleep(100);
        state = window.__app_state__;
      }

      // 16. Test Backup Import Overlay & Notifications
      console.log("Running Test Case 16: Backup Import Overlay & Notifications...");
      {
        window.__test_helpers__.resetState();
        await sleep(100);
        state = window.__app_state__;

        // Open Admin Panel
        const adminBtn = document.getElementById('admin-btn');
        assert(adminBtn !== null, "Admin button should exist");
        adminBtn.click();
        await sleep(100);

        // Verify password modal is open
        const passwordModal = document.getElementById('password-modal');
        assert(passwordModal && !passwordModal.classList.contains('hidden'), "Password modal should open");
        
        // Enter password to open admin panel
        const passwordInput = document.getElementById('password-input');
        const passwordSubmitBtn = document.getElementById('password-submit-btn');
        passwordInput.value = window.__test_helpers__.ADMIN_PASSWORD;
        passwordSubmitBtn.click();
        await sleep(100);

        const adminModal = document.getElementById('admin-modal');
        assert(adminModal && !adminModal.classList.contains('hidden'), "Admin Modal should be open");

        // 16.1 Test importing invalid JSON (fails parse)
        window.prompt = () => "invalid-json-backup"; // Return invalid json
        const adminImportBtn = document.getElementById('admin-import-btn');
        assert(adminImportBtn !== null, "Import button should exist in admin panel");
        adminImportBtn.click();
        await sleep(100);

        // Should show "IMPORT ERROR" custom notification
        const notifModal = document.querySelector('.notif-modal');
        assert(notifModal !== null, "Error notification modal should be displayed on invalid JSON parse");
        
        // Assert that notifModal z-index is greater than adminModal z-index
        const notifZ = parseInt(window.getComputedStyle(notifModal).zIndex);
        const adminZ = parseInt(window.getComputedStyle(adminModal).zIndex);
        assert(notifZ > adminZ, `Error notification z-index (${notifZ}) should be greater than admin panel z-index (${adminZ})`);

        // Close notification
        const notifCloseBtn = notifModal.querySelector('.notif-close-btn');
        if (notifCloseBtn) notifCloseBtn.click();
        await sleep(400); // Wait for transition and removal

        // 16.2 Test importing valid JSON but invalid schema
        window.prompt = () => JSON.stringify({ version: 9, invalidKey: "value" }); // Valid JSON, invalid backup schema
        adminImportBtn.click();
        await sleep(100);

        const allNotifs1 = document.querySelectorAll('.notif-modal');
        const notifModal2 = allNotifs1[allNotifs1.length - 1];
        assert(notifModal2 && notifModal2 !== undefined, "Error notification modal should be displayed on invalid backup schema");
        const notifZ2 = parseInt(window.getComputedStyle(notifModal2).zIndex);
        assert(notifZ2 > adminZ, `Error notification z-index (${notifZ2}) should be greater than admin panel z-index (${adminZ})`);
        
        const notifCloseBtn2 = notifModal2.querySelector('.notif-close-btn');
        if (notifCloseBtn2) notifCloseBtn2.click();
        await sleep(400);

        // 16.3 Test importing valid backup (triggers restore confirm dialog)
        const validBackup = {
          version: 10,
          partnerFamily: "4",
          partnersData: {
            "4": { level: 3, xp: 15, stageId: "4" }
          },
          grid: { "0-piano": true },
          starVault: {
            earnedDates: ["2026-07-13", "2026-07-17", "2026-07-18"],
            totalTraded: 0
          }
        };
        window.prompt = () => JSON.stringify(validBackup);
        adminImportBtn.click();
        await sleep(100);

        // Should open confirm modal
        const confirmModal = document.getElementById('confirm-modal');
        assert(confirmModal && !confirmModal.classList.contains('hidden'), "Confirm Modal should be open for restore confirmation");
        
        // Assert that confirmModal z-index is greater than adminModal z-index
        const confirmZ = parseInt(window.getComputedStyle(confirmModal).zIndex);
        assert(confirmZ > adminZ, `Confirm Modal z-index (${confirmZ}) should be greater than admin panel z-index (${adminZ})`);

        // Click cancel on confirm modal (should close confirm, keep admin open)
        const confirmNoBtn = document.getElementById('confirm-no-btn');
        if (confirmNoBtn) confirmNoBtn.click();
        await sleep(100);

        assert(confirmModal.classList.contains('hidden'), "Confirm modal should close on Cancel click");
        assert(!adminModal.classList.contains('hidden'), "Admin Modal should remain open after Cancel click");

        // 16.4 Test importing valid backup and confirming it
        adminImportBtn.click();
        await sleep(100);
        assert(confirmModal && !confirmModal.classList.contains('hidden'), "Confirm Modal should open again");

        const confirmYesBtn = document.getElementById('confirm-yes-btn');
        if (confirmYesBtn) confirmYesBtn.click();
        await sleep(100);

        // Should close admin modal, update state, and show RESTORE SUCCESS notification
        assert(adminModal.classList.contains('hidden'), "Admin Modal should close after successful restore confirmation");
        
        // Assert starVault is restored
        assert(state.starVault.earnedDates.length === 3, "Star Vault should contain 3 restored dates");
        assert(state.starVault.earnedDates.includes("2026-07-13"), "Star Vault should contain '2026-07-13'");
        
        const allNotifs2 = document.querySelectorAll('.notif-modal');
        const notifModal3 = allNotifs2[allNotifs2.length - 1];
        assert(notifModal3 && notifModal3 !== undefined, "Success notification modal should be displayed after restore success");
        assert(notifModal3.textContent.includes("RESTORE SUCCESS"), "Notification title should be RESTORE SUCCESS");

        const notifCloseBtn3 = notifModal3.querySelector('.notif-close-btn');
        if (notifCloseBtn3) notifCloseBtn3.click();
        await sleep(400);

        // Restore prompt mock
        restoreMocks();

        // Clean up
        window.__test_helpers__.resetState();
        await sleep(100);
        state = window.__app_state__;
      }

      // 17. Test Case 17: Exception Edit Mode & Carry Over
      console.log("Running Test Case 17: Exception Edit Mode & Carry Over...");
      {
        // Clean up any leftover notifications from previous tests
        document.querySelectorAll('.notif-modal').forEach(el => el.remove());
        
        window.__test_helpers__.resetState();
        await sleep(50);
        state = window.__app_state__;
        state.activeDay = 1; // Monday
        saveState();
        window.__test_helpers__.renderState(false);
        await sleep(50);
        
        const exceptionsBtn = document.getElementById('exceptions-btn');
        const exceptionsBanner = document.getElementById('exceptions-banner');
        const layoutContainer = document.querySelector('.layout-container');
        
        assert(exceptionsBtn !== null, "Exceptions button should exist");
        assert(exceptionsBanner !== null, "Exceptions banner should exist");
        assert(exceptionsBanner.classList.contains('hidden'), "Exceptions banner should be initially hidden");
        
        // 17.1 Test Toggle Mode (requires opening admin panel first)
        const adminBtn = document.getElementById('admin-btn');
        const adminModal = document.getElementById('admin-modal');
        assert(adminBtn !== null, "Admin button should exist");
        
        // Open admin modal (requires entering password in modal)
        adminBtn.click();
        await sleep(100);
        
        const passwordModal = document.getElementById('password-modal');
        assert(passwordModal && !passwordModal.classList.contains('hidden'), "Password modal should open");
        
        const passwordInput = document.getElementById('password-input');
        const passwordSubmitBtn = document.getElementById('password-submit-btn');
        passwordInput.value = window.__test_helpers__.ADMIN_PASSWORD;
        passwordSubmitBtn.click();
        await sleep(100);
        
        assert(adminModal && !adminModal.classList.contains('hidden'), "Admin Modal should be open");
        
        // Click exceptions button inside admin modal
        exceptionsBtn.click();
        await sleep(50);
        
        // Verify admin modal is now closed and exception mode is active
        assert(adminModal.classList.contains('hidden'), "Admin Modal should close when entering exception mode");
        assert(!exceptionsBanner.classList.contains('hidden'), "Banner should be visible");
        assert(layoutContainer.classList.contains('exception-mode'), "Layout should have exception-mode class");
        
        // 17.1b Test Header click in Exception Mode (should switch activeDay without prompt)
        const tueHeader = document.querySelector('.day-header[data-day="2"]');
        assert(tueHeader !== null, "Tuesday header should exist");
        tueHeader.click();
        await sleep(50);
        assert(state.activeDay === 2, "Active day should switch to Tuesday (2) immediately on header click in Exception Mode");
        const exceptionConfirmModal = document.getElementById('confirm-modal');
        assert(exceptionConfirmModal.classList.contains('hidden'), "Confirm Modal should not open on header click in Exception Mode");
        
        // Switch back to Monday (1)
        const monHeader = document.querySelector('.day-header[data-day="1"]');
        assert(monHeader !== null, "Monday header should exist");
        monHeader.click();
        await sleep(50);
        assert(state.activeDay === 1, "Active day should switch back to Monday (1)");
        
        // 17.2 Test Excusing a cell (Wednesday Piano = day 3, task piano)
        const wedPianoInput = document.querySelector('input[data-day="3"][data-task="piano"]');
        assert(wedPianoInput !== null, "Wednesday Piano input should exist");
        const wedPianoTd = wedPianoInput.closest('.checkbox-cell');
        assert(wedPianoTd !== null, "Wednesday Piano cell should exist");
        
        // Click the cell to excuse it
        wedPianoTd.click();
        await sleep(50);
        
        assert(wedPianoTd.classList.contains('excused-cell'), "Cell should have excused-cell class");
        assert(state.excused["3-piano"] === true, "State should have 3-piano excused");
        assert(state.grid["3-piano"] === false, "State grid for 3-piano should be false (auto-cleared)");
        assert(wedPianoInput.checked === false, "Checkbox should be unchecked");
        assert(state.activeDay === 1, "Active day should remain Monday (1) after excusing Wednesday task");
        
        // Assert that NO attention notification modal is displayed (since rewards are not set yet)
        const notifModal = document.querySelector('.notif-modal');
        assert(notifModal === null, "No notification modal should be displayed when excusing a task without rewards set");
        
        // 17.3 Test Daily Completion with excused task
        // Exit Exception Mode via Done button in banner
        const exceptionsDoneBtn = document.getElementById('exceptions-done-btn');
        assert(exceptionsDoneBtn !== null, "Exceptions Done button should exist");
        exceptionsDoneBtn.click();
        await sleep(50);
        assert(exceptionsBanner.classList.contains('hidden'), "Banner should hide after exiting exception mode");
        assert(!layoutContainer.classList.contains('exception-mode'), "Layout should lose exception-mode class");
        
        // Select rewards (needed to check boxes)
        const rewardSelect = document.getElementById('reward-select');
        const megaRewardSelect = document.getElementById('mega-reward-select');
        rewardSelect.value = "Blanket Fort";
        rewardSelect.dispatchEvent(new Event('change'));
        megaRewardSelect.value = "Dessert Outing";
        megaRewardSelect.dispatchEvent(new Event('change'));
        await sleep(50);
        
        // Set active day to Wednesday (day 3) to allow checking
        state.activeDay = 3;
        saveState();
        window.__test_helpers__.renderState(false);
        await sleep(50);
        
        // Check the other 4 tasks
        const tasksToCheck = ['math', 'reading', 'writing', 'chinese'];
        for (const tid of tasksToCheck) {
          const input = document.querySelector(`input[data-day="3"][data-task="${tid}"]`);
          if (input && !input.checked) {
            input.click();
            await sleep(50);
          }
        }
        
        // Wednesday daily total cell should now show 🌟
        const wedTotalCell = document.querySelector('.day-total-cell[data-day="3"]');
        assert(wedTotalCell !== null, "Wednesday total cell should exist");
        const indicator = wedTotalCell.querySelector('.badge-indicator');
        assert(indicator && indicator.textContent === '🌟', "Wednesday should show unlocked 🌟 indicator");
        
        // Verify it is completed in Star Vault
        const wedDateStr = getDateOfColumn(state.weekStartDate, 3);
        assert(state.starVault.earnedDates.includes(wedDateStr), "Wednesday date should be in starVault.earnedDates");
        
        // 17.4 Test Carry Over Exceptions - Reset with carryOver = true
        const resetBtn = document.getElementById('reset-btn');
        assert(resetBtn !== null, "Reset button should exist");
        
        resetBtn.click();
        await sleep(100);
        
        const confirmModal = document.getElementById('confirm-modal');
        assert(confirmModal && !confirmModal.classList.contains('hidden'), "Confirm Modal should be open");
        
        const confirmCheckbox = document.getElementById('confirm-checkbox');
        assert(confirmCheckbox !== null, "Carry over checkbox should exist");
        assert(confirmCheckbox.checked === true, "Carry over should be checked by default");
        
        // Confirm reset
        const confirmYesBtn = document.getElementById('confirm-yes-btn');
        if (confirmYesBtn) confirmYesBtn.click();
        await sleep(100);
        
        // Grid should be cleared, but 3-piano should STILL be excused
        assert(Object.keys(state.grid).length === 0, "Grid should be empty");
        assert(state.excused["3-piano"] === true, "3-piano should still be excused after reset with carry over");
        
        // Verify UI has .excused-cell class on Wed Piano cell
        const wedPianoTdAfterReset = document.querySelector('input[data-day="3"][data-task="piano"]').closest('.checkbox-cell');
        assert(wedPianoTdAfterReset.classList.contains('excused-cell'), "Cell should retain excused-cell class in UI");
        
        // 17.5 Test Reset with carryOver = false
        resetBtn.click();
        await sleep(100);
        
        assert(confirmModal && !confirmModal.classList.contains('hidden'), "Confirm Modal should open again");
        const confirmCheckbox2 = document.getElementById('confirm-checkbox');
        
        // Uncheck it
        confirmCheckbox2.click();
        await sleep(50);
        assert(confirmCheckbox2.checked === false, "Carry over should be unchecked");
        
        if (confirmYesBtn) confirmYesBtn.click();
        await sleep(100);
        
        // Grid and excused should be empty
        assert(Object.keys(state.grid).length === 0, "Grid should be empty");
        assert(state.excused["3-piano"] === undefined, "3-piano should be cleared after reset without carry over");
        const wedPianoTdAfterSecondReset = document.querySelector('input[data-day="3"][data-task="piano"]').closest('.checkbox-cell');
        assert(!wedPianoTdAfterSecondReset.classList.contains('excused-cell'), "Cell should lose excused-cell class in UI");
        
        // Clean up
        window.__test_helpers__.resetState();
        await sleep(100);
        state = window.__app_state__;
      }

      // 18. Test Case 18: Normal Mode Cell Click Switch Day Prompt
      console.log("Running Test Case 18: Normal Mode Cell Click Switch Day Prompt...");
      {
        window.__test_helpers__.resetState();
        await sleep(50);
        state = window.__app_state__;
        
        // Select rewards (needed to check boxes)
        const rewardSelect = document.getElementById('reward-select');
        const megaRewardSelect = document.getElementById('mega-reward-select');
        rewardSelect.value = "Blanket Fort";
        rewardSelect.dispatchEvent(new Event('change'));
        megaRewardSelect.value = "Dessert Outing";
        megaRewardSelect.dispatchEvent(new Event('change'));
        await sleep(50);
        
        // Set active day to Monday (1)
        state.activeDay = 1;
        saveState();
        window.__test_helpers__.renderState(false);
        await sleep(50);
        
        // Target Wednesday Piano (day 3, not active)
        const wedPianoInput = document.querySelector('input[data-day="3"][data-task="piano"]');
        assert(wedPianoInput !== null, "Wednesday Piano input should exist");
        assert(wedPianoInput.checked === false, "Wednesday Piano should be unchecked initially");
        
        // Click Wednesday Piano (should trigger confirm dialog because it's not Monday)
        wedPianoInput.click();
        await sleep(100);
        
        const confirmModal = document.getElementById('confirm-modal');
        assert(confirmModal && !confirmModal.classList.contains('hidden'), "Confirm Modal should open on different day cell click");
        assert(confirmModal.textContent.includes("Switch Day?"), "Confirm modal title should be Switch Day");
        
        // Test Cancel (Keep Today)
        const confirmNoBtn = document.getElementById('confirm-no-btn');
        if (confirmNoBtn) confirmNoBtn.click();
        await sleep(100);
        
        assert(confirmModal.classList.contains('hidden'), "Confirm modal should close on Cancel click");
        assert(state.activeDay === 1, "Active day should remain Monday (1)");
        assert(wedPianoInput.checked === false, "Wednesday Piano should remain unchecked after cancel");
        assert(state.grid["3-piano"] !== true, "State grid should not be updated");
        
        // Click again to test Confirm (Switch Anyway)
        wedPianoInput.click();
        await sleep(100);
        
        assert(confirmModal && !confirmModal.classList.contains('hidden'), "Confirm Modal should open again");
        const confirmYesBtn = document.getElementById('confirm-yes-btn');
        if (confirmYesBtn) confirmYesBtn.click();
        await sleep(100);
        
        assert(confirmModal.classList.contains('hidden'), "Confirm modal should close on Confirm click");
        assert(state.activeDay === 3, "Active day should have switched to Wednesday (3)");
        
        // Verify Wednesday is now the active column in UI
        const wedHeader = document.querySelector('.day-header[data-day="3"]');
        assert(wedHeader.classList.contains('active-day'), "Wednesday header should have active-day class");
        
        // Verify Wednesday Piano is checked in UI and State
        const wedPianoInputAfterSwitch = document.querySelector('input[data-day="3"][data-task="piano"]');
        assert(wedPianoInputAfterSwitch.checked === true, "Wednesday Piano should be checked in UI after switch");
        assert(state.grid["3-piano"] === true, "Wednesday Piano should be checked in State after switch");
        
        // Clean up
        window.__test_helpers__.resetState();
        await sleep(100);
        state = window.__app_state__;
      }

      // 19. Test Case 19: Star Vault Display Order
      console.log("Running Test Case 19: Star Vault Display Order...");
      {
        window.__test_helpers__.resetState();
        await sleep(50);
        state = window.__app_state__;

        // Manually inject 3 stars from a past week
        state.starVault.earnedDates = ["2026-07-06", "2026-07-07", "2026-07-08"];
        saveState();

        // Start a new week (weekStartDate = 2026-07-12)
        state.weekStartDate = "2026-07-12";
        saveState();

        // Earn stars out of order: Tuesday (day 2, 2026-07-14) first, then Monday (day 1, 2026-07-13)
        const tasks = state.tasks || [];
        
        // Complete Tuesday (day 2)
        tasks.forEach(task => {
          state.grid[`2-${task.id}`] = true;
        });
        saveState();
        window.__test_helpers__.syncVaultStarsWithGrid();
        await sleep(50);

        // Complete Monday (day 1)
        tasks.forEach(task => {
          state.grid[`1-${task.id}`] = true;
        });
        saveState();
        window.__test_helpers__.syncVaultStarsWithGrid();
        
        // Render
        window.__test_helpers__.renderVault();
        await sleep(100);

        // Verify state has 5 stars in correct chronological order
        assert(state.starVault.earnedDates.length === 5, "Vault should contain 5 stars");
        
        const stars = getStarsFromDates(state.starVault.earnedDates);
        assert(stars.length === 5, "getStarsFromDates should return 5 stars");
        assert(stars[0].date === "2026-07-06", "1st star should be 2026-07-06");
        assert(stars[1].date === "2026-07-07", "2nd star should be 2026-07-07");
        assert(stars[2].date === "2026-07-08", "3rd star should be 2026-07-08");
        assert(stars[3].date === "2026-07-13", "4th star should be 2026-07-13 (Monday)");
        assert(stars[4].date === "2026-07-14", "5th star should be 2026-07-14 (Tuesday)");

        // Verify DOM slots
        const slots = document.querySelectorAll('.vault-star-slot');
        assert(slots.length >= 5, "Should have at least 5 slots");
        
        assert(!slots[0].classList.contains('empty'), "Slot 0 should not be empty");
        assert(!slots[1].classList.contains('empty'), "Slot 1 should not be empty");
        assert(!slots[2].classList.contains('empty'), "Slot 2 should not be empty");
        assert(!slots[3].classList.contains('empty'), "Slot 3 should not be empty");
        assert(!slots[4].classList.contains('empty'), "Slot 4 should not be empty");
        assert(slots[5].classList.contains('empty'), "Slot 5 should be empty");

        // Clean up
        window.__test_helpers__.resetState();
        await sleep(100);
        state = window.__app_state__;
      }

      // 20. Test Case 20: Task Instructions Guide Modal
      console.log("Running Test Case 20: Task Instructions Guide Modal...");
      {
        window.__test_helpers__.resetState();
        await sleep(50);
        state = window.__app_state__;

        // 20.1 Verify Guide button exists
        const openGuideBtn = document.getElementById('open-guide-btn');
        assert(openGuideBtn !== null, "Guide button should exist in column header");

        // 20.2 Click Guide button and verify modal opens
        openGuideBtn.click();
        await sleep(100);
        const guideModal = document.getElementById('guide-modal');
        assert(guideModal && !guideModal.classList.contains('hidden'), "Guide modal should be visible after click");

        // 20.3 Verify default instructions are rendered in the DOM
        const items = document.querySelectorAll('.guide-item');
        assert(items.length === 5, "Should display exactly 5 task items in the guide");
        
        // Find Piano Practice in guide
        const pianoItem = Array.from(items).find(el => el.querySelector('.guide-item-name').textContent === 'Piano Practice');
        assert(pianoItem !== undefined, "Piano Practice should be in the guide list");
        assert(pianoItem.querySelector('.guide-item-instructions').textContent === 'Play all pieces 3x and work on hard parts.', 
          "Piano Practice instructions should match defaults");

        // Find Reading Time in guide
        const readingItem = Array.from(items).find(el => el.querySelector('.guide-item-name').textContent === 'Reading Time');
        assert(readingItem !== undefined, "Reading Time should be in the guide list");
        assert(readingItem.querySelector('.guide-item-instructions').textContent === '15min reading out loud w/30s summary.',
          "Reading Time instructions should match defaults");

        // 20.4 Close guide modal
        const closeGuideBtn = document.getElementById('close-guide-modal-btn');
        assert(closeGuideBtn !== null, "Close Guide button should exist");
        closeGuideBtn.click();
        await sleep(100);
        assert(guideModal.classList.contains('hidden'), "Guide modal should be hidden after closing");

        // 20.5 Test Admin Panel integration
        // Open Admin Panel
        const adminBtn = document.getElementById('admin-btn');
        adminBtn.click();
        await sleep(100);
        
        // Enter password
        const passwordInput = document.getElementById('password-input');
        const passwordSubmit = document.getElementById('password-submit-btn');
        passwordInput.value = window.__test_helpers__.ADMIN_PASSWORD;
        passwordSubmit.click();
        await sleep(100);

        const adminModal = document.getElementById('admin-modal');
        assert(adminModal && !adminModal.classList.contains('hidden'), "Admin modal should be open");

        // Locate Piano instructions input in Admin Panel
        const adminTaskItems = document.querySelectorAll('.admin-task-item');
        const pianoAdminItem = Array.from(adminTaskItems).find(el => el.querySelector('.task-name-input').value === 'Piano Practice');
        assert(pianoAdminItem !== undefined, "Piano Practice task item should exist in Admin Panel");
        
        const pianoInstInput = pianoAdminItem.querySelector('.task-instructions-input');
        assert(pianoInstInput !== null, "Piano Practice instructions input should exist in Admin Panel");
        assert(pianoInstInput.value === 'Play all pieces 3x and work on hard parts.', "Admin input value should match current instructions");

        // Change instructions
        pianoInstInput.value = "New custom piano instructions!";
        
        // Mock alert
        let alertMsg = "";
        const originalAlert = window.alert;
        window.alert = (msg) => { alertMsg = msg; };

        // Save tasks
        const saveBtn = document.getElementById('admin-save-tasks-btn');
        saveBtn.click();
        await sleep(100);

        assert(alertMsg.includes("Activities saved successfully"), "Should alert save confirmation");
        
        // Restore alert
        window.alert = originalAlert;

        // Close admin panel
        const closeAdminBtn = document.getElementById('close-admin-modal-btn');
        closeAdminBtn.click();
        await sleep(100);

        // Open Guide again and verify updated instructions are rendered
        openGuideBtn.click();
        await sleep(100);
        
        const itemsUpdated = document.querySelectorAll('.guide-item');
        const pianoItemUpdated = Array.from(itemsUpdated).find(el => el.querySelector('.guide-item-name').textContent === 'Piano Practice');
        assert(pianoItemUpdated !== undefined, "Piano Practice should exist in guide");
        assert(pianoItemUpdated.querySelector('.guide-item-instructions').textContent === 'New custom piano instructions!', 
          "Guide should display updated instructions");

        // Close guide
        closeGuideBtn.click();
        await sleep(100);

        // Clean up
        window.__test_helpers__.resetState();
        await sleep(100);
        state = window.__app_state__;
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
