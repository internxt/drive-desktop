import { ContentsDownloader } from '../../../../context/virtual-drive/contents/application/ContentsDownloader';
import { NotifyMainProcessHydrationFinished } from '../../../../context/virtual-drive/contents/application/NotifyMainProcessHydrationFinished';
import { RetryContentsUploader } from '../../../../context/virtual-drive/contents/application/RetryContentsUploader';
import { LocalFileContentsDirectoryProvider } from '../../../../context/virtual-drive/contents/domain/LocalFileContentsDirectoryProvider';

export interface ContentsContainer {
  contentsUploader: RetryContentsUploader;
  contentsDownloader: ContentsDownloader;
  localFileContentsDirectoryProvider: LocalFileContentsDirectoryProvider;
  notifyMainProcessHydrationFinished: NotifyMainProcessHydrationFinished;
}
