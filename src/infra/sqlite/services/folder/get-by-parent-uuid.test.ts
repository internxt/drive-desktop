import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { loggerFn } from '@/tests/vitest/mocks.helper.test';
import { call, TestProps } from '@/tests/vitest/utils.helper.test';
import { db, runMigrations } from '../../migrations/run-migrations';
import { DriveFolder } from '../../schema';
import { getByParentUuid } from './get-by-parent-uuid';
import { upsertQuery } from './queries';

describe('get-by-parent-uuid', () => {
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

  const props: TestProps<typeof getByParentUuid> = {
    parentUuid: 'parentUuid' as FolderUuid,
  };

  beforeAll(() => {
    runMigrations();
  });

  afterAll(() => {
    db.close();
  });

  beforeEach(() => {
    db.exec('DELETE FROM drive_folder');
  });

  it('should return empty array when no folders exist', () => {
    // When
    const { data } = getByParentUuid(props as any);
    // Then
    expect(data).toStrictEqual([]);
  });

  it('should return all folders for a parentUuid', () => {
    // Given
    db.prepare(upsertQuery).run(folder);
    db.prepare(upsertQuery).run({ ...folder, uuid: 'uuid2', id: 2 });
    // When
    const { data } = getByParentUuid(props as any);
    // Then
    expect(data).toHaveLength(2);
  });

  it('should not return folders from a different parentUuid', () => {
    // Given
    db.prepare(upsertQuery).run({ ...folder, parentUuid: 'parentUuid2' });
    // When
    const { data } = getByParentUuid(props as any);
    // Then
    expect(data).toStrictEqual([]);
  });

  it('should return UNKNOWN when error is thrown', () => {
    // Given
    props.parentUuid = (() => null) as any;
    // When
    const { error } = getByParentUuid(props as any);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    call(loggerFn).toMatchObject({ error: { message: expect.stringContaining('cannot be bound') } });
  });
});
