import { File } from "../../../files/domain/File";
import { ContentFileDownloader } from "../contentHandlers/ContentFileDownloader";

export interface DownloadStatusUpdates {
  start(downloader: ContentFileDownloader, file: File): void;
  progress(
    downloader: ContentFileDownloader,
    file: File,
    progress: number
  ): void;
  finish(downloader: ContentFileDownloader, file: File): void;
  error(error: Error, file: File): void;
}
