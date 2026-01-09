import { InMemoryFolderRepository } from './InMemoryFolderRepository';
import { FolderAttributes, Folder } from '../domain/Folder';
import { FolderStatuses } from '../domain/FolderStatus';

describe('InMemoryFolderRepository', () => {
  let sut: InMemoryFolderRepository;

  beforeEach(() => {
    sut = new InMemoryFolderRepository();
  });

  const createFolderAttributes = (overrides: Partial<FolderAttributes> = {}): FolderAttributes => ({
    id: 1,
    uuid: '550e8400-e29b-41d4-a716-446655440000',
    parentId: null,
    path: '/documents',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    status: FolderStatuses.EXISTS,
    ...overrides,
  });

  describe('searchByPathPrefix', () => {
    it('should return folders that start with the given path prefix', async () => {
      const folderAttributes1 = createFolderAttributes({
        id: 1,
        uuid: '550e8400-e29b-41d4-a716-446655440001',
        path: '/documents/work',
      });

      const folderAttributes2 = createFolderAttributes({
        id: 2,
        uuid: '550e8400-e29b-41d4-a716-446655440002',
        path: '/documents/personal',
      });

      const folderAttributes3 = createFolderAttributes({
        id: 3,
        uuid: '550e8400-e29b-41d4-a716-446655440003',
        path: '/images',
      });

      await sut.add(Folder.from(folderAttributes1));
      await sut.add(Folder.from(folderAttributes2));
      await sut.add(Folder.from(folderAttributes3));

      const result = sut.searchByPathPrefix('/documents');

      expect(result).toHaveLength(2);
      expect(result.map((f) => f.uuid)).toContain('550e8400-e29b-41d4-a716-446655440001');
      expect(result.map((f) => f.uuid)).toContain('550e8400-e29b-41d4-a716-446655440002');
      expect(result.map((f) => f.uuid)).not.toContain('550e8400-e29b-41d4-a716-446655440003');
    });

    it('should return an empty array when no folders match the prefix', async () => {
      const folderAttributes = createFolderAttributes({
        path: '/documents',
      });

      await sut.add(Folder.from(folderAttributes));

      const result = sut.searchByPathPrefix('/images');

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it('should filter by status when provided', async () => {
      const folderAttributes1 = createFolderAttributes({
        id: 1,
        uuid: '550e8400-e29b-41d4-a716-446655440001',
        path: '/documents/folder1',
        status: FolderStatuses.EXISTS,
      });

      const folderAttributes2 = createFolderAttributes({
        id: 2,
        uuid: '550e8400-e29b-41d4-a716-446655440002',
        path: '/documents/folder2',
        status: FolderStatuses.TRASHED,
      });

      const folderAttributes3 = createFolderAttributes({
        id: 3,
        uuid: '550e8400-e29b-41d4-a716-446655440003',
        path: '/documents/folder3',
        status: FolderStatuses.EXISTS,
      });

      await sut.add(Folder.from(folderAttributes1));
      await sut.add(Folder.from(folderAttributes2));
      await sut.add(Folder.from(folderAttributes3));

      const result = sut.searchByPathPrefix('/documents', FolderStatuses.EXISTS);

      expect(result).toHaveLength(2);
      expect(result.map((f) => f.uuid)).toContain('550e8400-e29b-41d4-a716-446655440001');
      expect(result.map((f) => f.uuid)).toContain('550e8400-e29b-41d4-a716-446655440003');
      expect(result.map((f) => f.uuid)).not.toContain('550e8400-e29b-41d4-a716-446655440002');
      expect(result.every((f) => f.status === FolderStatuses.EXISTS)).toBe(true);
    });

    it('should return all matching folders when no status filter is provided', async () => {
      const folderAttributes1 = createFolderAttributes({
        id: 1,
        uuid: '550e8400-e29b-41d4-a716-446655440001',
        path: '/documents/folder1',
        status: FolderStatuses.EXISTS,
      });

      const folderAttributes2 = createFolderAttributes({
        id: 2,
        uuid: '550e8400-e29b-41d4-a716-446655440002',
        path: '/documents/folder2',
        status: FolderStatuses.TRASHED,
      });

      const folderAttributes3 = createFolderAttributes({
        id: 3,
        uuid: '550e8400-e29b-41d4-a716-446655440003',
        path: '/documents/folder3',
        status: FolderStatuses.DELETED,
      });

      await sut.add(Folder.from(folderAttributes1));
      await sut.add(Folder.from(folderAttributes2));
      await sut.add(Folder.from(folderAttributes3));

      const result = sut.searchByPathPrefix('/documents');

      expect(result).toHaveLength(3);
      expect(result.map((f) => f.uuid)).toContain('550e8400-e29b-41d4-a716-446655440001');
      expect(result.map((f) => f.uuid)).toContain('550e8400-e29b-41d4-a716-446655440002');
      expect(result.map((f) => f.uuid)).toContain('550e8400-e29b-41d4-a716-446655440003');
    });

    it('should not match folders that contain the prefix but do not start with it', async () => {
      const folderAttributes1 = createFolderAttributes({
        id: 1,
        uuid: '550e8400-e29b-41d4-a716-446655440001',
        path: '/documents/work',
      });

      const folderAttributes2 = createFolderAttributes({
        id: 2,
        uuid: '550e8400-e29b-41d4-a716-446655440002',
        path: '/backup/documents',
      });

      await sut.add(Folder.from(folderAttributes1));
      await sut.add(Folder.from(folderAttributes2));

      const result = sut.searchByPathPrefix('/documents');

      expect(result).toHaveLength(1);
      expect(result[0].uuid).toBe('550e8400-e29b-41d4-a716-446655440001');
      expect(result.map((f) => f.uuid)).not.toContain('550e8400-e29b-41d4-a716-446655440002');
    });

    it('should return multiple folders at different nesting levels', async () => {
      const folderAttributes1 = createFolderAttributes({
        id: 1,
        uuid: '550e8400-e29b-41d4-a716-446655440001',
        path: '/documents',
      });

      const folderAttributes2 = createFolderAttributes({
        id: 2,
        uuid: '550e8400-e29b-41d4-a716-446655440002',
        path: '/documents/work',
      });

      const folderAttributes3 = createFolderAttributes({
        id: 3,
        uuid: '550e8400-e29b-41d4-a716-446655440003',
        path: '/documents/work/projects',
      });

      await sut.add(Folder.from(folderAttributes1));
      await sut.add(Folder.from(folderAttributes2));
      await sut.add(Folder.from(folderAttributes3));

      const result = sut.searchByPathPrefix('/documents');

      expect(result).toHaveLength(3);
      expect(result.map((f) => f.path)).toContain('/documents');
      expect(result.map((f) => f.path)).toContain('/documents/work');
      expect(result.map((f) => f.path)).toContain('/documents/work/projects');
    });
  });
});
