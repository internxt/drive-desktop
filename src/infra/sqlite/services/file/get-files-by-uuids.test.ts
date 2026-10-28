import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call } from '@/tests/vitest/utils.helper.test';
import { db, runMigrations } from '../../migrations/run-migrations';
import { DriveFile } from '../../schema';
import { getFilesByUuids } from './get-files-by-uuids';
import { upsertQuery } from './queries';

describe('get-files-by-uuids', () => {
  const date = new Date().toISOString();
  const file: DriveFile = {
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
    creationTime: date,
    modificationTime: date,
    plainName: 'file',
    type: '',
  };

  let props: Parameters<typeof getFilesByUuids>[0];

  beforeAll(() => {
    runMigrations();
  });

  afterAll(() => {
    db.close();
  });

  beforeEach(() => {
    db.exec('DELETE FROM drive_file');
    props = { userUuid: 'userUuid', workspaceId: 'workspaceId', uuids: ['uuid1', 'uuid2', 'uuid3'] };
  });

  it('should return files with any status', () => {
    // Given
    db.prepare(upsertQuery).run(file);
    db.prepare(upsertQuery).run({ ...file, uuid: 'uuid2', status: 'TRASHED' });
    db.prepare(upsertQuery).run({ ...file, uuid: 'uuid3', status: 'DELETED' });
    // When
    const { data } = getFilesByUuids(props);
    // Then
    expect(data?.map(({ uuid, status }) => ({ uuid, status })).sort((a, b) => a.uuid.localeCompare(b.uuid))).toStrictEqual([
      { uuid: 'uuid1', status: 'EXISTS' },
      { uuid: 'uuid2', status: 'TRASHED' },
      { uuid: 'uuid3', status: 'DELETED' },
    ]);
  });

  it('should not return files that were not requested', () => {
    // Given
    db.prepare(upsertQuery).run({ ...file, uuid: 'uuid4' });
    // When
    const { data } = getFilesByUuids(props);
    // Then
    expect(data).toStrictEqual([]);
  });

  it('should not return files from another user or workspace', () => {
    // Given
    db.prepare(upsertQuery).run({ ...file, workspaceId: '' });
    db.prepare(upsertQuery).run({ ...file, uuid: 'uuid2', userUuid: 'userUuid2' });
    // When
    const { data } = getFilesByUuids(props);
    // Then
    expect(data).toStrictEqual([]);
  });

  it('should return INVALID_ROW when a row does not match the file schema', () => {
    // Given
    db.prepare(upsertQuery).run({ ...file, status: 'INVALID' });
    // When
    const { error } = getFilesByUuids(props);
    // Then
    expect(error?.code).toBe('INVALID_ROW');
  });

  it('should return UNKNOWN when error is thrown', () => {
    // Given
    props.userUuid = (() => null) as any;
    // When
    const { error } = getFilesByUuids(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    call(loggerMock.error).toMatchObject({ msg: 'Error getting files by uuids', count: 3 });
  });
});
