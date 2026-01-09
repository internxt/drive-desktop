import { InMemoryFileRepository } from './InMemoryFileRepository';
import { FileAttributes, File } from '../domain/File';
import { FileStatuses } from '../domain/FileStatus';

describe('InMemoryFileRepository', () => {
  let sut: InMemoryFileRepository;

  beforeEach(() => {
    sut = new InMemoryFileRepository();
  });

  it('should return an empty array if no contentsIds are provided', async () => {
    const result = await sut.searchByArrayOfContentsId([]);
    expect(result).toEqual([]);
  });

  it('should return an array of File objects when valid contentsIds are found', async () => {
    const contentsId1 = '21e5ac20-4d87-4458-9cb5-';
    const contentsId2 = 'e3103fa4-cb14-426f-9be2-';
    const fileUUID1 = 'f654a669-094f-43cc-9b6a-a819cfeee74c';
    const fileUUID2 = 'b72c61b5-427b-4dca-ae9a-4fd57294c1eb';
    const fileAttributes1: FileAttributes = {
      id: 1,
      uuid: fileUUID1,
      contentsId: contentsId1,
      folderId: 234,
      createdAt: '10-03-2025',
      modificationTime: '10-03-2025',
      path: '/valid/path/to/file.txt',
      size: 1234,
      updatedAt: '10-03-2025',
      status: FileStatuses.EXISTS,
    };

    const fileAttributes2: FileAttributes = {
      id: 1,
      uuid: fileUUID2,
      contentsId: contentsId2,
      folderId: 235,
      createdAt: '10-03-2025',
      modificationTime: '10-03-2025',
      path: '/another-valid/path/to/file.txt',
      size: 5678,
      updatedAt: '10-03-2025',
      status: FileStatuses.EXISTS,
    };

    const file1 = File.from(fileAttributes1);
    const file2 = File.from(fileAttributes2);

    await sut.upsert(file1);
    await sut.upsert(file2);

    const result = await sut.searchByArrayOfContentsId([contentsId1, contentsId2]);

    expect(result).toHaveLength(2);
    expect(result[0].uuid).toBe(fileUUID1);
    expect(result[1].uuid).toBe(fileUUID2);
  });

  it('should return only matching File objects when some contentsIds exist', async () => {
    const contentsId1 = '21e5ac20-4d87-4458-9cb5-';
    const contentsId2 = 'non-existent-id';
    const fileUUID1 = 'f654a669-094f-43cc-9b6a-a819cfeee74c';
    const fileAttributes1: FileAttributes = {
      id: 1,
      uuid: fileUUID1,
      contentsId: contentsId1,
      folderId: 234,
      createdAt: '10-03-2025',
      modificationTime: '10-03-2025',
      path: '/valid/path/to/file.txt',
      size: 1234,
      updatedAt: '10-03-2025',
      status: FileStatuses.EXISTS,
    };

    const file1 = File.from(fileAttributes1);

    await sut.upsert(file1);

    const result = await sut.searchByArrayOfContentsId([contentsId1, contentsId2]);

    expect(result).toHaveLength(1);
    expect(result[0].uuid).toBe(fileUUID1);
  });

  describe('searchByPathPrefix', () => {
    it('should return files that start with the given path prefix', () => {
      const fileAttributes1: FileAttributes = {
        id: 1,
        uuid: '550e8400-e29b-41d4-a716-446655440001',
        contentsId: '21e5ac20-4d87-4458-9cb5-',
        folderId: 100,
        createdAt: '10-03-2025',
        modificationTime: '10-03-2025',
        path: '/documents/work/report.txt',
        size: 1000,
        updatedAt: '10-03-2025',
        status: FileStatuses.EXISTS,
      };

      const fileAttributes2: FileAttributes = {
        id: 2,
        uuid: '550e8400-e29b-41d4-a716-446655440002',
        contentsId: 'e3103fa4-cb14-426f-9be2-',
        folderId: 101,
        createdAt: '10-03-2025',
        modificationTime: '10-03-2025',
        path: '/documents/personal/notes.txt',
        size: 2000,
        updatedAt: '10-03-2025',
        status: FileStatuses.EXISTS,
      };

      const fileAttributes3: FileAttributes = {
        id: 3,
        uuid: '550e8400-e29b-41d4-a716-446655440003',
        contentsId: 'a1b2c3d4-e5f6-7890-1234-',
        folderId: 102,
        createdAt: '10-03-2025',
        modificationTime: '10-03-2025',
        path: '/images/photo.jpg',
        size: 3000,
        updatedAt: '10-03-2025',
        status: FileStatuses.EXISTS,
      };

      sut.upsert(File.from(fileAttributes1));
      sut.upsert(File.from(fileAttributes2));
      sut.upsert(File.from(fileAttributes3));

      const result = sut.searchByPathPrefix('/documents');

      expect(result).toHaveLength(2);
      expect(result.map((f) => f.uuid)).toContain('550e8400-e29b-41d4-a716-446655440001');
      expect(result.map((f) => f.uuid)).toContain('550e8400-e29b-41d4-a716-446655440002');
      expect(result.map((f) => f.uuid)).not.toContain('550e8400-e29b-41d4-a716-446655440003');
    });

    it('should return an empty array when no files match the prefix', () => {
      const fileAttributes: FileAttributes = {
        id: 1,
        uuid: '550e8400-e29b-41d4-a716-446655440001',
        contentsId: '21e5ac20-4d87-4458-9cb5-',
        folderId: 100,
        createdAt: '10-03-2025',
        modificationTime: '10-03-2025',
        path: '/documents/file.txt',
        size: 1000,
        updatedAt: '10-03-2025',
        status: FileStatuses.EXISTS,
      };

      sut.upsert(File.from(fileAttributes));

      const result = sut.searchByPathPrefix('/images');

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it('should filter by status when provided', () => {
      const fileAttributes1: FileAttributes = {
        id: 1,
        uuid: '550e8400-e29b-41d4-a716-446655440001',
        contentsId: '21e5ac20-4d87-4458-9cb5-',
        folderId: 100,
        createdAt: '10-03-2025',
        modificationTime: '10-03-2025',
        path: '/documents/file1.txt',
        size: 1000,
        updatedAt: '10-03-2025',
        status: FileStatuses.EXISTS,
      };

      const fileAttributes2: FileAttributes = {
        id: 2,
        uuid: '550e8400-e29b-41d4-a716-446655440002',
        contentsId: 'e3103fa4-cb14-426f-9be2-',
        folderId: 101,
        createdAt: '10-03-2025',
        modificationTime: '10-03-2025',
        path: '/documents/file2.txt',
        size: 2000,
        updatedAt: '10-03-2025',
        status: FileStatuses.TRASHED,
      };

      const fileAttributes3: FileAttributes = {
        id: 3,
        uuid: '550e8400-e29b-41d4-a716-446655440003',
        contentsId: 'a1b2c3d4-e5f6-7890-1234-',
        folderId: 102,
        createdAt: '10-03-2025',
        modificationTime: '10-03-2025',
        path: '/documents/file3.txt',
        size: 3000,
        updatedAt: '10-03-2025',
        status: FileStatuses.EXISTS,
      };

      sut.upsert(File.from(fileAttributes1));
      sut.upsert(File.from(fileAttributes2));
      sut.upsert(File.from(fileAttributes3));

      const result = sut.searchByPathPrefix('/documents', FileStatuses.EXISTS);

      expect(result).toHaveLength(2);
      expect(result.map((f) => f.uuid)).toContain('550e8400-e29b-41d4-a716-446655440001');
      expect(result.map((f) => f.uuid)).toContain('550e8400-e29b-41d4-a716-446655440003');
      expect(result.map((f) => f.uuid)).not.toContain('550e8400-e29b-41d4-a716-446655440002');
      expect(result.every((f) => f.status.is(FileStatuses.EXISTS))).toBe(true);
    });

    it('should return all matching files when no status filter is provided', () => {
      const fileAttributes1: FileAttributes = {
        id: 1,
        uuid: '550e8400-e29b-41d4-a716-446655440001',
        contentsId: '21e5ac20-4d87-4458-9cb5-',
        folderId: 100,
        createdAt: '10-03-2025',
        modificationTime: '10-03-2025',
        path: '/documents/file1.txt',
        size: 1000,
        updatedAt: '10-03-2025',
        status: FileStatuses.EXISTS,
      };

      const fileAttributes2: FileAttributes = {
        id: 2,
        uuid: '550e8400-e29b-41d4-a716-446655440002',
        contentsId: 'e3103fa4-cb14-426f-9be2-',
        folderId: 101,
        createdAt: '10-03-2025',
        modificationTime: '10-03-2025',
        path: '/documents/file2.txt',
        size: 2000,
        updatedAt: '10-03-2025',
        status: FileStatuses.TRASHED,
      };

      const fileAttributes3: FileAttributes = {
        id: 3,
        uuid: '550e8400-e29b-41d4-a716-446655440003',
        contentsId: 'a1b2c3d4-e5f6-7890-1234-',
        folderId: 102,
        createdAt: '10-03-2025',
        modificationTime: '10-03-2025',
        path: '/documents/file3.txt',
        size: 3000,
        updatedAt: '10-03-2025',
        status: FileStatuses.DELETED,
      };

      sut.upsert(File.from(fileAttributes1));
      sut.upsert(File.from(fileAttributes2));
      sut.upsert(File.from(fileAttributes3));

      const result = sut.searchByPathPrefix('/documents');

      expect(result).toHaveLength(3);
      expect(result.map((f) => f.uuid)).toContain('550e8400-e29b-41d4-a716-446655440001');
      expect(result.map((f) => f.uuid)).toContain('550e8400-e29b-41d4-a716-446655440002');
      expect(result.map((f) => f.uuid)).toContain('550e8400-e29b-41d4-a716-446655440003');
    });

    it('should not match files that contain the prefix but do not start with it', () => {
      const fileAttributes1: FileAttributes = {
        id: 1,
        uuid: '550e8400-e29b-41d4-a716-446655440001',
        contentsId: '21e5ac20-4d87-4458-9cb5-',
        folderId: 100,
        createdAt: '10-03-2025',
        modificationTime: '10-03-2025',
        path: '/documents/work/file.txt',
        size: 1000,
        updatedAt: '10-03-2025',
        status: FileStatuses.EXISTS,
      };

      const fileAttributes2: FileAttributes = {
        id: 2,
        uuid: '550e8400-e29b-41d4-a716-446655440002',
        contentsId: 'e3103fa4-cb14-426f-9be2-',
        folderId: 101,
        createdAt: '10-03-2025',
        modificationTime: '10-03-2025',
        path: '/backup/documents/file.txt',
        size: 2000,
        updatedAt: '10-03-2025',
        status: FileStatuses.EXISTS,
      };

      sut.upsert(File.from(fileAttributes1));
      sut.upsert(File.from(fileAttributes2));

      const result = sut.searchByPathPrefix('/documents');

      expect(result).toHaveLength(1);
      expect(result[0].uuid).toBe('550e8400-e29b-41d4-a716-446655440001');
      expect(result.map((f) => f.uuid)).not.toContain('550e8400-e29b-41d4-a716-446655440002');
    });

    it('should return an empty array when repository is empty', () => {
      const result = sut.searchByPathPrefix('/any/path');

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it('should handle exact path matches', () => {
      const fileAttributes: FileAttributes = {
        id: 1,
        uuid: '550e8400-e29b-41d4-a716-446655440001',
        contentsId: '21e5ac20-4d87-4458-9cb5-',
        folderId: 100,
        createdAt: '10-03-2025',
        modificationTime: '10-03-2025',
        path: '/documents/file.txt',
        size: 1000,
        updatedAt: '10-03-2025',
        status: FileStatuses.EXISTS,
      };

      sut.upsert(File.from(fileAttributes));

      const result = sut.searchByPathPrefix('/documents/file.txt');

      expect(result).toHaveLength(1);
      expect(result[0].uuid).toBe('550e8400-e29b-41d4-a716-446655440001');
    });

    it('should work with nested paths', () => {
      const fileAttributes1: FileAttributes = {
        id: 1,
        uuid: '550e8400-e29b-41d4-a716-446655440001',
        contentsId: '21e5ac20-4d87-4458-9cb5-',
        folderId: 100,
        createdAt: '10-03-2025',
        modificationTime: '10-03-2025',
        path: '/a/b/c/file1.txt',
        size: 1000,
        updatedAt: '10-03-2025',
        status: FileStatuses.EXISTS,
      };

      const fileAttributes2: FileAttributes = {
        id: 2,
        uuid: '550e8400-e29b-41d4-a716-446655440002',
        contentsId: 'e3103fa4-cb14-426f-9be2-',
        folderId: 101,
        createdAt: '10-03-2025',
        modificationTime: '10-03-2025',
        path: '/a/b/d/file2.txt',
        size: 2000,
        updatedAt: '10-03-2025',
        status: FileStatuses.EXISTS,
      };

      const fileAttributes3: FileAttributes = {
        id: 3,
        uuid: '550e8400-e29b-41d4-a716-446655440003',
        contentsId: 'a1b2c3d4-e5f6-7890-1234-',
        folderId: 102,
        createdAt: '10-03-2025',
        modificationTime: '10-03-2025',
        path: '/a/b/c/d/file3.txt',
        size: 3000,
        updatedAt: '10-03-2025',
        status: FileStatuses.EXISTS,
      };

      sut.upsert(File.from(fileAttributes1));
      sut.upsert(File.from(fileAttributes2));
      sut.upsert(File.from(fileAttributes3));

      const result = sut.searchByPathPrefix('/a/b/c');

      expect(result).toHaveLength(2);
      expect(result.map((f) => f.uuid)).toContain('550e8400-e29b-41d4-a716-446655440001');
      expect(result.map((f) => f.uuid)).toContain('550e8400-e29b-41d4-a716-446655440003');
      expect(result.map((f) => f.uuid)).not.toContain('550e8400-e29b-41d4-a716-446655440002');
    });
  });
});
