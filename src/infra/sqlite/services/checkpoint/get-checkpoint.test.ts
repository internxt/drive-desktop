import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call } from '@/tests/vitest/utils.helper.test';
import { db, runMigrations } from '../../migrations/run-migrations';
import { createOrUpdate } from './create-or-update';
import { getCheckpoint } from './get-checkpoint';

describe('get-checkpoint', () => {
  const props: Parameters<typeof getCheckpoint>[0] = {
    type: 'file',
    userUuid: 'userUuid',
    workspaceId: 'workspaceId',
  };

  beforeAll(() => {
    runMigrations();
  });

  afterAll(() => {
    db.close();
  });

  beforeEach(() => {
    db.exec('DELETE FROM checkpoint');
  });

  it('should return NOT_FOUND when checkpoint is not found', () => {
    // When
    const { error } = getCheckpoint(props);
    // Then
    expect(error?.code).toBe('NOT_FOUND');
  });

  it('should return checkpoint', () => {
    // Given
    createOrUpdate({ name: 'name', type: 'file', updatedAt: 'updatedAt', userUuid: 'userUuid', workspaceId: 'workspaceId' });
    // When
    const { data } = getCheckpoint(props);
    // Then
    expect(data).toMatchObject({ id: 1 });
  });

  it('should return UNKNOWN when error is thrown', () => {
    // Given
    props.userUuid = (() => null) as any;
    // When
    const { error } = getCheckpoint(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    call(loggerMock.error).toMatchObject({ error: { message: expect.stringContaining('cannot be bound') } });
  });
});
