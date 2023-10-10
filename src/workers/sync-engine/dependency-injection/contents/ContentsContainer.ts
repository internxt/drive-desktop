import { RetryContentsUploader } from '../../modules/contents/application/RetryContentsUploader';
import { ContentsDownloader } from '../../modules/contents/application/ContentsDownloader';
import { TemporalFolderProvider } from '../../modules/contents/application/temporalFolderProvider';

export interface ContentsContainer {
  contentsUploader: RetryContentsUploader;
  contentsDownloader: ContentsDownloader;
  temporalFolderProvider: TemporalFolderProvider;
}
