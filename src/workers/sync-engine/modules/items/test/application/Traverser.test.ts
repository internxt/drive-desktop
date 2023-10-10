import { ContentsIdMother } from '../../../contents/test/domain/ContentsIdMother';
import { ServerFile } from '../../../../../filesystems/domain/ServerFile';
import { ServerFolder } from '../../../../../filesystems/domain/ServerFolder';
import { ExistingItemsTraverser } from '../../application/ExistingItemsTraverser';

const fakeDecrypt = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  decryptName: (name: string, _a: string, _b: string) => name,
};

describe('Traverser', () => {
  it('first level files starts with /', () => {
    const baseFolderId = 6;
    const rawTree = {
      files: [
        {
          name: 'file A',
          fileId: ContentsIdMother.raw(),
          folderId: baseFolderId,
          size: 67,
          status: 'EXISTS',
        } as ServerFile,
      ],
      folders: [],
    };
    const SUT = new ExistingItemsTraverser(fakeDecrypt, baseFolderId);

    const result = SUT.run(rawTree);

    expect(Object.keys(result)).toStrictEqual(['/file A', '/']);
  });

  it('second level files starts with /', () => {
    const baseFolderId = 6;
    const rawTree = {
      files: [
        {
          name: 'file A',
          fileId: ContentsIdMother.raw(),
          folderId: 22491,
          size: 200,
          status: 'EXISTS',
        } as ServerFile,
      ],
      folders: [
        {
          id: 22491,
          parentId: baseFolderId,
          plain_name: 'folder A',
          status: 'EXISTS',
          uuid: '87c76c58-717d-5fee-ab8d-0ab4b94bb708',
        } as ServerFolder,
      ],
    };
    const SUT = new ExistingItemsTraverser(fakeDecrypt, baseFolderId);

    const result = SUT.run(rawTree);

    expect(Object.keys(result)).toStrictEqual([
      '/folder A',
      '/folder A/file A',
      '/',
    ]);
  });

  it('first level folder starts with /', () => {
    const baseFolderId = 6;
    const rawTree = {
      files: [],
      folders: [
        {
          id: 22491,
          parentId: baseFolderId,
          plain_name: 'folder A',
          status: 'EXISTS',
          uuid: '35d8c70c-36eb-5761-8340-cf632a86334b',
        } as ServerFolder,
      ],
    };
    const SUT = new ExistingItemsTraverser(fakeDecrypt, baseFolderId);

    const result = SUT.run(rawTree);

    expect(Object.keys(result)).toStrictEqual(['/folder A', '/']);
  });

  it('second level folder starts with /', () => {
    const baseFolderId = 6;
    const rawTree = {
      files: [],
      folders: [
        {
          id: 22491,
          parentId: baseFolderId,
          plain_name: 'folder A',
          status: 'EXISTS',
          uuid: 'fc790269-92ac-5990-b9e0-a08d6552bf0b',
        } as ServerFolder,
        {
          id: 89181879209463,
          parentId: 22491,
          plain_name: 'folder B',
          status: 'EXISTS',
          uuid: '56fdacd4-384e-558c-9442-bb032f4b9123',
        } as ServerFolder,
      ],
    };
    const SUT = new ExistingItemsTraverser(fakeDecrypt, baseFolderId);

    const result = SUT.run(rawTree);

    expect(Object.keys(result)).toStrictEqual([
      '/folder A',
      '/folder A/folder B',
      '/',
    ]);
  });

  it('root folder should exist', () => {
    const baseFolderId = 6;
    const rawTree = {
      files: [],
      folders: [
        {
          id: 22491,
          parentId: baseFolderId,
          plain_name: 'folder A',
          status: 'EXISTS',
          uuid: '6a17069e-5473-5101-b3ab-66f710043f3e',
        } as ServerFolder,
        {
          id: 89181879209463,
          parentId: 22491,
          plain_name: 'folder B',
          status: 'EXISTS',
          uuid: 'd600cb02-ad9c-570f-8977-eb87b7e95ef5',
        } as ServerFolder,
      ],
    };
    const SUT = new ExistingItemsTraverser(fakeDecrypt, baseFolderId);

    const result = SUT.run(rawTree);

    expect(Object.keys(result)).toStrictEqual([
      '/folder A',
      '/folder A/folder B',
      '/',
    ]);
  });

  it('when a file data is invalid ignore it and continue', () => {
    const baseFolderId = 6;
    const rawTree = {
      files: [
        {
          name: 'invalid file',
          fileId: 'Some response',
          folderId: baseFolderId,
          size: 67,
          status: 'EXISTS',
        } as ServerFile,
        {
          name: 'valid_name',
          fileId: ContentsIdMother.raw(),
          folderId: baseFolderId,
          size: 67,
          status: 'EXISTS',
        } as ServerFile,
        {
          name: 'valid_name_2',
          fileId: ContentsIdMother.raw(),
          folderId: baseFolderId,
          size: 67,
          status: 'INVALID_STATUS',
        } as unknown as ServerFile,
      ],
      folders: [],
    };
    const SUT = new ExistingItemsTraverser(fakeDecrypt, baseFolderId);

    const result = SUT.run(rawTree);

    expect(Object.keys(result)).toStrictEqual(['/valid_name', '/']);
  });

  it('when a folder data is invalid ignore it and continue', () => {
    const baseFolderId = 6;
    const rawTree = {
      files: [],
      folders: [
        {
          id: 22491,
          parentId: baseFolderId,
          plain_name: 'folder A',
          status: 'EXISTS',
          uuid: 'fc790269-92ac-5990-b9e0-a08d6552bf0b',
        } as ServerFolder,
        {} as ServerFolder,
      ],
    };
    const SUT = new ExistingItemsTraverser(fakeDecrypt, baseFolderId);

    const result = SUT.run(rawTree);

    expect(Object.keys(result)).toStrictEqual(['/folder A', '/']);
  });
});
