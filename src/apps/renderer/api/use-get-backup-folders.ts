import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../core/tanstack-query/query-keys';

export const useGetBackupFolders = ({ folderUuid }: { folderUuid: string }) => {
  return useQuery({
    queryKey: queryKeys.items({ folderUuid }),
    queryFn: () => window.electron.getItemByFolderUuid(folderUuid),
  });
};
