import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { loggerFn } from '@/tests/vitest/mocks.helper.test';
import { call, TestProps } from '@/tests/vitest/utils.helper.test';
import { db, runMigrations } from '../../migrations/run-migrations';
import { DriveFile } from '../../schema';
import { getByParentUuid } from './get-by-parent-uuid';
import { upsertQuery } from './queries';

describe('get-by-parent-uuid', () => {
  const date = new Date().toISOString();
  const file: DriveFile = {
    id: 1,
    uuid: 'uuid1',
    status: 'EXISTS',
    fileId: 'fileId',
    size: 1024,
    folderId: 1,
    folderUuid: 'parentUuid',
    userUuid: 'userUuid',
    workspaceId: 'workspaceId',
    createdAt: date,
    updatedAt: date,
    modificationTime: date,
    plainName: 'file',
    type: '',
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
    db.exec('DELETE FROM drive_file');
  });

  it('should return empty array when no files exist', () => {
    // When
    const { data } = getByParentUuid(props as any);
    // Then
    expect(data).toStrictEqual([]);
  });

  it('should return all files for a parentUuid', () => {
    // Given
    db.prepare(upsertQuery).run(file);
    db.prepare(upsertQuery).run({ ...file, uuid: 'uuid2', id: 2 });
    // When
    const { data } = getByParentUuid(props as any);
    // Then
    expect(data).toHaveLength(2);
  });

  it('should not return files from a different parentUuid', () => {
    // Given
    db.prepare(upsertQuery).run({ ...file, folderUuid: 'parentUuid2' });
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
