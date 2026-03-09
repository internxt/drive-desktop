import { folderRepository } from '../drive-folder';
import { call, mockProps } from '@/tests/vitest/utils.helper.test';
import { createOrUpdate } from './create-or-update';
import { AppDataSource } from '@/apps/main/database/data-source';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';

describe('create-or-update', () => {
  const date = new Date().toISOString();
  let props: Parameters<typeof createOrUpdate>[0];

  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  beforeEach(async () => {
    await folderRepository.clear();

    props = mockProps<typeof createOrUpdate>({
      folder: {
        id: 1,
        uuid: 'uuid',
        status: 'EXISTS',
        parentUuid: 'parentUuid',
        parentId: 1,
        userUuid: 'userUuid',
        workspaceId: 'workspaceId',
        createdAt: date,
        updatedAt: date,
      },
    });
  });

  it('should insert new folder', async () => {
    // When
    const res = await createOrUpdate(props);
    // Then
    expect(await folderRepository.count()).toBe(1);
    expect(res).toStrictEqual({
      createdAt: date,
      name: undefined,
      parentUuid: 'parentUuid',
      status: 'EXISTS',
      updatedAt: date,
      uuid: 'uuid',
    });
  });

  it('should update existing folder', async () => {
    // When
    await createOrUpdate(props);
    props.folder.plainName = 'folder';
    const res = await createOrUpdate(props);
    // Then
    expect(await folderRepository.count()).toBe(1);
    expect(res).toStrictEqual({
      createdAt: date,
      name: 'folder',
      parentUuid: 'parentUuid',
      status: 'EXISTS',
      updatedAt: date,
      uuid: 'uuid',
    });
  });

  it('should return undefined if there is an error', async () => {
    // Given
    props.folder = {} as any;
    // When
    const res = await createOrUpdate(props);
    // Then
    expect(res).toBeUndefined();
    expect(await folderRepository.count()).toBe(0);
    call(loggerMock.error).toMatchObject({ error: { message: 'NOT NULL constraint failed: drive_folder.uuid' } });
  });
});
