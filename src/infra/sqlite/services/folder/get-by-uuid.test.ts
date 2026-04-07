import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call } from '@/tests/vitest/utils.helper.test';
import { db, runMigrations } from '../../migrations/run-migrations';
import { DriveFolder } from '../../schema';
import { getByUuid } from './get-by-uuid';
import { upsertQuery } from './queries';

describe('get-by-uuid', () => {
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

  let props: Parameters<typeof getByUuid>[0];

  beforeAll(() => {
    runMigrations();
  });

  afterAll(() => {
    db.close();
  });

  beforeEach(() => {
    db.exec('DELETE FROM drive_folder');

    props = { uuid: 'uuid' };
  });

  it('should return NOT_FOUND when folder is not found', () => {
    // When
    const { error } = getByUuid(props);
    // Then
    expect(error?.code).toBe('NOT_FOUND');
  });

  it('should return folder', () => {
    // Given
    db.prepare(upsertQuery).run(folder);
    // When
    const { data } = getByUuid(props);
    // Then
    expect(data?.uuid).toBe('uuid');
  });

  it('should return UNKNOWN when error is thrown', () => {
    // Given
    props.uuid = (() => null) as any;
    // When
    const { error } = getByUuid(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    call(loggerMock.error).toMatchObject({ exc: { message: expect.stringContaining('cannot be bound') } });
  });
});
