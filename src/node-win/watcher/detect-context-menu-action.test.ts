import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { mockDeep } from 'vitest-mock-extended';
import { VirtualDrive } from '../virtual-drive';
import { PinState } from '../types/placeholder.type';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { AbsolutePath, createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as handleDehydrate from '@/apps/sync-engine/callbacks/handle-dehydrate';
import * as updateContentsId from '@/apps/sync-engine/callbacks-controllers/controllers/update-contents-id';
import * as throttleHydrate from '@/apps/sync-engine/callbacks/handle-hydrate';
import { detectContextMenuAction } from './detect-context-menu-action.service';

describe('detect-context-menu-action', () => {
  const getFileUuidMock = partialSpyOn(NodeWin, 'getFileUuid');
  const handleDehydrateMock = partialSpyOn(handleDehydrate, 'handleDehydrate');
  const updateContentsIdMock = partialSpyOn(updateContentsId, 'updateContentsId');
  const throttleHydrateMock = partialSpyOn(throttleHydrate, 'throttleHydrate');
  const virtualDrive = mockDeep<VirtualDrive>();

  let props: Parameters<typeof detectContextMenuAction>[0];

  beforeEach(() => {
    getFileUuidMock.mockReturnValue({ data: 'uuid' as FileUuid });
    props = mockProps<typeof detectContextMenuAction>({
      ctx: { virtualDrive },
      absolutePath: 'absolutePath' as AbsolutePath,
      path: createRelativePath('file.txt'),
      self: {
        fileInDevice: new Set(),
        logger: loggerMock,
      },
      details: {
        prev: { ctimeMs: 1, mtimeMs: 1 },
        curr: { ctimeMs: 2, mtimeMs: 1 },
      },
    });

    props.self.fileInDevice.clear();
  });

  it('should update contents id when file modification time changes', async () => {
    // Given
    virtualDrive.getPlaceholderState.mockReturnValue({ pinState: PinState.AlwaysLocal });
    props.details.curr.mtimeMs = 2;
    // When
    await detectContextMenuAction(props);
    // Then
    expect(props.self.fileInDevice.has(props.absolutePath)).toBe(true);
    expect(updateContentsIdMock).toBeCalledWith(
      expect.objectContaining({
        stats: props.details.curr,
        path: '/file.txt',
        absolutePath: 'absolutePath',
        uuid: 'uuid',
      }),
    );
  });

  it('should dehydrate when pin state is online only', async () => {
    // Given
    props.self.fileInDevice.add(props.absolutePath);
    virtualDrive.getPlaceholderState.mockReturnValue({ pinState: PinState.OnlineOnly });
    // When
    await detectContextMenuAction(props);
    // Then
    expect(props.self.fileInDevice.has(props.absolutePath)).toBe(false);
    expect(throttleHydrateMock).toBeCalledTimes(0);
    expect(handleDehydrateMock).toBeCalledWith({ drive: virtualDrive, path: props.path });
  });

  describe('what happens when hydrate event', () => {
    beforeEach(() => {
      virtualDrive.getPlaceholderState.mockReturnValue({ pinState: PinState.AlwaysLocal });
    });

    it('should enqueue file for hydrate', async () => {
      // Given
      props.details.curr.blocks = 0;
      // When
      await detectContextMenuAction(props);
      // Then
      expect(props.self.fileInDevice.has(props.absolutePath)).toBe(true);
      expect(throttleHydrateMock).toBeCalledWith(expect.objectContaining({ path: props.path }));
    });

    it('should not enqueue file for hydrate if blocks is not 0', async () => {
      // Given
      props.details.curr.blocks = 1;
      // When
      await detectContextMenuAction(props);
      // Then
      expect(props.self.fileInDevice.has(props.absolutePath)).toBe(true);
      expect(throttleHydrateMock).toBeCalledTimes(0);
      expect(loggerMock.debug).toBeCalledWith({ msg: 'Double click on file', path: props.path });
    });

    it('should not enqueue file for hydrate if file is the device', async () => {
      // Given
      props.self.fileInDevice.add(props.absolutePath);
      // When
      await detectContextMenuAction(props);
      // Then
      expect(props.self.fileInDevice.has(props.absolutePath)).toBe(true);
      expect(throttleHydrateMock).toBeCalledTimes(0);
    });
  });
});
