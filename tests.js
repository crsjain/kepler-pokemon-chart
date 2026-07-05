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
      assert(window.__grid_rebuild_count__ === 1, "Grid should have been built exactly once on reset");

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

      // 3. Test Level Up and Performance
      console.log("Testing Level Up without grid rebuild...");
      const tasks = state.tasks;
      // We will check all tasks for Day 0 and Day 1, and some for Day 2 to reach 100 XP (Level Up)
      // Day 0: 5 tasks * 5 XP + 15 Daily Bonus = 40 XP
      // Day 1: 5 tasks * 5 XP + 15 Daily Bonus = 40 XP (Total 80 XP)
      // Day 2: 4 tasks * 5 XP = 20 XP (Total 100 XP -> Level Up)
      
      // Let's click Day 0
      for (const task of tasks) {
        const cb = document.querySelector(`input[data-day="0"][data-task="${task.id}"]`);
        cb.click();
        await sleep(50);
      }
      assert(state.grid['0-piano'] === true, "Day 0 Piano should be checked");
      assert(window.__grid_rebuild_count__ === 1, "Grid should not rebuild during Day 0 checks");

      // Let's click Day 1
      for (const task of tasks) {
        const cb = document.querySelector(`input[data-day="1"][data-task="${task.id}"]`);
        cb.click();
        await sleep(50);
      }
      assert(window.__grid_rebuild_count__ === 1, "Grid should not rebuild during Day 1 checks");

      // Click 4 tasks on Day 2 to trigger Level Up
      for (let i = 0; i < 4; i++) {
        const cb = document.querySelector(`input[data-day="2"][data-task="${tasks[i].id}"]`);
        cb.click();
        await sleep(50);
      }

      // Check level
      assert(state.partnersData[state.partnerFamily].level === 2, "Should level up to Level 2");
      assert(document.getElementById('pokemon-level').textContent === '2', "Level badge should show 2");
      assert(window.__grid_rebuild_count__ === 1, "Grid should NOT have rebuilt even after leveling up!");

      console.log("🎉 All regression tests passed successfully! Grid performance is optimized.");
      alert("🎉 All regression tests passed successfully!\nGrid rebuild count remained at 1 (Optimized!).");
    } catch (e) {
      console.error("❌ Test Suite Failed:", e);
      alert("❌ Test Suite Failed: " + e.message);
    }
  }

  setTimeout(runSuite, 1000);
})();
