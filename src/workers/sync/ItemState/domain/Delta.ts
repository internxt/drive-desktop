export const deltas = [
  'NEW',
  'NEWER',
  'DELETED',
  'OLDER',
  'UNCHANGED',
] as const;

export type Delta = (typeof deltas)[number];
