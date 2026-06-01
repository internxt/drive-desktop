import { FolderTree } from '@internxt/sdk/dist/drive/storage/types';
import { BackupFolderTreeSnapshot } from './types/BackupFolderTreeSnapshot';

type NodeSnapshot = {
  folderId: number;
  folderName: string;
  fileNames: Record<number, string>;
  size: number;
};

type SnapshotProps = {
  node: FolderTree;
  decryptFileName: (name: string, folderId: number) => string;
};

function snapshotNode({ node, decryptFileName }: SnapshotProps): NodeSnapshot {
  const fileNames: Record<number, string> = {};
  let size = 0;

  for (const file of node.files) {
    fileNames[file.id] = decryptFileName(file.name, file.folderId);
    size += Number(file.size);
  }

  return { folderId: node.id, folderName: node.plainName, fileNames, size };
}

type Props = {
  tree: FolderTree;
  decryptFileName: (name: string, folderId: number) => string;
};

export function buildBackupFolderTreeSnapshot({ tree, decryptFileName }: Props): BackupFolderTreeSnapshot {
  let size = 0;
  const folderDecryptedNames: Record<number, string> = {};
  const fileDecryptedNames: Record<number, string> = {};

  const stack = [tree];

  while (stack.length > 0) {
    const currentNode = stack.pop()!;
    const { folderId, folderName, fileNames, size: nodeSize } = snapshotNode({ node: currentNode, decryptFileName });

    folderDecryptedNames[folderId] = folderName;
    Object.assign(fileDecryptedNames, fileNames);
    size += nodeSize;

    stack.push(...currentNode.children);
  }

  return { tree, folderDecryptedNames, fileDecryptedNames, size };
}
