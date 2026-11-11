import { Stats } from 'node:fs';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { MoveError } from '@/infra/file-system/services/move-without-overwrite';
import { StatError } from '@/infra/file-system/services/stat';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { advanceMove } from './advance-move';

describe('advance-move', () => {
  const statMock = partialSpyOn(fileSystem, 'stat');
  const walkMock = partialSpyOn(fileSystem, 'walk');
  const moveMock = partialSpyOn(fileSystem, 'moveWithoutOverwrite');
  const setMoveStageMock = partialSpyOn(SqliteModule.RecoverySyncModule, 'setMoveStage');
  const markRemovedMock = partialSpyOn(SqliteModule.RecoverySyncModule, 'markRemovedIfEligible');

  const before = new Date('2025-12-31T00:00:00.000Z');
  const after = new Date('2026-01-02T00:00:00.000Z');
  const sourceStats = { size: 1024, mtime: before, birthtime: before } as Stats;
  let disk: Map<string, Stats>;
  let props: Parameters<typeof advanceMove>[0];

  beforeEach(() => {
    disk = new Map([['source', sourceStats]]);
    statMock.mockImplementation(({ absolutePath }) => {
      const stats = disk.get(absolutePath);
      return Promise.resolve(stats ? { data: stats } : { error: new StatError('NON_EXISTS') });
    });
    walkMock.mockResolvedValue([]);
    moveMock.mockImplementation(({ source, destination }) => {
      const stats = disk.get(source);
      if (!stats) return Promise.resolve(new MoveError('SOURCE_NOT_FOUND'));
      disk.delete(source);
      disk.set(destination, stats);
      return Promise.resolve(undefined);
    });
    setMoveStageMock.mockReturnValue({ data: true });
    markRemovedMock.mockReturnValue({ data: true });

    props = mockProps<typeof advanceMove>({
      ctx: { userUuid: 'userUuid', workspaceId: '' },
      move: {
        rootUuid: 'rootUuid',
        itemType: 'file',
        uuid: 'uuid',
        source: 'source',
        destination: 'destination',
        removalStatus: 'TRASHED',
        sourceSize: 1024,
        sourceModifiedAt: '2025-12-31T00:00:00.000Z',
        stage: 'reserved',
      },
      startedAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('should move the source and mark the item removed', async () => {
    // When
    const { data } = await advanceMove(props);
    // Then
    expect(data).toBe('done');
    call(moveMock).toStrictEqual({ source: 'source', destination: 'destination' });
    call(markRemovedMock).toMatchObject({ uuid: 'uuid', userUuid: 'userUuid', removalStatus: 'TRASHED' });
    calls(setMoveStageMock).toMatchObject([{ stage: 'moved' }, { stage: 'done' }]);
  });

  it('should not move again when the destination exists and the source is gone', async () => {
    // Given
    disk = new Map([['destination', sourceStats]]);
    // When
    const { data } = await advanceMove(props);
    // Then
    expect(data).toBe('done');
    calls(moveMock).toHaveLength(0);
  });

  it('should leave the source in place when the source and the destination both exist', async () => {
    // Given
    disk.set('destination', sourceStats);
    // When
    const { data } = await advanceMove(props);
    // Then
    expect(data).toBe('conflict');
    calls(moveMock).toHaveLength(0);
    calls(markRemovedMock).toHaveLength(0);
  });

  it('should only mark the item removed when the move was already recorded', async () => {
    // Given
    props.move.stage = 'moved';
    // When
    const { data } = await advanceMove(props);
    // Then
    expect(data).toBe('done');
    calls(statMock).toHaveLength(0);
    calls(setMoveStageMock).toMatchObject([{ stage: 'done' }]);
  });

  it('should leave a source that changed since the move was recorded', async () => {
    // Given
    props.move.sourceSize = 10;
    // When
    const { data } = await advanceMove(props);
    // Then
    expect(data).toBe('conflict');
    calls(moveMock).toHaveLength(0);
    calls(markRemovedMock).toHaveLength(0);
  });

  it('should put a file back when it changed while it was being moved', async () => {
    // Given
    moveMock.mockImplementationOnce(({ source, destination }) => {
      disk.delete(source);
      disk.set(destination, { ...sourceStats, size: 2048 } as Stats);
      return Promise.resolve(undefined);
    });
    // When
    const { data } = await advanceMove(props);
    // Then
    expect(data).toBe('conflict');
    calls(moveMock).toStrictEqual([
      { source: 'source', destination: 'destination' },
      { source: 'destination', destination: 'source' },
    ]);
    expect(disk.has('source')).toBe(true);
    calls(markRemovedMock).toHaveLength(0);
  });

  it('should move a folder when nothing inside it changed since the recovery started', async () => {
    // Given
    props.move = { ...props.move, itemType: 'folder', sourceSize: null, sourceModifiedAt: null };
    disk.set('source/child', sourceStats);
    walkMock.mockResolvedValue([{ absolutePath: 'source/child' as AbsolutePath, isFile: true, isFolder: false }]);
    // When
    const { data } = await advanceMove(props);
    // Then
    expect(data).toBe('done');
  });

  it.each([
    ['modified', { ...sourceStats, mtime: after }],
    ['created', { ...sourceStats, birthtime: after }],
  ])('should leave a folder in place when something inside it was %s after the recovery started', async (_, childStats) => {
    // Given
    props.move = { ...props.move, itemType: 'folder', sourceSize: null, sourceModifiedAt: null };
    disk.set('source/child', childStats as Stats);
    walkMock.mockResolvedValue([{ absolutePath: 'source/child' as AbsolutePath, isFile: true, isFolder: false }]);
    // When
    const { data } = await advanceMove(props);
    // Then
    expect(data).toBe('conflict');
    calls(moveMock).toHaveLength(0);
  });

  it('should leave a folder in place when its contents cannot be read', async () => {
    // Given
    props.move = { ...props.move, itemType: 'folder', sourceSize: null, sourceModifiedAt: null };
    walkMock.mockRejectedValue(new Error('EPERM'));
    // When
    const { data } = await advanceMove(props);
    // Then
    expect(data).toBe('conflict');
    calls(moveMock).toHaveLength(0);
  });

  it('should fail when neither the source nor the destination exist', async () => {
    // Given
    disk.clear();
    // When
    const { data } = await advanceMove(props);
    // Then
    expect(data).toBe('failed');
    calls(setMoveStageMock).toMatchObject([{ stage: 'failed' }]);
    call(loggerMock.error).toMatchObject({ tag: 'RECOVERY-SYNC', msg: 'Recovery sync source not found to preserve', workspaceId: '' });
  });

  it('should fail and keep the removal status when the move fails', async () => {
    // Given
    moveMock.mockResolvedValue(new MoveError('UNKNOWN'));
    // When
    const { data } = await advanceMove(props);
    // Then
    expect(data).toBe('failed');
    calls(markRemovedMock).toHaveLength(0);
  });

  it('should end in conflict when the item changed after the move', async () => {
    // Given
    markRemovedMock.mockReturnValue({ data: false });
    // When
    const { data } = await advanceMove(props);
    // Then
    expect(data).toBe('conflict');
    calls(setMoveStageMock).toMatchObject([{ stage: 'moved' }, { stage: 'conflict' }]);
  });

  it('should return the error when the stage cannot be saved', async () => {
    // Given
    setMoveStageMock.mockReturnValue({ error: new Error('UNKNOWN') });
    // When
    const { error } = await advanceMove(props);
    // Then
    expect(error).toBeInstanceOf(Error);
    calls(markRemovedMock).toHaveLength(0);
  });
});
