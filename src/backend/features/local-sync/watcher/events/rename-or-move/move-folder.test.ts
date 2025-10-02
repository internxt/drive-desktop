import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { deepMocked, mockProps } from '@/tests/vitest/utils.helper.test';
import { moveItem } from './move-item';
import { moveFolder } from './move-folder';

vi.mock(import('@/infra/sqlite/ipc/ipc-renderer'));
vi.mock(import('./move-item'));

describe('move-folder', () => {
  const invokeMock = deepMocked(ipcRendererSqlite.invoke);
  const moveItemMock = deepMocked(moveItem);

  let props: Parameters<typeof moveFolder>[0];

  beforeEach(() => {
    props = mockProps<typeof moveFolder>({});
  });

  it('should retrieve old name and old parent uuid if folder exists in sqlite', async () => {
    // Given
    invokeMock.mockResolvedValue({ data: { name: 'plainName', parentUuid: 'folderUuid' } });
    // When
    await moveFolder(props);
    // Then
    expect(moveItemMock).toBeCalledWith(
      expect.objectContaining({
        type: 'folder',
        item: {
          name: 'plainName',
          ParentUuid: 'folderUuid',
        },
      }),
    );
  });

  it('should call with undefined if folder does not exist in sqlite', async () => {
    // Given
    invokeMock.mockResolvedValue({ data: undefined });
    // When
    await moveFolder(props);
    // Then
    expect(moveItemMock).toBeCalledWith(
      expect.objectContaining({
        type: 'folder',
        item: undefined,
      }),
    );
  });
});
