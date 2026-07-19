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
