import { addIssue, clearIssues, issues } from './issues';

describe('issues', () => {
  beforeEach(() => {
    clearIssues();
  });

  it('Should have no issues', () => {
    expect(issues).toHaveLength(0);
  });

  it('Should add an issue', () => {
    addIssue({ tab: 'sync', name: 'test', error: 'INVALID_WINDOWS_NAME' });

    expect(issues).toHaveLength(1);
  });

  it('Should not add an issue if it already exists', () => {
    addIssue({ tab: 'sync', name: 'test', error: 'INVALID_WINDOWS_NAME' });
    addIssue({ tab: 'sync', name: 'test', error: 'INVALID_WINDOWS_NAME' });
    addIssue({ tab: 'sync', name: 'test2', error: 'INVALID_WINDOWS_NAME' });

    expect(issues).toHaveLength(2);
  });
});
