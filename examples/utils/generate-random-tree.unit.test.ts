import { generateRandomFilesAndFolders } from 'examples/utils/generate-random-file-tree';

import VirtualDrive from '@/node-win/virtual-drive';

class MockVirtualDrive implements Partial<VirtualDrive> {
  private files: Record<string, any> = {};
  private folders: Record<string, any> = {};

  createFileByPath({
    relativePath,
    itemId,
    size = 0,
    creationTime = Date.now(),
    lastWriteTime = Date.now(),
  }: {
    relativePath: string;
    itemId: string;
    size?: number;
    creationTime?: number;
    lastWriteTime?: number;
  }): void {
    this.files[relativePath] = { itemId, size, creationTime, lastWriteTime };
  }

  createFolderByPath({
    relativePath,
    itemId,
    size = 0,
    creationTime = Date.now(),
    lastWriteTime = Date.now(),
  }: {
    relativePath: string;
    itemId: string;
    size?: number;
    creationTime?: number;
    lastWriteTime?: number;
  }): void {
    this.folders[relativePath] = { itemId, size, creationTime, lastWriteTime };
  }

  getFiles(): Record<string, any> {
    return this.files;
  }
}

describe('When call generateRandomFilesAndFolders', () => {
  it('Then it generates the correct structure of files and folders with sizes following a normal distribution', async () => {
    // Arrange
    const mockDrive = new MockVirtualDrive();
    const meanSizeMB = 1;
    const stdDevMB = 0.5;
    const options = {
      rootPath: '/root',
      depth: 2,
      filesPerFolder: 100,
      foldersPerLevel: 2,
      meanSize: meanSizeMB,
      stdDev: stdDevMB,
      timeOffset: 1000,
    };

    // Act
    await generateRandomFilesAndFolders(mockDrive as unknown as VirtualDrive, options);

    // Assert
    const files = mockDrive.getFiles();
    expect(Object.keys(files).length).toBeGreaterThan(0);

    const sizes = Object.values(files).map((file) => file.size / (1024 * 1024));

    const lowerBound = meanSizeMB - 3 * stdDevMB;
    const upperBound = meanSizeMB + 3 * stdDevMB;

    const withinRange = sizes.filter((size) => size >= lowerBound && size <= upperBound);
    const percentageWithinRange = (withinRange.length / sizes.length) * 100;

    expect(percentageWithinRange).toBeGreaterThanOrEqual(99);
  });
});
