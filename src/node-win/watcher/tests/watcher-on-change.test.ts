import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import { v4 } from 'uuid';

import { setupWatcher, getEvents } from './watcher.helper.test';
import { sleep } from '@/apps/main/util';
import { TEST_FILES } from 'tests/vitest/mocks.helper.test';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { execSync } from 'node:child_process';

describe('watcher on change', () => {
  let rootPath: AbsolutePath;

  beforeEach(async () => {
    rootPath = join(TEST_FILES, v4());
    await mkdir(rootPath);
  });

  it('should emit change event when modify a file', async () => {
    // Given
    const file = join(rootPath, 'file');
    await writeFile(file, 'content');
    await setupWatcher(rootPath);
    // When
    await appendFile(file, 'content');
    await sleep(50);
    // Then
    getEvents().toStrictEqual([{ event: 'change', path: file, stats: { size: 14 } }]);
  });

  it('should emit change event when pin a file', async () => {
    // Given
    const file = join(rootPath, 'file');
    await writeFile(file, 'content');
    await setupWatcher(rootPath);
    // When
    execSync(`attrib +P ${file}`);
    await sleep(100);
    // Then
    getEvents().toMatchObject([{ event: 'change', path: file, stats: { size: 7 } }]);
  });

  it('should emit change event when unpin a file', async () => {
    // Given
    const file = join(rootPath, 'file');
    await writeFile(file, 'content');
    execSync(`attrib +P ${file}`);
    await setupWatcher(rootPath);
    // When
    execSync(`attrib -P ${file}`);
    await sleep(50);
    // Then
    getEvents().toMatchObject([{ event: 'change', path: file, stats: { size: 7 } }]);
  });

  it('should not emit any event when pin a folder', async () => {
    // Given
    const folder = join(rootPath, 'folder');
    await mkdir(folder);
    await setupWatcher(rootPath);
    // When
    execSync(`attrib +P ${folder}`);
    await sleep(100);
    // Then
    getEvents().toStrictEqual([]);
  });

  it('should not emit any event when unpin a folder', async () => {
    // Given
    const folder = join(rootPath, 'folder');
    await mkdir(folder);
    execSync(`attrib +P ${folder}`);
    await setupWatcher(rootPath);
    // When
    execSync(`attrib -P ${folder}`);
    await sleep(50);
    // Then
    getEvents().toStrictEqual([]);
  });
});
