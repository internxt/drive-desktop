import { calls, partialSpyOn } from 'tests/vitest/utils.helper.test';
import { getSyncRootRegistrations } from './get-sync-root-registrations';
import * as registry from './registry';

describe('get-sync-root-registrations', () => {
  const queryKeyMock = partialSpyOn(registry, 'queryKey');

  it('should map values and detect the user sync roots subkey', async () => {
    // Given
    queryKeyMock.mockResolvedValueOnce({ values: {}, subKeys: ['{PROVIDER_ID}'] });
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
        id: '{PROVIDER_ID}',
        displayName: 'Internxt Drive',
        namespaceClsid: '{CLSID}',
        targetFolderPath: String.raw`C:\Users\user\InternxtDrive - uuid`,
        hasUserSyncRoots: true,
      },
    ]);
  });

  it('should mark a registration without the user sync roots subkey', async () => {
    // Given
    queryKeyMock.mockResolvedValueOnce({ values: {}, subKeys: ['syncRootID'] });
    queryKeyMock.mockResolvedValueOnce({ values: { DisplayNameResource: 'Internxt' }, subKeys: [] });
    // When
    const registrations = await getSyncRootRegistrations();
    // Then
    expect(registrations).toStrictEqual([
      { id: 'syncRootID', displayName: 'Internxt', namespaceClsid: '', targetFolderPath: '', hasUserSyncRoots: false },
    ]);
    calls(queryKeyMock).toHaveLength(2);
  });

  it('should read the target folder path of a registration without a display name', async () => {
    // Given
    queryKeyMock.mockResolvedValueOnce({ values: {}, subKeys: ['syncRootID'] });
    queryKeyMock.mockResolvedValueOnce({ values: { NamespaceCLSID: '{CLSID}' }, subKeys: [] });
    queryKeyMock.mockResolvedValueOnce({ values: { TargetFolderPath: String.raw`C:\Users\user\InternxtDrive - uuid` }, subKeys: [] });
    // When
    const registrations = await getSyncRootRegistrations();
    // Then
    expect(registrations).toStrictEqual([
      {
        id: 'syncRootID',
        displayName: '',
        namespaceClsid: '{CLSID}',
        targetFolderPath: String.raw`C:\Users\user\InternxtDrive - uuid`,
        hasUserSyncRoots: false,
      },
    ]);
  });

  it('should keep the registration if the target folder path cannot be read', async () => {
    // Given
    queryKeyMock.mockResolvedValueOnce({ values: {}, subKeys: ['syncRootID'] });
    queryKeyMock.mockResolvedValueOnce({ values: { DisplayNameResource: 'Internxt', NamespaceCLSID: '{CLSID}' }, subKeys: [] });
    queryKeyMock.mockRejectedValueOnce(new Error('reg query failed'));
    // When
    const registrations = await getSyncRootRegistrations();
    // Then
    expect(registrations).toStrictEqual([
      { id: 'syncRootID', displayName: 'Internxt', namespaceClsid: '{CLSID}', targetFolderPath: '', hasUserSyncRoots: false },
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
    queryKeyMock.mockResolvedValueOnce({ values: {}, subKeys: ['{PROVIDER_ID}'] });
    queryKeyMock.mockRejectedValueOnce(new Error('reg query failed'));
    // When
    const registrations = await getSyncRootRegistrations();
    // Then
    expect(registrations).toStrictEqual([]);
    calls(queryKeyMock).toHaveLength(2);
  });
});
