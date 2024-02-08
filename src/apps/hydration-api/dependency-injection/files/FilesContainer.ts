import { FilesSearcher } from '../../../../context/virtual-drive/files/application/FilesSearcher';
import { FilesByFolderPathSearcher } from '../../../../context/virtual-drive/files/application/FilesByFolderPathSearcher';

export interface FilesContainer {
  filesByFolderPathNameLister: FilesByFolderPathSearcher;
  filesSearcher: FilesSearcher;
}
