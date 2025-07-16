import { useItems } from '../../api/use-get-items';
import { ItemBackup } from '../../../shared/types/items';
import { useMemo } from 'react';

export default function useGetItems(folderUuid: string): { items: ItemBackup[]; status: string } {
  const { data: items, isFetching, isError } = useItems(folderUuid);

  const status = useMemo(() => {
    if (isFetching) return 'loading';
    if (isError) return 'error';
    return 'ready';
  }, [items, isFetching, isError]);

  return { items: items ?? [], status };
}
