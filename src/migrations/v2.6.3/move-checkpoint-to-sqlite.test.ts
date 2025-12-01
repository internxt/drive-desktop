import { MoveCheckpointToSqlite } from './move-checkpoint-to-sqlite';
import { readFile } from 'node:fs/promises';
import { AppDataSource, CheckpointRepository } from '@/apps/main/database/data-source';

vi.mock(import('node:fs/promises'));

describe('move-checkpoint-to-sqlite', () => {
  const readFileMock = vi.mocked(readFile);

  const checkpoints = {
    collections: [
      {
        name: 'checkpoints',
        data: [
          { key: 'userUuid1::file', checkpoint: 'updatedAt1' },
          { key: 'userUuid2::file', checkpoint: 'updatedAt2' },
          { key: 'userUuid1::folder', checkpoint: 'updatedAt3' },
          { key: 'userUuid2::folder', checkpoint: 'updatedAt4' },
          { key: 'userUuid1:workspaceId1:file', checkpoint: 'updatedAt5' },
          { key: 'userUuid2:workspaceId1:file', checkpoint: 'updatedAt6' },
          { key: 'userUuid1:workspaceId2:file', checkpoint: 'updatedAt7' },
          { key: 'userUuid1:workspaceId1:folder', checkpoint: 'updatedAt8' },
          { key: 'userUuid1:workspaceId2:folder', checkpoint: 'updatedAt9' },
          { key: 'userUuid2:workspaceId2:folder', checkpoint: 'updatedAt10' },
        ],
      },
    ],
  };

  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  it('should migrate all checkpoints to sqlite', async () => {
    // Given
    readFileMock.mockResolvedValue(JSON.stringify(checkpoints));
    // When
    await MoveCheckpointToSqlite.run();
    // Then
    const res = await CheckpointRepository.find({});
    expect(res).toMatchObject([
      { name: '', type: 'file', updatedAt: 'updatedAt1', userUuid: 'userUuid1', workspaceId: '' },
      { name: '', type: 'file', updatedAt: 'updatedAt2', userUuid: 'userUuid2', workspaceId: '' },
      { name: '', type: 'folder', updatedAt: 'updatedAt3', userUuid: 'userUuid1', workspaceId: '' },
      { name: '', type: 'folder', updatedAt: 'updatedAt4', userUuid: 'userUuid2', workspaceId: '' },
      { name: '', type: 'file', updatedAt: 'updatedAt5', userUuid: 'userUuid1', workspaceId: 'workspaceId1' },
      { name: '', type: 'file', updatedAt: 'updatedAt6', userUuid: 'userUuid2', workspaceId: 'workspaceId1' },
      { name: '', type: 'file', updatedAt: 'updatedAt7', userUuid: 'userUuid1', workspaceId: 'workspaceId2' },
      { name: '', type: 'folder', updatedAt: 'updatedAt8', userUuid: 'userUuid1', workspaceId: 'workspaceId1' },
      { name: '', type: 'folder', updatedAt: 'updatedAt9', userUuid: 'userUuid1', workspaceId: 'workspaceId2' },
      { name: '', type: 'folder', updatedAt: 'updatedAt10', userUuid: 'userUuid2', workspaceId: 'workspaceId2' },
    ]);
  });
});
