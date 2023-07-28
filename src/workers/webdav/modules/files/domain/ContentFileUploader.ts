import { Readable } from 'stream';

type FileId = string;

export type FileUploadEvents = {
  start: () => void;
  progress: (progress: number) => void;
  finish: (fileId: FileId) => void;
  error: (error: Error) => void;
};

export interface ContentFileUploader {
  upload(contents: Readable, size: number): Promise<FileId>;

  on(
    event: keyof FileUploadEvents,
    fn: FileUploadEvents[keyof FileUploadEvents]
  ): void;

  elapsedTime(): number;
}
