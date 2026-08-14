import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { basename } from 'node:path';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { sleep } from '@/apps/main/util';
import { CommonContext } from '@/apps/sync-engine/config';
import { LocalSync } from '@/backend/features';
import { createOrUpdateFolder } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-folder';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { PARENT_NOT_FOUND_RETRY_DELAYS_MS } from './constants';

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

  let res = await createFolderWithRetry({ ctx, path, body });
  if (!res) return;

  if (res.error?.code === 'FOLDER_ALREADY_EXISTS') {
    res = await driveServerWip.folders.checkExistence({ ctx, context: { parentUuid, name } });
  }

  if (res.error?.code === 'ABORTED') return;

  if (res.error) {
    LocalSync.SyncState.addItem({ action: 'UPLOAD_ERROR', path });
    ctx.logger.sentryError({ msg: 'Error creating folder', path, error: res.error }, { uuid: parentUuid });
    return;
  }

  LocalSync.SyncState.addItem({ action: 'UPLOADED', path });
  return await createOrUpdateFolder({ ctx, folderDto: res.data });
}

async function createFolderWithRetry({
  ctx,
  path,
  body,
}: {
  ctx: CommonContext;
  path: AbsolutePath;
  body: { name: string; plainName: string; parentFolderUuid: FolderUuid };
}) {
  let response = await handleCreateFolder({ ctx, path, body });
  let parentNotFoundRetries = 0;

  for (const delayMs of PARENT_NOT_FOUND_RETRY_DELAYS_MS) {
    if (response.error?.code !== 'PARENT_NOT_FOUND') break;

    parentNotFoundRetries += 1;
    ctx.logger.warn({ msg: 'Parent folder not found when creating folder, retrying', path, parentUuid: body.parentFolderUuid, delayMs });
    await sleep(delayMs);
    if (ctx.abortController?.signal.aborted) return;

    response = await handleCreateFolder({ ctx, path, body });
  }

  if (!response.error && parentNotFoundRetries > 0) {
    ctx.logger.debug({
      msg: 'Folder created after parent folder propagation retry',
      path,
      parentUuid: body.parentFolderUuid,
      attempts: parentNotFoundRetries + 1,
    });
  }

  return response;
}

async function handleCreateFolder({
  ctx,
  path,
  body,
}: {
  ctx: CommonContext;
  path: AbsolutePath;
  body: { name: string; plainName: string; parentFolderUuid: FolderUuid };
}) {
  return ctx.workspaceId
    ? await driveServerWip.workspaces.createFolder({ ctx, context: { path, body } })
    : await driveServerWip.folders.createFolder({ ctx, context: { path, body } });
}
