import { useEffect, useState } from 'react';
import { ItemBackup } from '../../../shared/types/items';

export default function useGetItems(folderId: number): ItemBackup[] {
  const [items, setItems] = useState<ItemBackup[]>([]);

  useEffect(() => {
    window.electron.getItemByFolderId(folderId).then(setItems);
  }, [folderId]);

  return items;
}
