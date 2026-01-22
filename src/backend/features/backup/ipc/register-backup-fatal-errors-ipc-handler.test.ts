import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { ipcMain } from 'electron';
import { registerBackupFatalErrorsIpcHandler } from './register-backup-fatal-errors-ipc-handler';
import { getIpcHandler } from './__test-helpers__/ipc-test-utils';
import type { BackupErrorsTracker } from '../backup-errors-tracker';

describe('registerBackupFatalErrorsIpcHandler', () => {
  const mockBackupErrors = mockDeep<BackupErrorsTracker>();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register all handlers', () => {
    registerBackupFatalErrorsIpcHandler(mockBackupErrors);

    expect(ipcMain.handle).toHaveBeenCalledWith('get-backup-fatal-errors', expect.any(Function));
    expect(ipcMain.handle).toHaveBeenCalledWith('get-backup-error-by-folder', expect.any(Function));
    expect(ipcMain.handle).toHaveBeenCalledWith('get-last-backup-had-issues', expect.any(Function));
  });

  describe('get-backup-fatal-errors', () => {
    it('should return all backup errors from backupErrors.getAll()', async () => {
      const mockErrors = [{ name: 'folder1', error: 'BAD_RESPONSE' as const }];
      mockBackupErrors.getAll.mockReturnValue(mockErrors);

      registerBackupFatalErrorsIpcHandler(mockBackupErrors);
      const handler = getIpcHandler('get-backup-fatal-errors')!;

      const result = await handler();

      expect(result).toBe(mockErrors);
      expect(mockBackupErrors.getAll).toHaveBeenCalled();
    });
  });

  describe('get-backup-error-by-folder', () => {
    it('should return the error for a specific folderId', async () => {
      const mockError = { name: 'folder1', error: 'NO_INTERNET' as const };
      mockBackupErrors.get.mockReturnValue(mockError);

      registerBackupFatalErrorsIpcHandler(mockBackupErrors);
      const handler = getIpcHandler('get-backup-error-by-folder')!;

      const result = await handler({} as Electron.IpcMainInvokeEvent, 123);

      expect(result).toBe(mockError);
      expect(mockBackupErrors.get).toHaveBeenCalledWith(123);
    });

    it('should return undefined if no error exists for folderId', async () => {
      mockBackupErrors.get.mockReturnValue(undefined);

      registerBackupFatalErrorsIpcHandler(mockBackupErrors);
      const handler = getIpcHandler('get-backup-error-by-folder')!;

      const result = await handler({} as Electron.IpcMainInvokeEvent, 999);

      expect(result).toBeUndefined();
      expect(mockBackupErrors.get).toHaveBeenCalledWith(999);
    });
  });

  describe('get-last-backup-had-issues', () => {
    it('should return true when last backup had fatal issues', async () => {
      mockBackupErrors.lastBackupHadFatalIssue.mockReturnValue(true);

      registerBackupFatalErrorsIpcHandler(mockBackupErrors);
      const handler = getIpcHandler('get-last-backup-had-issues')!;

      const result = await handler();

      expect(result).toBe(true);
      expect(mockBackupErrors.lastBackupHadFatalIssue).toHaveBeenCalled();
    });

    it('should return false when last backup had no fatal issues', async () => {
      mockBackupErrors.lastBackupHadFatalIssue.mockReturnValue(false);

      registerBackupFatalErrorsIpcHandler(mockBackupErrors);
      const handler = getIpcHandler('get-last-backup-had-issues')!;

      const result = await handler();

      expect(result).toBe(false);
      expect(mockBackupErrors.lastBackupHadFatalIssue).toHaveBeenCalled();
    });
  });
});
