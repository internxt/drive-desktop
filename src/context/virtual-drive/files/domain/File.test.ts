import { File } from './File';
import { FileStatuses } from './FileStatus';

describe('File', () => {
  const fileMock = {
    id: 1,
    uuid: 'f654a669-094f-43cc-9b6a-a819cfeee74c',
    contentsId: '21e5ac20-4d87-4458-9cb5-',
    folderId: 100,
    createdAt: '2025-01-01T00:00:00.000Z',
    modificationTime: '2025-01-01T00:00:00.000Z',
    path: '/documents/file.txt',
    size: 1000,
    updatedAt: '2025-01-01T00:00:00.000Z',
    status: FileStatuses.EXISTS,
  };

  describe('update', () => {
    it('should update the path when provided', () => {
      const file = File.from(fileMock);
      const newPath = '/documents/updated/file.txt';

      file.update({ path: newPath });

      expect(file.path).toBe(newPath);
    });

    it('should update the folderId when provided', () => {
      const file = File.from(fileMock);
      const newFolderId = 200;

      file.update({ folderId: newFolderId });

      expect(file.folderId).toBe(newFolderId);
    });

    it('should update the size when provided', () => {
      const file = File.from(fileMock);
      const newSize = 2000;

      file.update({ size: newSize });

      expect(file.size).toBe(newSize);
    });

    it('should update the contentsId when provided', () => {
      const file = File.from(fileMock);
      const newContentsId = 'new-contents-id-12345678';

      file.update({ contentsId: newContentsId });

      expect(file.contentsId).toBe(newContentsId);
    });

    it('should update the status when provided', () => {
      const file = File.from(fileMock);

      file.update({ status: FileStatuses.TRASHED });

      expect(file.status.value).toBe(FileStatuses.TRASHED);
    });

    it('should update the updatedAt when provided', () => {
      const file = File.from(fileMock);
      const newUpdatedAt = '2025-12-31T23:59:59.000Z';

      file.update({ updatedAt: newUpdatedAt });

      expect(file.updatedAt.toISOString()).toBe(newUpdatedAt);
    });

    it('should update the createdAt when provided', () => {
      const file = File.from(fileMock);
      const newCreatedAt = '2025-06-15T12:00:00.000Z';

      file.update({ createdAt: newCreatedAt });

      expect(file.createdAt.toISOString()).toBe(newCreatedAt);
    });

    it('should update multiple attributes at once', () => {
      const file = File.from(fileMock);
      const updates = {
        path: '/new/path/file.txt',
        folderId: 300,
        size: 3000,
        contentsId: 'new-contents-id-12345678',
        status: FileStatuses.TRASHED,
      };

      file.update(updates);

      expect(file.path).toBe(updates.path);
      expect(file.folderId).toBe(updates.folderId);
      expect(file.size).toBe(updates.size);
      expect(file.contentsId).toBe(updates.contentsId);
      expect(file.status.value).toBe(updates.status);
    });
  });
});
