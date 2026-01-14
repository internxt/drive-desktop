import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { CommonContext } from '@/apps/sync-engine/config';
import { isTemporaryFile } from '@/apps/utils/isTemporalFile';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { Stats } from 'node:fs';
import { createAndUploadThumbnail } from '@/apps/main/thumbnail/create-and-upload-thumbnail';
import { createOrUpdateFile } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';
import { LocalSync } from '@/backend/features';
import { uploadFile } from './upload-file';
import { EncryptionVersion } from '@/infra/drive-server-wip/defs';
import { getNameAndExtension } from '@/context/virtual-drive/files/domain/get-name-and-extension';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { CreateFileBody } from '@/infra/drive-server-wip/services/files/create-file';

type Props = {
  ctx: CommonContext;
  path: AbsolutePath;
  stats: Stats;
  parentUuid: FolderUuid;
};

export async function createFile({ ctx, path, stats: { size }, parentUuid }: Props) {
  const tempFile = isTemporaryFile({ path });

  if (tempFile) {
    ctx.logger.debug({ msg: 'File is temporary, skipping', path });
    return;
  }

  const contentsId = await uploadFile({ ctx, size, path });

  if (!contentsId) return;

  const { name, extension } = getNameAndExtension({ path });

  const body: CreateFileBody = {
    bucket: ctx.bucket,
    fileId: contentsId,
    encryptVersion: EncryptionVersion.Aes03,
    folderUuid: parentUuid,
    plainName: name,
    size,
    type: extension,
  };

  const res = ctx.workspaceId
    ? await driveServerWip.workspaces.createFile({ ctx, context: { path, body } })
    : await driveServerWip.files.createFile({ ctx, context: { path, body } });

  if (res.error) {
    LocalSync.SyncState.addItem({ action: 'UPLOAD_ERROR', path });
    return;
  }

  LocalSync.SyncState.addItem({ action: 'UPLOADED', path });
  void createAndUploadThumbnail({ ctx, path, fileUuid: res.data.uuid });
  return await createOrUpdateFile({ ctx, fileDto: res.data });
}
