import { OfflineContentsAppended } from '../../../../../context/offline-drive/contents/application/OfflineContentsAppended';
import { OfflineContentsPathCalculator } from '../../../../../context/offline-drive/contents/application/OfflineContentsPathCalculator';
import { OfflineContentsUploader } from '../../../../../context/offline-drive/contents/application/OfflineContentsUploader';

export interface OfflineContentsDependencyContainer {
  offlineContentsAppended: OfflineContentsAppended;
  offlineContentsUploader: OfflineContentsUploader;
  offlineContentsPathCalculator: OfflineContentsPathCalculator;
}
