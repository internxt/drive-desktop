import { useEffect, useState } from 'react';
import { ItemBackup } from '../../../shared/types/items';

const cache = new Map<number, { data: ItemBackup[]; timestamp: number }>();

export default function useGetItems(folderId: number): ItemBackup[] {
  const [items, setItems] = useState<ItemBackup[]>([]);
  const CACHE_DURATION = 2 * 60 * 1000;

  useEffect(() => {
    const cached = cache.get(folderId);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_DURATION) {
      setItems(cached.data);
    } else {
      setItems([]);
      window.electron.getItemByFolderId(folderId).then((fetchedItems) => {
        cache.set(folderId, { data: fetchedItems, timestamp: Date.now() });
        setItems(fetchedItems);
      });
    }
  }, [folderId]);

  return items;
}
