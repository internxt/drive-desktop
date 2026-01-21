import { moveItem } from './move-item';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { Addon } from '@/node-win/addon-wrapper';
import * as ipcMain from '@/infra/drive-server-wip/out/ipc-main';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';

describe('move-item', () => {
  const getFolderInfoMock = partialSpyOn(NodeWin, 'getFolderInfo');
  const updateSyncStatusMock = partialSpyOn(Addon, 'updateSyncStatus');
  const persistMoveFileMock = partialSpyOn(ipcMain, 'persistMoveFile');

  let props: Parameters<typeof moveItem>[0];

  beforeEach(() => {
    getFolderInfoMock.mockResolvedValue({ data: { uuid: 'parentUuid' as FolderUuid } });

    props = mockProps<typeof moveItem>({
      type: 'file',
      uuid: 'uuid' as FileUuid,
      item: { parentUuid: 'parentUuid', name: 'name' },
      path: abs('/name'),
    });
  });

  it('should not do anything if cannot find parent uuid', async () => {
    // Given
    getFolderInfoMock.mockResolvedValue({ error: new Error() });
    // When
    await moveItem(props);
    // Then
    calls(persistMoveFileMock).toHaveLength(0);
  });

  it('should not do anything if neither move nor renamed', async () => {
    // When
    await moveItem(props);
    // Then
    calls(persistMoveFileMock).toHaveLength(0);
  });

  it('should rename file when different name', async () => {
    // Given
    props.path = abs('/newName');
    // When
    await moveItem(props);
    // Then
    call(persistMoveFileMock).toMatchObject({ path: '/newName', uuid: 'uuid', parentUuid: 'parentUuid', action: 'rename' });
    calls(updateSyncStatusMock).toHaveLength(1);
  });

  it('should move file when different parent uuid', async () => {
    // Given
    getFolderInfoMock.mockResolvedValue({ data: { uuid: 'newParentUuid' as FolderUuid } });
    // When
    await moveItem(props);
    // Then
    call(persistMoveFileMock).toMatchObject({ path: '/name', uuid: 'uuid', parentUuid: 'newParentUuid', action: 'move' });
    calls(updateSyncStatusMock).toHaveLength(1);
  });

  it('should move file when different name and parent uuid', async () => {
    // Given
    getFolderInfoMock.mockResolvedValue({ data: { uuid: 'newParentUuid' as FolderUuid } });
    props.path = abs('/newName');
    // When
    await moveItem(props);
    // Then
    call(persistMoveFileMock).toMatchObject({ path: '/newName', uuid: 'uuid', parentUuid: 'newParentUuid', action: 'move' });
    calls(updateSyncStatusMock).toHaveLength(1);
  });
});
