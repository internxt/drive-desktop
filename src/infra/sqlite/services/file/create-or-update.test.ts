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
    db.exec('DELETE FROM drive_file');

    props = {
      file: {
        id: 1,
        uuid: 'uuid',
        status: 'EXISTS',
        fileId: 'fileId',
        size: 1024,
        folderId: 1,
        folderUuid: 'folderUuid',
        createdAt: date,
        updatedAt: date,
        modificationTime: date,
        plainName: 'plainName',
        type: 'type',
        userUuid: 'userUuid',
        workspaceId: 'workspaceId',
      },
    };
  });

  it('should insert new file', () => {
    // When
    createOrUpdate(props);
    // Then
    expect({ ...db.prepare('SELECT * FROM drive_file').get() }).toStrictEqual({
      id: 1,
      uuid: 'uuid',
      status: 'EXISTS',
      plainName: 'plainName',
      type: 'type',
      createdAt: date,
      updatedAt: date,
      folderUuid: 'folderUuid',
      workspaceId: 'workspaceId',
      fileId: 'fileId',
      size: 1024,
      folderId: 1,
      userUuid: 'userUuid',
      modificationTime: date,
    });
  });

  it('should update existing file', () => {
    // When
    createOrUpdate(props);
    props.file.plainName = 'file';
    createOrUpdate(props);
    // Then
    expect({ ...db.prepare('SELECT * FROM drive_file').get() }).toStrictEqual({
      id: 1,
      uuid: 'uuid',
      status: 'EXISTS',
      plainName: 'file',
      type: 'type',
      createdAt: date,
      updatedAt: date,
      folderUuid: 'folderUuid',
      workspaceId: 'workspaceId',
      fileId: 'fileId',
      size: 1024,
      folderId: 1,
      userUuid: 'userUuid',
      modificationTime: date,
    });
  });

  it('should return UNKNOWN if there is an error', () => {
    // Given
    props.file = {} as any;
    // When
    const res = createOrUpdate(props);
    // Then
    expect(res).toBeUndefined();
    expect({ ...db.prepare('SELECT COUNT(*) FROM drive_file').get() }).toStrictEqual({ 'COUNT(*)': 0 });
    call(loggerMock.error).toMatchObject({ error: { message: 'Provided value cannot be bound to SQLite parameter 1.' } });
  });
});
