import { fileRepository } from '../drive-file';
import { call, mockProps } from '@/tests/vitest/utils.helper.test';
import { getByName } from './get-by-name';
import { AppDataSource } from '@/apps/main/database/data-source';
import { DriveFile } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';

describe('get-by-name', () => {
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
  };

  let props: Parameters<typeof getByName>[0];

  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  beforeEach(async () => {
    await fileRepository.clear();

    props = mockProps<typeof getByName>({
      parentUuid: 'folderUuid' as FolderUuid,
      nameWithExtension: 'file.txt',
    });
  });

  it('should return NOT_FOUND when file is not found', async () => {
    // When
    const { error } = await getByName(props);
    // Then
    expect(error?.code).toBe('NOT_FOUND');
  });

  it('should return file', async () => {
    // Given
    await fileRepository.save(file);
    // When
    const { data } = await getByName(props);
    // Then
    expect(data?.uuid).toBe('uuid');
  });

  it('should return NOT_FOUND when file status is not EXISTS', async () => {
    // Given
    await fileRepository.save({ ...file, status: 'TRASHED' });
    // When
    const { error } = await getByName(props);
    // Then
    expect(error?.code).toBe('NOT_FOUND');
  });

  it('should return UNKNOWN when error is thrown', async () => {
    // Given
    props.parentUuid = (() => null) as any;
    // When
    const { error } = await getByName(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    call(loggerMock.error).toMatchObject({ exc: { message: expect.stringContaining('Function parameter') } });
  });
});
