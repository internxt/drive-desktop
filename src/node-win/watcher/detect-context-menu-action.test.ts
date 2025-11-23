import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { mockDeep } from 'vitest-mock-extended';
import { VirtualDrive } from '../virtual-drive';
import { PinState } from '../types/placeholder.type';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as handleDehydrate from '@/apps/sync-engine/callbacks/handle-dehydrate';
import * as updateContentsId from '@/apps/sync-engine/callbacks-controllers/controllers/update-contents-id';
import * as throttleHydrate from '@/apps/sync-engine/callbacks/handle-hydrate';
import { detectContextMenuAction } from './detect-context-menu-action.service';

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
      path: abs('/file.txt'),
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
    call(updateContentsIdMock).toMatchObject({
      stats: props.details.curr,
      path: '/file.txt',
      uuid: 'uuid',
    });
  });

  describe('what happens when dehydrate event', () => {
    beforeEach(() => {
      getFileInfoMock.mockReturnValue({ data: { uuid: 'uuid' as FileUuid, pinState: PinState.OnlineOnly } });
    });

    it('should dehydrate when current blocks are not 0', async () => {
      // Given
      props.details.curr.blocks = 1;
      // When
      await detectContextMenuAction(props);
      // Then
      call(handleDehydrateMock).toMatchObject({ path: props.path });
    });

    it('should not dehydrate when current blocks are 0', async () => {
      // Given
      props.details.curr.blocks = 0;
      // When
      await detectContextMenuAction(props);
      // Then
      calls(handleDehydrateMock).toHaveLength(0);
    });
  });

  describe('what happens when hydrate event', () => {
    beforeEach(() => {
      getFileInfoMock.mockReturnValue({ data: { uuid: 'uuid' as FileUuid, pinState: PinState.AlwaysLocal } });
    });

    it('should hydrate when current blocks are 0', async () => {
      // Given
      props.details.curr.blocks = 0;
      // When
      await detectContextMenuAction(props);
      // Then
      call(throttleHydrateMock).toMatchObject({ path: props.path });
    });

    it('should not hydrate when current blocks are not 0', async () => {
      // Given
      props.details.curr.blocks = 1;
      // When
      await detectContextMenuAction(props);
      // Then
      calls(throttleHydrateMock).toHaveLength(0);
    });
  });
});
