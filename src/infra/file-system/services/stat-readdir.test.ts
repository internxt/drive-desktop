import { randomUUID } from 'node:crypto';
import { Stats } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { TEST_FILES } from '@/tests/vitest/mocks.helper.test';
import { mockProps, testSleep } from '@/tests/vitest/utils.helper.test';
import { StatError } from './stat';
import { statReaddir } from './stat-readdir';

describe('stat-readdir', () => {
  const root = join(TEST_FILES, randomUUID());

  const folder1 = join(root, 'folder1');
  const folder2 = join(root, 'folder2');
  const folder3 = join(root, 'folder2', 'folder3');

  const file1 = join(root, 'file1');
  const file2 = join(root, 'file2');
  const file3 = join(root, 'file3');
  const file4 = join(root, 'folder2', 'file4');
  const file5 = join(root, 'folder2', 'folder3', 'file5');
  const manyEntries = join(root, 'many-entries');
  const entriesWithError = join(root, 'entries-with-error');

  const props = mockProps<typeof statReaddir>({ folder: root });

  function stats({ isFile, isDirectory }: { isFile: boolean; isDirectory: boolean }) {
    return {
      isFile: () => isFile,
      isDirectory: () => isDirectory,
    } as Stats;
  }

  beforeAll(async () => {
    await mkdir(root);
    await mkdir(folder1);
    await mkdir(folder2);
    await mkdir(folder3);
    await mkdir(manyEntries);
    await mkdir(entriesWithError);
    await writeFile(file1, 'content');
    await writeFile(file2, 'content');
    await writeFile(file3, 'content');
    await writeFile(file4, 'content');
    await writeFile(file5, 'content');

    await Promise.all(Array.from({ length: 25 }, (_, index) => writeFile(join(manyEntries, `file-${index}`), 'content')));
    await writeFile(join(entriesWithError, 'file-ok'), 'content');
    await writeFile(join(entriesWithError, 'file-error'), 'content');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should add retrieve files and folders', async () => {
    // When
    const { files, folders } = await statReaddir(props);
    // Then
    const sortedFiles = files.toSorted((a, b) => a.path.localeCompare(b.path));
    const sortedFolders = folders.toSorted((a, b) => a.path.localeCompare(b.path));

    expect(sortedFiles).toMatchObject([{ path: file1 }, { path: file2 }, { path: file3 }]);
    expect(sortedFolders).toMatchObject([{ path: entriesWithError }, { path: folder1 }, { path: folder2 }, { path: manyEntries }]);
  });

  it('should process more entries than the worker count while keeping stat concurrency bounded', async () => {
    // Given
    let activeStats = 0;
    let maxActiveStats = 0;

    vi.spyOn(fileSystem, 'stat').mockImplementation(async ({ absolutePath }) => {
      activeStats += 1;
      maxActiveStats = Math.max(maxActiveStats, activeStats);

      await testSleep(1);

      activeStats -= 1;
      return { data: stats({ isFile: absolutePath.includes('file'), isDirectory: false }) };
    });

    // When
    const { files, folders } = await statReaddir({ folder: manyEntries });

    // Then
    expect(fileSystem.stat).toHaveBeenCalledTimes(25);
    expect(files).toHaveLength(25);
    expect(folders).toHaveLength(0);
    expect(maxActiveStats).toBe(20);
  });

  it('should use the provided stat concurrency', async () => {
    // Given
    let activeStats = 0;
    let maxActiveStats = 0;

    vi.spyOn(fileSystem, 'stat').mockImplementation(async ({ absolutePath }) => {
      activeStats += 1;
      maxActiveStats = Math.max(maxActiveStats, activeStats);

      await testSleep(1);

      activeStats -= 1;
      return { data: stats({ isFile: absolutePath.includes('file'), isDirectory: false }) };
    });

    // When
    await statReaddir({ folder: manyEntries, concurrency: 3 });

    // Then
    expect(maxActiveStats).toBe(3);
  });

  it('should keep processing entries when one stat call fails', async () => {
    // Given
    const onError = vi.fn();
    const error = new StatError('UNKNOWN');

    vi.spyOn(fileSystem, 'stat').mockImplementation(async ({ absolutePath }) => {
      if (absolutePath.endsWith('file-error')) return { error };
      return { data: stats({ isFile: true, isDirectory: false }) };
    });

    // When
    const { files, folders } = await statReaddir({ folder: entriesWithError, onError });

    // Then
    expect(files).toMatchObject([{ path: join(entriesWithError, 'file-ok') }]);
    expect(folders).toStrictEqual([]);
    expect(onError).toHaveBeenCalledWith({ path: join(entriesWithError, 'file-error'), error });
  });

  it('should throw error if root folder cannot be read', async () => {
    // Given
    const missingFolder = join(root, 'missing-folder');
    // When
    const promise = statReaddir({ folder: missingFolder });
    // Then
    await expect(promise).rejects.toThrowError('ENOENT');
  });
});
