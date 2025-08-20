import { v4 } from 'uuid';
import { Traverser } from './Traverser';
import * as crypt from '@/context/shared/infrastructure/crypt';
import { deepMocked } from 'tests/vitest/utils.helper.test';
import { getAllItems } from './RemoteItemsGenerator';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ExtendedDriveFolder, FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';

vi.mock(import('@/context/shared/infrastructure/crypt'));
vi.mock(import('./RemoteItemsGenerator'));

describe('Traverser', () => {
  const cryptMock = vi.mocked(crypt);
  const getAllItemsMock = deepMocked(getAllItems);

  const rootPath = 'C:/Users/user/InternxtDrive' as AbsolutePath;
  const rootUuid = v4() as FolderUuid;
  const SUT = new Traverser(rootPath, rootUuid);

  beforeAll(() => {
    cryptMock.decryptName.mockImplementation(({ encryptedName }) => encryptedName);
  });

  function extractPaths(items: ExtendedDriveFile[] | ExtendedDriveFolder[]) {
    return items.map((item) => item.path);
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

    const tree = await SUT.run();

    expect(extractPaths(tree.files)).toStrictEqual(['/file.txt']);
    expect(extractPaths(tree.folders)).toStrictEqual(['/']);
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

    const tree = await SUT.run();

    expect(extractPaths(tree.files)).toStrictEqual(['/folder/file.txt']);
    expect(extractPaths(tree.folders)).toStrictEqual(['/', '/folder']);
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

    const tree = await SUT.run();

    expect(extractPaths(tree.files)).toStrictEqual([]);
    expect(extractPaths(tree.folders)).toStrictEqual(['/', '/folder1', '/folder1/folder2']);
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

    const tree = await SUT.run();

    expect(extractPaths(tree.files)).toStrictEqual(['/file1.txt']);
    expect(extractPaths(tree.folders)).toStrictEqual(['/', '/folder1']);
    expect(extractPaths(tree.trashedFiles)).toStrictEqual(['/file2.txt']);
    expect(extractPaths(tree.trashedFolders)).toStrictEqual(['/folder2']);
  });
});
