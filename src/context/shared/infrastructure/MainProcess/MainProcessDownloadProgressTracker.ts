import {
  trackError,
  trackEvent,
} from '../../../../apps/main/analytics/service';
import { setTrayStatus } from '../../../../apps/main/tray/tray';
import { broadcastToWindows } from '../../../../apps/main/windows';
import { DownloadProgressTracker } from '../../domain/DownloadProgressTracker';
import { SyncMessenger } from '../../domain/SyncMessenger';
import { Service } from 'diod';

@Service()
export class MainProcessDownloadProgressTracker
  extends SyncMessenger
  implements DownloadProgressTracker
{
  async downloadStarted(
    name: string,
    extension: string,
    size: number
  ): Promise<void> {
    setTrayStatus('SYNCING');

    trackEvent('Download Started', {
      file_name: name,
      file_extension: extension,
      file_size: size,
      elapsedTimeMs: 0,
    });

    broadcastToWindows('sync-info-update', {
      action: 'DOWNLOADING',
      name: this.nameWithExtension(name, extension),
      progress: 0,
    });
  }

  async downloadUpdate(
    name: string,
    extension: string,
    progress: { elapsedTime: number; percentage: number }
  ): Promise<void> {
    broadcastToWindows('sync-info-update', {
      action: 'DOWNLOADING',
      name: this.nameWithExtension(name, extension),
      progress: progress.percentage,
    });
  }

  async downloadFinished(
    name: string,
    extension: string,
    size: number,
    progress: {
      elapsedTime: number;
    }
  ): Promise<void> {
    const nameWithExtension = this.nameWithExtension(name, extension);

    setTrayStatus('IDLE');

    trackEvent('Download Completed', {
      file_name: name,
      file_extension: extension,
      file_size: size,
      elapsedTimeMs: progress.elapsedTime,
    });

    broadcastToWindows('sync-info-update', {
      action: 'DOWNLOADED',
      name: nameWithExtension,
    });
  }

  async error(name: string, extension: string): Promise<void> {
    const nameWithExtension = this.nameWithExtension(name, extension);

    // TODO: finish this
    trackError('Download Error', new Error(), {
      itemType: 'File',
      root: '',
      from: name,
      action: 'Upload',
    });

    broadcastToWindows('sync-info-update', {
      action: 'DOWNLOAD_ERROR',
      name: nameWithExtension,
    });
  }

  instance(): DownloadProgressTracker {
    return this;
  }
}
