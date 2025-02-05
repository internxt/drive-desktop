import { useState } from 'react';
import { DriveOperationInfo } from '../../../../shared/types';

export function useDriveInfoHistoryLogic(MAX_ITEMS = 50) {
  const [driveHistory, setDriveHistory] = useState<DriveOperationInfo[]>([]);

  function addItemToHistory(item: DriveOperationInfo) {
    setDriveHistory((prevList) => {
      const prevListWithoutItem = prevList.filter(
        ({ name }) => name !== item.name
      );

      return [item, ...prevListWithoutItem.slice(0, MAX_ITEMS -1)];
    });
  }

  function clearHistory() {
    setDriveHistory([]);
  }

  function removeDriveOperationsInProgress() {
    setDriveHistory((currentItems) => {
      return currentItems.filter(
        (item) =>
          item.action !== 'UPLOADING' &&
          item.action !== 'DOWNLOADING' &&
          item.action !== 'RENAMING' &&
          item.action !== 'DELETING'
      );
    });
  }

  return {
    driveHistory,
    addItemToHistory,
    clearHistory,
    removeDriveOperationsInProgress,
  };
}
