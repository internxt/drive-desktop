import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { CommonContext } from '@/apps/sync-engine/config';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { Stats } from 'node:fs';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { createAndUploadThumbnail } from '@/apps/main/thumbnail/create-and-upload-thumbnail';
import { LocalSync } from '@/backend/features';
import { createOrUpdateFile } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';
import { uploadFile } from './upload-file';

type Props = {
  ctx: CommonContext;
  path: AbsolutePath;
  uuid: FileUuid;
  stats: Stats;
};

export async function replaceFile({ ctx, path, stats: { size, mtime }, uuid }: Props) {
  const upload = await uploadFile({ ctx, size, path });

  if (!upload) return;

  const res = await driveServerWip.files.replaceFile({
    ctx,
    context: {
      path,
      uuid,
      contentsId: upload.contentsId,
      size: upload.size,
      modificationTime: mtime.toISOString(),
    },
  });

  if (res.error) {
    LocalSync.SyncState.addItem({ action: 'MODIFY_ERROR', path });
    return;
  }

  LocalSync.SyncState.addItem({ action: 'MODIFIED', path });
  void createAndUploadThumbnail({ ctx, path, fileUuid: res.data.uuid });
  return await createOrUpdateFile({ ctx, fileDto: res.data });
}
