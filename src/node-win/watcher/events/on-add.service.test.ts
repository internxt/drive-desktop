import { onAdd } from './on-add.service';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { moveFile } from '@/backend/features/local-sync/watcher/events/rename-or-move/move-file';
import * as trackAddFileEvent from '@/backend/features/local-sync/watcher/events/unlink/is-move-event';
import { AddController } from '@/apps/sync-engine/callbacks-controllers/controllers/add-controller';

vi.mock(import('@/infra/node-win/node-win.module'));
vi.mock(import('@/backend/features/local-sync/watcher/events/rename-or-move/move-file'));

describe('on-add', () => {
  const getFileInfoMock = partialSpyOn(NodeWin, 'getFileInfo');
  const moveFileMock = vi.mocked(moveFile);
  const createFileMock = partialSpyOn(AddController, 'createFile');
  const trackAddFileEventMock = partialSpyOn(trackAddFileEvent, 'trackAddFileEvent');

  const absolutePath = 'C:\\Users\\user\\drive\\file.txt' as AbsolutePath;

  let props: Parameters<typeof onAdd>[0];

  beforeEach(() => {
    getFileInfoMock.mockReturnValue({ data: { uuid: 'uuid' as FileUuid } });
    props = mockProps<typeof onAdd>({
      ctx: { virtualDrive: { syncRootPath: 'C:\\Users\\user' as AbsolutePath } },
      absolutePath,
    });
  });

  it('should call add controller if the file is new', async () => {
    // Given
    getFileInfoMock.mockReturnValue({ data: undefined });
    // When
    await onAdd(props);
    // Then
    expect(createFileMock).toBeCalledWith(
      expect.objectContaining({
        path: '/drive/file.txt',
      }),
    );
  });

  it('should call moveFile if the file is moved', async () => {
    // When
    await onAdd(props);
    // Then
    expect(trackAddFileEventMock).toBeCalledWith({ uuid: 'uuid' });
    expect(moveFileMock).toBeCalledWith(
      expect.objectContaining({
        path: '/drive/file.txt',
        uuid: 'uuid',
      }),
    );
  });
});
