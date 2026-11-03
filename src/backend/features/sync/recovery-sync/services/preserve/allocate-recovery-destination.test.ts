import { Stats } from 'node:fs';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { StatError } from '@/infra/file-system/services/stat';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { call, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { allocateRecoveryDestination } from './allocate-recovery-destination';

describe('allocate-recovery-destination', () => {
  const statMock = partialSpyOn(fileSystem, 'stat');
  const allocateDestinationMock = partialSpyOn(SqliteModule.RecoverySyncModule, 'allocateDestination');

  const startedAt = new Date(2026, 0, 2, 9, 5, 7).toISOString();
  let props: Parameters<typeof allocateRecoveryDestination>[0];

  beforeEach(() => {
    statMock.mockResolvedValue({ error: new StatError('NON_EXISTS') });
    allocateDestinationMock.mockImplementation(({ rootUuid, volume, path }) => ({ data: { rootUuid, volume, path } }));
    props = { rootUuid: 'rootUuid', volume: 'C:', startedAt, subfolder: 'Personal Drive' };
  });

  it('should allocate the first destination that does not exist', async () => {
    // When
    const { data } = await allocateRecoveryDestination(props);
    // Then
    expect(data).toBe('C:/Internxt Recovery Sync 2026-01-02 090507/Personal Drive');
    call(allocateDestinationMock).toStrictEqual({ rootUuid: 'rootUuid', volume: 'C:', path: data });
  });

  it('should try the next suffix when the destination already exists', async () => {
    // Given
    statMock.mockResolvedValueOnce({ data: {} as Stats });
    // When
    const { data } = await allocateRecoveryDestination(props);
    // Then
    expect(data).toBe('C:/Internxt Recovery Sync 2026-01-02 090507 (2)/Personal Drive');
  });

  it('should return the destination recorded before', async () => {
    // Given
    allocateDestinationMock.mockReturnValue({ data: { rootUuid: 'rootUuid', volume: 'C:', path: 'C:/recorded' } });
    // When
    const { data } = await allocateRecoveryDestination(props);
    // Then
    expect(data).toBe('C:/recorded');
  });

  it('should return the error when the destination cannot be checked', async () => {
    // Given
    statMock.mockResolvedValue({ error: new StatError('UNKNOWN') });
    // When
    const { error } = await allocateRecoveryDestination(props);
    // Then
    expect(error).toBeInstanceOf(StatError);
  });

  it('should return an error when every suffix exists', async () => {
    // Given
    statMock.mockResolvedValue({ data: {} as Stats });
    // When
    const { error } = await allocateRecoveryDestination(props);
    // Then
    expect(error?.message).toBe('No free recovery sync destination');
  });
});
