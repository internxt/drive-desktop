import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { getFolderIdentity } from './get-folder-identity';
import { ProcessSyncContext } from '@/apps/sync-engine/config';

type TProps = {
  ctx: ProcessSyncContext;
  path: string;
};

export function getFolderUuid({ ctx, path }: TProps) {
  if (path === '/' || path === ctx.virtualDrive.syncRootPath || `${path}\\` === ctx.virtualDrive.syncRootPath) {
    return { data: ctx.rootUuid as FolderUuid };
  }

  const identity = getFolderIdentity({ drive: ctx.virtualDrive, path });

  if (identity.error) {
    return { error: identity.error };
  }

  return { data: identity.data.split(':')[1] as FolderUuid };
}
