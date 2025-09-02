import { EnvironmentRemoteFileContentsManagersFactory } from '@/context/virtual-drive/contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { ContentsDownloader } from '../../../../context/virtual-drive/contents/application/ContentsDownloader';

export interface ContentsContainer {
  contentsDownloader: ContentsDownloader;
  contentsManagerFactory: EnvironmentRemoteFileContentsManagersFactory;
}
