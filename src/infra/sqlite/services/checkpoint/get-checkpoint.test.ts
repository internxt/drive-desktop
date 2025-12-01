import { getCheckpoint } from './get-checkpoint';
import { AppDataSource, CheckpointRepository } from '@/apps/main/database/data-source';

describe('get-checkpoint', () => {
  const props: Parameters<typeof getCheckpoint>[0] = {
    type: 'file',
    userUuid: 'userUuid',
    workspaceId: 'workspaceId',
  };

  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  it('should return NOT_FOUND when checkpoint is not found', async () => {
    // When
    const { error } = await getCheckpoint(props);
    // Then
    expect(error?.code).toBe('NOT_FOUND');
  });

  it('should return checkpoint', async () => {
    // Given
    await CheckpointRepository.save({
      name: 'name',
      workspaceId: 'workspaceId',
      userUuid: 'userUuid',
      updatedAt: 'updatedAt',
      type: 'file',
    });
    // When
    const { data } = await getCheckpoint(props);
    // Then
    expect(data).toMatchObject({ id: 1 });
  });
});
