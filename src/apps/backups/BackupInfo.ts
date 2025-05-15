import { BackupFatalErrors } from '../main/background-processes/backups/BackupFatalErrors/BackupFatalErrors';

export type BackupInfo = {
  folderUuid: string;
  folderId: number;
  tmpPath: string;
  backupsBucket: string;
  pathname: string;
  plainName: string;
};

export type BackupsContext = BackupInfo & {
  abortController: AbortController;
  errors: BackupFatalErrors;
};
