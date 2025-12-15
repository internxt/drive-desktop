import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as moveItemModule from './move-item';
import { moveFolder } from './move-folder';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

describe('move-folder', () => {
  const getByUuidMock = partialSpyOn(SqliteModule.FolderModule, 'getByUuid');
  const moveItemMock = partialSpyOn(moveItemModule, 'moveItem');

  let props: Parameters<typeof moveFolder>[0];

  beforeEach(() => {
    props = mockProps<typeof moveFolder>({});
  });

  it('should move if folder exists', async () => {
    // Given
    getByUuidMock.mockResolvedValue({ data: {} });
    // When
    await moveFolder(props);
    // Then
    call(moveItemMock).toMatchObject({ type: 'folder' });
  });

  it('should throw error if folder does not exist', async () => {
    // Given
    getByUuidMock.mockResolvedValue({ error: new Error() });
    // When
    await moveFolder(props);
    // Then
    calls(moveItemMock).toHaveLength(0);
  });
});
