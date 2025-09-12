/**TODO: DELTE DEAD CODE */
export function getDateFromSeconds(seconds: number): Date {
  return new Date(seconds * 1000);
}

export function getSecondsFromDateString(dateString: string): number {
  return Math.trunc(new Date(dateString).valueOf() / 1000);
}
