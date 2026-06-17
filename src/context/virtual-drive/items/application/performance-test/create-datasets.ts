import { FileUuid, SimpleDriveFile } from '../../../../../apps/main/database/entities/DriveFile';
import { FolderUuid, SimpleDriveFolder } from '../../../../../apps/main/database/entities/DriveFolder';

export type TraverserTestDataset = {
  rootUuid: FolderUuid;
  files: SimpleDriveFile[];
  folders: SimpleDriveFolder[];
};

export function createDataset({
  folderCount,
  fileCount,
  mode,
}: {
  folderCount: number;
  fileCount: number;
  mode: 'broad' | 'deep';
}): TraverserTestDataset {
  const now = new Date().toISOString();
  const rootUuid = 'root' as FolderUuid;

  const folders: SimpleDriveFolder[] = Array.from({ length: folderCount }, (_, index) => ({
    uuid: `folder-${index}` as FolderUuid,
    parentUuid: generateFolderParentUuid(mode, index, rootUuid),
    name: `Folder ${index}`,
    status: 'EXISTS',
    createdAt: now,
    updatedAt: now,
  }));

  const files: SimpleDriveFile[] = Array.from({ length: fileCount }, (_, index) => ({
    uuid: `file-${index}` as FileUuid,
    name: `File ${index}`,
    extension: 'txt',
    parentId: index % Math.max(folderCount, 1),
    parentUuid: `folder-${index % Math.max(folderCount, 1)}` as FolderUuid,
    contentsId: `contents-${index}` as SimpleDriveFile['contentsId'],
    size: 1,
    createdAt: now,
    updatedAt: now,
    modificationTime: now,
    status: 'EXISTS',
  }));

  return { rootUuid, files, folders };
}

function generateFolderParentUuid(mode: 'broad' | 'deep', index: number, rootUuid: FolderUuid) {
  if (index === 0) return rootUuid;

  if (mode === 'broad') {
    return `folder-${Math.floor((index - 1) / 10)}` as FolderUuid;
  }

  return `folder-${index - 1}` as FolderUuid;
}
