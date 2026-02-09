import { setTrayStatus } from '../../../../apps/main/tray/tray';
import { broadcastToWindows } from '../../../../apps/main/windows';
import { DownloadProgressTracker } from '../../domain/DownloadProgressTracker';
import { SyncMessenger } from '../../domain/SyncMessenger';
import { Service } from 'diod';

@Service()
export class MainProcessDownloadProgressTracker extends SyncMessenger implements DownloadProgressTracker {
  async downloadStarted(name: string, extension: string): Promise<void> {
    setTrayStatus('SYNCING');

    broadcastToWindows('sync-info-update', {
      action: 'DOWNLOADING',
      name: this.nameWithExtension(name, extension),
    });
  }

  async downloadUpdate(
    name: string,
    extension: string,
    progress: { elapsedTime: number; percentage: number },
  ): Promise<void> {
    broadcastToWindows('sync-info-update', {
      action: 'DOWNLOADING',
      name: this.nameWithExtension(name, extension),
      progress: progress.percentage,
    });
  }

  async downloadFinished(name: string, extension: string) {
    const nameWithExtension = this.nameWithExtension(name, extension);

    setTrayStatus('IDLE');

    broadcastToWindows('sync-info-update', {
      action: 'DOWNLOADED',
      name: nameWithExtension,
    });
  }

  async error(name: string, extension: string): Promise<void> {
    const nameWithExtension = this.nameWithExtension(name, extension);

    broadcastToWindows('sync-info-update', {
      action: 'DOWNLOAD_ERROR',
      name: nameWithExtension,
    });
  }

  instance(): DownloadProgressTracker {
    return this;
  }
}
