import { mockProps, partialSpyOn } from 'tests/vitest/utils.helper.test';
import { Traverser } from './traverser';
import * as fetchItems from '../fetch-items/fetch-items';
import { v4 } from 'uuid';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

vi.mock(import('../fetch-items/fetch-items'));
vi.mock(import('@/apps/main/util'));

describe('traverser', () => {
  const fetchItemsMock = partialSpyOn(fetchItems, 'fetchItems');

  const folder = v4() as FolderUuid;

  const folder1 = v4() as FolderUuid;
  const folder2 = v4() as FolderUuid;
  const folder3 = v4() as FolderUuid;

  beforeEach(() => {
    fetchItemsMock.mockResolvedValue({
      files: [
        { nameWithExtension: 'file1', parentUuid: folder },
        { nameWithExtension: 'file2', parentUuid: folder },
        { nameWithExtension: 'file3', parentUuid: folder1 },
        { nameWithExtension: 'file4', parentUuid: folder3 },
      ],
      folders: [
        { uuid: folder1, name: 'folder1', parentUuid: folder },
        { uuid: folder2, name: 'folder2', parentUuid: folder },
        { uuid: folder3, name: 'folder3', parentUuid: folder1 },
      ],
    });
  });

  const traverser = new Traverser();
  const props = mockProps<typeof traverser.run>({
    context: {
      abortController: { signal: { aborted: false } },
      folderId: 1,
      folderUuid: folder,
      pathname: 'C:/Users/user/Backup',
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
});
