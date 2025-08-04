import { moveItem } from './move-item';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import * as getParentUuid from './get-parent-uuid';
import { ipcRendererDriveServerWip } from '@/infra/drive-server-wip/out/ipc-renderer';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';

describe('move-item', () => {
  const getParentUuidMock = partialSpyOn(getParentUuid, 'getParentUuid');
  const invokeMock = vi.spyOn(ipcRendererDriveServerWip, 'invoke');

  const existingItem = {
    oldName: 'oldName.exe',
    oldParentUuid: 'oldParentUuid' as FolderUuid,
  };

  let props: Parameters<typeof moveItem>[0];

  beforeEach(() => {
    props = mockProps<typeof moveItem>({
      self: {
        virtualDrive: { updateSyncStatus: vi.fn() },
        logger: loggerMock,
      },
    });
  });

  it('should not do anything if cannot find parent uuid', async () => {
    // Given
    getParentUuidMock.mockReturnValue(undefined);
    // When
    await moveItem(props);
    // Then
    expect(invokeMock).toBeCalledTimes(0);
    expect(props.self.virtualDrive.updateSyncStatus).toBeCalledTimes(0);
  });

  it('should not do anything if not renamed or moved', async () => {
    // Given
    props.path = createRelativePath('folder', 'oldName.exe');
    getParentUuidMock.mockReturnValue({ parentUuid: 'oldParentUuid' as FolderUuid, existingItem });
    // When
    await moveItem(props);
    // Then
    expect(invokeMock).toBeCalledTimes(0);
    expect(props.self.virtualDrive.updateSyncStatus).toBeCalledTimes(0);
  });

  describe('file', () => {
    beforeEach(() => {
      props.uuid = 'uuid' as FileUuid;
      props.type = 'file';
    });

    it('should rename if it is renamed', async () => {
      // Given
      props.path = createRelativePath('folder', 'newName.exe');
      getParentUuidMock.mockReturnValue({ parentUuid: 'oldParentUuid' as FolderUuid, existingItem });
      // When
      await moveItem(props);
      // Then
      expect(invokeMock).toBeCalledWith('renameFileByUuid', { uuid: 'uuid', nameWithExtension: 'newName.exe', workspaceToken: '' });
      expect(props.self.virtualDrive.updateSyncStatus).toBeCalledWith({ itemPath: '/folder/newName.exe', isDirectory: false, sync: true });
    });

    it('should move if it is moved', async () => {
      // Given
      props.path = createRelativePath('folder', 'oldName.exe');
      getParentUuidMock.mockReturnValue({ parentUuid: 'newParentUuid' as FolderUuid, existingItem });
      // When
      await moveItem(props);
      // Then
      expect(invokeMock).toBeCalledWith('moveFileByUuid', {
        nameWithExtension: 'oldName.exe',
        uuid: 'uuid',
        parentUuid: 'newParentUuid',
        workspaceToken: '',
      });
      expect(props.self.virtualDrive.updateSyncStatus).toBeCalledWith({ itemPath: '/folder/oldName.exe', isDirectory: false, sync: true });
    });
  });

  describe('folder', () => {
    beforeEach(() => {
      props.uuid = 'uuid' as FolderUuid;
      props.type = 'folder';
    });

    it('should rename if it is renamed', async () => {
      // Given
      getParentUuidMock.mockReturnValue({ parentUuid: 'oldParentUuid' as FolderUuid, existingItem });
      props.path = createRelativePath('folder', 'newName');
      // When
      await moveItem(props);
      // Then
      expect(invokeMock).toBeCalledWith('renameFolderByUuid', { uuid: 'uuid', name: 'newName', workspaceToken: '' });
      expect(props.self.virtualDrive.updateSyncStatus).toBeCalledTimes(0);
    });

    it('should move if it is moved', async () => {
      // Given
      getParentUuidMock.mockReturnValue({ parentUuid: 'newParentUuid' as FolderUuid, existingItem });
      props.path = createRelativePath('folder', 'oldName.exe');
      // When
      await moveItem(props);
      // Then
      expect(invokeMock).toBeCalledWith('moveFolderByUuid', {
        name: 'oldName.exe',
        uuid: 'uuid',
        parentUuid: 'newParentUuid',
        workspaceToken: '',
      });
      expect(props.self.virtualDrive.updateSyncStatus).toBeCalledTimes(0);
    });
  });
});
