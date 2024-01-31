export interface DownloadProgressTracker {
  downloadStarted(name: string): Promise<void>;
  downloadUpdate(name: string, progress: number): Promise<void>;
  downloadFinished(name: string): Promise<void>;
  error(name: string): Promise<void>;
}
