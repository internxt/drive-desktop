import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call } from '@/tests/vitest/utils.helper.test';
import { db, runMigrations } from '../../migrations/run-migrations';
import { DriveFolder } from '../../schema';
import { getBetweenUuids } from './get-between-uuids';
import { upsertQuery } from './queries';

describe('get-between-uuids', () => {
  const date = new Date().toISOString();
  const folder: DriveFolder = {
    uuid: 'uuid1',
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

  let props: Parameters<typeof getBetweenUuids>[0];

  beforeAll(() => {
    runMigrations();
  });

  afterAll(() => {
    db.close();
  });

  beforeEach(() => {
    db.exec('DELETE FROM drive_folder');

    props = {
      userUuid: 'userUuid',
      workspaceId: 'workspaceId',
      firstUuid: 'uuid1' as FolderUuid,
      lastUuid: 'uuid3' as FolderUuid,
    };
  });

  it('should return empty array when no folders exist', () => {
    // When
    const { data } = getBetweenUuids(props);
    // Then
    expect(data).toStrictEqual([]);
  });

  it('should return folders between uuids', () => {
    // Given
    db.prepare(upsertQuery).run(folder);
    db.prepare(upsertQuery).run({ ...folder, uuid: 'uuid2', id: 2 });
    // When
    const { data } = getBetweenUuids(props);
    // Then
    expect(data).toMatchObject([{ uuid: 'uuid1' }, { uuid: 'uuid2' }]);
  });

  it('should not return files outside the range', () => {
    // Given
    db.prepare(upsertQuery).run({ ...folder, uuid: 'uuid4' });
    // When
    const { data } = getBetweenUuids(props);
    // Then
    expect(data).toStrictEqual([]);
  });

  it('should not return folders from a different workspace', () => {
    // Given
    db.prepare(upsertQuery).run({ ...folder, workspaceId: 'workspaceId2' });
    // When
    const { data } = getBetweenUuids(props);
    // Then
    expect(data).toStrictEqual([]);
  });

  it('should not return folders with non-EXISTS status', () => {
    // Given
    db.prepare(upsertQuery).run({ ...folder, status: 'TRASHED' });
    // When
    const { data } = getBetweenUuids(props);
    // Then
    expect(data).toStrictEqual([]);
  });

  it('should return UNKNOWN when error is thrown', () => {
    // Given
    props.userUuid = (() => null) as any;
    // When
    const { error } = getBetweenUuids(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    call(loggerMock.error).toMatchObject({ error: { message: expect.stringContaining('cannot be bound') } });
  });
});
