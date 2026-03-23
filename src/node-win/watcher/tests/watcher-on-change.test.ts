import { appendFile, mkdir, rename, writeFile } from 'node:fs/promises';
import { v4 } from 'uuid';

import { setupWatcher, getEvents } from './watcher.helper.test';
import { sleep } from '@/apps/main/util';
import { TEST_FILES } from 'tests/vitest/mocks.helper.test';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { execSync } from 'node:child_process';

describe('watcher-on-change', () => {
  let rootPath: AbsolutePath;

  beforeEach(async () => {
    rootPath = join(TEST_FILES, v4());
    await mkdir(rootPath);
  });

  it('should emit update event when modify a file', async () => {
    // Given
    const file = join(rootPath, 'file');
    await writeFile(file, 'content');
    await setupWatcher(rootPath);
    // When
    await appendFile(file, 'content');
    await sleep(100);
    // Then
    getEvents().toMatchObject([{ event: { action: 'update', type: 'file', size: 14 }, path: file }]);
  });

  it('should emit rename_new event when replace a file', async () => {
    // Given
    const file1 = join(rootPath, 'file1');
    const file2 = join(rootPath, 'file2');
    await writeFile(file1, 'content');
    await writeFile(file2, 'newContent');
    await setupWatcher(rootPath);
    // When
    await rename(file2, file1);
    await sleep(100);
    // Then
    getEvents().toMatchObject([{ event: { action: 'rename_new', type: 'file', size: 10 }, path: file1 }]);
  });

  it('should emit update event when pin a file', async () => {
    // Given
    const file = join(rootPath, 'file');
    await writeFile(file, 'content');
    await setupWatcher(rootPath);
    // When
    execSync(`attrib +P ${file}`);
    await sleep(100);
    // Then
    getEvents().toMatchObject([{ event: { action: 'update', type: 'file', size: 7 }, path: file }]);
  });

  it('should emit update event when unpin a file', async () => {
    // Given
    const file = join(rootPath, 'file');
    await writeFile(file, 'content');
    execSync(`attrib +P ${file}`);
    await setupWatcher(rootPath);
    // When
    execSync(`attrib -P ${file}`);
    await sleep(100);
    // Then
    getEvents().toMatchObject([{ event: { action: 'update', type: 'file', size: 7 }, path: file }]);
  });

  it('should emit update event when pin a folder', async () => {
    // Given
    const folder = join(rootPath, 'folder');
    await mkdir(folder);
    await setupWatcher(rootPath);
    // When
    execSync(`attrib +P ${folder}`);
    await sleep(100);
    // Then
    getEvents().toMatchObject([{ event: { action: 'update', type: 'folder', size: 0 }, path: folder }]);
  });

  it('should emit update event when unpin a folder', async () => {
    // Given
    const folder = join(rootPath, 'folder');
    await mkdir(folder);
    execSync(`attrib +P ${folder}`);
    await setupWatcher(rootPath);
    // When
    execSync(`attrib -P ${folder}`);
    await sleep(100);
    // Then
    getEvents().toMatchObject([{ event: { action: 'update', type: 'folder', size: 0 }, path: folder }]);
  });
});
