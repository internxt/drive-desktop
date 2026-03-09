import { fileRepository } from '../drive-file';
import { mockProps } from '@/tests/vitest/utils.helper.test';
import { getBetweenUuids } from './get-between-uuids';
import { AppDataSource } from '@/apps/main/database/data-source';
import { DriveFile, FileUuid } from '@/apps/main/database/entities/DriveFile';

describe('get-between-uuids', () => {
  const date = new Date().toISOString();
  let props: Parameters<typeof getBetweenUuids>[0];

  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  beforeEach(async () => {
    await AppDataSource.getRepository(DriveFile).clear();

    props = mockProps<typeof getBetweenUuids>({
      userUuid: 'userUuid',
      workspaceId: 'workspaceId',
      firstUuid: 'uuid1' as FileUuid,
      lastUuid: 'uuid3' as FileUuid,
    });
  });

  it('should return empty array when no files exist', async () => {
    // When
    const { data } = await getBetweenUuids(props);
    // Then
    expect(data).toStrictEqual([]);
  });

  it('should return files between uuids', async () => {
    // Given
    await fileRepository.save([
      {
        id: 1,
        uuid: 'uuid1',
        status: 'EXISTS',
        fileId: 'fileId1',
        size: 1024,
        folderId: 1,
        folderUuid: 'folderUuid',
        userUuid: 'userUuid',
        workspaceId: 'workspaceId',
        createdAt: date,
        updatedAt: date,
        modificationTime: date,
      },
      {
        id: 2,
        uuid: 'uuid2',
        status: 'EXISTS',
        fileId: 'fileId2',
        size: 2048,
        folderId: 1,
        folderUuid: 'folderUuid',
        userUuid: 'userUuid',
        workspaceId: 'workspaceId',
        createdAt: date,
        updatedAt: date,
        modificationTime: date,
      },
    ]);
    // When
    const { data } = await getBetweenUuids(props);
    // Then
    expect(data).toHaveLength(2);
  });

  it('should not return files outside the uuid range', async () => {
    // Given
    await fileRepository.save({
      id: 1,
      uuid: 'uuid9',
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
    });
    // When
    const { data } = await getBetweenUuids(props);
    // Then
    expect(data).toStrictEqual([]);
  });

  it('should not return files from a different workspace', async () => {
    // Given
    await fileRepository.save({
      id: 1,
      uuid: 'uuid2',
      status: 'EXISTS',
      fileId: 'fileId',
      size: 1024,
      folderId: 1,
      folderUuid: 'folderUuid',
      userUuid: 'userUuid',
      workspaceId: 'other-workspace',
      createdAt: date,
      updatedAt: date,
      modificationTime: date,
    });
    // When
    const { data } = await getBetweenUuids(props);
    // Then
    expect(data).toStrictEqual([]);
  });

  it('should not return files with non-EXISTS status', async () => {
    // Given
    await fileRepository.save({
      id: 1,
      uuid: 'uuid2',
      status: 'TRASHED',
      fileId: 'fileId',
      size: 1024,
      folderId: 1,
      folderUuid: 'folderUuid',
      userUuid: 'userUuid',
      workspaceId: 'workspaceId',
      createdAt: date,
      updatedAt: date,
      modificationTime: date,
    });
    // When
    const { data } = await getBetweenUuids(props);
    // Then
    expect(data).toStrictEqual([]);
  });
});
