import { useEffect, useState } from 'react';
import { ProcessInfoUpdatePayload } from '../../shared/types';

export function useSyncInfoSubscriber() {
  const [processInfoUpdatedPayload, setProcessInfoUpdatedPayload] = useState<
    ProcessInfoUpdatePayload[]
  >([]);

  function onSyncItem(item: ProcessInfoUpdatePayload) {
    const MAX_ITEMS = 50;

    setProcessInfoUpdatedPayload((currentItems) => {
      const itemsWithoutGivenItem = currentItems.filter(
        (i) => i.name !== item.name
      );

      const itemIsAnError = [
        'UPLOAD_ERROR',
        'DOWNLOAD_ERROR',
        'RENAME_ERROR',
        'DELETE_ERROR',
        'METADATA_READ_ERROR',
      ].includes(item.action);

      const newItems = itemIsAnError
        ? itemsWithoutGivenItem
        : [item, ...itemsWithoutGivenItem].slice(0, MAX_ITEMS);

      return newItems;
    });
  }

  function clearItems() {
    setProcessInfoUpdatedPayload((current) =>
      current.filter((item) =>
        ['UPLOADING', 'DOWNLOADING', 'RENAMING', 'DELETING'].includes(
          item.action
        )
      )
    );
  }

  function removeOnProgressItems() {
    setProcessInfoUpdatedPayload((currentItems) => {
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
    const removeListener = window.electron.onSyncInfoUpdate(onSyncItem);

    return removeListener;
  }, []);

  return {
    processInfoUpdatedPayload,
    clearItems,
    removeOnProgressItems,
  };
}
