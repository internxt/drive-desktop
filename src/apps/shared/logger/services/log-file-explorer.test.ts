import { call, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { logFileExplorer } from './log-file-explorer';
import { abs, join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as statReaddir from '@/infra/file-system/services/stat-readdir';
import { writeFile } from 'node:fs/promises';
import { PATHS } from '@/core/electron/paths';
import { NodeWin } from '@/infra/node-win/node-win.module';

vi.mock(import('node:fs/promises'));

describe('log-file-explorer', () => {
  const writeFileMock = vi.mocked(writeFile);
  const statReaddirMock = partialSpyOn(statReaddir, 'statReaddir');
  const getFileInfoMock = partialSpyOn(NodeWin, 'getFileInfo');
  const getFolderInfoMock = partialSpyOn(NodeWin, 'getFolderInfo');

  const csvPath = join(PATHS.LOGS, 'file-explorer.csv');
  const props = mockProps<typeof logFileExplorer>({ ctx: { rootPath: abs('/drive') } });

  it('should generate empty csv if no files and no folders', async () => {
    // Given
    statReaddirMock.mockResolvedValue({ files: [], folders: [] });
    // When
    const res = await logFileExplorer(props);
    // Then
    expect(res).toBe(csvPath);
    call(writeFileMock).toMatchObject([csvPath, 'path,uuid,pinState,inSyncState,size,onDiskSize\nfiles\nfolders', 'utf-8']);
  });

  it('should generate csv with files and folders with no placeholder', async () => {
    // Given
    getFileInfoMock.mockResolvedValue({});
    getFolderInfoMock.mockResolvedValue({});
    statReaddirMock.mockResolvedValue({ files: [{ path: abs('/drive/file.txt') }], folders: [{ path: abs('/drive/folder') }] });
    // When
    const res = await logFileExplorer(props);
    // Then
    expect(res).toBe(csvPath);
    call(writeFileMock).toMatchObject([
      csvPath,
      'path,uuid,pinState,inSyncState,size,onDiskSize\nfiles\n"file.txt"\nfolders\n"folder"',
      'utf-8',
    ]);
  });

  it('should iterate folder if parent is a placeholder', async () => {
    // Given
    getFileInfoMock.mockResolvedValueOnce({ data: { placeholderId: 'FILE:uuid' } }).mockResolvedValueOnce({});
    getFolderInfoMock.mockResolvedValueOnce({ data: { placeholderId: 'FOLDER:uuid' } }).mockResolvedValueOnce({});
    statReaddirMock
      .mockResolvedValueOnce({
        files: [{ path: abs('/drive/file1.txt'), stats: { size: 1024 } }],
        folders: [{ path: abs('/drive/folder1') }],
      })
      .mockResolvedValueOnce({ files: [{ path: abs('/drive/file2.txt') }], folders: [{ path: abs('/drive/folder2') }] });
    // When
    const res = await logFileExplorer(props);
    // Then
    expect(res).toBe(csvPath);
    call(writeFileMock).toMatchObject([
      csvPath,
      'path,uuid,pinState,inSyncState,size,onDiskSize\nfiles\n"file1.txt",FILE:uuid,,,1024,\n"file2.txt"\nfolders\n"folder1",FOLDER:uuid,\n"folder2"',
      'utf-8',
    ]);
  });
});
