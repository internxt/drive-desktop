import { Result } from '@internxt/drive-desktop-core/build/common/result';
import * as paths from '@/backend/features/remote-sync/sync-items-by-checkpoint/load-in-memory-paths';
import * as traverser from '@/context/virtual-drive/items/application/Traverser';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { refreshItemPlaceholders } from './refresh-item-placeholders';

describe('refresh-item-placeholders', () => {
  const filesMock = partialSpyOn(SqliteModule.FileModule, 'getByWorkspaceId');
  const foldersMock = partialSpyOn(SqliteModule.FolderModule, 'getByWorkspaceId');
  const pathsMock = partialSpyOn(paths, 'loadInMemoryPaths');
  const traverseMock = partialSpyOn(traverser, 'traverse');
  let props: Parameters<typeof refreshItemPlaceholders>[0];

  beforeEach(() => {
    props = mockProps<typeof refreshItemPlaceholders>({
      ctx: { abortController: new AbortController() },
      isFirstExecution: false,
    });
    filesMock.mockReturnValue({ data: [] });
    foldersMock.mockReturnValue({ data: [] });
    pathsMock.mockResolvedValue({ files: new Map(), folders: new Map() });
    traverseMock.mockResolvedValue(undefined);
  });

  it('returns success after refreshing placeholders', async () => {
    // When
    const result = await refreshItemPlaceholders(props);
    // Then
    expect(result).toEqual(Result.ok(true));
    expect(traverseMock).toHaveBeenCalledTimes(1);
  });

  it.each([true, false])('logs and returns traversal errors without rejecting when isFirstExecution is %s', async (isFirstExecution) => {
    // Given
    const error = new Error('Traversal failed');
    traverseMock.mockRejectedValueOnce(error);
    // When
    const result = await refreshItemPlaceholders({ ...props, isFirstExecution });
    // Then
    expect(result.error).toBe(error);
    expect(props.ctx.logger.error).toHaveBeenCalledWith({ msg: 'Error refreshing item placeholders', error });
  });

  it('normalizes non-Error exceptions into the error result', async () => {
    // Given
    pathsMock.mockRejectedValueOnce('Explorer read failed');
    // When
    const result = await refreshItemPlaceholders(props);
    // Then
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe('Explorer read failed');
    expect(traverseMock).not.toHaveBeenCalled();
  });
});
