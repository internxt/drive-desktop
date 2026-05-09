import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { TEST_FILES } from '@/tests/vitest/mocks.helper.test';
import { Addon } from '../addon-wrapper';
import { VirtualDrive } from '../virtual-drive';

describe('get-first-non-placeholder', () => {
  let connectionKey: bigint;

  const providerId = randomUUID();
  const testPath = join(TEST_FILES, randomUUID());
  const rootPath = join(testPath, randomUUID());
  const parentPath = rootPath;

  const item = { size: 10, creationTime: Date.now(), lastWriteTime: Date.now() };

  beforeAll(async () => {
    await VirtualDrive.createSyncRootFolder({ rootPath });
    await Addon.registerSyncRoot({ rootPath, providerId, providerName: 'Internxt Drive' });
    // For some reason we need to connect the sync root to make `getFirstNonPlaceholder` work
    connectionKey = Addon.connectSyncRoot({ rootPath });
  });

  afterAll(async () => {
    await Addon.disconnectSyncRoot({ connectionKey });
    await Addon.unregisterSyncRoot({ providerId });
  });

  it('should return undefined if all items are placeholders or return the path of the first non placeholder', async () => {
    // When
    let nonPlaceholderItem = await Addon.getFirstNonPlaceholder({ parentPath });
    // Then
    expect(nonPlaceholderItem).toBeUndefined();
    // Given
    await Addon.createFolderPlaceholder({ path: join(parentPath, 'folder1'), placeholderId: 'FOLDER:folder1', ...item });
    await Addon.createFolderPlaceholder({ path: join(parentPath, 'folder2'), placeholderId: 'FOLDER:folder2', ...item });
    await Addon.createFolderPlaceholder({ path: join(parentPath, 'folder2', 'folder3'), placeholderId: 'FOLDER:folder3', ...item });
    await writeFile(join(parentPath, 'file1.txt'), 'content');
    await Addon.convertToPlaceholder({ path: join(parentPath, 'file1.txt'), placeholderId: 'FILE:file1' });
    await Addon.createFilePlaceholder({ path: join(parentPath, 'folder1', 'file2.txt'), placeholderId: 'FILE:file2', ...item });
    await Addon.createFilePlaceholder({ path: join(parentPath, 'folder2', 'file3.txt'), placeholderId: 'FILE:file3', ...item });
    await Addon.createFilePlaceholder({ path: join(parentPath, 'folder2', 'folder3', 'file4.txt'), placeholderId: 'FILE:file3', ...item });
    // When
    nonPlaceholderItem = await Addon.getFirstNonPlaceholder({ parentPath });
    // Then
    expect(nonPlaceholderItem).toBeUndefined();
    // Given
    await writeFile(join(parentPath, 'folder2', 'file5.txt'), 'content');
    // When
    nonPlaceholderItem = await Addon.getFirstNonPlaceholder({ parentPath });
    // Then
    expect(nonPlaceholderItem).toBe('folder2/file5.txt');
  });
});
