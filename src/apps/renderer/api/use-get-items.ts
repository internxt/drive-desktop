import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../core/tanstack-query/query-keys';

const CACHE_DURATION = 2 * 60 * 1000;

export const useItems = (folderUuid: string) => {
  return useQuery({
    queryKey: queryKeys.items(folderUuid),
    queryFn: () => window.electron.getItemByFolderUuid(folderUuid),
    staleTime: CACHE_DURATION,
  });
};
