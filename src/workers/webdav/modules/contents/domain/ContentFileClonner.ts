import { FileAtributes } from '../../files/domain/File';

export type FileCloneEvents = {
  start: () => void;
  'start-download': () => void;
  'start-upload': () => void;
  'download-progress': (progress: number) => void;
  'upload-progress': (progress: number) => void;
  'download-finished': (fileId: FileAtributes['contentsId']) => void;
  'upload-finished': (fileId: FileAtributes['contentsId']) => void;
  finish: (fileId: FileAtributes['contentsId']) => void;
  error: (error: Error) => void;
};

export interface ContentFileClonner {
  clone(): Promise<FileAtributes['contentsId']>;

  on(
    event: keyof FileCloneEvents,
    handler: FileCloneEvents[keyof FileCloneEvents]
  ): void;

  elapsedTime(): number;
}
