import { mockDeep } from 'vitest-mock-extended';
import { ServerFile, ServerFileStatus } from '../../../../../src/context/shared/domain/ServerFile';
import { ServerFolderStatus, ServerFolder } from '../../../../../src/context/shared/domain/ServerFolder';
import { Traverser } from '../../../../../src/context/virtual-drive/items/application/Traverser';
import { ContentsIdMother } from '../../contents/domain/ContentsIdMother';
import { FakeNameDecrypt } from '../infrastructure/FakeNameDecrypt';
import { SyncEngineIpc } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { v4 } from 'uuid';

describe('Traverser', () => {
  const nameDecrypt = new FakeNameDecrypt();
  const ipc = mockDeep<SyncEngineIpc>();

  it('first level files starts with /', () => {
    const baseFolderId = 6;
    const baseFolderUuid = v4();
    const rawTree = {
      files: [
        {
          name: 'file A',
          fileId: ContentsIdMother.raw(),
          folderId: baseFolderId,
          folderUuid: baseFolderUuid,
          uuid: v4(),
          size: 67,
          status: 'EXISTS',
        } as ServerFile,
      ],
      folders: [],
    };
    const SUT = new Traverser(
      nameDecrypt,
      ipc,
      baseFolderId,
      baseFolderUuid,
      [ServerFileStatus.EXISTS, ServerFileStatus.TRASHED],
      [ServerFolderStatus.EXISTS],
    );

    const tree = SUT.run(rawTree);

    expect(tree.filePaths).toEqual(['/file A']);
    expect(tree.folderPaths).toEqual(['/']);
  });

  it('second level files starts with /', () => {
    const baseFolderId = 6;
    const baseFolderUuid = v4();
    const rawTree = {
      files: [
        {
          name: 'file A',
          fileId: ContentsIdMother.raw(),
          folderId: 22491,
          folderUuid: '87c76c58-717d-5fee-ab8d-0ab4b94bb708',
          uuid: v4(),
          size: 200,
          status: 'EXISTS',
        } as ServerFile,
      ],
      folders: [
        {
          id: 22491,
          parentId: baseFolderId,
          parentUuid: baseFolderUuid,
          plain_name: 'folder A',
          status: 'EXISTS',
          uuid: '87c76c58-717d-5fee-ab8d-0ab4b94bb708',
        } as ServerFolder,
      ],
    };
    const SUT = new Traverser(
      nameDecrypt,
      ipc,
      baseFolderId,
      baseFolderUuid,
      [ServerFileStatus.EXISTS, ServerFileStatus.TRASHED],
      [ServerFolderStatus.EXISTS],
    );

    const tree = SUT.run(rawTree);

    expect(tree.filePaths).toEqual(['/folder A/file A']);
    expect(tree.folderPaths).toEqual(['/', '/folder A']);
  });

  it('first level folder starts with /', () => {
    const baseFolderId = 6;
    const baseFolderUuid = v4();
    const rawTree = {
      files: [],
      folders: [
        {
          id: 22491,
          parentId: baseFolderId,
          parentUuid: baseFolderUuid,
          plain_name: 'folder A',
          status: 'EXISTS',
          uuid: '35d8c70c-36eb-5761-8340-cf632a86334b',
        } as ServerFolder,
      ],
    };
    const SUT = new Traverser(
      nameDecrypt,
      ipc,
      baseFolderId,
      baseFolderUuid,
      [ServerFileStatus.EXISTS, ServerFileStatus.TRASHED],
      [ServerFolderStatus.EXISTS],
    );

    const tree = SUT.run(rawTree);

    expect(tree.folderPaths).toEqual(['/', '/folder A']);
  });

  it('second level folder starts with /', () => {
    const baseFolderId = 6;
    const baseFolderUuid = v4();
    const rawTree = {
      files: [],
      folders: [
        {
          id: 22491,
          parentId: baseFolderId,
          parentUuid: baseFolderUuid,
          plain_name: 'folder A',
          status: 'EXISTS',
          uuid: 'fc790269-92ac-5990-b9e0-a08d6552bf0b',
        } as ServerFolder,
        {
          id: 89181879209463,
          parentId: 22491,
          parentUuid: 'fc790269-92ac-5990-b9e0-a08d6552bf0b',
          plain_name: 'folder B',
          status: 'EXISTS',
          uuid: '56fdacd4-384e-558c-9442-bb032f4b9123',
        } as ServerFolder,
      ],
    };
    const SUT = new Traverser(
      nameDecrypt,
      ipc,
      baseFolderId,
      baseFolderUuid,
      [ServerFileStatus.EXISTS, ServerFileStatus.TRASHED],
      [ServerFolderStatus.EXISTS],
    );

    const tree = SUT.run(rawTree);

    expect(tree.folderPaths).toEqual(['/', '/folder A', '/folder A/folder B']);
  });

  it('root folder should exist', () => {
    const baseFolderId = 6;
    const baseFolderUuid = v4();
    const rawTree = {
      files: [],
      folders: [
        {
          id: 22491,
          parentId: baseFolderId,
          parentUuid: baseFolderUuid,
          plain_name: 'folder A',
          status: 'EXISTS',
          uuid: '6a17069e-5473-5101-b3ab-66f710043f3e',
        } as ServerFolder,
        {
          id: 89181879209463,
          parentId: 22491,
          parentUuid: '6a17069e-5473-5101-b3ab-66f710043f3e',
          plain_name: 'folder B',
          status: 'EXISTS',
          uuid: 'd600cb02-ad9c-570f-8977-eb87b7e95ef5',
        } as ServerFolder,
      ],
    };
    const SUT = new Traverser(
      nameDecrypt,
      ipc,
      baseFolderId,
      baseFolderUuid,
      [ServerFileStatus.EXISTS, ServerFileStatus.TRASHED],
      [ServerFolderStatus.EXISTS],
    );

    const tree = SUT.run(rawTree);

    expect(tree.folderPaths).toEqual(['/', '/folder A', '/folder A/folder B']);
  });

  it('when a file data is invalid ignore it and continue', () => {
    const baseFolderId = 6;
    const baseFolderUuid = v4();

    const rawTree = {
      files: [
        {
          name: 'invalid file',
          uuid: v4(),
          folderUuid: baseFolderUuid,
          fileId: 'Some response',
          folderId: baseFolderId,
          size: 67,
          status: 'EXISTS',
        } as ServerFile,
        {
          name: 'valid_name',
          uuid: v4(),
          folderUuid: baseFolderUuid,
          fileId: ContentsIdMother.raw(),
          folderId: baseFolderId,
          size: 67,
          status: 'EXISTS',
        } as ServerFile,
        {
          name: 'valid_name_2',
          uuid: v4(),
          folderUuid: baseFolderUuid,
          fileId: ContentsIdMother.raw(),
          folderId: baseFolderId,
          size: 67,
          status: 'INVALID_STATUS',
        } as unknown as ServerFile,
      ],
      folders: [],
    };
    const SUT = new Traverser(
      nameDecrypt,
      ipc,
      baseFolderId,
      baseFolderUuid,
      [ServerFileStatus.EXISTS, ServerFileStatus.TRASHED],
      [ServerFolderStatus.EXISTS],
    );

    const tree = SUT.run(rawTree);

    expect(tree.filePaths).toEqual(['/valid_name']);
  });

  it('when a folder data is invalid ignore it and continue', () => {
    const baseFolderId = 6;
    const baseFolderUuid = v4();

    const rawTree = {
      files: [],
      folders: [
        {
          id: 22491,
          parentId: baseFolderId,
          parentUuid: baseFolderUuid,
          plain_name: 'folder A',
          status: 'EXISTS',
          uuid: 'fc790269-92ac-5990-b9e0-a08d6552bf0b',
        } as ServerFolder,
        {} as ServerFolder,
      ],
    };
    const SUT = new Traverser(
      nameDecrypt,
      ipc,
      baseFolderId,
      baseFolderUuid,
      [ServerFileStatus.EXISTS, ServerFileStatus.TRASHED],
      [ServerFolderStatus.EXISTS],
    );

    const tree = SUT.run(rawTree);

    expect(tree.filePaths).toEqual([]);
    expect(tree.folderPaths).toEqual(['/', '/folder A']);
  });

  it('filters the files and folders depending on the filters set', () => {
    const baseFolderId = 6;
    const baseFolderUuid = v4();

    const rawTree = {
      files: [
        {
          name: 'file A',
          fileId: ContentsIdMother.raw(),
          folderId: baseFolderId,
          uuid: v4(),
          folderUuid: baseFolderUuid,
          size: 67,
          status: 'EXISTS',
        } as ServerFile,
      ],
      folders: [
        {
          id: 22491,
          parentId: baseFolderId,
          parentUuid: baseFolderUuid,
          plain_name: 'folder A',
          status: 'TRASHED',
          uuid: 'fc790269-92ac-5990-b9e0-a08d6552bf0b',
        } as ServerFolder,
      ],
    };
    const SUT = new Traverser(
      nameDecrypt,
      ipc,
      baseFolderId,
      baseFolderUuid,
      [ServerFileStatus.EXISTS, ServerFileStatus.TRASHED],
      [ServerFolderStatus.EXISTS],
    );

    const tree = SUT.run(rawTree);

    expect(tree.filePaths).toEqual(['/file A']);
    expect(tree.folderPaths).toEqual(['/']);
  });

  it('filters the files and folders depending on the filters set', () => {
    const baseFolderId = 6;
    const baseFolderUuid = v4();
    const rawTree = {
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
        } as ServerFile,
        {
          name: 'file B',
          fileId: ContentsIdMother.raw(),
          uuid: v4(),
          folderId: baseFolderId,
          folderUuid: baseFolderUuid,
          size: 67,
          status: 'TRASHED',
          type: 'png',
        } as ServerFile,
      ],
      folders: [
        {
          id: 22491,
          parentId: baseFolderId,
          parentUuid: baseFolderUuid,
          plain_name: 'folder A',
          status: 'TRASHED',
          uuid: 'fc790269-92ac-5990-b9e0-a08d6552bf0b',
        } as ServerFolder,
      ],
    };
    const SUT = new Traverser(
      nameDecrypt,
      ipc,
      baseFolderId,
      baseFolderUuid,
      [ServerFileStatus.EXISTS, ServerFileStatus.TRASHED],
      [ServerFolderStatus.EXISTS],
    );

    const tree = SUT.run(rawTree);

    expect(tree.filePaths).toEqual(['/file A.png']);
    expect(tree.folderPaths).toEqual(['/']);
  });
});
