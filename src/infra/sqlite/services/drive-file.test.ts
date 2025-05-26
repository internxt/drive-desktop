import { deepMocked } from 'tests/vitest/utils.helper.test';
import { DriveFileCollection } from './drive-file';
import { getUserOrThrow } from '@/apps/main/auth/service';
import { AppDataSource } from '@/apps/main/database/data-source';

vi.mock(import('@/apps/main/auth/service'));

describe('drive-file', () => {
  const collection = new DriveFileCollection();

  const getUserOrThrowMock = deepMocked(getUserOrThrow);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('If no options are provided, it should return empty options', () => {
    // Given
    const where = collection.parseWhere({});

    // Then
    expect(where).toStrictEqual({});
  });

  it('If workspaceId is empty, it should return empty options', () => {
    // Given
    const where = collection.parseWhere({ workspaceId: '' });

    // Then
    expect(where).toStrictEqual({});
  });

  it('If workspaceId is undefined, it should return empty options', () => {
    // Given
    const where = collection.parseWhere({ workspaceId: undefined });

    // Then
    expect(where).toStrictEqual({});
  });

  it('If workspaceId is null, it should return empty options', () => {
    // Given
    const where = collection.parseWhere({ workspaceId: null as unknown as string });

    // Then
    expect(where).toStrictEqual({});
  });

  it('If workspaceId has a value, it should return it inside the options', () => {
    // Given
    const where = collection.parseWhere({ workspaceId: 'uuid' });

    // Then
    expect(where).toStrictEqual({ workspaceId: 'uuid' });
  });

  it.only('', async () => {
    // Given
    await AppDataSource.initialize();
    getUserOrThrowMock.mockResolvedValue({ uuid: 'uuid' });

    await collection.getAll({});
  });
});
