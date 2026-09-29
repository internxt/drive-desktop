import { call, calls, mockProps, partialSpyOn } from 'tests/vitest/utils.helper.test';
import * as createOrUpdateFoldersModule from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-folder';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { persistFolders } from './persist-folders';

describe('persist-folders', () => {
  const createOrUpdateFoldersMock = partialSpyOn(createOrUpdateFoldersModule, 'createOrUpdateFolders');
  const createOrUpdateCheckpointMock = partialSpyOn(SqliteModule.CheckpointModule, 'createOrUpdate');
  const { ctx } = mockProps<typeof persistFolders>({ ctx: { userUuid: 'user-id', workspaceId: 'workspace-id' } });

  beforeEach(() => {
    createOrUpdateFoldersMock.mockResolvedValue(undefined);
    createOrUpdateCheckpointMock.mockReturnValue(undefined);
  });

  it('persists items and advances the checkpoint to the greatest updatedAt', async () => {
    const items = [
      { plainName: 'first', updatedAt: '2026-09-01T10:00:00.000Z' },
      { plainName: 'latest', updatedAt: '2026-09-03T10:00:00.000Z' },
      { plainName: 'older', updatedAt: '2026-09-02T10:00:00.000Z' },
    ];

    const result = await persistFolders(mockProps<typeof persistFolders>({ ctx, items }));

    expect(result).toStrictEqual({ data: undefined });
    call(createOrUpdateFoldersMock).toMatchObject({ ctx, folderDtos: items });
    call(createOrUpdateCheckpointMock).toMatchObject({
      userUuid: 'user-id',
      workspaceId: 'workspace-id',
      type: 'folder',
      name: 'latest',
      updatedAt: '2026-09-03T10:00:00.000Z',
    });
  });

  it('returns the persistence error without updating the checkpoint', async () => {
    const error = new Error('Unable to persist folders');
    createOrUpdateFoldersMock.mockResolvedValue(error);

    const result = await persistFolders(mockProps<typeof persistFolders>({ ctx, items: [] }));

    expect(result).toStrictEqual({ error });
    calls(createOrUpdateCheckpointMock).toHaveLength(0);
  });

  it('does not update the checkpoint for an empty page', async () => {
    const result = await persistFolders(mockProps<typeof persistFolders>({ ctx, items: [] }));

    expect(result).toStrictEqual({ data: undefined });
    calls(createOrUpdateCheckpointMock).toHaveLength(0);
  });

  it('returns the checkpoint error after persisting the page', async () => {
    const error = new Error('Unable to update checkpoint');
    createOrUpdateCheckpointMock.mockReturnValue(error);

    const result = await persistFolders(
      mockProps<typeof persistFolders>({ ctx, items: [{ plainName: 'folder', updatedAt: '2026-09-01T10:00:00.000Z' }] }),
    );

    expect(result).toStrictEqual({ error });
  });
});
