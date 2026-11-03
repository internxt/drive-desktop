import { Stats } from 'node:fs';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { StatError } from '@/infra/file-system/services/stat';
import { SqliteError } from '@/infra/sqlite/services/common/sqlite-error';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as advanceMoveModule from './advance-move';
import * as allocateModule from './allocate-recovery-destination';
import { preserveItem } from './preserve-item';

describe('preserve-item', () => {
  const allocateMock = partialSpyOn(allocateModule, 'allocateRecoveryDestination');
  const statMock = partialSpyOn(fileSystem, 'stat');
  const reserveMoveMock = partialSpyOn(SqliteModule.RecoverySyncModule, 'reserveMove');
  const advanceMoveMock = partialSpyOn(advanceMoveModule, 'advanceMove');

  const rootPath = abs('C:/Users/user/InternxtDrive');
  let props: Parameters<typeof preserveItem>[0];

  beforeEach(() => {
    allocateMock.mockResolvedValue({ data: abs('C:/Recovery/Personal Drive') });
    statMock.mockResolvedValue({ data: { size: 1024, mtime: new Date('2025-12-31T00:00:00.000Z') } as Stats });
    reserveMoveMock.mockImplementation((move) => ({ data: { ...move, stage: 'reserved' } }));
    advanceMoveMock.mockResolvedValue({ data: 'done' });

    props = mockProps<typeof preserveItem>({
      ctx: { rootUuid: 'rootUuid' as FolderUuid, rootPath },
      run: { startedAt: '2026-01-02T09:05:07.000Z', subfolder: 'Personal Drive', rootPaths: [rootPath], destinations: new Map() },
      itemType: 'file',
      uuid: 'uuid',
      source: abs('C:/Users/user/InternxtDrive/Docs/file.txt'),
      removalStatus: 'DELETED',
    });
  });

  it('should record the move with the file state and run it', async () => {
    // When
    const { data } = await preserveItem(props);
    // Then
    expect(data).toBe('done');
    call(allocateMock).toStrictEqual({
      rootUuid: 'rootUuid',
      volume: 'C:',
      startedAt: '2026-01-02T09:05:07.000Z',
      subfolder: 'Personal Drive',
    });

    call(reserveMoveMock).toStrictEqual({
      rootUuid: 'rootUuid',
      itemType: 'file',
      uuid: 'uuid',
      source: 'C:/Users/user/InternxtDrive/Docs/file.txt',
      destination: 'C:/Recovery/Personal Drive/Docs/file.txt',
      removalStatus: 'DELETED',
      sourceSize: 1024,
      sourceModifiedAt: '2025-12-31T00:00:00.000Z',
    });
    call(advanceMoveMock).toMatchObject({ move: { stage: 'reserved' } });
  });

  it('should allocate the destination once per volume', async () => {
    // When
    await preserveItem(props);
    await preserveItem(props);
    // Then
    calls(allocateMock).toHaveLength(1);
  });

  it('should record a folder without its size and modification time', async () => {
    // Given
    props.itemType = 'folder';
    props.source = abs('C:/Users/user/InternxtDrive/Docs');
    // When
    await preserveItem(props);
    // Then
    calls(statMock).toHaveLength(0);
    call(reserveMoveMock).toMatchObject({ destination: 'C:/Recovery/Personal Drive/Docs', sourceSize: null, sourceModifiedAt: null });
  });

  it('should not record a move when the destination cannot be allocated', async () => {
    // Given
    allocateMock.mockResolvedValue({ error: new Error('No free recovery sync destination') });
    // When
    const { error } = await preserveItem(props);
    // Then
    expect(error?.message).toBe('No free recovery sync destination');
    calls(reserveMoveMock).toHaveLength(0);
  });

  it('should not record a move when the destination is inside a sync root', async () => {
    // Given
    allocateMock.mockResolvedValue({ data: abs('C:/Users/user/InternxtDrive/Recovery') });
    // When
    const { error } = await preserveItem(props);
    // Then
    expect(error?.message).toBe('INSIDE_SYNC_ROOT');
    calls(reserveMoveMock).toHaveLength(0);
  });

  it('should not record a move when the file cannot be read', async () => {
    // Given
    statMock.mockResolvedValue({ error: new StatError('NON_EXISTS') });
    // When
    const { error } = await preserveItem(props);
    // Then
    expect(error?.message).toBe('NON_EXISTS');
    calls(reserveMoveMock).toHaveLength(0);
  });

  it('should not run the move when it cannot be recorded', async () => {
    // Given
    reserveMoveMock.mockReturnValue({ error: new SqliteError('DESTINATION_TAKEN') });
    // When
    const { error } = await preserveItem(props);
    // Then
    expect(error?.message).toBe('DESTINATION_TAKEN');
    calls(advanceMoveMock).toHaveLength(0);
  });
});
