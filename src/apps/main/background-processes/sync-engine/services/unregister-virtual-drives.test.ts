import { deepMocked, getMockCalls, mockProps } from 'tests/vitest/utils.helper.test';
import { unregisterVirtualDrives } from './unregister-virtual-drives';
import VirtualDrive from '@/node-win/virtual-drive';

vi.mock(import('@/node-win/virtual-drive'));
vi.mock(import('@/apps/shared/logger/logger'));

describe('unregister-virtual-drives', () => {
  const getRegisteredSyncRootsMock = deepMocked(VirtualDrive.getRegisteredSyncRoots);
  const unRegisterSyncRootByProviderIdMock = deepMocked(VirtualDrive.unRegisterSyncRootByProviderId);

  it('Skip unregistration if they are already registered', () => {
    // Given
    getRegisteredSyncRootsMock.mockReturnValue([{ id: '{PROVIDER_ID}' }, { id: '{WORKSPACE_PROVIDER_ID}' }]);

    // When
    const props = mockProps<typeof unregisterVirtualDrives>({
      currentProviderIds: ['{PROVIDER_ID}', '{WORKSPACE_PROVIDER_ID}'],
    });
    unregisterVirtualDrives(props);

    // Then
    expect(unRegisterSyncRootByProviderIdMock).toHaveBeenCalledTimes(0);
  });

  it('Unregister {PROVIDER_ID} if it is not in currentProviderIds', () => {
    // Given
    getRegisteredSyncRootsMock.mockReturnValue([{ id: '{PROVIDER_ID}' }, { id: '{WORKSPACE_PROVIDER_ID}' }]);

    // When
    const props = mockProps<typeof unregisterVirtualDrives>({
      currentProviderIds: ['{WORKSPACE_PROVIDER_ID}'],
    });
    unregisterVirtualDrives(props);

    // Then
    expect(getMockCalls(unRegisterSyncRootByProviderIdMock)).toStrictEqual([{ providerId: '{PROVIDER_ID}' }]);
  });

  it('Unregister {PROVIDER_ID} if it is not in currentProviderIds', () => {
    // Given
    getRegisteredSyncRootsMock.mockReturnValue([{ id: '{PROVIDER_ID}' }, { id: '{WORKSPACE_PROVIDER_ID}' }]);

    // When
    const props = mockProps<typeof unregisterVirtualDrives>({
      currentProviderIds: ['{PROVIDER_ID}'],
    });
    unregisterVirtualDrives(props);

    // Then
    expect(getMockCalls(unRegisterSyncRootByProviderIdMock)).toStrictEqual([{ providerId: '{WORKSPACE_PROVIDER_ID}' }]);
  });
});
