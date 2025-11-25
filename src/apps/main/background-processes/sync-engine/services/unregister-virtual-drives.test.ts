import { call, mockProps, partialSpyOn } from 'tests/vitest/utils.helper.test';
import { unregisterVirtualDrives } from './unregister-virtual-drives';
import { Addon } from '@/node-win/addon-wrapper';

describe('unregister-virtual-drives', () => {
  const getRegisteredSyncRootsMock = partialSpyOn(Addon, 'getRegisteredSyncRoots');
  const unregisterSyncRootMock = partialSpyOn(Addon, 'unregisterSyncRoot');

  let props: Parameters<typeof unregisterVirtualDrives>[0];

  beforeEach(() => {
    getRegisteredSyncRootsMock.mockReturnValue([{ id: '{PROVIDER_ID}', displayName: 'Internxt' }]);
    props = mockProps<typeof unregisterVirtualDrives>({ currentProviderIds: ['{PROVIDER_ID}'] });
  });

  it('should unregister if displayName contains internxt', async () => {
    // Given
    getRegisteredSyncRootsMock.mockReturnValue([{ id: '{OLD_PROVIDER_ID}', displayName: 'Internxt', path: 'Other' }]);
    // When
    await unregisterVirtualDrives(props);
    // Then
    call(unregisterSyncRootMock).toStrictEqual({ providerId: '{OLD_PROVIDER_ID}' });
  });

  it('should unregister if path contains internxt', async () => {
    // Given
    getRegisteredSyncRootsMock.mockReturnValue([{ id: '{OLD_PROVIDER_ID}', displayName: 'Other', path: 'Internxt' }]);
    // When
    await unregisterVirtualDrives(props);
    // Then
    call(unregisterSyncRootMock).toStrictEqual({ providerId: '{OLD_PROVIDER_ID}' });
  });

  it('should ignore if it is not from internxt', async () => {
    // Given
    getRegisteredSyncRootsMock.mockReturnValue([{ id: '{PROVIDER_ID}', displayName: 'Other', path: 'Other' }]);
    // When
    await unregisterVirtualDrives(props);
    // Then
    expect(unregisterSyncRootMock).toHaveBeenCalledTimes(0);
  });

  it('should unregister if it not already registered', async () => {
    // Given
    props.currentProviderIds = ['{NEW_PROVIDER_ID}'];
    // When
    await unregisterVirtualDrives(props);
    // Then
    call(unregisterSyncRootMock).toStrictEqual({ providerId: '{PROVIDER_ID}' });
  });

  it('should do nothing if nothing was registered', async () => {
    // Given
    getRegisteredSyncRootsMock.mockReturnValue([]);
    // When
    await unregisterVirtualDrives(props);
    // Then
    expect(unregisterSyncRootMock).toHaveBeenCalledTimes(0);
  });

  it('should not unregister if it is already registered', async () => {
    // When
    await unregisterVirtualDrives(props);
    // Then
    expect(unregisterSyncRootMock).toHaveBeenCalledTimes(0);
  });
});
