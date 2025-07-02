import { typeQueue } from '@/node-win/queue/queueManager';
import { deepMocked, mockProps } from '@/tests/vitest/utils.helper.test';
import { onAddDir } from './on-add-dir.service';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { isFolderMoved } from './is-folder-moved';

vi.mock(import('@/infra/node-win/node-win.module'));
vi.mock(import('./is-folder-moved'));

describe('on-add-dir', () => {
  const getFolderUuidMock = deepMocked(NodeWin.getFolderUuid);
  const isFolderMovedMock = vi.mocked(isFolderMoved);

  const date1 = new Date();
  const date2 = new Date(date1.getTime() + 1);

  let props: Parameters<typeof onAddDir>[0];

  beforeEach(() => {
    vi.clearAllMocks();
    props = mockProps<typeof onAddDir>({
      absolutePath: 'C:\\Users\\user\\drive\\folder' as AbsolutePath,
      stats: { birthtime: date1, mtime: date2 },
      self: {
        queueManager: { enqueue: vi.fn() },
        logger: loggerMock,
        virtualDrive: { syncRootPath: 'C:\\Users\\user' },
      },
    });
  });

  it('should enqueue a task if the folder is new', async () => {
    // Given
    getFolderUuidMock.mockReturnValueOnce({ data: undefined });

    // When
    await onAddDir(props);

    // Then
    expect(props.self.queueManager.enqueue).toBeCalledWith({
      path: '/drive/folder',
      type: typeQueue.add,
      isFolder: true,
    });
  });

  it('should call isFolderMoved if the folder is moved', async () => {
    // Given
    getFolderUuidMock.mockReturnValueOnce({ data: 'parentUuid' });
    props.stats.birthtime = date1;
    props.stats.mtime = date2;

    // When
    await onAddDir(props);

    // Then
    expect(isFolderMovedMock).toBeCalledWith(
      expect.objectContaining({
        path: '/drive/folder',
        uuid: 'parentUuid',
      }),
    );
  });

  it('should not do anything if the folder is added from remote', async () => {
    // Given
    getFolderUuidMock.mockReturnValueOnce({ data: 'parentUuid' });
    props.stats.birthtime = date1;
    props.stats.mtime = date1;

    // When
    await onAddDir(props);

    // Then
    expect(props.self.queueManager.enqueue).not.toBeCalled();
    expect(isFolderMovedMock).not.toBeCalled();
  });
});
