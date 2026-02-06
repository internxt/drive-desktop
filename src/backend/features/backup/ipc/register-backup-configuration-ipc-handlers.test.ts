import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ipcMain } from 'electron';
import { registerBackupConfigurationIpcHandlers } from './register-backup-configuration-ipc-handlers';
import { backupsConfig } from '..';
import { BACKUP_MANUAL_INTERVAL } from '../constants';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import type { BackupManager } from '../backup-manager';
import { getIpcHandler } from './__test-helpers__/ipc-test-utils';

vi.mock('..', () => ({
  BACKUP_MANUAL_INTERVAL: -1,
  backupsConfig: {
    backupInterval: 3600000,
    lastBackup: 1234567890,
    enabled: true,
    toggleEnabled: vi.fn(),
    hasDiscoveredBackups: vi.fn(),
    backupsDiscovered: vi.fn(),
  },
}));

describe('registerBackupConfigurationIpcHandlers', () => {
  const mockManager = {
    stopScheduler: vi.fn(),
    rescheduleBackups: vi.fn(),
  } as unknown as BackupManager;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register all IPC handlers', () => {
    registerBackupConfigurationIpcHandlers(mockManager);

    expect(ipcMain.handle).toHaveBeenCalledWith('get-backups-interval', expect.any(Function));
    expect(ipcMain.handle).toHaveBeenCalledWith('set-backups-interval', expect.any(Function));
    expect(ipcMain.handle).toHaveBeenCalledWith('get-last-backup-timestamp', expect.any(Function));
    expect(ipcMain.handle).toHaveBeenCalledWith('get-backups-enabled', expect.any(Function));
    expect(ipcMain.handle).toHaveBeenCalledWith('toggle-backups-enabled', expect.any(Function));
    expect(ipcMain.handle).toHaveBeenCalledWith('user.get-has-discovered-backups', expect.any(Function));
    expect(ipcMain.on).toHaveBeenCalledWith('user.set-has-discovered-backups', expect.any(Function));
  });

  describe('get-backups-interval', () => {
    it('should return the current backup interval', async () => {
      registerBackupConfigurationIpcHandlers(mockManager);
      const handler = getIpcHandler('get-backups-interval')!;
      const result = await handler();

      expect(result).toBe(3600000);
    });
  });

  describe('set-backups-interval', () => {
    it('should stop the scheduler when interval is set to BACKUP_MANUAL_INTERVAL', async () => {
      registerBackupConfigurationIpcHandlers(mockManager);
      const handler = getIpcHandler('set-backups-interval')!;

      await handler({}, BACKUP_MANUAL_INTERVAL);

      expect(mockManager.stopScheduler).toHaveBeenCalled();
      expect(mockManager.rescheduleBackups).not.toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith({
        tag: 'BACKUPS',
        msg: 'The backups schedule stopped',
      });
    });

    it('should reschedule the scheduler when interval is set to a valid interval', async () => {
      registerBackupConfigurationIpcHandlers(mockManager);
      const handler = getIpcHandler('set-backups-interval')!;
      await handler({}, 7200000);

      expect(mockManager.stopScheduler).not.toHaveBeenCalled();
      expect(mockManager.rescheduleBackups).toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith({
        tag: 'BACKUPS',
        msg: 'The backups has been rescheduled',
      });
    });

    it('should update the backupInterval in config', async () => {
      const mockConfig = backupsConfig satisfies typeof backupsConfig;
      mockConfig.backupInterval = 3600000;

      registerBackupConfigurationIpcHandlers(mockManager);
      const handler = getIpcHandler('set-backups-interval')!;

      await handler({}, 7200000);

      expect(mockConfig.backupInterval).toBe(7200000);
    });
  });

  describe('get-last-backup-timestamp', () => {
    it('should return the last backup timestamp', async () => {
      registerBackupConfigurationIpcHandlers(mockManager);
      const handler = getIpcHandler('get-last-backup-timestamp')!;

      const result = await handler();

      expect(result).toBe(1234567890);
    });
  });

  describe('get-backups-enabled', () => {
    it('should return the enabled status', async () => {
      registerBackupConfigurationIpcHandlers(mockManager);
      const handler = getIpcHandler('get-backups-enabled')!;

      const result = await handler();

      expect(result).toBe(true);
    });
  });

  describe('toggle-backups-enabled', () => {
    it('should call toggleEnabled on backupsConfig', async () => {
      registerBackupConfigurationIpcHandlers(mockManager);
      const handler = getIpcHandler('toggle-backups-enabled')!;

      await handler();

      expect(backupsConfig.toggleEnabled).toHaveBeenCalled();
    });
  });

  describe('user.get-has-discovered-backups', () => {
    it('should return whether user has discovered backups', async () => {
      const mockFn = backupsConfig.hasDiscoveredBackups as unknown as ReturnType<typeof vi.fn>;
      mockFn.mockReturnValue(true);

      registerBackupConfigurationIpcHandlers(mockManager);
      const handler = getIpcHandler('user.get-has-discovered-backups')!;

      const result = await handler();

      expect(result).toBe(true);
      expect(backupsConfig.hasDiscoveredBackups).toHaveBeenCalled();
    });
  });

  describe('user.set-has-discovered-backups', () => {
    it('should call backupsDiscovered on backupsConfig', async () => {
      registerBackupConfigurationIpcHandlers(mockManager);
      const handler = getIpcHandler('user.set-has-discovered-backups', true)!;
      await handler();

      expect(backupsConfig.backupsDiscovered).toHaveBeenCalled();
    });
  });
});
