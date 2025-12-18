import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as moveItemModule from './move-item';
import { moveFile } from './move-file';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

describe('move-file', () => {
  const getByUuidMock = partialSpyOn(SqliteModule.FileModule, 'getByUuid');
  const moveItemMock = partialSpyOn(moveItemModule, 'moveItem');

  let props: Parameters<typeof moveFile>[0];

  beforeEach(() => {
    props = mockProps<typeof moveFile>({});
  });

  it('should move if file exists', async () => {
    // Given
    getByUuidMock.mockResolvedValue({ data: {} });
    // When
    await moveFile(props);
    // Then
    call(moveItemMock).toMatchObject({ type: 'file' });
  });

  it('should throw error if file does not exist', async () => {
    // Given
    getByUuidMock.mockResolvedValue({ error: new Error() });
    // When
    await moveFile(props);
    // Then
    calls(moveItemMock).toHaveLength(0);
  });
});
