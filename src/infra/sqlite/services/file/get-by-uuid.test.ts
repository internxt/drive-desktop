import { fileRepository } from '../drive-file';
import { mockProps } from '@/tests/vitest/utils.helper.test';
import { getByUuid } from './get-by-uuid';
import { AppDataSource } from '@/apps/main/database/data-source';
import { DriveFile } from '@/apps/main/database/entities/DriveFile';

describe('get-by-uuid', () => {
  const date = new Date().toISOString();
  const file: DriveFile = {
    status: 'EXISTS',
    id: 1,
    uuid: 'uuid',
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
    isDangledStatus: false,
  };

  let props: Parameters<typeof getByUuid>[0];

  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  beforeEach(async () => {
    await fileRepository.clear();

    props = mockProps<typeof getByUuid>({
      uuid: 'uuid',
    });
  });

  it('should return NOT_FOUND when file is not found', async () => {
    // When
    const { error } = await getByUuid(props);
    // Then
    expect(error?.code).toBe('NOT_FOUND');
  });

  it('should return file', async () => {
    // Given
    await fileRepository.save(file);
    // When
    const { data } = await getByUuid(props);
    // Then
    expect(data?.uuid).toBe('uuid');
  });
});
