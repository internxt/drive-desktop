import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { unlinkFolder } from './unlink-folder';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import * as isMoveFolderEvent from './is-move-event';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import * as getParentUuid from './get-parent-uuid';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import * as deleteFolderByUuid from '@/infra/drive-server-wip/out/ipc-main';

describe('unlink-folder', () => {
  const getParentUuidMock = partialSpyOn(getParentUuid, 'getParentUuid');
  const getByNameMock = partialSpyOn(SqliteModule.FolderModule, 'getByName');
  const deleteFolderByUuidMock = partialSpyOn(deleteFolderByUuid, 'deleteFolderByUuid');
  const isMoveFolderEventMock = partialSpyOn(isMoveFolderEvent, 'isMoveFolderEvent');

  const props = mockProps<typeof unlinkFolder>({
    path: abs('/drive/folder/folder'),
    ctx: {
      workspaceToken: 'token',
      rootPath: abs('/drive'),
    },
  });

  beforeEach(() => {
    getParentUuidMock.mockResolvedValue('parentUuid' as FolderUuid);
    getByNameMock.mockResolvedValue({ data: { uuid: 'uuid' as FolderUuid } });
    isMoveFolderEventMock.mockResolvedValue(false);
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
    getParentUuidMock.mockResolvedValue(null);
    // When
    await unlinkFolder(props);
    // Then
    expect(getParentUuidMock).toBeCalledTimes(1);
    expect(getParentUuidMock).toBeCalledWith(expect.objectContaining({ path: '/drive/folder/folder' }));
    expect(getByNameMock).toBeCalledTimes(0);
  });

  it('should skip if folder does not exist', async () => {
    // Given
    getByNameMock.mockResolvedValue({});
    // When
    await unlinkFolder(props);
    // Then
    expect(getParentUuidMock).toBeCalledTimes(1);
    expect(getByNameMock).toBeCalledWith({ parentUuid: 'parentUuid', plainName: 'folder' });
    expect(isMoveFolderEventMock).toBeCalledTimes(0);
  });

  it('should skip if it is a move event', async () => {
    // Given
    isMoveFolderEventMock.mockResolvedValue(true);
    // When
    await unlinkFolder(props);
    // Then
    expect(getParentUuidMock).toBeCalledTimes(1);
    expect(getByNameMock).toBeCalledTimes(1);
    expect(isMoveFolderEventMock).toBeCalledWith({ uuid: 'uuid' });
  });

  it('should unlink folder', async () => {
    // When
    await unlinkFolder(props);
    // Then
    expect(getParentUuidMock).toBeCalledTimes(1);
    expect(isMoveFolderEventMock).toBeCalledTimes(1);
    expect(getByNameMock).toBeCalledTimes(1);
    expect(deleteFolderByUuidMock).toBeCalledWith({
      path: '/drive/folder/folder',
      uuid: 'uuid',
      workspaceToken: 'token',
    });
  });

  it('should catch error in case unlink returns error', async () => {
    // Given
    deleteFolderByUuidMock.mockResolvedValue({ error: new Error() });
    // When
    await unlinkFolder(props);
    // Then
    expect(getParentUuidMock).toBeCalledTimes(1);
    expect(isMoveFolderEventMock).toBeCalledTimes(1);
    expect(loggerMock.error).toBeCalledTimes(1);
  });
});
