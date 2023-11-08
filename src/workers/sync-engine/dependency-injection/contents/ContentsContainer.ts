import { RetryContentsUploader } from '../../modules/contents/application/RetryContentsUploader';
import { ContentsDownloader } from '../../modules/contents/application/ContentsDownloader';
import { TemporalFolderProvider } from '../../modules/contents/application/temporalFolderProvider';
import { NotifyMainProcessHydrationFinished } from '../../modules/contents/application/NotifyMainProcessHydrationFinished';

export interface ContentsContainer {
  contentsUploader: RetryContentsUploader;
  contentsDownloader: ContentsDownloader;
  temporalFolderProvider: TemporalFolderProvider;
  notifyMainProcessHydrationFinished: NotifyMainProcessHydrationFinished;
}
