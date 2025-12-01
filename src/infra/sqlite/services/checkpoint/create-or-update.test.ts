import { mockProps } from '@/tests/vitest/utils.helper.test';
import { createOrUpdate } from './create-or-update';
import { AppDataSource, CheckpointRepository } from '@/apps/main/database/data-source';

describe('create-or-update', () => {
  let props: Parameters<typeof createOrUpdate>[0];

  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  beforeEach(async () => {
    await CheckpointRepository.clear();

    props = mockProps<typeof createOrUpdate>({
      type: 'file',
      userUuid: 'userUuid1',
      workspaceId: 'workspaceId1',
      name: 'name',
      updatedAt: 'updatedAt1',
    });
  });

  it('should return UNKNOWN when error is thrown', async () => {
    // Given
    props.type = undefined as any;
    // When
    const { error } = await createOrUpdate(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
  });

  it('should create checkpoint if not exists', async () => {
    // When
    await createOrUpdate(props);
    // Then
    const res = await CheckpointRepository.find({});
    expect(res).toMatchObject([{ updatedAt: 'updatedAt1' }]);
  });

  it('should update checkpoint if exists', async () => {
    // Given
    await createOrUpdate(props);
    props.updatedAt = 'updatedAt2';
    // When
    await createOrUpdate(props);
    // Then
    const res = await CheckpointRepository.find({});
    expect(res).toMatchObject([{ updatedAt: 'updatedAt2' }]);
  });

  it('should create checkpoint if different type', async () => {
    // Given
    await createOrUpdate(props);
    props.type = 'folder';
    // When
    await createOrUpdate(props);
    // Then
    const res = await CheckpointRepository.find({});
    expect(res).toMatchObject([{ type: 'file' }, { type: 'folder' }]);
  });

  it('should create checkpoint if different userUuid', async () => {
    // Given
    await createOrUpdate(props);
    props.userUuid = 'userUuid2';
    // When
    await createOrUpdate(props);
    // Then
    const res = await CheckpointRepository.find({});
    expect(res).toMatchObject([{ userUuid: 'userUuid1' }, { userUuid: 'userUuid2' }]);
  });

  it('should create checkpoint if different workspaceId', async () => {
    // Given
    await createOrUpdate(props);
    props.workspaceId = 'workspaceId2';
    // When
    await createOrUpdate(props);
    // Then
    const res = await CheckpointRepository.find({});
    expect(res).toMatchObject([{ workspaceId: 'workspaceId1' }, { workspaceId: 'workspaceId2' }]);
  });
});
