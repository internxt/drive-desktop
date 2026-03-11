import { folderRepository } from '../drive-folder';
import { call, mockProps } from '@/tests/vitest/utils.helper.test';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { getByUuid } from './get-by-uuid';
import { AppDataSource } from '@/apps/main/database/data-source';
import { DriveFolder } from '@/apps/main/database/entities/DriveFolder';

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

  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  beforeEach(async () => {
    await folderRepository.clear();

    props = mockProps<typeof getByUuid>({
      uuid: 'uuid',
    });
  });

  it('should return NOT_FOUND when folder is not found', async () => {
    // When
    const { error } = await getByUuid(props);
    // Then
    expect(error?.code).toBe('NOT_FOUND');
  });

  it('should return folder', async () => {
    // Given
    await folderRepository.save(folder);
    // When
    const { data } = await getByUuid(props);
    // Then
    expect(data?.uuid).toBe('uuid');
  });

  it('should return UNKNOWN when error is thrown', async () => {
    // Given
    props.uuid = (() => null) as any;
    // When
    const { error } = await getByUuid(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    call(loggerMock.error).toMatchObject({ exc: { message: expect.stringContaining('Function parameter') } });
  });
});
