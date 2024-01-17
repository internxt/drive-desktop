export interface SyncFileMessenger {
  created(name: string, extension: string): Promise<void>;
  error(name: string, extension: string, message: string): Promise<void>;
  trashing(name: string, type: string, size: number): Promise<void>;
  trashed(name: string, type: string, size: number): Promise<void>;
  errorWhileTrashing(
    name: string,
    type: string,
    message: string
  ): Promise<void>;
}
