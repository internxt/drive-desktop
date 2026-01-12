import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ipcMain } from 'electron';
import { getIpcHandler } from './__test-helpers__/ipc-test-utils';
import type { BackupsProcessStatus } from '../../../../apps/main/background-processes/backups/BackupsProcessStatus/BackupsProcessStatus';
import { registerBackupProcessStatusIpcHandler } from './register-backup-process-status-ipc-handler';

describe('registerBackupProcessStatusIpcHandler', () => {
  const mockStatus = {
    current: vi.fn(),
  } as unknown as BackupsProcessStatus;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register the get-backups-status handler', () => {
    registerBackupProcessStatusIpcHandler(mockStatus);

    expect(ipcMain.handle).toHaveBeenCalledWith('get-backups-status', expect.any(Function));
  });

  describe('get-backups-status', () => {
    it('should return the current status from status.current()', async () => {
      const mockCurrentStatus = 'RUNNING';
      const mockFn = mockStatus.current as unknown as ReturnType<typeof vi.fn>;
      mockFn.mockReturnValue(mockCurrentStatus);

      registerBackupProcessStatusIpcHandler(mockStatus);
      const handler = getIpcHandler('get-backups-status')!;

      const result = await handler();

      expect(result).toBe(mockCurrentStatus);
      expect(mockStatus.current).toHaveBeenCalled();
    });
  });
});
