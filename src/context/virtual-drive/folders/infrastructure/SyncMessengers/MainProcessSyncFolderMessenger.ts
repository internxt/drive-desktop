import { trackError } from '../../../../../apps/main/analytics/service';
import { setTrayStatus } from '../../../../../apps/main/tray/tray';
import { SyncFolderMessenger } from '../../domain/SyncFolderMessenger';

export class MainProcessSyncFolderMessenger implements SyncFolderMessenger {
  async errorWhileTrashing(_name: string): Promise<void> {
    setTrayStatus('ALERT');
  }

  async rename(_name: string, _newName: string): Promise<void> {
    setTrayStatus('SYNCING');
  }

  async renamed(_name: string, _newName: string): Promise<void> {
    setTrayStatus('IDLE');
  }

  async errorWhileRenaming(
    currentName: string,
    _desiredName: string,
    message: string
  ): Promise<void> {
    setTrayStatus('ALERT');

    trackError('Rename Error', new Error(message), {
      itemType: 'Folder',
      root: '',
      from: currentName,
      action: 'Rename',
    });
  }

  async creating(_name: string): Promise<void> {
    setTrayStatus('SYNCING');
  }

  async created(_name: string): Promise<void> {
    setTrayStatus('IDLE');
  }

  async errorWhileCreating(name: string, message: string): Promise<void> {
    setTrayStatus('ALERT');

    trackError('Upload Error', new Error(message), {
      itemType: 'Folder',
      root: '',
      from: name,
      action: 'Upload',
    });
  }
}
