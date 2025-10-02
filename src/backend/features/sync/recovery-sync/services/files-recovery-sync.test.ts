import { calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { filesRecoverySync } from './files-recovery-sync';
import { DriveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import * as getItemsToSyncModule from './get-items-to-sync';
import * as getDeletedItemsModule from './get-deleted-items';
import * as createOrUpdateFileModule from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';
import * as getLocalFilesModule from './get-local-files';

describe('files-recovery-sync', () => {
  const getFilesMock = partialSpyOn(DriveServerWipModule.FileModule, 'getFiles');
  const getLocalFilesMock = partialSpyOn(getLocalFilesModule, 'getLocalFiles');
  const getItemsToSyncMock = partialSpyOn(getItemsToSyncModule, 'getItemsToSync');
  const getDeletedItemsMock = partialSpyOn(getDeletedItemsModule, 'getDeletedItems');
  const createOrUpdateFileMock = partialSpyOn(createOrUpdateFileModule, 'createOrUpdateFile');
  const moveMock = partialSpyOn(DriveServerWipModule.FileModule, 'move');

  const props = mockProps<typeof filesRecoverySync>({ ctx: {} });

  beforeEach(() => {
    getFilesMock.mockResolvedValue({ data: [{ uuid: 'uuid' as FileUuid }] });
    getLocalFilesMock.mockResolvedValue([{ uuid: 'uuid' as FileUuid }]);
    getItemsToSyncMock.mockReturnValue([{ uuid: 'create' as FileUuid }]);
    getDeletedItemsMock.mockReturnValue([{ uuid: 'deleted' as FileUuid }]);
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
    calls(createOrUpdateFileMock).toMatchObject([{ fileDto: { uuid: 'create' } }]);
    calls(moveMock).toMatchObject([{ uuid: 'deleted' }]);
  });
});
