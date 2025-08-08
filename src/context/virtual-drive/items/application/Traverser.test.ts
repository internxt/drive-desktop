import { v4 } from 'uuid';
import { ContentsIdMother } from 'tests/context/virtual-drive/contents/domain/ContentsIdMother';
import { Traverser } from './Traverser';
import * as crypt from '@/context/shared/infrastructure/crypt';
import { File } from '../../files/domain/File';
import { Folder } from '../../folders/domain/Folder';
import { deepMocked } from 'tests/vitest/utils.helper.test';
import { getAllItems } from './remote-items-generator';

vi.mock(import('@/context/shared/infrastructure/crypt'));
vi.mock(import('./remote-items-generator'));

describe('Traverser', () => {
  const cryptMock = vi.mocked(crypt);
  const getAllItemsMock = deepMocked(getAllItems);

  const baseFolderId = 6;
  const baseFolderUuid = v4();
  const SUT = new Traverser(baseFolderId, baseFolderUuid);

  beforeAll(() => {
    cryptMock.decryptName.mockImplementation(({ encryptedName }) => encryptedName);
  });

  function extractPaths(items: File[] | Folder[]) {
    return items.map((item) => item.path);
  }

  it('first level files starts with /', async () => {
    getAllItemsMock.mockResolvedValue({
      files: [
        {
          name: 'file A',
          fileId: ContentsIdMother.raw(),
          folderId: baseFolderId,
          folderUuid: baseFolderUuid,
          uuid: v4(),
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
          name: 'file A',
          fileId: ContentsIdMother.raw(),
          folderId: 22491,
          folderUuid: '87c76c58-717d-5fee-ab8d-0ab4b94bb708',
          uuid: v4(),
          size: 200,
          status: 'EXISTS',
        },
      ],
      folders: [
        {
          id: 22491,
          parentId: baseFolderId,
          parentUuid: baseFolderUuid,
          plainName: 'folder A',
          status: 'EXISTS',
          uuid: '87c76c58-717d-5fee-ab8d-0ab4b94bb708',
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
          id: 22491,
          parentId: baseFolderId,
          parentUuid: baseFolderUuid,
          plainName: 'folder A',
          status: 'EXISTS',
          uuid: '35d8c70c-36eb-5761-8340-cf632a86334b',
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
          id: 22491,
          parentId: baseFolderId,
          parentUuid: baseFolderUuid,
          plainName: 'folder A',
          status: 'EXISTS',
          uuid: 'fc790269-92ac-5990-b9e0-a08d6552bf0b',
        },
        {
          id: 89181879209463,
          parentId: 22491,
          parentUuid: 'fc790269-92ac-5990-b9e0-a08d6552bf0b',
          plainName: 'folder B',
          status: 'EXISTS',
          uuid: '56fdacd4-384e-558c-9442-bb032f4b9123',
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
          id: 22491,
          parentId: baseFolderId,
          parentUuid: baseFolderUuid,
          plainName: 'folder A',
          status: 'EXISTS',
          uuid: '6a17069e-5473-5101-b3ab-66f710043f3e',
        },
        {
          id: 89181879209463,
          parentId: 22491,
          parentUuid: '6a17069e-5473-5101-b3ab-66f710043f3e',
          plainName: 'folder B',
          status: 'EXISTS',
          uuid: 'd600cb02-ad9c-570f-8977-eb87b7e95ef5',
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
          name: 'invalid file',
          uuid: v4(),
          folderUuid: baseFolderUuid,
          fileId: 'Some response',
          folderId: baseFolderId,
          size: 67,
          status: 'EXISTS',
        },
        {
          name: 'valid_name',
          uuid: v4(),
          folderUuid: baseFolderUuid,
          fileId: ContentsIdMother.raw(),
          folderId: baseFolderId,
          size: 67,
          status: 'EXISTS',
        },
        {
          name: 'valid_name_2',
          uuid: v4(),
          folderUuid: baseFolderUuid,
          fileId: ContentsIdMother.raw(),
          size: 67,
        },
      ],
      folders: [],
    });

    const tree = await SUT.run();

    expect(extractPaths(tree.files)).toStrictEqual(['/valid_name']);
  });

  it('when a folder data is invalid ignore it and continue', async () => {
    getAllItemsMock.mockResolvedValue({
      files: [],
      folders: [
        {
          id: 22491,
          parentId: baseFolderId,
          parentUuid: baseFolderUuid,
          plainName: 'folder A',
          status: 'EXISTS',
          uuid: 'fc790269-92ac-5990-b9e0-a08d6552bf0b',
        },
        {},
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
          name: 'file A',
          fileId: ContentsIdMother.raw(),
          folderId: baseFolderId,
          uuid: v4(),
          folderUuid: baseFolderUuid,
          size: 67,
          status: 'EXISTS',
        },
      ],
      folders: [
        {
          id: 22491,
          parentId: baseFolderId,
          parentUuid: baseFolderUuid,
          plainName: 'folder A',
          status: 'TRASHED',
          uuid: 'fc790269-92ac-5990-b9e0-a08d6552bf0b',
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
          name: 'file A',
          fileId: ContentsIdMother.raw(),
          folderId: baseFolderId,
          folderUuid: baseFolderUuid,
          size: 67,
          uuid: v4(),
          status: 'EXISTS',
          type: 'png',
        },
        {
          name: 'file B',
          fileId: ContentsIdMother.raw(),
          uuid: v4(),
          folderId: baseFolderId,
          folderUuid: baseFolderUuid,
          size: 67,
          status: 'TRASHED',
          type: 'png',
        },
      ],
      folders: [
        {
          id: 22491,
          parentId: baseFolderId,
          parentUuid: baseFolderUuid,
          plainName: 'folder A',
          status: 'TRASHED',
          uuid: 'fc790269-92ac-5990-b9e0-a08d6552bf0b',
        },
      ],
    });

    const tree = await SUT.run();

    expect(extractPaths(tree.files)).toStrictEqual(['/file A.png']);
    expect(extractPaths(tree.folders)).toStrictEqual(['/']);
  });
});
