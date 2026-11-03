import { BackupsContext } from '@/apps/backups/BackupInfo';
import { Backup } from '@/apps/backups/Backups';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as issues from '../../issues';
import { executeBackupWorker } from './executeBackupWorker';

describe('execute-backup-worker', () => {
  const runMock = partialSpyOn(Backup, 'run');
  const countBackupUploadIssuesMock = partialSpyOn(issues, 'countBackupUploadIssues');

  const ctx = { logger: loggerMock, folderUuid: 'folderUuid' } as unknown as BackupsContext;

  beforeEach(() => {
    runMock.mockResolvedValue(undefined);
  });

  it('should log that the backup is completed if every file was uploaded', async () => {
    // Given
    countBackupUploadIssuesMock.mockReturnValue(0);
    // When
    await executeBackupWorker(ctx);
    // Then
    call(loggerMock.debug).toStrictEqual({ msg: 'Backup completed', folderUuid: 'folderUuid' });
    expect(loggerMock.warn).not.toHaveBeenCalled();
  });

  it('should warn if some files were not uploaded', async () => {
    // Given
    countBackupUploadIssuesMock.mockReturnValue(3);
    // When
    await executeBackupWorker(ctx);
    // Then
    call(countBackupUploadIssuesMock).toStrictEqual({ folderUuid: 'folderUuid' });
    call(loggerMock.warn).toStrictEqual({ msg: 'Backup completed with failed uploads', folderUuid: 'folderUuid', failedUploads: 3 });
  });
});
