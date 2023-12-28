import { OfflineFileFinder } from '../../../../../context/offline-drive/files/application/OfflineFileFinder';
import { OfflineFileSearcher } from '../../../../../context/offline-drive/files/application/OfflineFileSearcher';
import { OfflineFileSizeIncreaser } from '../../../../../context/offline-drive/files/application/OfflineFileSizeIncreaser';

export interface OfflineFilesContainer {
  offlineFileSearcher: OfflineFileSearcher;
  offlineFileFinder: OfflineFileFinder;
  offlineFileSizeIncreaser: OfflineFileSizeIncreaser;
}
