import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { mockDeep } from 'vitest-mock-extended';
import { VirtualDrive } from '../virtual-drive';
import { PinState } from '../types/placeholder.type';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { createAbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as handleDehydrate from '@/apps/sync-engine/callbacks/handle-dehydrate';
import * as updateContentsId from '@/apps/sync-engine/callbacks-controllers/controllers/update-contents-id';
import * as throttleHydrate from '@/apps/sync-engine/callbacks/handle-hydrate';
import { detectContextMenuAction } from './detect-context-menu-action.service';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

describe('detect-context-menu-action', () => {
  const getFileInfoMock = partialSpyOn(NodeWin, 'getFileInfo');
  const handleDehydrateMock = partialSpyOn(handleDehydrate, 'handleDehydrate');
  const updateContentsIdMock = partialSpyOn(updateContentsId, 'updateContentsId');
  const throttleHydrateMock = partialSpyOn(throttleHydrate, 'throttleHydrate');
  const virtualDrive = mockDeep<VirtualDrive>();

  let props: Parameters<typeof detectContextMenuAction>[0];

  beforeEach(() => {
    props = mockProps<typeof detectContextMenuAction>({
      ctx: { virtualDrive },
      path: '/file.txt' as AbsolutePath,
      details: {
        prev: { ctimeMs: 1, mtimeMs: 1 },
        curr: { ctimeMs: 2, mtimeMs: 1 },
      },
    });
  });

  it('should update contents id when file modification time changes', async () => {
    // Given
    getFileInfoMock.mockReturnValue({ data: { uuid: 'uuid' as FileUuid, pinState: PinState.AlwaysLocal } });
    props.details.curr.mtimeMs = 2;
    // When
    await detectContextMenuAction(props);
    // Then
    expect(updateContentsIdMock).toBeCalledWith(
      expect.objectContaining({
        stats: props.details.curr,
        path: '/file.txt',
        uuid: 'uuid',
      }),
    );
  });

  it('should dehydrate when pin state is online only', async () => {
    // Given
    getFileInfoMock.mockReturnValue({ data: { uuid: 'uuid' as FileUuid, pinState: PinState.OnlineOnly } });
    // When
    await detectContextMenuAction(props);
    // Then
    expect(throttleHydrateMock).toBeCalledTimes(0);
    expect(handleDehydrateMock).toBeCalledWith({ drive: virtualDrive, path: props.path });
  });

  describe('what happens when hydrate event', () => {
    beforeEach(() => {
      getFileInfoMock.mockReturnValue({ data: { uuid: 'uuid' as FileUuid, pinState: PinState.AlwaysLocal } });
    });

    it('should enqueue file for hydrate', async () => {
      // Given
      props.details.curr.blocks = 0;
      // When
      await detectContextMenuAction(props);
      // Then
      expect(throttleHydrateMock).toBeCalledWith(expect.objectContaining({ path: props.path }));
    });

    it('should not enqueue file for hydrate if blocks is not 0', async () => {
      // Given
      props.details.curr.blocks = 1;
      // When
      await detectContextMenuAction(props);
      // Then
      expect(throttleHydrateMock).toBeCalledTimes(0);
      expect(loggerMock.debug).toBeCalledWith({ msg: 'Double click on file', path: props.path });
    });
  });
});
