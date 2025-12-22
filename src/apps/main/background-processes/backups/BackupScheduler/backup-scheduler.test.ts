import { electronStore } from '@/apps/main/config';
import { BackupScheduler } from './BackupScheduler';
import { call, calls, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import * as launchBackupProcesses from '../launchBackupProcesses';

describe('backup-scheduler', () => {
  const getMock = partialSpyOn(electronStore, 'get');
  const lanunchBackupProcessesMock = partialSpyOn(launchBackupProcesses, 'launchBackupProcesses');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(100));

    BackupScheduler.stop();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not schedule backups if there is no last backup', () => {
    // Given
    getMock.mockReturnValueOnce(-1);
    // When
    BackupScheduler.start();
    // Then
    call(loggerMock.debug).toMatchObject({ msg: 'There is no last backup or interval set' });
  });

  it('should run backups if the next backup moment has already happened', () => {
    // Given
    getMock.mockReturnValueOnce(50).mockReturnValueOnce(49);
    // When
    BackupScheduler.start();
    // Then
    calls(lanunchBackupProcessesMock).toHaveLength(0);
    vi.runAllTimers();
    calls(lanunchBackupProcessesMock).toHaveLength(1);
  });

  it('should wait timeout if the next backup moment has not happened yet', () => {
    // Given
    getMock.mockReturnValueOnce(50).mockReturnValueOnce(100);
    // When
    BackupScheduler.start();
    // Then
    vi.advanceTimersByTime(49);
    calls(lanunchBackupProcessesMock).toHaveLength(0);
    vi.advanceTimersByTime(1);
    calls(lanunchBackupProcessesMock).toHaveLength(1);
  });
});
