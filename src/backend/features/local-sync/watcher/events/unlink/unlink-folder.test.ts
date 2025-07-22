import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { unlinkFolder } from './unlink-folder';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import * as isMoveDirEvent from './is-move-event';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import * as getConfig from '@/apps/sync-engine/config';
import { ipcRenderer } from 'electron';
import * as getParentUuid from './get-parent-uuid';

describe('unlink-folder', () => {
  const getParentUuidMock = partialSpyOn(getParentUuid, 'getParentUuid');
  const invokeMock = partialSpyOn(ipcRenderer, 'invoke');
  const isMoveDirEventMock = partialSpyOn(isMoveDirEvent, 'isMoveDirEvent');
  const getConfigMock = partialSpyOn(getConfig, 'getConfig');

  const props = mockProps<typeof unlinkFolder>({
    absolutePath: 'C:\\Users\\user\\InternxtDrive\\folder\\folder' as AbsolutePath,
    virtualDrive: {
      syncRootPath: 'C:\\Users\\user\\InternxtDrive' as AbsolutePath,
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();

    getConfigMock.mockReturnValue({ workspaceToken: 'token' });
    getParentUuidMock.mockResolvedValue('parentUuid' as FolderUuid);
    invokeMock.mockResolvedValue({ data: { uuid: 'uuid' as FolderUuid } });
    isMoveDirEventMock.mockResolvedValue(false);
  });

  it('should catch in case of error', async () => {
    // Given
    getParentUuidMock.mockImplementation(() => {
      throw new Error();
    });
    // When
    await unlinkFolder(props);
    // Then
    expect(loggerMock.error).toBeCalledTimes(1);
  });

  it('should skip if cannot retrieve parent uuid', async () => {
    // Given
    getParentUuidMock.mockResolvedValue(undefined);
    // When
    await unlinkFolder(props);
    // Then
    expect(getParentUuidMock).toBeCalledTimes(1);
    expect(getParentUuidMock).toBeCalledWith(expect.objectContaining({ path: '/folder/folder' }));
    expect(invokeMock).toBeCalledTimes(0);
  });

  it('should skip if folder does not exist', async () => {
    // Given
    invokeMock.mockResolvedValue({});
    // When
    await unlinkFolder(props);
    // Then
    expect(getParentUuidMock).toBeCalledTimes(1);
    expect(invokeMock).toBeCalledTimes(1);
    expect(invokeMock).toBeCalledWith('folderGetByName', { parentUuid: 'parentUuid', plainName: 'folder' });
    expect(isMoveDirEventMock).toBeCalledTimes(0);
  });

  it('should skip if it is a move event', async () => {
    // Given
    isMoveDirEventMock.mockResolvedValue(true);
    // When
    await unlinkFolder(props);
    // Then
    expect(getParentUuidMock).toBeCalledTimes(1);
    expect(invokeMock).toBeCalledTimes(1);
    expect(isMoveDirEventMock).toBeCalledTimes(1);
    expect(isMoveDirEventMock).toBeCalledWith({ uuid: 'uuid' });
  });

  it('should unlink folder', async () => {
    // When
    await unlinkFolder(props);
    // Then
    expect(getParentUuidMock).toBeCalledTimes(1);
    expect(isMoveDirEventMock).toBeCalledTimes(1);
    expect(invokeMock).toBeCalledTimes(2);
    expect(invokeMock).toBeCalledWith('storageDeleteFolderByUuid', { uuid: 'uuid', workspaceToken: 'token' });
  });

  it('should catch error in case unlink returns error', async () => {
    // Given
    invokeMock.mockImplementation((channel) => {
      if (channel === 'storageDeleteFolderByUuid') return Promise.resolve({ error: new Error() });
      return Promise.resolve({ data: { uuid: 'uuid' as FolderUuid } });
    });
    // When
    await unlinkFolder(props);
    // Then
    expect(getParentUuidMock).toBeCalledTimes(1);
    expect(isMoveDirEventMock).toBeCalledTimes(1);
    expect(loggerMock.error).toBeCalledTimes(1);
  });
});
