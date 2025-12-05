import { LocalFile } from '../../domain/LocalFile';
import { BackupsContext } from '@/apps/backups/BackupInfo';
import { uploadFile } from '../upload-file';
import { logger } from '@/apps/shared/logger/logger';
import { Backup } from '@/apps/backups/Backups';
import { BackupsProcessTracker } from '@/apps/main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { FilesDiff } from '@/apps/backups/diff/calculate-files-diff';
import { persistReplaceFile } from '@/infra/drive-server-wip/out/ipc-main';

type Props = {
  self: Backup;
  context: BackupsContext;
  tracker: BackupsProcessTracker;
  modified: FilesDiff['modified'];
};

export async function replaceFiles({ self, context, tracker, modified }: Props) {
  await Promise.all(
    modified.map(async ({ local, remote }) => {
      await replaceFile({ context, localFile: local, file: remote });
      self.backed++;
      tracker.currentProcessed(self.backed);
    }),
  );
}

async function replaceFile({ context, localFile, file }: { context: BackupsContext; localFile: LocalFile; file: ExtendedDriveFile }) {
  try {
    const contentsId = await uploadFile({ context, localFile });

    if (!contentsId) return;

    await persistReplaceFile({
      ctx: context,
      path: localFile.absolutePath,
      uuid: file.uuid,
      contentsId,
      size: localFile.size,
      modificationTime: localFile.modificationTime.toISOString(),
    });
  } catch (exc) {
    logger.error({
      tag: 'BACKUPS',
      msg: 'Error updating file',
      path: localFile.absolutePath,
      exc,
    });
  }
}
