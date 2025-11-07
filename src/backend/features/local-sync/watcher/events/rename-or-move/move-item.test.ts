import { moveItem } from './move-item';
import { calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { ipcRendererDriveServerWip } from '@/infra/drive-server-wip/out/ipc-renderer';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';

describe('move-item', () => {
  const getFolderInfoMock = partialSpyOn(NodeWin, 'getFolderInfo');
  const invokeMock = vi.spyOn(ipcRendererDriveServerWip, 'invoke');

  let props: Parameters<typeof moveItem>[0];

  beforeEach(() => {
    getFolderInfoMock.mockReturnValue({ data: { uuid: 'newParentUuid' as FolderUuid } });

    props = mockProps<typeof moveItem>({
      type: 'file',
      uuid: 'uuid' as FileUuid,
      item: { parentUuid: 'parentUuid' },
      itemName: 'name',
      path: createRelativePath('folder', 'newName'),
      ctx: {
        workspaceToken: '',
        virtualDrive: { updateSyncStatus: vi.fn() },
      },
    });
  });

  it('should not do anything if cannot find parent uuid', async () => {
    // Given
    getFolderInfoMock.mockReturnValue({ error: new Error() });
    // When
    const promise = moveItem(props);
    // Then
    await expect(promise).rejects.toThrowError();
  });

  it('should not do anything if neither move nor renamed', async () => {
    // Given
    getFolderInfoMock.mockReturnValue({ data: { uuid: 'parentUuid' as FolderUuid } });
    props.path = createRelativePath('folder', 'name');
    // When
    await moveItem(props);
    // Then
    calls(invokeMock).toHaveLength(0);
  });

  it('should move file', async () => {
    // Given
    props.type = 'file';
    // When
    await moveItem(props);
    // Then
    expect(invokeMock).toBeCalledWith('moveFileByUuid', {
      path: '/folder/newName',
      uuid: 'uuid',
      parentUuid: 'newParentUuid',
      workspaceToken: '',
    });
    expect(props.ctx.virtualDrive.updateSyncStatus).toBeCalledTimes(1);
  });

  it('should move folder', async () => {
    // Given
    props.type = 'folder';
    // When
    await moveItem(props);
    // Then
    expect(invokeMock).toBeCalledWith('moveFolderByUuid', {
      path: '/folder/newName',
      uuid: 'uuid',
      parentUuid: 'newParentUuid',
      workspaceToken: '',
    });
    expect(props.ctx.virtualDrive.updateSyncStatus).toBeCalledTimes(1);
  });
});
