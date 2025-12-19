import { tracker } from '@/apps/main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { ExtendedDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { deleteFolderByUuid } from '@/infra/drive-server-wip/out/ipc-main';
import { Backup } from '../Backups';

type TProps = {
  self: Backup;
  deleted: Array<ExtendedDriveFolder>;
};

export async function deleteFolders({ self, deleted }: TProps) {
  await Promise.all(
    deleted.map(async (folder) => {
      await deleteFolderByUuid({ uuid: folder.uuid, workspaceToken: '', path: folder.absolutePath });
      self.backed++;
      tracker.currentProcessed(self.backed);
    }),
  );
}
