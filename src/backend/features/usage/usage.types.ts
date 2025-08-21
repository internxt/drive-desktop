export const INFINITE_SPACE_TRHESHOLD = 108851651149824 as const;
export const OFFER_UPGRADE_TRHESHOLD = 2199023255552 as const;

export type RawUsage = {
  driveUsage: number;
  limitInBytes: number;
};

export type Usage = {
  usageInBytes: number;
  limitInBytes: number;
  isInfinite: boolean;
  offerUpgrade: boolean;
};
