import type { Stats } from 'node:fs';
import { AbsolutePath } from '../../../../context/local/localFile/infrastructure/AbsolutePath';
import { LocalTree } from '../../../../context/local/localTree/domain/LocalTree';
import { DriveDesktopError } from '../../../../context/shared/domain/errors/DriveDesktopError';
import * as getDirentsForPathModule from './get-dirents-for-path';
import { traverse } from './traverse';

vi.mock(import('./get-dirents-for-path'));

const getDirentsForPathMock = vi.mocked(getDirentsForPathModule.getDirentsForPath);

function stats(type: 'file' | 'folder', size = 0): Stats {
  return {
    size,
    mtime: new Date('2026-01-01T00:00:00.000Z'),
    isFile: () => type === 'file',
    isDirectory: () => type === 'folder',
  } as Stats;
}

describe('traverse', () => {
  const root = '/home/user/Backup' as AbsolutePath;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds files and folders to the tree recursively', async () => {
    const tree = new LocalTree(root, Date.now());

    getDirentsForPathMock
      .mockResolvedValueOnce({
        data: {
          files: [{ path: '/home/user/Backup/file.txt' as AbsolutePath, stats: stats('file', 1024) }],
          folders: [{ path: '/home/user/Backup/Photos' as AbsolutePath, stats: stats('folder') }],
          skippedItems: [],
        },
      })
      .mockResolvedValueOnce({
        data: {
          files: [{ path: '/home/user/Backup/Photos/photo.jpg' as AbsolutePath, stats: stats('file', 2048) }],
          folders: [],
          skippedItems: [],
        },
      });

    const result = await traverse({ tree, currentFolder: root, rootFolder: root });

    expect(result.data?.skippedItems).toStrictEqual([]);
    expect(tree.files.map((file) => file.path)).toEqual(
      expect.arrayContaining(['/home/user/Backup/file.txt', '/home/user/Backup/Photos/photo.jpg']),
    );
    expect(tree.folders.map((folder) => folder.path)).toEqual(
      expect.arrayContaining([root, '/home/user/Backup/Photos']),
    );
  });

  it('bubbles skipped items from current and child folders', async () => {
    const tree = new LocalTree(root, Date.now());
    const skippedAtRoot = {
      path: '/home/user/Backup/link' as AbsolutePath,
      error: new DriveDesktopError('ACTION_NOT_PERMITTED', 'Symbolic links are skipped'),
    };
    const skippedInChild = {
      path: '/home/user/Backup/Photos/private.jpg' as AbsolutePath,
      error: new DriveDesktopError('INSUFFICIENT_PERMISSION', 'Cannot read item'),
    };

    getDirentsForPathMock
      .mockResolvedValueOnce({
        data: {
          files: [],
          folders: [{ path: '/home/user/Backup/Photos' as AbsolutePath, stats: stats('folder') }],
          skippedItems: [skippedAtRoot],
        },
      })
      .mockResolvedValueOnce({
        data: {
          files: [],
          folders: [],
          skippedItems: [skippedInChild],
        },
      });

    const result = await traverse({ tree, currentFolder: root, rootFolder: root });

    expect(result.data?.skippedItems).toStrictEqual([skippedAtRoot, skippedInChild]);
  });

  it('returns an error when the root folder cannot be read', async () => {
    const tree = new LocalTree(root, Date.now());
    const error = new DriveDesktopError('INSUFFICIENT_PERMISSION', 'Cannot read root');
    getDirentsForPathMock.mockResolvedValueOnce({ error });

    const result = await traverse({ tree, currentFolder: root, rootFolder: root });

    expect(result).toStrictEqual({ error });
  });

  it('skips a nested folder when it cannot be read', async () => {
    const tree = new LocalTree(root, Date.now());
    const child = '/home/user/Backup/Photos' as AbsolutePath;
    const error = new DriveDesktopError('INSUFFICIENT_PERMISSION', 'Cannot read child');

    getDirentsForPathMock
      .mockResolvedValueOnce({
        data: {
          files: [],
          folders: [{ path: child, stats: stats('folder') }],
          skippedItems: [],
        },
      })
      .mockResolvedValueOnce({ error });

    const result = await traverse({ tree, currentFolder: root, rootFolder: root });

    expect(result.data?.skippedItems).toStrictEqual([{ path: child, error }]);
    expect(tree.folders.map((folder) => folder.path)).toContain(child);
  });
});
