import {
  ProcessFatalErrorName,
  ProcessErrorName,
  ProcessIssue,
} from '@/apps/shared/types';
import { GeneralIssue} from '@/apps/main/background-processes/issues';

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
  name: GeneralIssue['error']
): GeneralIssue => ({
  tab: 'general',
  error: name,
  name: 'Error retriving the device name',
});
