import { CreateFilePlaceholderOnDeletionFailed } from '../../../../context/virtual-drive/files/application/CreateFilePlaceholderOnDeletionFailed';
import { FileCreator } from '../../../../context/virtual-drive/files/application/FileCreator';
import { FileDeleter } from '../../../../context/virtual-drive/files/application/FileDeleter';
import { FileFinderByContentsId } from '../../../../context/virtual-drive/files/application/FileFinderByContentsId';
import { FilePathUpdater } from '../../../../context/virtual-drive/files/application/FilePathUpdater';
import { FilePlaceholderCreatorFromContentsId } from '../../../../context/virtual-drive/files/application/FilePlaceholderCreatorFromContentsId';
import { FilesPlaceholderUpdater } from '../../../../context/virtual-drive/files/application/FilesPlaceholderUpdater';
import { FilesPlaceholderCreator } from '../../../../context/virtual-drive/files/application/FilesPlaceholdersCreator';
import { RepositoryPopulator } from '../../../../context/virtual-drive/files/application/RepositoryPopulator';
import { RetrieveAllFiles } from '../../../../context/virtual-drive/files/application/RetrieveAllFiles';
import { SameFileWasMoved } from '../../../../context/virtual-drive/files/application/SameFileWasMoved';
import { FileFolderContainerDetector } from '../../../../context/virtual-drive/files/application/FileFolderContainerDetector';
import { FileSyncronizer } from '../../../../context/virtual-drive/files/application/FileSyncronizer';
import { FilePlaceholderConverter } from '../../../../context/virtual-drive/files/application/FIlePlaceholderConverter';
import { FileSyncStatusUpdater } from '../../../../context/virtual-drive/files/application/FileSyncStatusUpdater';
import { FileCheckerStatusInRoot } from '../../../../context/virtual-drive/files/application/FileCheckerStatusInRoot';
import { FilesPlaceholderDeleter } from '../../../../context/virtual-drive/files/application/FilesPlaceholderDeleter';
import { FileIdentityUpdater } from '../../../../context/virtual-drive/files/application/FileIndetityUpdater';

export interface FilesContainer {
  fileFinderByContentsId: FileFinderByContentsId;
  fileDeleter: FileDeleter;
  fileFolderContainerDetector: FileFolderContainerDetector;
  filePathUpdater: FilePathUpdater;
  fileCreator: FileCreator;
  fileSyncronizer: FileSyncronizer;
  filePlaceholderCreatorFromContentsId: FilePlaceholderCreatorFromContentsId;
  createFilePlaceholderOnDeletionFailed: CreateFilePlaceholderOnDeletionFailed;
  sameFileWasMoved: SameFileWasMoved;
  retrieveAllFiles: RetrieveAllFiles;
  repositoryPopulator: RepositoryPopulator;
  filesPlaceholderCreator: FilesPlaceholderCreator;
  filesPlaceholderUpdater: FilesPlaceholderUpdater;
  filesPlaceholderDeleter?: FilesPlaceholderDeleter;
  filePlaceholderConverter: FilePlaceholderConverter;
  fileSyncStatusUpdater: FileSyncStatusUpdater;
  filesCheckerStatusInRoot: FileCheckerStatusInRoot;
  fileIdentityUpdater: FileIdentityUpdater;
}
