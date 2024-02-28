import { FirstsFileSearcher } from '../../../../context/virtual-drive/files/application/FirstsFileSearcher';
import { FilesByFolderPathSearcher } from '../../../../context/virtual-drive/files/application/FilesByFolderPathSearcher';
import { RetrieveAllFiles } from '../../../../context/virtual-drive/files/application/RetrieveAllFiles';
import { FilesSearcherByPartialMatch } from '../../../../context/virtual-drive/files/application/search-all/FilesSearcherByPartialMatch';

export interface FilesContainer {
  filesByFolderPathNameLister: FilesByFolderPathSearcher;
  filesSearcher: FirstsFileSearcher;
  retrieveAllFiles: RetrieveAllFiles;
  filesSearcherByPartialMatch: FilesSearcherByPartialMatch;
}
