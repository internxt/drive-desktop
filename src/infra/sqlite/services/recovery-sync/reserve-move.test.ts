import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call } from '@/tests/vitest/utils.helper.test';
import { db, runMigrations } from '../../migrations/run-migrations';
import { clearTables, getMove, getMoves, insertMove } from './recovery-sync.helper.test';
import { reserveMove } from './reserve-move';

describe('reserve-move', () => {
  let props: Parameters<typeof reserveMove>[0];

  beforeAll(() => {
    runMigrations();
  });

  afterAll(() => {
    db.close();
  });

  beforeEach(() => {
    clearTables();
    props = getMove();
  });

  it('should reserve the move with the reserved stage', () => {
    // When
    const { data } = reserveMove(props);
    // Then
    expect(data).toStrictEqual({ ...props, stage: 'reserved' });
  });

  it('should reserve a folder without size and modification time', () => {
    // Given
    props = { ...props, itemType: 'folder', sourceSize: null, sourceModifiedAt: null };
    // When
    const { data } = reserveMove(props);
    // Then
    expect(data).toMatchObject({ itemType: 'folder', sourceSize: null, sourceModifiedAt: null });
  });

  it('should return the recorded move when the item already has one', () => {
    // Given
    insertMove({ uuid: 'uuid1', destination: String.raw`C:\recorded`, stage: 'moved' });
    // When
    const { data } = reserveMove(props);
    // Then
    expect(data).toMatchObject({ destination: String.raw`C:\recorded`, stage: 'moved' });
    expect(getMoves()).toHaveLength(1);
  });

  it('should return DESTINATION_TAKEN when the destination is recorded for another item', () => {
    // Given
    insertMove({ uuid: 'uuid2', destination: props.destination });
    // When
    const { error } = reserveMove(props);
    // Then
    expect(error?.code).toBe('DESTINATION_TAKEN');
    expect(getMoves()).toMatchObject([{ uuid: 'uuid2' }]);
  });

  it('should return UNKNOWN when error is thrown', () => {
    // Given
    props.uuid = (() => null) as any;
    // When
    const { error } = reserveMove(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    call(loggerMock.error).toMatchObject({ msg: 'Error reserving recovery sync move' });
  });
});
