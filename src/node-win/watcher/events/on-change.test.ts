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
    calls(handleDehydrateMock).toHaveLength(0);
    calls(throttleHydrateMock).toHaveLength(0);
  });

  it('should hydrate when ctime is modified and current current blocks are 0', async () => {
    // Given
    statMock.mockResolvedValue({ isDirectory: () => false, ctimeMs: Date.now(), blocks: 0 });
    getFileInfoMock.mockResolvedValue({ data: { uuid: 'uuid' as FileUuid, pinState: PinState.AlwaysLocal } });
    // When
    await onChange(props);
    // Then
    calls(updateContentsId).toHaveLength(0);
    calls(handleDehydrateMock).toHaveLength(0);
    call(throttleHydrateMock).toMatchObject({ path: props.path });
  });

  it('should dehydrate when ctime is modified and current blocks are not 0', async () => {
    // Given
    statMock.mockResolvedValue({ isDirectory: () => false, ctimeMs: Date.now(), blocks: 1 });
    getFileInfoMock.mockResolvedValue({ data: { uuid: 'uuid' as FileUuid, pinState: PinState.OnlineOnly } });
    // When
    await onChange(props);
    // Then
    calls(updateContentsId).toHaveLength(0);
    call(handleDehydrateMock).toMatchObject({ path: props.path });
    calls(throttleHydrateMock).toHaveLength(0);
  });
});
