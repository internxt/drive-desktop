import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { statReaddir } from './stat-readdir';
import { TEST_FILES } from '@/tests/vitest/mocks.helper.test';
import { v4 } from 'uuid';
import { mkdir, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { call } from '@/tests/vitest/utils.helper.test';

describe('stat-readdir', () => {
  const root = join(TEST_FILES, v4());

  const folder1 = join(root, 'folder1');
  const folder2 = join(root, 'folder2');
  const folder3 = join(root, 'folder2', 'folder3');

  const file1 = join(root, 'file1');
  const file2 = join(root, 'file2');
  const file3 = join(root, 'file3');
  const file4 = join(root, 'folder2', 'file4');
  const file5 = join(root, 'folder2', 'folder3', 'file5');

  const onError = vi.fn();

  beforeAll(async () => {
    await mkdir(root);
    await mkdir(folder1);
    await mkdir(folder2);
    await mkdir(folder3);
    await writeFile(file1, 'content');
    await writeFile(file2, 'content');
    await writeFile(file3, 'content');
    await writeFile(file4, 'content');
    await writeFile(file5, 'content');
  });

  it('should add retrieve files and folders and handle errors', async () => {
    // Given
    execSync(`icacls "${file3}" /deny "${process.env.USERNAME}":F`);
    // When
    const { files, folders } = await statReaddir({ folder: root, onError });
    // Then
    const sortedFiles = files.toSorted((a, b) => a.path.localeCompare(b.path));
    const sortedFolders = folders.toSorted((a, b) => a.path.localeCompare(b.path));

    expect(sortedFiles).toMatchObject([{ path: file1 }, { path: file2 }]);
    expect(sortedFolders).toMatchObject([{ path: folder1 }, { path: folder2 }]);
    call(onError).toMatchObject({ path: file3, error: { code: 'NO_ACCESS' } });
  });
});
