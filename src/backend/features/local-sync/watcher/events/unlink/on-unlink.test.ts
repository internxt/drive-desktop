import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import * as getParentUuid from './get-parent-uuid';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { onUnlink } from './on-unlink';
import * as ipcMain from '@/infra/drive-server-wip/out/ipc-main';

describe('on-unlink', () => {
  const getParentUuidMock = partialSpyOn(getParentUuid, 'getParentUuid');
  const getFileByNameMock = partialSpyOn(SqliteModule.FileModule, 'getByName');
  const getFolderByNameMock = partialSpyOn(SqliteModule.FolderModule, 'getByName');
  const deleteFileByUuidMock = partialSpyOn(ipcMain, 'deleteFileByUuid');
  const deleteFolderByUuidMock = partialSpyOn(ipcMain, 'deleteFolderByUuid');

  let props: Parameters<typeof onUnlink>[0];

  beforeEach(() => {
    getParentUuidMock.mockResolvedValue('parentUuid' as FolderUuid);
    getFolderByNameMock.mockResolvedValue({});

    props = mockProps<typeof onUnlink>({
      path: abs('/parent/file.txt'),
      isDirectory: false,
    });
  });

  it('should catch in case of error', async () => {
    // Given
    getParentUuidMock.mockRejectedValue(new Error());
    // When
    await onUnlink(props);
    // Then
    expect(loggerMock.error).toBeCalledTimes(1);
  });

  it('should skip if cannot retrieve parent uuid', async () => {
    // Given
    getParentUuidMock.mockResolvedValue(null);
    // When
    await onUnlink(props);
    // Then
    call(getParentUuidMock).toMatchObject({ path: '/parent/file.txt' });
    calls(getFileByNameMock).toHaveLength(0);
  });

  it('should skip if file does not exist', async () => {
    // Given
    getFileByNameMock.mockResolvedValue({});
    // When
    await onUnlink(props);
    // Then
    call(getFileByNameMock).toStrictEqual({ nameWithExtension: 'file.txt', parentUuid: 'parentUuid' });
    calls(deleteFileByUuidMock).toHaveLength(0);
  });

  it('should unlink file', async () => {
    // Given
    getFileByNameMock.mockResolvedValue({ data: { uuid: 'uuid' as FileUuid } });
    // When
    await onUnlink(props);
    // Then
    call(deleteFileByUuidMock).toMatchObject({ path: '/parent/file.txt', uuid: 'uuid' });
  });

  it('should unlink folder', async () => {
    // Given
    getFolderByNameMock.mockResolvedValue({ data: { uuid: 'uuid' as FolderUuid } });
    props.path = abs('/parent/folder');
    props.isDirectory = true;
    // When
    await onUnlink(props);
    // Then
    call(deleteFolderByUuidMock).toMatchObject({ path: '/parent/folder', uuid: 'uuid' });
  });
});
