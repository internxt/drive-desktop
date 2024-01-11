export interface FolderSyncNotifier {
  creating(name: string): Promise<void>;
  created(name: string): Promise<void>;
  rename(name: string, newName: string): Promise<void>;
  renamed(name: string, newName: string): Promise<void>;
  error(): Promise<void>;
}
