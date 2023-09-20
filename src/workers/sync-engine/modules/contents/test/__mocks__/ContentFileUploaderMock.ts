import { Readable } from 'stream';
import {
  ContentFileUploader,
  FileUploadEvents,
} from '../../domain/contentHandlers/ContentFileUploader';
import { ContentsId } from '../../domain/ContentsId';

export class ContentFileUploaderMock implements ContentFileUploader {
  uploadMock = jest.fn();
  onMock = jest.fn();
  elapsedTimeMock = jest.fn();

  upload(contents: Readable, size: number): Promise<ContentsId> {
    return this.uploadMock(contents, size);
  }
  on(
    event: keyof FileUploadEvents,
    fn:
      | (() => void)
      | ((progress: number) => void)
      | ((fileId: string) => void)
      | ((error: Error) => void)
  ): void {
    return this.onMock(event, fn);
  }

  elapsedTime(): number {
    return this.elapsedTimeMock();
  }
}
