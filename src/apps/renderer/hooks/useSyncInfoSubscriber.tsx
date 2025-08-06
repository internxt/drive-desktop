import { useEffect, useState } from 'react';
import { ProcessInfoUpdatePayload } from '@/apps/shared/types';

export function useSyncInfoSubscriber() {
  const [processInfoUpdatedPayload, setProcessInfoUpdatedPayload] = useState<ProcessInfoUpdatePayload[]>([]);

  function onSyncItem(item: ProcessInfoUpdatePayload) {
    const MAX_ITEMS = 50;

    setProcessInfoUpdatedPayload((currentItems) => {
      const itemsWithoutGivenItem = currentItems.filter((i) => i.key !== item.key);

      const itemIsAnError = ['UPLOAD_ERROR', 'DOWNLOAD_ERROR', 'RENAME_ERROR', 'DELETE_ERROR'].includes(item.action);

      const newItems = itemIsAnError ? itemsWithoutGivenItem : [item, ...itemsWithoutGivenItem].slice(0, MAX_ITEMS);

      return newItems.sort((a, b) => a.name.localeCompare(b.name));
    });
  }

  function clearItems() {
    setProcessInfoUpdatedPayload((current) =>
      current.filter((item) => ['UPLOADING', 'DOWNLOADING', 'RENAMING', 'DELETING'].includes(item.action)),
    );
  }

  useEffect(() => {
    const removeListener = window.electron.onSyncInfoUpdate(onSyncItem);

    return removeListener;
  }, []);

  return {
    processInfoUpdatedPayload,
    clearItems,
  };
}
