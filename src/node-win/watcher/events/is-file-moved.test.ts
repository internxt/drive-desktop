import { ipcRendererSQLite } from '@/infra/sqlite/ipc/ipc-renderer';
import { deepMocked, mockProps } from '@/tests/vitest/utils.helper.test';
import { isItemMoved } from './is-item-moved';
import { isFileMoved } from './is-file-moved';

vi.mock(import('@/infra/sqlite/ipc/ipc-renderer'));
vi.mock(import('./is-item-moved'));

describe('is-file-moved', () => {
  const invokeMock = deepMocked(ipcRendererSQLite.invoke);
  const isItemMovedMock = deepMocked(isItemMoved);

  let props: Parameters<typeof isFileMoved>[0];

  beforeEach(() => {
    vi.clearAllMocks();
    props = mockProps<typeof isFileMoved>({});
  });

  it('should retrieve old name and old parent uuid if file exists in sqlite', async () => {
    // Given
    invokeMock.mockResolvedValue({
      plainName: 'plainName',
      folderUuid: 'folderUuid',
      type: 'exe',
    });

    // When
    await isFileMoved(props);

    // Then
    expect(isItemMovedMock).toBeCalledWith(
      expect.objectContaining({
        oldName: 'plainName.exe',
        oldParentUuid: 'folderUuid',
        type: 'file',
      }),
    );
  });

  it('should call with undefined if file does not exist in sqlite', async () => {
    // Given
    invokeMock.mockResolvedValue(null);

    // When
    await isFileMoved(props);

    // Then
    expect(isItemMovedMock).toBeCalledWith(
      expect.objectContaining({
        oldName: undefined,
        oldParentUuid: undefined,
        type: 'file',
      }),
    );
  });
});
