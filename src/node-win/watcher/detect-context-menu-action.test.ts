import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { DetectContextMenuActionService } from './detect-context-menu-action.service';
import { mockDeep } from 'vitest-mock-extended';
import VirtualDrive from '../virtual-drive';
import { PinState } from '../types/placeholder.type';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { AbsolutePath, createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as handleDehydrate from '@/apps/sync-engine/callbacks/handle-dehydrate';

describe('detect-context-menu-action', () => {
  const getFileUuidMock = partialSpyOn(NodeWin, 'getFileUuid');
  const handleDehydrateMock = partialSpyOn(handleDehydrate, 'handleDehydrate');
  const virtualDrive = mockDeep<VirtualDrive>();
  const service = new DetectContextMenuActionService();

  let props: Parameters<typeof service.execute>[0];

  beforeEach(() => {
    getFileUuidMock.mockReturnValue({ data: 'uuid' as FileUuid });
    props = mockProps<typeof service.execute>({
      absolutePath: 'absolutePath' as AbsolutePath,
      path: createRelativePath('file.txt'),
      self: {
        virtualDrive,
        fileInDevice: new Set(),
        logger: loggerMock,
        callbacks: { updateContentsId: vi.fn() },
        queueManager: { enqueue: vi.fn() },
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
    props.details.curr.mtimeMs = 2;
    // When
    await service.execute(props);
    // Then
    expect(props.self.fileInDevice.has(props.absolutePath)).toBe(true);
    expect(props.self.callbacks.updateContentsId).toBeCalledWith({
      stats: props.details.curr,
      path: props.path,
      uuid: 'uuid',
    });
  });

  it('should dehydrate when pin state is online only', async () => {
    // Given
    props.self.fileInDevice.add(props.absolutePath);
    virtualDrive.getPlaceholderState.mockReturnValue({ pinState: PinState.OnlineOnly });
    // When
    await service.execute(props);
    // Then
    expect(props.self.fileInDevice.has(props.absolutePath)).toBe(false);
    expect(props.self.queueManager.enqueue).toBeCalledTimes(0);
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
      await service.execute(props);
      // Then
      expect(props.self.fileInDevice.has(props.absolutePath)).toBe(true);
      expect(props.self.queueManager.enqueue).toBeCalledWith({ path: props.path });
    });

    it('should not enqueue file for hydrate if blocks is not 0', async () => {
      // Given
      props.details.curr.blocks = 1;
      // When
      const action = await service.execute(props);
      // Then
      expect(props.self.fileInDevice.has(props.absolutePath)).toBe(true);
      expect(props.self.queueManager.enqueue).toBeCalledTimes(0);
      expect(action).toBe('Doble click en el archivo');
    });

    it('should not enqueue file for hydrate if file is the device', async () => {
      // Given
      props.self.fileInDevice.add(props.absolutePath);
      // When
      await service.execute(props);
      // Then
      expect(props.self.fileInDevice.has(props.absolutePath)).toBe(true);
      expect(props.self.queueManager.enqueue).toBeCalledTimes(0);
    });
  });
});
