import { trackVirtualDriveError } from '../../../../../apps/main/analytics/service';
import { setTrayStatus } from '../../../../../apps/main/tray/tray';
import { notifyIssueToUser } from '../../../../../apps/main/windows';
import { VirtualDriveFolderIssue } from '../../../../../shared/issues/VirtualDriveIssue';
import { SyncFolderMessenger } from '../../domain/SyncFolderMessenger';

export class MainProcessSyncFolderMessenger implements SyncFolderMessenger {
  async rename(_name: string, _newName: string): Promise<void> {
    setTrayStatus('SYNCING');
  }

  async renamed(_name: string, _newName: string): Promise<void> {
    setTrayStatus('IDLE');
  }

  async creating(_name: string): Promise<void> {
    setTrayStatus('SYNCING');
  }

  async created(_name: string): Promise<void> {
    setTrayStatus('IDLE');
  }

  async error(issue: VirtualDriveFolderIssue): Promise<void> {
    setTrayStatus('ALERT');

    trackVirtualDriveError(issue);

    notifyIssueToUser(issue);
  }
}
