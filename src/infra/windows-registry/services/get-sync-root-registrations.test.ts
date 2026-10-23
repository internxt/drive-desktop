import { calls, partialSpyOn } from 'tests/vitest/utils.helper.test';
import { getSyncRootRegistrations } from './get-sync-root-registrations';
import * as registry from './registry';

describe('get-sync-root-registrations', () => {
  const queryKeyMock = partialSpyOn(registry, 'queryKey');

  it('should map values and detect the user sync roots subkey', async () => {
    // Given
    queryKeyMock.mockResolvedValueOnce({ values: {}, subKeys: ['{79B4725E-9B4E-4726-B46D-1A202B28A6CF}'] });
    queryKeyMock.mockResolvedValueOnce({
      values: { DisplayNameResource: 'Internxt Drive', NamespaceCLSID: '{CLSID}' },
      subKeys: ['UserSyncRoots'],
    });
    queryKeyMock.mockResolvedValueOnce({ values: { TargetFolderPath: String.raw`C:\Users\user\InternxtDrive - uuid` }, subKeys: [] });
    // When
    const registrations = await getSyncRootRegistrations();
    // Then
    expect(registrations).toStrictEqual([
      {
        id: '{79B4725E-9B4E-4726-B46D-1A202B28A6CF}',
        displayName: 'Internxt Drive',
        namespaceClsid: '{CLSID}',
        targetFolderPath: String.raw`C:\Users\user\InternxtDrive - uuid`,
        hasUserSyncRoots: true,
      },
    ]);
  });

  it('should mark a registration without the user sync roots subkey', async () => {
    // Given
    queryKeyMock.mockResolvedValueOnce({ values: {}, subKeys: ['79b4725e-9b4e-1726-b46d-1a202b28a6cf'] });
    queryKeyMock.mockResolvedValueOnce({ values: { DisplayNameResource: 'Internxt' }, subKeys: [] });
    // When
    const registrations = await getSyncRootRegistrations();
    // Then
    expect(registrations).toStrictEqual([
      {
        id: '79b4725e-9b4e-1726-b46d-1a202b28a6cf',
        displayName: 'Internxt',
        namespaceClsid: '',
        targetFolderPath: '',
        hasUserSyncRoots: false,
      },
    ]);
    calls(queryKeyMock).toHaveLength(2);
  });

  it('should read the target folder path of a registration without a display name', async () => {
    // Given
    queryKeyMock.mockResolvedValueOnce({ values: {}, subKeys: ['79b4725e-9b4e-1726-b46d-1a202b28a6cf'] });
    queryKeyMock.mockResolvedValueOnce({ values: { NamespaceCLSID: '{CLSID}' }, subKeys: [] });
    queryKeyMock.mockResolvedValueOnce({ values: { TargetFolderPath: String.raw`C:\Users\user\InternxtDrive - uuid` }, subKeys: [] });
    // When
    const registrations = await getSyncRootRegistrations();
    // Then
    expect(registrations).toStrictEqual([
      {
        id: '79b4725e-9b4e-1726-b46d-1a202b28a6cf',
        displayName: '',
        namespaceClsid: '{CLSID}',
        targetFolderPath: String.raw`C:\Users\user\InternxtDrive - uuid`,
        hasUserSyncRoots: false,
      },
    ]);
  });

  it('should keep the registration if the target folder path cannot be read', async () => {
    // Given
    queryKeyMock.mockResolvedValueOnce({ values: {}, subKeys: ['79b4725e-9b4e-1726-b46d-1a202b28a6cf'] });
    queryKeyMock.mockResolvedValueOnce({ values: { DisplayNameResource: 'Internxt', NamespaceCLSID: '{CLSID}' }, subKeys: [] });
    queryKeyMock.mockRejectedValueOnce(new Error('reg query failed'));
    // When
    const registrations = await getSyncRootRegistrations();
    // Then
    expect(registrations).toStrictEqual([
      {
        id: '79b4725e-9b4e-1726-b46d-1a202b28a6cf',
        displayName: 'Internxt',
        namespaceClsid: '{CLSID}',
        targetFolderPath: '',
        hasUserSyncRoots: false,
      },
    ]);
  });

  it('should return nothing if the registry cannot be read', async () => {
    // Given
    queryKeyMock.mockRejectedValue(new Error('reg query failed'));
    // When
    const registrations = await getSyncRootRegistrations();
    // Then
    expect(registrations).toStrictEqual([]);
  });

  it('should return nothing if a single registration cannot be read', async () => {
    // Given
    queryKeyMock.mockResolvedValueOnce({ values: {}, subKeys: ['{79B4725E-9B4E-4726-B46D-1A202B28A6CF}'] });
    queryKeyMock.mockRejectedValueOnce(new Error('reg query failed'));
    // When
    const registrations = await getSyncRootRegistrations();
    // Then
    expect(registrations).toStrictEqual([]);
    calls(queryKeyMock).toHaveLength(2);
  });

  it('should skip provider-scoped ids before querying their registrations', async () => {
    // Given
    const otherProviderIds = ['OneDrive!S-1-5-21!Personal', 'Dropbox!S-1-5-21!Account'];
    queryKeyMock.mockImplementation(({ key }) => {
      if (key === registry.SYNC_ROOT_MANAGER_KEY) {
        return Promise.resolve({ values: {}, subKeys: [...otherProviderIds, '{79B4725E-9B4E-4726-B46D-1A202B28A6CF}'] });
      }
      if (key === `${registry.SYNC_ROOT_MANAGER_KEY}\\{79B4725E-9B4E-4726-B46D-1A202B28A6CF}`) {
        return Promise.resolve({ values: { DisplayNameResource: 'Internxt Drive' }, subKeys: ['UserSyncRoots'] });
      }
      return Promise.reject(new Error('ERROR: Access is denied.'));
    });

    // When
    const registrations = await getSyncRootRegistrations();

    // Then
    expect(registrations.map(({ id }) => id)).toStrictEqual(['{79B4725E-9B4E-4726-B46D-1A202B28A6CF}']);
    calls(queryKeyMock).toStrictEqual([
      { key: registry.SYNC_ROOT_MANAGER_KEY },
      { key: `${registry.SYNC_ROOT_MANAGER_KEY}\\{79B4725E-9B4E-4726-B46D-1A202B28A6CF}` },
    ]);
  });

  it('should keep readable registrations when another candidate is inaccessible', async () => {
    // Given
    queryKeyMock.mockImplementation(({ key }) => {
      if (key === registry.SYNC_ROOT_MANAGER_KEY) {
        return Promise.resolve({
          values: {},
          subKeys: ['{69B4725E-9B4E-4726-B46D-1A202B28A6CF}', '{79B4725E-9B4E-4726-B46D-1A202B28A6CF}'],
        });
      }
      if (key.endsWith('{69B4725E-9B4E-4726-B46D-1A202B28A6CF}')) return Promise.reject(new Error('ERROR: Access is denied.'));
      return Promise.resolve({ values: { DisplayNameResource: 'Internxt Drive' }, subKeys: ['UserSyncRoots'] });
    });

    // When
    const registrations = await getSyncRootRegistrations();

    // Then
    expect(registrations).toStrictEqual([
      {
        id: '{79B4725E-9B4E-4726-B46D-1A202B28A6CF}',
        displayName: 'Internxt Drive',
        namespaceClsid: '',
        targetFolderPath: '',
        hasUserSyncRoots: true,
      },
    ]);
    calls(queryKeyMock).toHaveLength(3);
  });
});
