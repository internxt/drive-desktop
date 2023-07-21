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
    it('creates a readable for file given an existing file name', () => {
      (<jest.Mock>createReadStream).mockResolvedValue(Readable.from(''));

      const repository = new NodeFSLocalFileContentsRepository(directory);

      const result = repository.exists('544b943d-c663-5fe3-bd89-6a52bb80880e');

      expect(result).toBe(false);
      expect((<jest.Mock>createReadStream).mock.calls[0][0]).toBe(
        '/Getziujo/Turfiri/Ipfugiri/544b943d-c663-5fe3-bd89-6a52bb80880e'
      );
    });
  });

  describe('write', () => {
    it('saves a file with the given name and override it if exists', () => {
      (<jest.Mock>fs.writeFile).mockResolvedValue(Promise.resolve);

      const repository = new NodeFSLocalFileContentsRepository(directory);

      const result = repository.write(
        '544b943d-c663-5fe3-bd89-6a52bb80880e',
        Readable.from('')
      );

      expect(result).toBe(false);
      expect((<jest.Mock>fs.writeFile).mock.calls[0]).toBe([
        '/Getziujo/Turfiri/Ipfugiri/544b943d-c663-5fe3-bd89-6a52bb80880e',
        Readable.from(''),
        { flag: 'w' },
      ]);
    });
  });
});
