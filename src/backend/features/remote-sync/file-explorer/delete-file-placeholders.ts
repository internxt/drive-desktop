import VirtualDrive from '@/node-win/virtual-drive';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { File } from '@/context/virtual-drive/files/domain/File';

type Props = {
  remotes: File[];
  virtualDrive: VirtualDrive;
};

export function deleteFilePlaceholders({ remotes, virtualDrive }: Props) {
  for (const remote of remotes) {
    const { data: localUuid } = NodeWin.getFileUuid({
      path: remote.path,
      drive: virtualDrive,
    });

    if (localUuid === remote.uuid) {
      virtualDrive.deleteFileSyncRoot({ path: remote.path });
    }
  }
}
