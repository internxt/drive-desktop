import { v4 } from 'uuid';
import { Traverser } from './Traverser';
import * as crypt from '@/context/shared/infrastructure/crypt';
import { deepMocked, mockProps } from 'tests/vitest/utils.helper.test';
import { getAllItems } from './RemoteItemsGenerator';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ExtendedDriveFolder, FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';

vi.mock(import('@/context/shared/infrastructure/crypt'));
vi.mock(import('./RemoteItemsGenerator'));

describe('Traverser', () => {
  const cryptMock = vi.mocked(crypt);
  const getAllItemsMock = deepMocked(getAllItems);

  const rootPath = abs('/drive');
  const rootUuid = v4() as FolderUuid;
  const props = mockProps<typeof Traverser.run>({ ctx: { rootPath, rootUuid } });

  beforeAll(() => {
    cryptMock.decryptName.mockImplementation(({ encryptedName }) => encryptedName);
  });

  function extractPaths(items: ExtendedDriveFile[] | ExtendedDriveFolder[]) {
    return items.map((item) => item.absolutePath);
  }

  it('first level files starts with /', async () => {
    getAllItemsMock.mockResolvedValue({
      files: [
        {
          nameWithExtension: 'file.txt',
          parentUuid: rootUuid,
          status: 'EXISTS',
        },
      ],
      folders: [],
    });

    const tree = await Traverser.run(props);

    expect(extractPaths(tree.files)).toStrictEqual(['/drive/file.txt']);
    expect(extractPaths(tree.folders)).toStrictEqual([]);
  });

  it('second level files starts with /', async () => {
    const parentUuid = v4() as FolderUuid;
    getAllItemsMock.mockResolvedValue({
      files: [
        {
          nameWithExtension: 'file.txt',
          parentUuid,
          status: 'EXISTS',
        },
      ],
      folders: [
        {
          name: 'folder',
          parentUuid: rootUuid,
          status: 'EXISTS',
          uuid: parentUuid,
        },
      ],
    });

    const tree = await Traverser.run(props);

    expect(extractPaths(tree.files)).toStrictEqual(['/drive/folder/file.txt']);
    expect(extractPaths(tree.folders)).toStrictEqual(['/drive/folder']);
  });

  it('second level folder starts with /', async () => {
    const parentUuid = v4() as FolderUuid;
    getAllItemsMock.mockResolvedValue({
      files: [],
      folders: [
        {
          uuid: parentUuid,
          parentUuid: rootUuid,
          name: 'folder1',
          status: 'EXISTS',
        },
        {
          parentUuid,
          name: 'folder2',
          status: 'EXISTS',
        },
      ],
    });

    const tree = await Traverser.run(props);

    expect(extractPaths(tree.files)).toStrictEqual([]);
    expect(extractPaths(tree.folders)).toStrictEqual(['/drive/folder1', '/drive/folder1/folder2']);
  });

  it('filters the files and folders depending on the filters set', async () => {
    getAllItemsMock.mockResolvedValue({
      files: [
        {
          nameWithExtension: 'file1.txt',
          parentUuid: rootUuid,
          status: 'EXISTS',
        },
        {
          nameWithExtension: 'file2.txt',
          parentUuid: rootUuid,
          status: 'TRASHED',
        },
      ],
      folders: [
        {
          parentUuid: rootUuid,
          name: 'folder1',
          status: 'EXISTS',
        },
        {
          parentUuid: rootUuid,
          name: 'folder2',
          status: 'TRASHED',
        },
      ],
    });

    const tree = await Traverser.run(props);

    expect(extractPaths(tree.files)).toStrictEqual(['/drive/file1.txt']);
    expect(extractPaths(tree.folders)).toStrictEqual(['/drive/folder1']);
    expect(extractPaths(tree.trashedFiles)).toStrictEqual(['/drive/file2.txt']);
    expect(extractPaths(tree.trashedFolders)).toStrictEqual(['/drive/folder2']);
  });
});
