import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { Addon } from '@/node-win/addon-wrapper';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import type { Watcher } from '../addon';
import * as onEventModule from './on-event/on-event';
import { initWatcher } from './watcher';

const event: Watcher.SuccessEvent = {
  action: 'update',
  type: 'file',
  path: 'C:/Sync/file.txt' as AbsolutePath,
  size: 1,
  internalId: 1,
  ctimeMs: 0,
  mtimeMs: 0,
  observedAtMs: 0,
};

describe('watcher', () => {
  const watchPathMock = partialSpyOn(Addon, 'watchPath');
  const unwatchPathMock = partialSpyOn(Addon, 'unwatchPath');
  const onEventMock = partialSpyOn(onEventModule, 'onEvent');

  afterEach(() => vi.restoreAllMocks());

  it('ignores a native batch delivered after unsubscribe', () => {
    // Given
    let onEvents: ((events: Watcher.Event[]) => void) | undefined;
    watchPathMock.mockImplementation(({ onEvents: callback }) => {
      onEvents = callback;
      return {};
    });
    const watcher = initWatcher(mockProps<typeof initWatcher>({ ctx: { rootPath: 'C:/Sync' as AbsolutePath, logger: loggerMock } }));

    // When
    watcher.unsubscribe();
    onEvents?.([event]);

    // Then
    expect(onEventMock).not.toHaveBeenCalled();
    expect(unwatchPathMock).toHaveBeenCalledOnce();
  });
});
