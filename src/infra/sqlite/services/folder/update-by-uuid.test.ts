import { folderRepository } from '../drive-folder';
import { call, mockProps } from '@/tests/vitest/utils.helper.test';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { updateByUuid } from './update-by-uuid';
import { AppDataSource } from '@/apps/main/database/data-source';
import { DriveFolder, FolderUuid } from '@/apps/main/database/entities/DriveFolder';

describe('update-by-uuid', () => {
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

  let props: Parameters<typeof updateByUuid>[0];

  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  beforeEach(async () => {
    await folderRepository.clear();

    props = mockProps<typeof updateByUuid>({
      uuid: 'uuid' as FolderUuid,
    });
  });

  it('should return NOT_FOUND when no folder has been affected', async () => {
    // When
    const { error } = await updateByUuid(props);
    // Then
    expect(error?.code).toBe('NOT_FOUND');
  });

  it('should update folder status and return affected count', async () => {
    // Given
    await folderRepository.save(folder);
    props.payload = { status: 'TRASHED' };
    // When
    const { data } = await updateByUuid(props);
    // Then
    expect(data).toBe(1);
    expect(await folderRepository.exists({ where: { uuid: 'uuid', status: 'TRASHED' } })).toBe(true);
  });

  it('should return UNKNOWN when error is thrown', async () => {
    // Given
    await folderRepository.save(folder);
    props.payload = { status: null as any };
    // When
    const { error } = await updateByUuid(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    call(loggerMock.error).toMatchObject({ exc: { message: 'NOT NULL constraint failed: drive_folder.status' } });
  });
});
