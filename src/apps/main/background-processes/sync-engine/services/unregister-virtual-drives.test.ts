import { deepMocked, getMockCalls, mockProps } from 'tests/vitest/utils.helper.test';
import { unregisterVirtualDrives } from './unregister-virtual-drives';
import { VirtualDrive } from '@internxt/node-win/dist';

vi.mock(import('@internxt/node-win/dist'));
vi.mock(import('@/apps/shared/logger/logger'));

describe('unregister-virtual-drives', () => {
  const getRegisteredSyncRootsMock = deepMocked(VirtualDrive.getRegisteredSyncRoots);
  const unRegisterSyncRootByProviderIdMock = deepMocked(VirtualDrive.unRegisterSyncRootByProviderId);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Skip unregistration if they are already registered', async () => {
    // Given
    getRegisteredSyncRootsMock.mockReturnValue([{ id: '{PROVIDER_ID}' }, { id: '{WORKSPACE_PROVIDER_ID}' }]);

    // When
    const props = mockProps<typeof unregisterVirtualDrives>({
      providerId: '{PROVIDER_ID}',
      workspaceProviderIds: ['{WORKSPACE_PROVIDER_ID}'],
    });
    unregisterVirtualDrives(props);

    // Then
    expect(unRegisterSyncRootByProviderIdMock).toHaveBeenCalledTimes(0);
  });

  it('Unregister {PROVIDER_ID} if it is not in currentProviderIds', async () => {
    // Given
    getRegisteredSyncRootsMock.mockReturnValue([{ id: '{PROVIDER_ID}' }, { id: '{WORKSPACE_PROVIDER_ID}' }]);

    // When
    const props = mockProps<typeof unregisterVirtualDrives>({
      workspaceProviderIds: ['{WORKSPACE_PROVIDER_ID}'],
    });
    unregisterVirtualDrives(props);

    // Then
    expect(getMockCalls(unRegisterSyncRootByProviderIdMock)).toStrictEqual([{ providerId: '{PROVIDER_ID}' }]);
  });

  it('Unregister {PROVIDER_ID} if it is not in currentProviderIds', async () => {
    // Given
    getRegisteredSyncRootsMock.mockReturnValue([{ id: '{PROVIDER_ID}' }, { id: '{WORKSPACE_PROVIDER_ID}' }]);

    // When
    const props = mockProps<typeof unregisterVirtualDrives>({
      providerId: '{PROVIDER_ID}',
      workspaceProviderIds: [],
    });
    unregisterVirtualDrives(props);

    // Then
    expect(getMockCalls(unRegisterSyncRootByProviderIdMock)).toStrictEqual([{ providerId: '{WORKSPACE_PROVIDER_ID}' }]);
  });
});
