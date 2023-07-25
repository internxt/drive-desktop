import fs from 'fs/promises';
import { createReadStream } from 'fs';
import { Readable } from 'stream';
import { NodeLocalFileContentsRepository } from '../../../infrastructure/storage/NodeLocalFileContentsRepository';
jest.mock('fs/promises');
jest.mock('fs');

const whereToCreateIt = '/Getziujo/Turfiri/Ipfugiri';

describe('Node FS local file contents repository', () => {
  describe('exists', () => {
    it('returns true when the file exists', async () => {
      (<jest.Mock>fs.access).mockResolvedValue(Promise.resolve());

      const repository = new NodeLocalFileContentsRepository(whereToCreateIt);

      const result = await repository.exists(
        '544b943d-c663-5fe3-bd89-6a52bb80880e'
      );

      expect(result).toBe(true);
      expect((<jest.Mock>fs.access).mock.calls[0][0]).toBe(
        '/Getziujo/Turfiri/Ipfugiri/File Cache/544b943d-c663-5fe3-bd89-6a52bb80880e'
      );
    });

    it('returns false when the file does not exist', async () => {
      (<jest.Mock>fs.access).mockResolvedValue(Promise.reject());

      const repository = new NodeLocalFileContentsRepository(whereToCreateIt);

      const result = await repository.exists(
        '544b943d-c663-5fe3-bd89-6a52bb80880e'
      );

      expect(result).toBe(false);
      expect((<jest.Mock>fs.access).mock.calls[0][0]).toBe(
        '/Getziujo/Turfiri/Ipfugiri/File Cache/544b943d-c663-5fe3-bd89-6a52bb80880e'
      );
    });
  });

  describe('read', () => {
    it('creates a readable for file given an existing file name', async () => {
      (<jest.Mock>createReadStream).mockResolvedValue(Readable.from(''));

      const repository = new NodeLocalFileContentsRepository(whereToCreateIt);

      repository.read('544b943d-c663-5fe3-bd89-6a52bb80880e');

      expect((<jest.Mock>createReadStream).mock.calls[0][0]).toEqual(
        '/Getziujo/Turfiri/Ipfugiri/File Cache/544b943d-c663-5fe3-bd89-6a52bb80880e'
      );
    });
  });

  describe('write', () => {
    it('saves a file with the given name and override it if exists', async () => {
      (<jest.Mock>fs.writeFile).mockResolvedValue(Promise.resolve());

      const repository = new NodeLocalFileContentsRepository(whereToCreateIt);

      await repository.write(
        '544b943d-c663-5fe3-bd89-6a52bb80880e',
        Readable.from('')
      );

      expect((<jest.Mock>fs.writeFile).mock.calls[0][0]).toBe(
        '/Getziujo/Turfiri/Ipfugiri/File Cache/544b943d-c663-5fe3-bd89-6a52bb80880e'
      );
      expect((<jest.Mock>fs.writeFile).mock.calls[0][2]).toEqual({ flag: 'w' });
    });
  });

  describe('delete', () => {
    it('deletes a file from the cahce', async () => {
      (<jest.Mock>fs.unlink).mockResolvedValue(Promise.resolve());

      const repository = new NodeLocalFileContentsRepository(whereToCreateIt);

      await repository.delete('544b943d-c663-5fe3-bd89-6a52bb80880e');

      expect((<jest.Mock>fs.unlink).mock.calls[0][0]).toBe(
        '/Getziujo/Turfiri/Ipfugiri/File Cache/544b943d-c663-5fe3-bd89-6a52bb80880e'
      );
    });
  });

  describe('usage', () => {
    it('returns the usage used', async () => {
      const expectedSize = 688489878;
      (<jest.Mock>fs.stat).mockResolvedValue(
        Promise.resolve({ size: expectedSize })
      );
      const repository = new NodeLocalFileContentsRepository(whereToCreateIt);

      const result = await repository.usage();

      expect(result).toEqual(expectedSize);
    });

    it('returns the usage of the folder being used', async () => {
      (<jest.Mock>fs.stat).mockResolvedValue(
        Promise.resolve({ size: 1244487453 })
      );
      const repository = new NodeLocalFileContentsRepository(whereToCreateIt);

      await repository.usage();

      expect(<jest.Mock>fs.stat).toBeCalledWith(
        `${whereToCreateIt}/File Cache`
      );
    });
  });
});
