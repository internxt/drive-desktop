import { fileRepository } from '../drive-file';
import { mockProps } from '@/tests/vitest/utils.helper.test';
import { updateByUuid } from './update-by-uuid';
import { AppDataSource } from '@/apps/main/database/data-source';
import { DriveFile, FileUuid } from '@/apps/main/database/entities/DriveFile';

describe('update-by-uuid', () => {
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
    type: '',
    isDangledStatus: true,
  };

  let props: Parameters<typeof updateByUuid>[0];

  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  beforeEach(async () => {
    await fileRepository.clear();

    props = mockProps<typeof updateByUuid>({
      uuid: 'uuid' as FileUuid,
      payload: { status: 'TRASHED' },
    });
  });

  it('should return NOT_FOUND when no file has been affected', async () => {
    // When
    const { error } = await updateByUuid(props);
    // Then
    expect(error?.code).toBe('NOT_FOUND');
  });

  it('should update file status and return affected count', async () => {
    // Given
    await fileRepository.save(file);
    // When
    const { data } = await updateByUuid(props);
    // Then
    expect(data).toBe(1);
    expect(await fileRepository.exists({ where: { uuid: 'uuid', status: 'TRASHED' } })).toBe(true);
  });

  it('should update isDangledStatus', async () => {
    // Given
    await fileRepository.save(file);
    props.payload = { isDangledStatus: false };
    // When
    const { data } = await updateByUuid(props);
    // Then
    expect(data).toBe(1);
    expect(await fileRepository.exists({ where: { uuid: 'uuid', isDangledStatus: false } })).toBe(true);
  });
});
