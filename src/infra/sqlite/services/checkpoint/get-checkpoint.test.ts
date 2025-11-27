import { call, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { getCheckpoint } from './get-checkpoint';
import { CheckpointRepository } from '@/apps/main/database/data-source';

describe('get-checkpoint', () => {
  const findOneMock = partialSpyOn(CheckpointRepository, 'findOne');

  const props = mockProps<typeof getCheckpoint>({
    type: 'file',
    userUuid: 'userUuid',
    workspaceId: 'workspaceId',
  });

  it('should return NOT_FOUND when checkpoint is not found', async () => {
    // Given
    findOneMock.mockResolvedValue(null);
    // When
    const { error } = await getCheckpoint(props);
    // Then
    expect(error?.code).toBe('NOT_FOUND');
  });

  it('should return UNKNOWN when error is thrown', async () => {
    // Given
    findOneMock.mockRejectedValue(new Error());
    // When
    const { error } = await getCheckpoint(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
  });

  it('should return checkpoint', async () => {
    // Given
    findOneMock.mockResolvedValue({});
    // When
    const { data } = await getCheckpoint(props);
    // Then
    expect(data).toBeDefined();
    call(findOneMock).toMatchObject({
      where: {
        type: 'file',
        userUuid: 'userUuid',
        workspaceId: 'workspaceId',
      },
    });
  });
});
