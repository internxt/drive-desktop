import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { updateFolderStatuses } from './update-folder-statuses';
import * as fetchFoldersByFolder from './fetch-folders-by-folder';
import * as updateItems from './update-items/update-items';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

describe('update-folder-statuses', () => {
  const fetchFoldersByFolderMock = partialSpyOn(fetchFoldersByFolder, 'fetchFoldersByFolder');
  const getByUuidsMock = partialSpyOn(SqliteModule.FolderModule, 'getByUuids');
  const updateItemsMock = partialSpyOn(updateItems, 'updateItems');

  const props = mockProps<typeof updateFolderStatuses>({ path: createRelativePath('/') });

  it('should call update items', async () => {
    // Given
    fetchFoldersByFolderMock.mockResolvedValue([{ uuid: 'uuid' as FolderUuid, plainName: 'folder' }]);
    getByUuidsMock.mockResolvedValue({ data: [{ uuid: 'uuid' as FolderUuid }] });
    // When
    await updateFolderStatuses(props);
    // Then
    expect(updateItemsMock).toBeCalledTimes(1);
  });

  it('should catch exceptions', async () => {
    // Given
    fetchFoldersByFolderMock.mockRejectedValue(new Error());
    // When
    await updateFolderStatuses(props);
    // Then
    expect(updateItemsMock).toBeCalledTimes(0);
    expect(loggerMock.error).toBeCalledTimes(1);
  });
});
