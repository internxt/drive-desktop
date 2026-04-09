import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call } from '@/tests/vitest/utils.helper.test';
import { db, runMigrations } from '../../migrations/run-migrations';
import { DriveFile } from '../../schema';
import { getByName } from './get-by-name';
import { upsertQuery } from './queries';

describe('get-by-name', () => {
  const date = new Date().toISOString();
  const file: DriveFile = {
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
    type: 'txt',
  };

  let props: Parameters<typeof getByName>[0];

  beforeAll(() => {
    runMigrations();
  });

  afterAll(() => {
    db.close();
  });

  beforeEach(() => {
    db.exec('DELETE FROM drive_file');

    props = {
      parentUuid: 'folderUuid' as FolderUuid,
      nameWithExtension: 'file.txt',
    };
  });

  it('should return NOT_FOUND when file is not found', () => {
    // When
    const { error } = getByName(props);
    // Then
    expect(error?.code).toBe('NOT_FOUND');
  });

  it('should return file', () => {
    // Given
    db.prepare(upsertQuery).run(file);
    // When
    const { data } = getByName(props);
    // Then
    expect(data?.uuid).toBe('uuid');
  });

  it('should return NOT_FOUND when file status is not EXISTS', () => {
    // Given
    db.prepare(upsertQuery).run({ ...file, status: 'TRASHED' });
    // When
    const { error } = getByName(props);
    // Then
    expect(error?.code).toBe('NOT_FOUND');
  });

  it('should return UNKNOWN when error is thrown', () => {
    // Given
    props.parentUuid = (() => null) as any;
    // When
    const { error } = getByName(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    call(loggerMock.error).toMatchObject({ exc: { message: expect.stringContaining('cannot be bound') } });
  });
});
