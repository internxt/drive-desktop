import { AppError } from '../../src/shared/issues/AppError';
import { AppIssue } from '../../src/shared/issues/AppIssue';
import { SyncError } from '../../src/shared/issues/SyncErrorCause';
import { FatalError } from '../../src/shared/issues/FatalError';
import { VirtualDriveIssue } from '../../src/shared/issues/VirtualDriveIssue';

export const createBackupFatalError = (errorName: FatalError) => ({
  path: `folder/file${Date.now()}.txt`,
  folderId: 24816,
  errorName,
});

export const createSyncError = (cause: SyncError): VirtualDriveIssue => ({
  name: 'name',
  error: 'DELETE_ERROR',
  cause: cause,
});

export const createGeneralIssueFixture = (name: AppError): AppIssue => ({
  action: 'GET_DEVICE_NAME_ERROR',
  errorName: name,
  errorDetails: {
    name: 'Device name could not be retrieved',
    message: 'Error retrieving the device name',
    stack: '',
  },
});
