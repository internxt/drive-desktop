import { useEffect, useState } from 'react';
import { ItemBackup } from '../../../shared/types/items';

const cache = new Map<string, { data: ItemBackup[]; timestamp: number }>();

export default function useGetItems(folderUuid: string): { items: ItemBackup[]; loadingItems: boolean } {
  const [items, setItems] = useState<ItemBackup[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const CACHE_DURATION = 2 * 60 * 1000;

  useEffect(() => {
    const cached = cache.get(folderUuid);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_DURATION) {
      setItems(cached.data);
    } else {
      setItems([]);
      setLoadingItems(true);
      window.electron
        .getItemByFolderUuid(folderUuid)
        .then((fetchedItems) => {
          cache.set(folderUuid, { data: fetchedItems, timestamp: Date.now() });
          setItems(fetchedItems);
        })
        .catch(() => {
          setItems([]);
        })
        .finally(() => {
          setLoadingItems(false);
        });
    }
  }, [folderUuid]);

  return { items, loadingItems };
}
