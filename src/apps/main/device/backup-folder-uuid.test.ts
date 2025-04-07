import { mockProps } from 'tests/vitest/utils.helper.test';
import configStore from '../config';
import { BackupFolderUuid } from './backup-folder-uuid';
import { mockDeep } from 'vitest-mock-extended';

describe('backup-folder-uuid', () => {
  const store = mockDeep<typeof configStore>();
  const service = new BackupFolderUuid(store);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ensureBackupUuidExists', () => {
    it('should handle empty backup list', async () => {
      // Given
      const props = mockProps<typeof service.ensureBackupUuidExists>({ backupsList: {} });

      // When
      await service.ensureBackupUuidExists(props);

      // Then
      expect(store.set).toHaveBeenCalledWith('backupList', {});
      expect(store.set).toHaveBeenCalledTimes(1);
    });

    it('should fetch UUIDs for enabled backups without UUIDs', async () => {
      // Given
      vi.spyOn(service, 'getBackupFolderUuid').mockResolvedValue('new-uuid-123');
      const props = mockProps<typeof service.ensureBackupUuidExists>({
        backupsList: {
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
        },
      });

      // When
      await service.ensureBackupUuidExists(props);

      // Then
      expect(store.set).toHaveBeenCalledWith('backupList', {
        '/path/to/backup1': {
          enabled: true,
          folderId: 123,
          folderUuid: 'new-uuid-123',
        },
        '/path/to/backup1.5': {
          enabled: true,
          folderId: 124,
          folderUuid: 'new-uuid-123',
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
      });
    });
  });
});
