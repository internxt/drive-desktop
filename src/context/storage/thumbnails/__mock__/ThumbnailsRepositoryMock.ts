import { Readable } from 'node:stream';
import { Thumbnail } from '../domain/Thumbnail';
import { ThumbnailsRepository } from '../domain/ThumbnailsRepository';
import { File } from '../../../virtual-drive/files/domain/File';
import { ThumbnailCollection } from '../domain/ThumbnailCollection';

export class ThumbnailsRepositoryMock implements ThumbnailsRepository {
  private readonly retrieveMock = vi.fn();
  private readonly pullMock = vi.fn();
  private readonly pushMock = vi.fn();
  private readonly hasMock = vi.fn();
  private readonly defaultMock = vi.fn();

  has(file: File): Promise<boolean> {
    return this.hasMock(file);
  }

  hasWillReturn(value: boolean) {
    this.hasMock.mockResolvedValue(value);
  }

  assertHasHasBeenCalledWith(file: File) {
    expect(this.hasMock).toHaveBeenCalledWith(file);
  }

  assertHasHasNotBeenCalledWith() {
    expect(this.hasMock).not.toHaveBeenCalled();
  }

  retrieve(file: File): Promise<ThumbnailCollection> {
    return this.retrieveMock(file);
  }

  willRetrieveOnce(thumbnailsCollection: ThumbnailCollection | undefined) {
    this.retrieveMock.mockResolvedValueOnce(thumbnailsCollection);
  }

  willRetrieve(thumbnailsCollection: ThumbnailCollection | undefined) {
    this.retrieveMock.mockResolvedValue(thumbnailsCollection);
  }

  assertRetrieveHasBeenCalledWith(files: Array<File>) {
    files.forEach((file) => expect(this.retrieveMock).toHaveBeenCalledWith(file));
  }

  pull(thumbnail: Thumbnail): Promise<Readable> {
    return this.pullMock(thumbnail);
  }

  willPullSomeRandomContent() {
    this.pullMock.mockResolvedValueOnce(Readable.from('Hello World'));
  }

  assertPullHasBeenCalledWith(thumbnails: Array<Thumbnail>) {
    thumbnails.forEach((thumbnail) => {
      expect(this.pullMock).toHaveBeenCalledWith(thumbnail);
    });
  }

  push(file: File, stream: Readable): Promise<void> {
    return this.pushMock(file, stream);
  }

  assertPushHasBeenCalledWith(files: File[]) {
    files.forEach((file) => {
      expect(this.pushMock).toBeCalledWith(file, expect.any(Object));
    });
  }

  default(file: File): Promise<void> {
    return this.defaultMock(file);
  }

  assertDefaultHasNotBeenCalled() {
    expect(this.defaultMock).not.toHaveBeenCalled();
  }

  assertDefaultBeenCalledWith(file: File) {
    expect(this.defaultMock).toBeCalledWith(file);
  }
}
