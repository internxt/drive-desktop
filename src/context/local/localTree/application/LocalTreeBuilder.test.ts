import { mkdir, rm, writeFile } from 'fs/promises';
import { AbsolutePath } from '../../localFile/infrastructure/AbsolutePath';
import LocalTreeBuilder from './LocalTreeBuilder';
import { v4 } from 'uuid';
import { TEST_FILES } from 'tests/vitest/mocks.helper.test';
import { join } from 'path';

describe('LocalTreeBuilder', () => {
  const folder = join(TEST_FILES, v4());

  const folder1 = join(folder, 'folder1');
  const folder2 = join(folder, 'folder2');
  const folder3 = join(folder, 'folder1', 'folder3');

  const file1 = join(folder, 'file1');
  const file2 = join(folder, 'file2');
  const file3 = join(folder1, 'file3');
  const file4 = join(folder3, 'file4');

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

  afterAll(async () => {
    await rm(folder, { recursive: true });
  });

  it('It should add files and folders', async () => {
    const tree = await LocalTreeBuilder.run(folder as AbsolutePath);

    expect(Object.keys(tree.files)).toStrictEqual(['/file1', '/file2', '/folder1/file3', '/folder1/folder3/file4']);
    expect(Object.keys(tree.folders)).toStrictEqual(['/', '/folder1', '/folder1/folder3', '/folder2']);
  });
});
