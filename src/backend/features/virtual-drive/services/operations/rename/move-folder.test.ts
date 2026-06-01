import { mockDeep } from 'vitest-mock-extended';
import { Container } from 'diod';
import { FolderPathUpdater } from '../../../../../../context/virtual-drive/folders/application/FolderPathUpdater';
import { Folder, FolderAttributes } from '../../../../../../context/virtual-drive/folders/domain/Folder';
import { FolderStatuses } from '../../../../../../context/virtual-drive/folders/domain/FolderStatus';
import { SyncFolderMessenger } from '../../../../../../context/virtual-drive/folders/domain/SyncFolderMessenger';
import { FuseCodes } from '../../../../../../apps/drive/fuse/callbacks/FuseCodes';
import { FuseError } from '../../../../../../apps/drive/fuse/callbacks/FuseErrors';
import { moveFolder } from './move-folder';
import { call } from '../../../../../../../tests/vitest/utils.helper';

const folderAttrs: FolderAttributes = {
  id: 1,
  uuid: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  parentId: 0,
  path: '/old/folder',
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  status: FolderStatuses.EXISTS,
};

describe('move-folder', () => {
  const folder = Folder.from(folderAttrs);
  let container: ReturnType<typeof mockDeep<Container>>;
  let updaterMock: ReturnType<typeof mockDeep<FolderPathUpdater>>;
  let messengerMock: ReturnType<typeof mockDeep<SyncFolderMessenger>>;

  const props = { folder, src: '/old/folder', dest: '/new/folder', container: undefined as unknown as Container };

  beforeEach(() => {
    updaterMock = mockDeep<FolderPathUpdater>();
    messengerMock = mockDeep<SyncFolderMessenger>();
    container = mockDeep<Container>();
    container.get.calledWith(FolderPathUpdater).mockReturnValue(updaterMock);
    container.get.calledWith(SyncFolderMessenger).mockReturnValue(messengerMock);
    props.container = container;
  });

  it('should notify rename and renamed and return success', async () => {
    // Given
    updaterMock.run.mockResolvedValue(undefined);

    // When
    const result = await moveFolder(props);

    // Then
    expect(result.data).toBeUndefined();
    expect(result.error).toBeUndefined();
    call(updaterMock.run).toStrictEqual([folder.uuid, '/new/folder']);
  });

  it('should notify rename before and renamed after update', async () => {
    // Given
    const order: string[] = [];
    messengerMock.rename.mockImplementation(async () => {
      order.push('rename');
    });
    updaterMock.run.mockImplementation(async () => {
      order.push('run');
    });
    messengerMock.renamed.mockImplementation(async () => {
      order.push('renamed');
    });

    // When
    await moveFolder(props);

    // Then
    expect(order).toStrictEqual(['rename', 'run', 'renamed']);
  });

  it('should report FOLDER_RENAME_ERROR with src basename and return FuseError when updater throws FuseError', async () => {
    // Given
    const fuseError = new FuseError(FuseCodes.EIO, 'io error');
    updaterMock.run.mockRejectedValue(fuseError);

    // When
    const result = await moveFolder(props);

    // Then
    expect(result.error).toBe(fuseError);
    call(messengerMock.issue).toMatchObject({ error: 'FOLDER_RENAME_ERROR', cause: 'UNKNOWN', name: 'folder' });
  });

  it('should report FOLDER_RENAME_ERROR and return FuseUnknownError for non-FuseError throws', async () => {
    // Given
    updaterMock.run.mockRejectedValue(new Error('unexpected'));

    // When
    const result = await moveFolder(props);

    // Then
    expect(result.error?.code).toBe(FuseCodes.EIO);
    call(messengerMock.issue).toMatchObject({ error: 'FOLDER_RENAME_ERROR', cause: 'UNKNOWN', name: 'folder' });
  });
});
