import { LocalFile } from '@/context/local/localFile/domain/LocalFile';
import { logger } from '@/apps/shared/logger/logger';
import { BackupsContext } from '@/apps/backups/BackupInfo';
import { RemoteTree } from '@/apps/backups/remote-tree/traverser';
import { uploadFile } from './upload-file';
import { Backup } from '@/apps/backups/Backups';
import { BackupsProcessTracker } from '@/apps/main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { dirname } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { persistFile } from '@/infra/drive-server-wip/out/ipc-main';

type Props = {
  self: Backup;
  context: BackupsContext;
  tracker: BackupsProcessTracker;
  remoteTree: RemoteTree;
  added: LocalFile[];
};

export async function createFiles({ self, context, tracker, remoteTree, added }: Props) {
  await Promise.all(
    added.map(async (localFile) => {
      await createFile({ context, localFile, remoteTree });
      self.backed++;
      tracker.currentProcessed(self.backed);
    }),
  );
}

async function createFile({ context, localFile, remoteTree }: { context: BackupsContext; localFile: LocalFile; remoteTree: RemoteTree }) {
  try {
    const contentsId = await uploadFile({ context, localFile });

    if (!contentsId) return;

    const parentPath = dirname(localFile.absolutePath);
    const parent = remoteTree.folders.get(parentPath);

    if (!parent) return;

    await persistFile({
      ctx: context,
      path: localFile.absolutePath,
      contentsId,
      parentUuid: parent.uuid,
      size: localFile.size,
    });
  } catch (error) {
    logger.error({
      tag: 'BACKUPS',
      msg: 'Error uploading file',
      path: localFile.absolutePath,
      error,
    });
  }
}
