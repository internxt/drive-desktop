import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { downloadFolder } from './download-folder';
import * as broadcastToWindows from '@/apps/main/windows';
import { Traverser } from '@/apps/backups/remote-tree/traverser';
import * as downloadFile from './download-file';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { Effect } from 'effect/index';
import { sleep } from '@/apps/main/util';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { mkdir } from 'node:fs/promises';

vi.mock(import('node:fs/promises'));

describe('download-folder', () => {
  const broadcastToWindowsMock = partialSpyOn(broadcastToWindows, 'broadcastToWindows');
  const traverserMock = partialSpyOn(Traverser, 'run');
  const downloadFileMock = partialSpyOn(downloadFile, 'downloadFile');
  const mkdirMock = vi.mocked(mkdir);

  const folder1 = abs('folder1.txt');
  const file1 = abs('file1.txt');
  const file2 = abs('file2.txt');
  const file3 = abs('file3.txt');

  let props: Parameters<typeof downloadFolder>[0];

  beforeEach(() => {
    traverserMock.mockResolvedValue({
      folders: {
        [folder1]: { uuid: 'folder1' as FolderUuid, absolutePath: folder1 },
      },
      files: {
        [file1]: { uuid: 'file1' as FileUuid, absolutePath: file1 },
        [file2]: { uuid: 'file2' as FileUuid, absolutePath: file2 },
        [file3]: { uuid: 'file3' as FileUuid, absolutePath: file3 },
      },
    });

    props = mockProps<typeof downloadFolder>({
      device: { uuid: 'deviceUuid' },
      user: { uuid: 'userUuid' },
      abortController: new AbortController(),
      contentsDownloader: { forceStop: vi.fn() },
    });
  });

  it('should update progress when we download files', async () => {
    // Given
    downloadFileMock.mockReturnValue(Effect.void);
    // When
    await downloadFolder(props);
    // Then
    call(mkdirMock).toStrictEqual(['folder1.txt', { recursive: true }]);
    calls(downloadFileMock).toMatchObject([{ file: { uuid: 'file1' } }, { file: { uuid: 'file2' } }, { file: { uuid: 'file3' } }]);
    calls(broadcastToWindowsMock).toMatchObject([
      { data: { progress: 1 } },
      { data: { progress: 33.33333333333333 } },
      { data: { progress: 66.66666666666666 } },
      { data: { progress: 100 } },
    ]);
  });

  it('should close the limiter and clean all running downloads if aborted', async () => {
    // Given
    downloadFileMock
      .mockImplementationOnce(() => Effect.promise(() => sleep(50)))
      .mockImplementationOnce(() => {
        props.abortController.abort();
        return Effect.void;
      });
    // When
    await downloadFolder(props);
    // Then
    calls(downloadFileMock).toMatchObject([{ file: { uuid: 'file1' } }, { file: { uuid: 'file2' } }]);
    calls(props.contentsDownloader.forceStop).toStrictEqual([{ path: file1 }]);
  });
});
