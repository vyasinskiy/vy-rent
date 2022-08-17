export function getCurrentPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const formattedMonth = month < 10 ? `0${month}` : month;
  return `${year}${formattedMonth}`;
}
