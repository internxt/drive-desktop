import { Readable } from 'stream';
import { OfflineContents } from './OfflineContents';

type ContentsId = string;

export type OfflineContentsUploadEvents = {
  start: () => void;
  progress: (progress: number) => void;
  finish: (fileId: ContentsId) => void;
  error: (error: Error) => void;
};

export type OfflineContentUploader = () => Promise<string>;

export interface OfflineContentsManagersFactory {
  uploader(
    readable: Readable,
    contents: OfflineContents,
    desiredPathElements: {
      name: string;
      extension: string;
    },
    abortSignal?: AbortSignal
  ): OfflineContentUploader;
}
