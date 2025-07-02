import { ipcRendererSQLite } from '@/infra/sqlite/ipc/ipc-renderer';
import { deepMocked, mockProps } from '@/tests/vitest/utils.helper.test';
import { isItemMoved } from './is-item-moved';
import { isFolderMoved } from './is-folder-moved';

vi.mock(import('@/infra/sqlite/ipc/ipc-renderer'));
vi.mock(import('./is-item-moved'));

describe('is-folder-moved', () => {
  const invokeMock = deepMocked(ipcRendererSQLite.invoke);
  const isItemMovedMock = deepMocked(isItemMoved);

  let props: Parameters<typeof isFolderMoved>[0];

  beforeEach(() => {
    vi.clearAllMocks();
    props = mockProps<typeof isFolderMoved>({});
  });

  it('should retrieve old name and old parent uuid if folder exists in sqlite', async () => {
    // Given
    invokeMock.mockResolvedValue({
      plainName: 'plainName',
      parentUuid: 'folderUuid',
    });

    // When
    await isFolderMoved(props);

    // Then
    expect(isItemMovedMock).toBeCalledWith(
      expect.objectContaining({
        oldName: 'plainName',
        oldParentUuid: 'folderUuid',
      }),
    );
  });

  it('should call with undefined if folder does not exist in sqlite', async () => {
    // Given
    invokeMock.mockResolvedValue(null);

    // When
    await isFolderMoved(props);

    // Then
    expect(isItemMovedMock).toBeCalledWith(
      expect.objectContaining({
        oldName: undefined,
        oldParentUuid: undefined,
      }),
    );
  });
});
