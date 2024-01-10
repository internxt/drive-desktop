import { setTrayStatus } from '../../../../apps/main/tray/tray';
import { FolderSyncNotifier } from '../domain/FolderSyncNotifier';

export class MainProcessFolderSyncNotifier implements FolderSyncNotifier {
  rename(name: string, newName: string): void {
    setTrayStatus('SYNCING');
  }
  renamed(name: string, newName: string): void {
    setTrayStatus('IDLE');
  }
  creating(name: string): void {
    setTrayStatus('SYNCING');
  }
  created(name: string): void {
    setTrayStatus('IDLE');
  }
  error(): void {
    throw new Error('Method not implemented.');
  }
}
