import { VirtualDrive } from '@/node-win/virtual-drive';
import { TEST_FILES } from 'tests/vitest/mocks.helper.test';
import { v4 } from 'uuid';
import { calls, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Addon, toWin32Path } from '@/node-win/addon-wrapper';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import * as deleteCallback from './delete-callback';
import { sleep } from '@/apps/main/util';
import trash from 'trash';

describe('delete-callback', async () => {
  const deleteCallbackMock = partialSpyOn(deleteCallback, 'deleteCallback');

  const providerId = v4();
  const testPath = join(TEST_FILES, v4());
  const rootPath = join(testPath, v4());
  const creationTime = Date.now();
  const lastWriteTime = Date.now();

  await VirtualDrive.createSyncRootFolder({ rootPath });
  await Addon.registerSyncRoot({ rootPath, providerId, providerName: 'Internxt Drive' });
  const connectionKey = Addon.connectSyncRoot({ rootPath });

  afterAll(async () => {
    await Addon.disconnectSyncRoot({ connectionKey });
    await Addon.unregisterSyncRoot({ providerId });
  });

  it('should ignore if file is not a placeholder', async () => {
    // Given
    const path = join(rootPath, v4());
    await writeFile(path, 'content');
    // When
    await sleep(50);
    await trash(path);
    await sleep(50);
    // Then
    calls(deleteCallbackMock).toHaveLength(0);
  });

  it('should ignore if folder is not a placeholder', async () => {
    // Given
    const path = join(rootPath, v4());
    await mkdir(path);
    // When
    await sleep(50);
    await trash(path);
    await sleep(50);
    // Then
    calls(deleteCallbackMock).toHaveLength(0);
  });

  it('should ignore when moving a file inside a folder', async () => {
    // Given
    const parentPath = join(rootPath, v4());
    const path1 = join(rootPath, v4());
    const path2 = join(parentPath, v4());
    await mkdir(parentPath);
    await writeFile(path1, 'content');
    await Addon.convertToPlaceholder({ path: path1, placeholderId: `FILE:${v4()}` });
    // When
    await sleep(50);
    await rename(path1, path2);
    await sleep(50);
    // Then
    calls(deleteCallbackMock).toHaveLength(0);
  });

  it('should ignore when moving a file outside the cloud provider', async () => {
    // Given
    const parentPath = join(rootPath, v4());
    const path1 = join(rootPath, v4());
    const path2 = join(testPath, v4());
    await mkdir(parentPath);
    await writeFile(path1, 'content');
    await Addon.convertToPlaceholder({ path: path1, placeholderId: `FILE:${v4()}` });
    // When
    await sleep(50);
    await rename(path1, path2);
    await sleep(50);
    // Then
    calls(deleteCallbackMock).toHaveLength(0);
  });

  it('should call callback when deleting a file', async () => {
    // Given
    const path = join(rootPath, v4());
    await writeFile(path, 'content');
    await Addon.convertToPlaceholder({ path, placeholderId: `FILE:${v4()}` });
    // When
    await sleep(50);
    await trash(path);
    await sleep(50);
    // Then
    calls(deleteCallbackMock).toStrictEqual([
      [connectionKey, toWin32Path(path), false],
      [connectionKey, toWin32Path(path), false],
    ]);
  });

  it('should call callback when deleting a folder', async () => {
    // Given
    const path = join(rootPath, v4());
    await Addon.createFolderPlaceholder({ path, placeholderId: `FOLDER:${v4()}`, creationTime, lastWriteTime });
    // When
    await sleep(50);
    await trash(path);
    await sleep(50);
    // Then
    calls(deleteCallbackMock).toStrictEqual([
      [connectionKey, toWin32Path(path), true],
      [connectionKey, toWin32Path(path), true],
    ]);
  });

  it('should call callback when deleting a folder with items', async () => {
    // Given
    const parentPath = join(rootPath, v4());
    const filePath = join(parentPath, v4());
    const folderPath = join(parentPath, v4());

    await Addon.createFolderPlaceholder({ path: parentPath, placeholderId: `FOLDER:${v4()}`, creationTime, lastWriteTime });
    await Addon.createFolderPlaceholder({ path: folderPath, placeholderId: `FOLDER:${v4()}`, creationTime, lastWriteTime });
    await writeFile(filePath, 'content');
    await Addon.convertToPlaceholder({ path: filePath, placeholderId: `FILE:${v4()}` });
    // When
    await sleep(50);
    await trash(parentPath);
    await sleep(50);
    // Then
    calls(deleteCallbackMock).toStrictEqual([
      [connectionKey, toWin32Path(filePath), false],
      [connectionKey, toWin32Path(filePath), false],
      [connectionKey, toWin32Path(folderPath), true],
      [connectionKey, toWin32Path(folderPath), true],
      [connectionKey, toWin32Path(parentPath), true],
    ]);
  });
});
