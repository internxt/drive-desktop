import { addSyncIssue, clearIssues, issues } from './issues';

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
});
