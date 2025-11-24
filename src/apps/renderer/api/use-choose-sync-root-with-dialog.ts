import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../core/tanstack-query/query-client';
import { queryKeys } from '../core/tanstack-query/query-keys';

export function useChooseSyncRootWithDialog() {
  return useMutation({
    mutationFn: () => globalThis.window.electron.driveChooseSyncRootWithDialog(),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.syncRootLocation() });
    },
  });
}
