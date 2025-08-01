import { File } from '@/context/virtual-drive/files/domain/File';
import { Folder } from '@/context/virtual-drive/folders/domain/Folder';
import { FolderStatus } from '@/context/virtual-drive/folders/domain/FolderStatus';
import { createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { BackupsContext } from '../BackupInfo';
import { fetchItems } from '../fetch-items/fetch-items';
import { FileDto, FolderDto } from '@/infra/drive-server-wip/out/dto';
import { RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { logger } from '@/apps/shared/logger/logger';
import { FileErrorHandler } from '@/context/virtual-drive/files/domain/FileError';
import { fileDecryptName } from '@/context/virtual-drive/files/domain/file-decrypt-name';

export type RemoteTree = {
  files: Record<RelativePath, File>;
  folders: Record<RelativePath, Folder>;
};

type Items = {
  files: Array<FileDto>;
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

    const filesInThisFolder = items.files.filter((file) => file.folderUuid === currentFolder.uuid);
    const foldersInThisFolder = items.folders.filter((folder) => folder.parentUuid === currentFolder.uuid);

    filesInThisFolder.forEach((serverFile) => {
      let relativePath: RelativePath | undefined;

      try {
        const { nameWithExtension } = fileDecryptName({
          plainName: serverFile.plainName,
          encryptedName: serverFile.name,
          parentId: serverFile.folderId,
          extension: serverFile.type,
        });

        relativePath = createRelativePath(currentFolder.path, nameWithExtension);

        const file = File.from({
          ...serverFile,
          path: relativePath,
          contentsId: serverFile.fileId,
          size: Number(serverFile.size),
        });

        tree.files[relativePath] = file;
      } catch (exc) {
        if (relativePath) {
          const name = relativePath;
          FileErrorHandler.handle({
            exc,
            addIssue: ({ code }) => context.addIssue({ error: code, name }),
          });
        }

        logger.error({
          tag: 'BACKUPS',
          msg: 'Error adding file to tree',
          exc,
        });
      }
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
