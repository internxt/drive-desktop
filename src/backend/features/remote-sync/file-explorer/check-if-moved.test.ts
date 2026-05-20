import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { rename } from 'node:fs/promises';
import { Addon } from '@/node-win/addon-wrapper';
import { loggerFn, loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, deepMocked, partialSpyOn, TestProps } from '@/tests/vitest/utils.helper.test';
import { checkIfMoved } from './check-if-moved';
import * as needsToBeMoved from './needs-to-be-moved';

vi.mock(import('node:fs/promises'));

describe('check-if-moved', () => {
  const needsToBeMovedMock = partialSpyOn(needsToBeMoved, 'needsToBeMoved');
  const renameMock = deepMocked(rename);
  const updateSyncStatusMock = partialSpyOn(Addon, 'updateSyncStatus');

  const props: TestProps<typeof checkIfMoved> = {
    ctx: { logger: loggerMock },
    local: { path: 'localPath' as AbsolutePath },
    remote: { absolutePath: 'remotePath' as AbsolutePath },
  };

  it('should not rename if does not need to be moved', async () => {
    // Given
    needsToBeMovedMock.mockReturnValue(false);
    // When
    await checkIfMoved(props as any);
    // Then
    calls(loggerFn).toHaveLength(0);
  });

  it('should rename if needs to be moved', async () => {
    // Given
    needsToBeMovedMock.mockReturnValue(true);
    // When
    await checkIfMoved(props as any);
    // Then
    call(loggerFn).toMatchObject({ msg: 'Moving placeholder' });
    call(renameMock).toStrictEqual(['localPath', 'remotePath']);
    call(updateSyncStatusMock).toStrictEqual({ path: 'remotePath' });
  });
});
