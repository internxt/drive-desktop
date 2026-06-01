import type { Dirent, Stats } from 'node:fs';
import { AbsolutePath } from '../../../../context/local/localFile/infrastructure/AbsolutePath';
import { DriveDesktopError } from '../../../../context/shared/domain/errors/DriveDesktopError';
import * as safeReadDirModule from '../../../../infra/local-file-system/safe-readdir';
import * as safeStatModule from '../../../../infra/local-file-system/safe-stat';
import { getDirentsForPath } from './get-dirents-for-path';

vi.mock(import('../../../../infra/local-file-system/safe-readdir'));
vi.mock(import('../../../../infra/local-file-system/safe-stat'));

const safeReadDirMock = vi.mocked(safeReadDirModule.safeReadDir);
const safeStatMock = vi.mocked(safeStatModule.safeStat);

function dirent(name: string, type: 'file' | 'folder' | 'symlink'): Dirent {
  return {
    name,
    isFile: () => type === 'file',
    isDirectory: () => type === 'folder',
    isSymbolicLink: () => type === 'symlink',
  } as Dirent;
}

function stats(type: 'file' | 'folder', size = 0): Stats {
  return {
    size,
    mtime: new Date('2026-01-01T00:00:00.000Z'),
    isFile: () => type === 'file',
    isDirectory: () => type === 'folder',
  } as Stats;
}

describe('getDirentsForPath', () => {
  const root = '/home/user/Backup' as AbsolutePath;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns files and folders with their absolute paths and stats', async () => {
    const fileStats = stats('file', 1024);
    const folderStats = stats('folder');

    safeReadDirMock.mockResolvedValue({
      data: [dirent('file.txt', 'file'), dirent('Photos', 'folder')],
    });
    safeStatMock.mockResolvedValueOnce({ data: fileStats }).mockResolvedValueOnce({ data: folderStats });

    const result = await getDirentsForPath(root);

    expect(result.data).toStrictEqual({
      files: [{ path: '/home/user/Backup/file.txt', stats: fileStats }],
      folders: [{ path: '/home/user/Backup/Photos', stats: folderStats }],
      skippedItems: [],
    });
    expect(safeReadDirMock).toHaveBeenCalledWith(root);
    expect(safeStatMock).toHaveBeenNthCalledWith(1, '/home/user/Backup/file.txt');
    expect(safeStatMock).toHaveBeenNthCalledWith(2, '/home/user/Backup/Photos');
  });

  it('skips symbolic links without statting them', async () => {
    safeReadDirMock.mockResolvedValue({
      data: [dirent('shortcut', 'symlink')],
    });

    const result = await getDirentsForPath(root);

    expect(result.data?.files).toStrictEqual([]);
    expect(result.data?.folders).toStrictEqual([]);
    expect(result.data?.skippedItems).toHaveLength(1);
    expect(result.data?.skippedItems[0]).toMatchObject({
      path: '/home/user/Backup/shortcut',
      error: expect.objectContaining({
        cause: 'ACTION_NOT_PERMITTED',
        message: 'Symbolic links are skipped',
      }),
    });
    expect(safeStatMock).not.toHaveBeenCalled();
  });

  it('adds stat failures to skipped items and keeps processing other entries', async () => {
    const statError = new DriveDesktopError('NOT_EXISTS', 'missing item');
    const fileStats = stats('file', 2048);

    safeReadDirMock.mockResolvedValue({
      data: [dirent('missing.txt', 'file'), dirent('valid.txt', 'file')],
    });
    safeStatMock.mockResolvedValueOnce({ error: statError }).mockResolvedValueOnce({ data: fileStats });

    const result = await getDirentsForPath(root);

    expect(result.data?.files).toStrictEqual([{ path: '/home/user/Backup/valid.txt', stats: fileStats }]);
    expect(result.data?.folders).toStrictEqual([]);
    expect(result.data?.skippedItems).toStrictEqual([{ path: '/home/user/Backup/missing.txt', error: statError }]);
  });

  it('returns a readdir error without statting entries', async () => {
    const readError = new DriveDesktopError('INSUFFICIENT_PERMISSION', 'cannot read folder');
    safeReadDirMock.mockResolvedValue({ error: readError });

    const result = await getDirentsForPath(root);

    expect(result).toStrictEqual({ error: readError });
    expect(safeStatMock).not.toHaveBeenCalled();
  });
});
