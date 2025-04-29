import { logger } from '@/apps/shared/logger/logger';
import { Folder } from '@/context/virtual-drive/folders/domain/Folder';
import { posix } from 'path';

export class FolderStore {
  private static store: Record<
    string,
    {
      rootId: number | null;
      rootUuid: string;
      folders: Record<
        number,
        {
          parentId: number;
          parentUuid: string | null;
          plainName: string;
        }
      >;
    }
  > = {};

  static clear() {
    FolderStore.store = {};
  }

  static addWorkspace({ workspaceId, rootId, rootUuid }: { workspaceId: string; rootId: number | null; rootUuid: string }) {
    FolderStore.store[workspaceId] = { rootId, rootUuid, folders: {} };
    logger.debug({
      msg: 'Add workspace to the folder store',
      workspaceId,
      rootId,
      rootUuid,
    });
  }

  static addFolder({
    workspaceId,
    folderId,
    parentId,
    parentUuid,
    name,
    plainName,
  }: {
    workspaceId: string;
    folderId: number;
    parentId: number;
    parentUuid: string | null;
    name: string;
    plainName?: string;
  }) {
    const decryptedName = Folder.decryptName({ plainName, name, parentId });
    FolderStore.store[workspaceId].folders[folderId] = { parentId, parentUuid, plainName: decryptedName };
  }

  static getFolderPath({
    workspaceId,
    parentId,
    parentUuid,
    plainName,
  }: {
    workspaceId: string;
    parentId: number;
    parentUuid: string | null;
    plainName: string;
  }) {
    const paths: string[] = [];
    const workspace = FolderStore.store[workspaceId];

    let folder = workspace.folders[parentId];

    while (parentUuid !== workspace.rootUuid && parentId !== workspace.rootId) {
      folder = workspace.folders[parentId];

      if (!folder) {
        throw new Error(`Folder not found for workspaceId "${workspaceId}" and parentId "${parentId}"`);
      }

      paths.unshift(folder.plainName);
      parentId = folder.parentId;
      parentUuid = folder.parentUuid;
    }

    const relativePath = posix.join(...paths, plainName);

    return {
      relativePath: posix.sep + relativePath,
    };
  }
}
