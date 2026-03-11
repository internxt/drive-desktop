import { fileRepository } from '../drive-file';
import { call, mockProps } from '@/tests/vitest/utils.helper.test';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { getByWorkspaceId } from './get-by-workspace-id';
import { AppDataSource } from '@/apps/main/database/data-source';
import { DriveFile } from '@/apps/main/database/entities/DriveFile';

describe('get-by-workspace-id', () => {
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

  let props: Parameters<typeof getByWorkspaceId>[0];

  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  beforeEach(async () => {
    await fileRepository.clear();

    props = mockProps<typeof getByWorkspaceId>({
      userUuid: 'userUuid',
      workspaceId: 'workspaceId',
    });
  });

  it('should return empty array when no files exist', async () => {
    // When
    const { data } = await getByWorkspaceId(props);
    // Then
    expect(data).toStrictEqual([]);
  });

  it('should return all files for a workspace', async () => {
    // Given
    await fileRepository.save([file, { ...file, uuid: 'uuid2', id: 2 }]);
    // When
    const { data } = await getByWorkspaceId(props);
    // Then
    expect(data).toHaveLength(2);
  });

  it('should not return files from a different workspace', async () => {
    // Given
    await fileRepository.save({ ...file, workspaceId: 'workspaceId2' });
    // When
    const { data } = await getByWorkspaceId(props);
    // Then
    expect(data).toStrictEqual([]);
  });

  it('should return UNKNOWN when error is thrown', async () => {
    // Given
    props.userUuid = (() => null) as any;
    // When
    const { error } = await getByWorkspaceId(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    call(loggerMock.error).toMatchObject({ exc: { message: expect.stringContaining('Function parameter') } });
  });
});
