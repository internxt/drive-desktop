import { folderRepository } from '../drive-folder';
import { mockProps } from '@/tests/vitest/utils.helper.test';
import { getBetweenUuids } from './get-between-uuids';
import { AppDataSource } from '@/apps/main/database/data-source';
import { DriveFolder, FolderUuid } from '@/apps/main/database/entities/DriveFolder';

describe('get-between-uuids', () => {
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

  let props: Parameters<typeof getBetweenUuids>[0];

  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  beforeEach(async () => {
    await folderRepository.clear();

    props = mockProps<typeof getBetweenUuids>({
      userUuid: 'userUuid',
      workspaceId: 'workspaceId',
      firstUuid: 'uuid1' as FolderUuid,
      lastUuid: 'uuid3' as FolderUuid,
    });
  });

  it('should return empty array when no folders exist', async () => {
    // When
    const { data } = await getBetweenUuids(props);
    // Then
    expect(data).toStrictEqual([]);
  });

  it('should return folders between uuids', async () => {
    // Given
    await folderRepository.save([folder, { ...folder, uuid: 'uuid2', id: 2 }]);
    // When
    const { data } = await getBetweenUuids(props);
    // Then
    expect(data).toMatchObject([{ uuid: 'uuid1' }, { uuid: 'uuid2' }]);
  });

  it('should not return files outside the range', async () => {
    // Given
    await folderRepository.save({ ...folder, uuid: 'uuid4' });
    // When
    const { data } = await getBetweenUuids(props);
    // Then
    expect(data).toStrictEqual([]);
  });

  it('should not return folders from a different workspace', async () => {
    // Given
    await folderRepository.save({ ...folder, workspaceId: 'workspaceId2' });
    // When
    const { data } = await getBetweenUuids(props);
    // Then
    expect(data).toStrictEqual([]);
  });

  it('should not return folders with non-EXISTS status', async () => {
    // Given
    await folderRepository.save({ ...folder, status: 'TRASHED' });
    // When
    const { data } = await getBetweenUuids(props);
    // Then
    expect(data).toStrictEqual([]);
  });
});
