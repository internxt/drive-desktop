import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { SyncContext } from '@/apps/sync-engine/config';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as issues from './notification/report-preservation-issues';
import * as notification from './notification/show-recovery-sync-notification';
import * as recoverAndPreserveModule from './recover-and-preserve';
import * as recoverContextModule from './recover-context';
import { runRecoveryWithPreservation } from './run-recovery-with-preservation';

describe('run-recovery-with-preservation', () => {
  const recoverContextMock = partialSpyOn(recoverContextModule, 'recoverContext');
  const recoverAndPreserveMock = partialSpyOn(recoverAndPreserveModule, 'recoverAndPreserve');
  const getWorkspacesMock = partialSpyOn(driveServerWipModule.workspaces, 'getWorkspaces');
  const clearRecoveryMock = partialSpyOn(SqliteModule.RecoverySyncModule, 'clearRecovery');
  const notificationMock = partialSpyOn(notification, 'showRecoverySyncNotification');
  const reportIssuesMock = partialSpyOn(issues, 'reportPreservationIssues');

  let contexts: SyncContext[];

  function createContext(workspaceId: string, rootPath: string) {
    return mockProps<typeof runRecoveryWithPreservation>({
      contexts: [
        { workspaceId, rootPath: abs(rootPath), rootUuid: `root-${workspaceId}` as FolderUuid, abortController: new AbortController() },
      ],
    }).contexts[0];
  }

  beforeEach(() => {
    recoverContextMock.mockImplementation(async ({ recover }) => {
      const { error } = await recover();
      return error ? { error } : { data: true };
    });
    recoverAndPreserveMock.mockResolvedValue({ data: { preserved: 0, destinations: [], failed: [] } });
    getWorkspacesMock.mockResolvedValue({ data: { availableWorkspaces: [{ workspace: { id: 'ws1', name: 'Marketing' } }] } } as any);
    contexts = [createContext('', 'C:/Drive')];
  });

  it('should recover a personal Drive without workspaces straight into the dated folder', async () => {
    // Given
    recoverAndPreserveMock.mockResolvedValue({ data: { preserved: 2, destinations: ['C:/Recovery'], failed: [] } });
    // When
    const { data } = await runRecoveryWithPreservation({ contexts });
    // Then
    expect(data).toBe(true);
    call(recoverAndPreserveMock).toMatchObject({ subfolder: '', rootPaths: ['C:/Drive'] });
    calls(getWorkspacesMock).toHaveLength(0);
    call(clearRecoveryMock).toStrictEqual({ rootUuid: 'root-' });
    call(notificationMock).toStrictEqual({ status: 'completed', preserved: 2, destinations: ['C:/Recovery'] });
  });

  it('should share the start date and report the dated folder of every context once', async () => {
    // Given
    contexts.push(createContext('ws1', 'C:/Drive - ws1'));
    recoverAndPreserveMock
      .mockResolvedValueOnce({ data: { preserved: 1, destinations: ['C:/Recovery/Personal Drive'], failed: [] } })
      .mockResolvedValueOnce({ data: { preserved: 2, destinations: ['C:/Recovery/Marketing'], failed: [] } });
    // When
    await runRecoveryWithPreservation({ contexts });
    // Then
    calls(recoverAndPreserveMock).toMatchObject([{ subfolder: 'Personal Drive' }, { subfolder: 'Marketing' }]);
    const [first, second] = recoverAndPreserveMock.mock.calls;
    expect(first[0].startedAt).toBe(second[0].startedAt);
    calls(notificationMock).toStrictEqual([{ status: 'completed', preserved: 3, destinations: ['C:/Recovery'] }]);
  });

  it('should report a failure and still clear a context whose items could not all be preserved', async () => {
    // Given
    recoverAndPreserveMock.mockResolvedValue({ data: { preserved: 1, destinations: ['C:/Recovery'], failed: [abs('C:/Drive/a.txt')] } });
    // When
    await runRecoveryWithPreservation({ contexts });
    // Then
    calls(clearRecoveryMock).toHaveLength(1);
    call(reportIssuesMock).toStrictEqual({ failed: ['C:/Drive/a.txt'] });
    call(notificationMock).toMatchObject({ status: 'failed', preserved: 1 });
  });

  it('should keep the state of a context that stopped so it can resume', async () => {
    // Given
    recoverAndPreserveMock.mockResolvedValue({ error: new Error('Recovery sync cursor did not advance') });
    // When
    const { error } = await runRecoveryWithPreservation({ contexts });
    // Then
    expect(error?.message).toBe('Recovery sync cursor did not advance');
    calls(clearRecoveryMock).toHaveLength(0);
    call(notificationMock).toMatchObject({ status: 'failed', preserved: 0 });
  });

  it('should report a cancelled run', async () => {
    // Given
    const error = new Error('Recovery sync was aborted');
    error.name = 'AbortError';
    recoverAndPreserveMock.mockResolvedValue({ error });
    // When
    await runRecoveryWithPreservation({ contexts });
    // Then
    call(notificationMock).toMatchObject({ status: 'cancelled' });
  });

  it('should not report or clear anything after logout', async () => {
    // Given
    recoverAndPreserveMock.mockImplementation(() => {
      contexts[0].abortController.abort();
      return Promise.resolve({ data: { preserved: 0, destinations: [], failed: [] } });
    });
    // When
    const { error } = await runRecoveryWithPreservation({ contexts });
    // Then
    expect(error?.name).toBe('AbortError');
    calls(clearRecoveryMock).toHaveLength(0);
    calls(reportIssuesMock).toHaveLength(0);
    calls(notificationMock).toHaveLength(0);
  });
});
