import { EnvironmentRemoteFileContentsManagersFactory } from '@/context/virtual-drive/contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { ContentsDownloader } from '../../../../context/virtual-drive/contents/application/ContentsDownloader';
import { ContentsUploader } from '@/context/virtual-drive/contents/application/ContentsUploader';

export interface ContentsContainer {
  contentsUploader: ContentsUploader;
  contentsDownloader: ContentsDownloader;
  contentsManagerFactory: EnvironmentRemoteFileContentsManagersFactory;
}
