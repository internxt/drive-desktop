import { FileUuid, SimpleDriveFile } from '../../../../../apps/main/database/entities/DriveFile';
import { FolderUuid, SimpleDriveFolder } from '../../../../../apps/main/database/entities/DriveFolder';

const ROOT_UUID = 'root' as FolderUuid;
const TIMESTAMP = '2026-01-01T00:00:00.000Z';

export type TraverserTestDataset = {
  rootUuid: FolderUuid;
  files: SimpleDriveFile[];
  folders: SimpleDriveFolder[];
};

export type TreeOptions = {
  folderCount: number;
  fileCount: number;
  maxDepth: number;
  /**
   * Number of files placed in each high-volume folder.
   */
  filesPerHotFolder: number;
  hotFolderCount: number;
};

/**
 * Creates one tree containing the shapes seen in real drives:
 *
 * - a deeply nested folder spine;
 * - folders distributed directly below the root;
 * - high-volume folders containing tens of thousands of files;
 * - remaining files distributed across all folders.
 */
export function createTree(options: TreeOptions): TraverserTestDataset {
  const folders = createFolders(options);
  const files = createFiles(options, folders);

  return { rootUuid: ROOT_UUID, files, folders };
}

function createFolders({ folderCount, maxDepth }: TreeOptions): SimpleDriveFolder[] {
  const folders: SimpleDriveFolder[] = [];
  const deepFolderCount = Math.min(folderCount, maxDepth);

  for (let index = 0; index < deepFolderCount; index += 1) {
    folders.push(createFolder(index, index === 0 ? ROOT_UUID : folderUuid(index - 1), 'Deep'));
  }

  while (folders.length < folderCount) {
    folders.push(createFolder(folders.length, ROOT_UUID, 'Distributed'));
  }

  return folders;
}

function createFiles(
  { fileCount, maxDepth, filesPerHotFolder, hotFolderCount }: TreeOptions,
  folders: SimpleDriveFolder[],
): SimpleDriveFile[] {
  const files: SimpleDriveFile[] = [];
  const deepFolderCount = Math.min(folders.length, maxDepth);
  const folderUuids = folders.map(({ uuid }) => uuid);
  const hotParents = folderUuids.slice(deepFolderCount, deepFolderCount + hotFolderCount);

  for (const parentUuid of hotParents) {
    const filesInFolder = Math.min(filesPerHotFolder, fileCount - files.length);
    for (let index = 0; index < filesInFolder; index += 1) {
      files.push(createFile(files.length, parentUuid));
    }
  }

  const availableParents = folderUuids.length > 0 ? folderUuids : [ROOT_UUID];
  while (files.length < fileCount) {
    const parentIndex = files.length % availableParents.length;
    files.push(createFile(files.length, availableParents[parentIndex]));
  }

  return files;
}

function createFolder(index: number, parentUuid: FolderUuid, shape: string): SimpleDriveFolder {
  return {
    uuid: folderUuid(index),
    parentUuid,
    name: `${shape} Folder ${index}`,
    status: 'EXISTS',
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  };
}

function createFile(index: number, parentUuid: FolderUuid): SimpleDriveFile {
  return {
    uuid: `file-${index}` as FileUuid,
    name: `File ${index}`,
    extension: 'txt',
    parentId: index,
    parentUuid,
    contentsId: `contents-${index}` as SimpleDriveFile['contentsId'],
    size: 1,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    modificationTime: TIMESTAMP,
    status: 'EXISTS',
  };
}

function folderUuid(index: number) {
  return `folder-${index}` as FolderUuid;
}
