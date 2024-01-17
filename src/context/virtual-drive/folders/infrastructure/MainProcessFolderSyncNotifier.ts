import { setTrayStatus } from '../../../../apps/main/tray/tray';
import { SyncFolderMessenger } from '../domain/SyncFolderMessenger';

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
  async error(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
