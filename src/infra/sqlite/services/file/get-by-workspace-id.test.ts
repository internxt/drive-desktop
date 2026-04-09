import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call } from '@/tests/vitest/utils.helper.test';
import { db, runMigrations } from '../../migrations/run-migrations';
import { DriveFile } from '../../schema';
import { getByWorkspaceId } from './get-by-workspace-id';
import { upsertQuery } from './queries';

describe('get-by-workspace-id', () => {
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
    modificationTime: date,
    plainName: 'file',
    type: '',
  };

  let props: Parameters<typeof getByWorkspaceId>[0];

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
    };
  });

  it('should return empty array when no files exist', () => {
    // When
    const { data } = getByWorkspaceId(props);
    // Then
    expect(data).toStrictEqual([]);
  });

  it('should return all files for a workspace', () => {
    // Given
    db.prepare(upsertQuery).run(file);
    db.prepare(upsertQuery).run({ ...file, uuid: 'uuid2', id: 2 });
    // When
    const { data } = getByWorkspaceId(props);
    // Then
    expect(data).toHaveLength(2);
  });

  it('should not return files from a different workspace', () => {
    // Given
    db.prepare(upsertQuery).run({ ...file, workspaceId: 'workspaceId2' });
    // When
    const { data } = getByWorkspaceId(props);
    // Then
    expect(data).toStrictEqual([]);
  });

  it('should return UNKNOWN when error is thrown', () => {
    // Given
    props.userUuid = (() => null) as any;
    // When
    const { error } = getByWorkspaceId(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    call(loggerMock.error).toMatchObject({ exc: { message: expect.stringContaining('cannot be bound') } });
  });
});
