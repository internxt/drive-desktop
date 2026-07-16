import { Stats } from 'node:fs';
import pLimit from 'p-limit';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { PinState } from '@/node-win/types/placeholder.type';
import { partialSpyOn, testSleep } from '@/tests/vitest/utils.helper.test';
import { loadFileExplorerFiles } from './load-file-explorer-files';
import { FileExplorerFiles } from './load-in-memory-paths';

describe('load-file-explorer-files', () => {
  const getFileInfoMock = partialSpyOn(NodeWin, 'getFileInfo');
  const parentUuid = 'parentUuid' as FolderUuid;

  function stats(props: Partial<Stats> = {}) {
    return { mtimeMs: 100, size: 200, ...props } as Stats;
  }

  it('should load all file placeholders into the file explorer map', async () => {
    // Given
    const files: FileExplorerFiles = new Map();

    getFileInfoMock
      .mockResolvedValueOnce({
        data: { uuid: 'fileUuid1' as FileUuid, onDiskSize: 10, pinState: PinState.AlwaysLocal },
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        data: { uuid: 'fileUuid3' as FileUuid, onDiskSize: 30, pinState: PinState.OnlineOnly },
      });

    // When
    await loadFileExplorerFiles({
      files,
      parentUuid,
      limit: pLimit(20),
      items: [
        { path: abs('/file1'), stats: stats({ mtimeMs: 1, size: 100 }) },
        { path: abs('/file2'), stats: stats({ mtimeMs: 2, size: 200 }) },
        { path: abs('/file3'), stats: stats({ mtimeMs: 3, size: 300 }) },
      ],
    });

    // Then
    expect(files).toStrictEqual(
      new Map([
        [
          'fileUuid1',
          {
            path: '/file1',
            parentUuid,
            mtimeMs: 1,
            size: 100,
            onDiskSize: 10,
            pinState: PinState.AlwaysLocal,
          },
        ],
        [
          'fileUuid3',
          {
            path: '/file3',
            parentUuid,
            mtimeMs: 3,
            size: 300,
            onDiskSize: 30,
            pinState: PinState.OnlineOnly,
          },
        ],
      ]),
    );
  });

  it('should process more items than the worker count while keeping concurrency bounded', async () => {
    // Given
    const files: FileExplorerFiles = new Map();
    let activeCalls = 0;
    let maxActiveCalls = 0;
    let nextUuid = 0;

    getFileInfoMock.mockImplementation(async () => {
      activeCalls += 1;
      maxActiveCalls = Math.max(maxActiveCalls, activeCalls);
      nextUuid += 1;
      const uuid = `fileUuid${nextUuid}` as FileUuid;

      await testSleep(1);

      activeCalls -= 1;
      return { data: { uuid, onDiskSize: 10, pinState: PinState.OnlineOnly } };
    });

    // When
    await loadFileExplorerFiles({
      files,
      parentUuid,
      limit: pLimit(2),
      items: [
        { path: abs('/file1'), stats: stats() },
        { path: abs('/file2'), stats: stats() },
        { path: abs('/file3'), stats: stats() },
        { path: abs('/file4'), stats: stats() },
        { path: abs('/file5'), stats: stats() },
      ],
    });

    // Then
    expect(getFileInfoMock).toHaveBeenCalledTimes(5);
    expect(files.size).toBe(5);
    expect(maxActiveCalls).toBe(2);
  });
});
