import VirtualDrive from '@/node-win/virtual-drive';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { Folder } from '@/context/virtual-drive/folders/domain/Folder';

type Props = {
  remotes: Folder[];
  virtualDrive: VirtualDrive;
};

export function deleteFolderPlaceholders({ remotes, virtualDrive }: Props) {
  for (const remote of remotes) {
    const { data: localUuid } = NodeWin.getFolderUuid({
      path: remote.path,
      drive: virtualDrive,
    });

    if (localUuid === remote.uuid) {
      virtualDrive.deleteFileSyncRoot({ path: remote.path });
    }
  }
}
