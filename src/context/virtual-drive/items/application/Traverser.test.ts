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
          nameWithExtension: 'file A',
          parentUuid: rootUuid,
          size: 67,
          status: 'EXISTS',
        },
      ],
      folders: [],
    });

    const tree = await SUT.run();

    expect(extractPaths(tree.files)).toStrictEqual(['/file A']);
    expect(extractPaths(tree.folders)).toStrictEqual(['/']);
  });

  it('second level files starts with /', async () => {
    getAllItemsMock.mockResolvedValue({
      files: [
        {
          nameWithExtension: 'file A',
          parentUuid: '87c76c58-717d-5fee-ab8d-0ab4b94bb708',
          size: 200,
          status: 'EXISTS',
        },
      ],
      folders: [
        {
          parentUuid: rootUuid,
          name: 'folder A',
          status: 'EXISTS',
          uuid: '87c76c58-717d-5fee-ab8d-0ab4b94bb708' as FolderUuid,
        },
      ],
    });

    const tree = await SUT.run();

    expect(extractPaths(tree.files)).toStrictEqual(['/folder A/file A']);
    expect(extractPaths(tree.folders)).toStrictEqual(['/', '/folder A']);
  });

  it('first level folder starts with /', async () => {
    getAllItemsMock.mockResolvedValue({
      files: [],
      folders: [
        {
          parentUuid: rootUuid,
          name: 'folder A',
          status: 'EXISTS',
          uuid: '35d8c70c-36eb-5761-8340-cf632a86334b' as FolderUuid,
        },
      ],
    });

    const tree = await SUT.run();

    expect(extractPaths(tree.folders)).toStrictEqual(['/', '/folder A']);
  });

  it('second level folder starts with /', async () => {
    getAllItemsMock.mockResolvedValue({
      files: [],
      folders: [
        {
          parentUuid: rootUuid,
          name: 'folder A',
          status: 'EXISTS',
          uuid: 'fc790269-92ac-5990-b9e0-a08d6552bf0b' as FolderUuid,
        },
        {
          parentUuid: 'fc790269-92ac-5990-b9e0-a08d6552bf0b',
          name: 'folder B',
          status: 'EXISTS',
          uuid: '56fdacd4-384e-558c-9442-bb032f4b9123' as FolderUuid,
        },
      ],
    });

    const tree = await SUT.run();

    expect(extractPaths(tree.folders)).toStrictEqual(['/', '/folder A', '/folder A/folder B']);
  });

  it('root folder should exist', async () => {
    getAllItemsMock.mockResolvedValue({
      files: [],
      folders: [
        {
          parentUuid: rootUuid,
          name: 'folder A',
          status: 'EXISTS',
          uuid: '6a17069e-5473-5101-b3ab-66f710043f3e' as FolderUuid,
        },
        {
          parentUuid: '6a17069e-5473-5101-b3ab-66f710043f3e',
          name: 'folder B',
          status: 'EXISTS',
          uuid: 'd600cb02-ad9c-570f-8977-eb87b7e95ef5' as FolderUuid,
        },
      ],
    });

    const tree = await SUT.run();

    expect(extractPaths(tree.folders)).toStrictEqual(['/', '/folder A', '/folder A/folder B']);
  });

  it('when a file data is invalid ignore it and continue', async () => {
    getAllItemsMock.mockResolvedValue({
      files: [
        {
          nameWithExtension: 'invalid file',
          parentUuid: rootUuid,
          size: 67,
          status: 'EXISTS',
        },
        {
          nameWithExtension: 'valid_name',
          parentUuid: rootUuid,
          size: 67,
          status: 'EXISTS',
        },
        {
          nameWithExtension: 'valid_name_2',
          parentUuid: rootUuid,
          size: 67,
          status: 'EXISTS',
        },
      ],
      folders: [],
    });

    const tree = await SUT.run();

    expect(extractPaths(tree.files)).toStrictEqual(['/invalid file', '/valid_name', '/valid_name_2']);
  });

  it('when a folder data is invalid ignore it and continue', async () => {
    getAllItemsMock.mockResolvedValue({
      files: [],
      folders: [
        {
          parentUuid: rootUuid,
          name: 'folder A',
          status: 'EXISTS',
        },
      ],
    });

    const tree = await SUT.run();

    expect(extractPaths(tree.files)).toStrictEqual([]);
    expect(extractPaths(tree.folders)).toStrictEqual(['/', '/folder A']);
  });

  it('filters the files and folders depending on the filters set', async () => {
    getAllItemsMock.mockResolvedValue({
      files: [
        {
          nameWithExtension: 'file A',
          parentUuid: rootUuid,
          size: 67,
          status: 'EXISTS',
        },
      ],
      folders: [
        {
          parentUuid: rootUuid,
          name: 'folder A',
          status: 'TRASHED',
          uuid: 'fc790269-92ac-5990-b9e0-a08d6552bf0b' as FolderUuid,
        },
      ],
    });

    const tree = await SUT.run();

    expect(extractPaths(tree.files)).toStrictEqual(['/file A']);
    expect(extractPaths(tree.folders)).toStrictEqual(['/']);
  });

  it('filters the files and folders depending on the filters set', async () => {
    getAllItemsMock.mockResolvedValue({
      files: [
        {
          nameWithExtension: 'file A.png',
          parentUuid: rootUuid,
          size: 67,
          status: 'EXISTS',
        },
        {
          nameWithExtension: 'file B.png',
          parentUuid: rootUuid,
          size: 67,
          status: 'TRASHED',
        },
      ],
      folders: [
        {
          parentUuid: rootUuid,
          name: 'folder A',
          status: 'TRASHED',
          uuid: 'fc790269-92ac-5990-b9e0-a08d6552bf0b' as FolderUuid,
        },
      ],
    });

    const tree = await SUT.run();

    expect(extractPaths(tree.files)).toStrictEqual(['/file A.png']);
    expect(extractPaths(tree.folders)).toStrictEqual(['/']);
  });
});
