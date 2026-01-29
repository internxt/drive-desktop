import { call, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { foldersRecoverySync } from './folders-recovery-sync';
import { DriveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import * as getItemsToSyncModule from '../common/get-items-to-sync';
import * as getDeletedItemsModule from '../common/get-deleted-items';
import * as createOrUpdateFoldersModule from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-folder';
import * as getLocalFoldersModule from './get-local-folders';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';

describe('folders-recovery-sync', () => {
  const getCheckpointMock = partialSpyOn(SqliteModule.CheckpointModule, 'getCheckpoint');
  const getFoldersMock = partialSpyOn(DriveServerWipModule.FolderModule, 'getFolders');
  const getLocalFoldersMock = partialSpyOn(getLocalFoldersModule, 'getLocalFolders');
  const getItemsToSyncMock = partialSpyOn(getItemsToSyncModule, 'getItemsToSync');
  const getDeletedItemsMock = partialSpyOn(getDeletedItemsModule, 'getDeletedItems');
  const createOrUpdateFoldersMock = partialSpyOn(createOrUpdateFoldersModule, 'createOrUpdateFolders');
  const updateByUuidMock = partialSpyOn(SqliteModule.FolderModule, 'updateByUuid');

  const props = mockProps<typeof foldersRecoverySync>({
    ctx: { abortController: new AbortController() },
  });

  beforeEach(() => {
    getCheckpointMock.mockResolvedValue({ data: { updatedAt: 'datetime' } });
    getFoldersMock.mockResolvedValue({ data: [{ uuid: 'uuid' as FolderUuid }] });
    getLocalFoldersMock.mockResolvedValue([{ uuid: 'uuid' as FolderUuid }]);
    getItemsToSyncMock.mockReturnValue([{ uuid: 'create' as FileUuid }]);
    getDeletedItemsMock.mockReturnValue([{ uuid: 'deleted' as FileUuid, parentUuid: 'parentUuid' }]);
  });

  it('should return empty if no checkpoint', async () => {
    // Given
    getCheckpointMock.mockResolvedValue({ data: undefined });
    // When
    const res = await foldersRecoverySync(props);
    // Then
    expect(res).toHaveLength(0);
  });

  it('should return empty if no remote folders', async () => {
    // Given
    getFoldersMock.mockResolvedValue({});
    // When
    const res = await foldersRecoverySync(props);
    // Then
    expect(res).toHaveLength(0);
  });

  it('should return empty if no local folders', async () => {
    // Given
    getLocalFoldersMock.mockResolvedValue(undefined);
    // When
    const res = await foldersRecoverySync(props);
    // Then
    expect(res).toHaveLength(0);
  });

  it('should create and update folders', async () => {
    // When
    const res = await foldersRecoverySync(props);
    // Then
    expect(res).toHaveLength(1);
    call(createOrUpdateFoldersMock).toMatchObject({ folderDtos: [{ uuid: 'create' }] });
    call(updateByUuidMock).toStrictEqual({ uuid: 'deleted', payload: { status: 'DELETED' } });
  });
});
