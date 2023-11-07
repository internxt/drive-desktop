import { CreateFilePlaceholderOnDeletionFailed } from '../../modules/files/application/CreateFilePlaceholderOnDeletionFailed';
import { FileCreator } from '../../modules/files/application/FileCreator';
import { FileDeleter } from '../../modules/files/application/FileDeleter';
import { FileFinderByContentsId } from '../../modules/files/application/FileFinderByContentsId';
import { FilePathUpdater } from '../../modules/files/application/FilePathUpdater';
import { FilePlaceholderCreatorFromContentsId } from '../../modules/files/application/FilePlaceholderCreatorFromContentsId';
import { RetrieveAllFiles } from '../../modules/files/application/RetrieveAllFiles';
import { SameFileWasMoved } from '../../modules/files/application/SameFileWasMoved';
import { RepositoryPopulator } from '../../modules/files/application/RepositoryPopulator';

export interface FilesContainer {
  fileFinderByContentsId: FileFinderByContentsId;
  fileDeleter: FileDeleter;
  filePathUpdater: FilePathUpdater;
  fileCreator: FileCreator;
  filePlaceholderCreatorFromContentsId: FilePlaceholderCreatorFromContentsId;
  createFilePlaceholderOnDeletionFailed: CreateFilePlaceholderOnDeletionFailed;
  sameFileWasMoved: SameFileWasMoved;
  retrieveAllFiles: RetrieveAllFiles;
  repositoryPopulator: RepositoryPopulator;
}
