import { v4 as uuidv4 } from 'uuid';

import VirtualDrive from '@/node-win/virtual-drive';

interface GenerateOptions {
  rootPath: string;
  depth: number;
  filesPerFolder: number;
  foldersPerLevel: number;
  meanSize: number;
  stdDev: number;
  timeOffset?: number;
}

function generateRandomId(): string {
  return uuidv4();
}

function randomNormal(mean: number, stdDev: number): number {
  const u1 = Math.random() || 1e-10;
  const u2 = Math.random() || 1e-10;
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

  const value = z0 * stdDev + mean;

  return Math.max(value, 0);
}

function getRandomExtension(): string {
  const extensions = ['.txt', '.pdf', '.rar', '.jpg', '.docx', '.xlsx', '.mp4', '.mkv', '.json', ''];
  const index = Math.floor(Math.random() * extensions.length);
  return extensions[index];
}

async function createStructureRecursively(
  drive: VirtualDrive,
  currentPath: string,
  level: number,
  options: GenerateOptions,
  result: Record<string, string>,
): Promise<void> {
  if (level < 0) return;

  const { filesPerFolder, foldersPerLevel, meanSize, stdDev, timeOffset } = options;

  for (let i = 0; i < filesPerFolder; i++) {
    const fileName = `file_${generateRandomId()}${getRandomExtension()}`;
    const fullPath = `${currentPath}/${fileName}`;

    const fileSize = Math.floor(randomNormal(meanSize, stdDev));

    const fileId = generateRandomId();
    const createdAt = Date.now() - (timeOffset || 0);
    const updatedAt = Date.now() - (timeOffset || 0) + 2000;

    drive.createFileByPath({
      relativePath: fullPath,
      itemId: fileId,
      size: fileSize,
      creationTime: createdAt,
      lastWriteTime: updatedAt,
    });

    result[fileId] = fullPath;
  }

  for (let j = 0; j < foldersPerLevel; j++) {
    const folderName = `folder_${generateRandomId()}`;
    const newFolderPath = `${currentPath}/${folderName}`;

    const folderId = generateRandomId();
    const createdAt = Date.now() - (timeOffset || 0) - 10000; // Ejemplo
    const updatedAt = Date.now() - (timeOffset || 0);

    drive.createFolderByPath({
      relativePath: newFolderPath,
      itemId: folderId,
      creationTime: createdAt,
      lastWriteTime: updatedAt,
    });

    await createStructureRecursively(drive, newFolderPath, level - 1, options, result);
  }
}

async function generateRandomFilesAndFolders(drive: VirtualDrive, options: GenerateOptions): Promise<Record<string, string>> {
  const { rootPath } = options;

  const result: Record<string, string> = {};

  await createStructureRecursively(drive, rootPath, options.depth, options, result);

  return result;
}

export { generateRandomFilesAndFolders };
export type { GenerateOptions };
