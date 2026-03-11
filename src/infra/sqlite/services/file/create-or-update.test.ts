import { call, mockProps } from '@/tests/vitest/utils.helper.test';
import { createOrUpdate } from './create-or-update';
import { AppDataSource } from '@/apps/main/database/data-source';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { fileRepository } from '../drive-file';

describe('create-or-update', () => {
  const date = new Date().toISOString();
  let props: Parameters<typeof createOrUpdate>[0];

  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  beforeEach(async () => {
    await fileRepository.clear();

    props = mockProps<typeof createOrUpdate>({
      file: {
        id: 1,
        uuid: 'uuid',
        status: 'EXISTS',
        fileId: 'fileId',
        size: 1024,
        folderId: 1,
        folderUuid: 'parentUuid',
        createdAt: date,
        updatedAt: date,
        modificationTime: date,
      },
    });
  });

  it('should insert new file', async () => {
    // When
    const res = await createOrUpdate(props);
    // Then
    expect(await fileRepository.count()).toBe(1);
    expect(res).toStrictEqual({
      contentsId: 'fileId',
      createdAt: date,
      extension: '',
      modificationTime: date,
      name: undefined,
      parentId: 1,
      parentUuid: 'parentUuid',
      size: 1024,
      status: 'EXISTS',
      updatedAt: date,
      uuid: 'uuid',
    });
  });

  it('should update existing file', async () => {
    // When
    await createOrUpdate(props);
    props.file.plainName = 'file';
    const res = await createOrUpdate(props);
    // Then
    expect(await fileRepository.count()).toBe(1);
    expect(res).toStrictEqual({
      contentsId: 'fileId',
      createdAt: date,
      extension: '',
      modificationTime: date,
      name: 'file',
      parentId: 1,
      parentUuid: 'parentUuid',
      size: 1024,
      status: 'EXISTS',
      updatedAt: date,
      uuid: 'uuid',
    });
  });

  it('should return UNKNOWN if there is an error', async () => {
    // Given
    props.file = {} as any;
    // When
    const res = await createOrUpdate(props);
    // Then
    expect(res).toBeUndefined();
    expect(await fileRepository.count()).toBe(0);
    call(loggerMock.error).toMatchObject({ error: { message: 'NOT NULL constraint failed: drive_file.id' } });
  });
});
