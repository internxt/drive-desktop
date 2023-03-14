import { BackupFatalError } from '../../main/background-processes/types/BackupFatalError';
import {
  ProcessErrorName,
  ProcessFatalErrorName,
  ProcessIssue,
} from '../../workers/types';

export const createBackupFatalError = (
  errorName: ProcessFatalErrorName
): BackupFatalError => ({
  path: `folder/file${Date.now()}.txt`,
  folderId: 24816,
  errorName,
});

export const createSyncError = (
  processErrorName: ProcessErrorName
): ProcessIssue => ({
  kind: 'LOCAL',
  name: 'name',
  action: 'PULL_ERROR',
  errorName: processErrorName,
  errorDetails: {
    action: 'a',
    message: 'b',
    code: 'lkañjsdlfk',
    stack: 'dsasdf',
  },
  process: 'SYNC',
});
