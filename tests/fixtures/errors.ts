import { ErrorCause, AppIssue } from '../../src/apps/shared/types';
import { AppErrorName } from '../../src/shared/issues/AppIssue';
import { FatalError } from '../../src/shared/issues/FatalError';
import { VirtualDriveIssue } from '../../src/shared/issues/VirtualDriveIssue';

export const createBackupFatalError = (errorName: FatalError) => ({
  path: `folder/file${Date.now()}.txt`,
  folderId: 24816,
  errorName,
});

export const createSyncError = (
  processErrorName: ErrorCause
): VirtualDriveIssue => ({
  name: 'name',
  error: 'DELETE_ERROR',
  cause: processErrorName,
});

export const createGeneralIssueFixture = (name: AppErrorName): AppIssue => ({
  action: 'GET_DEVICE_NAME_ERROR',
  errorName: name,
  process: 'GENERAL',
  errorDetails: {
    name: 'Device name could not be retrieved',
    message: 'Error retrieving the device name',
    stack: '',
  },
});
