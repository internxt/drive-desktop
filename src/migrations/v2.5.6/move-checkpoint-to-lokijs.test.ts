import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { MoveCheckpointToLokijs } from './move-checkpoint-to-lokijs';
import { CheckpointsModule } from '@/infra/lokijs/databases/checkpoints/checkpoints.module';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';

describe('move-checkpoint-to-lokijs', () => {
  const getFilesQueryResultMock = partialSpyOn(MoveCheckpointToLokijs, 'getFilesQueryResult');
  const getFoldersQueryResultMock = partialSpyOn(MoveCheckpointToLokijs, 'getFoldersQueryResult');
  const updateCheckpointMock = partialSpyOn(CheckpointsModule, 'updateCheckpoint');

  const checkpoint = new Date().toISOString();
  const data = { workspaceId: 'workspaceId', userUuid: 'userUuid', checkpoint };

  beforeEach(() => {
    vi.clearAllMocks();
    getFoldersQueryResultMock.mockResolvedValue([data]);
  });

  it('should log error if query result has invalid format', async () => {
    // Given
    getFilesQueryResultMock.mockResolvedValue([{ invalid: 'invalid' }]);
    // When
    await MoveCheckpointToLokijs.run();
    // Then
    expect(loggerMock.error).toBeCalledTimes(1);
  });

  it('should update checkpoint', async () => {
    // Given
    getFilesQueryResultMock.mockResolvedValue([data]);
    // When
    await MoveCheckpointToLokijs.run();
    // Then
    expect(updateCheckpointMock).toBeCalledWith({ ...data, type: 'file', plainName: '' });
    expect(updateCheckpointMock).toBeCalledWith({ ...data, type: 'folder', plainName: '' });
  });
});
