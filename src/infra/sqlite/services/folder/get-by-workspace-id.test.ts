import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call } from '@/tests/vitest/utils.helper.test';
import { db, runMigrations } from '../../migrations/run-migrations';
import { DriveFolder } from '../../schema';
import { getByWorkspaceId } from './get-by-workspace-id';
import { upsertQuery } from './queries';

describe('get-by-workspace-id', () => {
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

  let props: Parameters<typeof getByWorkspaceId>[0];

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
    };
  });

  it('should return empty array when no folders exist', () => {
    // When
    const { data } = getByWorkspaceId(props);
    // Then
    expect(data).toStrictEqual([]);
  });

  it('should return all folders for a workspace', () => {
    // Given
    db.prepare(upsertQuery).run(folder);
    db.prepare(upsertQuery).run({ ...folder, uuid: 'uuid2', id: 2 });
    // When
    const { data } = getByWorkspaceId(props);
    // Then
    expect(data).toHaveLength(2);
  });

  it('should not return folders from a different workspace', () => {
    // Given
    db.prepare(upsertQuery).run({ ...folder, workspaceId: 'workspaceId2' });
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
