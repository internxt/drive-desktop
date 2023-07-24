import fs from 'fs/promises';
import { createReadStream } from 'fs';
import { Readable } from 'stream';
import { NodeFSLocalFileContentsRepository } from '../../../infrastructure/storage/NodeFSLocalFileContentsRepository';
jest.mock('fs/promises');
jest.mock('fs');

const directory = '/Getziujo/Turfiri/Ipfugiri';

describe('Node FS local file contents repository', () => {
  describe('exists', () => {
    it('returns true when the file exists', async () => {
      (<jest.Mock>fs.access).mockResolvedValue(Promise.resolve());

      const repository = new NodeFSLocalFileContentsRepository(directory);

      const result = await repository.exists(
        '544b943d-c663-5fe3-bd89-6a52bb80880e'
      );

      expect(result).toBe(true);
      expect((<jest.Mock>fs.access).mock.calls[0][0]).toBe(
        '/Getziujo/Turfiri/Ipfugiri/544b943d-c663-5fe3-bd89-6a52bb80880e'
      );
    });

    it('returns false when the file does not exist', async () => {
      (<jest.Mock>fs.access).mockResolvedValue(Promise.reject());

      const repository = new NodeFSLocalFileContentsRepository(directory);

      const result = await repository.exists(
        '544b943d-c663-5fe3-bd89-6a52bb80880e'
      );

      expect(result).toBe(false);
      expect((<jest.Mock>fs.access).mock.calls[0][0]).toBe(
        '/Getziujo/Turfiri/Ipfugiri/544b943d-c663-5fe3-bd89-6a52bb80880e'
      );
    });
  });

  describe('read', () => {
    it('creates a readable for file given an existing file name', async () => {
      (<jest.Mock>createReadStream).mockResolvedValue(Readable.from(''));

      const repository = new NodeFSLocalFileContentsRepository(directory);

      repository.read('544b943d-c663-5fe3-bd89-6a52bb80880e');

      expect((<jest.Mock>createReadStream).mock.calls[0][0]).toEqual(
        '/Getziujo/Turfiri/Ipfugiri/544b943d-c663-5fe3-bd89-6a52bb80880e'
      );
    });
  });

  describe('write', () => {
    it('saves a file with the given name and override it if exists', async () => {
      (<jest.Mock>fs.writeFile).mockResolvedValue(Promise.resolve());

      const repository = new NodeFSLocalFileContentsRepository(directory);

      await repository.write(
        '544b943d-c663-5fe3-bd89-6a52bb80880e',
        Readable.from('')
      );

      expect((<jest.Mock>fs.writeFile).mock.calls[0][0]).toBe(
        '/Getziujo/Turfiri/Ipfugiri/544b943d-c663-5fe3-bd89-6a52bb80880e'
      );
      expect((<jest.Mock>fs.writeFile).mock.calls[0][2]).toEqual({ flag: 'w' });
    });
  });

  describe('delete', () => {
    it('deletes a file from the cahce', async () => {
      (<jest.Mock>fs.unlink).mockResolvedValue(Promise.resolve());

      const repository = new NodeFSLocalFileContentsRepository(directory);

      await repository.delete('544b943d-c663-5fe3-bd89-6a52bb80880e');

      expect((<jest.Mock>fs.unlink).mock.calls[0][0]).toBe(
        '/Getziujo/Turfiri/Ipfugiri/544b943d-c663-5fe3-bd89-6a52bb80880e'
      );
    });
  });

  describe('usage', () => {
    it('returns the usage used', async () => {
      const expectedSize = 688489878;
      (<jest.Mock>fs.stat).mockResolvedValue(
        Promise.resolve({ size: expectedSize })
      );
      const repository = new NodeFSLocalFileContentsRepository(directory);

      const result = await repository.usage();

      expect(result).toEqual(expectedSize);
    });
  });
});
