import { BackupFatalError } from '../../main/background-processes/types/BackupFatalError';
import {
  GeneralErrorName,
  GeneralIssue,
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

export const createGeneralIssueFixture = (
  name: GeneralErrorName
): GeneralIssue => ({
  action: 'GET_DEVICE_NAME_ERROR',
  errorName: name,
  process: 'GENERAL',
  errorDetails: {
    name: 'Device name could not be retrived',
    message: 'Error retriving the device name',
    stack: '',
  },
});
