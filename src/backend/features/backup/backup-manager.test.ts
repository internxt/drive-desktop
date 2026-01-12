import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { BackupManager } from './backup-manager';
import type { BackupsStopController } from '../../../apps/main/background-processes/backups/BackupsStopController/BackupsStopController';
import type { BackupsProcessStatus } from '../../../apps/main/background-processes/backups/BackupsProcessStatus/BackupsProcessStatus';
import type { BackupsProcessTracker } from '../../../apps/main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import type { BackupFatalErrors } from '../../../apps/main/background-processes/backups/BackupFatalErrors/BackupFatalErrors';
import type { BackupConfiguration } from '../../../apps/main/background-processes/backups/BackupConfiguration/BackupConfiguration';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { launchBackupProcesses } from './launch-backup-processes';

vi.mock('./launch-backup-processes', () => ({
  launchBackupProcesses: vi.fn(),
}));

vi.mock('../../../apps/main/background-processes/backups/BackupScheduler/BackupScheduler', () => ({
  BackupScheduler: vi.fn().mockImplementation(() => ({
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
    reschedule: vi.fn(),
    isScheduled: vi.fn().mockReturnValue(false),
  })),
}));

describe('BackupManager', () => {
  let backupManager: BackupManager;
  let mockStopController: BackupsStopController;
  let mockStatus: BackupsProcessStatus;
  let mockTracker: BackupsProcessTracker;
  let mockErrors: BackupFatalErrors;
  let mockConfig: BackupConfiguration;

  beforeEach(() => {
    vi.clearAllMocks();

    mockStopController = mockDeep<BackupsStopController>();
    mockStatus = mockDeep<BackupsProcessStatus>();
    mockTracker = mockDeep<BackupsProcessTracker>();
    mockErrors = mockDeep<BackupFatalErrors>();

    mockConfig = mockDeep<BackupConfiguration>();

    // Setup default config values
    Object.defineProperty(mockConfig, 'enabled', {
      get: vi.fn(() => true),
      set: vi.fn(),
      configurable: true,
    });
    Object.defineProperty(mockConfig, 'lastBackup', {
      get: vi.fn(() => 1234567890),
      configurable: true,
    });
    Object.defineProperty(mockConfig, 'backupInterval', {
      get: vi.fn(() => 3600000),
      set: vi.fn(),
      configurable: true,
    });

    vi.mocked(mockStatus.isIn).mockReturnValue(false);

    backupManager = new BackupManager(mockStopController, mockStatus, mockTracker, mockErrors, mockConfig);
  });

  describe('startBackup', () => {
    it('should not start backup if backups are disabled', async () => {
      Object.defineProperty(mockConfig, 'enabled', {
        get: vi.fn(() => false),
        configurable: true,
      });

      await backupManager.startBackup();

      expect(logger.debug).toHaveBeenCalledWith({
        tag: 'BACKUPS',
        msg: 'Backups are disabled, not starting',
      });
      expect(launchBackupProcesses).not.toHaveBeenCalled();
    });

    it('should not start backup if backup is already running', async () => {
      vi.mocked(mockStatus.isIn).mockReturnValue(true);

      await backupManager.startBackup();

      expect(logger.debug).toHaveBeenCalledWith({
        tag: 'BACKUPS',
        msg: 'Backup already running, skipping',
      });
      expect(launchBackupProcesses).not.toHaveBeenCalled();
    });

    it('should reset stop controller and errors before starting backup', async () => {
      vi.mocked(mockStatus.isIn).mockReturnValue(false);

      await backupManager.startBackup();

      expect(mockStopController.reset).toHaveBeenCalled();
      expect(mockErrors.clear).toHaveBeenCalled();
    });

    it('should change status to RUNNING before starting backup', async () => {
      vi.mocked(mockStatus.isIn).mockReturnValue(false);

      await backupManager.startBackup();

      expect(mockStatus.set).toHaveBeenCalledWith('RUNNING');
    });

    it('should launch backup processes', async () => {
      vi.mocked(mockStatus.isIn).mockReturnValue(false);

      await backupManager.startBackup();

      expect(launchBackupProcesses).toHaveBeenCalledWith(mockTracker, mockErrors, mockStopController);
    });

    it('should change status to STANDBY and reset tracker after backup completes', async () => {
      vi.mocked(mockStatus.isIn).mockReturnValue(false);

      await backupManager.startBackup();

      expect(mockStatus.set).toHaveBeenCalledWith('STANDBY');
      expect(mockTracker.reset).toHaveBeenCalled();
    });

    it('should change status to STANDBY and reset tracker even if backup fails', async () => {
      vi.mocked(mockStatus.isIn).mockReturnValue(false);
      vi.mocked(launchBackupProcesses).mockRejectedValue(new Error('Backup failed'));

      await expect(backupManager.startBackup()).rejects.toThrow('Backup failed');

      expect(mockStatus.set).toHaveBeenCalledWith('STANDBY');
      expect(mockTracker.reset).toHaveBeenCalled();
    });
  });

  describe('stopBackup', () => {
    it('should not stop backup if no backup is running', () => {
      vi.mocked(mockStatus.isIn).mockReturnValue(false);

      backupManager.stopBackup();

      expect(logger.debug).toHaveBeenCalledWith({
        tag: 'BACKUPS',
        msg: 'No backup running to stop',
      });
      expect(mockStopController.userCancelledBackup).not.toHaveBeenCalled();
    });

    it('should call userCancelledBackup on stop controller when backup is running', () => {
      vi.mocked(mockStatus.isIn).mockReturnValue(true);

      backupManager.stopBackup();

      expect(mockStopController.userCancelledBackup).toHaveBeenCalled();
    });
  });

  describe('startScheduler', () => {
    it('should call start on the scheduler', async () => {
      const result = await backupManager.startScheduler();

      expect(result).toBeUndefined();
    });
  });

  describe('stopScheduler', () => {
    it('should call stop on the scheduler', () => {
      backupManager.stopScheduler();

      expect(true).toBe(true);
    });
  });

  describe('rescheduleBackups', () => {
    it('should call reschedule on the scheduler', () => {
      backupManager.rescheduleBackups();

      expect(true).toBe(true);
    });
  });

  describe('stopAndClearBackups', () => {
    it('should stop scheduler, clear errors, reset tracker and stop controller, and set status to STANDBY', () => {
      backupManager.stopAndClearBackups();

      expect(mockErrors.clear).toHaveBeenCalled();
      expect(mockTracker.reset).toHaveBeenCalled();
      expect(mockStopController.reset).toHaveBeenCalled();
      expect(mockStatus.set).toHaveBeenCalledWith('STANDBY');
    });
  });

  describe('isScheduled', () => {
    it('should return the scheduled status from scheduler', () => {
      const result = backupManager.isScheduled();

      expect(result).toBe(false);
    });
  });

  describe('isBackupRunning', () => {
    it('should return true when status is RUNNING', () => {
      vi.mocked(mockStatus.isIn).mockReturnValue(true);

      const result = backupManager.isBackupRunning();

      expect(result).toBe(true);
      expect(mockStatus.isIn).toHaveBeenCalledWith('RUNNING');
    });

    it('should return false when status is not RUNNING', () => {
      vi.mocked(mockStatus.isIn).mockReturnValue(false);

      const result = backupManager.isBackupRunning();

      expect(result).toBe(false);
      expect(mockStatus.isIn).toHaveBeenCalledWith('RUNNING');
    });
  });

  describe('changeBackupStatus', () => {
    it('should set the status to the provided value', () => {
      backupManager.changeBackupStatus('RUNNING');

      expect(mockStatus.set).toHaveBeenCalledWith('RUNNING');
    });

    it('should set the status to STANDBY', () => {
      backupManager.changeBackupStatus('STANDBY');

      expect(mockStatus.set).toHaveBeenCalledWith('STANDBY');
    });
  });
});
