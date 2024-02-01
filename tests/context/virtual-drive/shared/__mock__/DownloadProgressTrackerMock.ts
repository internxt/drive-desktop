import { DownloadProgressTracker } from '../../../../../src/context/shared/domain/DownloadProgressTracker';

export class DownloadProgressTrackerMock implements DownloadProgressTracker {
  readonly downloadStartedMock = jest.fn();
  readonly downloadUpdateMock = jest.fn();
  readonly downloadFinishedMock = jest.fn();
  readonly errorMock = jest.fn();

  downloadStarted(
    name: string,
    extension: string,
    size: number
  ): Promise<void> {
    return this.downloadStartedMock(name, extension, size);
  }

  downloadUpdate(
    name: string,
    extension: string,
    size: number,
    progress: { elapsedTime: number; percentage: number }
  ): Promise<void> {
    return this.downloadUpdateMock(name, extension, size, progress);
  }

  downloadFinished(
    name: string,
    extension: string,
    size: number,
    progress: { elapsedTime: number }
  ): Promise<void> {
    return this.downloadFinishedMock(name, extension, size, progress);
  }

  error(name: string, extension: string): Promise<void> {
    return this.errorMock(name, extension);
  }
}
