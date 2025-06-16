import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../core/tanstack-query/query-keys';

export const useApiUsage = () => {
  return useQuery({
    queryKey: queryKeys.usage(),
    queryFn: () => window.electron.getUsage(),
  });
};
