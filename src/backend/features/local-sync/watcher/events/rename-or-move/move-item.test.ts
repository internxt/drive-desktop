import { moveItem } from './move-item';
import { calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { ipcRendererDriveServerWip } from '@/infra/drive-server-wip/out/ipc-renderer';
import * as updateFileStatus from '../../../placeholders/update-file-status';
import * as updateFolderStatus from '../../../placeholders/update-folder-status';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';

describe('move-item', () => {
  const getFolderUuidMock = partialSpyOn(NodeWin, 'getFolderUuid');
  const updateFileStatusMock = partialSpyOn(updateFileStatus, 'updateFileStatus');
  const updateFolderStatusMock = partialSpyOn(updateFolderStatus, 'updateFolderStatus');
  const invokeMock = vi.spyOn(ipcRendererDriveServerWip, 'invoke');

  let props: Parameters<typeof moveItem>[0];

  beforeEach(() => {
    getFolderUuidMock.mockReturnValue({ data: 'newParentUuid' as FolderUuid });

    props = mockProps<typeof moveItem>({
      type: 'file',
      uuid: 'uuid' as FileUuid,
      item: { parentUuid: 'parentUuid' },
      itemName: 'name',
      path: createRelativePath('folder', 'newName'),
      ctx: { workspaceToken: '' },
    });
  });

  it('should not do anything if cannot find parent uuid', async () => {
    // Given
    getFolderUuidMock.mockReturnValue({ error: new Error() });
    // When
    const promise = moveItem(props);
    // Then
    await expect(promise).rejects.toThrowError();
  });

  it('should not do anything if neither move nor renamed', async () => {
    // Given
    getFolderUuidMock.mockReturnValue({ data: 'parentUuid' as FolderUuid });
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
      nameWithExtension: 'newName',
      uuid: 'uuid',
      parentUuid: 'newParentUuid',
      workspaceToken: '',
    });
    expect(updateFileStatusMock).toBeCalledTimes(1);
  });

  it('should move folder', async () => {
    // Given
    props.type = 'folder';
    // When
    await moveItem(props);
    // Then
    expect(invokeMock).toBeCalledWith('moveFolderByUuid', {
      name: 'newName',
      uuid: 'uuid',
      parentUuid: 'newParentUuid',
      workspaceToken: '',
    });
    expect(updateFolderStatusMock).toBeCalledTimes(1);
  });
});
