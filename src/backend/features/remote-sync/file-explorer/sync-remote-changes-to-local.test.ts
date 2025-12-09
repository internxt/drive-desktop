import { syncRemoteChangesToLocal } from './sync-remote-changes-to-local';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { Addon } from '@/node-win/addon-wrapper';

vi.mock(import('node:fs/promises'));
vi.mock(import('node:fs'));

describe('sync-remote-to-local', () => {
  partialSpyOn(Addon, 'setPinState');
  const updatePlaceholderMock = partialSpyOn(Addon, 'updatePlaceholder');

  const localDate = new Date('2000-01-01');
  const remoteDate = new Date('2000-01-02');
  let props: Parameters<typeof syncRemoteChangesToLocal>[0];

  beforeEach(() => {
    props = mockProps<typeof syncRemoteChangesToLocal>({
      local: {
        path: 'localPath' as AbsolutePath,
        stats: {
          size: 512,
          mtime: localDate,
        },
      },
      remote: {
        absolutePath: 'remotePath' as AbsolutePath,
        uuid: 'uuid' as FileUuid,
        name: 'file2',
        size: 1024,
        updatedAt: remoteDate.toISOString(),
      },
    });
  });

  it('should not sync when local file is older', async () => {
    // Given
    props.local.stats.mtime = new Date('2000-01-03');
    // When
    await syncRemoteChangesToLocal(props);
    // Then
    calls(updatePlaceholderMock).toHaveLength(0);
  });

  it('should not sync when file sizes are equal', async () => {
    // Given
    props.local.stats.size = 1024;
    // When
    await syncRemoteChangesToLocal(props);
    // Then
    calls(updatePlaceholderMock).toHaveLength(0);
  });

  it('should sync when remote file is newer and has different size', async () => {
    // When
    await syncRemoteChangesToLocal(props);
    // Then
    call(updatePlaceholderMock).toStrictEqual({ path: 'remotePath', placeholderId: 'FILE:uuid', size: 1024 });
  });

  it('should handle errors gracefully', async () => {
    // Given
    updatePlaceholderMock.mockRejectedValue(new Error());
    // When
    await syncRemoteChangesToLocal(props);
    // Then
    call(loggerMock.error).toMatchObject({ msg: 'Error syncing remote changes to local', path: props.remote.absolutePath });
  });
});
