import { getMockCalls, mockProps, partialSpyOn } from 'tests/vitest/utils.helper.test';
import { unregisterVirtualDrives } from './unregister-virtual-drives';
import VirtualDrive from '@/node-win/virtual-drive';

describe('unregister-virtual-drives', () => {
  const getRegisteredSyncRootsMock = partialSpyOn(VirtualDrive, 'getRegisteredSyncRoots');
  const unregisterSyncRootMock = partialSpyOn(VirtualDrive, 'unregisterSyncRoot');

  let props: Parameters<typeof unregisterVirtualDrives>[0];

  beforeEach(() => {
    getRegisteredSyncRootsMock.mockReturnValue([{ id: '{PROVIDER_ID}', displayName: 'Internxt' }]);
    props = mockProps<typeof unregisterVirtualDrives>({ currentProviderIds: ['{PROVIDER_ID}'] });
  });

  it('should unregister if displayName contains internxt', () => {
    // Given
    getRegisteredSyncRootsMock.mockReturnValue([{ id: '{OLD_PROVIDER_ID}', displayName: 'Internxt', path: 'Other' }]);
    // When
    unregisterVirtualDrives(props);
    // Then
    expect(getMockCalls(unregisterSyncRootMock)).toStrictEqual([{ providerId: '{OLD_PROVIDER_ID}' }]);
  });

  it('should unregister if path contains internxt', () => {
    // Given
    getRegisteredSyncRootsMock.mockReturnValue([{ id: '{OLD_PROVIDER_ID}', displayName: 'Other', path: 'Internxt' }]);
    // When
    unregisterVirtualDrives(props);
    // Then
    expect(getMockCalls(unregisterSyncRootMock)).toStrictEqual([{ providerId: '{OLD_PROVIDER_ID}' }]);
  });

  it('should unregister if it not already registered', () => {
    // Given
    props.currentProviderIds = ['{NEW_PROVIDER_ID}'];
    // When
    unregisterVirtualDrives(props);
    // Then
    expect(getMockCalls(unregisterSyncRootMock)).toStrictEqual([{ providerId: '{PROVIDER_ID}' }]);
  });

  it('should do nothing if nothing was registered', () => {
    // Given
    getRegisteredSyncRootsMock.mockReturnValue([]);
    // When
    unregisterVirtualDrives(props);
    // Then
    expect(unregisterSyncRootMock).toHaveBeenCalledTimes(0);
  });

  it('should not unregister if it is already registered', () => {
    // When
    unregisterVirtualDrives(props);
    // Then
    expect(unregisterSyncRootMock).toHaveBeenCalledTimes(0);
  });
});
