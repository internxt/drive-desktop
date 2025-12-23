import { call, calls, deepMocked, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as handleDehydrate from '@/apps/sync-engine/callbacks/handle-dehydrate';
import * as throttleHydrate from '@/apps/sync-engine/callbacks/handle-hydrate';
import { onChange } from './on-change';
import { stat } from 'node:fs/promises';
import { InSyncState, PinState } from '@/node-win/types/placeholder.type';
import { Drive } from '@/backend/features/drive';

vi.mock(import('node:fs/promises'));

describe('on-change', () => {
  const statMock = deepMocked(stat);
  const getFileInfoMock = partialSpyOn(NodeWin, 'getFileInfo');
  const handleDehydrateMock = partialSpyOn(handleDehydrate, 'handleDehydrate');
  const throttleHydrateMock = partialSpyOn(throttleHydrate, 'throttleHydrate');
  const replaceFileMock = partialSpyOn(Drive.Actions, 'replaceFile');

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

  it('should update contents id when file is modified and not in sync', async () => {
    // Given
    statMock.mockResolvedValue({ isDirectory: () => false, mtimeMs: Date.now() });
    getFileInfoMock.mockResolvedValue({ data: { inSyncState: InSyncState.NotSync } });
    // When
    await onChange(props);
    // Then
    call(replaceFileMock).toMatchObject({ path });
    calls(throttleHydrateMock).toHaveLength(0);
    calls(handleDehydrateMock).toHaveLength(0);
  });

  it('should hydrate when ctime is modified and disk size is 0', async () => {
    // Given
    statMock.mockResolvedValue({ isDirectory: () => false, ctimeMs: Date.now() });
    getFileInfoMock.mockResolvedValue({ data: { pinState: PinState.AlwaysLocal, onDiskSize: 0 } });
    // When
    await onChange(props);
    // Then
    calls(replaceFileMock).toHaveLength(0);
    call(throttleHydrateMock).toMatchObject({ path });
    calls(handleDehydrateMock).toHaveLength(0);
  });

  it('should dehydrate when ctime is modified and disk size is not 0', async () => {
    // Given
    statMock.mockResolvedValue({ isDirectory: () => false, ctimeMs: Date.now() });
    getFileInfoMock.mockResolvedValue({ data: { pinState: PinState.OnlineOnly, onDiskSize: 1 } });
    // When
    await onChange(props);
    // Then
    calls(replaceFileMock).toHaveLength(0);
    calls(throttleHydrateMock).toHaveLength(0);
    call(handleDehydrateMock).toMatchObject({ path });
  });

  it('should dehydrate when ctime is modified and size is 0', async () => {
    // Given
    statMock.mockResolvedValue({ isDirectory: () => false, ctimeMs: Date.now(), size: 0 });
    getFileInfoMock.mockResolvedValue({ data: { pinState: PinState.OnlineOnly } });
    // When
    await onChange(props);
    // Then
    calls(replaceFileMock).toHaveLength(0);
    calls(throttleHydrateMock).toHaveLength(0);
    call(handleDehydrateMock).toMatchObject({ path });
  });
});
