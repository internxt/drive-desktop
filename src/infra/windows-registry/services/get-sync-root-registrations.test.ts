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
    // When
    const registrations = await getSyncRootRegistrations();
    // Then
    expect(registrations).toStrictEqual([
      { id: '{PROVIDER_ID}', displayName: 'Internxt Drive', namespaceClsid: '{CLSID}', hasUserSyncRoots: true },
    ]);
  });

  it('should mark a registration without the user sync roots subkey', async () => {
    // Given
    queryKeyMock.mockResolvedValueOnce({ values: {}, subKeys: ['syncRootID'] });
    queryKeyMock.mockResolvedValueOnce({ values: { DisplayNameResource: 'Internxt' }, subKeys: [] });
    // When
    const registrations = await getSyncRootRegistrations();
    // Then
    expect(registrations).toStrictEqual([{ id: 'syncRootID', displayName: 'Internxt', namespaceClsid: '', hasUserSyncRoots: false }]);
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
