import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../core/tanstack-query/query-keys';

export const useGetUsage = () => {
  return useQuery({
    queryKey: queryKeys.usage(),
    queryFn: () => window.electron.getUsage(),
  });
};
