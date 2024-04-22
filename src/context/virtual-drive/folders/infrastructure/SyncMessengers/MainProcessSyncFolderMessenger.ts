import { trackVirtualDriveError } from '../../../../../apps/main/analytics/service';
import { addVirtualDriveIssue } from '../../../../../apps/main/issues/virtual-drive';
import { setTrayStatus } from '../../../../../apps/main/tray/tray';
import { virtualDriveUpdate } from '../../../../../apps/main/windows';
import { VirtualDriveFolderIssue } from '../../../../../shared/issues/VirtualDriveIssue';
import { SyncFolderMessenger } from '../../domain/SyncFolderMessenger';
import { Service } from 'diod';

@Service()
export class MainProcessSyncFolderMessenger implements SyncFolderMessenger {
  async rename(name: string, newName: string): Promise<void> {
    setTrayStatus('SYNCING');

    virtualDriveUpdate({
      action: 'RENAMING_FOLDER',
      oldName: name,
      name: newName,
      progress: undefined,
    });
  }

  async renamed(name: string, newName: string): Promise<void> {
    setTrayStatus('IDLE');

    virtualDriveUpdate({
      action: 'FOLDER_RENAMED',
      oldName: name,
      name: newName,
      progress: undefined,
    });
  }

  async creating(name: string): Promise<void> {
    setTrayStatus('SYNCING');

    virtualDriveUpdate({
      action: 'CREATING_FOLDER',
      oldName: undefined,
      name: name,
      progress: undefined,
    });
  }

  async created(name: string): Promise<void> {
    setTrayStatus('IDLE');

    virtualDriveUpdate({
      action: 'FOLDER_CREATED',
      oldName: undefined,
      name: name,
      progress: undefined,
    });
  }

  async issue(issue: VirtualDriveFolderIssue): Promise<void> {
    setTrayStatus('ALERT');

    trackVirtualDriveError(issue);

    addVirtualDriveIssue(issue);
  }
}
