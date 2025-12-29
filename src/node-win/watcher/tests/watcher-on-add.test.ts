import { mkdir, writeFile } from 'node:fs/promises';
import { v4 } from 'uuid';

import { setupWatcher, getEvents } from './watcher.helper.test';
import { sleep } from '@/apps/main/util';
import { TEST_FILES } from 'tests/vitest/mocks.helper.test';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

describe('watcher on add', () => {
  let rootPath: AbsolutePath;
  let parent: AbsolutePath;

  beforeEach(async () => {
    rootPath = join(TEST_FILES, v4());
    parent = join(rootPath, 'parent');
    await mkdir(rootPath);
    await mkdir(parent);
  });

  it('should emit create event when create file', async () => {
    // Given
    const file = join(rootPath, 'file');
    await setupWatcher(rootPath);
    // When
    await writeFile(file, 'content');
    await sleep(50);
    // Then
    getEvents().toMatchObject([{ event: 'create', path: file }]);
  });

  it('should emit create event when create empty file', async () => {
    // Given
    const file = join(rootPath, 'file');
    await setupWatcher(rootPath);
    // When
    await writeFile(file, '');
    await sleep(50);
    // Then
    getEvents().toMatchObject([{ event: 'create', path: file }]);
  });

  it('should emit create event when create file inside a folder', async () => {
    // Given
    const file = join(parent, 'file');
    await setupWatcher(rootPath);
    // When
    await writeFile(file, 'content');
    await sleep(50);
    // Then
    getEvents().toMatchObject([
      { event: 'create', path: file },
      { event: 'update', path: file },
    ]);
  });

  it('should emit create event when create folder', async () => {
    // Given
    const folder = join(rootPath, v4());
    await setupWatcher(rootPath);
    // When
    await mkdir(folder);
    await sleep(50);
    // Then
    getEvents().toMatchObject([{ event: 'create', path: folder }]);
  });

  it('should emit create event when create folder inside a folder', async () => {
    // Given
    const folder = join(parent, 'folder');
    await setupWatcher(rootPath);
    // When
    await mkdir(folder);
    await sleep(50);
    // Then
    getEvents().toMatchObject([{ event: 'create', path: folder }]);
  });
});
