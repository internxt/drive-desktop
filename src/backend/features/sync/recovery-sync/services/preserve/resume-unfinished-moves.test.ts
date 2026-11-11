import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { RecoverySyncMove } from '@/infra/sqlite/schema';
import { SqliteError } from '@/infra/sqlite/services/common/sqlite-error';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as advanceMoveModule from './advance-move';
import { resumeUnfinishedMoves } from './resume-unfinished-moves';

describe('resume-unfinished-moves', () => {
  const getUnfinishedMovesMock = partialSpyOn(SqliteModule.RecoverySyncModule, 'getUnfinishedMoves');
  const advanceMoveMock = partialSpyOn(advanceMoveModule, 'advanceMove');

  let props: Parameters<typeof resumeUnfinishedMoves>[0];

  function move(itemType: RecoverySyncMove['itemType'], uuid: string) {
    return { itemType, uuid, source: `source-${uuid}`, stage: 'reserved' } as RecoverySyncMove;
  }

  beforeEach(() => {
    getUnfinishedMovesMock.mockReturnValue({ data: [] });
    advanceMoveMock.mockResolvedValue({ data: 'done' });
    props = mockProps<typeof resumeUnfinishedMoves>({
      ctx: { rootUuid: 'rootUuid' as FolderUuid, abortController: new AbortController() },
      startedAt: '2026-01-02T09:05:07.000Z',
    });
  });

  it('should finish folder moves before file moves, batch by batch', async () => {
    // Given
    getUnfinishedMovesMock
      .mockReturnValueOnce({ data: [move('folder', 'folder1')] })
      .mockReturnValueOnce({ data: [] })
      .mockReturnValueOnce({ data: [move('file', 'file1'), move('file', 'file2')] })
      .mockReturnValueOnce({ data: [] });
    // When
    const { data } = await resumeUnfinishedMoves(props);
    // Then
    expect(data).toStrictEqual([]);
    calls(getUnfinishedMovesMock).toMatchObject([
      { itemType: 'folder', afterUuid: '' },
      { itemType: 'folder', afterUuid: 'folder1' },
      { itemType: 'file', afterUuid: '' },
      { itemType: 'file', afterUuid: 'file2' },
    ]);
    calls(advanceMoveMock).toMatchObject([
      { move: { uuid: 'folder1' }, startedAt: '2026-01-02T09:05:07.000Z' },
      { move: { uuid: 'file1' } },
      { move: { uuid: 'file2' } },
    ]);
  });

  it('should return the sources of the moves that failed', async () => {
    // Given
    getUnfinishedMovesMock.mockReturnValueOnce({ data: [move('folder', 'folder1')] });
    advanceMoveMock.mockResolvedValue({ data: 'failed' });
    // When
    const { data } = await resumeUnfinishedMoves(props);
    // Then
    expect(data).toStrictEqual(['source-folder1']);
  });

  it('should stop when the moves cannot be read', async () => {
    // Given
    getUnfinishedMovesMock.mockReturnValue({ error: new SqliteError('UNKNOWN') });
    // When
    const { error } = await resumeUnfinishedMoves(props);
    // Then
    expect(error?.message).toBe('UNKNOWN');
  });

  it('should stop when a move cannot be saved', async () => {
    // Given
    getUnfinishedMovesMock.mockReturnValueOnce({ data: [move('folder', 'folder1'), move('folder', 'folder2')] });
    advanceMoveMock.mockResolvedValue({ error: new SqliteError('UNKNOWN') });
    // When
    const { error } = await resumeUnfinishedMoves(props);
    // Then
    expect(error?.message).toBe('UNKNOWN');
    calls(advanceMoveMock).toHaveLength(1);
  });

  it('should stop when the recovery is aborted', async () => {
    // Given
    props.ctx.abortController.abort();
    // When
    const { error } = await resumeUnfinishedMoves(props);
    // Then
    expect(error?.name).toBe('AbortError');
    calls(getUnfinishedMovesMock).toHaveLength(0);
  });
});
