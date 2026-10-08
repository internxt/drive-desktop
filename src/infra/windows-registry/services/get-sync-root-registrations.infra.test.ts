import { Addon } from '@/node-win/addon-wrapper';
import { getSyncRootRegistrations } from './get-sync-root-registrations';
import { isSyncRootCandidate } from './is-sync-root-candidate';

describe('get-sync-root-registrations', () => {
  it('should read candidate registrations that the addon reports', async () => {
    // Given
    const syncRoots = Addon.getRegisteredSyncRoots().filter((syncRoot) => isSyncRootCandidate(syncRoot.id));
    // When
    const registrations = await getSyncRootRegistrations();
    // Then
    for (const syncRoot of syncRoots) {
      const registration = registrations.find((item) => item.id === syncRoot.id);
      expect(registration).toBeDefined();
      expect(registration?.displayName).toBe(syncRoot.displayName);
      expect(registration?.namespaceClsid).toMatch(/^\{[0-9A-F-]+\}$/i);
      expect(registration?.targetFolderPath.replace(/\\/g, '/')).toBe(syncRoot.path);
      expect(registration?.hasUserSyncRoots).toBe(true);
    }
  });

  it('should also read registrations that the addon does not report', async () => {
    // Given
    const registeredCandidates = Addon.getRegisteredSyncRoots().filter((syncRoot) => isSyncRootCandidate(syncRoot.id));
    // When
    const registrations = await getSyncRootRegistrations();
    // Then
    expect(registrations.length).toBeGreaterThanOrEqual(registeredCandidates.length);
  });
});
