import { ClearOfflineFileOnFileCreated } from '../../../../../context/offline-drive/files/application/ClearOfflineFileOnFileCreated';
import { OfflineFileCreator } from '../../../../../context/offline-drive/files/application/OfflineFileCreator';
import { OfflineFileFinder } from '../../../../../context/offline-drive/files/application/OfflineFileFinder';
import { OfflineFilesByParentPathLister } from '../../../../../context/offline-drive/files/application/OfflineFileListerByParentFolder';
import { OfflineFileSearcher } from '../../../../../context/offline-drive/files/application/OfflineFileSearcher';
import { OfflineFileSizeIncreaser } from '../../../../../context/offline-drive/files/application/OfflineFileSizeIncreaser';
import { TemporalOfflineDeleter } from '../../../../../context/offline-drive/files/application/TemporalOfflineDeleter';

export interface OfflineFilesContainer {
  offlineFileCreator: OfflineFileCreator;
  offlineFileSearcher: OfflineFileSearcher;
  offlineFileFinder: OfflineFileFinder;
  offlineFileSizeIncreaser: OfflineFileSizeIncreaser;
  clearOfflineFileOnFileCreated: ClearOfflineFileOnFileCreated;
  offlineFilesByParentPathLister: OfflineFilesByParentPathLister;
  temporalOfflineDeleter: TemporalOfflineDeleter;
}
