import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { getCheckpoint } from './get-checkpoint';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';

describe('get-checkpoint', () => {
  const getCheckpointMock = partialSpyOn(SqliteModule.CheckpointModule, 'getCheckpoint');

  const props = mockProps<typeof getCheckpoint>({});

  it('should return from sqlite if it exists minus 2 minutes', async () => {
    // Given
    getCheckpointMock.mockResolvedValueOnce({ data: { updatedAt: '2025-01-01T00:02:00.000Z' } });
    // When
    const checkpoint = await getCheckpoint(props);
    // Then
    expect(checkpoint).toStrictEqual(new Date('2025-01-01T00:00:00.000Z'));
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
