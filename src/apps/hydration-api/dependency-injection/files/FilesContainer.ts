import { FilesSearcher } from '../../../../context/virtual-drive/files/application/FilesSearcher';
import { FilesByFolderPathSearcher } from '../../../../context/virtual-drive/files/application/FilesByFolderPathSearcher';
import { RetrieveAllFiles } from '../../../../context/virtual-drive/files/application/RetrieveAllFiles';

export interface FilesContainer {
  filesByFolderPathNameLister: FilesByFolderPathSearcher;
  filesSearcher: FilesSearcher;
  retrieveAllFiles: RetrieveAllFiles;
}
