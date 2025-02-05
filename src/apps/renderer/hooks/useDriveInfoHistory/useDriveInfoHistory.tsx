import { useEffect } from 'react';
import { useDriveInfoHistoryLogic } from './useDriveInfoHistoryLogic/useDriveInfoHistoryLogic';

export function useDriveInfoHistory() {
  const {
    driveHistory,
    addItemToHistory,
    clearHistory,
    removeDriveOperationsInProgress,
  } = useDriveInfoHistoryLogic();

  useEffect(() => {
    const removeListener = window.electron.onSyncInfoUpdate(addItemToHistory);

    return removeListener;
  }, []);

  return {
    driveHistory,
    clearHistory,
    removeDriveOperationsInProgress,
  };
}
