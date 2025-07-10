import { onAdd } from './on-add.service';
import { deepMocked, mockProps } from '@/tests/vitest/utils.helper.test';
import { BucketEntry } from '@/context/virtual-drive/shared/domain/BucketEntry';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { isTemporaryFile } from '@/apps/utils/isTemporalFile';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { moveFile } from '@/backend/features/local-sync/watcher/events/rename-or-move/move-file';

vi.mock(import('@/infra/node-win/node-win.module'));
vi.mock(import('@/apps/utils/isTemporalFile'));
vi.mock(import('@/backend/features/local-sync/watcher/events/rename-or-move/move-file'));

describe('on-add', () => {
  const getFileUuidMock = deepMocked(NodeWin.getFileUuid);
  const isTemporaryFileMock = vi.mocked(isTemporaryFile);
  const moveFileMock = vi.mocked(moveFile);

  const date1 = new Date();
  const date2 = new Date(date1.getTime() + 1);
  const absolutePath = 'C:\\Users\\user\\drive\\file.txt' as AbsolutePath;

  let props: Parameters<typeof onAdd>[0];

  beforeEach(() => {
    vi.clearAllMocks();
    props = mockProps<typeof onAdd>({
      absolutePath,
      stats: { birthtime: date1, mtime: date2, size: 1024 },
      self: {
        fileInDevice: new Set(),
        logger: loggerMock,
        callbacks: { addController: { execute: vi.fn() } },
        virtualDrive: { syncRootPath: 'C:\\Users\\user' as AbsolutePath },
      },
    });
  });

  it('should not call add controller if the file is empty', async () => {
    // Given
    props.stats.size = 0;

    // When
    await onAdd(props);

    // Then
    expect(props.self.callbacks.addController.execute).not.toHaveBeenCalled();
  });

  it('should not call add controller if the file is larger than MAX_SIZE', async () => {
    // Given
    props.stats.size = BucketEntry.MAX_SIZE + 1;

    // When
    await onAdd(props);

    // Then
    expect(props.self.callbacks.addController.execute).not.toHaveBeenCalled();
  });

  it('should not call add controller if the file is temporary', async () => {
    // Given
    isTemporaryFileMock.mockReturnValueOnce(true);

    // When
    await onAdd(props);

    // Then
    expect(props.self.callbacks.addController.execute).not.toHaveBeenCalled();
  });

  it('should call add controller if the file is new', async () => {
    // Given
    getFileUuidMock.mockReturnValueOnce({ data: undefined });

    // When
    await onAdd(props);

    // Then
    expect(props.self.fileInDevice.has(absolutePath)).toBe(true);
    expect(props.self.callbacks.addController.execute).toBeCalledWith(
      expect.objectContaining({
        path: '/drive/file.txt',
        isFolder: false,
      }),
    );
  });

  it('should call moveFile if the file is moved', async () => {
    // Given
    getFileUuidMock.mockReturnValueOnce({ data: 'uuid' as FileUuid });

    // When
    await onAdd(props);

    // Then
    expect(moveFileMock).toBeCalledWith(
      expect.objectContaining({
        path: '/drive/file.txt',
        uuid: 'uuid',
      }),
    );
  });

  it('should not do anything if the file is added from remote', async () => {
    // Given
    getFileUuidMock.mockReturnValueOnce({ data: 'uuid' as FileUuid });
    props.stats.birthtime = date1;
    props.stats.mtime = date1;

    // When
    await onAdd(props);

    // Then
    expect(props.self.callbacks.addController.execute).not.toBeCalled();
    expect(moveFileMock).not.toBeCalled();
  });
});
