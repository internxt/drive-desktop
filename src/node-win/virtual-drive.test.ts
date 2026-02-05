import { v4 } from 'uuid';

import { addon } from '@/node-win/addon';

import { iconPath } from '@/apps/utils/icon';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { INTERNXT_VERSION } from '@/core/utils/utils';
import { call, deepMocked, mockProps } from '@/tests/vitest/utils.helper.test';
import { Addon } from './addon-wrapper';
import { fetchDataFn, getDriveContexts } from './callbacks';
import { InSyncState, PinState } from './types/placeholder.type';

vi.mock(import('@/node-win/addon'));

describe('addon', () => {
  const getRegisteredSyncRootsMock = deepMocked(addon.getRegisteredSyncRoots);
  const getPlaceholderStateMock = deepMocked(addon.getPlaceholderState);
  const watchPathMock = deepMocked(addon.watchPath);

  it('should call addon.registerSyncRoot', async () => {
    // Given
    const rootPath = abs('C:/Users/user/InternxtDrive');
    const providerId = v4();
    const providerName = 'InternxtDrive';
    // When
    await Addon.registerSyncRoot({ rootPath, providerId, providerName });
    // Then
    call(addon.registerSyncRoot).toStrictEqual([
      String.raw`C:\Users\user\InternxtDrive`,
      providerName,
      INTERNXT_VERSION,
      providerId,
      iconPath,
    ]);
  });

  it('should call addon.getRegisteredSyncRoots', () => {
    // Given
    getRegisteredSyncRootsMock.mockReturnValue([]);
    // When
    Addon.getRegisteredSyncRoots();
    // Then
    call(addon.getRegisteredSyncRoots).toStrictEqual([]);
  });

  it('should call addon.connectSyncRoot', () => {
    // Given
    const rootPath = abs('C:/Users/user/InternxtDrive');
    const props = mockProps<typeof Addon.connectSyncRoot>({ ctx: { rootPath } });
    // When
    Addon.connectSyncRoot(props);
    // Then
    call(addon.connectSyncRoot).toStrictEqual([String.raw`C:\Users\user\InternxtDrive`, fetchDataFn]);
    expect(getDriveContexts()).toMatchObject([{ rootPath }]);
  });

  it('should call addon.getRegisteredSyncRoots', async () => {
    // Given
    const providerId = v4();
    // When
    await Addon.unregisterSyncRoot({ providerId });
    // Then
    call(addon.unregisterSyncRoot).toStrictEqual(providerId);
  });

  it('should call addon.disconnectSyncRoot', async () => {
    // When
    await Addon.disconnectSyncRoot({ connectionKey: 1n });
    // Then
    call(addon.disconnectSyncRoot).toStrictEqual(1n);
  });

  it('should call addon.getPlaceholderState', async () => {
    // Given
    getPlaceholderStateMock.mockResolvedValue({
      uuid: 'uuid',
      placeholderId: 'FILE:uuid',
      inSyncState: InSyncState.Sync,
      pinState: PinState.AlwaysLocal,
      onDiskSize: 1,
    });
    // When
    await Addon.getPlaceholderState({ path: abs('/parent/file.txt') });
    // Then
    call(addon.getPlaceholderState).toStrictEqual(String.raw`\\?\\parent\file.txt`);
  });

  it('should call addon.updatePlaceholder', async () => {
    // When
    await Addon.updatePlaceholder({ path: abs('/parent/file.txt'), placeholderId: 'FILE:uuid', size: 1 });
    // Then
    call(addon.updatePlaceholder).toStrictEqual([String.raw`\\?\\parent\file.txt`, 'FILE:uuid', 1]);
  });

  it('should call addon.setPinState', async () => {
    // When
    await Addon.setPinState({ path: abs('/parent/file.txt'), pinState: PinState.AlwaysLocal });
    // Then
    call(addon.setPinState).toStrictEqual([String.raw`\\?\\parent\file.txt`, PinState.AlwaysLocal]);
  });

  it('should call addon.createFilePlaceholder', async () => {
    // Given
    const creationTime = new Date('2000-01-01T00:00:00Z').getTime();
    const lastWriteTime = new Date('2000-01-02T00:00:00Z').getTime();
    // When
    await Addon.createFilePlaceholder({
      placeholderId: 'FILE:uuid',
      path: abs('/parent/file.txt'),
      creationTime,
      lastWriteTime,
      size: 1024,
    });
    // Then
    call(addon.createFilePlaceholder).toStrictEqual([String.raw`\\?\\parent\file.txt`, 'FILE:uuid', 1024, 946684800000, 946771200000]);
  });

  it('should call addon.createFolderPlaceholder', async () => {
    // Given
    const creationTime = new Date('2000-01-01T00:00:00Z').getTime();
    const lastWriteTime = new Date('2000-01-02T00:00:00Z').getTime();
    // When
    await Addon.createFolderPlaceholder({
      placeholderId: 'FOLDER:uuid',
      path: abs('/parent/folder'),
      creationTime,
      lastWriteTime,
    });
    // Then
    call(addon.createFolderPlaceholder).toStrictEqual([String.raw`\\?\\parent\folder`, 'FOLDER:uuid', 946684800000, 946771200000]);
  });

  it('should call addon.updateSyncStatus', async () => {
    // When
    await Addon.updateSyncStatus({ path: abs('/parent/file.txt') });
    // Then
    call(addon.updateSyncStatus).toStrictEqual(String.raw`\\?\\parent\file.txt`);
  });

  it('should call addon.convertToPlaceholder', async () => {
    // When
    await Addon.convertToPlaceholder({ path: abs('/parent/file.txt'), placeholderId: 'FILE:uuid' });
    // Then
    call(addon.convertToPlaceholder).toStrictEqual([String.raw`\\?\\parent\file.txt`, 'FILE:uuid']);
  });

  it('should call addon.hydrateFile', async () => {
    // When
    await Addon.hydrateFile({ path: abs('/parent/file.txt') });
    // Then
    call(addon.hydrateFile).toStrictEqual(String.raw`\parent\file.txt`);
  });

  it('should call addon.dehydrateFile', async () => {
    // When
    await Addon.dehydrateFile({ path: abs('/parent/file.txt') });
    // Then
    call(addon.dehydrateFile).toStrictEqual(String.raw`\parent\file.txt`);
  });

  it('should call addon.watchPath', () => {
    // Given
    watchPathMock.mockReturnValue({});
    const rootPath = abs('C:/Users/user/InternxtDrive');
    const onEvent = vi.fn();
    const props = mockProps<typeof Addon.watchPath>({ ctx: { rootPath }, onEvent });
    // When
    Addon.watchPath(props);
    // Then
    call(addon.watchPath).toStrictEqual([String.raw`C:\Users\user\InternxtDrive`, onEvent]);
  });

  it('should call addon.unwatchPath', () => {
    // When
    Addon.unwatchPath({ handle: {} });
    // Then
    call(addon.unwatchPath).toStrictEqual({});
  });
});
