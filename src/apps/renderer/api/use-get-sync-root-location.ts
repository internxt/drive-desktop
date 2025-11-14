import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../core/tanstack-query/query-keys';

export const useGetSyncRootLocation = () => {
  return useQuery({
    queryKey: queryKeys.syncRootLocation(),
    queryFn: () => window.electron.driveGetSyncRoot(),
  });
};
