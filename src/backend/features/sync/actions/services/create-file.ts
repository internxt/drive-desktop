import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { createAndUploadThumbnail } from '@/apps/main/thumbnail/create-and-upload-thumbnail';
import { CommonContext } from '@/apps/sync-engine/config';
import { isTemporaryFile } from '@/apps/utils/isTemporalFile';
import { LocalSync } from '@/backend/features';
import { createOrUpdateFile } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';
import { handleFileUploadSizeExceeded } from '@/backend/features/user/file-size-limit';
import { getNameAndExtension } from '@/context/virtual-drive/files/domain/get-name-and-extension';
import { EncryptionVersion } from '@/infra/drive-server-wip/defs';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { CreateFileBody } from '@/infra/drive-server-wip/services/files/create-file';
import { handleEmptyFilesAmoutForUser } from '../../../user/empty-files/handle-empty-files-amout-for-user';
import { handleEmptyFilesNotAllowedForUser } from '../../../user/empty-files/handle-empty-files-not-allowed-for-user';
import { uploadFile } from './upload-file';

type Props = {
  ctx: CommonContext;
  path: AbsolutePath;
  parentUuid: FolderUuid;
};

export async function createFile({ ctx, path, parentUuid }: Props) {
  const tempFile = isTemporaryFile({ path });

  if (tempFile) {
    ctx.logger.debug({ msg: 'File is temporary, skipping', path });
    return;
  }

  const upload = await uploadFile({ ctx, path });

  if (!upload) return;

  const { name, extension } = getNameAndExtension({ path });

  const body: CreateFileBody = {
    bucket: ctx.bucket,
    fileId: upload.contentsId,
    encryptVersion: EncryptionVersion.Aes03,
    folderUuid: parentUuid,
    plainName: name,
    size: upload.size,
    type: extension,
  };

  let res = ctx.workspaceId
    ? await driveServerWip.workspaces.createFile({ ctx, context: { path, body } })
    : await driveServerWip.files.createFile({ ctx, context: { path, body } });

  if (res.error?.code === 'FILE_ALREADY_EXISTS') {
    res = await driveServerWip.files.checkExistence({ ctx, context: { parentUuid, name, extension } });
  }

  if (res.error?.code === 'ABORTED') return;

  if (res.error?.code === 'FILE_UPLOAD_SIZE_EXCEEDED') {
    handleFileUploadSizeExceeded({ path, size: upload.size });
    ctx.logger.warn({
      msg: 'File size exceeds upload limit',
      path,
      size: upload.size,
    });
    return;
  }

  if (res.error?.code === 'EMPTY_FILES_NOT_ALLOWED') {
    handleEmptyFilesNotAllowedForUser({ path });
    ctx.logger.warn({
      msg: 'Empty files for user not allowed',
      path,
    });
    return;
  }

  if (res.error?.code === 'EMPTY_FILES_EXCEEDED') {
    handleEmptyFilesAmoutForUser({ path });
    ctx.logger.warn({
      msg: 'Empty files amount for user exceeded',
      path,
    });
    return;
  }

  if (res.error) {
    LocalSync.SyncState.addItem({ action: 'UPLOAD_ERROR', path });
    return;
  }

  LocalSync.SyncState.addItem({ action: 'UPLOADED', path });
  void createAndUploadThumbnail({ ctx, path, fileUuid: res.data.uuid });
  return await createOrUpdateFile({ ctx, fileDto: res.data });
}
