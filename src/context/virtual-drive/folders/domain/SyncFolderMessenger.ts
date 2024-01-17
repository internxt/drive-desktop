export interface SyncFolderMessenger {
  creating(name: string): Promise<void>;
  created(name: string): Promise<void>;
  rename(name: string, newName: string): Promise<void>;
  renamed(name: string, newName: string): Promise<void>;
  error(name: string, message: string): Promise<void>;
}
