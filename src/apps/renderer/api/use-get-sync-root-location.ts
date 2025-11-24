import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../core/tanstack-query/query-keys';

export function useGetSyncRootLocation() {
  return useQuery({
    queryKey: queryKeys.syncRootLocation(),
    queryFn: () => globalThis.window.electron.driveGetSyncRoot(),
  });
}
