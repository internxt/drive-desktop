import fs from 'node:fs';
import path from 'node:path';
import { LocalThumbnailRepository } from './LocalThumbnsailsRepository';
import { SystemThumbnailNameCalculator } from './SystemThumbnailNameCalculator';
import { RelativePathToAbsoluteConverterTestClass } from '../../../../virtual-drive/shared/application/__test-helpers__/RelativePathToAbsoluteConverterTestClass';
import { FileMother } from '../../../../virtual-drive/files/domain/__test-helpers__/FileMother';
import * as WriteReadableToFile from '../../../../../apps/shared/fs/write-readable-to-file';
import { ThumbnailMother } from '../../../thumbnails/__test-helpers__/ThumbnailMother';
import { Readable } from 'node:stream';

vi.mock('fs');

const mockedFS = vi.mocked(fs, true);

describe('Local Thumbnail Repository', () => {
  let SUT: LocalThumbnailRepository;

  let pathConverter: RelativePathToAbsoluteConverterTestClass;
  let nameCalculator: SystemThumbnailNameCalculator;

  const thumbnailFolder = path.join(__dirname, 'files');

  beforeAll(() => {
    pathConverter = new RelativePathToAbsoluteConverterTestClass();
    nameCalculator = new SystemThumbnailNameCalculator();

    SUT = new LocalThumbnailRepository(pathConverter, nameCalculator, thumbnailFolder);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('retrieve', () => {
    it('searches for a the normal thumbnail on the given folder', async () => {
      const absolutePath = '/home/jens/photos/me.png';
      const uri = `file://${absolutePath}`;

      const file = FileMother.fromPartial({
        path: '/photos/me.png',
      });
      mockedFS.statSync.mockReturnValueOnce({ mtime: new Date() } as fs.Stats);
      pathConverter.convertTo(absolutePath);

      const thumbnailNameCalculator = vi.spyOn(nameCalculator, 'thumbnailName');

      await SUT.retrieve(file);

      expect(thumbnailNameCalculator).toBeCalledWith(uri);
      expect(mockedFS.statSync).toBeCalledWith(
        path.join(thumbnailFolder, 'normal', 'c6ee772d9e49320e97ec29a7eb5b1697.png'),
      );
    });

    it('obtains a thumbnail collection', async () => {
      const absolutePath = '/home/jens/photos/me.png';
      const updatedAt = new Date();

      const file = FileMother.fromPartial({
        path: '/photos/me.png',
      });
      mockedFS.statSync.mockReturnValueOnce({ mtime: updatedAt } as fs.Stats);
      pathConverter.convertTo(absolutePath);

      const collection = await SUT.retrieve(file);

      expect(collection).toBeDefined();
      expect(collection?.file).toBe(file);
      expect(collection?.thumbnails).toEqual(
        expect.arrayContaining([expect.objectContaining({ _updatedAt: updatedAt })]),
      );
    });
  });

  describe('push', () => {
    it('writes the stream to the local thumbnails folder', async () => {
      const file = FileMother.fromPartial({
        path: '/photos/me.png',
      });
      const absolutePath = '/home/jens/photos/me.png';

      const writeSpy = vi.spyOn(WriteReadableToFile, 'writeReadableToFile');

      writeSpy.mockImplementation(({ readable }) => {
        return new Promise((resolve) => {
          readable.on('data', () => {
            /* Intentionally empty - just consuming the stream */
          });
          readable.on('end', resolve);
        });
      });

      const readableStream = Readable.from('thumbnail data');

      pathConverter.convertTo(absolutePath);

      await SUT.push(file, readableStream);

      expect(writeSpy).toBeCalledWith(
        expect.objectContaining({
          readable: expect.any(Readable),
          path: path.join(thumbnailFolder, 'normal', 'c6ee772d9e49320e97ec29a7eb5b1697.png'),
        }),
      );
    });
  });

  // describe('default', () => {});

  describe('pull', () => {
    it('is not implemented', async () => {
      try {
        await SUT.pull(ThumbnailMother.any());
      } catch (err) {
        expect(err).toBeDefined();
        expect(err).toBeInstanceOf(Error);
        expect((err as Error).message).toBe('Method not implemented.');
      }
    });
  });
});
