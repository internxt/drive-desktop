import { NodeWin } from '@/infra/node-win/node-win.module';
import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { ExtendedDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { ProcessSyncContext } from '@/apps/sync-engine/config';

type Props = { ctx: ProcessSyncContext } & (
  | { remotes: ExtendedDriveFile[]; type: 'file' }
  | { remotes: ExtendedDriveFolder[]; type: 'folder' }
);

export function deleteItemPlaceholders({ ctx, remotes, type }: Props) {
  for (const remote of remotes) {
    const localUuid =
      type === 'folder'
        ? NodeWin.getFolderUuid({ path: remote.path, drive: ctx.virtualDrive }).data
        : NodeWin.getFileUuid({ path: remote.path, drive: ctx.virtualDrive }).data;

    /**
     * v2.5.6 Daniel Jiménez
     * Since we retrieve all deleted items that have been in that path
     * we need to be sure that the one that we are checking is the same
     */
    if (localUuid === remote.uuid) {
      ctx.virtualDrive.deleteFileSyncRoot({ path: remote.path });
    }
  }
}
