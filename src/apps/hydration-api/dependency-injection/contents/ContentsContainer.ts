import { DownloadContentsToPlainFile } from '../../../../context/virtual-drive/contents/application/DownloadContentsToPlainFile';
import { LocalContentsDeleter } from '../../../../context/virtual-drive/contents/application/LocalContentsDeleter';

export interface ContentsContainer {
  downloadContentsToPlainFile: DownloadContentsToPlainFile;
  localContentsDeleter: LocalContentsDeleter;
}
