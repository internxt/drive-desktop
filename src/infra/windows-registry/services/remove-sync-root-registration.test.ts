import { calls, partialSpyOn } from 'tests/vitest/utils.helper.test';
import * as registry from './registry';
import { removeSyncRootRegistration } from './remove-sync-root-registration';

describe('remove-sync-root-registration', () => {
  const deleteKeyMock = partialSpyOn(registry, 'deleteKey');

  it('should remove the explorer entry before the provider record', async () => {
    // Given
    const registration = {
      id: 'syncRootID',
      displayName: 'Internxt',
      namespaceClsid: '{CLSID}',
      targetFolderPath: '',
      hasUserSyncRoots: false,
    };
    // When
    await removeSyncRootRegistration({ registration });
    // Then
    calls(deleteKeyMock).toStrictEqual([
      { key: `${registry.NAMESPACE_KEY}\\{CLSID}` },
      { key: `${registry.CLSID_KEY}\\{CLSID}` },
      { key: `${registry.SYNC_ROOT_MANAGER_KEY}\\syncRootID` },
    ]);
  });

  it('should only remove the provider record if there is no namespace clsid', async () => {
    // Given
    const registration = { id: 'syncRootID', displayName: 'Internxt', namespaceClsid: '', targetFolderPath: '', hasUserSyncRoots: false };
    // When
    await removeSyncRootRegistration({ registration });
    // Then
    calls(deleteKeyMock).toStrictEqual([{ key: `${registry.SYNC_ROOT_MANAGER_KEY}\\syncRootID` }]);
  });

  it('should keep removing the remaining keys if one of them fails', async () => {
    // Given
    const registration = {
      id: 'syncRootID',
      displayName: 'Internxt',
      namespaceClsid: '{CLSID}',
      targetFolderPath: '',
      hasUserSyncRoots: false,
    };
    deleteKeyMock.mockRejectedValueOnce(new Error('access denied'));
    // When
    await removeSyncRootRegistration({ registration });
    // Then
    calls(deleteKeyMock).toHaveLength(3);
  });
});
