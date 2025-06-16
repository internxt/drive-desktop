import { useMemo } from 'react';
import { useApiUsage } from '../api/get-usage';

export default function useUsage() {
  const { data: usage, isLoading, isError, refetch } = useApiUsage();

  const status = useMemo(() => {
    if (isLoading) return 'loading';
    if (isError) return 'error';
    return 'ready';
  }, [usage, isLoading, isError]);

  return { usage, refreshUsage: refetch, status };
}
