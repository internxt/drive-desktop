import { mockDeep } from 'vitest-mock-extended';
import { syncRemoteChangesToLocal } from './sync-remote-changes-to-local';
import VirtualDrive from '@/node-win/virtual-drive';
import { deepMocked, mockProps } from '@/tests/vitest/utils.helper.test';
import { AbsolutePath, createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { unlink } from 'fs/promises';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { PinState } from '@/node-win/types/placeholder.type';
import { existsSync } from 'fs';

vi.mock(import('fs/promises'));
vi.mock(import('fs'));

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
        path: 'localPath.path' as AbsolutePath,
        stats: {
          size: 512,
          mtime: new Date('1999-01-01T00:00:00.000Z'),
        },
      },
      remote: {
        path: createRelativePath('file1', 'file2'),
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
    // Given
    virtualDrive.getPlaceholderState.mockReturnValue({ pinState: PinState.AlwaysLocal });
    // When
    await syncRemoteChangesToLocal(props);
    // Then
    expect(unlinkMock).toBeCalledWith('localPath.path');
    expect(virtualDrive.createFileByPath).toBeCalledWith({
      itemPath: '/file1/file2',
      itemId: 'FILE:uuid',
      size: 1024,
      creationTime: time,
      lastWriteTime: time,
    });
    expect(virtualDrive.hydrateFile).toBeCalledWith({ itemPath: '/file1/file2' });
  });

  it('should not sync when pinState is not AlwaysLocal', async () => {
    // Given
    virtualDrive.getPlaceholderState.mockReturnValue({ pinState: PinState.OnlineOnly });
    // When
    await syncRemoteChangesToLocal(props);
    // Then
    expect(unlinkMock).not.toBeCalled();
    expect(virtualDrive.hydrateFile).not.toBeCalled();
  });

  it('should not sync when remote file is not newer', async () => {
    // Given
    virtualDrive.getPlaceholderState.mockReturnValue({ pinState: PinState.AlwaysLocal });
    props.local.stats.mtime = new Date('2026-01-01T00:00:00.000Z');
    // When
    await syncRemoteChangesToLocal(props);
    // Then
    expect(unlinkMock).not.toBeCalled();
    expect(virtualDrive.hydrateFile).not.toBeCalled();
  });

  it('should not sync when file sizes are the same', async () => {
    // Given
    virtualDrive.getPlaceholderState.mockReturnValue({ pinState: PinState.AlwaysLocal });
    props.local.stats.size = 1024;
    // When
    await syncRemoteChangesToLocal(props);
    // Then
    expect(unlinkMock).not.toBeCalled();
    expect(virtualDrive.hydrateFile).not.toBeCalled();
  });

  it('should handle errors gracefully', async () => {
    // Given
    virtualDrive.getPlaceholderState.mockReturnValue({ pinState: PinState.AlwaysLocal });
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
      uuid: 'uuid',
      local: props.local,
      error: expect.any(Error),
    });
  });
});
