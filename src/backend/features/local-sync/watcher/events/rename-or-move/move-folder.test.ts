import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as moveItemModule from './move-item';
import { moveFolder } from './move-folder';

describe('move-folder', () => {
  const invokeMock = partialSpyOn(ipcRendererSqlite, 'invoke');
  const moveItemMock = partialSpyOn(moveItemModule, 'moveItem');

  let props: Parameters<typeof moveFolder>[0];

  beforeEach(() => {
    props = mockProps<typeof moveFolder>({});
  });

  it('should move if folder exists', async () => {
    // Given
    invokeMock.mockResolvedValue({ data: {} });
    // When
    await moveFolder(props);
    // Then
    call(moveItemMock).toMatchObject({ type: 'folder' });
  });

  it('should throw error if folder does not exist', async () => {
    // Given
    invokeMock.mockResolvedValue({ error: new Error() });
    // When
    await moveFolder(props);
    // Then
    calls(moveItemMock).toHaveLength(0);
  });
});
