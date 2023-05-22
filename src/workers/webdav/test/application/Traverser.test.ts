import { ServerFolder } from 'workers/filesystems/domain/ServerFolder';
import { ServerFile } from '../../../filesystems/domain/ServerFile';
import { Traverser } from '../../application/Traverser';

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
        } as ServerFile,
      ],
      folders: [],
    };
    const SUT = new Traverser(fakeDecryptor, baseFolderId);

    const result = SUT.run(rawTree);

    expect(Object.keys(result)).toStrictEqual(['/', '/file A']);
  });

  it('second level files starts with /', () => {
    const baseFolderId = 6;
    const rawTree = {
      files: [
        {
          name: 'file A',
          folderId: 22491,
        } as ServerFile,
      ],
      folders: [
        {
          id: 22491,
          parent_id: baseFolderId,
          plain_name: 'folder A',
        } as ServerFolder,
      ],
    };
    const SUT = new Traverser(fakeDecryptor, baseFolderId);

    const result = SUT.run(rawTree);

    expect(Object.keys(result)).toStrictEqual([
      '/',
      '/folder A',
      '/folder A/file A',
    ]);
  });

  it('first level folder starts with /', () => {
    const baseFolderId = 6;
    const rawTree = {
      files: [],
      folders: [
        {
          id: 22491,
          parent_id: baseFolderId,
          plain_name: 'folder A',
        } as ServerFolder,
      ],
    };
    const SUT = new Traverser(fakeDecryptor, baseFolderId);

    const result = SUT.run(rawTree);

    expect(Object.keys(result)).toStrictEqual(['/', '/folder A']);
  });

  it('second level folder starts with /', () => {
    const baseFolderId = 6;
    const rawTree = {
      files: [],
      folders: [
        {
          id: 22491,
          parent_id: baseFolderId,
          plain_name: 'folder A',
        } as ServerFolder,
        {
          id: 89181879209463,
          parent_id: 22491,
          plain_name: 'folder B',
        } as ServerFolder,
      ],
    };
    const SUT = new Traverser(fakeDecryptor, baseFolderId);

    const result = SUT.run(rawTree);

    expect(Object.keys(result)).toStrictEqual([
      '/',
      '/folder A',
      '/folder A/folder B',
    ]);
  });

  it('root folder should exist', () => {
    const baseFolderId = 6;
    const rawTree = {
      files: [],
      folders: [
        {
          id: 22491,
          parent_id: baseFolderId,
          plain_name: 'folder A',
        } as ServerFolder,
        {
          id: 89181879209463,
          parent_id: 22491,
          plain_name: 'folder B',
        } as ServerFolder,
      ],
    };
    const SUT = new Traverser(fakeDecryptor, baseFolderId);

    const result = SUT.run(rawTree);

    expect(Object.keys(result)).toStrictEqual([
      '/',
      '/folder A',
      '/folder A/folder B',
    ]);
  });

  it('the root folder should contain its children items', () => {
    const baseFolderId = 6;
    const rawTree = {
      files: [
        {
          name: 'file A',
          folderId: baseFolderId,
        } as ServerFile,
      ],
      folders: [
        {
          id: 22491,
          parent_id: baseFolderId,
          name: 'folder A',
        } as ServerFolder,
        {
          id: 89181879209463,
          parent_id: 22491,
          name: 'folder B',
        } as ServerFolder,
      ],
    };
    const SUT = new Traverser(fakeDecryptor, baseFolderId);

    const result = SUT.run(rawTree);

    expect(result['/'].folders.values).toStrictEqual(['folder A']);
    expect(result['/'].files.values).toStrictEqual(['file A']);
  });

  it('a folder should contain its children items', () => {
    const baseFolderId = 6;
    const folderId = 22491;
    const rawTree = {
      files: [
        {
          name: 'file A',
          folderId,
        } as ServerFile,
      ],
      folders: [
        {
          id: folderId,
          parent_id: baseFolderId,
          name: 'folder A',
        } as ServerFolder,
        {
          id: 89181879209463,
          parent_id: folderId,
          name: 'folder B',
        } as ServerFolder,
      ],
    };
    const SUT = new Traverser(fakeDecryptor, baseFolderId);

    const result = SUT.run(rawTree);

    console.log(JSON.stringify(result, null, 2));

    expect(result['/folder A'].folders.values).toStrictEqual(['folder B']);
    expect(result['/folder A'].files.values).toStrictEqual(['file A']);
  });
});
