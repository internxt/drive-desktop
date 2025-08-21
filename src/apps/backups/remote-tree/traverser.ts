import { Folder } from '@/context/virtual-drive/folders/domain/Folder';
import { FolderStatus } from '@/context/virtual-drive/folders/domain/FolderStatus';
import { AbsolutePath, createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { BackupsContext } from '../BackupInfo';
import { fetchItems } from '../fetch-items/fetch-items';
import { FolderDto } from '@/infra/drive-server-wip/out/dto';
import { RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { logger } from '@/apps/shared/logger/logger';
import { ExtendedDriveFile, SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { join } from 'path';

export type RemoteTree = {
  files: Record<RelativePath, ExtendedDriveFile>;
  folders: Record<RelativePath, Folder>;
};

type Items = {
  files: Array<SimpleDriveFile>;
  folders: Array<FolderDto>;
};

export class Traverser {
  private createRootFolder({ id, uuid }: { id: number; uuid: string }): Folder {
    return Folder.from({
      id,
      uuid,
      parentId: null,
      parentUuid: null,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      path: '/',
      status: FolderStatus.Exists.value,
    });
  }

  private traverse(context: BackupsContext, tree: RemoteTree, items: Items, currentFolder: Folder) {
    if (!items) return;
    if (context.abortController.signal.aborted) return;

    const filesInThisFolder = items.files.filter((file) => file.parentUuid === currentFolder.uuid);
    const foldersInThisFolder = items.folders.filter((folder) => folder.parentUuid === currentFolder.uuid);

    filesInThisFolder.forEach((file) => {
      const path = createRelativePath(currentFolder.path, file.nameWithExtension);
      const absolutePath = join(context.pathname, path) as AbsolutePath;
      const extendedFile = { ...file, path, absolutePath };

      tree.files[path] = extendedFile;
    });

    foldersInThisFolder.forEach((serverFolder) => {
      try {
        const decryptedName = Folder.decryptName({
          plainName: serverFolder.plainName,
          name: serverFolder.name,
          parentId: serverFolder.parentId,
        });

        const relativePath = createRelativePath(currentFolder.path, decryptedName);

        const folder = Folder.from({
          ...serverFolder,
          parentUuid: serverFolder.parentUuid || null,
          path: relativePath,
        });

        tree.folders[relativePath] = folder;

        this.traverse(context, tree, items, folder);
      } catch (exc) {
        /**
         * v2.5.3 Daniel Jiménez
         * TODO: Add issue to backups
         */
        logger.error({
          tag: 'BACKUPS',
          msg: 'Error adding folder to tree',
          exc,
        });
      }
    });
  }

  async run({ context }: { context: BackupsContext }): Promise<RemoteTree> {
    const items = await fetchItems({
      folderUuid: context.folderUuid,
      skipFiles: false,
      abortSignal: context.abortController.signal,
    });

    const rootFolder = this.createRootFolder({ id: context.folderId, uuid: context.folderUuid });

    const tree: RemoteTree = {
      files: {},
      folders: {
        [rootFolder.path]: rootFolder,
      },
    };

    this.traverse(context, tree, items, rootFolder);

    return tree;
  }
}
