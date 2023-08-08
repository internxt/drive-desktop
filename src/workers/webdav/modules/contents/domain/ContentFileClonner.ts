import { FileAtributes } from '../../files/domain/File';

export type FileCloneEvents = {
  start: () => void;
  'start-download': () => void;
  'start-upload': () => void;
  'download-progress': (progress: number) => void;
  'upload-progress': (progress: number) => void;
  'download-finished': (fileId: FileAtributes['fileId']) => void;
  'upload-finished': (fileId: FileAtributes['fileId']) => void;
  finish: (fileId: FileAtributes['fileId']) => void;
  error: (error: Error) => void;
};

export interface ContentFileClonner {
  clone(): Promise<FileAtributes['fileId']>;

  on(
    event: keyof FileCloneEvents,
    handler: FileCloneEvents[keyof FileCloneEvents]
  ): void;

  elapsedTime(): number;
}
