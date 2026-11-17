import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call } from '@/tests/vitest/utils.helper.test';
import { db, runMigrations } from '../../migrations/run-migrations';
import { RecoverySyncMoveStage } from '../../schema';
import { clearTables, getMoves, insertMove } from './recovery-sync.helper.test';
import { setMoveStage } from './set-move-stage';

describe('set-move-stage', () => {
  let props: Parameters<typeof setMoveStage>[0];

  beforeAll(() => {
    runMigrations();
  });

  afterAll(() => {
    db.close();
  });

  beforeEach(() => {
    clearTables();
    props = { rootUuid: 'rootUuid', itemType: 'file', uuid: 'uuid1', stage: 'moved' };
  });

  it.each<[RecoverySyncMoveStage, RecoverySyncMoveStage]>([
    ['reserved', 'moved'],
    ['moved', 'done'],
    ['reserved', 'conflict'],
    ['moved', 'conflict'],
    ['reserved', 'failed'],
    ['failed', 'reserved'],
  ])('should change the stage from %s to %s', (from, to) => {
    // Given
    insertMove({ uuid: 'uuid1', stage: from });
    // When
    const { data } = setMoveStage({ ...props, stage: to });
    // Then
    expect(data).toBe(true);
    expect(getMoves()).toMatchObject([{ stage: to }]);
  });

  it.each<[RecoverySyncMoveStage, RecoverySyncMoveStage]>([
    ['moved', 'moved'],
    ['reserved', 'done'],
    ['done', 'reserved'],
    ['done', 'conflict'],
    ['conflict', 'reserved'],
    ['moved', 'failed'],
  ])('should keep the stage %s when changing it to %s', (from, to) => {
    // Given
    insertMove({ uuid: 'uuid1', stage: from });
    // When
    const { data } = setMoveStage({ ...props, stage: to });
    // Then
    expect(data).toBe(false);
    expect(getMoves()).toMatchObject([{ stage: from }]);
  });

  it('should only change the move of the item', () => {
    // Given
    insertMove({ uuid: 'uuid1' });
    insertMove({ uuid: 'uuid1', itemType: 'folder' });
    insertMove({ uuid: 'uuid1', rootUuid: 'otherRootUuid' });
    // When
    setMoveStage(props);
    // Then
    expect(getMoves()).toMatchObject([
      { rootUuid: 'otherRootUuid', stage: 'reserved' },
      { rootUuid: 'rootUuid', itemType: 'file', stage: 'moved' },
      { rootUuid: 'rootUuid', itemType: 'folder', stage: 'reserved' },
    ]);
  });

  it('should return UNKNOWN when error is thrown', () => {
    // Given
    props.uuid = (() => null) as any;
    // When
    const { error } = setMoveStage(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    call(loggerMock.error).toMatchObject({ msg: 'Error setting recovery sync move stage' });
  });
});
