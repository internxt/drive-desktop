import { FileFinderByContentsId } from '../../modules/files/application/FileFinderByContentsId';
import { LocalRepositoryRepositoryRefresher } from '../../modules/files/application/LocalRepositoryRepositoryRefresher';

export interface FilesContainer {
  fileFinderByContentsId: FileFinderByContentsId;
  localRepositoryRefresher: LocalRepositoryRepositoryRefresher;
}
