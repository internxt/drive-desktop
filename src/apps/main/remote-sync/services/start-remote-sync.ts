import { logger } from '@/apps/shared/logger/logger';
import { getRemoteSyncManager } from '../store';

type TProps = {
  folderUuid?: string;
  workspaceId: string;
};

export async function startRemoteSync({ folderUuid, workspaceId }: TProps): Promise<void> {
  const manager = getRemoteSyncManager({ workspaceId });
  if (!manager) return;

  try {
    const { files, folders } = await manager.startRemoteSync(folderUuid);

    logger.debug({
      msg: 'Remote sync finished',
      workspaceId,
      folderUuid,
      folders: folders.length,
      files: files.length,
    });

    if (folderUuid && folders.length > 0) {
      await Promise.all(
        folders.map(async (folder) => {
          await startRemoteSync({
            folderUuid: folder.uuid,
            workspaceId,
          });
        }),
      );
    }
  } catch (exc) {
    throw logger.error({
      msg: 'Error starting remote sync',
      exc,
    });
  }
}
