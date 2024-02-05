import { SyncErrorCause } from '../../../../shared/issues/SyncErrorCause';

export interface SyncFileMessenger {
  created(name: string, extension: string): Promise<void>;
  errorWhileCreating(
    name: string,
    extension: string,
    cause: SyncErrorCause
  ): Promise<void>;
  trashing(name: string, extension: string, size: number): Promise<void>;
  trashed(name: string, extension: string, size: number): Promise<void>;
  errorWhileTrashing(
    name: string,
    extension: string,
    cause: SyncErrorCause
  ): Promise<void>;
  renaming(current: string, desired: string): Promise<void>;
  renamed(current: string, desired: string): Promise<void>;
  errorWhileRenaming(
    current: string,
    desired: string,
    cause: SyncErrorCause
  ): Promise<void>;
}
