import { OfflineContentsCacheCleaner } from '../../../../../context/offline-drive/contents/application/OfflineContentsCacheCleaner';
import { ContentsChunkReader } from '../../../../../context/offline-drive/contents/application/ContentsChunkReader';
import { OfflineContentsAppender } from '../../../../../context/offline-drive/contents/application/OfflineContentsAppender';
import { OfflineContentsCreator } from '../../../../../context/offline-drive/contents/application/OfflineContentsCreator';
import { OfflineContentsUploader } from '../../../../../context/offline-drive/contents/application/OfflineContentsUploader';

export interface OfflineContentsDependencyContainer {
  offlineContentsCreator: OfflineContentsCreator;
  offlineContentsAppender: OfflineContentsAppender;
  offlineContentsUploader: OfflineContentsUploader;
  contentsChunkReader: ContentsChunkReader;
  offlineContentsCacheCleaner: OfflineContentsCacheCleaner;
}
