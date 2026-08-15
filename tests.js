import { getStarsFromDates } from './vault.js';
import { saveState, rollNewWeeklyBadge, getDefaultStateTemplate, DAYS, getTaskRequiredDays } from './state.js';
import { getSunday, formatLocalDate, getDateOfColumn, getWeekStart, getLocalDate } from './date_utils.js';
import { runMigrations } from './migrations.js';
import { POKEMON_TYPES, LEGENDARY_POKEMON_IDS, getPokemonName } from './pokemon_data.js';

function getGridKey(dayIndex, taskId) {
  return `${getDateOfColumn(window.__app_state__.weekStartDate, dayIndex)}-${taskId}`;
}

console.log("🚀 Starting Kepler Chart Regression Tests...");

function assert(condition, message) {
  if (!condition) {
    console.error("❌ Assert Failed: " + message);
    throw new Error(message);
  } else {
    console.log("✅ Passed: " + message);
  }
}

function sleep(ms, force = false) {
  const isHeadless = location.search.includes('headless=true');
  const scale = (isHeadless && !force) ? 0.2 : 1.0;
  return new Promise(resolve => setTimeout(resolve, ms * scale));
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
    console.log("DEBUG: state before assert:", JSON.stringify(state));
    assert(state.version === 18, "State version should be 18 (actual: " + state.version + ")");
    assert(state.weeklyClaimed === false, "Weekly claimed should be false");
    assert(window.__grid_rebuild_count__ === 1, `Grid should have been built exactly once on reset (actual: ${window.__grid_rebuild_count__})`);

      // Verify initial UI state
      const xpText = document.getElementById('current-xp').textContent;
      assert(xpText === '0', "Initial XP should be 0");

      // Verify Version Indicator
      const versionLabel = document.getElementById('app-version-label');
      assert(versionLabel !== null, "App version indicator should exist");
      assert(versionLabel.textContent.includes('v1.8.0'), "App version label should display v1.8.0");
      
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

      assert(state.grid[getGridKey(0, 'piano')] === true, "State should record checked task");
      assert(document.getElementById('current-xp').textContent === '5', "XP should increase to 5");
      assert(window.__grid_rebuild_count__ === 1, "Grid should NOT have rebuilt after checking a box");

      // Click it again (Uncheck)
      firstCheckbox.click();
      await sleep(100);
      assert(state.grid[getGridKey(0, 'piano')] === false, "State should record unchecked task");
      assert(document.getElementById('current-xp').textContent === '0', "XP should decrease back to 0");
      assert(window.__grid_rebuild_count__ === 1, "Grid should NOT have rebuilt after unchecking a box");

      // 3. Test Eevee Evolution Flow
      console.log("Testing Eevee Evolution Dialog...");
      
      // Programmatically switch to Eevee
      state.activePartnerInstanceId = '133';
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

      // Restore back to Pichu for subsequent tests
      state.activePartnerInstanceId = '172';
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
      const emojiSelect = newItem.querySelector('.task-emoji-select');
      
      nameInput.value = "Science Project";
      emojiSelect.value = "🧪";

      // Save activities
      const adminSaveTasksBtn = document.getElementById('admin-save-tasks-btn');
      adminSaveTasksBtn.click();
      await sleep(100);

      const notifModals = document.querySelectorAll('.notif-modal');
      const saveNotifModal = notifModals[notifModals.length - 1];
      assert(saveNotifModal !== undefined && saveNotifModal !== null, "Custom notification modal should appear after saving activities");
      assert(saveNotifModal.textContent.includes("Activities saved successfully"), "Should display save confirmation in modal");
      const notifCloseBtn = saveNotifModal.querySelector('.notif-close-btn');
      if (notifCloseBtn) notifCloseBtn.click();
      saveNotifModal.remove();
      await sleep(100);

      assert(window.__grid_rebuild_count__ === 2, "Grid should have rebuilt to show new task (count: 2)");

      // Check task in grid
      const gridTbody = document.getElementById('grid-tbody');
      const rows = gridTbody.querySelectorAll('.task-row');
      let newRow = null;
      rows.forEach(row => {
        if (row.querySelector('.task-name').textContent === "Science Project") {
          newRow = row;
        }
      });
      assert(newRow !== null, "New task row should render in the grid");
      const newTaskId = newRow.dataset.task;
      assert(newTaskId === "science-project", "Task ID should be slugified to science-project");

      // Check the new task box
      const todayDayIndex = (new Date().getDay() - state.weekStartDay + 7) % 7;
      const newCb = gridTbody.querySelector(`input[data-day="${todayDayIndex}"][data-task="${newTaskId}"]`);
      assert(newCb !== null, "New checkbox should exist for today");
      state.activeDay = new Date().getDay();
      window.__test_helpers__.renderState(false);
      newCb.click();
      await sleep(100);

      assert(state.grid[getGridKey(todayDayIndex, newTaskId)] === true, "State should record new task check");
      const actualGoalText = newRow.querySelector('.task-total-cell').textContent;
      const expectedReq = getTaskRequiredDays(newTaskId);
      assert(actualGoalText === `1 / ${expectedReq}`, `Goal column should show 1/${expectedReq} (actual: "${actualGoalText}")`);

      // Delete task in Admin (re-query after list re-renders to get new ID in DOM)
      const updatedItems = taskList.querySelectorAll('.admin-task-item');
      let updatedNewItem = null;
      updatedItems.forEach(item => {
        if (item.querySelector('.task-name-input').value === "Science Project") {
          updatedNewItem = item;
        }
      });
      assert(updatedNewItem !== null, "Science Project item should exist in admin list after save");
      assert(updatedNewItem.dataset.taskId === "science-project", "Admin list item should have updated task ID");

      const deleteBtn = updatedNewItem.querySelector('.remove-task-btn');
      deleteBtn.click(); // Auto-confirms
      await sleep(100);

      // Save deletion
      adminSaveTasksBtn.click();
      await sleep(100);

      assert(window.__grid_rebuild_count__ === 3, "Grid should rebuild after deletion (count: 3)");
      const deletedRow = gridTbody.querySelector(`.task-row[data-task="${newTaskId}"]`);
      assert(deletedRow !== null, "Row should STILL render in current week grid after soft-deletion");
      if (todayDayIndex < 6) {
        const nextCb = gridTbody.querySelector(`input[data-day="${todayDayIndex + 1}"][data-task="${newTaskId}"]`);
        assert(nextCb && nextCb.disabled === true, "Checkbox for days after deletion should be disabled");
        assert(nextCb.closest('.checkbox-cell').classList.contains('out-of-range-cell'), "Cell for days after deletion should be greyed out");
      }
      assert(state.grid[getGridKey(todayDayIndex, newTaskId)] === true, "Checked history for soft-deleted task should be preserved");

      // 5. Test State Diagnostics (Auto-Repair)
      console.log("Testing State Diagnostics...");
      
      // Corrupt state
      state.partnersData['172'].xp = 180; // Invalid XP
      state.partnersData['172'].stageId = 'invalid_id'; // Invalid evolution stage ID

      // Run Diagnostics via admin button
      const adminDiagnosticsBtn = document.getElementById('admin-diagnostics-btn');
      adminDiagnosticsBtn.click();
      await sleep(200);

      // Verify heals
      assert(state.partnersData['172'].xp === 99, "XP should clamp to 99");
      assert(state.partnersData['172'].stageId === '172', "Stage ID should recover to default Pichu");

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
      state.activeDay = 0;
      window.__test_helpers__.renderState(false);
      const pianoCb = document.querySelector('input[data-day="0"][data-task="piano"]');
      if (pianoCb && !pianoCb.checked) pianoCb.click();
      await sleep(50);
      assert(state.grid[getGridKey(0, 'piano')] === true, "Piano checkbox should be checked before reset");

      // 1st click on Reset button
      resetBtn.click();
      await sleep(100);
      assert(confirmModal && !confirmModal.classList.contains('hidden'), "Confirm Modal should open on 1st Reset click");
      confirmYesBtn.click();
      await sleep(100);
      assert(confirmModal.classList.contains('hidden'), "Confirm Modal should close after confirmation");
      assert(state.grid[getGridKey(0, 'piano')] === undefined, "Grid should be cleared after 1st reset");

      // Check a box again
      const todayCol = (state.activeDay - state.weekStartDay + 7) % 7;
      const pianoCb2 = document.querySelector(`input[data-day="${todayCol}"][data-task="piano"]`);
      if (pianoCb2 && !pianoCb2.checked) pianoCb2.click();
      await sleep(50);
      assert(state.grid[getGridKey(todayCol, 'piano')] === true, "Piano checkbox should be checked again");

      // 2nd click on Reset button (Subsequent click!)
      resetBtn.click();
      await sleep(100);
      assert(confirmModal && !confirmModal.classList.contains('hidden'), "Confirm Modal should open on 2nd (subsequent) Reset click");
      confirmYesBtn.click();
      await sleep(100);
      assert(confirmModal.classList.contains('hidden'), "Confirm Modal should close after 2nd confirmation");
      assert(state.grid[getGridKey(todayCol, 'piano')] === undefined, "Grid should be cleared after 2nd reset");

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
        assert(state.grid[getGridKey(otherDay2, 'piano')] === undefined, "Inactive task should NOT be in state grid");

        // Try checking active checkbox (should be allowed)
        const cb1 = document.querySelector(`input[data-day="${otherDay1}"][data-task="piano"]`);
        assert(cb1 !== null, "Active checkbox should exist");
        cb1.click();
        await sleep(100);
        assert(cb1.checked === true, "Active checkbox click should be allowed");
        assert(state.grid[getGridKey(otherDay1, 'piano')] === true, "Active task should be saved to state grid");

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
        assert(dailyTotalCell.querySelector('.badge-indicator').classList.contains('unlocked'), "Daily indicator should be unlocked");

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

      // 10. Test Pokémon Partner Shop & Hold-to-Unlock
      {
        console.log("Testing Pokémon Partner Shop & Hold-to-Unlock...");
        window.__test_helpers__.resetState();
        state = window.__app_state__;
        
        // Inject 1 star (remaining is 1)
        state.starVault.earnedDates = ['2026-07-01'];
        state.starVault.totalTraded = 0;
        saveState();

        // Open Vault Modal
        const openVaultBtn = document.getElementById('open-vault-btn');
        assert(openVaultBtn !== null, "Vault button should exist");
        openVaultBtn.click();
        await sleep(100);

        const vaultTradeOpenBtn = document.getElementById('vault-trade-open-btn');
        assert(vaultTradeOpenBtn !== null, "Spend button should exist");
        
        // Click Spend -> should close vault and open shop
        vaultTradeOpenBtn.click();
        await sleep(100);

        const vaultModal = document.getElementById('vault-modal');
        const shopModal = document.getElementById('pokemon-shop-modal');
        assert(vaultModal.classList.contains('hidden'), "Vault modal should close when opening shop");
        assert(shopModal && !shopModal.classList.contains('hidden'), "Shop modal should open");

        // Verify Shop Browse Screen
        const browseScreen = document.getElementById('shop-screen-browse');
        const confirmScreen = document.getElementById('shop-screen-confirm');
        assert(browseScreen && !browseScreen.classList.contains('hidden'), "Browse screen should be visible");
        assert(confirmScreen && confirmScreen.classList.contains('hidden'), "Confirm screen should be hidden");

        const shopAvailableStars = document.getElementById('shop-available-stars');
        assert(shopAvailableStars.textContent === '1', "Shop should report 1 star");

        // Verify cards are locked
        const firstCard = document.querySelector('.shop-item-card');
        assert(firstCard && firstCard.classList.contains('locked'), "Cards should be locked when stars < 10");

        // Click a card (Mew - ID 151)
        const mewCard = document.querySelector('.shop-item-card[data-id="151"]');
        assert(mewCard !== null, "Mew card should exist in shop");
        mewCard.click();
        await sleep(100);

        assert(browseScreen.classList.contains('hidden'), "Browse screen should hide on card selection");
        assert(!confirmScreen.classList.contains('hidden'), "Confirm screen should show on card selection");

        const holdBtn = document.getElementById('shop-hold-unlock-btn');
        assert(holdBtn && holdBtn.disabled, "Hold button should be disabled when stars < 10");
        const holdBtnText = document.getElementById('shop-hold-btn-text');
        assert(holdBtnText && holdBtnText.textContent.includes("Earn 14 more stars"), "Hold button should show needed stars for Mew (15 Stars)");

        // Click Back
        const backBtn = document.getElementById('back-to-browse-btn');
        backBtn.click();
        await sleep(100);
        assert(!browseScreen.classList.contains('hidden'), "Should go back to browse screen");
        
        // Close Shop
        const closeShopBtn = document.getElementById('close-shop-modal-btn');
        closeShopBtn.click();
        await sleep(100);
        assert(shopModal.classList.contains('hidden'), "Shop modal should close");

        // Inject 15 stars (remaining is 15)
        state.starVault.earnedDates = Array.from({length: 15}, (_, i) => `2026-07-${10+i}`);
        state.starVault.totalTraded = 0;
        saveState();

        // Open Shop directly
        window.__test_helpers__.openPokemonShop();
        await sleep(100);
        assert(!shopModal.classList.contains('hidden'), "Shop modal should open");
        assert(shopAvailableStars.textContent === '15', "Shop should report 15 stars");

        // Verify cards are affordable
        const newFirstCard = document.getElementById('shop-items-grid').querySelector('.shop-item-card');
        assert(newFirstCard && newFirstCard.classList.contains('affordable'), "Cards should be affordable when stars >= 15");

        // Select Mew again
        const mewCardAffordable = document.querySelector('.shop-item-card[data-id="151"]');
        mewCardAffordable.click();
        await sleep(100);

        assert(!holdBtn.disabled, "Hold button should be enabled when stars >= 15");
        assert(holdBtnText.textContent === 'Hold Down to Unlock! 🔓', "Hold button text should be ready");

        // Test early release (hold for 100ms < 300ms)
        const initialPartnerCount = Object.keys(state.partnersData).length;
        
        holdBtn.dispatchEvent(new MouseEvent('mousedown'));
        await sleep(100);
        holdBtn.dispatchEvent(new MouseEvent('mouseleave')); // cancel
        await sleep(100);

        assert(Object.keys(state.partnersData).length === initialPartnerCount, "Should not unlock if released early");

        // Test full hold (400ms > 300ms)
        holdBtn.dispatchEvent(new MouseEvent('mousedown'));
        await sleep(400); // Wait for hold to complete

        // Verify that the animation overlay opened
        const animOverlay = document.getElementById('shop-unlock-animation-overlay');
        assert(animOverlay && !animOverlay.classList.contains('hidden'), "Unlock animation overlay should be visible");
        
        // Wait for animation to finish in test mode
        await sleep(1500, true);
        
        // Overlay should now be hidden again
        assert(animOverlay.classList.contains('hidden'), "Animation overlay should close when done");
        
        // State should be committed
        assert(state.starVault.totalTraded === 15, "Should have spent 15 stars for Mew");
        
        const partnerKeys = Object.keys(state.partnersData);
        assert(partnerKeys.length === initialPartnerCount + 1, "Should have added 1 new partner instance");
        
        const newInstanceId = state.activePartnerInstanceId;
        assert(state.partnersData[newInstanceId].familyId === '151', "Active partner should be Mew (151)");
        assert(state.partnersData[newInstanceId].level === 1, "New partner level should be 1");

        assert(shopModal.classList.contains('hidden'), "Shop modal should close after successful unlock");

        // 11. Test Case 11: Badge Case & Collection
        console.log("Running Test Case 11: Badge Case & Collection...");
        
        // Verify state initial V10 fields
        assert(state.version === 18, "State version should be 18");
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
        
        assert(migratedState.version === 18, "Migrated state version should be 18");
        assert(migratedState.idleTimeout === 10, "Migrated state should have default idleTimeout 10");
        assert(Array.isArray(migratedState.weeklyRewardOptions), "weeklyRewardOptions should be initialized on migration");
        assert(Array.isArray(migratedState.megaRewardOptions), "megaRewardOptions should be initialized on migration");
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
        
        assert(migratedState.version === 18, "Migrated state version should be 18");
        assert(migratedState.idleTimeout === 10, "Migrated state should have default idleTimeout 10");
        assert(Array.isArray(migratedState.weeklyRewardOptions), "weeklyRewardOptions should be initialized on migration");
        assert(Array.isArray(migratedState.megaRewardOptions), "megaRewardOptions should be initialized on migration");
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
          const allChecked = tasks.length > 0 && tasks.every(task => !!state.grid[getGridKey(d, task.id)]);
          assert(allChecked === true, `Day ${d} should be fully checked after Milestone -1 Ball`);
          
          // Total cell should show 🌟
          const totalCell = document.querySelector(`.day-total-cell[data-day="${d}"] .badge-indicator`);
          assert(totalCell && totalCell.classList.contains('unlocked'), `Day ${d} total cell should be unlocked`);
        }

        // Verify stars in vault matches!
        assert(state.starVault.earnedDates.length === 6, "Star Vault should have 6 earned dates after Milestone -1 click");

        // Verify UI stats in Vault Modal match
        window.__test_helpers__.renderVault();
        const statEarned = document.getElementById('vault-stat-earned');
        const statRemaining = document.getElementById('vault-stat-remaining');
        assert(statEarned && statEarned.textContent === '6', "Vault stats Earned should show 6");
        assert(statRemaining && statRemaining.textContent === '6', "Vault stats Remaining should show 6");

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
            { id: 'piano', name: 'Piano Practice' },
            { id: 'math', name: 'Math Practice' },
            { id: 'reading', name: 'Reading Time' },
            { id: 'writing', name: 'Writing' },
            { id: 'chinese', name: 'Chinese' }
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
            state.grid[getGridKey(d, task.id)] = true;
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
        
        // Grid should be empty for the new week
        const nextWeekDates = DAYS.map(day => getDateOfColumn(state.weekStartDate, day));
        const hasProgressInNewWeek = nextWeekDates.some(dateStr => {
          return state.tasks.some(task => !!state.grid[`${dateStr}-${task.id}`]);
        });
        assert(hasProgressInNewWeek === false, "New week's grid should be empty after week reset");
        
        // Old week keys should still exist in grid history
        const oldWeekDates = DAYS.map(day => getDateOfColumn(originalSunday, day));
        let oldKeysCount = 0;
        oldWeekDates.forEach(dateStr => {
          state.tasks.forEach(task => {
            if (state.grid[`${dateStr}-${task.id}`]) oldKeysCount++;
          });
        });
        assert(oldKeysCount === 25, "Old week completions should be preserved in grid history");
        
        // Vault should still have 5 historical stars from last week
        assert(state.starVault.earnedDates.length === 5, `Vault should retain 5 historical stars (actual: ${state.starVault.earnedDates.length})`);

        // Click Milestone -1 ball button (populates Days 0 to 4 in new week)
        const testMilestoneBtn = document.getElementById('test-milestone-minus-one');
        assert(testMilestoneBtn !== null, "Milestone -1 Ball button should exist");
        testMilestoneBtn.click();
        await sleep(100);
        state = window.__app_state__;

        // Verify vault has 11 stars! (5 from previous week, 6 from current week)
        assert(state.starVault.earnedDates.length === 11, `Vault should now contain exactly 11 stars (actual: ${state.starVault.earnedDates.length})`);

        // Open vault modal and check UI counters
        window.__test_helpers__.renderVault();
        const statEarned = document.getElementById('vault-stat-earned');
        const statRemaining = document.getElementById('vault-stat-remaining');
        assert(statEarned && statEarned.textContent === '11', "Vault UI Earned should display 11");
        assert(statRemaining && statRemaining.textContent === '11', "Vault UI Remaining should display 11");

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
        assert(state.excused[getGridKey(3, 'piano')] === true, "State should have 3-piano excused");
        assert(state.grid[getGridKey(3, 'piano')] === false, "State grid for 3-piano should be false (auto-cleared)");
        assert(wedPianoInput.checked === false, "Checkbox should be unchecked");
        assert(state.activeDay === 1, "Active day should remain Monday (1) after excusing Wednesday task");
        
        // Verify dynamic denominator calculation
        const pianoRow = document.querySelector('.task-row[data-task="piano"]');
        const pianoTotalCell = pianoRow.querySelector('.task-total-cell');
        assert(pianoTotalCell.textContent === "0 / 6", `Piano goal column should show 0/6 (actual: "${pianoTotalCell.textContent}")`);
        
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
        assert(indicator && indicator.classList.contains('unlocked'), "Wednesday should show unlocked indicator");
        
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
        assert(state.excused[getGridKey(3, 'piano')] === true, "3-piano should still be excused after reset with carry over");
        
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
        assert(state.excused[getGridKey(3, 'piano')] === undefined, "3-piano should be cleared after reset without carry over");
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
        assert(state.grid[getGridKey(3, 'piano')] !== true, "State grid should not be updated");
        
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
        assert(state.grid[getGridKey(3, 'piano')] === true, "Wednesday Piano should be checked in State after switch");
        
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
          state.grid[getGridKey(2, task.id)] = true;
        });
        saveState();
        window.__test_helpers__.syncVaultStarsWithGrid();
        await sleep(50);

        // Complete Monday (day 1)
        tasks.forEach(task => {
          state.grid[getGridKey(1, task.id)] = true;
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

        const notifModals = document.querySelectorAll('.notif-modal');
        const saveNotifModal = notifModals[notifModals.length - 1];
        assert(saveNotifModal !== undefined && saveNotifModal !== null, "Custom notification modal should appear after saving activities");
        assert(saveNotifModal.textContent.includes("Activities saved successfully"), "Should display save confirmation in modal");
        const notifCloseBtn = saveNotifModal.querySelector('.notif-close-btn');
        if (notifCloseBtn) notifCloseBtn.click();
        saveNotifModal.remove();
        await sleep(100);

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

      // 21. Test Week Start Day Setting & Dynamic Headers
      console.log("Running Test Case 21: Week Start Day Setting & Dynamic Headers...");
      {
        // Open Admin Panel
        const adminBtn = document.getElementById('admin-btn');
        adminBtn.click();
        await sleep(100);
        
        const passwordInput = document.getElementById('password-input');
        const passwordSubmit = document.getElementById('password-submit-btn');
        passwordInput.value = window.__test_helpers__.ADMIN_PASSWORD;
        passwordSubmit.click();
        await sleep(100);

        const adminModal = document.getElementById('admin-modal');
        assert(adminModal && !adminModal.classList.contains('hidden'), "Admin modal should be open");

        const select = document.getElementById('admin-week-start-select');
        assert(select !== null, "Week Start Day select should exist");
        assert(select.value === '0', "Default value should be 0 (Sunday)");

        // Change to Friday (5)
        select.value = '5';
        select.dispatchEvent(new Event('change'));
        await sleep(100);

        // Verify confirm modal opens
        const confirmModal = document.getElementById('confirm-modal');
        assert(confirmModal && !confirmModal.classList.contains('hidden'), "Confirm Modal should open on start day change");
        assert(confirmModal.querySelector('#confirm-title').textContent.includes("Change Week Start Day"), "Confirm title should match");

        // Click Cancel first
        const confirmNoBtn = document.getElementById('confirm-no-btn');
        confirmNoBtn.click();
        await sleep(100);

        assert(select.value === '0', "Select value should revert to 0 after cancel");
        assert(state.weekStartDay === 0, "State weekStartDay should remain 0");

        // Change to Friday again and confirm
        select.value = '5';
        select.dispatchEvent(new Event('change'));
        await sleep(100);

        const confirmYesBtn = document.getElementById('confirm-yes-btn');
        confirmYesBtn.click();
        await sleep(100);

        state = window.__app_state__; // Refresh reference after reset
        assert(state.weekStartDay === 5, "State weekStartDay should be updated to 5");
        assert(select.value === '5', "Select value should remain 5");

        // Verify UI Headers are updated
        const headers = document.querySelectorAll('.day-header');
        const expectedHeaders = ['FRI', 'SAT', 'SUN', 'MON', 'TUE', 'WED', 'THU'];
        headers.forEach((th, index) => {
          assert(th.textContent === expectedHeaders[index], `Header ${index} should be ${expectedHeaders[index]}, got ${th.textContent}`);
          assert(parseInt(th.dataset.day) === index, `Header ${index} data-day should be ${index}`);
        });

        // Now test the warning path when there is weekly progress
        // Close admin first to test complete user flow
        const closeAdminBtn = document.getElementById('close-admin-modal-btn');
        closeAdminBtn.click();
        await sleep(100);
        
        // Select rewards (needed to check boxes)
        const rewardSelect = document.getElementById('reward-select');
        const megaRewardSelect = document.getElementById('mega-reward-select');
        rewardSelect.value = "Blanket Fort";
        rewardSelect.dispatchEvent(new Event('change'));
        megaRewardSelect.value = "Dessert Outing";
        megaRewardSelect.dispatchEvent(new Event('change'));
        await sleep(50);
        
        // Check a task to make progress (must match state.activeDay to avoid switch day confirm dialog)
        const targetDataDay = (state.activeDay - 5 + 7) % 7;
        const targetCheckbox = document.querySelector(`input[data-day="${targetDataDay}"][data-task="piano"]`);
        assert(targetCheckbox !== null, `Checkbox for day index ${targetDataDay} should exist`);
        targetCheckbox.click();
        await sleep(100);
        
        state = window.__app_state__;
        assert(Object.keys(state.grid).length > 0, "Grid should have progress");
        
        // Re-open Admin Panel
        adminBtn.click();
        await sleep(100);
        
        const passwordInput2 = document.getElementById('password-input');
        const passwordSubmit2 = document.getElementById('password-submit-btn');
        passwordInput2.value = window.__test_helpers__.ADMIN_PASSWORD;
        passwordSubmit2.click();
        await sleep(100);
        
        // Change back to Sunday (0)
        select.value = '0';
        select.dispatchEvent(new Event('change'));
        await sleep(100);
        
        // Verify detailed warning modal is shown
        assert(confirmModal && !confirmModal.classList.contains('hidden'), "Warning Confirm Modal should open");
        const confirmDetail = confirmModal.querySelector('.confirm-detail');
        assert(confirmDetail !== null, "Should render detailed HTML warning when progress exists");
        
        // Confirm change
        confirmYesBtn.click();
        await sleep(100);
        
        state = window.__app_state__;
        assert(state.weekStartDay === 0, "State weekStartDay should be updated to 0");
        assert(Object.keys(state.grid).length > 0, "Grid should NOT be reset after mid-week start day change");
        
        // Close admin panel
        closeAdminBtn.click();
        await sleep(100);

        // Clean up (reset back to Sunday start)
        window.__test_helpers__.resetState();
        await sleep(100);
        state = window.__app_state__;
      }

      // 22. Test Streak Calculation with Friday Start
      console.log("Running Test Case 22: Streak Calculation with Friday Start...");
      {
        // Setup state with Friday start
        const template = window.__test_helpers__.loadState ? getDefaultStateTemplate() : {}; // getDefaultStateTemplate is imported
        template.weekStartDay = 5; // Friday
        template.weekStartDate = '2026-07-17'; // A Friday
        
        // Empty grid and vault
        template.grid = {};
        template.starVault = { earnedDates: [], totalTraded: 0 };
        
        // We need to use state.js replaceState but we don't have it direct?
        // Wait, tests.js doesn't import replaceState.
        // But app.js test helpers has resetState which loads default.
        // We can just modify the state in place and save it?
        // Yes, we have window.__app_state__ (which is state).
        // Let's modify it.
        state.weekStartDay = 5;
        state.weekStartDate = '2026-07-17';
        state.grid = {};
        state.starVault = { earnedDates: [], totalTraded: 0 };
        
        saveState(); // Imported from state.js
        window.__test_helpers__.renderState(true);
        await sleep(100);

        // Complete Day 0 (Column 0, which is Friday 2026-07-17)
        const tasks = state.tasks || [];
        tasks.forEach(task => {
          state.grid[getGridKey(0, task.id)] = true;
        });
        
        window.__test_helpers__.syncVaultStarsWithGrid();
        saveState();
        window.__test_helpers__.renderState(false);
        await sleep(100);

        // Verify Friday is in earnedDates
        assert(state.starVault.earnedDates.includes('2026-07-17'), "Friday 2026-07-17 should be in earnedDates");

        // Complete Day 1 (Column 1, which is Saturday 2026-07-18)
        tasks.forEach(task => {
          state.grid[getGridKey(1, task.id)] = true;
        });
        window.__test_helpers__.syncVaultStarsWithGrid();
        saveState();
        window.__test_helpers__.renderState(false);
        await sleep(100);

        // Verify Saturday is in earnedDates
        assert(state.starVault.earnedDates.includes('2026-07-18'), "Saturday 2026-07-18 should be in earnedDates");

        // Verify streak in Vault
        const stars = getStarsFromDates(state.starVault.earnedDates); // Imported from vault.js
        assert(stars.length === 2, "Should have 2 stars");
        assert(stars[0].date === '2026-07-17' && stars[0].streakDay === 1 && stars[0].color === 'yellow', "Day 1 should be yellow, streak 1");
        assert(stars[1].date === '2026-07-18' && stars[1].streakDay === 2 && stars[1].color === 'yellow', "Day 2 should be yellow, streak 2");

        // Clean up
        window.__test_helpers__.resetState();
        await sleep(100);
        state = window.__app_state__;
      }

      // 23. Test Admin Profiles List Rendering & Deletion Flow
      console.log("Running Test Case 23: Admin Profiles List Rendering & Deletion Flow...");
      {
        const helpers = window.__test_helpers__;
        
        // Mock profiles
        helpers.setProfilesList([
          { id: 'profile_1', name: 'Test Child 1', avatarId: '25' },
          { id: 'profile_2', name: 'Test Child 2', avatarId: '6' }
        ]);
        
        helpers.renderAdminProfilesList();
        
        const container = document.getElementById('admin-profiles-list');
        assert(container, "Profiles list container should exist in DOM");
        const items = container.querySelectorAll('.admin-profile-item');
        assert(items.length === 2, `Should render exactly 2 profile items, got ${items.length}`);
        
        assert(items[0].querySelector('.admin-profile-name').textContent.includes('Test Child 1'), "First profile name should match");
        assert(items[1].querySelector('.admin-profile-name').textContent.includes('Test Child 2'), "Second profile name should match");
        
        // Mock delete database call
        let deletedProfileId = null;
        helpers.setDeleteChildProfileMock((id) => {
          deletedProfileId = id;
          return Promise.resolve();
        });
        
        // Sim click delete for profile_1
        const deleteBtn = items[0].querySelector('.delete-profile-btn');
        assert(deleteBtn, "Delete button should exist for Test Child 1");
        deleteBtn.click();
        
        // Check confirmation modal layout
        const confirmModal = document.getElementById('confirm-modal');
        assert(confirmModal && !confirmModal.classList.contains('hidden'), "Confirm Modal should be open on delete click");
        
        const confirmYesBtn = document.getElementById('confirm-yes-btn');
        const confirmNoBtn = document.getElementById('confirm-no-btn');
        
        // Check UX updates: Delete/Cancel texts
        assert(confirmYesBtn.textContent === "Delete 🗑️", `Yes button text should be Delete, got ${confirmYesBtn.textContent}`);
        assert(confirmNoBtn.textContent === "Cancel", `No button text should be Cancel, got ${confirmNoBtn.textContent}`);
        assert(confirmYesBtn.classList.contains('danger'), "Yes button should have pixel-btn danger class (Red)");
        
        // Confirm deletion
        confirmYesBtn.click();
        await sleep(100);
        
        assert(deletedProfileId === 'profile_1', `Mock delete should have been called with profile_1, got ${deletedProfileId}`);
        
        // Clean up
        helpers.setProfilesList([]);
        helpers.setDeleteChildProfileMock(null); // Restore original
        helpers.renderAdminProfilesList();
      }

      // 24. Test Cloud Export & Import UI wiring
      console.log("Running Test Case 24: Cloud Export & Import UI wiring...");
      {
        const helpers = window.__test_helpers__;
        
        // Mock Clipboard
        let clipboardContent = null;
        const originalClipboard = navigator.clipboard;
        Object.defineProperty(navigator, 'clipboard', {
          value: {
            writeText: (text) => {
              clipboardContent = text;
              return Promise.resolve();
            }
          },
          configurable: true,
          writable: true
        });
        
        // Mock appCallbacks
        let exportCalled = false;
        let importCalledWith = null;
        
        const mockFamilyData = {
          profiles: {
            kepler_1234: { name: "Kepler", avatarId: "25", state: { version: 12 } }
          }
        };
        
        helpers.setExportCloudDataMock(() => {
          exportCalled = true;
          return Promise.resolve(mockFamilyData);
        });
        
        helpers.setImportCloudDataMock((data) => {
          importCalledWith = data;
          return Promise.resolve();
        });
        
        // Mock prompt to return the export string
        window.prompt = () => JSON.stringify(mockFamilyData);
        
        // Sim click Cloud Export
        const cloudExportBtn = document.getElementById('admin-cloud-export-btn');
        assert(cloudExportBtn, "Cloud Export button should exist");
        
        cloudExportBtn.click();
        await sleep(100);
        
        assert(exportCalled, "exportCloudData callback should have been called");
        assert(clipboardContent === JSON.stringify(mockFamilyData), "Clipboard content should match mock family data");
        
        // Sim click Cloud Import
        const cloudImportBtn = document.getElementById('admin-cloud-import-btn');
        assert(cloudImportBtn, "Cloud Import button should exist");
        
        cloudImportBtn.click();
        await sleep(100);
        
        // Custom confirm modal should be open
        const confirmModal = document.getElementById('confirm-modal');
        assert(confirmModal && !confirmModal.classList.contains('hidden'), "Confirm Modal should be open on import click");
        
        const confirmYesBtn = document.getElementById('confirm-yes-btn');
        assert(confirmYesBtn, "Confirm Yes button should exist");
        confirmYesBtn.click();
        await sleep(100);
        
        assert(importCalledWith !== null, "importCloudData callback should have been called");
        assert(JSON.stringify(importCalledWith) === JSON.stringify(mockFamilyData), "Imported data should match mock family data");
        
        // Clean up
        Object.defineProperty(navigator, 'clipboard', {
          value: originalClipboard,
          configurable: true
        });
        helpers.setExportCloudDataMock(null);
        helpers.setImportCloudDataMock(null);
        restoreMocks();
      }

      console.log("Running Test Case 25: Profile Modal Click-Outside Cancellation...");
      {
        const helpers = window.__test_helpers__;
        const profileSelectModal = document.getElementById('profile-select-modal');
        const switchProfileBtn = document.getElementById('switch-profile-btn');
        const appContainer = document.querySelector('.app-container');

        // Reset UI to clean state
        profileSelectModal.classList.add('hidden');
        appContainer.style.filter = 'none';
        appContainer.style.pointerEvents = 'auto';

        // 1. Click outside when active profile IS set -> modal should close
        helpers.setActiveProfileId('kepler_1234');
        switchProfileBtn.click();
        await sleep(100);
        
        assert(profileSelectModal.classList.contains('hidden') === false, "Profile select modal should open on switch profile click");
        assert(appContainer.style.filter === 'blur(10px)', "App container should be blurred when modal is open");

        // Simulate click outside (clicking the backdrop element directly)
        profileSelectModal.click();
        await sleep(100);

        assert(profileSelectModal.classList.contains('hidden') === true, "Profile select modal should close on click outside if profile is active");
        assert(appContainer.style.filter === 'none', "App container should unblur after modal closes");

        // 2. Click outside when active profile is NOT set -> modal should NOT close
        helpers.setActiveProfileId(null);
        switchProfileBtn.click();
        await sleep(100);

        assert(profileSelectModal.classList.contains('hidden') === false, "Profile select modal should open");

        // Simulate click outside
        profileSelectModal.click();
        await sleep(100);

        assert(profileSelectModal.classList.contains('hidden') === false, "Profile select modal should remain open on click outside if no profile is active");
        assert(appContainer.style.filter === 'blur(10px)', "App container should remain blurred");

        // Clean up
        profileSelectModal.classList.add('hidden');
        appContainer.style.filter = 'none';
        appContainer.style.pointerEvents = 'auto';
        helpers.setActiveProfileId(null);
      }

      console.log("Running Test Case 26: Auto-Switch Profile on Restore/Delete...");
      {
        const helpers = window.__test_helpers__;
        const profileSelectModal = document.getElementById('profile-select-modal');
        const appContainer = document.querySelector('.app-container');

        // Set up initial condition: active profile is 'profile_1'
        helpers.setActiveProfileId('profile_1');
        profileSelectModal.classList.add('hidden');
        appContainer.style.filter = 'none';
        appContainer.style.pointerEvents = 'auto';

        // Trigger a profiles update where 'profile_1' STILL EXISTS (normal update)
        // Nothing should change (active profile remains 'profile_1', modal hidden)
        helpers.triggerProfilesUpdate([
          { id: 'profile_1', name: 'Test Child 1', avatarId: '25' },
          { id: 'profile_2', name: 'Test Child 2', avatarId: '6' }
        ]);
        assert(helpers.getActiveProfileId() === 'profile_1', "Active profile should remain profile_1");
        assert(profileSelectModal.classList.contains('hidden') === true, "Modal should remain hidden");

        // Trigger a profiles update where 'profile_1' is MISSING but other profiles exist (overwrite/delete scenario)
        // It should auto-switch to the first available profile ('profile_2')
        helpers.triggerProfilesUpdate([
          { id: 'profile_2', name: 'Test Child 2', avatarId: '6' },
          { id: 'profile_3', name: 'Test Child 3', avatarId: '25' }
        ]);
        await sleep(100);
        assert(helpers.getActiveProfileId() === 'profile_2', `Active profile should auto-switch to profile_2, got ${helpers.getActiveProfileId()}`);
        assert(profileSelectModal.classList.contains('hidden') === true, "Modal should remain hidden because a valid profile was auto-selected");

        // Trigger a profiles update where NO profiles exist (all deleted scenario)
        // It should clear active profile and force open the profile selection modal
        helpers.triggerProfilesUpdate([]);
        await sleep(100);
        assert(helpers.getActiveProfileId() === null, "Active profile should be cleared (null)");
        assert(profileSelectModal.classList.contains('hidden') === false, "Profile select modal should force open");
        assert(appContainer.style.filter === 'blur(10px)', "App container should be blurred");

        // Clean up
        profileSelectModal.classList.add('hidden');
        appContainer.style.filter = 'none';
        appContainer.style.pointerEvents = 'auto';
        helpers.setActiveProfileId(null);
      }

      console.log("Running Test Case 27: Wipe All Progress UI wiring...");
      {
        const helpers = window.__test_helpers__;
        
        // Open Admin Panel
        const adminBtn = document.getElementById('admin-btn');
        adminBtn.click();
        await sleep(100);
        
        const passwordInput = document.getElementById('password-input');
        const passwordSubmit = document.getElementById('password-submit-btn');
        passwordInput.value = helpers.ADMIN_PASSWORD;
        passwordSubmit.click();
        await sleep(100);

        const adminModal = document.getElementById('admin-modal');
        assert(adminModal && !adminModal.classList.contains('hidden'), "Admin modal should be open");

        // Mock wipeData and reload
        let wipeCalled = false;
        let reloadCalled = false;
        
        helpers.setWipeDataMock(async () => {
          wipeCalled = true;
        });
        helpers.setReloadMock(() => {
          reloadCalled = true;
        });

        // Sim click Wipe All Progress
        const wipeBtn = document.getElementById('admin-wipe-btn');
        assert(wipeBtn !== null, "Wipe button should exist");
        
        wipeBtn.click();
        await sleep(100);

        // Custom confirm modal should be open
        const confirmModal = document.getElementById('confirm-modal');
        assert(confirmModal && !confirmModal.classList.contains('hidden'), "Confirm Modal should be open on wipe click");
        assert(confirmModal.querySelector('#confirm-title').textContent.includes("Wipe All Progress"), "Confirm title should match");

        const confirmYesBtn = document.getElementById('confirm-yes-btn');
        assert(confirmYesBtn, "Confirm Yes button should exist");
        confirmYesBtn.click();
        await sleep(100);

        assert(wipeCalled === true, "wipeData callback should have been called");
        assert(reloadCalled === true, "reload callback should have been called");

        // Clean up
        helpers.setWipeDataMock(null);
        helpers.setReloadMock(null);
        
        // Close admin modal if still open (it should be since reload was mocked to no-op)
        const closeAdminBtn = document.getElementById('close-admin-modal-btn');
        if (closeAdminBtn) closeAdminBtn.click();
        await sleep(100);
      }

      console.log("Running Test Case 28: Keep exceptions on Week Start Day change (date-keyed)...");
      {
        const helpers = window.__test_helpers__;
        let state = window.__app_state__;

        // Reset state
        helpers.resetState();
        await sleep(100);

        // Ensure weekStartDay is 0 (Sunday)
        state.weekStartDay = 0;
        
        // Resolve dates for mock data
        const baseDateStr = state.weekStartDate;
        const sunDateStr = getDateOfColumn(baseDateStr, 0);
        const monDateStr = getDateOfColumn(baseDateStr, 1);
        const tueDateStr = getDateOfColumn(baseDateStr, 2);

        // Add some exceptions (excused tasks) using date keys
        state.excused = {
          [`${sunDateStr}-piano`]: true,
          [`${tueDateStr}-piano`]: true
        };
        // Add some progress using date keys
        state.grid = {
          [`${monDateStr}-math`]: true
        };
        helpers.renderState(true);
        await sleep(100);

        // Open Admin Panel
        const adminBtn = document.getElementById('admin-btn');
        adminBtn.click();
        await sleep(100);
        
        const passwordInput = document.getElementById('password-input');
        const passwordSubmit = document.getElementById('password-submit-btn');
        passwordInput.value = helpers.ADMIN_PASSWORD;
        passwordSubmit.click();
        await sleep(100);

        const select = document.getElementById('admin-week-start-select');
        assert(select !== null, "Week Start Day select should exist");
        
        // Change to Friday (5)
        select.value = '5';
        select.dispatchEvent(new Event('change'));
        await sleep(100);

        // Verify confirm modal opens (no checkbox verified here as it was removed)
        const confirmModal = document.getElementById('confirm-modal');
        assert(confirmModal && !confirmModal.classList.contains('hidden'), "Confirm Modal should open");

        // Confirm
        const confirmYesBtn = document.getElementById('confirm-yes-btn');
        confirmYesBtn.click();
        await sleep(100);

        // Verify state
        assert(state.weekStartDay === 5, "Week start day should be 5 (Friday)");
        
        // Recalculate expected weekStartDate based on today's calendar Friday start
        const expectedNewStart = formatLocalDate(getWeekStart(new Date(), 5));
        assert(state.weekStartDate === expectedNewStart, `weekStartDate should be ${expectedNewStart}`);

        // Verify exceptions and grid are NOT modified (preserved as-is)
        assert(state.excused[`${sunDateStr}-piano`] === true, "Sunday exception should remain intact");
        assert(state.excused[`${tueDateStr}-piano`] === true, "Tuesday exception should remain intact");
        assert(state.grid[`${monDateStr}-math`] === true, "Monday progress should remain intact");
        
        assert(Object.keys(state.grid).length === 1, "Grid should not be cleared");
        assert(Object.keys(state.excused).length === 2, "Exceptions should not be cleared");

        // Clean up
        helpers.resetState();
        await sleep(100);
        
        // Close admin modal if still open
        const closeAdminBtn = document.getElementById('close-admin-modal-btn');
        if (closeAdminBtn) closeAdminBtn.click();
        await sleep(100);
      }

      console.log("Running Test Case 29: Inactivity Detector / Idle Mode...");
      {
        const helpers = window.__test_helpers__;
        
        // Initially, we should be active (not idle) immediately after reset or interaction
        assert(document.body.classList.contains('idle-mode') === false, "Should not be in idle mode initially");

        // Wait for IDLE_TIMEOUT (200ms in test mode) + some buffer
        await sleep(300, true);
        assert(document.body.classList.contains('idle-mode') === true, "Should enter idle mode after timeout");

        // Simulate interaction (click)
        document.dispatchEvent(new MouseEvent('click'));
        await sleep(50); // Small buffer for event handler to run
        assert(document.body.classList.contains('idle-mode') === false, "Should leave idle mode on interaction");

        // Wait again to verify it re-enters idle mode
        await sleep(300, true);
        assert(document.body.classList.contains('idle-mode') === true, "Should re-enter idle mode after timeout");

        // Clean up: return to active
        document.dispatchEvent(new MouseEvent('click'));
        await sleep(50);
      }

      console.log("Running Test Case 30: Screensaver Inactivity Timeout configuration in Admin Panel...");
      {
        const helpers = window.__test_helpers__;
        let state = window.__app_state__;

        // Reset state
        helpers.resetState();
        await sleep(100);

        // Verify default value is 10
        assert(state.idleTimeout === 10, "Default idleTimeout should be 10");

        // Open Admin Panel
        const adminBtn = document.getElementById('admin-btn');
        adminBtn.click();
        await sleep(100);
        
        const passwordInput = document.getElementById('password-input');
        const passwordSubmit = document.getElementById('password-submit-btn');
        passwordInput.value = helpers.ADMIN_PASSWORD;
        passwordSubmit.click();
        await sleep(100);

        const select = document.getElementById('admin-idle-timeout-select');
        assert(select !== null, "Screensaver idle-timeout select should exist");
        assert(select.value === '10', "Select value should be initialized to 10");

        // Change to 5 minutes
        select.value = '5';
        select.dispatchEvent(new Event('change'));
        await sleep(100);

        assert(state.idleTimeout === 5, "state.idleTimeout should update to 5");

        // Change to Never (0)
        select.value = '0';
        select.dispatchEvent(new Event('change'));
        await sleep(100);

        assert(state.idleTimeout === 0, "state.idleTimeout should update to 0");

        // Clean up
        helpers.resetState();
        await sleep(100);

        // Close admin modal if still open
        const closeAdminBtn = document.getElementById('close-admin-modal-btn');
        if (closeAdminBtn) closeAdminBtn.click();
        await sleep(100);
      }

      console.log("Running Test Case 31: Per-child Custom Rewards...");
      {
        const helpers = window.__test_helpers__;
        let state = window.__app_state__;

        // Reset state
        helpers.resetState();
        await sleep(100);

        // Verify state has default reward options
        assert(Array.isArray(state.weeklyRewardOptions), "weeklyRewardOptions should be an array");
        assert(state.weeklyRewardOptions.length > 0, "weeklyRewardOptions should not be empty");
        assert(Array.isArray(state.megaRewardOptions), "megaRewardOptions should be an array");
        assert(state.megaRewardOptions.length > 0, "megaRewardOptions should not be empty");

        // Verify main dropdowns are populated
        const rewardSelect = document.getElementById('reward-select');
        const megaRewardSelect = document.getElementById('mega-reward-select');
        
        const getSelectMainOptionsCount = (select) => {
          return Array.from(select.options).filter(opt => opt.value !== "" && !opt.parentElement.classList.contains('recent-rewards-group')).length;
        };

        assert(getSelectMainOptionsCount(rewardSelect) === state.weeklyRewardOptions.length, "Weekly select should have matching options count");
        assert(getSelectMainOptionsCount(megaRewardSelect) === state.megaRewardOptions.length, "Mega select should have matching options count");

        // Set up mock profile list in test helpers (profile_1 is active)
        const mockProfileId = 'profile_1';
        helpers.setActiveProfileId(mockProfileId);
        helpers.setProfilesList([
          {
            id: mockProfileId,
            name: 'Kepler',
            avatarId: '25',
            state: JSON.parse(JSON.stringify(state))
          }
        ]);

        // Open Admin Panel
        const adminBtn = document.getElementById('admin-btn');
        adminBtn.click();
        await sleep(100);
        
        const passwordInput = document.getElementById('password-input');
        const passwordSubmit = document.getElementById('password-submit-btn');
        passwordInput.value = helpers.ADMIN_PASSWORD;
        passwordSubmit.click();
        await sleep(100);

        // Verify "Rewards" button exists in profile item
        const editRewardsBtn = document.querySelector(`.edit-rewards-btn[data-id="${mockProfileId}"]`);
        assert(editRewardsBtn !== null, "Rewards button should exist for profile");

        // Click Rewards
        editRewardsBtn.click();
        await sleep(100);

        // Verify modal opens
        const modal = document.getElementById('edit-rewards-modal');
        assert(modal && !modal.classList.contains('hidden'), "Edit Rewards Modal should open");

        // Verify lists are populated in modal
        const weeklyList = document.getElementById('weekly-rewards-list');
        const megaList = document.getElementById('mega-rewards-list');
        assert(weeklyList.children.length === state.weeklyRewardOptions.length, "Weekly rewards list in modal should match state count");

        // Add a new reward
        const newWeeklyInput = document.getElementById('new-weekly-reward-input');
        const addWeeklyBtn = document.getElementById('add-weekly-reward-btn');
        newWeeklyInput.value = "🎁 Custom Reward 1";
        addWeeklyBtn.click();
        await sleep(50);
        
        assert(weeklyList.children.length === state.weeklyRewardOptions.length + 1, "List count should increment in modal");

        // Delete first reward in modal list
        const firstDelBtn = weeklyList.querySelector('.delete-reward-btn');
        const originalFirstReward = state.weeklyRewardOptions[0];
        firstDelBtn.click();
        await sleep(50);

        assert(weeklyList.children.length === state.weeklyRewardOptions.length, "List count should return to original after deleting one");

        // Mock save function
        let savedProfileId = null;
        let savedWeekly = null;
        let savedMega = null;
        helpers.setSaveProfileRewardsMock((profileId, weekly, mega) => {
          savedProfileId = profileId;
          savedWeekly = weekly;
          savedMega = mega;
          
          const p = helpers.getProfilesList().find(p => p.id === profileId);
          if (p) {
            p.state.weeklyRewardOptions = weekly;
            p.state.megaRewardOptions = mega;
          }
          return Promise.resolve();
        });

        // Click Save Rewards
        const saveBtn = document.getElementById('edit-rewards-save-btn');
        saveBtn.click();
        await sleep(100);

        // Verify mock save was called
        assert(savedProfileId === mockProfileId, "Save should be called with correct profileId");
        assert(savedWeekly !== null && savedWeekly.some(r => r.text === "🎁 Custom Reward 1"), "Saved list should contain new reward");
        assert(!savedWeekly.some(r => r.value === originalFirstReward.value), "Saved list should NOT contain deleted reward");

        // Verify active state is updated
        assert(state.weeklyRewardOptions.some(r => r.text === "🎁 Custom Reward 1"), "Active state weekly rewards should contain new reward");
        assert(!state.weeklyRewardOptions.some(r => r.value === originalFirstReward.value), "Active state should not have deleted reward");
        assert(state.weeklyRewardOptions.length === savedWeekly.length, "Active state should match saved list length");

        // Verify main select updated its options
        assert(getSelectMainOptionsCount(rewardSelect) === state.weeklyRewardOptions.length, "Weekly select should update options count");

        // Clean up
        helpers.resetState();
        helpers.setSaveProfileRewardsMock(null);
        helpers.setProfilesList([]);
        helpers.setActiveProfileId(null);
        await sleep(100);

        // Close admin modal if still open
        const closeAdminBtn = document.getElementById('close-admin-modal-btn');
        if (closeAdminBtn) closeAdminBtn.click();
        await sleep(100);
      }

      // 32. Test Case 32: Grid Migration (V14 -> V15)
      console.log("Running Test Case 32: Grid Migration (V14 -> V15)...");
      {
        const v14State = {
          version: 14,
          childName: "Kepler",
          weekStartDate: "2026-07-26",
          weekStartDay: 0,
          reward: "Bonus Tablet Time",
          megaReward: "Booster Pack",
          megaWeeks: 1,
          weeklyClaimed: false,
          grid: {
            "0-piano": true,
            "1-math": true,
            "6-reading": true
          },
          excused: {
            "2-piano": true
          },
          tasks: [
            { id: 'piano', name: 'Piano Practice', emoji: '🎹', concept: 'Level up!' },
            { id: 'math', name: 'Math Practice', emoji: '🧮', concept: 'Intellect +1' },
            { id: 'reading', name: 'Reading Time', emoji: '📚', concept: 'Explore new zones!' }
          ]
        };

        const migrated = runMigrations(v14State);

        assert(migrated.version === 18, "Migrated state version should be 18");
        assert(migrated.weeklyHistory !== undefined, "weeklyHistory should be initialized");
        
        assert(migrated.grid["2026-07-26-piano"] === true, "Day 0 piano should migrate to 2026-07-26-piano");
        assert(migrated.grid["2026-07-27-math"] === true, "Day 1 math should migrate to 2026-07-27-math");
        assert(migrated.grid["2026-08-01-reading"] === true, "Day 6 reading should migrate to 2026-08-01-reading");
        assert(migrated.grid["0-piano"] === undefined, "Old grid key 0-piano should be deleted");

        assert(migrated.excused["2026-07-28-piano"] === true, "Day 2 excused piano should migrate to 2026-07-28-piano");

        migrated.tasks.forEach(t => {
          assert(t.active === true, "Tasks should be active by default");
          assert(t.createdAt === "2026-07-01", "Existing tasks should have default createdAt");
          assert(t.deletedAt === null, "Existing tasks should have deletedAt = null");
        });
      }

      // 33. Test Case 33: Historical Paging (Read-Only)
      console.log("Running Test Case 33: Historical Paging (Read-Only)...");
      {
        const helpers = window.__test_helpers__;
        helpers.resetState();
        await sleep(100);
        state = window.__app_state__;

        const currentWeekStart = state.weekStartDate;
        const currentWeekDate = new Date(currentWeekStart + 'T00:00:00');
        currentWeekDate.setDate(currentWeekDate.getDate() - 7);
        const pastWeekStart = formatLocalDate(currentWeekDate);
        
        state.weeklyHistory[pastWeekStart] = {
          weekStartDay: 0,
          reward: "Parent Playtime",
          megaReward: "Dessert Outing",
          weeklyClaimed: true,
          badgeId: 4,
          xpEarned: 50
        };
        state.grid[`${pastWeekStart}-piano`] = true;
        helpers.renderState(true);
        await sleep(100);

        const nextBtn = document.getElementById('next-week-btn');
        const prevBtn = document.getElementById('prev-week-btn');
        assert(nextBtn !== null, "Next week button should exist");
        assert(prevBtn !== null, "Prev week button should exist");
        assert(nextBtn.disabled === true, "Next button should be disabled on current week");

        prevBtn.click();
        await sleep(100);

        assert(nextBtn.disabled === false, "Next button should be enabled on historical week");
        
        const checkboxes = document.querySelectorAll('#grid-tbody input[type="checkbox"]');
        assert(checkboxes.length > 0, "Grid checkboxes should be rendered");
        checkboxes.forEach(cb => {
          assert(cb.disabled === true, "Checkboxes must be disabled in past weeks");
        });

        assert(rewardSelect.disabled === true, "Weekly Reward select should be disabled in history");
        assert(megaRewardSelect.disabled === true, "Mega Reward select should be disabled in history");

        const resetBtn = document.getElementById('reset-btn');
        assert(resetBtn !== null, "Reset button should exist");
        assert(resetBtn.disabled === true, "Reset button should be disabled in history");

        assert(rewardSelect.value === "Parent Playtime", "Historical reward should be selected");
        assert(megaRewardSelect.value === "Dessert Outing", "Historical mega reward should be selected");

        nextBtn.click();
        await sleep(100);

        assert(nextBtn.disabled === true, "Next button should be disabled again on current week");
        
        const currentCheckboxes = document.querySelectorAll('#grid-tbody input[type="checkbox"]');
        currentCheckboxes.forEach(cb => {
          assert(cb.disabled === false, "Checkboxes must be enabled on current week");
        });
        
        assert(rewardSelect.disabled === false, "Weekly Reward select should be enabled on current week");
        assert(megaRewardSelect.disabled === false, "Mega Reward select should be enabled on current week");
        assert(resetBtn.disabled === false, "Reset button should be enabled on current week");
        
        helpers.resetState();
        await sleep(100);
      }

      // 34. Test Case 34: Task Lifecycle Rendering (out of range cells)
      console.log("Running Test Case 34: Task Lifecycle Rendering (out of range cells)...");
      {
        const helpers = window.__test_helpers__;
        helpers.resetState();
        await sleep(100);
        state = window.__app_state__;

        const currentWeekStart = state.weekStartDate;
        
        const pianoTask = state.tasks.find(t => t.id === 'piano');
        const wedDate = new Date(currentWeekStart + 'T00:00:00');
        wedDate.setDate(wedDate.getDate() + 3); // Wednesday (Index 3)
        pianoTask.createdAt = formatLocalDate(wedDate);

        const mathTask = state.tasks.find(t => t.id === 'math');
        mathTask.active = false;
        
        const thuDate = new Date(currentWeekStart + 'T00:00:00');
        thuDate.setDate(thuDate.getDate() + 4); // Thursday (Index 4)
        mathTask.deletedAt = formatLocalDate(thuDate);

        helpers.renderState(true);
        await sleep(100);

        const pianoRow = document.querySelector('tr[data-task="piano"]');
        assert(pianoRow !== null, "Piano row should exist");
        
        const pianoCells = pianoRow.querySelectorAll('.checkbox-cell');
        assert(pianoCells[0].classList.contains('out-of-range-cell'), "Piano Sunday cell should be out of range");
        assert(pianoCells[0].querySelector('input').disabled === true, "Piano Sunday input should be disabled");
        
        assert(pianoCells[1].classList.contains('out-of-range-cell'), "Piano Monday cell should be out of range");
        assert(pianoCells[1].querySelector('input').disabled === true, "Piano Monday input should be disabled");

        assert(!pianoCells[3].classList.contains('out-of-range-cell'), "Piano Wednesday cell should NOT be out of range");
        assert(pianoCells[3].querySelector('input').disabled === false, "Piano Wednesday input should be active");

        const mathRow = document.querySelector('tr[data-task="math"]');
        assert(mathRow !== null, "Math row should exist");
        
        const mathCells = mathRow.querySelectorAll('.checkbox-cell');
        assert(!mathCells[3].classList.contains('out-of-range-cell'), "Math Wednesday cell should NOT be out of range");
        assert(mathCells[3].querySelector('input').disabled === false, "Math Wednesday input should be active");

        assert(mathCells[4].classList.contains('out-of-range-cell'), "Math Thursday cell should be out of range");
        assert(mathCells[4].querySelector('input').disabled === true, "Math Thursday input should be disabled");

        assert(mathCells[5].classList.contains('out-of-range-cell'), "Math Friday cell should be out of range");
        assert(mathCells[5].querySelector('input').disabled === true, "Math Friday input should be disabled");

        helpers.resetState();
        await sleep(100);
      }

      // 35. Test Case 35: Future Day Locking
      console.log("Running Test Case 35: Future Day Locking...");
      {
        const helpers = window.__test_helpers__;
        helpers.resetState();
        await sleep(100);
        state = window.__app_state__;

        const today = new Date();
        const todayColumnIndex = (today.getDay() - state.weekStartDay + 7) % 7;

        // --- PART 1: Locked Mode (Production Mock) ---
        window.__mock_allow_future_edits__ = false;
        helpers.renderState(true);
        await sleep(100);

        const pianoRow = document.querySelector('tr[data-task="piano"]');
        assert(pianoRow !== null, "Piano row should exist");
        const pianoCells = pianoRow.querySelectorAll('.checkbox-cell');
        const headers = document.querySelectorAll('.day-header');

        for (let d = 0; d < 7; d++) {
          const input = pianoCells[d].querySelector('input');
          if (d > todayColumnIndex) {
            // Future column
            assert(pianoCells[d].classList.contains('future-cell'), `Column ${d} should be styled as a future-cell`);
            assert(input.disabled === true, `Future checkbox at column ${d} should be disabled`);
            assert(headers[d].classList.contains('future-day-header'), `Future header at column ${d} should be styled as future-day-header`);
            
            // Try to click checkbox - should not check it
            const wasChecked = input.checked;
            input.click();
            await sleep(50);
            assert(input.checked === wasChecked, `Clicking disabled future checkbox at column ${d} should not change state`);
          } else {
            // Today or past column (should not be disabled by future lock)
            assert(!pianoCells[d].classList.contains('future-cell'), `Column ${d} should NOT be styled as a future-cell`);
            assert(input.disabled === false, `Today/Past checkbox at column ${d} should be enabled`);
            assert(!headers[d].classList.contains('future-day-header'), `Today/Past header at column ${d} should NOT be styled as future-day-header`);
          }
        }

        // Try to click a future header - active day should NOT change
        if (todayColumnIndex < 6) {
          const futureHeader = headers[todayColumnIndex + 1];
          const previousActiveDay = state.activeDay;
          futureHeader.click();
          await sleep(100);
          assert(state.activeDay === previousActiveDay, "Clicking future day header should not change activeDay");
        }

        // --- PART 2: Sandbox Mode (Allowed Future Edits) ---
        window.__mock_allow_future_edits__ = true;
        helpers.renderState(true);
        await sleep(100);

        const pianoRowSandbox = document.querySelector('tr[data-task="piano"]');
        const pianoCellsSandbox = pianoRowSandbox.querySelectorAll('.checkbox-cell');
        const headersSandbox = document.querySelectorAll('.day-header');

        for (let d = 0; d < 7; d++) {
          const input = pianoCellsSandbox[d].querySelector('input');
          assert(!pianoCellsSandbox[d].classList.contains('future-cell'), `Column ${d} should NOT be styled as a future-cell in sandbox`);
          assert(input.disabled === false, `Checkbox at column ${d} should be enabled in sandbox`);
          assert(!headersSandbox[d].classList.contains('future-day-header'), `Header at column ${d} should NOT be styled as future-day-header in sandbox`);
        }

        // Clean up mock
        delete window.__mock_allow_future_edits__;
        helpers.resetState();
        await sleep(100);
      }

      // 36. Test Case 36: Reward Selection Persistence
      console.log("Running Test Case 36: Reward Selection Persistence...");
      {
        const helpers = window.__test_helpers__;
        helpers.resetState();
        await sleep(100);
        state = window.__app_state__;

        const rewardSelect = document.getElementById('reward-select');
        const megaRewardSelect = document.getElementById('mega-reward-select');

        // Select "Choose Meal"
        rewardSelect.value = "Choose Meal";
        rewardSelect.dispatchEvent(new Event('change'));
        await sleep(50);

        assert(state.reward === "Choose Meal", "State weekly reward should be 'Choose Meal'");
        assert(rewardSelect.value === "Choose Meal", `UI weekly reward should be 'Choose Meal' immediately after change (actual: '${rewardSelect.value}')`);

        // Select "Dessert Outing"
        megaRewardSelect.value = "Dessert Outing";
        megaRewardSelect.dispatchEvent(new Event('change'));
        await sleep(50);

        assert(state.megaReward === "Dessert Outing", "State mega reward should be 'Dessert Outing'");
        assert(megaRewardSelect.value === "Dessert Outing", `UI mega reward should be 'Dessert Outing' immediately after change (actual: '${megaRewardSelect.value}')`);

        // Trigger a re-render
        helpers.renderState(false);
        await sleep(50);

        assert(rewardSelect.value === "Choose Meal", `UI weekly reward should survive renderState (actual: '${rewardSelect.value}')`);
        assert(megaRewardSelect.value === "Dessert Outing", `UI mega reward should survive renderState (actual: '${megaRewardSelect.value}')`);
        
        helpers.resetState();
        await sleep(100);
      }

      // 37. Test Case 37: Partner Devolution
      console.log("Running Test Case 37: Partner Devolution...");
      {
        const helpers = window.__test_helpers__;
        helpers.resetState();
        await sleep(100);
        state = window.__app_state__;

        // --- Part 1: Regular Pokemon (Pichu -> Pikachu -> Pichu) ---
        state.activePartnerInstanceId = '172';
        state.partnersData['172'] = { familyId: '172', level: 4, xp: 95, stageId: '172' };
        
        const rewardSelect = document.getElementById('reward-select');
        rewardSelect.value = "Bonus Tablet Time";
        rewardSelect.dispatchEvent(new Event('change'));
        const megaRewardSelect = document.getElementById('mega-reward-select');
        megaRewardSelect.value = "Booster Pack";
        megaRewardSelect.dispatchEvent(new Event('change'));
        
        state.activeDay = 0;
        helpers.renderState(true);
        await sleep(100);

        const firstCheckbox = document.querySelector('input[data-day="0"][data-task="piano"]');
        assert(firstCheckbox !== null, "Piano checkbox should exist");
        assert(firstCheckbox.checked === false, "Checkbox should be unchecked initially");

        // Click to check (Gain 5 XP -> Level 5, 0 XP -> Evolve to Pikachu '25')
        firstCheckbox.click();
        await sleep(100);

        assert(state.partnersData['172'].level === 5, `Pichu should level up to 5 (actual: ${state.partnersData['172'].level})`);
        assert(state.partnersData['172'].xp === 0, `Pichu XP should be 0 (actual: ${state.partnersData['172'].xp})`);
        assert(state.partnersData['172'].stageId === '25', `Pichu should evolve to Pikachu (stageId '25') (actual: ${state.partnersData['172'].stageId})`);

        // Click to uncheck (Lose 5 XP -> Level 4, 95 XP -> Devolve to Pichu '172')
        firstCheckbox.click();
        await sleep(100);

        assert(state.partnersData['172'].level === 4, `Pichu should level down to 4 (actual: ${state.partnersData['172'].level})`);
        assert(state.partnersData['172'].xp === 95, `Pichu XP should be 95 (actual: ${state.partnersData['172'].xp})`);
        assert(state.partnersData['172'].stageId === '172', `Pichu should devolve back to Pichu (stageId '172') (actual: ${state.partnersData['172'].stageId})`);

        // --- Part 2: Eevee Special Case (Vaporeon -> Eevee) ---
        state.activePartnerInstanceId = '133';
        state.partnersData['133'] = { familyId: '133', level: 5, xp: 0, stageId: '134' }; // Vaporeon
        
        // Programmatically check a box in grid to uncheck it
        const dateStr = getDateOfColumn(state.weekStartDate, 0);
        const gridKey = `${dateStr}-piano`;
        state.grid[gridKey] = true;
        
        helpers.renderState(true);
        await sleep(100);

        const checkboxToUncheck = document.querySelector('input[data-day="0"][data-task="piano"]');
        assert(checkboxToUncheck !== null, "Piano checkbox should exist");
        assert(checkboxToUncheck.checked === true, "Checkbox should be checked");

        // Click to uncheck (Lose 5 XP -> Level 4, 95 XP -> Devolve to Eevee '133')
        checkboxToUncheck.click();
        await sleep(100);

        assert(state.partnersData['133'].level === 4, `Eevee should level down to 4 (actual: ${state.partnersData['133'].level})`);
        assert(state.partnersData['133'].xp === 95, `Eevee XP should be 95 (actual: ${state.partnersData['133'].xp})`);
        assert(state.partnersData['133'].stageId === '133', `Eevee should devolve back to Eevee (stageId '133') (actual: ${state.partnersData['133'].stageId})`);

        helpers.resetState();
        await sleep(100);
      }

      // 38. Test Case 38: State Migration (V15 -> V16)
      console.log("Running Test Case 38: State Migration (V15 -> V16)...");
      {
        const v15State = {
          version: 15,
          partnerFamily: '4', // Charmander
          partnersData: {
            '25': { level: 2, xp: 10, stageId: '25' },
            '4': { level: 3, xp: 20, stageId: '4' }
          },
          starVault: {
            earnedDates: ['2026-07-01'],
            totalTraded: 1
          }
        };

        const migrated = runMigrations(v15State);

        assert(migrated.version === 18, "Migrated state version should be 18");
        assert(migrated.activePartnerInstanceId === '4', "activePartnerInstanceId should be set to partnerFamily '4'");
        assert(migrated.partnersData['172'].familyId === '172', "Pikachu should be migrated to Pichu family '172'");
        assert(migrated.partnersData['172'].stageId === '172', "Pikachu level 2 should devolve to Pichu stage '172' to match level");
        assert(migrated.partnersData['4'].familyId === '4', "Charmander should get familyId '4'");
        assert(migrated.partnersData['172'].level === 2, "Pichu level should be preserved");
        assert(migrated.partnersData['4'].level === 3, "Charmander level should be preserved");
        assert(migrated.starVault.totalTraded === 1, "totalTraded should be preserved");
        assert(migrated.starVault.earnedDates.length === 1, "earnedDates should be preserved");
      }

      // 39. Test Case 39: Grid Star Streak Colors
      console.log("Running Test Case 39: Grid Star Streak Colors...");
      {
        const helpers = window.__test_helpers__;
        helpers.resetState();
        await sleep(50);

        // Setup rewards so we can check boxes
        const rewardSelect = document.getElementById('reward-select');
        rewardSelect.value = "Bonus Tablet Time";
        rewardSelect.dispatchEvent(new Event('change'));
        const megaRewardSelect = document.getElementById('mega-reward-select');
        megaRewardSelect.value = "Booster Pack";
        megaRewardSelect.dispatchEvent(new Event('change'));
        await sleep(50);

        const tasks = state.tasks || [];
        
        // Complete Sunday (Day 0)
        state.activeDay = 0; // Sunday
        for (const t of tasks) {
          const cb = document.querySelector(`input[data-day="0"][data-task="${t.id}"]`);
          if (cb && !cb.checked) { cb.click(); await sleep(20); }
        }
        await sleep(50);
        let cell = document.querySelector('.day-total-cell[data-day="0"] .badge-indicator');
        assert(cell && cell.textContent === '🌟', "Day 0 should show star emoji");

        // Complete Monday (Day 1)
        state.activeDay = 1; // Monday
        for (const t of tasks) {
          const cb = document.querySelector(`input[data-day="1"][data-task="${t.id}"]`);
          if (cb && !cb.checked) { cb.click(); await sleep(20); }
        }
        await sleep(50);
        cell = document.querySelector('.day-total-cell[data-day="1"] .badge-indicator');
        assert(cell && cell.textContent === '🌟', "Day 1 should show star emoji");

        // Complete Tuesday (Day 2)
        state.activeDay = 2; // Tuesday
        for (const t of tasks) {
          const cb = document.querySelector(`input[data-day="2"][data-task="${t.id}"]`);
          if (cb && !cb.checked) { cb.click(); await sleep(20); }
        }
        await sleep(50);
        cell = document.querySelector('.day-total-cell[data-day="2"] .badge-indicator');
        assert(cell && cell.textContent === '🌟', "Day 2 should show star emoji");

        // Complete Wednesday (Day 3)
        state.activeDay = 3; // Wednesday
        for (const t of tasks) {
          const cb = document.querySelector(`input[data-day="3"][data-task="${t.id}"]`);
          if (cb && !cb.checked) { cb.click(); await sleep(20); }
        }
        await sleep(50);
        cell = document.querySelector('.day-total-cell[data-day="3"] .badge-indicator');
        assert(cell && cell.textContent === '🌟', "Day 3 should show star emoji");

        // Complete Thursday (Day 4)
        state.activeDay = 4; // Thursday
        for (const t of tasks) {
          const cb = document.querySelector(`input[data-day="4"][data-task="${t.id}"]`);
          if (cb && !cb.checked) { cb.click(); await sleep(20); }
        }
        await sleep(50);
        cell = document.querySelector('.day-total-cell[data-day="4"] .badge-indicator');
        assert(cell && cell.textContent === '🌟', "Day 4 should show star emoji");

        // 2. Open Vault Modal and verify streak colors inside the cabinet
        const openVaultBtn = document.getElementById('open-vault-btn');
        assert(openVaultBtn, "Open Vault button should exist");
        openVaultBtn.click();
        await sleep(100);

        const vaultModal = document.getElementById('vault-modal');
        assert(vaultModal && !vaultModal.classList.contains('hidden'), "Vault Modal should be open");

        const vaultStars = document.querySelectorAll('#vault-grid .vault-star-wrapper');
        assert(vaultStars.length === 5, "Vault should contain 5 stars");

        assert(vaultStars[0].classList.contains('yellow'), "1st star should be yellow (Day 1)");
        assert(vaultStars[1].classList.contains('yellow'), "2nd star should be yellow (Day 2)");
        assert(vaultStars[2].classList.contains('silver'), "3rd star should be silver (Day 3)");
        assert(vaultStars[3].classList.contains('silver'), "4th star should be silver (Day 4)");
        assert(vaultStars[4].classList.contains('blue'), "5th star should be blue (Day 5)");

        // Close Vault Modal
        const closeVaultBtn = document.getElementById('close-vault-modal-btn');
        closeVaultBtn.click();
        await sleep(100);
        assert(vaultModal.classList.contains('hidden'), "Vault Modal should be closed");

        helpers.resetState();
        await sleep(50);
      }



      // 41. Test Case 41: Partner Shop Filtering (Type & Legendary)
      console.log("Running Test Case 41: Partner Shop Filtering...");
      {
        const helpers = window.__test_helpers__;
        helpers.resetState();
        await sleep(50);

        // Open Shop Modal
        helpers.openPokemonShop();
        await sleep(100);

        const shopModal = document.getElementById('pokemon-shop-modal');
        assert(shopModal && !shopModal.classList.contains('hidden'), "Shop Modal should be open");

        // 1. Initial State: should show many cards
        let cards = document.querySelectorAll('#shop-items-grid .shop-item-card');
        assert(cards.length > 20, `Initially should show many cards (actual: ${cards.length})`);

        // 2. Filter by Fire type
        const typeSelect = document.getElementById('shop-filter-type');
        assert(typeSelect, "Type filter select should exist");
        typeSelect.value = "Fire";
        typeSelect.dispatchEvent(new Event('change'));
        await sleep(50);

        cards = document.querySelectorAll('#shop-items-grid .shop-item-card');
        assert(cards.length > 0, "Should have visible Fire cards");
        cards.forEach(card => {
          const id = Number(card.dataset.id);
          assert(POKEMON_TYPES[id] === "Fire", `Card ID ${id} should be Fire type, but got ${POKEMON_TYPES[id]}`);
        });

        // 3. Filter by Cost: 15 Stars (Legendary) (with Fire still selected)
        const costSelect = document.getElementById('shop-filter-cost');
        assert(costSelect, "Cost filter select should exist");
        costSelect.value = "15";
        costSelect.dispatchEvent(new Event('change'));
        await sleep(50);

        cards = document.querySelectorAll('#shop-items-grid .shop-item-card');
        assert(cards.length > 0, "Should have visible Fire 15-star Legendaries");
        cards.forEach(card => {
          const id = Number(card.dataset.id);
          assert(POKEMON_TYPES[id] === "Fire", `Card ID ${id} should be Fire type`);
          assert(LEGENDARY_POKEMON_IDS.has(id), `Card ID ${id} should be Legendary`);
          assert(card.dataset.cost === "15", `Card ID ${id} cost attribute should be 15`);
        });

        // 4. Change Type filter back to "all" (15 Stars still selected)
        typeSelect.value = "all";
        typeSelect.dispatchEvent(new Event('change'));
        await sleep(50);

        cards = document.querySelectorAll('#shop-items-grid .shop-item-card');
        assert(cards.length > 0, "Should have visible Legendaries");
        cards.forEach(card => {
          const id = Number(card.dataset.id);
          assert(LEGENDARY_POKEMON_IDS.has(id), `Card ID ${id} should be Legendary`);
        });

        // 5. Close Shop and verify filters reset when reopening
        const closeShopBtn = document.getElementById('close-shop-modal-btn');
        closeShopBtn.click();
        await sleep(100);
        assert(shopModal.classList.contains('hidden'), "Shop modal should be closed");

        helpers.openPokemonShop();
        await sleep(100);
        assert(!shopModal.classList.contains('hidden'), "Shop modal should reopen");

        // Verify filters are reset
        assert(typeSelect.value === 'all', "Type filter should be reset to 'all'");
        assert(costSelect.value === 'all', "Cost filter should be reset to 'all'");

        // Verify all cards are visible again
        cards = document.querySelectorAll('#shop-items-grid .shop-item-card');
        assert(cards.length > 20, `Reopened shop should show all cards (actual: ${cards.length})`);

        // Clean up
        closeShopBtn.click();
        await sleep(100);
        helpers.resetState();
        await sleep(50);
      }

      // 42. Test Case 42: New Partner Persistence on Reload
      console.log("Running Test Case 42: New Partner Persistence on Reload...");
      {
        const helpers = window.__test_helpers__;
        helpers.resetState();
        await sleep(50);

        // 1. Force state to have 10 stars so we can unlock Eevee
        const stateObj = window.__app_state__;
        stateObj.starVault.earnedDates = [
          "2026-07-01", "2026-07-02", "2026-07-03", "2026-07-04", "2026-07-05",
          "2026-07-06", "2026-07-07", "2026-07-08", "2026-07-09", "2026-07-10"
        ];
        helpers.saveState();
        helpers.renderState(true);
        await sleep(50);

        // 2. Open Shop Modal
        helpers.openPokemonShop();
        await sleep(100);

        // 3. Find Eevee card (ID 133) and click it
        const eeveeCard = document.querySelector('#shop-items-grid .shop-item-card[data-id="133"]');
        assert(eeveeCard, "Eevee shop card should exist");
        eeveeCard.click();
        await sleep(100);

        // 4. Confirm screen should be open. Trigger hold unlock.
        const holdBtn = document.getElementById('shop-hold-unlock-btn');
        assert(holdBtn, "Hold unlock button should exist");
        
        // Dispatch mousedown (HOLD_DURATION is 300ms in tests)
        holdBtn.dispatchEvent(new MouseEvent('mousedown'));
        await sleep(400);
        holdBtn.dispatchEvent(new MouseEvent('mouseup'));
        
        // Wait for celebration fade and modal close (animation delay scaled down in test mode)
        await sleep(2000, true);

        // 5. Assert Eevee is now the active partner
        const activeInstanceId = window.__app_state__.activePartnerInstanceId;
        assert(activeInstanceId && activeInstanceId.startsWith('133_'), `Active partner should be Eevee (got ${activeInstanceId})`);

        // 6. Simulate reload by loading state again
        helpers.loadState();
        
        // 7. Assert Eevee is STILL the active partner!
        const activeInstanceIdPostLoad = window.__app_state__.activePartnerInstanceId;
        assert(activeInstanceIdPostLoad && activeInstanceIdPostLoad.startsWith('133_'), `Active partner post-load should still be Eevee (got ${activeInstanceIdPostLoad})`);
        
        // Clean up
        helpers.resetState();
        await sleep(50);
      }

      // 45. Test Case 45: Old Week Alert on Startup
      console.log("Running Test Case 45: Old Week Alert on Startup...");
      {
        const helpers = window.__test_helpers__;
        helpers.resetState();
        await sleep(50);

        // Mock Date to a date after the active week
        const OriginalDate = window.Date;
        class MockedDate extends OriginalDate {
          constructor(...args) {
            if (args.length === 0) {
              return new OriginalDate('2026-08-04T12:00:00'); // Tuesday (New Week started Aug 3)
            }
            return new OriginalDate(...args);
          }
          static now() {
            return new OriginalDate('2026-08-04T12:00:00').getTime();
          }
        }
        window.Date = MockedDate;

        // Set grid week to a past week: Jul 27 - Aug 2, and ensure it's not completed
        const stateObj = window.__app_state__;
        stateObj.weekStartDate = '2026-07-27';
        stateObj.weekStartDay = 1; // Monday start
        stateObj.grid = {}; // Clear checked tasks to prevent Weekly Milestone pop
        stateObj.weeklyClaimed = false;
        helpers.saveState();
        // Set up mock profile list for this test
        helpers.setProfilesList([
          {
            id: 'kepler_test',
            name: 'Kepler',
            avatarId: '25',
            state: JSON.parse(JSON.stringify(stateObj))
          }
        ]);

        // Trigger profile reload (reselects Kepler profile robustly)
        const profiles = helpers.getProfilesList();
        const keplerProfile = profiles.find(p => p.name.includes('Kepler'));
        const profileId = keplerProfile ? keplerProfile.id : (profiles[0] ? profiles[0].id : null);
        assert(profileId !== null, "Should have at least one profile available to test startup alert");
        helpers.selectProfile(profileId);
        await sleep(800); // Increased wait for snapshot load

        // Check if the notification modal is displayed
        const notifModal = document.querySelector('.notif-modal');
        assert(notifModal && !notifModal.classList.contains('hidden'), "New Week notification modal should be displayed");
        
        // Assert text content has the instructions
        const notifTitle = notifModal.querySelector('h2');
        assert(notifTitle && notifTitle.textContent === "New Week Training! 📅", "Notification title should match");
        
        const notifBody = notifModal.querySelector('.notif-body-text');
        assert(notifBody && notifBody.textContent.includes("Reset Week Grid"), "Notification message should instruct to reset the grid");

        // Close the notification
        const closeBtn = notifModal.querySelector('.notif-close-btn');
        assert(closeBtn, "Awesome! close button should exist");
        closeBtn.click();
        await sleep(100);

        // Verify it is hidden
        assert(notifModal.classList.contains('hidden') || !document.body.contains(notifModal), "Notification should be closed");

        // Restore Date
        window.Date = OriginalDate;

        // Clean up
        helpers.resetState();
        await sleep(50);
      }

      // 46. Test Case 46: Customize Rewards UI propagation
      console.log("Running Test Case 46: Customize Rewards UI propagation...");
      {
        const helpers = window.__test_helpers__;
        helpers.resetState();
        await sleep(50);

        const mockProfileId = 'kepler_test';
        helpers.setActiveProfileId(mockProfileId);
        const stateObj = window.__app_state__;
        helpers.setProfilesList([
          {
            id: mockProfileId,
            name: 'Kepler',
            avatarId: '25',
            state: JSON.parse(JSON.stringify(stateObj))
          }
        ]);

        // Mock save function
        helpers.setSaveProfileRewardsMock((profileId, weekly, mega) => {
          const p = helpers.getProfilesList().find(p => p.id === profileId);
          if (p) {
            p.state.weeklyRewardOptions = weekly;
            p.state.megaRewardOptions = mega;
          }
          return Promise.resolve();
        });

        // Open Admin Panel
        const adminBtn = document.getElementById('admin-btn');
        adminBtn.click();
        await sleep(100);
        
        const passwordInput = document.getElementById('password-input');
        const passwordSubmit = document.getElementById('password-submit-btn');
        passwordInput.value = helpers.ADMIN_PASSWORD;
        passwordSubmit.click();
        await sleep(100);

        // Click Rewards
        const editRewardsBtn = document.querySelector(`.edit-rewards-btn[data-id="${mockProfileId}"]`);
        assert(editRewardsBtn !== null, "Rewards button should exist for profile");
        editRewardsBtn.click();
        await sleep(100);

        // Add a new reward
        const newWeeklyInput = document.getElementById('new-weekly-reward-input');
        const addWeeklyBtn = document.getElementById('add-weekly-reward-btn');
        newWeeklyInput.value = "🎁 Test Custom Reward";
        addWeeklyBtn.click();
        await sleep(50);

        // Click Save Rewards
        const saveBtn = document.getElementById('edit-rewards-save-btn');
        saveBtn.click();
        await sleep(100);

        // Verify it is updated in state
        assert(stateObj.weeklyRewardOptions.some(r => r.text === "🎁 Test Custom Reward"), "Reward should be in state");

        // Verify it is updated in dropdown
        const rewardSelect = document.getElementById('reward-select');
        let options = Array.from(rewardSelect.options).map(opt => opt.text);
        assert(options.includes("🎁 Test Custom Reward"), "New reward should be in dropdown options");

        // Open Admin Panel again to delete it
        adminBtn.click();
        await sleep(100);
        passwordInput.value = helpers.ADMIN_PASSWORD;
        passwordSubmit.click();
        await sleep(100);
        
        editRewardsBtn.click();
        await sleep(100);

        // Find the "Test Custom Reward" in the modal list and delete it
        const weeklyList = document.getElementById('weekly-rewards-list');
        const items = weeklyList.querySelectorAll('.reward-list-item');
        let deleteBtn = null;
        items.forEach(item => {
          if (item.querySelector('.reward-item-text').textContent === "🎁 Test Custom Reward") {
            deleteBtn = item.querySelector('.delete-reward-btn');
          }
        });
        assert(deleteBtn !== null, "Delete button for custom reward should exist");
        deleteBtn.click();
        await sleep(50);

        // Save again
        saveBtn.click();
        await sleep(100);

        // Verify it is removed from state
        assert(!stateObj.weeklyRewardOptions.some(r => r.text === "🎁 Test Custom Reward"), "Reward should be removed from state");

        // Verify it is removed from dropdown
        const optionsPostDelete = Array.from(rewardSelect.options).map(opt => opt.text);
        assert(!optionsPostDelete.includes("🎁 Test Custom Reward"), "Deleted reward should not be in dropdown options");

        // Clean up
        helpers.resetState();
        helpers.setSaveProfileRewardsMock(null);
        helpers.setProfilesList([]);
        helpers.setActiveProfileId(null);
        
        // Close admin modal if still open
        const closeAdminBtn = document.getElementById('close-admin-modal-btn');
        if (closeAdminBtn) closeAdminBtn.click();
        await sleep(100);
      }


      // ==========================================
      // Test Case 47: Legendary Mega & Branching Evolution Lifecycle
      // ==========================================
      {
        console.log("Running Test Case 47: Legendary Mega & Branching Evolution Lifecycle...");
        const helpers = window.__test_helpers__;
        const state = window.__app_state__;
        helpers.resetState();
        state.reward = "Bonus Tablet Time";
        state.megaReward = "Booster Pack";
        
        // 1. Non-Mega Legendary (Mew 151)
        state.activePartnerInstanceId = '151_test';
        state.partnersData['151_test'] = {
          familyId: '151',
          level: 1,
          xp: 0,
          stageId: '151'
        };
        helpers.renderState(false);
        
        const evoHelper = document.getElementById('evolution-helper');
        assert(evoHelper && evoHelper.textContent.includes('Fully Evolved form!'), 'Mew should be marked as Fully Evolved form');
        
        // Level up Mew to Level 10
        state.partnersData['151_test'].level = 10;
        helpers.renderState(false);
        assert(state.partnersData['151_test'].stageId === '151', 'Mew stageId should remain 151 at level 10');
        assert(evoHelper && evoHelper.textContent.includes('Fully Evolved form!'), 'Mew should still be marked Fully Evolved at level 10');
        
        // 2. Linear Canonical Mega Legendary (Rayquaza 384)
        state.activePartnerInstanceId = '384_test';
        state.partnersData['384_test'] = {
          familyId: '384',
          level: 9,
          xp: 95,
          stageId: '384'
        };
        state.activeDay = 2;
        helpers.renderState(false);
        
        const rayEvoText = evoHelper ? evoHelper.textContent.replace(/\u00a0/g, ' ') : '';
        assert(rayEvoText.includes('Mega Rayquaza'), 'Rayquaza evolution helper should show Mega Rayquaza');
        assert(rayEvoText.includes('LV 10'), 'Rayquaza evolution helper should indicate LV 10');
        
        // Ensure Day 2 Piano is unchecked
        const pianoCb = document.querySelector('input[data-day="2"][data-task="piano"]');
        if (pianoCb.checked) {
          pianoCb.click();
          await sleep(50);
        }
        
        // Gain 5 XP -> Level 10 -> Evolves to Mega Rayquaza (10079)
        pianoCb.click();
        await sleep(300);
        
        assert(state.partnersData['384_test'].level === 10, 'Rayquaza should level up to 10');
        assert(state.partnersData['384_test'].stageId === '10079', 'Rayquaza should evolve to Mega Rayquaza (10079)');
        assert(document.getElementById('partner-name').textContent === 'Mega Rayquaza', 'Partner name should be Mega Rayquaza');
        
        // Dismiss evolution notification
        const notifModal = document.querySelector('.notif-modal');
        if (notifModal && !notifModal.classList.contains('hidden')) {
          const closeBtn = notifModal.querySelector('.notif-close-btn');
          if (closeBtn) closeBtn.click();
          await sleep(100);
        }
        
        // Level up past 10 (Level 11) -> should maintain Mega Rayquaza
        state.partnersData['384_test'].level = 11;
        state.partnersData['384_test'].xp = 50;
        helpers.renderState(false);
        assert(state.partnersData['384_test'].stageId === '10079', 'Mega Rayquaza should remain Mega at Level 11');
        
        // Uncheck box -> Level 9, 95 XP -> Devolve to base Rayquaza (384)
        state.partnersData['384_test'].level = 10;
        state.partnersData['384_test'].xp = 0;
        pianoCb.click(); // Uncheck (lose 5 XP -> Level 9, 95 XP)
        await sleep(300);
        
        assert(state.partnersData['384_test'].level === 9, 'Rayquaza should level down to 9');
        assert(state.partnersData['384_test'].stageId === '384', 'Rayquaza should devolve to base Rayquaza (384)');
        assert(document.getElementById('partner-name').textContent === 'Rayquaza', 'Partner name should revert to Rayquaza');
        
        // Dismiss devolution notification
        const devModal = document.querySelector('.notif-modal');
        if (devModal && !devModal.classList.contains('hidden')) {
          const closeBtn = devModal.querySelector('.notif-close-btn');
          if (closeBtn) closeBtn.click();
          await sleep(100);
        }
        
        // 3. Branching Canonical Mega Legendary (Mewtwo 150 -> Mega Mewtwo X / Y)
        state.activePartnerInstanceId = '150_test';
        state.partnersData['150_test'] = {
          familyId: '150',
          level: 9,
          xp: 95,
          stageId: '150'
        };
        state.activeDay = 2;
        helpers.renderState(false);
        
        const m2EvoText = evoHelper ? evoHelper.textContent.replace(/\u00a0/g, ' ') : '';
        assert(m2EvoText.includes('Evolves at LV 10'), 'Mewtwo helper should indicate evolution choice at LV 10');
        
        // Check piano to reach Level 10
        pianoCb.click();
        await sleep(600); // Wait for modal to open
        
        const branchModal = document.getElementById('eevee-modal');
        assert(branchModal && !branchModal.classList.contains('hidden'), 'Branch evolution modal should open for Mewtwo');
        assert(branchModal.querySelector('h2').textContent.includes('Mewtwo'), 'Modal title should say Evolve Mewtwo');
        
        // Find Mega Mewtwo Y option (10044)
        const mewtwoYOption = branchModal.querySelector('.eevee-option img[alt="Mega Mewtwo Y"]');
        assert(mewtwoYOption !== null, 'Mega Mewtwo Y option should exist in modal');
        
        mewtwoYOption.closest('.eevee-option').click();
        await sleep(200);
        
        assert(branchModal.classList.contains('hidden'), 'Branch modal should close after selection');
        assert(state.partnersData['150_test'].stageId === '10044', 'Mewtwo stageId should be Mega Mewtwo Y (10044)');
        assert(document.getElementById('partner-name').textContent === 'Mega Mewtwo Y', 'Partner name should be Mega Mewtwo Y');
        
        // Dismiss evolution celebration notification
        const m2Notif = document.querySelector('.notif-modal');
        if (m2Notif && !m2Notif.classList.contains('hidden')) {
          const closeBtn = m2Notif.querySelector('.notif-close-btn');
          if (closeBtn) closeBtn.click();
          await sleep(100);
        }
        
        // Uncheck to devolve Mewtwo
        pianoCb.click();
        await sleep(300);
        
        assert(state.partnersData['150_test'].level === 9, 'Mewtwo should level down to 9');
        assert(state.partnersData['150_test'].stageId === '150', 'Mewtwo should devolve back to base Mewtwo (150)');
        
        // Dismiss devolution notification
        const m2Dev = document.querySelector('.notif-modal');
        if (m2Dev && !m2Dev.classList.contains('hidden')) {
          const closeBtn = m2Dev.querySelector('.notif-close-btn');
          if (closeBtn) closeBtn.click();
          await sleep(100);
        }
        
        // Clean up
        helpers.resetState();
      }

      // 48. Test Case 48: Active Day Highlighting on Sunday (Monday-Start)
      {
        console.log("Running Test Case 48: Active Day Highlighting on Sunday (Monday-Start)...");
        const helpers = window.__test_helpers__;
        helpers.resetState();
        await sleep(50);

        const OriginalDate = window.Date;
        class MockedDate extends OriginalDate {
          constructor(...args) {
            if (args.length === 0) {
              return new OriginalDate('2026-08-09T12:00:00'); // Sunday Aug 9
            }
            return new OriginalDate(...args);
          }
          static now() {
            return new OriginalDate('2026-08-09T12:00:00').getTime();
          }
        }
        window.Date = MockedDate;

        const stateObj = window.__app_state__;
        stateObj.weekStartDate = '2026-08-03'; // Monday Aug 3
        stateObj.weekStartDay = 1; // Monday start
        stateObj.activeDay = 0; // Sunday (Aug 9)
        helpers.setViewingWeekStartDate(null);
        helpers.saveState();

        // Render with rebuild to apply weekStartDay changes to headers
        helpers.renderState(true);
        await sleep(100);

        // Verify column headers: first should be MON (day 0), last should be SUN (day 6)
        const headers = document.querySelectorAll('.day-header');
        assert(headers.length === 7, `Should have 7 day headers, got ${headers.length}`);
        
        assert(headers[0].textContent === 'MON', `First header should be MON, got ${headers[0].textContent}`);
        assert(parseInt(headers[0].dataset.day) === 0, `First header dataset.day should be 0, got ${headers[0].dataset.day}`);
        
        assert(headers[6].textContent === 'SUN', `Last header should be SUN, got ${headers[6].textContent}`);
        assert(parseInt(headers[6].dataset.day) === 6, `Last header dataset.day should be 6, got ${headers[6].dataset.day}`);

        // Verify active day highlight
        // Since activeDay is 0 (Sunday) and weekStartDay is 1 (Monday), activeColumn is 6 (Sunday).
        // Only Sunday header (index 6) should have 'active-day' class.
        // Monday header (index 0) should NOT have it.
        assert(headers[6].classList.contains('active-day'), "Sunday header (last column) should be highlighted active");
        assert(!headers[0].classList.contains('active-day'), "Monday header (first column) should NOT be highlighted active");

        // Restore Date
        window.Date = OriginalDate;

        // Clean up
        helpers.resetState();
        await sleep(50);
      }



      // ==========================================
      // Test Case 48: 3-Tier Star Pricing & Accelerando Swarm Validation
      // ==========================================
      {
        console.log("Running Test Case 48: 3-Tier Star Pricing & Accelerando Swarm Validation...");
        const helpers = window.__test_helpers__;
        const state = window.__app_state__;
        helpers.resetState();

        // 1. Verify Star Vault shortcut text threshold (5 stars)
        state.starVault.earnedDates = ["2026-07-01", "2026-07-02", "2026-07-03"]; // 3 stars
        state.starVault.totalTraded = 0;
        helpers.renderState(false);

        const tradeBtn = document.getElementById('vault-trade-open-btn');
        assert(tradeBtn && tradeBtn.textContent.includes('Earn 2 more stars'), 'Vault shortcut button should show 2 stars needed at 3 stars');

        state.starVault.earnedDates.push("2026-07-04", "2026-07-05"); // 5 stars
        helpers.renderState(false);
        assert(tradeBtn && tradeBtn.textContent.includes('(Ready to Unlock!)'), 'Vault shortcut button should show Ready to Unlock at 5 stars');

        // 2. Open Shop and verify pricing tiers on cards
        helpers.openPokemonShop();
        await sleep(100);

        // Verify visual evolution indicators (Sparkles)
        const pichuCard = document.querySelector('#shop-items-grid .shop-item-card[data-id="172"]');
        assert(pichuCard && pichuCard.querySelector('.shop-item-name').textContent.includes('✨'), 'Pichu card should have sparkle emoji');

        const charmanderCardObj = document.querySelector('#shop-items-grid .shop-item-card[data-id="4"]');
        assert(charmanderCardObj && charmanderCardObj.querySelector('.shop-item-name').textContent.includes('✨'), 'Charmander card should have sparkle emoji');

        const snorlaxCard = document.querySelector('#shop-items-grid .shop-item-card[data-id="143"]');
        assert(!snorlaxCard, 'Snorlax card should not be in shop (evolved form)');

        const munchlaxCard = document.querySelector('#shop-items-grid .shop-item-card[data-id="446"]');
        assert(munchlaxCard && munchlaxCard.querySelector('.shop-item-name').textContent.includes('✨'), 'Munchlax card should have sparkle emoji');

        const mewCard = document.querySelector('#shop-items-grid .shop-item-card[data-id="151"]');
        assert(mewCard && !mewCard.querySelector('.shop-item-name').textContent.includes('✨'), 'Mew card should not have sparkle emoji');

        const costSelect = document.getElementById('shop-filter-cost');
        assert(costSelect !== null, 'Cost filter select should exist in shop');

        // Filter 5 Stars (Normal)
        costSelect.value = "5";
        costSelect.dispatchEvent(new Event('change'));
        await sleep(50);

        let cards5 = document.querySelectorAll('#shop-items-grid .shop-item-card');
        assert(cards5.length > 0, 'Should display 5-star cards');
        cards5.forEach(card => {
          assert(card.dataset.cost === "5", `Card ${card.dataset.id} should cost 5 stars`);
        });

        // Filter 10 Stars (Rare)
        costSelect.value = "10";
        costSelect.dispatchEvent(new Event('change'));
        await sleep(50);

        let cards10 = document.querySelectorAll('#shop-items-grid .shop-item-card');
        assert(cards10.length > 0, 'Should display 10-star cards');
        cards10.forEach(card => {
          assert(card.dataset.cost === "10", `Card ${card.dataset.id} should cost 10 stars`);
        });

        // Filter 15 Stars (Legendary)
        costSelect.value = "15";
        costSelect.dispatchEvent(new Event('change'));
        await sleep(50);

        let cards15 = document.querySelectorAll('#shop-items-grid .shop-item-card');
        assert(cards15.length > 0, 'Should display 15-star cards');
        cards15.forEach(card => {
          assert(card.dataset.cost === "15", `Card ${card.dataset.id} should cost 15 stars`);
        });

        // 3. Test unlocking a 5-star Normal Pokemon (Charmander 4) with 5 stars
        costSelect.value = "all";
        costSelect.dispatchEvent(new Event('change'));
        await sleep(50);

        const charmanderCard = document.querySelector('#shop-items-grid .shop-item-card[data-id="4"]');
        assert(charmanderCard && charmanderCard.classList.contains('affordable'), 'Charmander should be affordable with 5 stars');
        charmanderCard.click();
        await sleep(100);

        const holdBtn = document.getElementById('shop-hold-unlock-btn');
        assert(!holdBtn.disabled, 'Hold button should be enabled for Charmander with 5 stars');

        holdBtn.dispatchEvent(new MouseEvent('mousedown'));
        await sleep(400); // Trigger complete hold

        const animOverlay = document.getElementById('shop-unlock-animation-overlay');
        assert(animOverlay && !animOverlay.classList.contains('hidden'), 'Unlock overlay should open');

        // Verify exactly 5 star slots generated
        const slots = animOverlay.querySelectorAll('.anim-star-slot');
        assert(slots.length === 5, `Expected 5 star slots for Charmander, got ${slots.length}`);

        await sleep(1500, true); // Wait for animation

        assert(state.starVault.totalTraded === 5, `Expected 5 stars spent, got ${state.starVault.totalTraded}`);

        // Clean up
        helpers.resetState();
      }

      // ==========================================
      // Test Case 49: Historical Week Badge Display Logic (Option 1)
      // ==========================================
      {
        console.log("Running Test Case 49: Historical Week Badge Display Logic (Option 1)...");
        const helpers = window.__test_helpers__;
        const state = window.__app_state__;
        helpers.resetState();

        state.weekStartDate = '2026-07-27';
        state.weeklyHistory = {
          '2026-07-20': {
            weekStartDay: 0,
            weeklyClaimed: true,
            badgeId: 25, // Pikachu
            reward: 'Bonus Time'
          },
          '2026-07-13': {
            weekStartDay: 0,
            weeklyClaimed: false,
            badgeId: 4, // Charmander
            reward: ''
          }
        };
        helpers.saveState();

        // Set viewing week to match test state weekStartDate
        helpers.setViewingWeekStartDate('2026-07-27');
        helpers.renderState(true);
        await sleep(50);

        const prevBtn = document.getElementById('prev-week-btn');
        assert(prevBtn !== null, "Prev week button should exist");
        
        // 1. Click prevWeekBtn to step back to 2026-07-20 (Completed)
        prevBtn.click();
        await sleep(100);

        const badgeSlot = document.getElementById('weekly-badge-slot');
        const badgeStatus = document.getElementById('badge-status');

        assert(badgeSlot && badgeSlot.classList.contains('unlocked'), "Completed past week slot should have unlocked class");
        assert(badgeStatus && badgeStatus.textContent.includes('🏆 Pikachu Badge Earned!'), "Completed past week status should say Pikachu Badge Earned!");

        // 2. Click prevWeekBtn again for 2026-07-13 (Unearned)
        prevBtn.click();
        await sleep(100);

        assert(badgeSlot && badgeSlot.classList.contains('locked'), "Unearned past week slot should have locked class");
        assert(badgeStatus && badgeStatus.textContent.includes('The Pokémon Fled!'), "Unearned past week status should say The Pokémon Fled!");
        assert(badgeSlot.querySelector('img.silhouette') !== null, "Unearned past week should show silhouette image");

        // 3. Set viewing week to legacy archived week (before earliest history entry)
        helpers.setViewingWeekStartDate('2026-07-06');
        helpers.renderState(false);
        await sleep(100);

        assert(badgeSlot && badgeSlot.classList.contains('locked'), "Legacy past week slot should have locked class");
        assert(badgeStatus && badgeStatus.textContent.includes('Archived Training Week'), "Legacy past week status should say Archived Training Week");
        assert(badgeSlot.querySelector('img[alt="Archived"]') !== null, "Legacy past week should show Pokéball archived image");

        // Clean up
        helpers.resetState();
        await sleep(50);
      }

      // ==========================================
      // Test Case 50: Parent Admin Passcode Update Lifecycle
      // ==========================================
      {
        console.log("Running Test Case 50: Parent Admin Passcode Update Lifecycle...");
        const helpers = window.__test_helpers__;
        const state = window.__app_state__;
        helpers.resetState();

        const adminBtn = document.getElementById('admin-btn');
        const passwordModal = document.getElementById('password-modal');
        const passwordInput = document.getElementById('password-input');
        const passwordSubmit = document.getElementById('password-submit-btn');
        const adminModal = document.getElementById('admin-modal');

        assert(adminBtn !== null, "Admin button should exist");
        assert(passwordModal !== null, "Password modal should exist");

        // 1. Attempt wrong password
        adminBtn.click();
        await sleep(50);
        assert(!passwordModal.classList.contains('hidden'), "Password verification modal should open");
        
        passwordInput.value = "wrong_passcode";
        passwordSubmit.click();
        await sleep(50);
        assert(adminModal.classList.contains('hidden'), "Admin panel should remain hidden on wrong password");
        const passwordError = document.getElementById('password-error');
        assert(passwordError && !passwordError.classList.contains('hidden'), "Wrong password message should show");

        // 2. Open with default password
        passwordInput.value = "zxcv";
        passwordSubmit.click();
        await sleep(100);
        assert(!adminModal.classList.contains('hidden'), "Admin panel should open on correct password");

        // 3. Change passcode in Admin Panel
        const newPasscodeInput = document.getElementById('admin-new-passcode-input');
        const updatePasscodeBtn = document.getElementById('admin-change-passcode-btn');

        assert(newPasscodeInput !== null, "New passcode input should exist in admin panel");
        assert(updatePasscodeBtn !== null, "Update passcode button should exist in admin panel");

        newPasscodeInput.value = "abcd";
        
        updatePasscodeBtn.click();
        await sleep(100);

        // Verify local state updated
        assert(state.adminPassword === "abcd", `Local state adminPassword should update to abcd, got ${state.adminPassword}`);

        // Close Admin Modal
        const closeAdminBtn = document.getElementById('close-admin-modal-btn');
        if (closeAdminBtn) closeAdminBtn.click();
        await sleep(50);

        // 4. Try opening again - verify old password fails
        adminBtn.click();
        await sleep(50);
        
        passwordInput.value = "zxcv";
        passwordSubmit.click();
        await sleep(50);
        assert(adminModal.classList.contains('hidden'), "Admin panel should remain hidden on old password zxcv");

        // 5. Verify new password abcd successfully opens the admin panel
        passwordInput.value = "abcd";
        passwordSubmit.click();
        await sleep(100);
        assert(!adminModal.classList.contains('hidden'), "Admin panel should open on new passcode abcd");

        // Clean up and restore default passcode zxcv
        state.adminPassword = "zxcv";
        helpers.saveState();
        if (closeAdminBtn) closeAdminBtn.click();
        helpers.resetState();
        await sleep(50);
      }

      // ==========================================
      // Test Case 51: Pokémon Shop Sorting (Alphabetical vs Number)
      // ==========================================
      {
        console.log("Running Test Case 51: Pokémon Shop Sorting...");
        const helpers = window.__test_helpers__;
        helpers.resetState();
        await sleep(50);

        // 1. Open Shop
        helpers.openPokemonShop();
        await sleep(100);

        const sortSelect = document.getElementById('shop-sort-by');
        assert(sortSelect !== null, "Sort select should exist in shop");

        // Helper to get current visible card IDs
        const getVisibleCardIds = () => {
          const cards = document.querySelectorAll('#shop-items-grid .shop-item-card');
          return Array.from(cards).map(card => parseInt(card.dataset.id, 10));
        };

        // 2. Default Sort (should be by Number)
        assert(sortSelect.value === 'number', "Default sort option should be 'number'");
        const defaultIds = getVisibleCardIds();
        
        // Verify default IDs are sorted numerically
        const sortedDefaultIds = [...defaultIds].sort((a, b) => a - b);
        assert(JSON.stringify(defaultIds) === JSON.stringify(sortedDefaultIds), "Default sort should be numerical");

        // 3. Switch to Alphabetical Sort
        sortSelect.value = 'name';
        sortSelect.dispatchEvent(new Event('change'));
        await sleep(100);

        const alphabeticalIds = getVisibleCardIds();
        
        // Verify alphabetical IDs are sorted by name
        const expectedAlphabeticalIds = [...alphabeticalIds].sort((a, b) => {
          const nameA = getPokemonName(a).toLowerCase();
          const nameB = getPokemonName(b).toLowerCase();
          if (nameA < nameB) return -1;
          if (nameA > nameB) return 1;
          return a - b;
        });
        
        assert(JSON.stringify(alphabeticalIds) === JSON.stringify(expectedAlphabeticalIds), "Shop cards should be sorted alphabetically");

        // 4. Switch back to Number Sort
        sortSelect.value = 'number';
        sortSelect.dispatchEvent(new Event('change'));
        await sleep(100);

        const refilteredIds = getVisibleCardIds();
        assert(JSON.stringify(refilteredIds) === JSON.stringify(defaultIds), "Switching back to number sort should restore default numerical order");

        // Clean up
        const closeShopBtn = document.getElementById('close-shop-modal-btn');
        if (closeShopBtn) closeShopBtn.click();
        await sleep(50);
      }

      // Test Case 52: Historical Week Badge Theme Alignment
      {
        console.log("Running Test Case 52: Historical Week Badge Theme Alignment...");
        const helpers = window.__test_helpers__;
        helpers.resetState();
        
        const state = window.__app_state__;
        state.weekStartDate = '2026-08-17'; // Current week
        state.megaWeeks = 1; // Current megaWeeks (Week 2 of cycle)
        state.weeklyHistory = {
          '2026-08-10': {
            weekStartDay: 0,
            weeklyClaimed: true,
            badgeId: 25, // Pikachu
            reward: 'Bonus Time',
            megaWeeks: 0 // Stored megaWeeks for this week was 0 (Week 1)
          }
        };
        helpers.saveState();
        
        // Set viewing week to past week (2026-08-10)
        helpers.setViewingWeekStartDate('2026-08-10');
        helpers.renderState(true);
        await sleep(100);
        
        const badgeSlot = document.getElementById('weekly-badge-slot');
        assert(badgeSlot !== null, "Badge slot should exist");
        assert(badgeSlot.classList.contains('unlocked'), "Past week slot should be unlocked");
        
        // Assert it has badge-theme-1 (Blue), and NOT badge-theme-2 (Cyan)
        assert(badgeSlot.classList.contains('badge-theme-1'), "Past week badge should have badge-theme-1 (Blue)");
        assert(!badgeSlot.classList.contains('badge-theme-2'), "Past week badge should NOT have badge-theme-2 (Cyan)");
        
        // Reset viewing week
        helpers.setViewingWeekStartDate(null);
        helpers.renderState(true);
        await sleep(50);
      }

      // Test Case 53: Edit Past Week Before Reset
      {
        console.log("Running Test Case 53: Edit Past Week Before Reset...");
        const helpers = window.__test_helpers__;
        helpers.resetState();
        
        const state = window.__app_state__;
        const realToday = getLocalDate(state?.timezoneOffset);
        // Set weekStartDate to 10 days ago, so today is definitely in the next week (or later)
        const tenDaysAgo = new Date(realToday.getTime() - 10 * 24 * 60 * 60 * 1000);
        const pastWeekStartStr = formatLocalDate(getWeekStart(tenDaysAgo, state.weekStartDay));
        
        state.weekStartDate = pastWeekStartStr;
        state.weeklyHistory = {}; // No history yet (haven't reset)
        
        // Find a day to click that is NOT today's day of week
        const todayDay = realToday.getDay();
        const targetRealDay = (todayDay + 1) % 7;
        const targetCol = (targetRealDay - state.weekStartDay + 7) % 7;
        
        state.activeDay = todayDay; // Set to today, so target is different
        helpers.saveState();
        
        // We are viewing the week of interest
        helpers.setViewingWeekStartDate(pastWeekStartStr);
        helpers.renderState(true);
        await sleep(100);
        
        // Try to switch active day to the target column
        const targetHeader = document.querySelector(`.day-header[data-day="${targetCol}"]`);
        assert(targetHeader !== null, `Target header (col ${targetCol}) should exist`);
        
        // Click it. It should prompt to switch day.
        targetHeader.click();
        await sleep(100);
        
        const confirmModal = document.getElementById('confirm-modal');
        const confirmBtn = document.getElementById('confirm-yes-btn');
        assert(confirmModal !== null && !confirmModal.classList.contains('hidden'), "Confirm modal should be visible");
        confirmBtn.click();
        await sleep(100);
        
        // Now check if target column is active and inputs are NOT disabled
        const targetCells = document.querySelectorAll(`td.checkbox-cell label input[data-day="${targetCol}"]`);
        assert(targetCells.length > 0, `Should find target cells (col ${targetCol})`);
        
        targetCells.forEach(input => {
          assert(!input.disabled, `Target cells (col ${targetCol}) should NOT be disabled`);
          const cell = input.closest('td');
          assert(cell.classList.contains('active-column'), `Target cell (col ${targetCol}) should have active-column class`);
        });
        
        // Reset viewing week
        helpers.setViewingWeekStartDate(null);
        helpers.renderState(true);
        await sleep(50);
      }

      // Test Case 54: No Default Yellow Header in Past Week & Reset Behavior
      {
        console.log("Running Test Case 54: No Default Yellow Header in Past Week & Reset Behavior...");
        const helpers = window.__test_helpers__;
        helpers.resetState();
        
        const state = window.__app_state__;
        const realToday = getLocalDate(state?.timezoneOffset);
        // Set weekStartDate to 10 days ago (past week)
        const tenDaysAgo = new Date(realToday.getTime() - 10 * 24 * 60 * 60 * 1000);
        const pastWeekStartStr = formatLocalDate(getWeekStart(tenDaysAgo, state.weekStartDay));
        
        state.weekStartDate = pastWeekStartStr;
        state.weeklyHistory = {};
        
        // Simulating profile load with past week.
        const currentRealWeekStart = formatLocalDate(getWeekStart(realToday, state.weekStartDay || 0));
        const isTodayInActiveWeek = state.weekStartDate && (currentRealWeekStart === state.weekStartDate);
        
        assert(!isTodayInActiveWeek, "Today should not be in active week for this test");
        
        // This is what selectProfile does on startup if today is not in active week
        state.activeDay = -1;
        helpers.saveState();
        
        helpers.setViewingWeekStartDate(pastWeekStartStr);
        helpers.renderState(true);
        await sleep(100);
        
        // Assert no header is yellow (active-day class)
        const yellowHeaders = document.querySelectorAll('.day-header.active-day');
        assert(yellowHeaders.length === 0, "No header should be yellow by default in past week");
        
        // Assert no cells have active-column class
        const activeColumns = document.querySelectorAll('td.active-column');
        assert(activeColumns.length === 0, "No cells should have active-column class");
        
        // Click Wednesday to activate it
        const wednesdayHeader = document.querySelector(`.day-header[data-day="3"]`);
        assert(wednesdayHeader !== null, "Wednesday header should exist");
        wednesdayHeader.click();
        await sleep(100);
        
        // Confirm Switch
        const confirmModal = document.getElementById('confirm-modal');
        const confirmBtn = document.getElementById('confirm-yes-btn');
        assert(confirmModal !== null && !confirmModal.classList.contains('hidden'), "Confirm modal should show");
        confirmBtn.click();
        await sleep(100);
        
        // Assert Wednesday header is NOT yellow (since it is a past week)
        assert(!wednesdayHeader.classList.contains('active-day'), "Wednesday header should NOT become yellow (since it is a past week)");
        
        // Assert Wednesday cells have active-column class
        const wednesdayCells = document.querySelectorAll(`td.checkbox-cell label input[data-day="3"]`);
        wednesdayCells.forEach(input => {
          const cell = input.closest('td');
          assert(cell.classList.contains('active-column'), "Wednesday cell should have active-column class");
        });
        
        // Now test Reset behavior: it should restore activeDay to today
        const resetBtn = document.getElementById('reset-btn');
        assert(resetBtn !== null, "Reset button should exist");
        
        resetBtn.click();
        await sleep(100);
        
        // Confirm reset
        const resetConfirmBtn = document.getElementById('confirm-yes-btn');
        assert(resetConfirmBtn !== null, "Reset confirm button should exist");
        resetConfirmBtn.click();
        await sleep(150); // Wait for reset to complete and render
        
        // Assert state.weekStartDate is now currentRealWeekStart
        assert(state.weekStartDate === currentRealWeekStart, "Week start date should be advanced to current week");
        
        // Assert activeDay is today
        const todayDay = realToday.getDay();
        assert(state.activeDay === todayDay, "activeDay should be reset to today");
        
        // Assert today's header is yellow
        const todayColumnIndex = (todayDay - state.weekStartDay + 7) % 7;
        const todayHeader = document.querySelector(`.day-header[data-day="${todayColumnIndex}"]`);
        assert(todayHeader.classList.contains('active-day'), "Today's header should be yellow after reset");
        
        // Reset viewing week
        helpers.setViewingWeekStartDate(null);
        helpers.renderState(true);
        await sleep(50);
      }

      // Test Case 55: Debug Panel Close Button Lifecycle
      {
        console.log("Running Test Case 55: Debug Panel Close Button Lifecycle...");
        const helpers = window.__test_helpers__;
        helpers.resetState();

        const state = window.__app_state__;
        const debugSidebar = document.getElementById('debug-sidebar');
        const toggleCheckbox = document.getElementById('toggle-debug-sidebar');
        const closeBtn = document.getElementById('close-debug-sidebar-btn');

        assert(closeBtn !== null, "Debug panel close button should exist");

        // 1. Enable Debug Sidebar
        state.debugSidebarEnabled = true;
        helpers.saveState();
        helpers.renderState(true);
        await sleep(50);

        assert(!debugSidebar.classList.contains('hidden'), "Debug sidebar should be visible when enabled");
        assert(toggleCheckbox.checked === true, "Admin toggle checkbox should be checked");

        // 2. Click the Close button directly on the Debug Panel
        closeBtn.click();
        await sleep(50);

        // 3. Verify Debug Sidebar is hidden, state is false, and admin toggle is unchecked
        assert(state.debugSidebarEnabled === false, "state.debugSidebarEnabled should be false after closing");
        assert(debugSidebar.classList.contains('hidden'), "Debug sidebar should be hidden after clicking close");
        assert(toggleCheckbox.checked === false, "Admin toggle checkbox should be unchecked after closing debug sidebar");
      }

      // Test Case 56: Sticky Mini-HUD Layout Structure and Dynamic Sync
      {
        console.log("Running Test Case 56: Sticky Mini-HUD Layout Structure and Dynamic Sync...");
        const helpers = window.__test_helpers__;
        helpers.resetState();

        const miniHud = document.getElementById('mini-hud');
        const layoutContainer = document.querySelector('.layout-container');
        const miniHudSprite = document.getElementById('mini-hud-sprite');
        const miniHudName = document.getElementById('mini-hud-name');
        const miniHudLevel = document.getElementById('mini-hud-level');
        const miniHudXpBar = document.getElementById('mini-hud-xp-bar');

        assert(miniHud !== null, "Mini-HUD element should exist in DOM");
        assert(layoutContainer !== null, "Layout container should exist in DOM");
        
        // 1. Verify Mini-HUD is placed outside .layout-container and NOT before it as a flex column sibling
        assert(!layoutContainer.contains(miniHud), "Mini-HUD should not be inside .layout-container");
        assert(miniHud.previousElementSibling !== null, "Mini-HUD should not precede .layout-container as an in-flow flex sibling");

        // 2. Verify dynamic partner data sync
        helpers.renderState(true);
        await sleep(50);

        assert(miniHudName.textContent !== "", "Mini-HUD name should be dynamically populated");
        assert(miniHudLevel.textContent.startsWith("LV"), "Mini-HUD level should display LV prefix");
        assert(miniHudSprite.src !== "", "Mini-HUD sprite source should be set");

        // 3. Verify visibility class toggling
        miniHud.classList.add('visible');
        assert(miniHud.classList.contains('visible'), "Mini-HUD should support visible class");
        miniHud.classList.remove('visible');
        assert(!miniHud.classList.contains('visible'), "Mini-HUD should clear visible class");
      }

      // Test Case 57: Reward Inline Editing, Drag-and-Drop Reordering, and Dropdown Sync
      {
        console.log("Running Test Case 57: Reward Inline Editing, Drag-and-Drop Reordering, and Dropdown Sync...");
        const helpers = window.__test_helpers__;
        helpers.resetState();

        const state = window.__app_state__;
        const mockProfileId = "test_profile_edit_drag";
        const initialWeekly = [
          { value: "Reward Alpha", text: "Reward Alpha" },
          { value: "Reward Beta", text: "Reward Beta" },
          { value: "Reward Gamma", text: "Reward Gamma" }
        ];
        const initialMega = [
          { value: "Mega 1", text: "Mega 1" },
          { value: "Mega 2", text: "Mega 2" }
        ];

        state.weeklyRewardOptions = [...initialWeekly];
        state.megaRewardOptions = [...initialMega];
        state.reward = "Reward Beta"; // Select the middle item
        state.megaReward = "Mega 1";

        helpers.setProfilesList([
          {
            id: mockProfileId,
            name: "Kepler",
            state: {
              weeklyRewardOptions: [...initialWeekly],
              megaRewardOptions: [...initialMega]
            }
          }
        ]);
        helpers.setActiveProfileId(mockProfileId);
        helpers.renderAdminProfilesList();
        helpers.renderRewardDropdowns();
        await sleep(50);

        const rewardSelect = document.getElementById('reward-select');
        const megaRewardSelect = document.getElementById('mega-reward-select');
        assert(rewardSelect.value === "Reward Beta", "Initial reward select should be Reward Beta");

        // 1. Open Customize Rewards Modal
        const editRewardsBtn = document.querySelector(`.edit-rewards-btn[data-id="${mockProfileId}"]`);
        assert(editRewardsBtn !== null, "Customize rewards button should exist for profile");
        editRewardsBtn.click();
        await sleep(50);

        const modal = document.getElementById('edit-rewards-modal');
        assert(!modal.classList.contains('hidden'), "Customize rewards modal should be open");

        const weeklyList = document.getElementById('weekly-rewards-list');
        const weeklyItems = weeklyList.querySelectorAll('.reward-list-item');
        assert(weeklyItems.length === 3, "Modal should display 3 weekly rewards");

        // 2. Verify drag handle and edit buttons exist
        const firstItem = weeklyItems[0];
        const dragHandle = firstItem.querySelector('.reward-drag-handle');
        const editBtn = firstItem.querySelector('.edit-reward-btn');
        const delBtn = firstItem.querySelector('.delete-reward-btn');
        assert(dragHandle !== null, "Drag handle should exist on reward item");
        assert(editBtn !== null, "Edit button should exist on reward item");
        assert(delBtn !== null, "Delete button should exist on reward item");

        // 3. Test inline edit on first item ("Reward Alpha" -> "Reward Alpha Super")
        editBtn.click();
        await sleep(50);

        let activeInput = weeklyList.querySelector('.reward-edit-input');
        assert(activeInput !== null, "Inline edit input should appear when clicking edit");
        assert(activeInput.value === "Reward Alpha", "Inline edit input should have current text");

        activeInput.value = "Reward Alpha Super";
        const saveEditBtn = weeklyList.querySelector('.save-reward-edit-btn');
        assert(saveEditBtn !== null, "Save edit button should exist");
        saveEditBtn.click();
        await sleep(50);

        // Verify edited text in modal
        const updatedFirstItemText = weeklyList.querySelector('.reward-list-item .reward-item-text');
        assert(updatedFirstItemText.textContent === "Reward Alpha Super", "Reward text should be updated to Reward Alpha Super");

        // 4. Test inline edit on selected item ("Reward Beta" -> "Reward Beta Renamed")
        const secondItem = weeklyList.querySelectorAll('.reward-list-item')[1];
        const secondEditBtn = secondItem.querySelector('.edit-reward-btn');
        secondEditBtn.click();
        await sleep(50);

        activeInput = weeklyList.querySelector('.reward-edit-input');
        activeInput.value = "Reward Beta Renamed";
        const saveEditBtn2 = weeklyList.querySelector('.save-reward-edit-btn');
        saveEditBtn2.click();
        await sleep(50);

        // 5. Test drag and drop reordering simulation (move Gamma from index 2 to index 0)
        const lastRow = weeklyList.querySelectorAll('.reward-list-item')[2];
        const firstRow = weeklyList.querySelectorAll('.reward-list-item')[0];
        
        // Dispatch drag events
        const dataTransfer = new DataTransfer();
        lastRow.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer }));
        firstRow.dispatchEvent(new DragEvent('dragover', { bubbles: true, clientY: firstRow.getBoundingClientRect().top + 2, dataTransfer }));
        firstRow.dispatchEvent(new DragEvent('drop', { bubbles: true, clientY: firstRow.getBoundingClientRect().top + 2, dataTransfer }));
        lastRow.dispatchEvent(new DragEvent('dragend', { bubbles: true }));
        await sleep(50);

        // Verify reordered list in modal: Gamma should now be first
        const reorderedTexts = Array.from(weeklyList.querySelectorAll('.reward-item-text')).map(el => el.textContent);
        assert(reorderedTexts[0] === "Reward Gamma", "Reward Gamma should now be first after drag reordering");
        assert(reorderedTexts[1] === "Reward Alpha Super", "Reward Alpha Super should now be second");
        assert(reorderedTexts[2] === "Reward Beta Renamed", "Reward Beta Renamed should now be third");

        // 6. Save modal changes
        let savedProfileId = null;
        let savedWeekly = null;
        let savedMega = null;
        helpers.setSaveProfileRewardsMock((profileId, weekly, mega) => {
          savedProfileId = profileId;
          savedWeekly = weekly;
          savedMega = mega;
          const p = helpers.getProfilesList().find(p => p.id === profileId);
          if (p) {
            p.state.weeklyRewardOptions = weekly;
            p.state.megaRewardOptions = mega;
          }
          return Promise.resolve();
        });

        const saveModalBtn = document.getElementById('edit-rewards-save-btn');
        saveModalBtn.click();
        await sleep(100);

        assert(modal.classList.contains('hidden'), "Modal should close after saving");
        assert(savedProfileId === mockProfileId, "Save should be called with active profileId");
        assert(savedWeekly[0].text === "Reward Gamma", "Saved list should have Reward Gamma as first option");
        assert(savedWeekly[1].text === "Reward Alpha Super", "Saved list should have Reward Alpha Super as second option");
        assert(savedWeekly[2].text === "Reward Beta Renamed", "Saved list should have Reward Beta Renamed as third option");

        // 7. Verify main app dropdown options and active selection sync
        const selectOptions = Array.from(rewardSelect.options).filter(o => !o.disabled && !o.parentElement.classList.contains('recent-rewards-group')).map(o => o.text);
        assert(selectOptions[0] === "Reward Gamma", "Dropdown first option should be Reward Gamma");
        assert(selectOptions[1] === "Reward Alpha Super", "Dropdown second option should be Reward Alpha Super");
        assert(selectOptions[2] === "Reward Beta Renamed", "Dropdown third option should be Reward Beta Renamed");

        assert(state.reward === "Reward Beta Renamed", "Active reward state should automatically update to renamed text");
        assert(rewardSelect.value === "Reward Beta Renamed", "Dropdown selected value should be synced to renamed reward");
      }

      // ----------------------------------------------------
      // TEST CASE 58: Parent Admin "Save Activities" Custom Modal Notification & Validation
      // ----------------------------------------------------
      console.log("Running Test Case 58: Parent Admin Save Activities Custom Modal Notification...");
      {
        const adminBtn = document.getElementById('admin-btn');
        const adminModal = document.getElementById('admin-modal');
        const passwordModal = document.getElementById('password-modal');
        const passwordInput = document.getElementById('password-input');
        const passwordSubmitBtn = document.getElementById('password-submit-btn');
        const saveTasksBtn = document.getElementById('admin-save-tasks-btn');
        const addTaskBtn = document.getElementById('admin-add-task-btn');
        const closeAdminBtn = document.getElementById('close-admin-modal-btn');

        // Open Admin Panel
        adminBtn.click();
        passwordInput.value = window.__test_helpers__.ADMIN_PASSWORD;
        passwordSubmitBtn.click();
        await sleep(50);
        assert(!adminModal.classList.contains('hidden'), "Admin Modal should be visible");

        // Clean up any lingering notif modals
        document.querySelectorAll('.notif-modal').forEach(el => el.remove());

        // Spy on native alert
        let nativeAlertCalled = false;
        const origAlert = window.alert;
        window.alert = () => { nativeAlertCalled = true; };

        // Click Save Activities
        saveTasksBtn.click();
        await sleep(100);

        assert(!nativeAlertCalled, "Native alert should NOT be triggered on Save Activities");
        const notifModals = document.querySelectorAll('.notif-modal');
        const successModal = notifModals[notifModals.length - 1];
        assert(successModal !== undefined && successModal !== null, "Custom notification modal should appear on Save Activities");
        assert(successModal.querySelector('h2').textContent.includes("Activities Saved"), "Notification title should say Activities Saved");
        assert(successModal.querySelector('.notif-body-text').textContent.includes("Activities saved successfully!"), "Notification body should confirm activities saved");
        
        // Dismiss success modal
        const closeSuccessBtn = successModal.querySelector('.notif-close-btn');
        assert(closeSuccessBtn !== null, "Notification close button should exist");
        closeSuccessBtn.click();
        successModal.remove();
        await sleep(100);

        // Test Validation Error: Add empty task and click Save Activities
        addTaskBtn.click();
        const taskList = document.getElementById('admin-tasks-list');
        const items = taskList.querySelectorAll('.admin-task-item');
        const emptyItem = items[items.length - 1];
        emptyItem.querySelector('.task-name-input').value = ""; // Clear name

        saveTasksBtn.click();
        await sleep(100);

        assert(!nativeAlertCalled, "Native alert should NOT be triggered on empty activity name error");
        const errorModals = document.querySelectorAll('.notif-modal');
        const errModal = errorModals[errorModals.length - 1];
        assert(errModal !== undefined && errModal !== null, "Custom notification modal should appear for empty activity error");
        assert(errModal.querySelector('h2').textContent.includes("Activity Error"), "Error notification title should indicate Activity Error");
        assert(errModal.querySelector('.notif-body-text').textContent.includes("Activity name cannot be empty!"), "Error notification body should warn empty name");

        // Dismiss error modal
        const closeErrBtn = errModal.querySelector('.notif-close-btn');
        if (closeErrBtn) closeErrBtn.click();
        errModal.remove();
        await sleep(100);

        // Clean up: delete the temporary empty task item
        const initialTasksCount = state.tasks.length;
        state.tasks.pop(); // Remove temporary task
        window.__test_helpers__.renderState(false);

        closeAdminBtn.click();
        await sleep(100);
        assert(adminModal.classList.contains('hidden'), "Admin Modal should close");

        window.alert = origAlert;
      }

      // ----------------------------------------------------
      // TEST CASE 59: Week Start Change and Prev/Next Navigation Header Color Preservation
      // ----------------------------------------------------
      console.log("Running Test Case 59: Week Start Change and Prev/Next Navigation Header Color Preservation...");
      {
        const prevWeekBtn = document.getElementById('prev-week-btn');
        const nextWeekBtn = document.getElementById('next-week-btn');
        const adminWeekStartSelect = document.getElementById('admin-week-start-select');

        // Save original weekStartDay
        const originalStartDay = state.weekStartDay || 0;

        // Change Week Start Day to Friday (5)
        adminWeekStartSelect.value = "5";
        adminWeekStartSelect.dispatchEvent(new Event('change'));
        await sleep(100);

        // Auto-confirm the dialog if confirm modal appears
        const confirmYesBtn = document.getElementById('confirm-yes-btn');
        if (confirmYesBtn && !document.getElementById('confirm-modal').classList.contains('hidden')) {
          confirmYesBtn.click();
          await sleep(100);
        }

        state = window.__app_state__ || state;
        assert(state.weekStartDay === 5, "State weekStartDay should now be 5 (Friday)");

        // Populate a past week history entry to enable prev button
        state.weeklyHistory = state.weeklyHistory || {};
        state.weeklyHistory['2026-08-07'] = {
          weekStartDay: 5,
          weeklyClaimed: false,
          badgeId: null,
          reward: ''
        };
        window.__test_helpers__.saveState();
        window.__test_helpers__.renderState(true);
        await sleep(50);

        // 1. Check current week headers
        let headers = document.querySelectorAll('.day-header');
        assert(headers[0].textContent === 'FRI', "Column 0 header should be FRI");
        assert(headers[1].textContent === 'SAT', "Column 1 header should be SAT");
        assert(!headers[0].classList.contains('past-week-header'), "Current week FRI header should NOT have past-week-header class");
        assert(!headers[1].classList.contains('past-week-header'), "Current week SAT header should NOT have past-week-header class");

        // Verify computed background color is not the past-week grey (#cbd5e1 = rgb(203, 213, 225))
        const friBg = window.getComputedStyle(headers[0]).backgroundColor;
        assert(!friBg.includes('203, 213, 225'), "Current week FRI header should not be grey");

        // 2. Click "Prev" to navigate to historical week
        prevWeekBtn.click();
        await sleep(100);

        headers = document.querySelectorAll('.day-header');
        assert(headers[0].classList.contains('past-week-header'), "Past week FRI header should have past-week-header class");
        assert(headers[1].classList.contains('past-week-header'), "Past week SAT header should have past-week-header class");

        // 3. Click "Next" to navigate back to current week
        nextWeekBtn.click();
        await sleep(100);

        headers = document.querySelectorAll('.day-header');
        assert(!headers[0].classList.contains('past-week-header'), "Returned current week FRI header should NOT have past-week-header class");
        assert(!headers[1].classList.contains('past-week-header'), "Returned current week SAT header should NOT have past-week-header class");

        // Check computed colors for current week
        const returnedFriBg = window.getComputedStyle(headers[0]).backgroundColor;
        assert(!returnedFriBg.includes('203, 213, 225'), "Returned current week FRI header should NOT be grey");

        const todayCol = (state.activeDay - state.weekStartDay + 7) % 7;
        const activeHeader = headers[todayCol];
        assert(activeHeader.classList.contains('active-day'), "Active day header should have active-day class");

        // Restore original weekStartDay
        adminWeekStartSelect.value = String(originalStartDay);
        adminWeekStartSelect.dispatchEvent(new Event('change'));
        await sleep(100);
        if (confirmYesBtn && !document.getElementById('confirm-modal').classList.contains('hidden')) {
          confirmYesBtn.click();
          await sleep(100);
        }
        state = window.__app_state__ || state;
      }

      console.log("🎉 All regression tests passed successfully! Grid performance is optimized.");
      alert("🎉 All regression tests passed successfully!\nGrid rebuild count remained at 1 during checks.");
    } catch (e) {
      restoreMocks(); // Ensure mocks are restored on failure so alert works
      console.error("❌ Test Suite Failed:", e);
      alert("❌ Test Suite Failed: " + e.message);
    }
  }

  async function startTests() {
    console.log("Waiting for profiles to load from Firestore emulator...");
    for (let i = 0; i < 50; i++) {
      const profiles = window.__test_helpers__ ? window.__test_helpers__.getProfilesList() : [];
      if (profiles && profiles.length > 0) {
        console.log(`Profiles loaded! Count: ${profiles.length}. Starting suite...`);
        await runSuite();
        return;
      }
      await sleep(100);
    }
    console.error("❌ Timeout waiting for profiles to load from Firestore emulator.");
    alert("❌ Timeout waiting for profiles to load from Firestore emulator.");
  }
  
  startTests();
