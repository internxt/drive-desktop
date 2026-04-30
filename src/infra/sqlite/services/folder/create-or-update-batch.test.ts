import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call } from '@/tests/vitest/utils.helper.test';
import { db, runMigrations } from '../../migrations/run-migrations';
import { createOrUpdateBatch } from './create-or-update-batch';

describe('create-or-update-batch', () => {
  const date = new Date().toISOString();
  let props: Parameters<typeof createOrUpdateBatch>[0];

  beforeAll(() => {
    runMigrations();
  });

  afterAll(() => {
    db.close();
  });

  beforeEach(() => {
    db.exec('DELETE FROM drive_folder');

    props = {
      folders: Array.from({ length: 450 }).map((_, idx) => ({
        id: idx,
        uuid: `uuid${idx}`,
        status: 'EXISTS',
        parentId: null,
        parentUuid: 'parentUuid',
        userUuid: 'userUuid',
        workspaceId: 'workspaceId',
        createdAt: date,
        updatedAt: date,
        plainName: 'plainName',
      })),
    };
  });

  it('should ignore if no folders', () => {
    // Given
    props.folders = [];
    // When
    const error = createOrUpdateBatch(props);
    // Then
    expect(error).toBeUndefined();
    expect({ ...db.prepare('SELECT COUNT(*) FROM drive_folder').get() }).toStrictEqual({ 'COUNT(*)': 0 });
  });

  it('should insert new folders', () => {
    // When
    const error = createOrUpdateBatch(props);
    // Then
    expect(error).toBeUndefined();
    expect({ ...db.prepare('SELECT COUNT(*) FROM drive_folder').get() }).toStrictEqual({ 'COUNT(*)': 450 });
    expect({ ...db.prepare('SELECT * FROM drive_folder').get() }).toStrictEqual({
      id: 0,
      uuid: 'uuid0',
      status: 'EXISTS',
      plainName: 'plainName',
      createdAt: date,
      updatedAt: date,
      parentUuid: 'parentUuid',
      workspaceId: 'workspaceId',
      parentId: null,
      userUuid: 'userUuid',
    });
  });

  it('should update existing folders', () => {
    // Given
    props.folders[1].uuid = 'uuid0';
    props.folders[1].plainName = 'folder';
    // When
    const error = createOrUpdateBatch(props);
    // Then
    expect(error).toBeUndefined();
    expect({ ...db.prepare('SELECT COUNT(*) FROM drive_folder').get() }).toStrictEqual({ 'COUNT(*)': 449 });
    expect({ ...db.prepare('SELECT COUNT(*) FROM drive_folder WHERE uuid = ?').get('uuid1') }).toStrictEqual({ 'COUNT(*)': 0 });
  });

  it('should return UNKNOWN when error is thrown', () => {
    // Given
    props.folders.push({} as any);
    // When
    const error = createOrUpdateBatch(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    expect({ ...db.prepare('SELECT COUNT(*) FROM drive_folder').get() }).toStrictEqual({ 'COUNT(*)': 400 });
    call(loggerMock.error).toMatchObject({ error: { message: 'Provided value cannot be bound to SQLite parameter 1.' } });
  });
});
