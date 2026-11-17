import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { LocalSync } from '@/backend/features';
import * as createOrUpdateFile from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import * as findPlaceholderByUuid from '@/node-win/watcher/events/find-placeholder-by-uuid';
import { loggerFn, loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, partialSpyOn, TestProps } from '@/tests/vitest/utils.helper.test';
import { persistMoveFile } from './ipc-main';

describe('persist-move-file', () => {
  const moveMock = partialSpyOn(driveServerWip.files, 'move');
  const getByNameMock = partialSpyOn(SqliteModule.FileModule, 'getByName');
  const findPlaceholderByUuidMock = partialSpyOn(findPlaceholderByUuid, 'findPlaceholderByUuid');
  const deleteFileByUuidMock = partialSpyOn(driveServerWip.storage, 'deleteFileByUuid');
  partialSpyOn(SqliteModule.FileModule, 'updateByUuid');
  partialSpyOn(createOrUpdateFile, 'createOrUpdateFile');
  partialSpyOn(LocalSync.SyncState, 'addItem');

  const path = abs('/folder/plano.bak');
  const props: TestProps<typeof persistMoveFile> = {
    ctx: { logger: loggerMock },
    path,
    uuid: 'document' as FileUuid,
    parentUuid: 'parent' as FolderUuid,
    action: 'rename',
  };

  const nameTaken = { error: { code: 'FILE_ALREADY_EXISTS' } };

  beforeEach(() => {
    moveMock.mockResolvedValueOnce(nameTaken as any).mockResolvedValueOnce({ data: {} } as any);
    getByNameMock.mockResolvedValue({ data: { uuid: 'old-backup' } } as any);
    findPlaceholderByUuidMock.mockResolvedValue({ data: undefined });
    deleteFileByUuidMock.mockResolvedValue({ data: true } as any);
  });

  it('should trash the file that keeps the name when it is missing locally and move again', async () => {
    // When
    await persistMoveFile(props as any);
    // Then
    call(findPlaceholderByUuidMock).toStrictEqual({ folder: abs('/folder'), uuid: 'old-backup' });
    call(loggerFn).toMatchObject({ msg: 'Trashing remote file missing locally that blocks a move', uuid: 'old-backup' });
    call(deleteFileByUuidMock).toMatchObject({ context: { uuid: 'old-backup' } });
    calls(moveMock).toHaveLength(2);
  });

  it('should not trash the file that keeps the name when it is still local', async () => {
    // Given
    findPlaceholderByUuidMock.mockResolvedValue({ data: abs('/folder/other.dwg') });
    // When
    await persistMoveFile(props as any);
    // Then
    calls(deleteFileByUuidMock).toHaveLength(0);
    calls(moveMock).toHaveLength(1);
  });

  it('should not trash the file that keeps the name when the folder cannot be checked', async () => {
    // Given
    findPlaceholderByUuidMock.mockResolvedValue({ error: new Error('Cannot read folder') });
    // When
    await persistMoveFile(props as any);
    // Then
    calls(deleteFileByUuidMock).toHaveLength(0);
    calls(moveMock).toHaveLength(1);
  });

  it('should not trash a file this device does not know', async () => {
    // Given
    getByNameMock.mockResolvedValue({});
    // When
    await persistMoveFile(props as any);
    // Then
    calls(findPlaceholderByUuidMock).toHaveLength(0);
    calls(deleteFileByUuidMock).toHaveLength(0);
  });

  it('should not trash the file being moved', async () => {
    // Given
    getByNameMock.mockResolvedValue({ data: { uuid: 'document' } } as any);
    // When
    await persistMoveFile(props as any);
    // Then
    calls(deleteFileByUuidMock).toHaveLength(0);
  });

  it('should not look for the file that keeps the name when the move works', async () => {
    // Given
    moveMock.mockReset().mockResolvedValue({ data: {} } as any);
    // When
    await persistMoveFile(props as any);
    // Then
    calls(getByNameMock).toHaveLength(0);
    calls(moveMock).toHaveLength(1);
  });
});
