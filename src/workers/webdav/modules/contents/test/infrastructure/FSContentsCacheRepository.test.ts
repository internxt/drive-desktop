import glob from 'tiny-glob';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import { Readable } from 'stream';
import { FSContentsCacheRepository } from '../../infrastructure/FSContentsCacheRepository';

jest.mock('tiny-glob', () => jest.fn());
jest.mock('fs/promises');
jest.mock('fs');

const whereToCreateIt = '/Getziujo/Turfiri/Ipfugiri';

const contents = Readable.from('FILE CONTENTS');

describe('fs contents cache repository', () => {
  const mocked = {
    createReadStream: <jest.Mock>createReadStream,
    stat: <jest.Mock>fs.stat,
    writeFile: <jest.Mock>fs.writeFile,
    unlink: <jest.Mock>fs.unlink,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exists', () => {
    it('returns true when the file exists', async () => {
      const fileId = '9f66fbdc-a618-5a1b-876c-619f207c2b62';
      const size = 1907851052;
      const repository = new FSContentsCacheRepository(whereToCreateIt);

      mocked.stat.mockResolvedValueOnce(size + 1);
      mocked.writeFile.mockReturnValueOnce(Promise.resolve());

      await repository.write(fileId, contents, size);

      const result = repository.exists(fileId);

      expect(result).toBe(true);
    });

    it('returns false when the file does not exist', async () => {
      const repository = new FSContentsCacheRepository(whereToCreateIt);

      const result = repository.exists('544b943d-c663-5fe3-bd89-6a52bb80880e');

      expect(result).toBe(false);
    });
  });

  describe('read', () => {
    it('creates a readable for file given an existing file name', async () => {
      mocked.createReadStream.mockResolvedValueOnce(contents);

      const repository = new FSContentsCacheRepository(whereToCreateIt);

      repository.read('544b943d-c663-5fe3-bd89-6a52bb80880e');

      expect(mocked.createReadStream.mock.calls[0][0]).toEqual(
        '/Getziujo/Turfiri/Ipfugiri/File Cache/544b943d-c663-5fe3-bd89-6a52bb80880e'
      );
    });
  });

  describe('write', () => {
    it('saves a file with the given name and override it if exists', async () => {
      const fileSize = 4212153063;
      mocked.writeFile.mockResolvedValueOnce(Promise.resolve());
      mocked.stat.mockResolvedValueOnce({ size: fileSize + 1 });

      const repository = new FSContentsCacheRepository(
        whereToCreateIt,
        fileSize * 2
      );

      await repository.write(
        '544b943d-c663-5fe3-bd89-6a52bb80880e',
        contents,
        fileSize
      );

      expect(mocked.writeFile).toBeCalledWith(
        '/Getziujo/Turfiri/Ipfugiri/File Cache/544b943d-c663-5fe3-bd89-6a52bb80880e',
        contents,
        { flag: 'w' }
      );
    });

    it('deletes the least recent accessed files when there is not enought space', async () => {
      const fileSize = 30;
      mocked.stat
        .mockResolvedValueOnce({ size: 80 })
        .mockResolvedValueOnce({ size: 60 });
      mocked.unlink.mockReturnValueOnce(Promise.resolve());
      mocked.writeFile.mockResolvedValueOnce(Promise.resolve());

      const repository = new FSContentsCacheRepository(whereToCreateIt, 100);

      (repository as any).cachedFilesAccessTime.set(
        'baaf80d1-8c0b-50ad-a370-11450428a8cc',
        Date.now()
      );
      (repository as any).cachedFilesAccessTime.set(
        'b595b2b5-92ed-5744-97f5-4acd8e69e0ee',
        Date.now()
      );
      (repository as any).cachedFilesAccessTime.set(
        '940c9bac-bc1c-5ff7-9fc9-573d78df8c39',
        Date.now()
      );

      await repository.write(
        'd30cd495-d20e-513f-b1a3-2865f605999b',
        contents,
        fileSize
      );
      expect(mocked.stat).toBeCalledTimes(2);
      expect(mocked.unlink).toBeCalledTimes(1);
    });

    it('does not cache the file if its size is larger than the cache space', async () => {
      const fileId = '8cebd95f-2397-57f8-aa8f-c549cbd8b942';
      const fileSize = 4212153063;
      mocked.writeFile.mockResolvedValueOnce(Promise.resolve());

      const repository = new FSContentsCacheRepository(
        whereToCreateIt,
        fileSize - 1
      );

      await repository.write(fileId, contents, fileSize).catch((err) => {
        expect(err).toBeDefined();
      });

      expect(mocked.writeFile).not.toBeCalled();
      expect(repository.exists(fileId)).toBe(false);
    });
  });

  describe('delete', () => {
    it('deletes a file from the cahce', async () => {
      mocked.unlink.mockResolvedValue(Promise.resolve());

      const repository = new FSContentsCacheRepository(whereToCreateIt);

      await repository.delete('544b943d-c663-5fe3-bd89-6a52bb80880e');

      expect(mocked.unlink.mock.calls[0][0]).toBe(
        '/Getziujo/Turfiri/Ipfugiri/File Cache/544b943d-c663-5fe3-bd89-6a52bb80880e'
      );
    });
  });

  describe('usage', () => {
    it('returns the usage used', async () => {
      const expectedSize = 688489878;
      mocked.stat.mockResolvedValue(Promise.resolve({ size: expectedSize }));
      const repository = new FSContentsCacheRepository(whereToCreateIt);

      const result = await repository.usage();

      expect(result).toEqual(expectedSize);
    });

    it('returns the usage of the folder being used', async () => {
      mocked.stat.mockResolvedValue(Promise.resolve({ size: 1244487453 }));
      const repository = new FSContentsCacheRepository(whereToCreateIt);

      await repository.usage();

      expect(mocked.stat).toBeCalledWith(`${whereToCreateIt}/File Cache`);
    });
  });

  describe('initialize', () => {
    it('stores in memory the accessed time of all files on the given folder', async () => {
      const expectedResult = new Map([
        ['3ce8d546-517d-557e-8c2b-330b671b92de', 1],
        ['6de9c7c6-e8ec-5822-a0ea-2e2e0a274de6', 2],
        ['d166dfda-6677-5e71-b19a-321bb510ca60', 3],
        ['719ad0fc-403f-5601-8db3-784f01939b70', 4],
      ]);

      (<jest.Mock>glob).mockResolvedValueOnce(
        Array.from(expectedResult.keys())
      );
      mocked.stat
        .mockResolvedValueOnce({ atimeMs: 1 })
        .mockResolvedValueOnce({ atimeMs: 2 })
        .mockResolvedValueOnce({ atimeMs: 3 })
        .mockResolvedValueOnce({ atimeMs: 4 });

      const repository = new FSContentsCacheRepository(whereToCreateIt);

      await repository.initialize();

      const internalMap = (repository as any).cachedFilesAccessTime;

      expect(internalMap).toEqual(expectedResult);
    });
  });
});
