import { call, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import configStore from '../config';
import { migrateBackupFolderToUuids } from './migrate-backup-folder-to-uuids';

describe('migrate-backup-folder-to-uuids', () => {
  const getMock = partialSpyOn(configStore, 'get');
  const setMock = partialSpyOn(configStore, 'set');

  let props: Parameters<typeof migrateBackupFolderToUuids>[0];

  beforeEach(() => {
    props = { children: [{ id: 1, uuid: 'folder-uuid' }] };
  });

  it('should fill the folder uuid of legacy entries that only have the folder id', () => {
    // Given
    getMock.mockReturnValue({ '/backup': { enabled: true, folderId: 1 } });
    // When
    migrateBackupFolderToUuids(props);
    // Then
    call(setMock).toStrictEqual(['backupList', { '/backup': { enabled: true, folderId: 1, folderUuid: 'folder-uuid' } }]);
  });

  it('should not overwrite entries that already have a folder uuid', () => {
    // Given
    getMock.mockReturnValue({ '/backup': { enabled: true, folderId: 1, folderUuid: 'other-uuid' } });
    // When
    migrateBackupFolderToUuids(props);
    // Then
    expect(setMock).not.toHaveBeenCalled();
  });

  it('should not save when no remote folder matches the legacy folder id', () => {
    // Given
    getMock.mockReturnValue({ '/backup': { enabled: true, folderId: 2 } });
    // When
    migrateBackupFolderToUuids(props);
    // Then
    expect(setMock).not.toHaveBeenCalled();
  });
});
