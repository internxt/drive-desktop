import { SyncErrorCause } from '../../../shared/issues/SyncErrorCause';

export abstract class UploadProgressTracker {
  abstract uploadStarted(name: string, extension: string, size: number): void;

  abstract uploadProgress(
    name: string,
    extension: string,
    size: number,
    progress: { elapsedTime: number; percentage: number }
  ): void;

  abstract uploadError(
    name: string,
    extension: string,
    cause: SyncErrorCause
  ): void;

  abstract uploadCompleted(
    name: string,
    extension: string,
    size: number,
    progress: { elapsedTime: number }
  ): void;
}
