import { calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { filesRecoverySync } from './files-recovery-sync';
import { DriveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import * as getItemsToSyncModule from './get-items-to-sync';
import * as getItemsToDeleteModule from './get-items-to-delete';
import * as createOrUpdateFileModule from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';

describe('files-recovery-sync', () => {
  const getFilesMock = partialSpyOn(DriveServerWipModule.FileModule, 'getFiles');
  const getByUpdatedAtMock = partialSpyOn(SqliteModule.FileModule, 'getByUpdatedAt');
  const getItemsToSyncMock = partialSpyOn(getItemsToSyncModule, 'getItemsToSync');
  const getItemsToDeleteMock = partialSpyOn(getItemsToDeleteModule, 'getItemsToDelete');
  const createOrUpdateFileMock = partialSpyOn(createOrUpdateFileModule, 'createOrUpdateFile');
  const updateByUuidMock = partialSpyOn(SqliteModule.FileModule, 'updateByUuid');

  const props = mockProps<typeof filesRecoverySync>({ ctx: {} });

  beforeEach(() => {
    getFilesMock.mockResolvedValue({ data: [{ uuid: 'uuid' as FileUuid }] });
    getByUpdatedAtMock.mockResolvedValue({ data: [{ uuid: 'uuid' as FileUuid }] });
    getItemsToSyncMock.mockReturnValue([{ uuid: 'create' as FileUuid }]);
    getItemsToDeleteMock.mockReturnValue([{ uuid: 'delete' as FileUuid }]);
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
    getByUpdatedAtMock.mockResolvedValue({});
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
    calls(createOrUpdateFileMock).toMatchObject([{ fileDto: { uuid: 'create' } }]);
    calls(updateByUuidMock).toMatchObject([{ uuid: 'delete', payload: { status: 'DELETED' } }]);
  });
});
