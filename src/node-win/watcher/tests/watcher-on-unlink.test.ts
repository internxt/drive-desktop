import { mkdir, rm, writeFile } from 'node:fs/promises';
import { v4 } from 'uuid';

import { setupWatcher, getEvents } from './watcher.helper.test';
import { sleep } from '@/apps/main/util';
import { TEST_FILES } from 'tests/vitest/mocks.helper.test';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

describe('watcher on unlink', () => {
  let rootPath: AbsolutePath;

  beforeEach(async () => {
    rootPath = join(TEST_FILES, v4());
    await mkdir(rootPath);
  });

  it('should emit unlink event when delete file', async () => {
    // Given
    const file = join(rootPath, 'file');
    await writeFile(file, 'content');
    await setupWatcher(rootPath);
    // When
    await rm(file, { force: true });
    await sleep(150);
    // Then
    getEvents().toMatchObject([{ event: 'unlink', path: file }]);
  });

  it('should emit unlinkDir event when delete folder', async () => {
    // Given
    const folder = join(rootPath, 'folder');
    await mkdir(folder);
    await setupWatcher(rootPath);
    // When
    await rm(folder, { recursive: true, force: true });
    await sleep(150);
    // Then
    getEvents().toMatchObject([{ event: 'unlinkDir', path: folder }]);
  });

  it('should emit unlinkDir and unlink events when delete folder with a file inside', async () => {
    // Given
    const parent = join(rootPath, 'parent');
    const file = join(parent, 'file');
    await mkdir(parent);
    await writeFile(file, 'content');
    await setupWatcher(rootPath);
    // When
    await rm(parent, { recursive: true, force: true });
    await sleep(150);
    // Then
    getEvents().toMatchObject([
      { event: 'unlinkDir', path: parent },
      { event: 'unlink', path: file },
    ]);
  });

  it('should emit unlinkDir and unlink events when delete folder with a folder inside', async () => {
    // Given
    const parent = join(rootPath, 'parent');
    const folder = join(parent, 'folder');
    await mkdir(parent);
    await mkdir(folder);
    await setupWatcher(rootPath);
    // When
    await rm(parent, { recursive: true, force: true });
    await sleep(150);
    // Then
    getEvents().toMatchObject([
      { event: 'unlinkDir', path: folder },
      { event: 'unlinkDir', path: parent },
    ]);
  });
});
