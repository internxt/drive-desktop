import { Service } from 'diod';
import { trackError, trackEvent } from '../../../apps/main/analytics/service';
import { setTrayStatus } from '../../../apps/main/tray/tray';
import { broadcastToWindows } from '../../../apps/main/windows';
import { SyncMessenger } from '../domain/SyncMessenger';
import { UploadProgressTracker } from '../domain/UploadProgressTracker';

@Service()
export class MainProcessUploadProgressTracker
  extends SyncMessenger
  implements UploadProgressTracker
{
  uploadStarted(name: string, extension: string, size: number): void {
    trackEvent('Upload Started', {
      file_name: name,
      file_extension: extension,
      file_size: size,
      elapsedTimeMs: 0,
    });

    const nameWithExtension = this.nameWithExtension(name, extension);

    broadcastToWindows('sync-info-update', {
      action: 'UPLOADING',
      name: nameWithExtension,
      progress: 0,
    });
  }

  uploadProgress(
    name: string,
    extension: string,
    size: number,
    progress: { elapsedTime: number; percentage: number }
  ): void {
    const nameWithExtension = this.nameWithExtension(name, extension);

    trackEvent('Upload Started', {
      file_name: name,
      file_extension: extension,
      file_size: size,
      elapsedTimeMs: progress.elapsedTime,
    });

    broadcastToWindows('sync-info-update', {
      action: 'UPLOADING',
      name: nameWithExtension,
      progress: progress.percentage,
    });
  }

  uploadError(name: string, extension: string, error: string): void {
    const nameWithExtension = this.nameWithExtension(name, extension);

    broadcastToWindows('sync-info-update', {
      action: 'UPLOAD_ERROR',
      name: nameWithExtension,
    });

    trackError('Upload Error', new Error(error), {
      itemType: 'File',
      root: '',
      from: name,
      action: 'Upload',
    });
  }

  uploadCompleted(
    name: string,
    extension: string,
    size: number,
    processInfo: { elapsedTime: number }
  ): void {
    const nameWithExtension = this.nameWithExtension(name, extension);

    setTrayStatus('IDLE');

    trackEvent('Upload Completed', {
      file_name: name,
      file_extension: extension,
      file_size: size,
      elapsedTimeMs: processInfo.elapsedTime,
    });

    broadcastToWindows('sync-info-update', {
      action: 'UPLOADED',
      name: nameWithExtension,
    });
  }
}
