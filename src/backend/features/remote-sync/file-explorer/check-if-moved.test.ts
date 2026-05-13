import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { rename } from 'node:fs/promises';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { Addon } from '@/node-win/addon-wrapper';
import { loggerFn, loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, deepMocked, partialSpyOn, TestProps } from '@/tests/vitest/utils.helper.test';
import { checkIfMoved } from './check-if-moved';

vi.mock(import('node:fs/promises'));

describe('check-if-moved', () => {
  const renameMock = deepMocked(rename);
  const updateSyncStatusMock = partialSpyOn(Addon, 'updateSyncStatus');

  const props: TestProps<typeof checkIfMoved> = {
    ctx: { logger: loggerMock },
    local: { path: 'localPath' as AbsolutePath },
    remote: {
      absolutePath: 'remotePath' as AbsolutePath,
      parentUuid: 'parentUuid' as FolderUuid,
    },
  };

  it('should move if different parentUuid', async () => {
    // Given
    props.local!.parentUuid = 'otherParentUuid' as FolderUuid;
    // When
    await checkIfMoved(props as any);
    // Then
    call(loggerFn).toMatchObject({ msg: 'Moving placeholder' });
    call(renameMock).toStrictEqual(['localPath', 'remotePath']);
    call(updateSyncStatusMock).toStrictEqual({ path: 'remotePath' });
  });

  it('should not move if same parentUuid', async () => {
    // Given
    props.local!.parentUuid = 'parentUuid' as FolderUuid;
    // When
    await checkIfMoved(props as any);
    // Then
    calls(loggerFn).toHaveLength(0);
  });
});
