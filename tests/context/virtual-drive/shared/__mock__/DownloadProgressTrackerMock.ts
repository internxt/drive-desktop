import { DownloadProgressTracker } from '../../../../../src/context/shared/domain/DownloadProgressTracker';

export class DownloadProgressTrackerMock implements DownloadProgressTracker {
  readonly downloadStartedMock = jest.fn();
  readonly downloadUpdateMock = jest.fn();
  readonly downloadFinishedMock = jest.fn();
  readonly errorMock = jest.fn();

  downloadStarted(name: string): Promise<void> {
    return this.downloadStartedMock(name);
  }
  downloadUpdate(name: string, progress: number): Promise<void> {
    return this.downloadUpdateMock(name, progress);
  }
  downloadFinished(name: string): Promise<void> {
    return this.downloadFinishedMock(name);
  }
  error(name: string): Promise<void> {
    return this.errorMock(name);
  }
}
