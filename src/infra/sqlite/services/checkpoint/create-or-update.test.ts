import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call } from '@/tests/vitest/utils.helper.test';
import { db, runMigrations } from '../../migrations/run-migrations';
import { createOrUpdate } from './create-or-update';

describe('create-or-update', () => {
  let props: Parameters<typeof createOrUpdate>[0];

  beforeAll(() => {
    runMigrations();
  });

  afterAll(() => {
    db.close();
  });

  beforeEach(() => {
    db.exec('DELETE FROM checkpoint');

    props = {
      type: 'file',
      userUuid: 'userUuid1',
      workspaceId: 'workspaceId1',
      name: 'name',
      updatedAt: 'updatedAt1',
    };
  });

  it('should return UNKNOWN when error is thrown', () => {
    // Given
    props.type = undefined as any;
    // When
    const error = createOrUpdate(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    call(loggerMock.error).toMatchObject({ error: { message: expect.stringContaining('cannot be bound') } });
  });

  it('should create checkpoint if not exists', () => {
    // When
    createOrUpdate(props);
    // Then
    expect(db.prepare('SELECT * FROM checkpoint').all()).toMatchObject([{ updatedAt: 'updatedAt1' }]);
  });

  it('should update checkpoint if exists', () => {
    // Given
    createOrUpdate(props);
    props.updatedAt = 'updatedAt2';
    // When
    createOrUpdate(props);
    // Then
    expect(db.prepare('SELECT * FROM checkpoint').all()).toMatchObject([{ updatedAt: 'updatedAt2' }]);
  });

  it('should create checkpoint if different type', () => {
    // Given
    createOrUpdate(props);
    props.type = 'folder';
    // When
    createOrUpdate(props);
    // Then
    expect(db.prepare('SELECT * FROM checkpoint').all()).toMatchObject([{ type: 'file' }, { type: 'folder' }]);
  });

  it('should create checkpoint if different userUuid', () => {
    // Given
    createOrUpdate(props);
    props.userUuid = 'userUuid2';
    // When
    createOrUpdate(props);
    // Then
    expect(db.prepare('SELECT * FROM checkpoint').all()).toMatchObject([{ userUuid: 'userUuid1' }, { userUuid: 'userUuid2' }]);
  });

  it('should create checkpoint if different workspaceId', () => {
    // Given
    createOrUpdate(props);
    props.workspaceId = 'workspaceId2';
    // When
    createOrUpdate(props);
    // Then
    expect(db.prepare('SELECT * FROM checkpoint').all()).toMatchObject([{ workspaceId: 'workspaceId1' }, { workspaceId: 'workspaceId2' }]);
  });
});
