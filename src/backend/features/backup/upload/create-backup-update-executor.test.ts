import { partialSpyOn } from '../../../../../tests/vitest/utils.helper';
import { DriveDesktopError } from '../../../../context/shared/domain/errors/DriveDesktopError';
import { FileMother } from '../../../../context/virtual-drive/files/domain/__test-helpers__/FileMother';
import { LocalFileMother } from '../../../../context/local/localFile/domain/__test-helpers__/LocalFileMother';
import { BackupProgressTracker } from '../backup-progress-tracker';
import { mockDeep } from 'vitest-mock-extended';
import { Environment } from '@internxt/inxt-js';
import { createBackupUpdateExecutor, ModifiedFilePair } from './create-backup-update-executor';
import * as updateFileToBackupModule from './update-file-to-backup';
import * as backupErrorsTrackerModule from '..';

describe('createBackupUpdateExecutor', () => {
  const updateFileToBackupMock = partialSpyOn(updateFileToBackupModule, 'updateFileToBackup');
  const backupErrorsTrackerAddMock = partialSpyOn(backupErrorsTrackerModule.backupErrorsTracker, 'add');

  let tracker: BackupProgressTracker;
  let abortController: AbortController;
  let environment: Environment;

  beforeEach(() => {
    tracker = mockDeep<BackupProgressTracker>();
    abortController = new AbortController();
    environment = mockDeep<Environment>();
  });

  function createExecutor() {
    return createBackupUpdateExecutor('bucket', environment, tracker);
  }

  function createPair(): ModifiedFilePair {
    return [LocalFileMother.any(), FileMother.any()];
  }

  it('should update a file successfully', async () => {
    updateFileToBackupMock.mockResolvedValue({ data: undefined });
    const executor = createExecutor();
    const pair = createPair();

    const result = await executor(pair, abortController.signal);

    expect(result.data).toBeUndefined();
    expect(result.error).toBeUndefined();
    expect(tracker.incrementProcessed).toHaveBeenCalledWith(1);
  });

  it('should return fatal error without tracking it', async () => {
    const fatalError = new DriveDesktopError('NOT_ENOUGH_SPACE', 'No space');
    updateFileToBackupMock.mockResolvedValue({ error: fatalError });
    const executor = createExecutor();
    const pair = createPair();

    const result = await executor(pair, abortController.signal);

    expect(result.error).toBe(fatalError);
    expect(backupErrorsTrackerAddMock).not.toHaveBeenCalled();
    expect(tracker.incrementProcessed).toHaveBeenCalledWith(1);
  });

  it('should track non-fatal error and return success', async () => {
    const nonFatalError = new DriveDesktopError('BAD_RESPONSE', 'Network error');
    updateFileToBackupMock.mockResolvedValue({ error: nonFatalError });
    const executor = createExecutor();
    const [localFile, remoteFile] = createPair();

    const result = await executor([localFile, remoteFile], abortController.signal);

    expect(result.data).toBeUndefined();
    expect(result.error).toBeUndefined();
    expect(backupErrorsTrackerAddMock).toHaveBeenCalledWith(remoteFile.folderId, {
      name: localFile.nameWithExtension(),
      error: nonFatalError.cause,
    });
    expect(tracker.incrementProcessed).toHaveBeenCalledWith(1);
  });

  it('should call updateFileToBackup with correct params', async () => {
    updateFileToBackupMock.mockResolvedValue({ data: undefined });
    const executor = createExecutor();
    const [localFile, remoteFile] = createPair();

    await executor([localFile, remoteFile], abortController.signal);

    expect(updateFileToBackupMock).toHaveBeenCalledWith({
      path: localFile.path,
      size: localFile.size,
      bucket: 'bucket',
      fileUuid: remoteFile.uuid,
      environment,
      signal: abortController.signal,
    });
  });
  it('should return success without updating when signal is already aborted', async () => {
    const executor = createExecutor();
    const pair = createPair();
    abortController.abort();

    const result = await executor(pair, abortController.signal);

    expect(result.data).toBeUndefined();
    expect(result.error).toBeUndefined();
    expect(updateFileToBackupMock).not.toHaveBeenCalled();
  });
});
