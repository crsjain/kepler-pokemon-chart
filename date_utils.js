export function formatLocalDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getWeekStart(d, weekStartDay = 0) {
  const copy = new Date(d.getTime());
  const day = copy.getDay();
  const diff = (day - weekStartDay + 7) % 7;
  const start = new Date(copy.setDate(copy.getDate() - diff));
  start.setHours(0,0,0,0);
  return start;
}

export function getSunday(d) {
  return getWeekStart(d, 0);
}

export function getDateOfColumn(weekStartDateStr, d) {
  const baseDate = new Date(weekStartDateStr + 'T00:00:00');
  baseDate.setDate(baseDate.getDate() + d);
  return formatLocalDate(baseDate);
}

export function getLocalDate(timeZone = 'default') {
  const d = new Date();
  if (timeZone && timeZone !== 'default') {
    try {
      const tzString = d.toLocaleString("en-US", { timeZone });
      return new Date(tzString);
    } catch (e) {
      console.error("Invalid timezone:", timeZone);
    }
  }
  return d;
}

export function getFormattedDateRange(startDateStr, endDateStr, isPartial = false, activeDaysCount = 7) {
  if (!startDateStr || !endDateStr) return "Loading Week...";
  const startDate = new Date(startDateStr + 'T00:00:00');
  const endDate = new Date(endDateStr + 'T00:00:00');
  
  const options = { month: 'short', day: 'numeric' };
  const startPart = startDate.toLocaleDateString('en-US', options);
  
  let endPart = "";
  if (startDate.getMonth() === endDate.getMonth()) {
    endPart = endDate.getDate();
  } else {
    endPart = endDate.toLocaleDateString('en-US', options);
  }
  
  const baseRange = `${startPart} - ${endPart}, ${endDate.getFullYear()}`;
  if (isPartial) {
    const dayLabel = activeDaysCount === 1 ? 'Day' : 'Days';
    return `${baseRange} • ${activeDaysCount} ${dayLabel} (Start Day Adjusted 📅)`;
  }
  return baseRange;
}

export function getHistoricalWeekIntervals(state, viewingDateStr = null) {
  if (!state) return [];
  
  const weeklyHistory = state.weeklyHistory || {};
  const dateSet = new Set();
  
  // Add history entries that are on or before the current week
  Object.keys(weeklyHistory).forEach(dateKey => {
    if (!state.weekStartDate || dateKey <= state.weekStartDate) {
      dateSet.add(dateKey);
    }
  });
  
  if (state.weekStartDate) {
    dateSet.add(state.weekStartDate);
  }
  if (viewingDateStr) {
    dateSet.add(viewingDateStr);
  }
  
  const sortedDates = Array.from(dateSet).sort();
  if (sortedDates.length === 0) return [];
  
  const intervals = [];
  
  for (let i = 0; i < sortedDates.length; i++) {
    const startDateStr = sortedDates[i];
    const isCurrentWeek = (startDateStr === state.weekStartDate);
    const historyEntry = weeklyHistory[startDateStr] || {};
    
    // Determine weekStartDay for this interval
    let weekStartDay = 0;
    if (isCurrentWeek) {
      weekStartDay = state.weekStartDay !== undefined ? state.weekStartDay : 0;
    } else if (historyEntry.weekStartDay !== undefined) {
      weekStartDay = historyEntry.weekStartDay;
    } else {
      weekStartDay = state.weekStartDay !== undefined ? state.weekStartDay : 0;
    }
    
    const startDate = new Date(startDateStr + 'T00:00:00');
    const nominalEndDate = new Date(startDate.getTime());
    nominalEndDate.setDate(startDate.getDate() + 6);
    const nominalEndDateStr = formatLocalDate(nominalEndDate);
    
    let actualEndDateStr = nominalEndDateStr;
    if (isCurrentWeek && state.pendingWeekStartDate && state.pendingWeekStartDate > startDateStr) {
      // Current active week is shortened by pending future start date
      const pendingNext = new Date(state.pendingWeekStartDate + 'T00:00:00');
      const dayBeforePending = new Date(pendingNext.getTime());
      dayBeforePending.setDate(pendingNext.getDate() - 1);
      const dayBeforePendingStr = formatLocalDate(dayBeforePending);
      if (dayBeforePendingStr < nominalEndDateStr) {
        actualEndDateStr = dayBeforePendingStr >= startDateStr ? dayBeforePendingStr : startDateStr;
      }
    } else if (!isCurrentWeek && i < sortedDates.length - 1) {
      const nextStartDateStr = sortedDates[i + 1];
      const nextStartDate = new Date(nextStartDateStr + 'T00:00:00');
      const dayBeforeNext = new Date(nextStartDate.getTime());
      dayBeforeNext.setDate(nextStartDate.getDate() - 1);
      const dayBeforeNextStr = formatLocalDate(dayBeforeNext);
      
      // actualEndDate is min(nominalEndDate, dayBeforeNext)
      if (dayBeforeNextStr < nominalEndDateStr) {
        actualEndDateStr = dayBeforeNextStr >= startDateStr ? dayBeforeNextStr : startDateStr;
      }
    }
    
    const actualEndDate = new Date(actualEndDateStr + 'T00:00:00');
    const diffTime = actualEndDate.getTime() - startDate.getTime();
    const activeDaysCount = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);
    const isPartial = (actualEndDateStr < nominalEndDateStr);
    
    const activeDates = [];
    const supersededDates = [];
    const allWeekColumnDates = [];
    
    for (let d = 0; d < 7; d++) {
      const colDateStr = getDateOfColumn(startDateStr, d);
      allWeekColumnDates.push(colDateStr);
      if (colDateStr <= actualEndDateStr) {
        activeDates.push(colDateStr);
      } else {
        supersededDates.push(colDateStr);
      }
    }
    
    const rangeDisplay = getFormattedDateRange(startDateStr, actualEndDateStr, isPartial, activeDaysCount);
    
    intervals.push({
      startDate: startDateStr,
      actualEndDate: actualEndDateStr,
      nominalEndDate: nominalEndDateStr,
      weekStartDay,
      isPartial,
      activeDaysCount,
      rangeDisplay,
      activeDates,
      supersededDates,
      allWeekColumnDates,
      isCurrentWeek,
      history: historyEntry
    });
  }
  
  return intervals;
}

