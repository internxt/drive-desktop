import fs from 'fs';
import path from 'path';
import { LocalThumbnailRepository } from '../../../../../../src/context/storage/thumbnails/infrastructrue/local/LocalThumbnsailsRepository';
import { SystemThumbnailNameCalculator } from '../../../../../../src/context/storage/thumbnails/infrastructrue/local/SystemThumbnailNameCalculator';
import { RelativePathToAbsoluteConverterTestClass } from '../../../../shared/__test-class__/RelativePathToAbsoluteConverterTestClass';
import { FileMother } from '../../../../virtual-drive/files/domain/FileMother';
import { WriteReadableToFile } from '../../../../../../src/apps/shared/fs/write-readable-to-file';
import { ReadableMother } from '../../../../shared/domain/ReadableMother';
import { ThumbnailMother } from '../../domain/ThumbnailMother';

jest.mock('fs');

const mockedFS = jest.mocked(fs, true);

describe('Local Thumbnail Repository', () => {
  let SUT: LocalThumbnailRepository;

  let pathConverter: RelativePathToAbsoluteConverterTestClass;
  let nameCalculator: SystemThumbnailNameCalculator;

  const thumbnailFolder = path.join(__dirname, 'files');

  beforeAll(() => {
    pathConverter = new RelativePathToAbsoluteConverterTestClass();
    nameCalculator = new SystemThumbnailNameCalculator();

    SUT = new LocalThumbnailRepository(
      pathConverter,
      nameCalculator,
      thumbnailFolder
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
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

      const thumbnailNameCalculator = jest.spyOn(
        nameCalculator,
        'thumbnailName'
      );

      await SUT.retrieve(file);

      expect(thumbnailNameCalculator).toBeCalledWith(uri);
      expect(mockedFS.statSync).toBeCalledWith(
        path.join(
          thumbnailFolder,
          'normal',
          'c6ee772d9e49320e97ec29a7eb5b1697.png'
        )
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
        expect.arrayContaining([
          expect.objectContaining({ _updatedAt: updatedAt }),
        ])
      );
    });
  });

  describe('push', () => {
    it('writes the stream to the local thumbnails folder', async () => {
      const file = FileMother.fromPartial({
        path: '/photos/me.png',
      });
      const absolutePath = '/home/jens/photos/me.png';

      const writeSpy = jest.spyOn(WriteReadableToFile, 'write');
      writeSpy.mockReturnValueOnce(Promise.resolve());
      pathConverter.convertTo(absolutePath);

      await SUT.push(file, ReadableMother.any());

      expect(writeSpy).toBeCalledWith(
        expect.any(Object),
        path.join(
          thumbnailFolder,
          'normal',
          'c6ee772d9e49320e97ec29a7eb5b1697.png'
        )
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
