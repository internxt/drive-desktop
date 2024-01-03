import { ClearOfflineFileOnFileCreated } from '../../../../../context/offline-drive/files/application/ClearOfflineFileOnFileCreated';
import { OfflineFileCreator } from '../../../../../context/offline-drive/files/application/OfflineFileCreator';
import { OfflineFileFinder } from '../../../../../context/offline-drive/files/application/OfflineFileFinder';
import { OfflineFileSearcher } from '../../../../../context/offline-drive/files/application/OfflineFileSearcher';
import { OfflineFileSizeIncreaser } from '../../../../../context/offline-drive/files/application/OfflineFileSizeIncreaser';

export interface OfflineFilesContainer {
  offlineFileCreator: OfflineFileCreator;
  offlineFileSearcher: OfflineFileSearcher;
  offlineFileFinder: OfflineFileFinder;
  offlineFileSizeIncreaser: OfflineFileSizeIncreaser;
  clearOfflineFileOnFileCreated: ClearOfflineFileOnFileCreated;
}
