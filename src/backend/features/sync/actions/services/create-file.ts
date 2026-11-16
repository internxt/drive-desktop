import { AbsolutePath, FileSizeLimitModule } from '@internxt/drive-desktop-core/build/backend';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { createAndUploadThumbnail } from '@/apps/main/thumbnail/create-and-upload-thumbnail';
import { sleep } from '@/apps/main/util';
import { CommonContext, UploadContext } from '@/apps/sync-engine/config';
import { isTemporaryFile } from '@/apps/utils/isTemporalFile';
import { LocalSync } from '@/backend/features';
import { createOrUpdateFile } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';
import { getFileSizeLimitAdapter, handleFileUploadSizeExceeded } from '@/backend/features/user/file-size-limit';
import { dirname } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { getNameAndExtension } from '@/context/virtual-drive/files/domain/get-name-and-extension';
import { EncryptionVersion } from '@/infra/drive-server-wip/defs';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { CreateFileBody } from '@/infra/drive-server-wip/services/files/create-file';
import { CreateFileError } from '@/infra/drive-server-wip/services/files/create-file-error';
import { findPlaceholderByUuid } from '@/node-win/watcher/events/find-placeholder-by-uuid';
import { SimpleDriveFile } from '../../../../../apps/main/database/entities/DriveFile';
import { handleEmptyFilesAmoutForUser } from '../../../user/empty-files/handle-empty-files-amout-for-user';
import { handleEmptyFilesNotAllowedForUser } from '../../../user/empty-files/handle-empty-files-not-allowed-for-user';
import { NAME_TAKEN_RETRY_DELAYS_MS, PARENT_NOT_FOUND_RETRY_DELAYS_MS } from './constants';
import { RetryLater } from './retry-later';
import { uploadFile } from './upload-file';

type Props = {
  ctx: UploadContext;
  path: AbsolutePath;
  parentUuid: FolderUuid;
  attempt?: number;
  retryLater: RetryLater;
};

export async function createFile({ ctx, path, parentUuid, attempt, retryLater }: Props): Promise<SimpleDriveFile | undefined> {
  const tempFile = isTemporaryFile({ path });

  if (tempFile) {
    ctx.logger.debug({ msg: 'File is temporary, skipping', path });
    return;
  }

  const upload = await uploadFile({ ctx, path, attempt, retryLater });

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
    modificationTime: upload.mtime.toISOString(),
    creationTime: upload.creationTime.toISOString(),
  };

  let res = await createFileWithRetry({ ctx, path, body });
  if (!res) return;

  if (res.error?.code === 'FILE_ALREADY_EXISTS') {
    res = await resolveTakenName({ ctx, path, body, parentUuid, name, extension });
    if (!res) return;
  }

  if (res.error?.code === 'ABORTED') return;

  if (res.error?.code === 'FILE_UPLOAD_SIZE_EXCEEDED') {
    handleFileUploadSizeExceeded({ path, size: upload.size });
    void FileSizeLimitModule.revalidateFileSizeLimit(getFileSizeLimitAdapter({ ctx }));
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

type ResolveTakenNameProps = {
  ctx: UploadContext;
  path: AbsolutePath;
  body: CreateFileBody;
  parentUuid: FolderUuid;
  name: string;
  extension: string;
};

/**
 * v2.7.4 Victor Fernandez
 * Adopting the file that keeps the name is right when the user deleted it and created a new one. When that file is
 * still local with another name, it is a backup whose remote rename has not finished yet (e.g. Revit, AutoCAD), and
 * adopting it would leave two files with the same uuid, so we wait for the rename and create the file again.
 */
async function resolveTakenName({ ctx, path, body, parentUuid, name, extension }: ResolveTakenNameProps) {
  for (let attempt = 0; ; attempt += 1) {
    const existing = await driveServerWip.files.checkExistence({ ctx, context: { parentUuid, name, extension } });
    if (!(await isRenamePending({ path, existing }))) return existing;

    const delayMs = NAME_TAKEN_RETRY_DELAYS_MS.at(attempt);
    if (delayMs === undefined) {
      ctx.logger.warn({ msg: 'File name is still taken by another local file', path });
      return { error: new CreateFileError('FILE_ALREADY_EXISTS', existing.data?.uuid) };
    }

    ctx.logger.debug({ msg: 'File name is taken by a file being renamed, retrying', path, delayMs });
    if (ctx.abortController?.signal.aborted) return;
    await sleep(delayMs);

    const res = await createFileWithRetry({ ctx, path, body });
    if (res?.error?.code !== 'FILE_ALREADY_EXISTS') return res;
  }
}

async function isRenamePending({
  path,
  existing,
}: {
  path: AbsolutePath;
  existing: Awaited<ReturnType<typeof driveServerWip.files.checkExistence>>;
}) {
  if (existing.error?.code === 'FILE_NOT_FOUND') return true;
  if (!existing.data) return false;

  const { data: holder } = await findPlaceholderByUuid({ folder: dirname(path), uuid: existing.data.uuid });
  return !!holder && holder !== path && !isTemporaryFile({ path: holder });
}

async function createFileWithRetry({ ctx, path, body }: { ctx: CommonContext; path: AbsolutePath; body: CreateFileBody }) {
  let response = await handleCreateFile({ ctx, path, body });
  let parentNotFoundRetries = 0;

  for (const delayMs of PARENT_NOT_FOUND_RETRY_DELAYS_MS) {
    if (response.error?.code !== 'PARENT_NOT_FOUND') break;

    parentNotFoundRetries += 1;
    ctx.logger.warn({ msg: 'Parent folder not found when creating file, retrying', path, folderUuid: body.folderUuid, delayMs });
    if (ctx.abortController?.signal.aborted) return;
    await sleep(delayMs);

    response = await handleCreateFile({ ctx, path, body });
  }

  if (!response.error && parentNotFoundRetries > 0) {
    ctx.logger.debug({
      msg: 'File created after parent folder propagation retry',
      path,
      folderUuid: body.folderUuid,
      attempts: parentNotFoundRetries + 1,
    });
  }

  return response;
}

async function handleCreateFile({ ctx, path, body }: { ctx: CommonContext; path: AbsolutePath; body: CreateFileBody }) {
  return ctx.workspaceId
    ? await driveServerWip.workspaces.createFile({ ctx, context: { path, body } })
    : await driveServerWip.files.createFile({ ctx, context: { path, body } });
}
