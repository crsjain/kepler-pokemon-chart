(function() {
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
      // 1. Reset state to clean V8 default
      if (window.__test_helpers__ && window.__test_helpers__.resetState) {
        window.__test_helpers__.resetState();
      } else {
        throw new Error("Test helpers not available");
      }

      const state = window.__app_state__;
      assert(state.version === 8, "State version should be 8");
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
      window.prompt = () => "0130"; // Admin password bypass
      mocksActive = true;
      
      // Click Admin Button to open
      const adminBtn = document.getElementById('admin-btn');
      adminBtn.click();
      
      const adminModal = document.getElementById('admin-modal');
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

      // 7. Test Focused Active Day Column Restrictions
      console.log("Testing Focused Active Day Column Restrictions...");
      // Let's set active day to 3 (Wednesday)
      state.activeDay = 3;
      window.__test_helpers__.renderState(false);

      // Verify Wednesday header is active
      const wedHeader = document.querySelector('.day-header[data-day="3"]');
      assert(wedHeader && wedHeader.classList.contains('active-day'), "Wednesday header should have active-day class");

      // Verify Thursday header is NOT active
      const thuHeader = document.querySelector('.day-header[data-day="4"]');
      assert(thuHeader && !thuHeader.classList.contains('active-day'), "Thursday header should NOT have active-day class");

      // Verify cells on Wednesday are active, Thursday are not
      const wedCell = document.querySelector('.task-row[data-task="piano"] td.checkbox-cell:nth-child(5)');
      assert(wedCell && wedCell.classList.contains('active-column'), "Wednesday cell should have active-column class");
      
      const thuCell = document.querySelector('.task-row[data-task="piano"] td.checkbox-cell:nth-child(6)');
      assert(thuCell && !thuCell.classList.contains('active-column'), "Thursday cell should NOT have active-column class");

      // Try checking Thursday Piano checkbox (should be blocked)
      const thuCb = document.querySelector('input[data-day="4"][data-task="piano"]');
      assert(thuCb !== null, "Thursday checkbox should exist");
      thuCb.click();
      await sleep(100);
      assert(thuCb.checked === false, "Thursday checkbox click should be blocked (checked=false)");
      assert(state.grid['4-piano'] === undefined, "Thursday task should NOT be in state grid");

      // Try checking Wednesday Piano checkbox (should be allowed)
      const wedCb = document.querySelector('input[data-day="3"][data-task="piano"]');
      assert(wedCb !== null, "Wednesday checkbox should exist");
      wedCb.click();
      await sleep(100);
      assert(wedCb.checked === true, "Wednesday checkbox click should be allowed (checked=true)");
      assert(state.grid['3-piano'] === true, "Wednesday task should be saved to state grid");

      // Switch active day to Thursday by clicking header
      thuHeader.click();
      await sleep(100);
      assert(state.activeDay === 4, "Active day should switch to Thursday (4) on header click");
      assert(thuHeader.classList.contains('active-day'), "Thursday header should now have active-day class");
      assert(thuCell.classList.contains('active-column'), "Thursday cell should now have active-column class");
      assert(!wedCell.classList.contains('active-column'), "Wednesday cell should no longer have active-column class");

      // Check Thursday Piano again (should now be allowed!)
      thuCb.click();
      await sleep(100);
      assert(thuCb.checked === true, "Thursday checkbox click should now be allowed (checked=true)");
      assert(state.grid['4-piano'] === true, "Thursday task should now be saved to state grid");

      // Cleanup: revert checkbox clicks
      thuCb.click();
      await sleep(50);
      state.activeDay = 3;
      window.__test_helpers__.renderState(false);
      wedCb.click();
      await sleep(50);

      console.log("🎉 All regression tests passed successfully! Grid performance is optimized.");
      alert("🎉 All regression tests passed successfully!\nGrid rebuild count remained at 1 during checks.");
    } catch (e) {
      restoreMocks(); // Ensure mocks are restored on failure so alert works
      console.error("❌ Test Suite Failed:", e);
      alert("❌ Test Suite Failed: " + e.message);
    }
  }

  setTimeout(runSuite, 1000);
})();
