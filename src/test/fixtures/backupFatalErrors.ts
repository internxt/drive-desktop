import BackupFatalError from '../../main/background-processes/types/BackupFatalError';
import { ProcessFatalErrorName } from '../../workers/types';

export const createBackupFatalError = (
  errorName: ProcessFatalErrorName
): BackupFatalError => ({
  path: `folder/file${Date.now()}.txt`,
  folderId: 24816,
  errorName,
});
