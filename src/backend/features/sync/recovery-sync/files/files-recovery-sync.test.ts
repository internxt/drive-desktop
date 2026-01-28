import { call, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { filesRecoverySync } from './files-recovery-sync';
import { DriveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import * as getItemsToSyncModule from '../common/get-items-to-sync';
import * as getDeletedItemsModule from '../common/get-deleted-items';
import * as createOrUpdateFilesModule from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';
import * as getLocalFilesModule from './get-local-files';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

describe('files-recovery-sync', () => {
  const getCheckpointMock = partialSpyOn(SqliteModule.CheckpointModule, 'getCheckpoint');
  const getFilesMock = partialSpyOn(DriveServerWipModule.FileModule, 'getFiles');
  const getLocalFilesMock = partialSpyOn(getLocalFilesModule, 'getLocalFiles');
  const getItemsToSyncMock = partialSpyOn(getItemsToSyncModule, 'getItemsToSync');
  const getDeletedItemsMock = partialSpyOn(getDeletedItemsModule, 'getDeletedItems');
  const createOrUpdateFilesMock = partialSpyOn(createOrUpdateFilesModule, 'createOrUpdateFiles');
  const updateByUuidMock = partialSpyOn(SqliteModule.FileModule, 'updateByUuid');

  const props = mockProps<typeof filesRecoverySync>({
    ctx: { abortController: new AbortController() },
  });

  beforeEach(() => {
    getCheckpointMock.mockResolvedValue({ data: { updatedAt: 'datetime' } });
    getFilesMock.mockResolvedValue({ data: [{ uuid: 'uuid' as FileUuid }] });
    getLocalFilesMock.mockResolvedValue([{ uuid: 'uuid' as FileUuid }]);
    getItemsToSyncMock.mockReturnValue([{ uuid: 'create' as FileUuid }]);
    getDeletedItemsMock.mockReturnValue([{ uuid: 'deleted' as FileUuid, parentUuid: 'parentUuid' }]);
  });

  it('should return empty if no checkpoint', async () => {
    // Given
    getCheckpointMock.mockResolvedValue({ data: undefined });
    // When
    const res = await filesRecoverySync(props);
    // Then
    expect(res).toHaveLength(0);
  });

  it('should return empty if no remote files', async () => {
    // Given
    getFilesMock.mockResolvedValue({});
    // When
    const res = await filesRecoverySync(props);
    // Then
    expect(res).toHaveLength(0);
  });

  it('should return empty if no local files', async () => {
    // Given
    getLocalFilesMock.mockResolvedValue(undefined);
    // When
    const res = await filesRecoverySync(props);
    // Then
    expect(res).toHaveLength(0);
  });

  it('should create and update files', async () => {
    // When
    const res = await filesRecoverySync(props);
    // Then
    expect(res).toHaveLength(1);
    call(createOrUpdateFilesMock).toMatchObject({ fileDtos: [{ uuid: 'create' }] });
    call(updateByUuidMock).toStrictEqual({ uuid: 'deleted', payload: { status: 'DELETED' } });
  });
});
