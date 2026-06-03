export type BackupProgressState = {
  readonly processedItems: number;
  readonly backupWeights: ReadonlyMap<string, number>;
  readonly backupTotals: ReadonlyMap<string, number>;
  readonly currentBackupId: string;
  readonly completedBackups: ReadonlySet<string>;
};

export const createInitialState = (): BackupProgressState => ({
  processedItems: 0,
  backupWeights: new Map(),
  backupTotals: new Map(),
  currentBackupId: '',
  completedBackups: new Set(),
});

export const initializeBackupProgressWeights = (
  state: BackupProgressState,
  backupIds: string[],
  fileCounts: ReadonlyMap<string, number>,
): BackupProgressState => {
  const totalFiles = Array.from(fileCounts.values()).reduce((a, b) => a + b, 0);

  if (totalFiles === 0) {
    return state;
  }

  const weights = new Map<string, number>();
  const totals = new Map<string, number>();

  backupIds.forEach((id) => {
    const count = fileCounts.get(id) || 1;
    weights.set(id, count / totalFiles);
    totals.set(id, count);
  });

  return {
    ...state,
    backupWeights: weights,
    backupTotals: totals,
  };
};

export const setCurrentBackupId = (state: BackupProgressState, backupId: string): BackupProgressState => ({
  ...state,
  currentBackupId: backupId,
  processedItems: 0,
});

export const incrementProcessed = (state: BackupProgressState, count: number = 1): BackupProgressState => ({
  ...state,
  processedItems: state.processedItems + count,
});

export const markBackupAsCompleted = (state: BackupProgressState, backupId: string): BackupProgressState => ({
  ...state,
  completedBackups: new Set([...state.completedBackups, backupId]),
});

export const getPercentage = (state: BackupProgressState): number => {
  let weightedProgress = 0;

  for (const backupId of state.completedBackups) {
    const weight = state.backupWeights.get(backupId) || 0;
    weightedProgress += weight * 100;
  }

  if (state.backupWeights.has(state.currentBackupId) && !state.completedBackups.has(state.currentBackupId)) {
    const currentWeight = state.backupWeights.get(state.currentBackupId)!;
    const currentTotal = state.backupTotals.get(state.currentBackupId) || 1;

    if (currentTotal > 0) {
      const backupProgress = (state.processedItems / currentTotal) * 100;
      weightedProgress += currentWeight * backupProgress;
    }
  }

  return Math.min(100, Math.round(weightedProgress));
};

export const resetState = (): BackupProgressState => createInitialState();
