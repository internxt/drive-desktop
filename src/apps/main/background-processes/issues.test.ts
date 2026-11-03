import { addGeneralIssue, addSyncIssue, clearIssues, issues, removeSyncIssuesByError } from './issues';

describe('issues', () => {
  beforeEach(() => {
    clearIssues();
  });

  it('Should have no issues', () => {
    expect(issues).toHaveLength(0);
  });

  it('Should add an issue', () => {
    addSyncIssue({ name: 'test', error: 'INVALID_WINDOWS_NAME' });

    expect(issues).toHaveLength(1);
  });

  it('Should not add an issue if it already exists', () => {
    addSyncIssue({ name: 'test', error: 'INVALID_WINDOWS_NAME' });
    addSyncIssue({ name: 'test', error: 'INVALID_WINDOWS_NAME' });
    addSyncIssue({ name: 'test2', error: 'INVALID_WINDOWS_NAME' });

    expect(issues).toHaveLength(2);
  });

  it('Should remove every sync issue with the error and keep the rest', () => {
    addSyncIssue({ name: 'a.txt', error: 'RECOVERY_SYNC_NOT_PRESERVED' });
    addSyncIssue({ name: 'b.txt', error: 'RECOVERY_SYNC_NOT_PRESERVED' });
    addSyncIssue({ name: 'a.txt', error: 'INVALID_WINDOWS_NAME' });
    addGeneralIssue({ name: 'a.txt', error: 'NETWORK_CONNECTIVITY_ERROR' });

    removeSyncIssuesByError({ error: 'RECOVERY_SYNC_NOT_PRESERVED' });

    expect(issues).toStrictEqual([
      { tab: 'sync', name: 'a.txt', error: 'INVALID_WINDOWS_NAME' },
      { tab: 'general', name: 'a.txt', error: 'NETWORK_CONNECTIVITY_ERROR' },
    ]);
  });
});
