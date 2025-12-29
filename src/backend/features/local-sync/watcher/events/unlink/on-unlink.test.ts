import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as unlinkFile from './unlink-file';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import * as getParentUuid from './get-parent-uuid';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { onUnlink } from './on-unlink';

describe('on-unlink', () => {
  const getParentUuidMock = partialSpyOn(getParentUuid, 'getParentUuid');
  const getFileByNameMock = partialSpyOn(SqliteModule.FileModule, 'getByName');
  const getFolderByNameMock = partialSpyOn(SqliteModule.FolderModule, 'getByName');
  const unlinkFileMock = partialSpyOn(unlinkFile, 'unlinkFile');

  const props = mockProps<typeof onUnlink>({
    path: abs('/parent/file.txt'),
  });

  beforeEach(() => {
    getParentUuidMock.mockResolvedValue('parentUuid' as FolderUuid);
    getFolderByNameMock.mockResolvedValue({});
  });

  it('should catch in case of error', async () => {
    // Given
    getParentUuidMock.mockImplementation(() => {
      throw new Error();
    });
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
    calls(unlinkFileMock).toHaveLength(0);
  });

  it('should unlink file', async () => {
    // Given
    getFileByNameMock.mockResolvedValue({ data: { uuid: 'uuid' as FileUuid } });
    // When
    await onUnlink(props);
    // Then
    call(unlinkFileMock).toMatchObject({ path: '/parent/file.txt', uuid: 'uuid' });
  });
});
