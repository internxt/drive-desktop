export const itemsKind = ['FILE', 'FOLDER'] as const;

export type ItemKind = typeof itemsKind[number];
