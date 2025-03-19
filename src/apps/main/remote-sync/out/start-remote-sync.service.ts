import { logger } from '@/apps/shared/logger/logger';
import { sleep } from '../../util';
import { remoteSyncManagers } from '../store';

export async function startRemoteSync(folderId?: number, workspaceId = ''): Promise<void> {
  const manager = remoteSyncManagers.get(workspaceId);

  if (!manager) throw new Error('RemoteSyncManager not found');

  try {
    const { files, folders } = await manager.startRemoteSync(folderId);

    logger.debug({ msg: 'startRemoteSync', folderId, folders: folders.length, files: files.length });

    if (folderId && folders.length > 0) {
      await Promise.all(
        folders.map(async (folder) => {
          if (!folder.id) return;
          await sleep(400);
          await startRemoteSync(folder.id, workspaceId);
        }),
      );
    }

    logger.debug({ msg: 'Remote sync finished' });
  } catch (error) {
    throw logger.error({
      msg: 'Error starting remote sync',
      exc: error,
    });
  }
}
