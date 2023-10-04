import { RetryContentsUploader } from '../../modules/contents/application/RetryContentsUploader';
import { ContentsDownloader } from '../../modules/contents/application/ContentsDownloader';

export interface ContentsContainer {
  contentsUploader: RetryContentsUploader;
  contentsDownloader: ContentsDownloader;
  temporalFolderProvider: () => Promise<string>;
}
