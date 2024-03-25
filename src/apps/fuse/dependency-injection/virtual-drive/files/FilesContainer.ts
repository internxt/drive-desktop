import { FirstsFileSearcher } from '../../../../../context/virtual-drive/files/application/FirstsFileSearcher';
import { FilesByFolderPathSearcher } from '../../../../../context/virtual-drive/files/application/FilesByFolderPathSearcher';
import { FilePathUpdater } from '../../../../../context/virtual-drive/files/application/FilePathUpdater';
import { FileCreator } from '../../../../../context/virtual-drive/files/application/FileCreator';
import { SameFileWasMoved } from '../../../../../context/virtual-drive/files/application/SameFileWasMoved';
import { FileDeleter } from '../../../../../context/virtual-drive/files/application/FileDeleter';
import { CreateFileOnOfflineFileUploaded } from '../../../../../context/virtual-drive/files/application/event-subsribers/CreateFileOnOfflineFileUplodaded';
import { FileRepositoryInitializer } from '../../../../../context/virtual-drive/files/application/FileRepositoryInitializer';
import { SyncFileMessenger } from '../../../../../context/virtual-drive/files/domain/SyncFileMessenger';
import { FilesSearcherByPartialMatch } from '../../../../../context/virtual-drive/files/application/search-all/FilesSearcherByPartialMatch';

export interface FilesContainer {
  filesByFolderPathNameLister: FilesByFolderPathSearcher;
  filesSearcher: FirstsFileSearcher;
  filePathUpdater: FilePathUpdater;
  fileCreator: FileCreator;
  fileDeleter: FileDeleter;
  sameFileWasMoved: SameFileWasMoved;
  repositoryPopulator: FileRepositoryInitializer;
  syncFileMessenger: SyncFileMessenger;
  filesSearcherByPartialMatch: FilesSearcherByPartialMatch;
  // event handler
  createFileOnOfflineFileUploaded: CreateFileOnOfflineFileUploaded;
}
