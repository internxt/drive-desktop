import { BackupInfo } from '../../../../backups/BackupInfo';
import { ProcessFatalErrorName } from '../../../../main/background-processes/backups/BackupFatalErrors/BackupFatalErrors';
import { WorkerExitCause } from '../../../../main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';

export type MainProcessBackupsMessages = {
  'backups.get-backup': () => Promise<BackupInfo>;

  'backups.backup-completed': (folderId: number) => void;

  'backups.backup-failed': (
    folderId: number,
    error: ProcessFatalErrorName
  ) => void;

  'backups.process-error': (message: string) => void;

  'backups.stopped': () => void;

  'backups.total-items-calculated': (total: number, processed: number) => void;

  'backups.get-last-progress': () => void;

  'backups.progress-update': (processed: number) => void;

  'backups.get-backup-issues': (id: number) => WorkerExitCause;

  'backups.clear-backup-issues': (id: number) => void;

  'backups.file-issue': (name: string, issue: ProcessFatalErrorName) => void;
};
