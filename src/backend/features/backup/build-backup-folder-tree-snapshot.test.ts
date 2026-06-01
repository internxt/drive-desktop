import { buildBackupFolderTreeSnapshot } from './build-backup-folder-tree-snapshot';

describe('build-backup-folder-tree-snapshot', () => {
  it('should accumulate all file sizes and decrypted names across tree', () => {
    const decryptFileName = vi.fn((name: string) => `dec:${name}`);
    const tree = {
      id: 1,
      plainName: 'root',
      files: [{ id: 101, name: 'f1', folderId: 1, size: '2' }],
      children: [
        {
          id: 2,
          plainName: 'child',
          files: [{ id: 102, name: 'f2', folderId: 2, size: '3' }],
          children: [],
        },
      ],
    };

    const result = buildBackupFolderTreeSnapshot({ tree: tree as never, decryptFileName });

    expect(result.size).toBe(5);
    expect(result.folderDecryptedNames).toStrictEqual({ 1: 'root', 2: 'child' });
    expect(result.fileDecryptedNames).toStrictEqual({ 101: 'dec:f1', 102: 'dec:f2' });
    expect(decryptFileName).toBeCalledTimes(2);
  });
});
