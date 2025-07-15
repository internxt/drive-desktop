import { useMemo } from 'react';
import { useGetUsage } from '../api/use-get-usage';

export type UsageStatus = 'loading' | 'error' | 'ready';

export default function useUsage() {
  const { data: usage, isLoading, isError, refetch } = useGetUsage();

  const status: UsageStatus = useMemo(() => {
    if (isLoading) return 'loading';
    if (isError) return 'error';
    return 'ready';
  }, [usage, isLoading, isError]);

  return { usage, refreshUsage: refetch, status };
}
