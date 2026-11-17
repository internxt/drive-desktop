import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call } from '@/tests/vitest/utils.helper.test';
import { db, runMigrations } from '../../migrations/run-migrations';
import { DriveFolder } from '../../schema';
import { getFoldersByUuids } from './get-folders-by-uuids';
import { upsertQuery } from './queries';

describe('get-folders-by-uuids', () => {
  const date = new Date().toISOString();
  const folder: DriveFolder = {
    id: 1,
    uuid: 'uuid1',
    status: 'EXISTS',
    parentId: 1,
    parentUuid: 'parentUuid',
    userUuid: 'userUuid',
    workspaceId: 'workspaceId',
    createdAt: date,
    updatedAt: date,
    creationTime: date,
    modificationTime: date,
    plainName: 'folder',
  };

  let props: Parameters<typeof getFoldersByUuids>[0];

  beforeAll(() => {
    runMigrations();
  });

  afterAll(() => {
    db.close();
  });

  beforeEach(() => {
    db.exec('DELETE FROM drive_folder');
    props = { userUuid: 'userUuid', workspaceId: 'workspaceId', uuids: ['uuid1', 'uuid2'] };
  });

  it('should return folders with any status', () => {
    // Given
    db.prepare(upsertQuery).run(folder);
    db.prepare(upsertQuery).run({ ...folder, uuid: 'uuid2', status: 'DELETED' });
    // When
    const { data } = getFoldersByUuids(props);
    // Then
    expect(data?.map(({ uuid, status }) => ({ uuid, status })).sort((a, b) => a.uuid.localeCompare(b.uuid))).toStrictEqual([
      { uuid: 'uuid1', status: 'EXISTS' },
      { uuid: 'uuid2', status: 'DELETED' },
    ]);
  });

  it('should not return folders from another user or workspace', () => {
    // Given
    db.prepare(upsertQuery).run({ ...folder, workspaceId: '' });
    db.prepare(upsertQuery).run({ ...folder, uuid: 'uuid2', userUuid: 'userUuid2' });
    // When
    const { data } = getFoldersByUuids(props);
    // Then
    expect(data).toStrictEqual([]);
  });

  it('should return INVALID_ROW when a row does not match the folder schema', () => {
    // Given
    db.prepare(upsertQuery).run({ ...folder, status: 'INVALID' });
    // When
    const { error } = getFoldersByUuids(props);
    // Then
    expect(error?.code).toBe('INVALID_ROW');
  });

  it('should return UNKNOWN when error is thrown', () => {
    // Given
    props.userUuid = (() => null) as any;
    // When
    const { error } = getFoldersByUuids(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    call(loggerMock.error).toMatchObject({ msg: 'Error getting folders by uuids', count: 2 });
  });
});
