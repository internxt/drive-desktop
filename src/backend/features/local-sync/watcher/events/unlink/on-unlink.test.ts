import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as ipcMain from '@/infra/drive-server-wip/out/ipc-main';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { SqliteError } from '@/infra/sqlite/services/common/sqlite-error';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, partialSpyOn, TestProps } from '@/tests/vitest/utils.helper.test';
import { onUnlink } from './on-unlink';

describe('on-unlink', () => {
  const getFolderInfoMock = partialSpyOn(NodeWin, 'getFolderInfo');
  const getFileByNameMock = partialSpyOn(SqliteModule.FileModule, 'getByName');
  const getFolderByNameMock = partialSpyOn(SqliteModule.FolderModule, 'getByName');
  const deleteFileByUuidMock = partialSpyOn(ipcMain, 'deleteFileByUuid');
  const deleteFolderByUuidMock = partialSpyOn(ipcMain, 'deleteFolderByUuid');
  const isBeingPreservedMock = partialSpyOn(SqliteModule.RecoverySyncModule, 'isBeingPreserved');

  let props: TestProps<typeof onUnlink>;

  beforeEach(() => {
    getFolderInfoMock.mockResolvedValue({ data: { uuid: 'parentUuid' as FolderUuid } });
    getFolderByNameMock.mockResolvedValue({});
    isBeingPreservedMock.mockReturnValue({ data: false });

    props = {
      ctx: { rootUuid: 'rootUuid' as FolderUuid, logger: loggerMock },
      path: abs('/parent/file.txt'),
      type: 'file',
    };
  });

  it('should skip if cannot retrieve parent uuid', async () => {
    // Given
    getFolderInfoMock.mockResolvedValue({ error: new Error() });
    // When
    await onUnlink(props as any);
    // Then
    calls(deleteFileByUuidMock).toHaveLength(0);
  });

  it('should skip if file does not exist', async () => {
    // Given
    getFileByNameMock.mockResolvedValue({});
    // When
    await onUnlink(props as any);
    // Then
    calls(deleteFileByUuidMock).toHaveLength(0);
  });

  it('should unlink file', async () => {
    // Given
    getFileByNameMock.mockResolvedValue({ data: { uuid: 'uuid' as FileUuid } });
    // When
    await onUnlink(props as any);
    // Then
    call(getFileByNameMock).toStrictEqual({ nameWithExtension: 'file.txt', parentUuid: 'parentUuid' });
    call(getFolderInfoMock).toMatchObject({ path: '/parent' });
    call(deleteFileByUuidMock).toMatchObject({ path: '/parent/file.txt', uuid: 'uuid' });
    call(isBeingPreservedMock).toStrictEqual({ rootUuid: 'rootUuid', itemType: 'file', uuid: 'uuid' });
  });

  it('should skip a file that recovery sync is preserving', async () => {
    // Given
    getFileByNameMock.mockResolvedValue({ data: { uuid: 'uuid' as FileUuid } });
    isBeingPreservedMock.mockReturnValue({ data: true });
    // When
    await onUnlink(props as any);
    // Then
    calls(deleteFileByUuidMock).toHaveLength(0);
    call(loggerMock.debug).toMatchObject({ msg: 'Unlink skipped, item is being preserved by recovery sync' });
  });

  it('should skip the file when it cannot check whether recovery sync is preserving it', async () => {
    // Given
    getFileByNameMock.mockResolvedValue({ data: { uuid: 'uuid' as FileUuid } });
    isBeingPreservedMock.mockReturnValue({ error: new SqliteError('UNKNOWN') });
    // When
    await onUnlink(props as any);
    // Then
    calls(deleteFileByUuidMock).toHaveLength(0);
  });

  describe('what happens for folder', () => {
    beforeEach(() => {
      props.path = abs('/parent/folder');
      props.type = 'folder';
    });

    it('should unlink folder', async () => {
      // Given
      getFolderByNameMock.mockResolvedValue({ data: { uuid: 'uuid' as FolderUuid } });
      // When
      await onUnlink(props as any);
      // Then
      call(getFolderByNameMock).toStrictEqual({ plainName: 'folder', parentUuid: 'parentUuid' });
      call(getFolderInfoMock).toMatchObject({ path: '/parent' });
      call(deleteFolderByUuidMock).toMatchObject({ path: '/parent/folder', uuid: 'uuid' });
    });

    it('should skip a folder that recovery sync is preserving', async () => {
      // Given
      getFolderByNameMock.mockResolvedValue({ data: { uuid: 'uuid' as FolderUuid } });
      isBeingPreservedMock.mockReturnValue({ data: true });
      // When
      await onUnlink(props as any);
      // Then
      call(isBeingPreservedMock).toStrictEqual({ rootUuid: 'rootUuid', itemType: 'folder', uuid: 'uuid' });
      calls(deleteFolderByUuidMock).toHaveLength(0);
    });
  });
});
