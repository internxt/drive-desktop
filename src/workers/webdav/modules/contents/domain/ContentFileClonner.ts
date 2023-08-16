import { ContentsId } from './ContentsId';

export type FileCloneEvents = {
  start: () => void;
  'start-download': () => void;
  'start-upload': () => void;
  'download-progress': (progress: number) => void;
  'upload-progress': (progress: number) => void;
  'download-finished': (fileId: ContentsId) => void;
  'upload-finished': (fileId: ContentsId) => void;
  finish: (fileId: ContentsId) => void;
  error: (error: Error) => void;
};

export interface ContentFileClonner {
  clone(): Promise<ContentsId>;

  on(
    event: keyof FileCloneEvents,
    handler: FileCloneEvents[keyof FileCloneEvents]
  ): void;

  elapsedTime(): number;
}
