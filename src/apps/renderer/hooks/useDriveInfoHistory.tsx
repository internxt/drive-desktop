import { useEffect, useState } from 'react';
import { DriveOperationInfo } from '../../shared/types';
import throttle from 'lodash/throttle';

export function useDriveInfoHistory() {
  const [driveHistory, setDriveHistory] = useState<DriveOperationInfo[]>([]);

  const addItemToHistoryDebounced = throttle((item: DriveOperationInfo) => {
    const MAX_ITEMS = 50;

    setDriveHistory((prevList) => {
      const prevListWithoutItem = prevList.filter(
        ({ name }) => name !== item.name
      );

      const newList = [item, ...prevListWithoutItem.slice(0, MAX_ITEMS - 1)];

      const result = newList.length <= MAX_ITEMS ? newList : newList.slice(1);

      return result;
    });
  }, 1000);

  function addItemToHistory(item: DriveOperationInfo) {
    addItemToHistoryDebounced(item);
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
