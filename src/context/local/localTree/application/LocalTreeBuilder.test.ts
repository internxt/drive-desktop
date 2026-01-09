import { mkdir, writeFile } from 'node:fs/promises';
import LocalTreeBuilder from './LocalTreeBuilder';
import { v4 } from 'uuid';
import { TEST_FILES } from 'tests/vitest/mocks.helper.test';
import { call, mockProps } from 'tests/vitest/utils.helper.test';
import { join } from '../../localFile/infrastructure/AbsolutePath';
import { execSync } from 'node:child_process';

describe('LocalTreeBuilder', () => {
  const folder = join(TEST_FILES, v4());

  const folder1 = join(folder, 'folder1');
  const folder2 = join(folder, 'folder2');
  const folder3 = join(folder, 'folder1', 'folder3');

  const file1 = join(folder, 'file1');
  const file2 = join(folder, 'file2');
  const file3 = join(folder1, 'file3');
  const file4 = join(folder3, 'file4');

  const addIssue = vi.fn();
  const props = mockProps<typeof LocalTreeBuilder.run>({ ctx: { pathname: folder, addIssue } });

  beforeAll(async () => {
    await mkdir(folder);
    await mkdir(folder1);
    await mkdir(folder2);
    await mkdir(folder3);
    await writeFile(file1, 'content');
    await writeFile(file2, 'content');
    await writeFile(file3, 'content');
    await writeFile(file4, 'content');
  });

  it('should add files and folders', async () => {
    // When
    const tree = await LocalTreeBuilder.run(props);
    // Then
    expect(Object.keys(tree.files).toSorted()).toStrictEqual([file1, file2, file3, file4]);
    expect(tree.folders.toSorted()).toStrictEqual([folder, folder1, folder3, folder2]);
  });

  it('should add an issue if stat gives error and continue', async () => {
    // Given
    execSync(`icacls "${file3}" /deny "${process.env.USERNAME}":F`);
    // When
    const tree = await LocalTreeBuilder.run(props);
    // Then
    call(addIssue).toMatchObject({ name: file3, error: 'FOLDER_ACCESS_DENIED' });
    expect(Object.keys(tree.files).toSorted()).toStrictEqual([file1, file2, file4]);
    expect(tree.folders.toSorted()).toStrictEqual([folder, folder1, folder3, folder2]);
  });
});
