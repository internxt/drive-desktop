import { useEffect, useState } from 'react';
import { DriveInfo } from '../../shared/types';

export function useDriveInfoHistory() {
  const [driveHistory, setDriveHistory] = useState<DriveInfo[]>([]);

  function addItemToHistory(item: DriveInfo) {
    const MAX_ITEMS = 50;

    setDriveHistory((prevList) => {
      const newList = [...prevList.slice(0, MAX_ITEMS - 1), item];

      return newList.length <= MAX_ITEMS ? newList : newList.slice(1);
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
