import { DownloadProgressTracker } from '../../../../../src/context/shared/domain/DownloadProgressTracker';

export class DownloadProgressTrackerMock implements DownloadProgressTracker {
  private downloadStartedMock = jest.fn();
  private downloadUpdateMock = jest.fn();
  private downloadFinishedMock = jest.fn();
  private errorMock = jest.fn();

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
    progress: { elapsedTime: number; percentage: number }
  ): Promise<void> {
    return this.downloadUpdateMock(name, extension, progress);
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
