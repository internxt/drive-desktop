import { calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { downloadFolder } from './download-folder';
import * as broadcastToWindows from '@/apps/main/windows';
import { Traverser } from '@/apps/backups/remote-tree/traverser';
import * as downloadFile from './download-file';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';

describe('download-folder', () => {
  const broadcastToWindowsMock = partialSpyOn(broadcastToWindows, 'broadcastToWindows');
  const traverserMock = partialSpyOn(Traverser, 'run');
  const downloadFileMock = partialSpyOn(downloadFile, 'downloadFile');

  let props: Parameters<typeof downloadFolder>[0];

  beforeEach(() => {
    downloadFileMock.mockResolvedValue();
    traverserMock.mockResolvedValue({
      files: {
        [abs('file1.txt')]: { uuid: 'file1' as FileUuid },
        [abs('file2.txt')]: { uuid: 'file2' as FileUuid },
        [abs('file3.txt')]: { uuid: 'file3' as FileUuid },
      },
    });

    props = mockProps<typeof downloadFolder>({
      device: { uuid: 'deviceUuid' },
      user: { uuid: 'userUuid' },
      abortController: new AbortController(),
    });
  });

  it('should not do anything if aborted', async () => {
    // Given
    props.abortController.abort();
    // When
    await downloadFolder(props);
    // Then
    calls(downloadFileMock).toMatchObject([]);
  });

  it('should not continue if aborted', async () => {
    // Given
    downloadFileMock.mockImplementation(({ file }) => {
      if (file.uuid === 'file1') props.abortController.abort();
      return Promise.resolve();
    });
    // When
    await downloadFolder(props);
    // Then
    calls(downloadFileMock).toMatchObject([{ file: { uuid: 'file1' } }]);
  });

  it('should update progress when we download files', async () => {
    // When
    await downloadFolder(props);
    // Then
    calls(downloadFileMock).toMatchObject([{ file: { uuid: 'file1' } }, { file: { uuid: 'file2' } }, { file: { uuid: 'file3' } }]);
    calls(broadcastToWindowsMock).toMatchObject([
      { data: { progress: 1 } },
      { data: { progress: 33 } },
      { data: { progress: 66 } },
      { data: { progress: 100 } },
    ]);
  });
});
