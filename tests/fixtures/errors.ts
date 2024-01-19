import {
  ProcessFatalErrorName,
  ProcessErrorName,
  AppIssue,
} from '../../src/apps/shared/types';
import { AppErrorName } from '../../src/shared/issues/AppIssue';
import { VirtualDriveIssue } from '../../src/shared/issues/VirtualDriveIssue';

export const createBackupFatalError = (errorName: ProcessFatalErrorName) => ({
  path: `folder/file${Date.now()}.txt`,
  folderId: 24816,
  errorName,
});

export const createSyncError = (
  processErrorName: ProcessErrorName
): VirtualDriveIssue => ({
  node: 'name',
  action: 'DELETE_ERROR',
  errorName: processErrorName,
});

export const createGeneralIssueFixture = (name: AppErrorName): AppIssue => ({
  action: 'GET_DEVICE_NAME_ERROR',
  errorName: name,
  process: 'GENERAL',
  errorDetails: {
    name: 'Device name could not be retrived',
    message: 'Error retriving the device name',
    stack: '',
  },
});
