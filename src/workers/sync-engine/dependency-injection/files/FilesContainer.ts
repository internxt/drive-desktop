import { CreateFilePlaceholderOnDeletionFailed } from '../../modules/files/application/CreateFilePlaceholderOnDeletionFailed';
import { FileByPartialSearcher } from '../../modules/files/application/FileByPartialSearcher';
import { FileCreator } from '../../modules/files/application/FileCreator';
import { FileDeleter } from '../../modules/files/application/FileDeleter';
import { FileFinderByContentsId } from '../../modules/files/application/FileFinderByContentsId';
import { FilePathUpdater } from '../../modules/files/application/FilePathUpdater';
import { FilePlaceholderCreatorFromContentsId } from '../../modules/files/application/FilePlaceholderCreatorFromContentsId';
import { FileSearcher } from '../../modules/files/application/FileSearcher';
import { LocalRepositoryRepositoryRefresher } from '../../modules/files/application/LocalRepositoryRepositoryRefresher';
import { SameFileWasMoved } from '../../modules/files/application/SameFileWasMoved';

export interface FilesContainer {
  fileFinderByContentsId: FileFinderByContentsId;
  localRepositoryRefresher: LocalRepositoryRepositoryRefresher;
  fileDeleter: FileDeleter;
  fileByPartialSearcher: FileByPartialSearcher;
  filePathUpdater: FilePathUpdater;
  fileCreator: FileCreator;
  fileSearcher: FileSearcher;
  filePlaceholderCreatorFromContentsId: FilePlaceholderCreatorFromContentsId;
  createFilePlaceholderOnDeletionFailed: CreateFilePlaceholderOnDeletionFailed;
  sameFileWasMoved: SameFileWasMoved;
}
