import { mkdir, rename, writeFile } from 'node:fs/promises';
import { v4 } from 'uuid';

import { setupWatcher, getEvents } from './watcher.helper.test';
import { sleep } from '@/apps/main/util';
import { TEST_FILES } from 'tests/vitest/mocks.helper.test';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

describe('watcher-on-move', () => {
  let rootPath: AbsolutePath;
  let parent: AbsolutePath;

  beforeEach(async () => {
    rootPath = join(TEST_FILES, v4());
    parent = join(rootPath, 'parent');
    await mkdir(rootPath);
    await mkdir(parent);
  });

  it('should emit rename_new event when rename file', async () => {
    // Given
    const file1 = join(rootPath, 'file1');
    const file2 = join(rootPath, 'file2');
    await writeFile(file1, 'content');
    await setupWatcher(rootPath);
    // When
    await rename(file1, file2);
    await sleep(100);
    // Then
    getEvents().toMatchObject([{ event: { action: 'rename_new', type: 'file' }, path: file2 }]);
  });

  it('should emit create event when move file', async () => {
    // Given
    const file1 = join(rootPath, 'file');
    const file2 = join(parent, 'file');
    await writeFile(file1, 'content');
    await setupWatcher(rootPath);
    // When
    await rename(file1, file2);
    await sleep(100);
    // Then
    getEvents().toMatchObject([{ event: { action: 'create', type: 'file' }, path: file2 }]);
  });

  it('should emit rename_new event when rename folder', async () => {
    // Given
    const folder1 = join(rootPath, 'folder1');
    const folder2 = join(rootPath, 'folder2');
    await mkdir(folder1);
    await setupWatcher(rootPath);
    // When
    await rename(folder1, folder2);
    await sleep(100);
    // Then
    getEvents().toMatchObject([{ event: { action: 'rename_new', type: 'folder' }, path: folder2 }]);
  });

  it('should emit create event when move folder', async () => {
    // Given
    const folder1 = join(rootPath, 'folder');
    const folder2 = join(parent, 'folder');
    await mkdir(folder1);
    await setupWatcher(rootPath);
    // When
    await rename(folder1, folder2);
    await sleep(100);
    // Then
    getEvents().toMatchObject([{ event: { action: 'create', type: 'folder' }, path: folder2 }]);
  });
});
