import VirtualDrive from '@/node-win/virtual-drive';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { File } from '@/context/virtual-drive/files/domain/File';
import { Folder } from '@/context/virtual-drive/folders/domain/Folder';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

type Props =
  | { remotes: File[]; virtualDrive: VirtualDrive; isFolder: false }
  | { remotes: Folder[]; virtualDrive: VirtualDrive; isFolder: true };

export function deleteItemPlaceholders({ remotes, virtualDrive, isFolder }: Props) {
  for (const remote of remotes) {
    let localUuid: FileUuid | FolderUuid | undefined;

    if (isFolder) {
      localUuid = NodeWin.getFolderUuid({ path: remote.path, drive: virtualDrive }).data;
    } else {
      localUuid = NodeWin.getFileUuid({ path: remote.path, drive: virtualDrive }).data;
    }

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
