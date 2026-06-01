import { Service } from 'diod';
import { addVirtualDriveIssue } from '../../../../../apps/main/issues/virtual-drive';
import { setTrayStatus } from '../../../../../apps/main/tray/tray-setup';
import { broadcastToWindows } from '../../../../../apps/main/windows';
import { VirtualDriveFileIssue } from '../../../../../shared/issues/VirtualDriveIssue';
import { SyncMessenger } from '../../../../shared/domain/SyncMessenger';
import { SyncFileMessenger } from '../../domain/SyncFileMessenger';

@Service()
export class MainProcessSyncFileMessenger extends SyncMessenger implements SyncFileMessenger {
  async created(name: string, extension: string): Promise<void> {
    const nameWithExtension = this.nameWithExtension(name, extension);

    broadcastToWindows('sync-info-update', {
      action: 'UPLOADED',
      name: nameWithExtension,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async trashing(_name: string, _type: string, _size: number): Promise<void> {
    setTrayStatus('SYNCING');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async trashed(name: string, type: string, size: number): Promise<void> {
    const nameWithExtension = this.nameWithExtension(name, type);

    broadcastToWindows('sync-info-update', {
      action: 'DELETED',
      name: nameWithExtension,
    });

    setTrayStatus('IDLE');
  }

  async renaming(current: string, desired: string): Promise<void> {
    broadcastToWindows('sync-info-update', {
      action: 'RENAMING',
      name: desired,
      oldName: current,
    });

    setTrayStatus('SYNCING');
  }

  async renamed(_current: string, desired: string): Promise<void> {
    broadcastToWindows('sync-info-update', {
      action: 'RENAMED',
      name: desired,
    });

    setTrayStatus('IDLE');
  }

  async issues(error: VirtualDriveFileIssue): Promise<void> {
    setTrayStatus('ALERT');

    addVirtualDriveIssue(error);
  }
}
