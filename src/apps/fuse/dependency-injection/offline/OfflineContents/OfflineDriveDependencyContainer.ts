import { OfflineContentsAppender } from '../../../../../context/offline-drive/contents/application/OfflineContentsAppender';
import { OfflineContentsCreator } from '../../../../../context/offline-drive/contents/application/OfflineContentsCreator';
import { OfflineContentsPathCalculator } from '../../../../../context/offline-drive/contents/application/OfflineContentsPathCalculator';
import { OfflineContentsUploader } from '../../../../../context/offline-drive/contents/application/OfflineContentsUploader';

export interface OfflineContentsDependencyContainer {
  offlineContentsCreator: OfflineContentsCreator;
  offlineContentsAppender: OfflineContentsAppender;
  offlineContentsUploader: OfflineContentsUploader;
  offlineContentsPathCalculator: OfflineContentsPathCalculator;
}
