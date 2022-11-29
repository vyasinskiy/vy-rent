export function getCurrentPeriodCode() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const formattedMonth = month < 10 ? `0${month}` : month;
  return Number(`${year}${formattedMonth}`);
}

export function cleanWhiteSpaces(string) {
  if (!string) {
    return '';
  }

  return string.replace(/ /g, '');
}

export function areDeepEqual(obj1, obj2) {
  return Object.entries(obj1).toString() === Object.entries(obj2).toString();
}
