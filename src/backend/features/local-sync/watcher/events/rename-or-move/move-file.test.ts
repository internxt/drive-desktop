import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { deepMocked, mockProps } from '@/tests/vitest/utils.helper.test';
import { moveItem } from './move-item';
import { moveFile } from './move-file';

vi.mock(import('@/infra/sqlite/ipc/ipc-renderer'));
vi.mock(import('./move-item'));

describe('move-file', () => {
  const invokeMock = deepMocked(ipcRendererSqlite.invoke);
  const moveItemMock = deepMocked(moveItem);

  let props: Parameters<typeof moveFile>[0];

  beforeEach(() => {
    vi.clearAllMocks();
    props = mockProps<typeof moveFile>({});
  });

  it('should retrieve old name and old parent uuid if file exists in sqlite', async () => {
    // Given
    invokeMock.mockResolvedValue({
      data: { nameWithExtension: 'plainName.exe', parentUuid: 'folderUuid' },
    });
    // When
    await moveFile(props);
    // Then
    expect(moveItemMock).toBeCalledWith(
      expect.objectContaining({
        type: 'file',
        item: {
          oldName: 'plainName.exe',
          oldParentUuid: 'folderUuid',
        },
      }),
    );
  });

  it('should call with undefined if file does not exist in sqlite', async () => {
    // Given
    invokeMock.mockResolvedValue({ data: undefined });
    // When
    await moveFile(props);
    // Then
    expect(moveItemMock).toBeCalledWith(
      expect.objectContaining({
        type: 'file',
        item: undefined,
      }),
    );
  });
});
