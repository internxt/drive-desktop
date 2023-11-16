import {
  ProcessFatalErrorName,
  ProcessErrorName,
  ProcessIssue,
  GeneralErrorName,
  GeneralIssue,
} from '../../src/apps/shared/types';

export const createBackupFatalError = (errorName: ProcessFatalErrorName) => ({
  path: `folder/file${Date.now()}.txt`,
  folderId: 24816,
  errorName,
});

export const createSyncError = (
  processErrorName: ProcessErrorName
): ProcessIssue => ({
  kind: 'LOCAL',
  name: 'name',
  action: 'DELETE_ERROR',
  errorName: processErrorName,
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
