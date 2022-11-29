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

export function omit(target, omitKeys) {
  if (typeof target !== 'object') {
    return;
  }

  for (const key in target) {
    if (omitKeys.includes(key)) {
      delete target[key];
    }
  }

  return target;
}
