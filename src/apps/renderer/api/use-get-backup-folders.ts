import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../core/tanstack-query/query-keys';

export function useGetBackupFolders({ folderUuid }: { folderUuid: string }) {
  return useQuery({
    queryKey: queryKeys.items({ folderUuid }),
    queryFn: () => globalThis.window.electron.getItemByFolderUuid(folderUuid),
  });
}
