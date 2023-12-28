import { Readable } from 'stream';

type ContentsId = string;

export type OfflineContentsUploadEvents = {
  start: () => void;
  progress: (progress: number) => void;
  finish: (fileId: ContentsId) => void;
  error: (error: Error) => void;
};

export interface OfflineContentUploader {
  upload(contents: Readable, size: number): Promise<ContentsId>;

  on(
    event: keyof OfflineContentsUploadEvents,
    fn: OfflineContentsUploadEvents[keyof OfflineContentsUploadEvents]
  ): void;

  elapsedTime(): number;
}

export interface OfflineContentsManagersFactory {
  uploader(size: number, abortSignal?: AbortSignal): OfflineContentUploader;
}
