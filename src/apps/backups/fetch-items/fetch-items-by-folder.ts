import { fetchFilesByFolder } from './fetch-files-by-folder';
import { fetchFoldersByFolder } from './fetch-folders-by-folder';
import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';

type TProps = {
  folderUuid: string;
  allFolders: SimpleDriveFolder[];
  allFiles: SimpleDriveFile[];
  skipFiles: boolean;
  abortSignal: AbortSignal;
};

export async function fetchItemsByFolder({ folderUuid, allFolders, allFiles, skipFiles, abortSignal }: TProps): Promise<void> {
  const filesPromise = skipFiles ? Promise.resolve() : fetchFilesByFolder({ folderUuid, allFiles, abortSignal });
  const foldersPromise = fetchFoldersByFolder({ folderUuid, allFolders, abortSignal });

  const [, { newFolders }] = await Promise.all([filesPromise, foldersPromise]);

  await Promise.all(
    newFolders.map((folder) => {
      return fetchItemsByFolder({
        folderUuid: folder.uuid,
        allFolders,
        allFiles,
        skipFiles,
        abortSignal,
      });
    }),
  );
}
