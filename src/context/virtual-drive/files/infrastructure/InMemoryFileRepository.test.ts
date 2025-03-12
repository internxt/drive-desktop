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
});
