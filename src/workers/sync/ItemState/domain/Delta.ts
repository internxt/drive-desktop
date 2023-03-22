export const deltas = [
  'NEW',
  'NEWER',
  'DELETED',
  'OLDER',
  'UNCHANGED',
  'RENAME_RESULT',
  'RENAMED',
] as const;

export type Delta = typeof deltas[number];
