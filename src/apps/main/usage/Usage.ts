export type Usage = {
  usageInBytes: number;
  limitInBytes: number;
  isInfinite: boolean;
  offerUpgrade: boolean;
};

export type RawUsage = {
  driveUsage: number;
  limitInBytes: number;
};
