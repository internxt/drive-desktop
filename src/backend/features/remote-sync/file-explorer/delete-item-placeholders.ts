import { NodeWin } from '@/infra/node-win/node-win.module';
import { File } from '@/context/virtual-drive/files/domain/File';
import { Folder } from '@/context/virtual-drive/folders/domain/Folder';
import { virtualDrive } from '@/apps/sync-engine/dependency-injection/common/virtualDrive';

type Props = { remotes: File[]; type: 'file' } | { remotes: Folder[]; type: 'folder' };

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
