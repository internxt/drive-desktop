export interface DownloadProgressTracker {
  downloadStarted(name: string, extension: string, size: number): Promise<void>;

  downloadUpdate(
    name: string,
    extension: string,
    progress: {
      elapsedTime: number;
      percentage: number;
    }
  ): Promise<void>;

  downloadFinished(
    name: string,
    extension: string,
    size: number,
    progress: {
      elapsedTime: number;
    }
  ): Promise<void>;

  error(name: string, extension: string): Promise<void>;
}
