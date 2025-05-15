import { WorkerExitCause } from '../../../../main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';

export type MainProcessBackupsMessages = {
  'backups.get-last-progress': () => void;

  'backups.get-backup-issues': (id: number) => WorkerExitCause;

  'backups.clear-backup-issues': (id: number) => void;
};
