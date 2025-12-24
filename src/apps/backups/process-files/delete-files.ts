import { tracker } from '@/apps/main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { deleteFileByUuid } from '@/infra/drive-server-wip/out/ipc-main';
import { Backup } from '../Backups';
import { BackupsContext } from '../BackupInfo';

type TProps = {
  ctx: BackupsContext;
  self: Backup;
  deleted: Array<ExtendedDriveFile>;
};

export async function deleteFiles({ ctx, self, deleted }: TProps) {
  await Promise.all(
    deleted.map(async (file) => {
      await deleteFileByUuid({ ctx, uuid: file.uuid, path: file.absolutePath });
      self.backed++;
      tracker.currentProcessed(self.backed);
    }),
  );
}
