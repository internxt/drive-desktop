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
    db.exec('DELETE FROM drive_file');

    props = {
      files: Array.from({ length: 450 }).map((_, idx) => ({
        id: idx,
        uuid: `uuid${idx}`,
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
      })),
    };
  });

  it('should ignore if no files', () => {
    // Given
    props.files = [];
    // When
    const error = createOrUpdateBatch(props);
    // Then
    expect(error).toBeUndefined();
    expect({ ...db.prepare('SELECT COUNT(*) FROM drive_file').get() }).toStrictEqual({ 'COUNT(*)': 0 });
  });

  it('should insert new files', () => {
    // When
    const error = createOrUpdateBatch(props);
    // Then
    expect(error).toBeUndefined();
    expect({ ...db.prepare('SELECT COUNT(*) FROM drive_file').get() }).toStrictEqual({ 'COUNT(*)': 450 });
    expect({ ...db.prepare('SELECT * FROM drive_file').get() }).toStrictEqual({
      id: 0,
      uuid: 'uuid0',
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

  it('should update existing files', () => {
    // Given
    props.files[1].uuid = 'uuid0';
    props.files[1].plainName = 'file';
    // When
    const error = createOrUpdateBatch(props);
    // Then
    expect(error).toBeUndefined();
    expect({ ...db.prepare('SELECT COUNT(*) FROM drive_file').get() }).toStrictEqual({ 'COUNT(*)': 449 });
    expect({ ...db.prepare('SELECT COUNT(*) FROM drive_file WHERE uuid = ?').get('uuid0') }).toStrictEqual({ 'COUNT(*)': 1 });
    expect({ ...db.prepare('SELECT COUNT(*) FROM drive_file WHERE uuid = ?').get('uuid1') }).toStrictEqual({ 'COUNT(*)': 0 });
  });

  it('should return UNKNOWN when error is thrown', () => {
    // Given
    props.files.push({} as any);
    // When
    const error = createOrUpdateBatch(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    expect({ ...db.prepare('SELECT COUNT(*) FROM drive_file').get() }).toStrictEqual({ 'COUNT(*)': 400 });
    call(loggerMock.error).toMatchObject({ error: { message: 'Provided value cannot be bound to SQLite parameter 1.' } });
  });
});
