import { ServerFile } from '../../../../../filesystems/domain/ServerFile';
import { ServerFolder } from '../../../../../filesystems/domain/ServerFolder';
import { Traverser } from '../../../items/application/Traverser';

const fakeDecryptor = {
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
          folderId: baseFolderId,
          size: 67,
          status: 'EXISTS',
        } as ServerFile,
      ],
      folders: [],
    };
    const SUT = new Traverser(fakeDecryptor, baseFolderId);

    const result = SUT.run(rawTree);

    expect(Object.keys(result)).toStrictEqual(['/file A', '/']);
  });

  it('second level files starts with /', () => {
    const baseFolderId = 6;
    const rawTree = {
      files: [
        {
          name: 'file A',
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
        } as ServerFolder,
      ],
    };
    const SUT = new Traverser(fakeDecryptor, baseFolderId);

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
        } as ServerFolder,
      ],
    };
    const SUT = new Traverser(fakeDecryptor, baseFolderId);

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
        } as ServerFolder,
        {
          id: 89181879209463,
          parentId: 22491,
          plain_name: 'folder B',
          status: 'EXISTS',
        } as ServerFolder,
      ],
    };
    const SUT = new Traverser(fakeDecryptor, baseFolderId);

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
        } as ServerFolder,
        {
          id: 89181879209463,
          parentId: 22491,
          plain_name: 'folder B',
          status: 'EXISTS',
        } as ServerFolder,
      ],
    };
    const SUT = new Traverser(fakeDecryptor, baseFolderId);

    const result = SUT.run(rawTree);

    expect(Object.keys(result)).toStrictEqual([
      '/folder A',
      '/folder A/folder B',
      '/',
    ]);
  });
});
