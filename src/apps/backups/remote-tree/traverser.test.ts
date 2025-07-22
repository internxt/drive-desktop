import { deepMocked, getMockCalls, mockProps } from 'tests/vitest/utils.helper.test';
import { Traverser } from './traverser';
import { fetchItems } from '../fetch-items/fetch-items';
import { v4 } from 'uuid';
import { loggerMock } from 'tests/vitest/mocks.helper.test';

vi.mock(import('../fetch-items/fetch-items'));
vi.mock(import('@/apps/main/util'));

describe('traverser', () => {
  const fetchItemsMock = deepMocked(fetchItems);

  const folder = v4();

  const folder1 = v4();
  const folder2 = v4();
  const folder3 = v4();

  beforeEach(() => {
    fetchItemsMock.mockResolvedValue({
      files: [
        { uuid: v4(), plainName: 'file1', folderUuid: folder, folderId: 0, fileId: '012345678901234567890123', status: 'EXISTS' },
        { uuid: v4(), plainName: 'file2', folderUuid: folder, folderId: 0, fileId: '012345678901234567890123', status: 'EXISTS' },
        { uuid: v4(), plainName: 'file3', folderUuid: folder1, folderId: 0, fileId: '012345678901234567890123', status: 'EXISTS' },
        { uuid: v4(), plainName: 'file4', folderUuid: folder3, folderId: 0, fileId: '012345678901234567890123', status: 'EXISTS' },
      ],
      folders: [
        { id: 1, uuid: folder1, plainName: 'folder1', parentUuid: folder, status: 'EXISTS' },
        { id: 1, uuid: folder2, plainName: 'folder2', parentUuid: folder, status: 'EXISTS' },
        { id: 1, uuid: folder3, plainName: 'folder3', parentUuid: folder1, status: 'EXISTS' },
      ],
    });
  });

  const traverser = new Traverser();
  const props = mockProps<typeof traverser.run>({
    context: {
      abortController: { signal: { aborted: false } },
      folderId: 1,
      folderUuid: folder,
    },
  });

  it('If signal is aborted then do not traverse', async () => {
    // Given
    const props = mockProps<typeof traverser.run>({
      context: {
        abortController: { signal: { aborted: true } },
        folderId: 1,
        folderUuid: folder,
      },
    });

    // When
    const res = await traverser.run(props);

    // Then
    expect(Object.keys(res.folders)).toStrictEqual(['/']);
    expect(Object.keys(res.files)).toStrictEqual([]);
  });

  it('It should add files and folders', async () => {
    // When
    const res = await traverser.run(props);

    // Then
    expect(Object.keys(res.folders)).toStrictEqual(['/', '/folder1', '/folder1/folder3', '/folder2']);
    expect(Object.keys(res.files)).toStrictEqual(['/file1', '/file2', '/folder1/file3', '/folder1/folder3/file4']);
  });

  it('If an file is invalid ignore it and continue', async () => {
    // Given
    fetchItemsMock.mockResolvedValueOnce({
      files: [{ uuid: v4(), folderUuid: folder, plainName: 'file' }],
      folders: [],
    });

    // When
    const res = await traverser.run(props);

    // Then
    expect(Object.keys(res.folders)).toStrictEqual(['/']);
    expect(Object.keys(res.files)).toStrictEqual([]);
    expect(getMockCalls(loggerMock.error)).toStrictEqual([
      {
        tag: 'BACKUPS',
        msg: 'Error adding file to tree',
        exc: expect.any(Error),
      },
    ]);
  });

  it('If an folder is invalid ignore it and continue', async () => {
    // Given
    fetchItemsMock.mockResolvedValueOnce({
      files: [],
      folders: [{ uuid: v4(), parentUuid: folder, plainName: 'folder' }],
    });

    // When
    const res = await traverser.run(props);

    // Then
    expect(Object.keys(res.folders)).toStrictEqual(['/']);
    expect(Object.keys(res.files)).toStrictEqual([]);
    expect(getMockCalls(loggerMock.error)).toStrictEqual([
      {
        tag: 'BACKUPS',
        msg: 'Error adding folder to tree',
        exc: expect.any(Error),
      },
    ]);
  });
});
