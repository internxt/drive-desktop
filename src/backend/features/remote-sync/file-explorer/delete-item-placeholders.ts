import { NodeWin } from '@/infra/node-win/node-win.module';
import { virtualDrive } from '@/apps/sync-engine/dependency-injection/common/virtualDrive';
import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { ExtendedDriveFolder } from '@/apps/main/database/entities/DriveFolder';

type Props = { remotes: ExtendedDriveFile[]; type: 'file' } | { remotes: ExtendedDriveFolder[]; type: 'folder' };

export function deleteItemPlaceholders({ remotes, type }: Props) {
  for (const remote of remotes) {
    const localUuid =
      type === 'folder'
        ? NodeWin.getFolderUuid({ path: remote.path, drive: virtualDrive }).data
        : NodeWin.getFileUuid({ path: remote.path, drive: virtualDrive }).data;

    /**
     * v2.5.6 Daniel Jiménez
     * Since we retrieve all deleted items that have been in that path
     * we need to be sure that the one that we are checking is the same
     */
    if (localUuid === remote.uuid) {
      virtualDrive.deleteFileSyncRoot({ path: remote.path });
    }
  }
}
