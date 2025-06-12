import { Folder } from '@/context/virtual-drive/folders/domain/Folder';
import { FileDto, FolderDto } from '@/infra/drive-server-wip/out/dto';
import { BackupsContext } from '../BackupInfo';
import { RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { processFile } from './process-file';
import { processFolder } from './process-folder';
import { File } from '@/context/virtual-drive/files/domain/File';

export type RemoteTree = {
  files: Record<RelativePath, File>;
  folders: Record<RelativePath, Folder>;
};

type TProps = {
  context: BackupsContext;
  rootFolder: Folder;
  items: {
    files: Array<FileDto>;
    folders: Array<FolderDto>;
  };
};

export function traverse({ context, items, rootFolder }: TProps) {
  const tree: RemoteTree = {
    files: {},
    folders: {
      [rootFolder.path]: rootFolder,
    },
  };

  const folders = [rootFolder];

  while (folders.length > 0) {
    if (context.abortController.signal.aborted) break;

    const currentFolder = folders.shift();
    if (!currentFolder) continue;

    const filesInThisFolder = items.files.filter((file) => file.folderUuid === currentFolder.uuid);
    const foldersInThisFolder = items.folders.filter((folder) => folder.parentUuid === currentFolder.uuid);

    filesInThisFolder.forEach((serverFile) => {
      const res = processFile({ serverFile, currentFolder, context });
      if (res) {
        tree.files[res.relativePath] = res.file;
      }
    });

    foldersInThisFolder.forEach((serverFolder) => {
      const res = processFolder({ serverFolder, currentFolder });
      if (res) {
        tree.folders[res.relativePath] = res.folder;
        folders.push(res.folder);
      }
    });
  }

  return tree;
}
