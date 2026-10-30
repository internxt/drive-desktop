import { mapRecoverySyncFilesPage, mapRecoverySyncFoldersPage } from './map-recovery-sync-page';

describe('map-recovery-sync-page', () => {
  const date = '2025-06-01T00:00:00.000Z';
  const item = {
    id: 1,
    uuid: 'uuid',
    status: 'EXISTS',
    plainName: 'name',
    createdAt: date,
    updatedAt: date,
    creationTime: date,
    modificationTime: date,
  };
  const file = { ...item, type: 'txt', fileId: 'fileId', size: '1024', folderId: 2, folderUuid: 'folderUuid', bucket: 'bucket' };
  const folder = { ...item, parentId: 2, parentUuid: 'parentUuid', bucket: 'bucket' };

  it('should map a files page and convert its size', () => {
    // When
    const { data } = mapRecoverySyncFilesPage({ page: { items: [file], nextCursor: 'cursor' } });
    // Then
    expect(data).toStrictEqual({
      items: [
        {
          id: 1,
          uuid: 'uuid',
          status: 'EXISTS',
          plainName: 'name',
          createdAt: date,
          updatedAt: date,
          creationTime: date,
          modificationTime: date,
          type: 'txt',
          fileId: 'fileId',
          size: 1024,
          folderId: 2,
          folderUuid: 'folderUuid',
        },
      ],
      nextCursor: 'cursor',
    });
  });

  it('should map every remote status', () => {
    // Given
    const items = ['EXISTS', 'TRASHED', 'DELETED'].map((status) => ({ ...folder, status }));
    // When
    const { data } = mapRecoverySyncFoldersPage({ page: { items, nextCursor: null } });
    // Then
    expect(data?.items.map(({ status }) => status)).toStrictEqual(['EXISTS', 'TRASHED', 'DELETED']);
    expect(data?.nextCursor).toBeNull();
  });

  it('should map null file names, extensions and parent uuids to empty strings', () => {
    // When
    const { data } = mapRecoverySyncFilesPage({
      page: { items: [{ ...file, plainName: null, type: null, folderUuid: null }], nextCursor: null },
    });
    // Then
    expect(data?.items).toMatchObject([{ plainName: '', type: '', folderUuid: '' }]);
  });

  it('should map a folder without a parent id', () => {
    // When
    const { data } = mapRecoverySyncFoldersPage({ page: { items: [{ ...folder, parentId: null }], nextCursor: null } });
    // Then
    expect(data?.items).toMatchObject([{ parentId: null }]);
  });

  it('should return an error for an unknown status', () => {
    // When
    const { error } = mapRecoverySyncFilesPage({ page: { items: [{ ...file, status: 'REMOVED' }], nextCursor: null } });
    // Then
    expect(error?.message).toBe('Invalid recovery sync files page');
  });

  it('should return an error for an invalid updatedAt', () => {
    // When
    const { error } = mapRecoverySyncFoldersPage({ page: { items: [{ ...folder, updatedAt: 'invalid' }], nextCursor: null } });
    // Then
    expect(error?.message).toBe('Invalid recovery sync folders page');
  });

  it('should return an error for an invalid size', () => {
    // When
    const { error } = mapRecoverySyncFilesPage({ page: { items: [{ ...file, size: 'abc' }], nextCursor: null } });
    // Then
    expect(error?.message).toBe('Invalid recovery sync files page');
  });

  it('should return an error when the next cursor is missing', () => {
    // When
    const { error } = mapRecoverySyncFilesPage({ page: { items: [] } });
    // Then
    expect(error?.message).toBe('Invalid recovery sync files page');
  });
});
