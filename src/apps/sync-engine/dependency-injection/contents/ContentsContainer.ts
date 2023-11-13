import { ContentsDownloader } from '../../../../context/virtual-drive/contents/application/ContentsDownloader';
import { NotifyMainProcessHydrationFinished } from '../../../../context/virtual-drive/contents/application/NotifyMainProcessHydrationFinished';
import { RetryContentsUploader } from '../../../../context/virtual-drive/contents/application/RetryContentsUploader';
import { TemporalFolderProvider } from '../../../../context/virtual-drive/contents/application/temporalFolderProvider';

export interface ContentsContainer {
  contentsUploader: RetryContentsUploader;
  contentsDownloader: ContentsDownloader;
  temporalFolderProvider: TemporalFolderProvider;
  notifyMainProcessHydrationFinished: NotifyMainProcessHydrationFinished;
}
