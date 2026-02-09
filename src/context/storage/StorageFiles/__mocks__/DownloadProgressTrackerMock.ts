import { DownloadProgressTracker } from '../../../shared/domain/DownloadProgressTracker';

export class DownloadProgressTrackerMock implements DownloadProgressTracker {
  downloadStarted = vi.fn();
  downloadUpdate = vi.fn();
  downloadFinished = vi.fn();
  error = vi.fn();
}
