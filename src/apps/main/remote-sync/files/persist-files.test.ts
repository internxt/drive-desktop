import { call, calls, mockProps, partialSpyOn } from 'tests/vitest/utils.helper.test';
import * as createOrUpdateFilesModule from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { persistFiles } from './persist-files';

describe('persist-files', () => {
  const createOrUpdateFilesMock = partialSpyOn(createOrUpdateFilesModule, 'createOrUpdateFiles');
  const createOrUpdateCheckpointMock = partialSpyOn(SqliteModule.CheckpointModule, 'createOrUpdate');
  const { ctx } = mockProps<typeof persistFiles>({ ctx: { userUuid: 'user-id', workspaceId: 'workspace-id' } });

  beforeEach(() => {
    createOrUpdateFilesMock.mockResolvedValue(undefined);
    createOrUpdateCheckpointMock.mockReturnValue(undefined);
  });

  it('persists items and advances the checkpoint to the greatest updatedAt', async () => {
    const items = [
      { plainName: 'first', updatedAt: '2026-09-01T10:00:00.000Z' },
      { plainName: 'latest', updatedAt: '2026-09-03T10:00:00.000Z' },
      { plainName: 'older', updatedAt: '2026-09-02T10:00:00.000Z' },
    ];

    const result = await persistFiles(mockProps<typeof persistFiles>({ ctx, items }));

    expect(result).toStrictEqual({ data: undefined });
    call(createOrUpdateFilesMock).toMatchObject({ ctx, fileDtos: items });
    call(createOrUpdateCheckpointMock).toMatchObject({
      userUuid: 'user-id',
      workspaceId: 'workspace-id',
      type: 'file',
      name: 'latest',
      updatedAt: '2026-09-03T10:00:00.000Z',
    });
  });

  it('returns the persistence error without updating the checkpoint', async () => {
    const error = new Error('Unable to persist files');
    createOrUpdateFilesMock.mockResolvedValue(error);

    const result = await persistFiles(mockProps<typeof persistFiles>({ ctx, items: [] }));

    expect(result).toStrictEqual({ error });
    calls(createOrUpdateCheckpointMock).toHaveLength(0);
  });

  it('does not update the checkpoint for an empty page', async () => {
    const result = await persistFiles(mockProps<typeof persistFiles>({ ctx, items: [] }));

    expect(result).toStrictEqual({ data: undefined });
    calls(createOrUpdateCheckpointMock).toHaveLength(0);
  });

  it('returns the checkpoint error after persisting the page', async () => {
    const error = new Error('Unable to update checkpoint');
    createOrUpdateCheckpointMock.mockReturnValue(error);

    const result = await persistFiles(mockProps<typeof persistFiles>({ ctx, items: [{ plainName: 'file', updatedAt: '2026-09-01T10:00:00.000Z' }] }));

    expect(result).toStrictEqual({ error });
  });
});
