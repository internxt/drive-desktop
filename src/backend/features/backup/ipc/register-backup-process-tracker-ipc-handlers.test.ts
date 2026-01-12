import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { ipcMain } from 'electron';
import { registerBackupProcessTrackerIpcHandlers } from './register-backup-process-tracker-ipc-handlers';
import { getIpcHandler } from './__test-helpers__/ipc-test-utils';
import type { BackupsProcessTracker } from '../../../../apps/main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';

describe('registerBackupProcessTrackerIpcHandlers', () => {
  const mockTracker = mockDeep<BackupsProcessTracker>();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register the get-last-backup-exit-reason handler', () => {
    registerBackupProcessTrackerIpcHandlers(mockTracker);

    expect(ipcMain.handle).toHaveBeenCalledWith('get-last-backup-exit-reason', expect.any(Function));
  });

  describe('get-last-backup-exit-reason', () => {
    it('should return the last exit reason from the tracker', async () => {
      const mockExitReason = 'backup-completed';
      vi.mocked(mockTracker.getLastExitReason).mockReturnValue(mockExitReason);

      registerBackupProcessTrackerIpcHandlers(mockTracker);
      const handler = getIpcHandler('get-last-backup-exit-reason')!;

      const result = await handler();

      expect(result).toBe(mockExitReason);
      expect(mockTracker.getLastExitReason).toHaveBeenCalled();
    });
  });
});
