import { deepMocked, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { onAddDir } from './on-add-dir.service';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { FolderUuid } from '@/context/virtual-drive/folders/domain/FolderPlaceholderId';
import { moveFolder } from '@/backend/features/local-sync/watcher/events/rename-or-move/move-folder';
import * as trackAddDirEvent from '@/backend/features/local-sync/watcher/events/unlink/is-move-event';

vi.mock(import('@/infra/node-win/node-win.module'));
vi.mock(import('@/backend/features/local-sync/watcher/events/rename-or-move/move-folder'));

describe('on-add-dir', () => {
  const getFolderUuidMock = deepMocked(NodeWin.getFolderUuid);
  const moveFolderMock = vi.mocked(moveFolder);
  const trackAddDirEventMock = partialSpyOn(trackAddDirEvent, 'trackAddDirEvent');

  let props: Parameters<typeof onAddDir>[0];

  beforeEach(() => {
    props = mockProps<typeof onAddDir>({
      absolutePath: 'C:\\Users\\user\\drive\\folder' as AbsolutePath,
      self: {
        queueManager: { enqueue: vi.fn() },
        logger: loggerMock,
        callbacks: { addController: { createFolder: vi.fn() } },
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
    expect(props.self.callbacks.addController.createFolder).toBeCalledWith(
      expect.objectContaining({
        path: '/drive/folder',
      }),
    );
  });

  it('should call moveFolder if the folder is moved', async () => {
    // Given
    getFolderUuidMock.mockReturnValueOnce({ data: 'uuid' as FolderUuid });

    // When
    await onAddDir(props);

    // Then
    expect(trackAddDirEventMock).toBeCalledWith({ uuid: 'uuid' });
    expect(moveFolderMock).toBeCalledWith(
      expect.objectContaining({
        path: '/drive/folder',
        uuid: 'uuid',
      }),
    );
  });
});
