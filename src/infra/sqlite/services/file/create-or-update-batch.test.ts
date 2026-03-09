import { fileRepository } from '../drive-file';
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
    await fileRepository.clear();

    props = mockProps<typeof createOrUpdateBatch>({
      files: Array.from({ length: 450 }).map((_, idx) => ({
        id: idx,
        uuid: `uuid${idx}`,
        status: 'EXISTS',
        fileId: 'fileId',
        size: 1024,
        folderId: 1,
        folderUuid: 'parentUuid',
        createdAt: date,
        updatedAt: date,
        modificationTime: date,
      })),
    });
  });

  it('should ignore if no files', async () => {
    // Given
    props.files = [];
    // When
    const error = await createOrUpdateBatch(props);
    // Then
    expect(error).toBeUndefined();
    expect(await fileRepository.count()).toBe(0);
  });

  it('should insert new files', async () => {
    // When
    const error = await createOrUpdateBatch(props);
    // Then
    expect(error).toBeUndefined();
    expect(await fileRepository.count()).toBe(450);
  });

  it('should update existing files', async () => {
    // Given
    props.files[1].uuid = 'uuid0';
    props.files[1].plainName = 'file';
    // When
    const error = await createOrUpdateBatch(props);
    // Then
    expect(error).toBeUndefined();
    expect(await fileRepository.count()).toBe(449);
    expect(await fileRepository.exists({ where: { uuid: 'uuid1' } })).toBe(false);
  });

  it('should return UNKNOWN when error is thrown', async () => {
    // Given
    props.files = [{} as any];
    // When
    const error = await createOrUpdateBatch(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    call(loggerMock.error).toMatchObject({ error: { message: 'SqliteError: NOT NULL constraint failed: drive_file.id' } });
  });
});
