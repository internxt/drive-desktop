import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { CommonContext } from '@/apps/sync-engine/config';
import { LocalSync } from '@/backend/features';
import { createOrUpdateFolder } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-folder';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { basename } from 'node:path';

type Props = {
  ctx: CommonContext;
  path: AbsolutePath;
  parentUuid: FolderUuid;
};

export async function createFolder({ ctx, path, parentUuid }: Props) {
  const name = basename(path);

  LocalSync.SyncState.addItem({ action: 'UPLOADING', path });

  const body = {
    name,
    plainName: name,
    parentFolderUuid: parentUuid,
  };

  const res = ctx.workspaceId
    ? await driveServerWip.workspaces.createFolder({ path, body, workspaceId: ctx.workspaceId, workspaceToken: ctx.workspaceToken })
    : await driveServerWip.folders.createFolder({ path, body });

  if (res.error) {
    LocalSync.SyncState.addItem({ action: 'UPLOAD_ERROR', path });
    return;
  }

  LocalSync.SyncState.addItem({ action: 'UPLOADED', path });
  return await createOrUpdateFolder({ ctx, folderDto: res.data });
}
