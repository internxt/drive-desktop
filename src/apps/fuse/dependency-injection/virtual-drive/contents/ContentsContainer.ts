import { AllLocalContentsDeleter } from '../../../../../context/virtual-drive/contents/application/AllLocalContentsDeleter';
import { DownloadContentsToPlainFile } from '../../../../../context/virtual-drive/contents/application/DownloadContentsToPlainFile';
import { LocalContentChecker } from '../../../../../context/virtual-drive/contents/application/LocalContentChecker';
import { MoveOfflineContentsOnContentsUploaded } from '../../../../../context/virtual-drive/contents/application/MoveOfflineContentsOnContentsUploaded';
import { RetryContentsUploader } from '../../../../../context/virtual-drive/contents/application/RetryContentsUploader';

export interface ContentsContainer {
  retryContentsUploader: RetryContentsUploader;
  downloadContentsToPlainFile: DownloadContentsToPlainFile;
  localContentChecker: LocalContentChecker;
  moveOfflineContentsOnContentsUploaded: MoveOfflineContentsOnContentsUploaded;
  allLocalContentsDeleter: AllLocalContentsDeleter;
}
