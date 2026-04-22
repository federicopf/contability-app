export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function isoDateDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);

  return date.toISOString().slice(0, 10);
}

export function startOfCurrentMonthIsoDate() {
  const date = new Date();
  date.setDate(1);

  return date.toISOString().slice(0, 10);
}
