import { moveItem } from './move-item';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import * as getParentUuid from './get-parent-uuid';
import { ipcRendererDriveServerWip } from '@/infra/drive-server-wip/out/ipc-renderer';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import * as updateFileStatus from '../../../placeholders/update-file-status';
import * as updateFolderStatus from '../../../placeholders/update-folder-status';

describe('move-item', () => {
  const getParentUuidMock = partialSpyOn(getParentUuid, 'getParentUuid');
  const updateFileStatusMock = partialSpyOn(updateFileStatus, 'updateFileStatus');
  const updateFolderStatusMock = partialSpyOn(updateFolderStatus, 'updateFolderStatus');
  const invokeMock = vi.spyOn(ipcRendererDriveServerWip, 'invoke');

  let props: Parameters<typeof moveItem>[0];

  beforeEach(() => {
    getParentUuidMock.mockReturnValue('newParentUuid' as FolderUuid);

    props = mockProps<typeof moveItem>({
      path: createRelativePath('folder', 'newName'),
      ctx: { workspaceToken: '' },
      self: { logger: loggerMock },
    });
  });

  it('should not do anything if cannot find parent uuid', async () => {
    // Given
    getParentUuidMock.mockReturnValue(undefined);
    // When
    await moveItem(props);
    // Then
    expect(invokeMock).toBeCalledTimes(0);
    expect(updateFileStatusMock).toBeCalledTimes(0);
  });

  it('should move file', async () => {
    // Given
    props.type = 'file';
    props.uuid = 'uuid' as FileUuid;
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
    props.uuid = 'uuid' as FolderUuid;
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
