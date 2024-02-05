import { SyncErrorCause } from '../../../shared/issues/SyncErrorCause';

export interface UploadProgressTracker {
  uploadStarted(name: string, extension: string, size: number): void;

  uploadProgress(
    name: string,
    extension: string,
    size: number,
    progress: { elapsedTime: number; percentage: number }
  ): void;

  uploadError(name: string, extension: string, cause: SyncErrorCause): void;

  uploadCompleted(
    name: string,
    extension: string,
    size: number,
    progress: { elapsedTime: number }
  ): void;
}
