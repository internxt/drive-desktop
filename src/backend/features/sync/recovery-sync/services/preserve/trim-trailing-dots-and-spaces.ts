/**
 * v2.7.2 Alexis Mora
 * Windows drops trailing dots and spaces from file and folder names.
 * A loop instead of a regular expression, so a long run of dots or spaces is trimmed in linear time.
 */
export function trimTrailingDotsAndSpaces({ name }: { name: string }) {
  let end = name.length;
  while (end > 0 && (name[end - 1] === '.' || name[end - 1] === ' ')) end--;
  return name.slice(0, end);
}
