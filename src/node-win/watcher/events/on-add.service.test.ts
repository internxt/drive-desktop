import { onAdd } from './on-add.service';
import { deepMocked, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { moveFile } from '@/backend/features/local-sync/watcher/events/rename-or-move/move-file';
import * as trackAddEvent from '@/backend/features/local-sync/watcher/events/unlink/is-move-event';

vi.mock(import('@/infra/node-win/node-win.module'));
vi.mock(import('@/backend/features/local-sync/watcher/events/rename-or-move/move-file'));

describe('on-add', () => {
  const getFileUuidMock = deepMocked(NodeWin.getFileUuid);
  const moveFileMock = vi.mocked(moveFile);
  const trackAddEventMock = partialSpyOn(trackAddEvent, 'trackAddEvent');

  const date1 = new Date();
  const date2 = new Date(date1.getTime() + 1);
  const absolutePath = 'C:\\Users\\user\\drive\\file.txt' as AbsolutePath;

  let props: Parameters<typeof onAdd>[0];

  beforeEach(() => {
    getFileUuidMock.mockReturnValue({ data: 'uuid' as FileUuid });
    props = mockProps<typeof onAdd>({
      absolutePath,
      stats: { birthtime: date1, mtime: date2, size: 1024 },
      self: {
        fileInDevice: new Set(),
        logger: loggerMock,
        callbacks: { addController: { createFile: vi.fn() } },
        virtualDrive: { syncRootPath: 'C:\\Users\\user' as AbsolutePath },
      },
    });
  });

  it('should call add controller if the file is new', async () => {
    // Given
    getFileUuidMock.mockReturnValue({ data: undefined });
    // When
    await onAdd(props);
    // Then
    expect(props.self.fileInDevice.has(absolutePath)).toBe(true);
    expect(props.self.callbacks.addController.createFile).toBeCalledWith(
      expect.objectContaining({
        path: '/drive/file.txt',
      }),
    );
  });

  it('should call moveFile if the file is moved', async () => {
    // When
    await onAdd(props);
    // Then
    expect(trackAddEventMock).toBeCalledWith({ uuid: 'uuid' });
    expect(moveFileMock).toBeCalledWith(
      expect.objectContaining({
        path: '/drive/file.txt',
        uuid: 'uuid',
      }),
    );
  });

  it('should not do anything if the file is added from remote', async () => {
    // Given
    props.stats.birthtime = date1;
    props.stats.mtime = date1;
    // When
    await onAdd(props);
    // Then
    expect(props.self.callbacks.addController.createFile).not.toBeCalled();
    expect(moveFileMock).not.toBeCalled();
  });
});
