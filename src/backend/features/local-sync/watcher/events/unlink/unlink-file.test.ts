import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { unlinkFile } from './unlink-file';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import * as isMoveFileEvent from './is-move-event';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import * as getParentUuid from './get-parent-uuid';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import * as deleteFileByUuid from '@/infra/drive-server-wip/out/ipc-main';

describe('unlink-file', () => {
  const getParentUuidMock = partialSpyOn(getParentUuid, 'getParentUuid');
  const getByNameMock = partialSpyOn(SqliteModule.FileModule, 'getByName');
  const deleteFileByUuidMock = partialSpyOn(deleteFileByUuid, 'deleteFileByUuid');
  const isMoveFileEventMock = partialSpyOn(isMoveFileEvent, 'isMoveFileEvent');

  const props = mockProps<typeof unlinkFile>({
    path: abs('/drive/folder/file.txt'),
    ctx: {
      workspaceToken: 'token',
      rootPath: abs('/drive'),
    },
  });

  beforeEach(() => {
    getParentUuidMock.mockResolvedValue('parentUuid' as FolderUuid);
    getByNameMock.mockResolvedValue({ data: { uuid: 'uuid' as FileUuid } });
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
    expect(getParentUuidMock).toBeCalledWith(expect.objectContaining({ path: '/drive/folder/file.txt' }));
    expect(getByNameMock).toBeCalledTimes(0);
  });

  it('should skip if file does not exist', async () => {
    // Given
    getByNameMock.mockResolvedValue({});
    // When
    await unlinkFile(props);
    // Then
    expect(getParentUuidMock).toBeCalledTimes(1);
    expect(getByNameMock).toBeCalledWith({ nameWithExtension: 'file.txt', parentUuid: 'parentUuid' });
    expect(isMoveFileEventMock).toBeCalledTimes(0);
  });

  it('should skip if it is a move event', async () => {
    // Given
    isMoveFileEventMock.mockResolvedValue(true);
    // When
    await unlinkFile(props);
    // Then
    expect(getParentUuidMock).toBeCalledTimes(1);
    expect(getByNameMock).toBeCalledTimes(1);
    expect(isMoveFileEventMock).toBeCalledWith({ uuid: 'uuid' });
  });

  it('should unlink file', async () => {
    // When
    await unlinkFile(props);
    // Then
    expect(getParentUuidMock).toBeCalledTimes(1);
    expect(isMoveFileEventMock).toBeCalledTimes(1);
    expect(getByNameMock).toBeCalledTimes(1);
    expect(deleteFileByUuidMock).toBeCalledWith({
      path: '/drive/folder/file.txt',
      uuid: 'uuid',
      workspaceToken: 'token',
    });
  });

  it('should catch error in case unlink returns error', async () => {
    // Given
    deleteFileByUuidMock.mockRejectedValue(new Error());
    // When
    await unlinkFile(props);
    // Then
    expect(getParentUuidMock).toBeCalledTimes(1);
    expect(isMoveFileEventMock).toBeCalledTimes(1);
    expect(loggerMock.error).toBeCalledTimes(1);
  });
});
