import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { SqliteError } from '@/infra/sqlite/services/common/sqlite-error';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as preserveModule from './preserve/preserve-recovery-sync-items';
import { recoverAndPreserve } from './recover-and-preserve';
import * as scanModule from './scan/scan-recovery-sync';

describe('recover-and-preserve', () => {
  const startOrResumeProcessMock = partialSpyOn(SqliteModule.RecoverySyncModule, 'startOrResumeProcess');
  const scanMock = partialSpyOn(scanModule, 'scanRecoverySync');
  const areScansCompletedMock = partialSpyOn(SqliteModule.RecoverySyncModule, 'areScansCompleted');
  const preserveMock = partialSpyOn(preserveModule, 'preserveRecoverySyncItems');
  const summaryMock = partialSpyOn(SqliteModule.RecoverySyncModule, 'getPreservationSummary');

  let props: Parameters<typeof recoverAndPreserve>[0];

  beforeEach(() => {
    startOrResumeProcessMock.mockReturnValue({ data: { rootUuid: 'rootUuid', startedAt: '2026-01-01T00:00:00.000Z' } });
    scanMock.mockResolvedValue({ data: undefined });
    areScansCompletedMock.mockReturnValue({ data: true });
    preserveMock.mockResolvedValue({ data: [abs('C:/Drive/a.txt')] });
    summaryMock.mockReturnValue({ data: { preserved: 3, destinations: ['C:/Recovery'] } });

    props = mockProps<typeof recoverAndPreserve>({
      ctx: { rootUuid: 'rootUuid' as FolderUuid, logger: loggerMock },
      startedAt: '2026-01-02T09:05:07.000Z',
      subfolder: 'Personal Drive',
      rootPaths: [abs('C:/Drive')],
    });
  });

  it('should scan, preserve with the startedAt of the process and return the outcome', async () => {
    // When
    const { data } = await recoverAndPreserve(props);
    // Then
    expect(data).toStrictEqual({ preserved: 3, destinations: ['C:/Recovery'], failed: ['C:/Drive/a.txt'] });
    call(startOrResumeProcessMock).toStrictEqual({ rootUuid: 'rootUuid', startedAt: '2026-01-02T09:05:07.000Z' });
    call(preserveMock).toMatchObject({ startedAt: '2026-01-01T00:00:00.000Z', subfolder: 'Personal Drive', rootPaths: ['C:/Drive'] });
  });

  it('should not preserve anything when the scans are not completed', async () => {
    // Given
    areScansCompletedMock.mockReturnValue({ data: false });
    summaryMock.mockReturnValue({ data: { preserved: 0, destinations: [] } });
    // When
    const { data } = await recoverAndPreserve(props);
    // Then
    expect(data).toStrictEqual({ preserved: 0, destinations: [], failed: [] });
    calls(preserveMock).toHaveLength(0);
  });

  it('should not scan when the process cannot be started', async () => {
    // Given
    startOrResumeProcessMock.mockReturnValue({ error: new SqliteError('UNKNOWN') });
    // When
    const { error } = await recoverAndPreserve(props);
    // Then
    expect(error?.message).toBe('UNKNOWN');
    calls(scanMock).toHaveLength(0);
  });

  it('should not preserve when the scan fails', async () => {
    // Given
    scanMock.mockResolvedValue({ error: new Error('Recovery sync cursor did not advance') });
    // When
    const { error } = await recoverAndPreserve(props);
    // Then
    expect(error?.message).toBe('Recovery sync cursor did not advance');
    calls(preserveMock).toHaveLength(0);
  });

  it('should return the error of the preservation', async () => {
    // Given
    preserveMock.mockResolvedValue({ error: new Error('UNKNOWN') });
    // When
    const { error } = await recoverAndPreserve(props);
    // Then
    expect(error?.message).toBe('UNKNOWN');
    calls(summaryMock).toHaveLength(0);
  });
});
