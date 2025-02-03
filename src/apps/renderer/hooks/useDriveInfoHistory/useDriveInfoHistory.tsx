import { useEffect } from 'react';
import { useDriveInfoHistoryLogic } from './useDriveInfoHistoryLogic/useDriveInfoHistoryLogic';

export function useDriveInfoHistory() {
  const {
    driveHistory,
    addItemToHistoryDebounced,
    clearHistory,
    removeDriveOperationsInProgress,
  } = useDriveInfoHistoryLogic();

  useEffect(() => {
    const removeListener = window.electron.onSyncInfoUpdate(addItemToHistoryDebounced);

    return removeListener;
  }, []);

  return {
    driveHistory,
    clearHistory,
    removeDriveOperationsInProgress,
  };
}
