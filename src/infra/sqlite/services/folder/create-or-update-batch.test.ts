import { folderRepository } from '../drive-folder';
import { call, mockProps } from '@/tests/vitest/utils.helper.test';
import { createOrUpdateBatch } from './create-or-update-batch';
import { AppDataSource } from '@/apps/main/database/data-source';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';

describe('create-or-update-batch', () => {
  const date = new Date().toISOString();
  let props: Parameters<typeof createOrUpdateBatch>[0];

  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  beforeEach(async () => {
    await folderRepository.clear();

    props = mockProps<typeof createOrUpdateBatch>({
      folders: Array.from({ length: 450 }).map((_, idx) => ({
        id: idx,
        uuid: `uuid${idx}`,
        status: 'EXISTS',
        parentId: 1,
        parentUuid: 'parentUuid',
        createdAt: date,
        updatedAt: date,
      })),
    });
  });

  it('should ignore if no folders', async () => {
    // Given
    props.folders = [];
    // When
    const error = await createOrUpdateBatch(props);
    // Then
    expect(error).toBeUndefined();
    expect(await folderRepository.count()).toBe(0);
  });

  it('should insert new folders', async () => {
    // When
    const error = await createOrUpdateBatch(props);
    // Then
    expect(error).toBeUndefined();
    expect(await folderRepository.count()).toBe(450);
  });

  it('should update existing folders', async () => {
    // Given
    props.folders[1].uuid = 'uuid0';
    props.folders[1].plainName = 'folder';
    // When
    const error = await createOrUpdateBatch(props);
    // Then
    expect(error).toBeUndefined();
    expect(await folderRepository.count()).toBe(449);
    expect(await folderRepository.exists({ where: { uuid: 'uuid1' } })).toBe(false);
  });

  it('should return UNKNOWN when error is thrown', async () => {
    // Given
    props.folders = [{} as any];
    // When
    const error = await createOrUpdateBatch(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    call(loggerMock.error).toMatchObject({ error: { message: 'SqliteError: NOT NULL constraint failed: drive_folder.uuid' } });
  });
});
