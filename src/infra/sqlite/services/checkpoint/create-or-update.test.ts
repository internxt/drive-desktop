import { call, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { createOrUpdate } from './create-or-update';
import { CheckpointRepository } from '@/apps/main/database/data-source';

describe('create-or-update', () => {
  const upsertMock = partialSpyOn(CheckpointRepository, 'upsert');

  const props = mockProps<typeof createOrUpdate>({
    type: 'file',
    userUuid: 'userUuid',
    workspaceId: 'workspaceId',
    name: 'name',
    updatedAt: 'updatedAt',
  });

  it('should return UNKNOWN when error is thrown', async () => {
    // Given
    upsertMock.mockRejectedValue(new Error());
    // When
    const { error } = await createOrUpdate(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
  });

  it('should upsert checkpoint', async () => {
    // Given
    upsertMock.mockResolvedValue({});
    // When
    await createOrUpdate(props);
    // Then
    call(upsertMock).toMatchObject([
      {
        name: 'name',
        type: 'file',
        updatedAt: 'updatedAt',
        userUuid: 'userUuid',
        workspaceId: 'workspaceId',
      },
      {
        conflictPaths: ['type', 'userUuid', 'workspaceId'],
        skipUpdateIfNoValuesChanged: true,
      },
    ]);
  });
});
