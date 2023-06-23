import {
  ContentFileUploader,
  FileUploadEvents,
} from '../../domain/ContentFileUploader';

export class ContentFileUploaderMock implements ContentFileUploader {
  uploadMock = jest.fn();
  onMock = jest.fn();

  upload(): Promise<string> {
    return this.uploadMock();
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
}
