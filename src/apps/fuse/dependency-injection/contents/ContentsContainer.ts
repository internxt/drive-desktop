import { DownloadContentsToPlainFile } from '../../../../context/virtual-drive/contents/application/DownloadContentsToPlainFile';
import { LocalContentChecker } from '../../../../context/virtual-drive/contents/application/LocalContentChecker';
import { RetryContentsUploader } from '../../../../context/virtual-drive/contents/application/RetryContentsUploader';

export interface ContentsContainer {
  retryContentsUploader: RetryContentsUploader;
  downloadContentsToPlainFile: DownloadContentsToPlainFile;
  localContentChecker: LocalContentChecker;
}
