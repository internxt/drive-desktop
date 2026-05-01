import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call } from '@/tests/vitest/utils.helper.test';
import { db, runMigrations } from '../../migrations/run-migrations';
import { DriveFolder } from '../../schema';
import { upsertQuery } from './queries';
import { updateByUuid } from './update-by-uuid';

describe('update-by-uuid', () => {
  const date = new Date().toISOString();
  const folder: DriveFolder = {
    uuid: 'uuid',
    id: 1,
    status: 'EXISTS',
    plainName: 'folder',
    parentUuid: 'parentUuid',
    parentId: 0,
    userUuid: 'userUuid',
    workspaceId: 'workspaceId',
    createdAt: date,
    updatedAt: date,
  };

  let props: Parameters<typeof updateByUuid>[0];

  beforeAll(() => {
    runMigrations();
  });

  afterAll(() => {
    db.close();
  });

  beforeEach(() => {
    db.exec('DELETE FROM drive_folder');

    props = {
      uuid: 'uuid' as FolderUuid,
      payload: { status: 'EXISTS' },
    };
  });

  it('should return NOT_FOUND when no folder has been affected', () => {
    // When
    const { error } = updateByUuid(props);
    // Then
    expect(error?.code).toBe('NOT_FOUND');
  });

  it('should update folder status and return affected count', () => {
    // Given
    db.prepare(upsertQuery).run(folder);
    props.payload = { status: 'TRASHED' };
    // When
    const { data } = updateByUuid(props);
    // Then
    expect(data).toBe(1);
    expect({ ...db.prepare(`SELECT status FROM drive_folder WHERE uuid = 'uuid'`).get() }).toStrictEqual({ status: 'TRASHED' });
  });

  it('should return UNKNOWN when error is thrown', () => {
    // Given
    db.prepare(upsertQuery).run(folder);
    props.payload = { status: null as any };
    // When
    const { error } = updateByUuid(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    call(loggerMock.error).toMatchObject({ exc: { message: 'NOT NULL constraint failed: drive_folder.status' } });
  });
});
