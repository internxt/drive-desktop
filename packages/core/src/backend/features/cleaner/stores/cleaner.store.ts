type CleanerState = {
  currentAbortController: AbortController;
  totalFilesToDelete: number;
  deletedFilesCount: number;
  totalSpaceGained: number;
  isCleanupInProgress: boolean;
};

function createInitialState(): CleanerState {
  return {
    currentAbortController: new AbortController(),
    totalFilesToDelete: 0,
    deletedFilesCount: 0,
    totalSpaceGained: 0,
    isCleanupInProgress: false,
  };
}

const state = createInitialState();

function reset() {
  const newState = createInitialState();
  Object.assign(state, newState);
}

export const cleanerStore = {
  state,
  reset,
} as const;
