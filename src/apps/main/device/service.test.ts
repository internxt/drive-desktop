import { describe, it, expect, vi, beforeEach } from 'vitest';
import configStore from '../config';
import { ensureBackupUuidExists } from './service';
import { client } from '@/apps/shared/HttpClient/client';

// Mock dependencies
vi.mock('../config', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock('../auth/service', () => ({
  getUser: vi.fn(),
  setUser: vi.fn(),
}));

describe('ensureBackupUuidExists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle empty backup list', async () => {
    const emptyBackupsList = {};
    await ensureBackupUuidExists(emptyBackupsList);

    expect(configStore.set).toHaveBeenCalledWith('backupList', emptyBackupsList);
    expect(configStore.set).toHaveBeenCalledTimes(1);
  });

  it('should fetch UUIDs for enabled backups without UUIDs', async () => {
    const backupsList: Record<
      string,
      {
        enabled: boolean;
        folderId: number;
        folderUuid?: string;
      }
    > = {
      '/path/to/backup1': {
        enabled: true,
        folderId: 123,
      },
      '/path/to/backup1.5': {
        enabled: true,
        folderId: 124,
      },
      '/path/to/backup2': {
        enabled: false,
        folderId: 456,
      },
      '/path/to/backup3': {
        enabled: true,
        folderId: 789,
        folderUuid: 'existing-uuid',
      },
    };

    vi.spyOn(client, 'GET').mockResolvedValue({ data: { uuid: 'new-uuid-123' }, error: null });

    await ensureBackupUuidExists(backupsList);

    // Check that UUIDs were properly updated
    expect(backupsList['/path/to/backup1'].folderUuid).toBe('new-uuid-123');
    expect(backupsList['/path/to/backup1.5'].folderUuid).toBe('new-uuid-123');
    expect(backupsList['/path/to/backup2'].folderUuid).toBeUndefined();
    expect(backupsList['/path/to/backup3'].folderUuid).toBe('existing-uuid');

    expect(configStore.set).toHaveBeenCalledWith('backupList', backupsList);
  });
});
