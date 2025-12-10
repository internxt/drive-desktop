import { execSync } from 'node:child_process';
import { appendFile, mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { v4 } from 'uuid';

import { TEST_FILES } from 'tests/vitest/mocks.helper.test';
import { sleep } from '@/apps/main/util';
import { getEvents, setupWatcher } from './watcher.helper.test';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FSWatcher } from 'chokidar';

describe('Watcher', () => {
  let watcher: FSWatcher | undefined;

  afterEach(async () => {
    await watcher?.close();
  });

  describe('[Watcher] When modify items', () => {
    it('When modify a file, then emit one change event', async () => {
      // Arrange
      const syncRootPath = join(TEST_FILES, v4());
      const fileName = v4();
      const file = join(syncRootPath, fileName);
      await setupWatcher(syncRootPath);
      await writeFile(file, 'content');

      // Act
      await sleep(50);
      await appendFile(file, 'content');
      await sleep(50);

      // Assert
      getEvents().toMatchObject([{ event: 'change', path: file }]);
    });
  });

  describe('[Addon] When rename items', () => {
    it('When rename a file, then do not emit any event', async () => {
      // Arrange
      const syncRootPath = join(TEST_FILES, v4());
      const fileName1 = v4();
      const fileName2 = v4();
      const file1 = join(syncRootPath, fileName1);
      const file2 = join(syncRootPath, fileName2);
      await setupWatcher(syncRootPath);
      await writeFile(file1, 'content');

      // Act
      await sleep(50);
      await rename(file1, file2);
      await sleep(100);

      // Assert
      getEvents().toMatchObject([
        /**
         * v2.6.4 Daniel Jiménez
         * TODO: check why it doesn't emit unlink
         */
        { event: 'add', path: file2 },
      ]);
    });

    it('When rename a folder, then do not emit any event', async () => {
      // Arrange
      const syncRootPath = join(TEST_FILES, v4());
      const folder1 = join(syncRootPath, v4());
      const folder2 = join(syncRootPath, v4());
      await setupWatcher(syncRootPath);
      await mkdir(folder1);

      // Act
      await sleep(50);
      await rename(folder1, folder2);
      await sleep(50);

      // Assert
      getEvents().toMatchObject([
        { event: 'unlinkDir', path: folder1 },
        { event: 'addDir', path: folder2 },
      ]);
    });
  });

  describe('[Addon] When move items', () => {
    it('When move a file to a folder, then do not emit any event', async () => {
      // Arrange
      const syncRootPath = join(TEST_FILES, v4());
      const folder = join(syncRootPath, v4());
      const fileName = v4();
      const file = join(syncRootPath, fileName);
      const movedFile = join(folder, fileName);
      await setupWatcher(syncRootPath);
      await mkdir(folder);
      await writeFile(file, 'content');

      // Act
      await sleep(50);
      await rename(file, movedFile);
      await sleep(50);

      // Assert
      getEvents().toMatchObject([
        /**
         * v2.5.5 Daniel Jiménez
         * TODO: check why it doesn't emit unlink
         */
        { event: 'add', path: movedFile },
      ]);
    });

    it('When move a folder to a folder, then emit one unlinkDir and one addDir event', async () => {
      // Arrange
      const syncRootPath = join(TEST_FILES, v4());
      const folder = join(syncRootPath, v4());
      const folderName = v4();
      const folder1 = join(syncRootPath, folderName);
      const folder2 = join(folder, folderName);
      await setupWatcher(syncRootPath);
      await mkdir(folder);
      await mkdir(folder1);

      // Act
      await sleep(50);
      await rename(folder1, folder2);
      await sleep(50);

      // Assert
      getEvents().toMatchObject([
        { event: 'unlinkDir', path: folder1 },
        { event: 'addDir', path: folder2 },
      ]);
    });
  });

  describe('[Addon] When delete items', () => {
    it('When delete a file, then emit one unlink event', async () => {
      // Arrange
      const syncRootPath = join(TEST_FILES, v4());
      const file = join(syncRootPath, v4());
      await setupWatcher(syncRootPath);
      await writeFile(file, 'content');

      // Act
      await sleep(50);
      await rm(file, { force: true });
      await sleep(150);

      // Assert
      getEvents().toMatchObject([{ event: 'unlink', path: file }]);
    });

    it('When delete a folder, then emit one unlinkDir event', async () => {
      // Arrange
      const syncRootPath = join(TEST_FILES, v4());
      const folder = join(syncRootPath, v4());
      await setupWatcher(syncRootPath);
      await mkdir(folder);

      // Act
      await sleep(50);
      await rm(folder, { recursive: true, force: true });
      await sleep(150);

      // Assert
      getEvents().toMatchObject([{ event: 'unlinkDir', path: folder }]);
    });
  });

  describe('[Watcher] When pin items', () => {
    it('When pin a file, then emit one change event', async () => {
      // Arrange
      const syncRootPath = join(TEST_FILES, v4());
      const fileName = v4();
      const file = join(syncRootPath, fileName);
      await setupWatcher(syncRootPath);
      await writeFile(file, 'content');

      // Act
      await sleep(50);
      execSync(`attrib +P ${file}`);
      await sleep(100);

      // Assert
      getEvents().toMatchObject([{ event: 'change', path: file }]);
    });

    it('When pin a folder, then do not emit any event', async () => {
      // Arrange
      const syncRootPath = join(TEST_FILES, v4());
      const folder = join(syncRootPath, v4());
      await setupWatcher(syncRootPath);
      await mkdir(folder);

      // Act
      await sleep(50);
      execSync(`attrib +P ${folder}`);
      await sleep(100);

      // Assert
      getEvents().toStrictEqual([]);
    });
  });

  describe('[Watcher] When unpin items', () => {
    it('When unpin a file, then emit one change event', async () => {
      // Arrange
      const syncRootPath = join(TEST_FILES, v4());
      const fileName = v4();
      const file = join(syncRootPath, fileName);
      await setupWatcher(syncRootPath);
      await writeFile(file, 'content');

      // Act
      await sleep(50);
      execSync(`attrib +P ${file}`);
      await sleep(50);
      execSync(`attrib -P ${file}`);
      await sleep(50);

      // Assert
      getEvents().toMatchObject([
        { event: 'change', path: file },
        { event: 'change', path: file },
      ]);
    });

    it('When unpin a folder, then do not emit any event', async () => {
      // Arrange
      const syncRootPath = join(TEST_FILES, v4());
      const folder = join(syncRootPath, v4());
      await setupWatcher(syncRootPath);
      await mkdir(folder);

      // Act
      await sleep(50);
      execSync(`attrib +P ${folder}`);
      await sleep(50);
      execSync(`attrib -P ${folder}`);
      await sleep(50);

      // Assert
      getEvents().toStrictEqual([]);
    });
  });

  describe('[Watcher] When set items to online only', () => {
    it('When set a file to online only, then emit one change event', async () => {
      // Arrange
      const syncRootPath = join(TEST_FILES, v4());
      const fileName = v4();
      const file = join(syncRootPath, fileName);
      await setupWatcher(syncRootPath);
      await writeFile(file, 'content');

      // Act
      await sleep(50);
      execSync(`attrib -P +U ${file}`);
      await sleep(50);

      // Assert
      getEvents().toMatchObject([{ event: 'change', path: file, stats: { size: 7, blocks: 0 } }]);
    });

    it('When set a folder to online only, then do not emit any event', async () => {
      // Arrange
      const syncRootPath = join(TEST_FILES, v4());
      const folder = join(syncRootPath, v4());
      await setupWatcher(syncRootPath);
      await mkdir(folder);

      // Act
      await sleep(50);
      execSync(`attrib -P +U ${folder}`);
      await sleep(50);

      // Assert
      getEvents().toStrictEqual([]);
    });
  });
});
