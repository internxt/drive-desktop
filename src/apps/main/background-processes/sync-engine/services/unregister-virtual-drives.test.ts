import { call, calls, mockProps, partialSpyOn } from 'tests/vitest/utils.helper.test';
import { WindowsRegistry } from '@/infra/windows-registry/windows-registry.module';
import { Addon } from '@/node-win/addon-wrapper';
import { unregisterVirtualDrives } from './unregister-virtual-drives';

describe('unregister-virtual-drives', () => {
  const getRegisteredSyncRootsMock = partialSpyOn(Addon, 'getRegisteredSyncRoots');
  const unregisterSyncRootMock = partialSpyOn(Addon, 'unregisterSyncRoot');
  const getSyncRootRegistrationsMock = partialSpyOn(WindowsRegistry, 'getSyncRootRegistrations');
  const removeSyncRootRegistrationMock = partialSpyOn(WindowsRegistry, 'removeSyncRootRegistration');

  let props: Parameters<typeof unregisterVirtualDrives>[0];

  beforeEach(() => {
    getRegisteredSyncRootsMock.mockReturnValue([{ id: '{PROVIDER_ID}', displayName: 'Internxt' }]);
    getSyncRootRegistrationsMock.mockResolvedValue([]);
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

  it('should remove a registration that the addon does not report', async () => {
    // Given
    const registration = {
      id: 'syncRootID',
      displayName: 'Internxt',
      namespaceClsid: '{CLSID}',
      targetFolderPath: '',
      hasUserSyncRoots: false,
    };
    getSyncRootRegistrationsMock.mockResolvedValue([registration]);
    // When
    await unregisterVirtualDrives(props);
    // Then
    call(removeSyncRootRegistrationMock).toStrictEqual({ registration });
    expect(unregisterSyncRootMock).toHaveBeenCalledTimes(0);
  });

  it('should not remove a registration that the addon still reports', async () => {
    // Given
    getSyncRootRegistrationsMock.mockResolvedValue([
      { id: '{PROVIDER_ID}', displayName: 'Internxt', namespaceClsid: '{CLSID}', targetFolderPath: '', hasUserSyncRoots: false },
    ]);
    // When
    await unregisterVirtualDrives(props);
    // Then
    calls(removeSyncRootRegistrationMock).toHaveLength(0);
  });

  it('should not remove a registration that is a current provider id', async () => {
    // Given
    getRegisteredSyncRootsMock.mockReturnValue([]);
    getSyncRootRegistrationsMock.mockResolvedValue([
      { id: '{PROVIDER_ID}', displayName: 'Internxt', namespaceClsid: '{CLSID}', targetFolderPath: '', hasUserSyncRoots: false },
    ]);
    // When
    await unregisterVirtualDrives(props);
    // Then
    calls(removeSyncRootRegistrationMock).toHaveLength(0);
  });

  it('should not remove a registration from another provider', async () => {
    // Given
    getSyncRootRegistrationsMock.mockResolvedValue([
      {
        id: 'OneDrive!S-1-5-21!Personal',
        displayName: 'OneDrive',
        namespaceClsid: '{CLSID}',
        targetFolderPath: '',
        hasUserSyncRoots: true,
      },
    ]);
    // When
    await unregisterVirtualDrives(props);
    // Then
    calls(removeSyncRootRegistrationMock).toHaveLength(0);
  });

  it('should not remove a registration that belongs to another windows user', async () => {
    // Given
    getSyncRootRegistrationsMock.mockResolvedValue([
      {
        id: '{OTHER_WINDOWS_USER}',
        displayName: 'Internxt Drive',
        namespaceClsid: '{CLSID}',
        targetFolderPath: '',
        hasUserSyncRoots: true,
      },
    ]);
    // When
    await unregisterVirtualDrives(props);
    // Then
    calls(removeSyncRootRegistrationMock).toHaveLength(0);
  });

  it('should not remove a registration without a display name and without a target folder path', async () => {
    // Given
    getSyncRootRegistrationsMock.mockResolvedValue([
      { id: '9ba145d2-bd67-4f31-a221-bf820027862d', displayName: '', namespaceClsid: '', targetFolderPath: '', hasUserSyncRoots: false },
    ]);
    // When
    await unregisterVirtualDrives(props);
    // Then
    calls(removeSyncRootRegistrationMock).toHaveLength(0);
  });

  it('should remove a registration without a display name if the target folder path is ours', async () => {
    // Given
    const registration = {
      id: 'syncRootID',
      displayName: '',
      namespaceClsid: '{CLSID}',
      targetFolderPath: String.raw`C:\Users\user\InternxtDrive - uuid`,
      hasUserSyncRoots: false,
    };
    getSyncRootRegistrationsMock.mockResolvedValue([registration]);
    // When
    await unregisterVirtualDrives(props);
    // Then
    call(removeSyncRootRegistrationMock).toStrictEqual({ registration });
  });

  it('should not remove a registration without a display name if the target folder path is from another provider', async () => {
    // Given
    getSyncRootRegistrationsMock.mockResolvedValue([
      {
        id: 'syncRootID',
        displayName: '',
        namespaceClsid: '{CLSID}',
        targetFolderPath: String.raw`C:\Users\user\OneDrive`,
        hasUserSyncRoots: false,
      },
    ]);
    // When
    await unregisterVirtualDrives(props);
    // Then
    calls(removeSyncRootRegistrationMock).toHaveLength(0);
  });
});
