import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { updateFileStatuses } from './update-file-statuses';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import * as fetchFilesByFolder from './fetch-files-by-folder';
import * as updateItems from './update-items/update-items';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';

describe('update-file-statuses', () => {
  const fetchFilesByFolderMock = partialSpyOn(fetchFilesByFolder, 'fetchFilesByFolder');
  const getByUuidsMock = partialSpyOn(SqliteModule.FileModule, 'getByUuids');
  const updateItemsMock = partialSpyOn(updateItems, 'updateItems');

  const props = mockProps<typeof updateFileStatuses>({});

  it('should call update items', async () => {
    // Given
    fetchFilesByFolderMock.mockResolvedValue([{ uuid: 'uuid' as FileUuid }]);
    getByUuidsMock.mockResolvedValue({ data: [{ uuid: 'uuid' as FileUuid }] });
    // When
    await updateFileStatuses(props);
    // Then
    expect(updateItemsMock).toBeCalledTimes(1);
  });

  it('should catch exceptions', async () => {
    // Given
    fetchFilesByFolderMock.mockRejectedValue(new Error());
    // When
    await updateFileStatuses(props);
    // Then
    expect(updateItemsMock).toBeCalledTimes(0);
    expect(loggerMock.error).toBeCalledTimes(1);
  });
});
