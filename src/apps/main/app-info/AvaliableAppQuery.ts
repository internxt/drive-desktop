const availableMethodsToQuery = ['getPreferredSystemLanguages'] as const;

export type AvaliableMethods = (typeof availableMethodsToQuery)[number];
