import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { SyncContext } from '@/apps/sync-engine/config';
import { RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { HttpRemoteFolderSystem } from '@/context/virtual-drive/folders/infrastructure/HttpRemoteFolderSystem';
import { basename } from 'path';
import { createOrUpdateFolder } from '../../remote-sync/update-in-sqlite/create-or-update-folder';

export type CreateFolderProps = {
  ctx: SyncContext;
  parentUuid: FolderUuid;
  path: RelativePath;
};

export async function createFolder({ ctx, parentUuid, path }: CreateFolderProps) {
  const folderDto = await HttpRemoteFolderSystem.persist({
    ctx,
    parentUuid,
    plainName: basename(path),
    path,
  });

  return await createOrUpdateFolder({ context: ctx, folderDto });
}
