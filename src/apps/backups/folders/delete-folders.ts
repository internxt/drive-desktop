import { tracker } from '@/apps/main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { ExtendedDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { deleteFolderByUuid } from '@/infra/drive-server-wip/out/ipc-main';
import { Backup } from '../Backups';
import { BackupsContext } from '../BackupInfo';

type TProps = {
  ctx: BackupsContext;
  self: Backup;
  deleted: Array<ExtendedDriveFolder>;
};

export async function deleteFolders({ ctx, self, deleted }: TProps) {
  await Promise.all(
    deleted.map(async (folder) => {
      await deleteFolderByUuid({ ctx, uuid: folder.uuid, path: folder.absolutePath });
      self.backed++;
      tracker.currentProcessed(self.backed);
    }),
  );
}
