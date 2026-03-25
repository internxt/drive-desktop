import { mkdir, rm, writeFile } from 'node:fs/promises';
import { v4 } from 'uuid';

import { setupWatcher } from './watcher.helper.test';
import { sleep } from '@/apps/main/util';
import { TEST_FILES } from 'tests/vitest/mocks.helper.test';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import trash from 'trash';
import { call, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as onUnlink from '@/backend/features/local-sync/watcher/events/unlink/on-unlink';

describe('watcher-on-unlink', () => {
  const onUnlinkMock = partialSpyOn(onUnlink, 'onUnlink');

  let rootPath: AbsolutePath;

  beforeEach(async () => {
    rootPath = join(TEST_FILES, v4());
    await mkdir(rootPath);
  });

  it('should emit delete event when delete file', async () => {
    // Given
    const file = join(rootPath, 'file');
    await writeFile(file, 'content');
    await setupWatcher(rootPath);
    // When
    await rm(file, { force: true });
    await sleep(100);
    // Then
    call(onUnlinkMock).toMatchObject({ path: file, type: 'file' });
  });

  it('should emit delete event when delete folder', async () => {
    // Given
    const folder = join(rootPath, 'folder');
    await mkdir(folder);
    await setupWatcher(rootPath);
    // When
    await rm(folder, { recursive: true, force: true });
    await sleep(100);
    // Then
    call(onUnlinkMock).toMatchObject({ path: folder, type: 'folder' });
  });

  it('should emit delete event when delete folder with file inside using terminal', async () => {
    // Given
    const parent = join(rootPath, 'parent');
    const file = join(parent, 'file');
    await mkdir(parent);
    await writeFile(file, 'content');
    await setupWatcher(rootPath);
    // When
    await rm(parent, { recursive: true, force: true });
    await sleep(100);
    // Then
    call(onUnlinkMock).toMatchObject({ path: parent, type: 'folder' });
  });

  it('should emit delete event when delete folder with file inside using trash', async () => {
    // Given
    const parent = join(rootPath, 'parent');
    const file = join(parent, 'file');
    await mkdir(parent);
    await writeFile(file, 'content');
    await setupWatcher(rootPath);
    // When
    await trash(parent);
    await sleep(100);
    // Then
    call(onUnlinkMock).toMatchObject({ path: parent, type: 'folder' });
  });

  it('should emit delete event when delete folder with folder inside using terminal', async () => {
    // Given
    const parent = join(rootPath, 'parent');
    const folder = join(parent, 'folder');
    await mkdir(parent);
    await mkdir(folder);
    await setupWatcher(rootPath);
    // When
    await rm(parent, { recursive: true, force: true });
    await sleep(100);
    // Then
    call(onUnlinkMock).toMatchObject({ path: parent, type: 'folder' });
  });

  it('should emit delete event when delete folder with folder inside using trash', async () => {
    // Given
    const parent = join(rootPath, 'parent');
    const folder = join(parent, 'folder');
    await mkdir(parent);
    await mkdir(folder);
    await setupWatcher(rootPath);
    // When
    await trash(parent);
    await sleep(100);
    // Then
    call(onUnlinkMock).toMatchObject({ path: parent, type: 'folder' });
  });
});
