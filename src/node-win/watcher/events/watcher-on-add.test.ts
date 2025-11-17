import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path/posix';
import { v4 } from 'uuid';

import { setupWatcher, getEvents } from '../watcher.helper.test';
import { sleep } from '@/apps/main/util';
import { TEST_FILES } from 'tests/vitest/mocks.helper.test';
import { onAdd } from './on-add.service';

vi.mock(import('./on-add.service'));

describe('[Watcher] When add items', () => {
  it('When add an empty folder, then emit one addDir event', async () => {
    // Arrange
    const syncRootPath = join(TEST_FILES, v4());
    const folder = join(syncRootPath, v4());
    await setupWatcher(syncRootPath);

    // Act
    await sleep(50);
    await mkdir(folder);
    await sleep(50);

    // Assert
    getEvents().toStrictEqual(
      expect.arrayContaining([
        { event: 'addDir', path: syncRootPath },
        { event: 'addDir', path: folder },
      ]),
    );
  });

  it('When add a file, then emit one add event', async () => {
    // Arrange
    const syncRootPath = join(TEST_FILES, v4());
    const file = join(syncRootPath, v4());
    await setupWatcher(syncRootPath);

    // Act
    await sleep(50);
    await writeFile(file, 'content');
    await sleep(50);

    // Assert
    getEvents().toStrictEqual(
      expect.arrayContaining([
        { event: 'addDir', path: syncRootPath },
        { event: 'add', path: file },
      ]),
    );
  });

  it('When add a file of zero size, then emit one add event', async () => {
    // Arrange
    const syncRootPath = join(TEST_FILES, v4());
    const file = join(syncRootPath, v4());
    await setupWatcher(syncRootPath);

    // Act
    await sleep(50);
    await writeFile(file, '');
    await sleep(50);

    // Assert
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        path: file,
        stats: expect.objectContaining({ size: 0 }),
      }),
    );

    getEvents().toStrictEqual(
      expect.arrayContaining([
        { event: 'addDir', path: syncRootPath },
        { event: 'add', path: file },
      ]),
    );
  });

  it('When add a folder and a file inside, then emit one addDir and one add event', async () => {
    // Arrange
    const syncRootPath = join(TEST_FILES, v4());
    const folder = join(syncRootPath, v4());
    const file = join(folder, v4());
    await setupWatcher(syncRootPath);

    // Act
    await sleep(50);
    await mkdir(folder);
    await writeFile(file, 'content');
    await sleep(50);

    // Assert
    getEvents().toStrictEqual(
      expect.arrayContaining([
        { event: 'addDir', path: syncRootPath },
        { event: 'addDir', path: folder },
        { event: 'add', path: file },
      ]),
    );
  });
});
