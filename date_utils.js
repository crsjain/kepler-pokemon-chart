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