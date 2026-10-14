import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { rename } from 'node:fs/promises';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { Addon } from '@/node-win/addon-wrapper';
import { loggerFn, loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, deepMocked, partialSpyOn, TestProps } from '@/tests/vitest/utils.helper.test';
import { clearMoveAttempts, MAX_MOVE_ATTEMPTS } from '../unreconciled-folders';
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
    remote: { absolutePath: 'remotePath' as AbsolutePath, uuid: 'uuid' as FolderUuid },
  };

  beforeEach(() => {
    clearMoveAttempts({ uuid: 'uuid' });
  });

  it('should not rename if does not need to be moved', async () => {
    // Given
    needsToBeMovedMock.mockReturnValue(false);
    // When
    const res = await checkIfMoved(props as any);
    // Then
    expect(res).toBe(true);
    calls(loggerFn).toHaveLength(0);
  });

  it('should rename if needs to be moved', async () => {
    // Given
    needsToBeMovedMock.mockReturnValue(true);
    // When
    const res = await checkIfMoved(props as any);
    // Then
    expect(res).toBe(true);
    call(loggerFn).toMatchObject({ msg: 'Moving placeholder' });
    call(renameMock).toStrictEqual(['localPath', 'remotePath']);
    call(updateSyncStatusMock).toStrictEqual({ path: 'remotePath' });
  });

  it('should give up on the move once it does not converge', async () => {
    // Given
    needsToBeMovedMock.mockReturnValue(true);
    for (let attempt = 0; attempt < MAX_MOVE_ATTEMPTS; attempt += 1) {
      await checkIfMoved(props as any);
    }
    // When
    const res = await checkIfMoved(props as any);
    // Then
    expect(res).toBe(false);
    calls(renameMock).toHaveLength(MAX_MOVE_ATTEMPTS);
    expect(loggerFn).toHaveBeenLastCalledWith(expect.objectContaining({ msg: 'Placeholder move does not converge' }));
  });

  it('should keep retrying when the requested move changes', async () => {
    // Given
    needsToBeMovedMock.mockReturnValue(true);
    for (let attempt = 0; attempt < MAX_MOVE_ATTEMPTS; attempt += 1) {
      await checkIfMoved(props as any);
    }
    // When
    const res = await checkIfMoved({ ...props, remote: { ...props.remote, absolutePath: 'otherPath' } } as any);
    // Then
    expect(res).toBe(true);
    calls(renameMock).toHaveLength(MAX_MOVE_ATTEMPTS + 1);
  });

  it('should start over once the move converges', async () => {
    // Given
    needsToBeMovedMock.mockReturnValue(true);
    for (let attempt = 0; attempt < MAX_MOVE_ATTEMPTS; attempt += 1) {
      await checkIfMoved(props as any);
    }
    needsToBeMovedMock.mockReturnValue(false);
    await checkIfMoved(props as any);
    // When
    needsToBeMovedMock.mockReturnValue(true);
    const res = await checkIfMoved(props as any);
    // Then
    expect(res).toBe(true);
    calls(renameMock).toHaveLength(MAX_MOVE_ATTEMPTS + 1);
  });
});
