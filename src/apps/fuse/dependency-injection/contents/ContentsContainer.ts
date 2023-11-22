import { DownloadContentsToPlainFile } from '../../../../context/virtual-drive/contents/application/DownloadContentsToPlainFile';
import { LocalContentChecker } from '../../../../context/virtual-drive/contents/application/LocalContentChecker';

export interface ContentsContainer {
  downloadContentsToPlainFile: DownloadContentsToPlainFile;
  localContentChecker: LocalContentChecker;
}
