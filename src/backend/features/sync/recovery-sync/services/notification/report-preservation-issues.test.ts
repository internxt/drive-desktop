import { addSyncIssue, clearIssues, issues } from '@/apps/main/background-processes/issues';
import { reportPreservationIssues } from './report-preservation-issues';

describe('report-preservation-issues', () => {
  beforeEach(() => {
    clearIssues();
  });

  it('should add one issue per item that could not be preserved', () => {
    // When
    reportPreservationIssues({ failed: ['C:/Drive/a.txt', 'C:/Drive/a.txt', 'C:/Drive/Docs'] });
    // Then
    expect(issues).toStrictEqual([
      { tab: 'sync', name: String.raw`C:\Drive\a.txt`, error: 'RECOVERY_SYNC_NOT_PRESERVED' },
      { tab: 'sync', name: String.raw`C:\Drive\Docs`, error: 'RECOVERY_SYNC_NOT_PRESERVED' },
    ]);
  });

  it('should remove the issues of items preserved on retry and keep other issues', () => {
    // Given
    reportPreservationIssues({ failed: ['C:/Drive/a.txt'] });
    addSyncIssue({ name: 'b.txt', error: 'INVALID_WINDOWS_NAME' });
    // When
    reportPreservationIssues({ failed: [] });
    // Then
    expect(issues).toStrictEqual([{ tab: 'sync', name: 'b.txt', error: 'INVALID_WINDOWS_NAME' }]);
  });
});