/**
 * Resolves all 7 column states for a given week in a single optimized pass.
 * Single source of truth for header styling, cell rendering, and interaction gating.
 *
 * @param {Object} state - Current global application state
 * @param {string} [viewingWeekStartDate] - 'YYYY-MM-DD' of the currently viewed week
 * @param {Object} [options] - Optional overrides (e.g. { allowFutureEdits })
 * @returns {Array<Object>} Array of 7 resolved column state objects
 */
export function getWeekColumnStates(state, viewingWeekStartDate = null, options = {}) {
  if (!state) return [];
  
  const localDateObj = getLocalDate(state?.timezoneOffset);
  const todayStr = formatLocalDate(localDateObj);
  const currentViewWeek = viewingWeekStartDate || state.weekStartDate || formatLocalDate(getWeekStart(localDateObj, state?.weekStartDay ?? 0));
  const isPastWeek = !!(state.weekStartDate && currentViewWeek < state.weekStartDate);
  const currentRealWeekStart = formatLocalDate(getWeekStart(localDateObj, state?.weekStartDay ?? 0));
  const isViewingWeekInPast = currentViewWeek < currentRealWeekStart;
  
  const intervals = getHistoricalWeekIntervals(state, currentViewWeek);
  const currentInterval = intervals.find(i => i.startDate === currentViewWeek) || null;
  const viewingStartDay = currentInterval ? currentInterval.weekStartDay : (state.weekStartDay ?? 0);
  
  let allowFutureEdits = false;
  if (options && options.allowFutureEdits !== undefined) {
    allowFutureEdits = !!options.allowFutureEdits;
  } else if (typeof window !== 'undefined' && window.__mock_allow_future_edits__ !== undefined) {
    allowFutureEdits = !!window.__mock_allow_future_edits__;
  } else if (typeof location !== 'undefined' && location.search && location.search.includes('runTests=true')) {
    allowFutureEdits = true;
  }
  
  const activeDay = state.activeDay !== undefined ? state.activeDay : -1;
  const activeColumn = (isPastWeek || activeDay === -1) 
    ? -1 
    : (activeDay - viewingStartDay + 7) % 7;

  const columns = [];

  for (let colIndex = 0; colIndex < 7; colIndex++) {
    const dateStr = getDateOfColumn(currentViewWeek, colIndex);
    const dayOfWeek = (viewingStartDay + colIndex) % 7;
    
    const isSupersededInHistory = !!(currentInterval?.supersededDates?.includes(dateStr));
    const isPendingLocked = !!(!isPastWeek && state.pendingWeekStartDate && dateStr >= state.pendingWeekStartDate);
    const isSuperseded = isSupersededInHistory || isPendingLocked;
    const isFutureDay = dateStr > todayStr;
    const isToday = (dateStr === todayStr);
    const isActive = (colIndex === activeColumn && !isPastWeek);

    let stateKey = '';
    let headerClass = '';
    let cellClass = '';
    let tooltip = '';
    let canSelectHeader = false;
    let requiresSwitchConfirmation = false;
    let canCheckTaskNormal = false;
    let canToggleException = false;
    let isCellDisabled = true;

    // Strict Precedence Order
    if (isSuperseded) {
      stateKey = 'SUPERSEDED';
      headerClass = 'superseded-header';
      cellClass = 'superseded-cell';
      tooltip = 'These days moved to your new chart! 🚀';
      canSelectHeader = false;
      requiresSwitchConfirmation = false;
      canCheckTaskNormal = false;
      canToggleException = false;
      isCellDisabled = true;
    } else if (isPastWeek) {
      stateKey = 'HISTORICAL';
      headerClass = 'past-week-header';
      cellClass = 'historical-cell';
      tooltip = '';
      canSelectHeader = false;
      requiresSwitchConfirmation = false;
      canCheckTaskNormal = false;
      canToggleException = false;
      isCellDisabled = true;
    } else if (isFutureDay && !allowFutureEdits) {
      stateKey = 'FUTURE_LOCKED';
      headerClass = 'future-day-header';
      cellClass = 'future-cell';
      tooltip = '';
      canSelectHeader = false;
      requiresSwitchConfirmation = false;
      canCheckTaskNormal = false;
      canToggleException = true; // Scenario 10: Parent can configure exceptions on future non-superseded days
      isCellDisabled = true;
    } else if (isActive) {
      if (isToday) {
        stateKey = 'ACTIVE_TODAY';
      } else if (isFutureDay) {
        stateKey = 'ACTIVE_FUTURE';
      } else {
        stateKey = 'ACTIVE_PAST';
      }
      headerClass = isViewingWeekInPast ? '' : 'active-day';
      cellClass = 'active-column';
      tooltip = '';
      canSelectHeader = false; // Already selected
      requiresSwitchConfirmation = false;
      canCheckTaskNormal = true;
      canToggleException = true;
      isCellDisabled = false;
    } else if (isToday) {
      stateKey = 'SELECTABLE_TODAY';
      headerClass = '';
      cellClass = '';
      tooltip = '';
      canSelectHeader = true;
      requiresSwitchConfirmation = false; // Zero friction to jump back to today
      canCheckTaskNormal = false; // Must select column first
      canToggleException = true;
      isCellDisabled = false; // Enabled so clicking prompts day switch
    } else {
      stateKey = 'SELECTABLE_PAST';
      headerClass = '';
      cellClass = '';
      tooltip = '';
      canSelectHeader = true;
      requiresSwitchConfirmation = true; // Requires "Switch Active Day" confirmation modal
      canCheckTaskNormal = false;
      canToggleException = true;
      isCellDisabled = false; // Enabled so clicking prompts day switch
    }


    columns.push({
      columnIndex: colIndex,
      dayOfWeek,
      dateStr,
      state: stateKey,
      headerClass,
      cellClass,
      tooltip,
      canSelectHeader,
      requiresSwitchConfirmation,
      canCheckTaskNormal,
      canToggleException,
      isCellDisabled
    });
  }

  return columns;
}

/**
 * Convenience lookup for a single column state.
 *
 * @param {number} colIndex - Column index 0-6
 * @param {Object} state - Current global application state
 * @param {string} [viewingWeekStartDate] - 'YYYY-MM-DD' of the currently viewed week
 * @param {Object} [options] - Optional overrides
 * @returns {Object|null} Resolved column state object or null
 */
export function getColumnState(colIndex, state, viewingWeekStartDate = null, options = {}) {
  const all = getWeekColumnStates(state, viewingWeekStartDate, options);
  return all[colIndex] || null;
}