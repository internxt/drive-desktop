import { CreateOfflineFile } from '../../../../../context/offline-drive/files/application/CreateOfflineFile';
import { OfflineFileSearcher } from '../../../../../context/offline-drive/files/application/OfflineFileSearcher';
import { WriteToOfflineFile } from '../../../../../context/offline-drive/files/application/WriteToOfflineFile';

export interface OfflineFilesContainer {
  createOfflineFile: CreateOfflineFile;
  offlineFileSearcher: OfflineFileSearcher;
  writeToOfflineFile: WriteToOfflineFile;
}
