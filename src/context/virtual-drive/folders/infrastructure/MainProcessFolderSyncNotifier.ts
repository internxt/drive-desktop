import { setTrayStatus } from '../../../../apps/main/tray/tray';
import { FolderSyncNotifier } from '../domain/FolderSyncNotifier';

export class MainProcessFolderSyncNotifier implements FolderSyncNotifier {
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
