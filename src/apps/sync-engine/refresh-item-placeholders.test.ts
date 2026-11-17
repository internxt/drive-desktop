import { Result } from '@internxt/drive-desktop-core/build/common/result';
import * as paths from '@/backend/features/remote-sync/sync-items-by-checkpoint/load-in-memory-paths';
import * as traverser from '@/context/virtual-drive/items/application/Traverser';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { refreshItemPlaceholders } from './refresh-item-placeholders';

describe('refresh-item-placeholders', () => {
  const subtreeMock = partialSpyOn(SqliteModule.SubtreeModule, 'getSubtree');
  const pathsMock = partialSpyOn(paths, 'loadInMemoryPaths');
  const traverseMock = partialSpyOn(traverser, 'traverse');
  let props: Parameters<typeof refreshItemPlaceholders>[0];

  beforeEach(() => {
    props = mockProps<typeof refreshItemPlaceholders>({
      ctx: { abortController: new AbortController() },
      isFirstExecution: false,
    });
    subtreeMock.mockReturnValue({ data: { files: [], folders: [] } });
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

  describe('overlapping requests', () => {
    let passes: Array<PromiseWithResolvers<undefined>>;

    beforeEach(() => {
      passes = [];
      traverseMock.mockImplementation(() => {
        const pass = Promise.withResolvers<undefined>();
        passes.push(pass);
        return pass.promise;
      });
    });

    async function finishPass(index: number) {
      await vi.waitFor(() => expect(passes.length).toBeGreaterThan(index));
      passes[index].resolve(undefined);
    }

    it('runs a request that arrives during a pass after that pass finishes', async () => {
      // Given
      const first = refreshItemPlaceholders(props);
      const second = refreshItemPlaceholders(props);
      await vi.waitFor(() => expect(traverseMock).toHaveBeenCalledTimes(1));
      // When
      await finishPass(0);
      await finishPass(1);
      // Then
      expect(await first).toEqual(Result.ok(true));
      expect(await second).toEqual(Result.ok(true));
      expect(traverseMock).toHaveBeenCalledTimes(2);
    });

    it('merges every request that arrives during a pass into one more pass', async () => {
      // Given
      const results = [refreshItemPlaceholders(props), refreshItemPlaceholders(props), refreshItemPlaceholders(props)];
      results.push(refreshItemPlaceholders(props));
      // When
      await finishPass(0);
      await finishPass(1);
      // Then
      expect(await Promise.all(results)).toEqual([Result.ok(true), Result.ok(true), Result.ok(true), Result.ok(true)]);
      expect(traverseMock).toHaveBeenCalledTimes(2);
    });

    it('keeps isFirstExecution when one of the merged requests has it', async () => {
      // Given
      const results = [
        refreshItemPlaceholders(props),
        refreshItemPlaceholders({ ...props, isFirstExecution: false }),
        refreshItemPlaceholders({ ...props, isFirstExecution: true }),
      ];
      // When
      await finishPass(0);
      await finishPass(1);
      await Promise.all(results);
      // Then
      expect(traverseMock).toHaveBeenNthCalledWith(1, expect.objectContaining({ isFirstExecution: false }));
      expect(traverseMock).toHaveBeenNthCalledWith(2, expect.objectContaining({ isFirstExecution: true }));
    });

    it('gives a request that arrives during a pass the result of the pass after it', async () => {
      // Given
      const error = new Error('Traversal failed');
      const first = refreshItemPlaceholders(props);
      const second = refreshItemPlaceholders(props);
      // When
      await finishPass(0);
      await vi.waitFor(() => expect(passes).toHaveLength(2));
      passes[1].reject(error);
      // Then
      expect(await first).toEqual(Result.ok(true));
      expect((await second).error).toBe(error);
    });

    it('does not make other contexts wait', async () => {
      // Given
      const otherProps = mockProps<typeof refreshItemPlaceholders>({
        ctx: { abortController: new AbortController() },
        isFirstExecution: false,
      });
      // When
      const results = [refreshItemPlaceholders(props), refreshItemPlaceholders(otherProps)];
      // Then
      await vi.waitFor(() => expect(traverseMock).toHaveBeenCalledTimes(2));
      await finishPass(0);
      await finishPass(1);
      expect(await Promise.all(results)).toEqual([Result.ok(true), Result.ok(true)]);
    });

    it('does not run the merged pass after the context is aborted', async () => {
      // Given
      const first = refreshItemPlaceholders(props);
      const second = refreshItemPlaceholders(props);
      // When
      props.ctx.abortController.abort();
      await finishPass(0);
      // Then
      expect(await first).toEqual(Result.ok(true));
      expect((await second).error?.name).toBe('AbortError');
      expect(traverseMock).toHaveBeenCalledTimes(1);
    });
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
