import { folderRepository } from '../drive-folder';
import { mockProps } from '@/tests/vitest/utils.helper.test';
import { getByName } from './get-by-name';
import { AppDataSource } from '@/apps/main/database/data-source';
import { DriveFolder, FolderUuid } from '@/apps/main/database/entities/DriveFolder';

describe('get-by-name', () => {
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

  let props: Parameters<typeof getByName>[0];

  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  beforeEach(async () => {
    await folderRepository.clear();

    props = mockProps<typeof getByName>({
      parentUuid: 'parentUuid' as FolderUuid,
      plainName: 'folder',
    });
  });

  it('should return NOT_FOUND when folder is not found', async () => {
    // When
    const { error } = await getByName(props);
    // Then
    expect(error?.code).toBe('NOT_FOUND');
  });

  it('should return folder', async () => {
    // Given
    await folderRepository.save(folder);
    // When
    const { data } = await getByName(props);
    // Then
    expect(data?.uuid).toBe('uuid');
  });

  it('should return NOT_FOUND when folder status is not EXISTS', async () => {
    // Given
    await folderRepository.save({ ...folder, status: 'TRASHED' });
    // When
    const { error } = await getByName(props);
    // Then
    expect(error?.code).toBe('NOT_FOUND');
  });
});
