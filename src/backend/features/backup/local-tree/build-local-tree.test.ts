import type { Stats } from 'node:fs';
import { AbsolutePath } from '../../../../context/local/localFile/infrastructure/AbsolutePath';
import { DriveDesktopError } from '../../../../context/shared/domain/errors/DriveDesktopError';
import * as safeStatModule from '../../../../infra/local-file-system/safe-stat';
import { LocalTree } from '../../../../context/local/localTree/domain/LocalTree';
import { buildLocalTree } from './build-local-tree';
import * as traverseModule from './traverse';

vi.mock(import('../../../../infra/local-file-system/safe-stat'));
vi.mock(import('./traverse'));

const safeStatMock = vi.mocked(safeStatModule.safeStat);
const traverseMock = vi.mocked(traverseModule.traverse);

function stats(type: 'file' | 'folder'): Stats {
  return {
    mtime: new Date('2026-01-01T00:00:00.000Z'),
    isDirectory: () => type === 'folder',
  } as Stats;
}

describe('buildLocalTree', () => {
  const root = '/home/user/Backup' as AbsolutePath;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds a local tree for a readable root folder', async () => {
    safeStatMock.mockResolvedValue({ data: stats('folder') });
    traverseMock.mockResolvedValue({ data: { skippedItems: [] } });

    const result = await buildLocalTree(root);

    expect(result.data?.tree).toBeInstanceOf(LocalTree);
    expect(result.data?.tree.root.path).toBe(root);
    expect(result.data?.skippedItems).toStrictEqual([]);
    expect(safeStatMock).toHaveBeenCalledWith(root);
    expect(traverseMock).toHaveBeenCalledWith({ tree: result.data?.tree, currentFolder: root, rootFolder: root });
  });

  it('bubbles skipped items returned by traversal', async () => {
    const skippedError = new DriveDesktopError('ACTION_NOT_PERMITTED', 'Symbolic links are skipped');
    const skippedItems = [{ path: '/home/user/Backup/link' as AbsolutePath, error: skippedError }];

    safeStatMock.mockResolvedValue({ data: stats('folder') });
    traverseMock.mockResolvedValue({ data: { skippedItems } });

    const result = await buildLocalTree(root);

    expect(result.data?.skippedItems).toBe(skippedItems);
  });

  it('returns root stat errors without traversing', async () => {
    const error = new DriveDesktopError('NOT_EXISTS', 'root does not exist');
    safeStatMock.mockResolvedValue({ error });

    const result = await buildLocalTree(root);

    expect(result).toStrictEqual({ error });
    expect(traverseMock).not.toHaveBeenCalled();
  });

  it('returns BAD_REQUEST when the root path is not a directory', async () => {
    safeStatMock.mockResolvedValue({ data: stats('file') });

    const result = await buildLocalTree(root);

    expect(result.error).toBeInstanceOf(DriveDesktopError);
    expect(result.error?.cause).toBe('BAD_REQUEST');
    expect(result.error?.message).toBe(`${root} is not a directory`);
    expect(traverseMock).not.toHaveBeenCalled();
  });

  it('returns traversal errors', async () => {
    const error = new DriveDesktopError('UNKNOWN', 'traversal failed');

    safeStatMock.mockResolvedValue({ data: stats('folder') });
    traverseMock.mockResolvedValue({ error });

    const result = await buildLocalTree(root);

    expect(result).toStrictEqual({ error });
  });
});
