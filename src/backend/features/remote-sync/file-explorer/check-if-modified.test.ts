import { checkIfModified } from './check-if-modified';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { Addon } from '@/node-win/addon-wrapper';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { Drive } from '../../drive';
import { NodeWin } from '@/infra/node-win/node-win.module';

vi.mock(import('node:fs/promises'));
vi.mock(import('node:fs'));

describe('check-if-modified', () => {
  partialSpyOn(Addon, 'setPinState');
  const updatePlaceholderMock = partialSpyOn(Addon, 'updatePlaceholder');
  const getFileInfoMock = partialSpyOn(NodeWin, 'getFileInfo');
  const replaceFileMock = partialSpyOn(Drive.Actions, 'replaceFile');

  const remoteDate = new Date('2000-01-02');
  let props: Parameters<typeof checkIfModified>[0];

  beforeEach(() => {
    props = mockProps<typeof checkIfModified>({
      local: {
        path: 'localPath' as AbsolutePath,
        stats: { size: 512 },
      },
      remote: {
        absolutePath: 'remotePath' as AbsolutePath,
        uuid: 'uuid' as FileUuid,
        size: 1024,
        updatedAt: remoteDate.toISOString(),
      },
    });
  });

  it('should not sync when file sizes are equal', async () => {
    // Given
    props.local.stats.size = 1024;
    // When
    await checkIfModified(props);
    // Then
    calls(loggerMock.debug).toHaveLength(0);
  });

  it('should sync when remote file is newer', async () => {
    // Given
    props.local.stats.mtime = new Date('2000-01-01');
    // When
    await checkIfModified(props);
    // Then
    call(loggerMock.debug).toMatchObject({ msg: 'Sync remote changes to local' });
    call(updatePlaceholderMock).toStrictEqual({ path: 'remotePath', placeholderId: 'FILE:uuid', size: 1024 });
  });

  describe('what happens when local file is newer', () => {
    beforeEach(() => {
      props.local.stats.mtime = new Date('2000-01-03');
    });

    it('should not sync when is not first execution', async () => {
      // Given
      props.isFirstExecution = false;
      // When
      await checkIfModified(props);
      // Then
      calls(loggerMock.debug).toHaveLength(0);
    });

    it('should not sync when local file is dehydrated', async () => {
      // Given
      props.isFirstExecution = true;
      getFileInfoMock.mockResolvedValue({ data: { onDiskSize: 0 } });
      // When
      await checkIfModified(props);
      // Then
      call(loggerMock.debug).toMatchObject({ msg: 'Sync local changes to remote' });
      call(loggerMock.error).toMatchObject({ msg: 'Cannot update file contents id, not hydrated' });
    });

    it('should sync when local file is hydrated', async () => {
      // Given
      props.isFirstExecution = true;
      getFileInfoMock.mockResolvedValue({ data: { onDiskSize: 512 } });
      // When
      await checkIfModified(props);
      // Then
      call(loggerMock.debug).toMatchObject({ msg: 'Sync local changes to remote' });
      call(replaceFileMock).toMatchObject({ path: 'remotePath', uuid: 'uuid', stats: { size: 512 } });
    });
  });
});
