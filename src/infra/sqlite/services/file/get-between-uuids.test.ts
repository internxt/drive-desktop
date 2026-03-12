import { fileRepository } from '../drive-file';
import { call, mockProps } from '@/tests/vitest/utils.helper.test';
import { getBetweenUuids } from './get-between-uuids';
import { AppDataSource } from '@/apps/main/database/data-source';
import { DriveFile, FileUuid } from '@/apps/main/database/entities/DriveFile';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';

describe('get-between-uuids', () => {
  const date = new Date().toISOString();
  const file: DriveFile = {
    id: 1,
    uuid: 'uuid1',
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
  };

  let props: Parameters<typeof getBetweenUuids>[0];

  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  beforeEach(async () => {
    await fileRepository.clear();

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
    await fileRepository.save([file, { ...file, uuid: 'uuid2', id: 2 }]);
    // When
    const { data } = await getBetweenUuids(props);
    // Then
    expect(data).toMatchObject([{ uuid: 'uuid1' }, { uuid: 'uuid2' }]);
  });

  it('should not return files outside the range', async () => {
    // Given
    await fileRepository.save({ ...file, uuid: 'uuid4' });
    // When
    const { data } = await getBetweenUuids(props);
    // Then
    expect(data).toStrictEqual([]);
  });

  it('should not return files from a different workspace', async () => {
    // Given
    await fileRepository.save({ ...file, workspaceId: 'workspaceId2' });
    // When
    const { data } = await getBetweenUuids(props);
    // Then
    expect(data).toStrictEqual([]);
  });

  it('should not return files with non-EXISTS status', async () => {
    // Given
    await fileRepository.save({ ...file, status: 'TRASHED' });
    // When
    const { data } = await getBetweenUuids(props);
    // Then
    expect(data).toStrictEqual([]);
  });

  it('should return UNKNOWN when error is thrown', async () => {
    // Given
    props.userUuid = (() => null) as any;
    // When
    const { error } = await getBetweenUuids(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    call(loggerMock.error).toMatchObject({ error: { message: expect.stringContaining('Function parameter') } });
  });
});
