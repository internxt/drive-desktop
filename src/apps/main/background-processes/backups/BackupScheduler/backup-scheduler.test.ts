import { electronStore } from '@/apps/main/config';
import { BackupScheduler } from './BackupScheduler';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import * as launchBackupProcesses from '../launchBackupProcesses';

describe('backup-scheduler', () => {
  const getMock = partialSpyOn(electronStore, 'get');
  const lanunchBackupProcessesMock = partialSpyOn(launchBackupProcesses, 'launchBackupProcesses');

  const props = mockProps<typeof BackupScheduler.start>({});

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
    BackupScheduler.start(props);
    // Then
    call(loggerMock.debug).toMatchObject({ msg: 'There is no last backup or interval set' });
  });

  it('should run backups if the next backup moment has already happened', () => {
    // Given
    getMock.mockReturnValueOnce(50).mockReturnValueOnce(49);
    // When
    BackupScheduler.start(props);
    // Then
    calls(lanunchBackupProcessesMock).toHaveLength(0);
    vi.runAllTimers();
    calls(lanunchBackupProcessesMock).toHaveLength(1);
  });

  it('should wait timeout if the next backup moment has not happened yet', () => {
    // Given
    getMock.mockReturnValueOnce(50).mockReturnValueOnce(100);
    // When
    BackupScheduler.start(props);
    // Then
    vi.advanceTimersByTime(49);
    calls(lanunchBackupProcessesMock).toHaveLength(0);
    vi.advanceTimersByTime(1);
    calls(lanunchBackupProcessesMock).toHaveLength(1);
  });
});
