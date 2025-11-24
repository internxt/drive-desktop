import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../core/tanstack-query/query-keys';

export const useGetAvailableProducts = () => {
  return useQuery({
    queryKey: queryKeys.availableProducts(),
    queryFn: () => globalThis.window.electron.getAvailableProducts(),
  });
};
