import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { CommonContext } from '@/apps/sync-engine/config';
import { isTemporaryFile } from '@/apps/utils/isTemporalFile';
import { HttpRemoteFileSystem } from '@/context/virtual-drive/files/infrastructure/HttpRemoteFileSystem';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { Stats } from 'node:fs';
import { createAndUploadThumbnail } from '@/apps/main/thumbnail/create-and-upload-thumbnail';
import { createOrUpdateFile } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';
import { LocalSync } from '@/backend/features';
import { uploadFile } from './upload-file';

type Props = {
  ctx: CommonContext;
  path: AbsolutePath;
  stats: Stats;
  parentUuid: FolderUuid;
};

export async function createFile({ ctx, path, stats: { size }, parentUuid }: Props) {
  ctx.logger.debug({ msg: 'Create file', path });

  const tempFile = isTemporaryFile(path);

  if (tempFile) {
    ctx.logger.debug({ msg: 'File is temporary, skipping', path });
    return;
  }

  const contentsId = await uploadFile({ ctx, size, path });

  if (!contentsId) return;

  ctx.logger.debug({ msg: 'File uploaded', path, contentsId, size });

  const res = await HttpRemoteFileSystem.persist({ ctx, path, parentUuid, contentsId, size });

  if (res.error) {
    LocalSync.SyncState.addItem({ action: 'UPLOAD_ERROR', path });
    return;
  }

  LocalSync.SyncState.addItem({ action: 'UPLOADED', path });
  void createAndUploadThumbnail({ ctx, path, fileUuid: res.data.uuid });
  return await createOrUpdateFile({ ctx, fileDto: res.data });
}
