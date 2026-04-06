import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call } from '@/tests/vitest/utils.helper.test';
import { db, runMigrations } from '../../migrations/run-migrations';
import { upsertQuery } from './queries';
import { updateByUuid } from './update-by-uuid';

describe('update-by-uuid', () => {
  const date = new Date().toISOString();
  const file = {
    id: 1,
    uuid: 'uuid',
    status: 'EXISTS',
    fileId: 'fileId',
    size: 1024,
    folderId: 1,
    folderUuid: 'folderUuid',
    userUuid: 'userUuid',
    workspaceId: 'workspaceId',
    createdAt: date,
    updatedAt: date,
    modificationTime: date,
    plainName: 'file',
    type: '',
  };

  let props: Parameters<typeof updateByUuid>[0];

  beforeAll(() => {
    runMigrations();
  });

  afterAll(() => {
    db.close();
  });

  beforeEach(() => {
    db.exec('DELETE FROM drive_file');

    props = {
      uuid: 'uuid' as FileUuid,
      payload: { status: 'EXISTS' },
    };
  });

  it('should return NOT_FOUND when no file has been affected', () => {
    // When
    const { error } = updateByUuid(props);
    // Then
    expect(error?.code).toBe('NOT_FOUND');
  });

  it('should update file status and return affected count', () => {
    // Given
    db.prepare(upsertQuery).run(file);
    props.payload = { status: 'TRASHED' };
    // When
    const { data } = updateByUuid(props);
    // Then
    expect(data).toBe(1);
    expect({ ...db.prepare(`SELECT status FROM drive_file WHERE uuid = 'uuid'`).get() }).toStrictEqual({ status: 'TRASHED' });
  });

  it('should return UNKNOWN when error is thrown', () => {
    // Given
    db.prepare(upsertQuery).run(file);
    props.payload = { status: null as any };
    // When
    const { error } = updateByUuid(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    call(loggerMock.error).toMatchObject({ exc: { message: 'NOT NULL constraint failed: drive_file.status' } });
  });
});
