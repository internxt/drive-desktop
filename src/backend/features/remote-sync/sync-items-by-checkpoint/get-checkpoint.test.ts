import { LokijsModule } from '@/infra/lokijs/lokijs.module';
import { getCheckpoint } from './get-checkpoint';
import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as getUserOrThrow from '@/apps/main/auth/service';

describe('get-checkpoint', () => {
  const getUserOrThrowMock = partialSpyOn(getUserOrThrow, 'getUserOrThrow');
  const getCheckpointMock = partialSpyOn(LokijsModule.CheckpointsModule, 'getCheckpoint');

  let props: Parameters<typeof getCheckpoint>[0];

  beforeAll(() => {
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

  it('should return undefined if not checkpoint is stored', async () => {
    // Given
    getCheckpointMock.mockResolvedValueOnce({ data: undefined });

    // When
    const checkpoint = await getCheckpoint(props);

    // Then
    expect(checkpoint).toBeUndefined();
  });
});
