import { tracker } from '@/apps/main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { deleteFileByUuid } from '@/infra/drive-server-wip/out/ipc-main';
import { Backup } from '../Backups';

type TProps = {
  self: Backup;
  deleted: Array<ExtendedDriveFile>;
};

export async function deleteFiles({ self, deleted }: TProps) {
  await Promise.all(
    deleted.map(async (file) => {
      await deleteFileByUuid({ uuid: file.uuid, workspaceToken: '', path: file.absolutePath });
      self.backed++;
      tracker.currentProcessed(self.backed);
    }),
  );
}
