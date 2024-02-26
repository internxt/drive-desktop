import { FilesSearcher } from '../../../../../context/virtual-drive/files/application/FilesSearcher';
import { FilesByFolderPathSearcher } from '../../../../../context/virtual-drive/files/application/FilesByFolderPathSearcher';
import { FilePathUpdater } from '../../../../../context/virtual-drive/files/application/FilePathUpdater';
import { FileCreator } from '../../../../../context/virtual-drive/files/application/FileCreator';
import { SameFileWasMoved } from '../../../../../context/virtual-drive/files/application/SameFileWasMoved';
import { FileDeleter } from '../../../../../context/virtual-drive/files/application/FileDeleter';
import { CreateFileOnOfflineFileUploaded } from '../../../../../context/virtual-drive/files/application/CreateFileOnOfflineFileUplodaded';
import { FileRepositoryInitializer } from '../../../../../context/virtual-drive/files/application/FileRepositoryInitializer';
import { SyncFileMessenger } from '../../../../../context/virtual-drive/files/domain/SyncFileMessenger';

export interface FilesContainer {
  filesByFolderPathNameLister: FilesByFolderPathSearcher;
  filesSearcher: FilesSearcher;
  filePathUpdater: FilePathUpdater;
  fileCreator: FileCreator;
  fileDeleter: FileDeleter;
  sameFileWasMoved: SameFileWasMoved;
  repositoryPopulator: FileRepositoryInitializer;
  syncFileMessenger: SyncFileMessenger;
  // event handler
  createFileOnOfflineFileUploaded: CreateFileOnOfflineFileUploaded;
}
