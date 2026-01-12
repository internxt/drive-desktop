import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ipcMain } from 'electron';
import { registerBackupLifecycleIpcHandlers } from './register-backup-lifecycle-ipc-handlers';
import { backupManager } from '..';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { getIpcHandler } from './__test-helpers__/ipc-test-utils';

vi.mock('..', () => ({
  backupManager: {
    startBackup: vi.fn(),
    stopBackup: vi.fn(),
  },
}));

describe('registerBackupLifecycleIpcHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register the start-backups-process handler', () => {
    registerBackupLifecycleIpcHandlers(true);

    expect(ipcMain.on).toHaveBeenCalledWith('start-backups-process', expect.any(Function));
  });

  it('should register the stop-backups-process handler', () => {
    registerBackupLifecycleIpcHandlers(true);

    expect(ipcMain.on).toHaveBeenCalledWith('stop-backups-process', expect.any(Function));
  });

  describe('start-backups-process', () => {
    it('should call the backupManager startBackup method when start-backups-process event is called and user has backup feature', async () => {
      registerBackupLifecycleIpcHandlers(true);
      const handler = getIpcHandler('start-backups-process', true)!;

      await handler();

      expect(logger.debug).toHaveBeenCalledWith({
        tag: 'BACKUPS',
        msg: 'Backups started manually',
      });
      expect(backupManager.startBackup).toHaveBeenCalledTimes(1);
    });

    it('should not call startBackup when user does not have backup feature available', async () => {
      registerBackupLifecycleIpcHandlers(false);
      const handler = getIpcHandler('start-backups-process', true)!;

      await handler();

      expect(logger.debug).not.toHaveBeenCalled();
      expect(backupManager.startBackup).not.toHaveBeenCalled();
    });
  });

  describe('stop-backups-process', () => {
    it('should call the backupManager stopBackup method when stop-backups-process event is called', () => {
      registerBackupLifecycleIpcHandlers(true);
      const handler = getIpcHandler('stop-backups-process', true)!;

      handler();

      expect(logger.debug).toHaveBeenCalledWith({
        tag: 'BACKUPS',
        msg: 'Stopping backups',
      });
      expect(backupManager.stopBackup).toHaveBeenCalledTimes(1);
    });

    it('should call stopBackup regardless of backup feature availability', () => {
      registerBackupLifecycleIpcHandlers(false);
      const handler = getIpcHandler('stop-backups-process', true)!;

      handler();

      expect(logger.debug).toHaveBeenCalledWith({
        tag: 'BACKUPS',
        msg: 'Stopping backups',
      });
      expect(backupManager.stopBackup).toHaveBeenCalledTimes(1);
    });
  });
});
