import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call } from '@/tests/vitest/utils.helper.test';
import { db, runMigrations } from '../../migrations/run-migrations';
import { getBetweenUuids } from './get-between-uuids';
import { upsertQuery } from './queries';

describe('get-between-uuids', () => {
  const date = new Date().toISOString();
  const file = {
    id: 1,
    uuid: 'uuid1',
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

  let props: Parameters<typeof getBetweenUuids>[0];

  beforeAll(() => {
    runMigrations();
  });

  afterAll(() => {
    db.close();
  });

  beforeEach(() => {
    db.exec('DELETE FROM drive_file');

    props = {
      userUuid: 'userUuid',
      workspaceId: 'workspaceId',
      firstUuid: 'uuid1' as FileUuid,
      lastUuid: 'uuid3' as FileUuid,
    };
  });

  it('should return empty array when no files exist', () => {
    // When
    const { data } = getBetweenUuids(props);
    // Then
    expect(data).toStrictEqual([]);
  });

  it('should return files between uuids', () => {
    // Given
    db.prepare(upsertQuery).run(file);
    db.prepare(upsertQuery).run({ ...file, uuid: 'uuid2', id: 2 });
    // When
    const { data } = getBetweenUuids(props);
    // Then
    expect(data).toMatchObject([{ uuid: 'uuid1' }, { uuid: 'uuid2' }]);
  });

  it('should not return files outside the range', () => {
    // Given
    db.prepare(upsertQuery).run({ ...file, uuid: 'uuid4' });
    // When
    const { data } = getBetweenUuids(props);
    // Then
    expect(data).toStrictEqual([]);
  });

  it('should not return files from a different workspace', () => {
    // Given
    db.prepare(upsertQuery).run({ ...file, workspaceId: 'workspaceId2' });
    // When
    const { data } = getBetweenUuids(props);
    // Then
    expect(data).toStrictEqual([]);
  });

  it('should not return files with non-EXISTS status', () => {
    // Given
    db.prepare(upsertQuery).run({ ...file, status: 'TRASHED' });
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
