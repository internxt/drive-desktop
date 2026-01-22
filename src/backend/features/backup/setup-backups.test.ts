import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setUpBackups } from './setup-backups';
import { userHasBackupsEnabled } from './utils/user-has-backups-enabled';
import { backupErrorsTracker, tracker, status, backupManager } from '.';
import { registerBackupConfigurationIpcHandlers } from './ipc/register-backup-configuration-ipc-handlers';
import { registerBackupFatalErrorsIpcHandler } from './ipc/register-backup-fatal-errors-ipc-handler';
import { registerBackupProcessStatusIpcHandler } from './ipc/register-backup-process-status-ipc-handler';
import { registerEventBusBackupHandlers } from './ipc/register-event-bus-backup-handlers';
import { registerBackupLifecycleIpcHandlers } from './ipc/register-backup-lifecycle-ipc-handlers';
import { logger } from '@internxt/drive-desktop-core/build/backend';

vi.mock('./utils/user-has-backups-enabled', () => ({
  userHasBackupsEnabled: vi.fn(),
}));

vi.mock('.', () => ({
  backupErrorsTracker: { mock: 'backupErrorsTracker' },
  tracker: { mock: 'tracker' },
  status: { mock: 'status' },
  backupManager: {
    startScheduler: vi.fn(),
    isScheduled: vi.fn(),
  },
}));

vi.mock('./ipc/register-backup-configuration-ipc-handlers', () => ({
  registerBackupConfigurationIpcHandlers: vi.fn(),
}));

vi.mock('./ipc/register-backup-fatal-errors-ipc-handler', () => ({
  registerBackupFatalErrorsIpcHandler: vi.fn(),
}));

vi.mock('./ipc/register-backup-process-status-ipc-handler', () => ({
  registerBackupProcessStatusIpcHandler: vi.fn(),
}));

vi.mock('./ipc/register-event-bus-backup-handlers', () => ({
  registerEventBusBackupHandlers: vi.fn(),
}));

vi.mock('./ipc/register-backup-lifecycle-ipc-handlers', () => ({
  registerBackupLifecycleIpcHandlers: vi.fn(),
}));

describe('setupBackups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not register any ipc handlers if user has no backup feature', async () => {
    vi.mocked(userHasBackupsEnabled).mockReturnValue(false);

    await setUpBackups();

    expect(logger.debug).toHaveBeenCalledWith({
      tag: 'BACKUPS',
      msg: 'User does not have the backup feature available',
    });
    expect(registerBackupFatalErrorsIpcHandler).not.toHaveBeenCalled();
    expect(registerBackupProcessStatusIpcHandler).not.toHaveBeenCalled();
    expect(registerBackupConfigurationIpcHandlers).not.toHaveBeenCalled();
    expect(registerEventBusBackupHandlers).not.toHaveBeenCalled();
    expect(registerBackupLifecycleIpcHandlers).not.toHaveBeenCalled();
  });

  it('should not schedule any backup process if user has no backup feature', async () => {
    vi.mocked(userHasBackupsEnabled).mockReturnValue(false);

    await setUpBackups();

    expect(backupManager.startScheduler).not.toHaveBeenCalled();
    expect(backupManager.isScheduled).not.toHaveBeenCalled();
  });

  it('should register ipc handlers if user has backup feature', async () => {
    vi.mocked(userHasBackupsEnabled).mockReturnValue(true);
    vi.mocked(backupManager.startScheduler).mockResolvedValue(undefined);
    vi.mocked(backupManager.isScheduled).mockReturnValue(true);

    await setUpBackups();

    expect(registerBackupFatalErrorsIpcHandler).toHaveBeenCalledWith(backupErrorsTracker);
    expect(registerBackupProcessStatusIpcHandler).toHaveBeenCalledWith(status);
    expect(registerBackupConfigurationIpcHandlers).toHaveBeenCalledWith(backupManager);
    expect(registerEventBusBackupHandlers).toHaveBeenCalledWith(true);
    expect(registerBackupLifecycleIpcHandlers).toHaveBeenCalledWith(true);
  });

  it('should schedule backup process if user has backup feature', async () => {
    vi.mocked(userHasBackupsEnabled).mockReturnValue(true);
    vi.mocked(backupManager.startScheduler).mockResolvedValue(undefined);
    vi.mocked(backupManager.isScheduled).mockReturnValue(true);

    await setUpBackups();

    expect(backupManager.startScheduler).toHaveBeenCalled();
    expect(backupManager.isScheduled).toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalledWith({
      tag: 'BACKUPS',
      msg: 'Start service',
    });
    expect(logger.debug).toHaveBeenCalledWith({
      tag: 'BACKUPS',
      msg: 'Backups schedule is set',
    });
    expect(logger.debug).toHaveBeenCalledWith({
      tag: 'BACKUPS',
      msg: 'Backups ready',
    });
  });
});
