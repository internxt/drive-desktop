import { WebdavFileAtributes } from './WebdavFile';

export type FileCloneEvents = {
  start: () => void;
  'start-download': () => void;
  'start-upload': () => void;
  'download-progress': (progress: number) => void;
  'upload-progress': (progress: number) => void;
  'download-finished': (fileId: WebdavFileAtributes['fileId']) => void;
  'upload-finished': (fileId: WebdavFileAtributes['fileId']) => void;
  finish: (fileId: WebdavFileAtributes['fileId']) => void;
  error: (error: Error) => void;
};

export interface ContentFileClonner {
  clone(): Promise<WebdavFileAtributes['fileId']>;

  on(
    event: keyof FileCloneEvents,
    handler: FileCloneEvents[keyof FileCloneEvents]
  ): void;
}
