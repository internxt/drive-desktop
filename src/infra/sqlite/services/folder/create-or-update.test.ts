import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call } from '@/tests/vitest/utils.helper.test';
import { db, runMigrations } from '../../migrations/run-migrations';
import { createOrUpdate } from './create-or-update';

describe('create-or-update', () => {
  const date = new Date().toISOString();
  let props: Parameters<typeof createOrUpdate>[0];

  beforeAll(() => {
    runMigrations();
  });

  afterAll(() => {
    db.close();
  });

  beforeEach(() => {
    db.exec('DELETE FROM drive_folder');

    props = {
      folder: {
        id: 1,
        uuid: 'uuid',
        status: 'EXISTS',
        parentUuid: null,
        parentId: null,
        userUuid: 'userUuid',
        workspaceId: null,
        createdAt: date,
        updatedAt: date,
        plainName: null,
      },
    };
  });

  it('should insert new folder', () => {
    // When
    createOrUpdate(props);
    // Then
    expect({ ...db.prepare('SELECT * FROM drive_folder').get() }).toStrictEqual({
      id: 1,
      uuid: 'uuid',
      status: 'EXISTS',
      plainName: null,
      createdAt: date,
      updatedAt: date,
      parentUuid: null,
      workspaceId: null,
      parentId: null,
      userUuid: 'userUuid',
    });
  });

  it('should update existing folder', () => {
    // When
    createOrUpdate(props);
    props.folder.plainName = 'folder';
    createOrUpdate(props);
    // Then
    expect({ ...db.prepare('SELECT * FROM drive_folder').get() }).toStrictEqual({
      id: 1,
      uuid: 'uuid',
      status: 'EXISTS',
      plainName: 'folder',
      createdAt: date,
      updatedAt: date,
      parentUuid: null,
      workspaceId: null,
      parentId: null,
      userUuid: 'userUuid',
    });
  });

  it('should return undefined if there is an error', () => {
    // Given
    props.folder = {} as any;
    // When
    const res = createOrUpdate(props);
    // Then
    expect(res).toBeUndefined();
    expect({ ...db.prepare('SELECT COUNT(*) FROM drive_folder').get() }).toStrictEqual({ 'COUNT(*)': 0 });
    call(loggerMock.error).toMatchObject({ error: { message: 'Provided value cannot be bound to SQLite parameter 1.' } });
  });
});
