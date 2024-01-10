export interface FolderSyncNotifier {
  creating(name: string): void;
  created(name: string): void;
  rename(name: string, newName: string): void;
  renamed(name: string, newName: string): void;
  error(): void;
}
