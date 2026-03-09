import { folderRepository } from '../drive-folder';
import { mockProps } from '@/tests/vitest/utils.helper.test';
import { getByWorkspaceId } from './get-by-workspace-id';
import { AppDataSource } from '@/apps/main/database/data-source';
import { DriveFolder } from '@/apps/main/database/entities/DriveFolder';

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

  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  beforeEach(async () => {
    await folderRepository.clear();

    props = mockProps<typeof getByWorkspaceId>({
      userUuid: 'userUuid',
      workspaceId: 'workspaceId',
    });
  });

  it('should return empty array when no folders exist', async () => {
    // When
    const { data } = await getByWorkspaceId(props);
    // Then
    expect(data).toStrictEqual([]);
  });

  it('should return all folders for a workspace', async () => {
    // Given
    await folderRepository.save([folder, { ...folder, uuid: 'uuid2', id: 2 }]);
    // When
    const { data } = await getByWorkspaceId(props);
    // Then
    expect(data).toHaveLength(2);
  });

  it('should not return folders from a different workspace', async () => {
    // Given
    await folderRepository.save({ ...folder, workspaceId: 'workspaceId2' });
    // When
    const { data } = await getByWorkspaceId(props);
    // Then
    expect(data).toStrictEqual([]);
  });
});
