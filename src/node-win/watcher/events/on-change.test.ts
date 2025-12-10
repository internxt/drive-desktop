import { call, calls, deepMocked, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as handleDehydrate from '@/apps/sync-engine/callbacks/handle-dehydrate';
import * as updateContentsId from '@/apps/sync-engine/callbacks-controllers/controllers/update-contents-id';
import * as throttleHydrate from '@/apps/sync-engine/callbacks/handle-hydrate';
import { onChange } from './on-change';
import { stat } from 'node:fs/promises';
import { PinState } from '@/node-win/types/placeholder.type';

vi.mock(import('node:fs/promises'));

describe('on-change', () => {
  const statMock = deepMocked(stat);
  const getFileInfoMock = partialSpyOn(NodeWin, 'getFileInfo');
  const handleDehydrateMock = partialSpyOn(handleDehydrate, 'handleDehydrate');
  const throttleHydrateMock = partialSpyOn(throttleHydrate, 'throttleHydrate');
  const updateContentsIdMock = partialSpyOn(updateContentsId, 'updateContentsId');

  const path = abs('/file.txt');
  let props: Parameters<typeof onChange>[0];

  beforeEach(() => {
    props = mockProps<typeof onChange>({ path });
  });

  it('should skip if directory', async () => {
    // Given
    statMock.mockResolvedValue({ isDirectory: () => true });
    // When
    await onChange(props);
    // Then
    calls(getFileInfoMock).toHaveLength(0);
  });

  it('should update contents id when file is modified and hydrated', async () => {
    // Given
    statMock.mockResolvedValue({ isDirectory: () => false, mtimeMs: Date.now() });
    getFileInfoMock.mockResolvedValue({ data: { pinState: PinState.AlwaysLocal } });
    // When
    await onChange(props);
    // Then
    call(updateContentsIdMock).toMatchObject({ path });
  });

  describe('what happens when dehydrate event', () => {
    beforeEach(() => {
      getFileInfoMock.mockResolvedValue({ data: { uuid: 'uuid' as FileUuid, pinState: PinState.OnlineOnly } });
    });

    it('should dehydrate when current blocks are not 0', async () => {
      // Given
      statMock.mockResolvedValue({ isDirectory: () => false, ctimeMs: Date.now(), blocks: 1 });
      // When
      await onChange(props);
      // Then
      call(handleDehydrateMock).toMatchObject({ path: props.path });
    });

    it('should not dehydrate when current blocks are 0', async () => {
      // Given
      statMock.mockResolvedValue({ isDirectory: () => false, ctimeMs: Date.now(), blocks: 0 });
      // When
      await onChange(props);
      // Then
      calls(handleDehydrateMock).toHaveLength(0);
    });
  });

  describe('what happens when hydrate event', () => {
    beforeEach(() => {
      getFileInfoMock.mockResolvedValue({ data: { uuid: 'uuid' as FileUuid, pinState: PinState.AlwaysLocal } });
    });

    it('should hydrate when current blocks are 0', async () => {
      // Given
      statMock.mockResolvedValue({ isDirectory: () => false, ctimeMs: Date.now(), blocks: 0 });
      // When
      await onChange(props);
      // Then
      call(throttleHydrateMock).toMatchObject({ path: props.path });
    });

    it('should not hydrate when current blocks are not 0', async () => {
      // Given
      statMock.mockResolvedValue({ isDirectory: () => false, ctimeMs: Date.now(), blocks: 1 });
      // When
      await onChange(props);
      // Then
      calls(throttleHydrateMock).toHaveLength(0);
    });
  });
});
