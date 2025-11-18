import { mockDeep } from 'vitest-mock-extended';
import { syncRemoteChangesToLocal } from './sync-remote-changes-to-local';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { deepMocked, mockProps } from '@/tests/vitest/utils.helper.test';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { unlink } from 'node:fs/promises';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { existsSync } from 'node:fs';

vi.mock(import('node:fs/promises'));
vi.mock(import('node:fs'));

describe('sync-remote-to-local', () => {
  const virtualDrive = mockDeep<VirtualDrive>();

  const unlinkMock = deepMocked(unlink);
  const existsSyncMock = deepMocked(existsSync);

  const date = '2025-01-01T00:00:00.000Z';
  const time = new Date(date).getTime();
  let props: Parameters<typeof syncRemoteChangesToLocal>[0];

  beforeEach(() => {
    existsSyncMock.mockReturnValue(true);
    props = mockProps<typeof syncRemoteChangesToLocal>({
      virtualDrive,
      local: {
        absolutePath: 'localPath' as AbsolutePath,
        stats: {
          size: 512,
          mtime: new Date('1999-01-01T00:00:00.000Z'),
        },
      },
      remote: {
        absolutePath: 'remotePath' as AbsolutePath,
        uuid: 'uuid' as FileUuid,
        name: 'file2',
        size: 1024,
        createdAt: date,
        updatedAt: date,
      },
    });
  });

  it('should sync remote changes to local when remote file is newer and has different size', async () => {
    // Given/When
    await syncRemoteChangesToLocal(props);
    // Then
    expect(unlinkMock).toBeCalledWith('localPath');
    expect(virtualDrive.createFileByPath).toBeCalledWith({
      path: 'remotePath',
      placeholderId: 'FILE:uuid',
      size: 1024,
      creationTime: time,
      lastWriteTime: time,
    });
  });

  it('should not sync when remote file is not newer', async () => {
    // Given
    props.local.stats.mtime = new Date('2026-01-01T00:00:00.000Z');
    // When
    await syncRemoteChangesToLocal(props);
    // Then
    expect(unlinkMock).not.toBeCalled();
  });

  it('should not sync when file sizes are the same', async () => {
    // Given
    props.local.stats.size = 1024;
    // When
    await syncRemoteChangesToLocal(props);
    // Then
    expect(unlinkMock).not.toBeCalled();
  });

  it('should handle errors gracefully', async () => {
    // Given
    virtualDrive.createFileByPath.mockImplementation(() => {
      throw new Error('Creation failed');
    });
    // When
    await syncRemoteChangesToLocal(props);
    // Then
    expect(loggerMock.error).toBeCalledTimes(1);
    expect(loggerMock.error).toBeCalledWith({
      tag: 'SYNC-ENGINE',
      msg: 'Error syncing remote changes to local',
      path: props.remote.path,
      error: expect.any(Error),
    });
  });
});
