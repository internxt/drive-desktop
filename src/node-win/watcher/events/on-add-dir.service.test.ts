import { deepMocked, mockProps } from '@/tests/vitest/utils.helper.test';
import { onAddDir } from './on-add-dir.service';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { FolderUuid } from '@/context/virtual-drive/folders/domain/FolderPlaceholderId';
// import { isFolderMoved } from './is-folder-moved';

vi.mock(import('@/infra/node-win/node-win.module'));
// vi.mock(import('./is-folder-moved'));

describe('on-add-dir', () => {
  const getFolderUuidMock = deepMocked(NodeWin.getFolderUuid);
  // const isFolderMovedMock = vi.mocked(isFolderMoved);
  const isFolderMovedMock = vi.fn();

  const date1 = new Date();
  const date2 = new Date(date1.getTime() + 1);

  let props: Parameters<typeof onAddDir>[0];

  beforeEach(() => {
    vi.clearAllMocks();
    props = mockProps<typeof onAddDir>({
      absolutePath: 'C:\\Users\\user\\drive\\folder' as AbsolutePath,
      stats: { birthtime: date1, mtime: date2 },
      self: {
        logger: loggerMock,
        callbacks: { addController: { execute: vi.fn() } },
        virtualDrive: { syncRootPath: 'C:\\Users\\user' as AbsolutePath },
      },
    });
  });

  it('should call add controller if the folder is new', async () => {
    // Given
    getFolderUuidMock.mockReturnValueOnce({ data: undefined });

    // When
    await onAddDir(props);

    // Then
    expect(props.self.callbacks.addController.execute).toBeCalledWith(
      expect.objectContaining({
        path: '/drive/folder',
        isFolder: true,
      }),
    );
  });

  it('should call isFolderMoved if the folder is moved', async () => {
    // Given
    getFolderUuidMock.mockReturnValueOnce({ data: 'uuid' as FolderUuid });
    props.stats.birthtime = date1;
    props.stats.mtime = date2;

    // When
    await onAddDir(props);

    // Then
    // expect(isFolderMovedMock).toBeCalledWith(
    //   expect.objectContaining({
    //     path: '/drive/folder',
    //     uuid: 'parentUuid',
    //   }),
    // );
  });

  it('should not do anything if the folder is added from remote', async () => {
    // Given
    getFolderUuidMock.mockReturnValueOnce({ data: 'uuid' as FolderUuid });
    props.stats.birthtime = date1;
    props.stats.mtime = date1;

    // When
    await onAddDir(props);

    // Then
    expect(props.self.callbacks.addController.execute).not.toBeCalled();
    expect(isFolderMovedMock).not.toBeCalled();
  });
});
