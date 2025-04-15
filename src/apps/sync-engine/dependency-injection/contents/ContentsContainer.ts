import { EnvironmentRemoteFileContentsManagersFactory } from '@/context/virtual-drive/contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { ContentsDownloader } from '../../../../context/virtual-drive/contents/application/ContentsDownloader';
import { RetryContentsUploader } from '../../../../context/virtual-drive/contents/application/RetryContentsUploader';
import { TemporalFolderProvider } from '../../../../context/virtual-drive/contents/application/temporalFolderProvider';

export interface ContentsContainer {
  contentsUploader: RetryContentsUploader;
  contentsDownloader: ContentsDownloader;
  temporalFolderProvider: TemporalFolderProvider;
  contentsManagerFactory: EnvironmentRemoteFileContentsManagersFactory;
}
