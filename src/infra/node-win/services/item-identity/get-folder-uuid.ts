import { FolderUuid } from '@/context/virtual-drive/folders/domain/FolderPlaceholderId';
import { getFolderIdentity } from './get-folder-identity';
import VirtualDrive from '@/node-win/virtual-drive';
import { getConfig } from '@/apps/sync-engine/config';
import { logger } from '@/apps/shared/logger/logger';

type TProps = {
  drive: VirtualDrive;
  path: string;
};

export function getFolderUuid({ drive, path }: TProps) {
  if (path === '/' || path === drive.syncRootPath || `${path}\\` === drive.syncRootPath) {
    return { data: getConfig().rootUuid as FolderUuid };
  }

  const identity = getFolderIdentity({ drive, path });

  if (identity.error) {
    return { error: identity.error };
  }

  return { data: identity.data.split(':')[1] as FolderUuid };
}
