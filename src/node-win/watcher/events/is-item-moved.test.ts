import { NodeWin } from '@/infra/node-win/node-win.module';
import { GetFolderIdentityError } from '@/infra/node-win/services/item-identity/get-folder-identity';
import { isItemMoved } from './is-item-moved';
import { mockProps } from '@/tests/vitest/utils.helper.test';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

vi.mock(import('@/infra/node-win/node-win.module'));

describe('is-item-moved', () => {
  const getFolderUuidMock = vi.mocked(NodeWin.getFolderUuid);

  let props: Parameters<typeof isItemMoved>[0];

  beforeEach(() => {
    vi.clearAllMocks();
    getFolderUuidMock.mockReturnValue({ data: 'newParentUuid' });
    props = mockProps<typeof isItemMoved>({
      path: createRelativePath('folder1', 'newName.exe'),
      oldName: 'oldName.exe',
      oldParentUuid: 'oldParentUuid',
      self: {
        logger: loggerMock,
        controllers: {
          renameOrMoveController: {
            execute: vi.fn(),
          },
        },
      },
    });
  });

  it('should log error and return if oldName or oldParentUuid is undefined', async () => {
    // Given
    props.oldName = undefined;
    props.oldParentUuid = undefined;

    // When
    await isItemMoved(props);

    // Then
    expect(loggerMock.error).toBeCalledWith(
      expect.objectContaining({
        msg: 'oldName, oldParentUuid or newParentUuid is undefined',
        oldName: props.oldName,
        oldParentUuid: props.oldParentUuid,
      }),
    );
  });

  it('should log error and return if parent placeholder is not found', async () => {
    // Given
    const error = new GetFolderIdentityError('NON_EXISTS');
    getFolderUuidMock.mockReturnValue({ error });

    // When
    await isItemMoved(props);

    // Then
    expect(getFolderUuidMock).toBeCalledWith(expect.objectContaining({ path: '/folder1' }));
    expect(loggerMock.error).toBeCalledWith(expect.objectContaining({ error }));
  });

  it('should log warn and return if item is renamed and moved', async () => {
    // When
    await isItemMoved(props);

    // Then
    expect(loggerMock.warn).toBeCalledWith(
      expect.objectContaining({
        msg: 'Item moved and renamed. Action not permitted',
        oldName: 'oldName.exe',
        newName: 'newName.exe',
        oldParentUuid: 'oldParentUuid',
        newParentUuid: 'newParentUuid',
      }),
    );
  });

  it('should call renameOrMoveController.execute if item is renamed', async () => {
    // Given
    getFolderUuidMock.mockReturnValue({ data: 'oldParentUuid' });

    // When
    await isItemMoved(props);

    // Then
    expect(props.self.controllers?.renameOrMoveController.execute).toBeCalledWith(
      expect.objectContaining({
        action: 'rename',
        path: '/folder1/newName.exe',
      }),
    );
  });

  it('should call renameOrMoveController.execute if item is moved', async () => {
    // Given
    props.path = createRelativePath('folder1', 'oldName.exe');

    // When
    await isItemMoved(props);

    // Then
    expect(props.self.controllers?.renameOrMoveController.execute).toBeCalledWith(
      expect.objectContaining({
        action: 'move',
        path: '/folder1/oldName.exe',
      }),
    );
  });
});
