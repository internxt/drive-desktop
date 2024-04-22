export abstract class DownloadProgressTracker {
  abstract downloadStarted(
    name: string,
    extension: string,
    size: number
  ): Promise<void>;

  abstract downloadUpdate(
    name: string,
    extension: string,
    progress: {
      elapsedTime: number;
      percentage: number;
    }
  ): Promise<void>;
  abstract downloadFinished(
    name: string,
    extension: string,
    size: number,
    progress: {
      elapsedTime: number;
    }
  ): Promise<void>;
  abstract error(name: string, extension: string): Promise<void>;
}
