import { Readable } from 'stream';
import { Thumbnail } from '../../../../../src/context/storage/thumbnails/domain/Thumbnail';
import { ThumbnailsRepository } from '../../../../../src/context/storage/thumbnails/domain/ThumbnailsRepository';
import { File } from '../../../../../src/context/virtual-drive/files/domain/File';
import { ThumbnailCollection } from '../../../../../src/context/storage/thumbnails/domain/ThumbnailCollection';

export class ThumbnailsRepositoryMock implements ThumbnailsRepository {
  private readonly retrieveMock = jest.fn();
  private readonly pullMock = jest.fn();
  private readonly pushMock = jest.fn();

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
    files.forEach((file) =>
      expect(this.retrieveMock).toHaveBeenCalledWith(file)
    );
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

  push(thumbnail: Thumbnail, stream: Readable): Promise<void> {
    return this.pushMock(thumbnail, stream);
  }

  assertPushHasBeenCalledWith(thumbnails: Thumbnail[]) {
    thumbnails.forEach((thumbnail) => {
      expect(this.pushMock).toBeCalledWith(thumbnail, expect.any(Object));
    });
  }
}
