import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as moveItemModule from './move-item';
import { moveFile } from './move-file';

describe('move-file', () => {
  const invokeMock = partialSpyOn(ipcRendererSqlite, 'invoke');
  const moveItemMock = partialSpyOn(moveItemModule, 'moveItem');

  let props: Parameters<typeof moveFile>[0];

  beforeEach(() => {
    props = mockProps<typeof moveFile>({});
  });

  it('should move if file exists', async () => {
    // Given
    invokeMock.mockResolvedValue({ data: {} });
    // When
    await moveFile(props);
    // Then
    call(moveItemMock).toMatchObject({ type: 'file' });
  });

  it('should throw error if file does not exist', async () => {
    // Given
    invokeMock.mockResolvedValue({ error: new Error() });
    // When
    await moveFile(props);
    // Then
    calls(moveItemMock).toHaveLength(0);
  });
});
