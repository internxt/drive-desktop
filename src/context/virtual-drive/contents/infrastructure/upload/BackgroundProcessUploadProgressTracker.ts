import { SyncEngineIpc } from '../../../../../apps/sync-engine/SyncEngineIpc';
import { SyncErrorCause } from '../../../../../shared/issues/SyncErrorCause';
import { SyncMessenger } from '../../../../shared/domain/SyncMessenger';
import { UploadProgressTracker } from '../../../../shared/domain/UploadProgressTracker';

export class BackgroundProcessUploadProgressTracker
  extends SyncMessenger
  implements UploadProgressTracker
{
  constructor(private readonly ipc: SyncEngineIpc) {
    super();
  }

  uploadStarted(name: string, extension: string, size: number): void {
    this.ipc.send('FILE_UPLOADING', {
      name,
      extension,
      nameWithExtension: this.nameWithExtension(name, extension),
      size,
      processInfo: {
        elapsedTime: 0,
        progress: 0,
      },
    });
  }

  uploadProgress(
    name: string,
    extension: string,
    size: number,
    processInfo: { elapsedTime: number; percentage: number }
  ): void {
    this.ipc.send('FILE_UPLOADING', {
      name,
      extension,
      nameWithExtension: this.nameWithExtension(name, extension),
      size,
      processInfo: {
        elapsedTime: processInfo.elapsedTime,
        progress: processInfo.percentage,
      },
    });
  }

  uploadError(name: string, extension: string, cause: SyncErrorCause): void {
    this.ipc.send('FILE_UPLOAD_ERROR', {
      name,
      extension,
      nameWithExtension: this.nameWithExtension(name, extension),
      cause,
    });
  }

  uploadCompleted(
    name: string,
    extension: string,
    size: number,
    processInfo: { elapsedTime: number }
  ): void {
    this.ipc.send('FILE_UPLOADED', {
      name,
      extension,
      nameWithExtension: this.nameWithExtension(name, extension),
      size,
      processInfo: {
        elapsedTime: processInfo.elapsedTime,
        progress: 100,
      },
    });
  }
}
