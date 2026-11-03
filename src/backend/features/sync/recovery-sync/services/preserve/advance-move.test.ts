import { Stats } from 'node:fs';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { MoveError } from '@/infra/file-system/services/move-without-overwrite';
import { StatError } from '@/infra/file-system/services/stat';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { advanceMove } from './advance-move';

describe('advance-move', () => {
  const statMock = partialSpyOn(fileSystem, 'stat');
  const moveMock = partialSpyOn(fileSystem, 'moveWithoutOverwrite');
  const setMoveStageMock = partialSpyOn(SqliteModule.RecoverySyncModule, 'setMoveStage');
  const markRemovedMock = partialSpyOn(SqliteModule.RecoverySyncModule, 'markRemovedIfEligible');

  const sourceStats = { size: 1024, mtime: new Date('2025-12-31T00:00:00.000Z') } as Stats;
  let props: Parameters<typeof advanceMove>[0];

  beforeEach(() => {
    statMock.mockImplementation(({ absolutePath }) =>
      Promise.resolve(absolutePath === 'source' ? { data: sourceStats } : { error: new StatError('NON_EXISTS') }),
    );
    moveMock.mockResolvedValue(undefined);
    setMoveStageMock.mockReturnValue({ data: true });
    markRemovedMock.mockReturnValue({ data: true });

    props = mockProps<typeof advanceMove>({
      ctx: { userUuid: 'userUuid', workspaceId: '', logger: loggerMock },
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

  it('should not move again when the destination already exists', async () => {
    // Given
    statMock.mockResolvedValue({ data: sourceStats });
    // When
    const { data } = await advanceMove(props);
    // Then
    expect(data).toBe('done');
    calls(moveMock).toHaveLength(0);
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

  it('should move a folder without comparing its size', async () => {
    // Given
    props.move = { ...props.move, itemType: 'folder', sourceSize: null, sourceModifiedAt: null };
    // When
    const { data } = await advanceMove(props);
    // Then
    expect(data).toBe('done');
  });

  it('should fail when neither the source nor the destination exist', async () => {
    // Given
    statMock.mockResolvedValue({ error: new StatError('NON_EXISTS') });
    // When
    const { data } = await advanceMove(props);
    // Then
    expect(data).toBe('failed');
    calls(setMoveStageMock).toMatchObject([{ stage: 'failed' }]);
    call(loggerMock.error).toMatchObject({ msg: 'Recovery sync source not found to preserve' });
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
