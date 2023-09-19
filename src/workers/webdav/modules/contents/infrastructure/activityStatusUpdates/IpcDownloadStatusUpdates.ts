import { VirtualDriveIpc } from "../../../../ipc";
import { File } from "../../../../modules/files/domain/File";
import { DownloadStatusUpdates } from "../../domain/activityStatusUpdates/DownloadStatusUpdates";
import { ContentFileDownloader } from "../../domain/contentHandlers/ContentFileDownloader";

export class IpcDownloadStatusUpdates implements DownloadStatusUpdates {
  constructor(private readonly ipc: VirtualDriveIpc) {}

  start(downloader: ContentFileDownloader, file: File): void {
    this.ipc.send("WEBDAV_FILE_DOWNLOADING", {
      name: file.name,
      extension: file.type,
      nameWithExtension: file.nameWithExtension,
      size: file.size,
      processInfo: { elapsedTime: downloader.elapsedTime() },
    });
  }

  progress(
    downloader: ContentFileDownloader,
    file: File,
    progress: number
  ): void {
    this.ipc.send("WEBDAV_FILE_DOWNLOADING", {
      name: file.name,
      extension: file.type,
      nameWithExtension: file.nameWithExtension,
      size: file.size,
      processInfo: { elapsedTime: downloader.elapsedTime(), progress },
    });
  }

  finish(downloader: ContentFileDownloader, file: File): void {
    this.ipc.send("WEBDAV_FILE_DOWNLOADED", {
      name: file.name,
      extension: file.type,
      nameWithExtension: file.nameWithExtension,
      size: file.size,
      processInfo: { elapsedTime: downloader.elapsedTime() },
    });
  }
  error(error: Error, file: File): void {
    this.ipc.send("WEBDAV_FILE_DOWNLOAD_ERROR", {
      name: file.name,
      extension: file.type,
      nameWithExtension: file.nameWithExtension,
      error: error.message,
    });
  }
}
