import { FileDto, FolderDto } from '@/infra/drive-server-wip/out/dto';
import { fetchFilesByFolder } from './fetch-files-by-folder';
import { fetchFoldersByFolder } from './fetch-folders-by-folder';

type TProps = {
  folderUuid: string;
  allFolders: FolderDto[];
  allFiles: FileDto[];
  skipFiles: boolean;
};

export async function fetchItemsByFolder({ folderUuid, allFolders, allFiles, skipFiles }: TProps): Promise<void> {
  const filesPromise = skipFiles ? Promise.resolve() : fetchFilesByFolder({ folderUuid, allFiles });
  const foldersPromise = fetchFoldersByFolder({ folderUuid, allFolders });

  const [, { newFolders }] = await Promise.all([filesPromise, foldersPromise]);

  await Promise.all(
    newFolders.map((folder) => {
      return fetchItemsByFolder({
        folderUuid: folder.uuid,
        allFolders,
        allFiles,
        skipFiles,
      });
    }),
  );
}
