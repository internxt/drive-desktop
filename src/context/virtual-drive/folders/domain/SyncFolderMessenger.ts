export interface SyncFolderMessenger {
  creating(desiredName: string): Promise<void>;
  created(desiredName: string): Promise<void>;
  errorWhileCreating(desiredName: string, message: string): Promise<void>;

  rename(currentName: string, desiredName: string): Promise<void>;
  renamed(currentName: string, desiredName: string): Promise<void>;
  errorWhileRenaming(
    currentName: string,
    desiredName: string,
    message: string
  ): Promise<void>;
}
