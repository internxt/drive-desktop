import { FilesSearcher } from '../../../../context/virtual-drive/files/application/FilesSearcher';
import { FilesByFolderPathSearcher } from '../../../../context/virtual-drive/files/application/FilesByFolderPathSearcher';
import { FilePathUpdater } from '../../../../context/virtual-drive/files/application/FilePathUpdater';

export interface FilesContainer {
  filesByFolderPathNameLister: FilesByFolderPathSearcher;
  filesSearcher: FilesSearcher;
  filePathUpdater: FilePathUpdater;
}
