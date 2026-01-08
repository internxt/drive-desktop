import { moveItem } from './move-item';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { Addon } from '@/node-win/addon-wrapper';
import * as ipcMain from '@/infra/drive-server-wip/out/ipc-main';

describe('move-item', () => {
  const getFolderInfoMock = partialSpyOn(NodeWin, 'getFolderInfo');
  const updateSyncStatusMock = partialSpyOn(Addon, 'updateSyncStatus');
  const persistMoveFileMock = partialSpyOn(ipcMain, 'persistMoveFile');
  const persistMoveFolderMock = partialSpyOn(ipcMain, 'persistMoveFolder');

  let props: Parameters<typeof moveItem>[0];

  beforeEach(() => {
    getFolderInfoMock.mockResolvedValue({ data: { uuid: 'newParentUuid' as FolderUuid } });

    props = mockProps<typeof moveItem>({
      type: 'file',
      uuid: 'uuid' as FileUuid,
      item: { parentUuid: 'parentUuid', name: 'name' },
      path: '/folder/newName' as AbsolutePath,
      ctx: {
        workspaceToken: '',
      },
    });
  });

  it('should not do anything if cannot find parent uuid', async () => {
    // Given
    getFolderInfoMock.mockResolvedValue({ error: new Error() });
    // When
    const promise = moveItem(props);
    // Then
    await expect(promise).rejects.toThrowError();
  });

  it('should not do anything if neither move nor renamed', async () => {
    // Given
    getFolderInfoMock.mockResolvedValue({ data: { uuid: 'parentUuid' as FolderUuid } });
    props.path = '/folder/name' as AbsolutePath;
    // When
    await moveItem(props);
    // Then
    calls(persistMoveFileMock).toHaveLength(0);
    calls(persistMoveFolderMock).toHaveLength(0);
  });

  it('should move file', async () => {
    // Given
    props.type = 'file';
    // When
    await moveItem(props);
    // Then
    call(persistMoveFileMock).toMatchObject({
      path: '/folder/newName',
      uuid: 'uuid',
      parentUuid: 'newParentUuid',
    });
    expect(updateSyncStatusMock).toBeCalledTimes(1);
  });

  it('should move folder', async () => {
    // Given
    props.type = 'folder';
    // When
    await moveItem(props);
    // Then
    call(persistMoveFolderMock).toMatchObject({
      path: '/folder/newName',
      uuid: 'uuid',
      parentUuid: 'newParentUuid',
    });
    expect(updateSyncStatusMock).toBeCalledTimes(1);
  });
});
