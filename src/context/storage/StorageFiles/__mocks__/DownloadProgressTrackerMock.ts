import { DownloadProgressTracker } from '../../../shared/domain/DownloadProgressTracker';

export class DownloadProgressTrackerMock implements DownloadProgressTracker {
  private downloadStartedMock = vi.fn();
  private downloadUpdateMock = vi.fn();
  private downloadFinishedMock = vi.fn();
  private errorMock = vi.fn();

  downloadStarted(name: string, extension: string, size: number): Promise<void> {
    return this.downloadStartedMock(name, extension, size);
  }

  downloadUpdate(
    name: string,
    extension: string,
    progress: { elapsedTime: number; percentage: number },
  ): Promise<void> {
    return this.downloadUpdateMock(name, extension, progress);
  }

  downloadFinished(name: string, extension: string, size: number, progress: { elapsedTime: number }): Promise<void> {
    return this.downloadFinishedMock(name, extension, size, progress);
  }

  error(name: string, extension: string): Promise<void> {
    return this.errorMock(name, extension);
  }
}
