import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../core/tanstack-query/query-keys';

export function useGetUsage() {
  return useQuery({
    queryKey: queryKeys.usage(),
    queryFn: () => globalThis.window.electron.getUsage(),
  });
}
