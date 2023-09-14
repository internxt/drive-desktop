import { ContentsDownloader } from '../../modules/contents/application/ContentsDownloader';
import { ContentsUploader } from '../../modules/contents/application/ContentsUploader';

export interface ContentsContainer {
  contentsUploader: ContentsUploader;
  contentsDownloader: ContentsDownloader;
}
