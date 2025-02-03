import { useState } from 'react';
import throttle from 'lodash/throttle';
import { DriveOperationInfo } from '../../../../shared/types';

export function useDriveInfoHistoryLogic(MAX_ITEMS = 50) {
  const [driveHistory, setDriveHistory] = useState<DriveOperationInfo[]>([]);

  function addItemToHistory(item: DriveOperationInfo) {


    setDriveHistory((prevList) => {
      const prevListWithoutItem = prevList.filter(
        ({ name }) => name !== item.name
      );

      const newList = [item, ...prevListWithoutItem.slice(0, MAX_ITEMS - 1)];

      return newList.length <= MAX_ITEMS ? newList : newList.slice(1);
    });
  }

  const addItemToHistoryDebounced = throttle((item: DriveOperationInfo) => {
    addItemToHistory(item);
  }, 1000);

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
    addItemToHistoryDebounced,
    clearHistory,
    removeDriveOperationsInProgress,
  };
}
