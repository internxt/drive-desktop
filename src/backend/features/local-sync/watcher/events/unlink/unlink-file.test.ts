import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { unlinkFile } from './unlink-file';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import * as isMoveFileEvent from './is-move-event';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import * as getConfig from '@/apps/sync-engine/config';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { ipcRenderer } from 'electron';
import * as getParentUuid from './get-parent-uuid';

describe('unlink-file', () => {
  const getParentUuidMock = partialSpyOn(getParentUuid, 'getParentUuid');
  const invokeMock = partialSpyOn(ipcRenderer, 'invoke');
  const isMoveFileEventMock = partialSpyOn(isMoveFileEvent, 'isMoveFileEvent');
  const getConfigMock = partialSpyOn(getConfig, 'getConfig');

  const props = mockProps<typeof unlinkFile>({
    absolutePath: 'C:\\Users\\user\\InternxtDrive\\folder\\file.txt' as AbsolutePath,
    ctx: {
      virtualDrive: {
        syncRootPath: 'C:\\Users\\user\\InternxtDrive' as AbsolutePath,
      },
    },
  });

  beforeEach(() => {
    getConfigMock.mockReturnValue({ workspaceToken: 'token' });
    getParentUuidMock.mockResolvedValue('parentUuid' as FolderUuid);
    invokeMock.mockResolvedValue({ data: { uuid: 'uuid' as FileUuid } });
    isMoveFileEventMock.mockResolvedValue(false);
  });

  it('should catch in case of error', async () => {
    // Given
    getParentUuidMock.mockImplementation(() => {
      throw new Error();
    });
    // When
    await unlinkFile(props);
    // Then
    expect(loggerMock.error).toBeCalledTimes(1);
  });

  it('should skip if cannot retrieve parent uuid', async () => {
    // Given
    getParentUuidMock.mockResolvedValue(null);
    // When
    await unlinkFile(props);
    // Then
    expect(getParentUuidMock).toBeCalledTimes(1);
    expect(getParentUuidMock).toBeCalledWith(expect.objectContaining({ absolutePath: 'C:\\Users\\user\\InternxtDrive\\folder\\file.txt' }));
    expect(invokeMock).toBeCalledTimes(0);
  });

  it('should skip if file does not exist', async () => {
    // Given
    invokeMock.mockResolvedValue({});
    // When
    await unlinkFile(props);
    // Then
    expect(getParentUuidMock).toBeCalledTimes(1);
    expect(invokeMock).toBeCalledTimes(1);
    expect(invokeMock).toBeCalledWith('fileGetByName', { parentUuid: 'parentUuid', nameWithExtension: 'file.txt' });
    expect(isMoveFileEventMock).toBeCalledTimes(0);
  });

  it('should skip if it is a move event', async () => {
    // Given
    isMoveFileEventMock.mockResolvedValue(true);
    // When
    await unlinkFile(props);
    // Then
    expect(getParentUuidMock).toBeCalledTimes(1);
    expect(invokeMock).toBeCalledTimes(1);
    expect(isMoveFileEventMock).toBeCalledTimes(1);
    expect(isMoveFileEventMock).toBeCalledWith({ uuid: 'uuid' });
  });

  it('should unlink file', async () => {
    // When
    await unlinkFile(props);
    // Then
    expect(getParentUuidMock).toBeCalledTimes(1);
    expect(isMoveFileEventMock).toBeCalledTimes(1);
    expect(invokeMock).toBeCalledTimes(2);
    expect(invokeMock).toBeCalledWith('storageDeleteFileByUuid', { nameWithExtension: 'file.txt', uuid: 'uuid', workspaceToken: 'token' });
  });

  it('should catch error in case unlink returns error', async () => {
    // Given
    invokeMock.mockImplementation((channel) => {
      if (channel === 'storageDeleteFileByUuid') return Promise.resolve({ error: new Error() });
      return Promise.resolve({ data: { uuid: 'uuid' as FileUuid } });
    });
    // When
    await unlinkFile(props);
    // Then
    expect(getParentUuidMock).toBeCalledTimes(1);
    expect(isMoveFileEventMock).toBeCalledTimes(1);
    expect(loggerMock.error).toBeCalledTimes(1);
  });
});
