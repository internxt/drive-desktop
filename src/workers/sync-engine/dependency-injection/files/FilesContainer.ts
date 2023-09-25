import { FileByPartialSearcher } from '../../modules/files/application/FileByPartialSearcher';
import { FileDeleter } from '../../modules/files/application/FileDeleter';
import { FileFinderByContentsId } from '../../modules/files/application/FileFinderByContentsId';
import { LocalRepositoryRepositoryRefresher } from '../../modules/files/application/LocalRepositoryRepositoryRefresher';

export interface FilesContainer {
  fileFinderByContentsId: FileFinderByContentsId;
  localRepositoryRefresher: LocalRepositoryRepositoryRefresher;
  fileDeleter: FileDeleter;
  fileByPartialSearcher: FileByPartialSearcher;
}
