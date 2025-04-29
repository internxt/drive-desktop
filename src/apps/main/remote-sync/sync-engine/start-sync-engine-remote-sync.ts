import { logger } from '@/apps/shared/logger/logger';
import { BrowserWindow } from 'electron';
import { getFoldersCheckpoint } from './folders/get-folders-checkpoint';
import { syncRemoteFolders } from './folders/sync-remote-folders';
import { getFilesCheckpoint } from './files/get-files-checkpoint';
import { syncRemoteFiles } from './files/sync-remote-files';

type TProps = {
  workspaceId: string;
  browserWindow: BrowserWindow;
};

export async function startSyncEngineRemoteSync({ workspaceId, browserWindow }: TProps): Promise<void> {
  try {
    logger.debug({
      msg: 'Sync engine remote sync started',
      workspaceId,
    });

    const syncFilesPromise = syncRemoteFiles({
      workspaceId,
      browserWindow,
      from: await getFilesCheckpoint({ workspaceId }),
    });

    const syncFoldersPromise = syncRemoteFolders({
      workspaceId,
      browserWindow,
      from: await getFoldersCheckpoint({ workspaceId }),
    });

    await Promise.all([syncFilesPromise, syncFoldersPromise]);

    logger.debug({
      msg: 'Sync engine remote sync finished',
      workspaceId,
    });
  } catch (error) {
    throw logger.error({
      msg: 'Sync engine remote sync failed',
      exc: error,
    });
  }
}
