import { LokijsModule } from '@/infra/lokijs/lokijs.module';
import { getCheckpoint } from './get-checkpoint';
import { deepMocked } from '@/tests/vitest/utils.helper.test';
import { getUserOrThrow } from '@/apps/main/auth/service';
import { driveFilesCollection, driveFoldersCollection } from '@/apps/main/remote-sync/store';

vi.mock(import('@/infra/lokijs/lokijs.module'));
vi.mock(import('@/apps/main/auth/service'));
vi.mock(import('@/apps/main/remote-sync/store'));

describe('get-checkpoint', () => {
  const getUserOrThrowMock = deepMocked(getUserOrThrow);
  const getCheckpointMock = deepMocked(LokijsModule.CheckpointsModule.getCheckpoint);
  const getLastUpdatedFileByWorkspaceMock = deepMocked(driveFilesCollection.getLastUpdatedByWorkspace);
  const getLastUpdatedFolderByWorkspaceMock = deepMocked(driveFoldersCollection.getLastUpdatedByWorkspace);

  let props: Parameters<typeof getCheckpoint>[0];

  beforeAll(() => {
    vi.clearAllMocks();
    getUserOrThrowMock.mockReturnValue({ uuid: 'userUuid' });
  });

  beforeEach(() => {
    props = {
      type: 'file',
      workspaceId: 'workspaceId',
    };
  });

  it('should return from lokijs if it exists minus 2 minutes', async () => {
    // Given
    getCheckpointMock.mockResolvedValueOnce({ data: '2025-06-28T09:32:48.033Z' });

    // When
    const checkpoint = await getCheckpoint(props);

    // Then
    expect(checkpoint).toStrictEqual(new Date('2025-06-28T09:30:48.033Z'));
  });

  it('should return from db if it exists minus 2 minutes', async () => {
    // Given
    props.type = 'file';
    getCheckpointMock.mockResolvedValueOnce({ data: undefined });
    getLastUpdatedFileByWorkspaceMock.mockResolvedValueOnce({ updatedAt: '2025-06-28T09:32:48.033Z' });

    // When
    const checkpoint = await getCheckpoint(props);

    // Then
    expect(checkpoint).toStrictEqual(new Date('2025-06-28T09:30:48.033Z'));
  });

  it('should return from db if it exists minus 2 minutes', async () => {
    // Given
    props.type = 'folder';
    getCheckpointMock.mockResolvedValueOnce({ data: undefined });
    getLastUpdatedFolderByWorkspaceMock.mockResolvedValueOnce({ updatedAt: '2025-06-28T09:32:48.033Z' });

    // When
    const checkpoint = await getCheckpoint(props);

    // Then
    expect(checkpoint).toStrictEqual(new Date('2025-06-28T09:30:48.033Z'));
  });

  it('should return undefined if not checkpoint is stored', async () => {
    // Given
    getCheckpointMock.mockResolvedValueOnce({ data: undefined });

    // When
    const checkpoint = await getCheckpoint(props);

    // Then
    expect(checkpoint).toBeUndefined();
  });
});
