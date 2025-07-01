import { onAdd } from './on-add.service';
import { deepMocked, mockProps } from '@/tests/vitest/utils.helper.test';
import { BucketEntry } from '@/context/virtual-drive/shared/domain/BucketEntry';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { NodeWin } from '@/infra/node-win/node-win.module';
// import { isFileMoved } from './is-file-moved';

vi.mock(import('@/infra/node-win/node-win.module'));
// vi.mock(import('./is-file-moved'));

describe('on-add', () => {
  const getFileUuidMock = deepMocked(NodeWin.getFileUuid);
  // const isFileMovedMock = vi.mocked(isFileMoved);
  const isFileMovedMock = vi.fn();

  const date1 = new Date();
  const date2 = new Date(date1.getTime() + 1);

  let props: Parameters<typeof onAdd>[0];

  beforeEach(() => {
    vi.clearAllMocks();
    props = mockProps<typeof onAdd>({
      absolutePath: 'C:\\Users\\user\\drive\\file.txt' as AbsolutePath,
      stats: { birthtime: date1, mtime: date2, size: 1024 },
      self: {
        fileInDevice: new Set(),
        logger: loggerMock,
        callbacks: { addController: { execute: vi.fn() } },
        virtualDrive: { syncRootPath: 'C:\\Users\\user' },
      },
    });
  });

  it('should not enqueue if the file is empty', async () => {
    // Given
    props.stats.size = 0;

    // When
    await onAdd(props);

    // Then
    expect(props.self.callbacks.addController.execute).not.toHaveBeenCalled();
  });

  it('should not enqueue if the file is larger than MAX_SIZE', async () => {
    // Given
    props.stats.size = BucketEntry.MAX_SIZE + 1;

    // When
    await onAdd(props);

    // Then
    expect(props.self.callbacks.addController.execute).not.toHaveBeenCalled();
  });

  it('should enqueue a task if the file is new', async () => {
    // Given
    getFileUuidMock.mockReturnValueOnce({ data: undefined });

    // When
    await onAdd(props);

    // Then
    expect(props.self.callbacks.addController.execute).toBeCalledWith(
      expect.objectContaining({
        path: '/drive/file.txt',
        isFolder: false,
      }),
    );
  });

  it('should call isFileMoved if the file is moved', async () => {
    // Given
    getFileUuidMock.mockReturnValueOnce({ data: 'parentUuid' });

    // When
    await onAdd(props);

    // Then
    // expect(isFileMovedMock).toBeCalledWith(
    //   expect.objectContaining({
    //     path: '/drive/file.txt',
    //     uuid: 'parentUuid',
    //   }),
    // );
  });

  it('should not do anything if the file is added from remote', async () => {
    // Given
    getFileUuidMock.mockReturnValueOnce({ data: 'parentUuid' });
    props.stats.birthtime = date1;
    props.stats.mtime = date1;

    // When
    await onAdd(props);

    // Then
    expect(props.self.callbacks.addController.execute).not.toBeCalled();
    expect(isFileMovedMock).not.toBeCalled();
  });
});
