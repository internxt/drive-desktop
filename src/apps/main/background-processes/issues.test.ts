import { addBackupsIssue, addSyncIssue, clearIssues, issues, removeSyncIssuesByError } from './issues';

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

  it('Should remove the sync issues with the given error', () => {
    addSyncIssue({ name: 'big1', error: 'FILE_SIZE_TOO_BIG' });
    addSyncIssue({ name: 'big2', error: 'FILE_SIZE_TOO_BIG' });
    addSyncIssue({ name: 'test', error: 'INVALID_WINDOWS_NAME' });
    addBackupsIssue({ name: 'big3', error: 'FILE_SIZE_TOO_BIG', folderUuid: 'folderUuid' });

    const removed = removeSyncIssuesByError({ error: 'FILE_SIZE_TOO_BIG' });

    expect(removed).toBe(true);
    expect(issues.map(({ tab, name }) => ({ tab, name }))).toStrictEqual([
      { tab: 'sync', name: 'test' },
      { tab: 'backups', name: 'big3' },
    ]);
  });

  it('Should return false if there are no sync issues with the given error', () => {
    addSyncIssue({ name: 'test', error: 'INVALID_WINDOWS_NAME' });

    const removed = removeSyncIssuesByError({ error: 'FILE_SIZE_TOO_BIG' });

    expect(removed).toBe(false);
    expect(issues).toHaveLength(1);
  });
});
