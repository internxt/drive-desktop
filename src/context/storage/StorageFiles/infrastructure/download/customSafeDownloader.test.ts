import { Environment } from '@internxt/inxt-js';
import { downloadFileV2 } from '@internxt/inxt-js/build/lib/core/download/downloadV2';
import { customSafeDownloader } from './customSafeDownloader';
import { PassThrough, Readable } from 'node:stream';

jest.mock('@internxt/inxt-js/build/lib/core/download/downloadV2', () => ({
  downloadFileV2: jest.fn(),
}));

describe('customSafeDownloader', () => {
  const fileId = 'fake-file-id';
  const bucketId = 'fake-bucket-id';

  let env: Environment;

  beforeEach(() => {
    jest.clearAllMocks();

    env = {
      config: {
        bridgeUrl: 'mock-url',
        bridgeUser: 'mock-user',
        bridgePass: 'mock-pass',
        encryptionKey: 'mock-key',
      },
    } as Environment;
  });

  it('should return a PassThrough stream', () => {
    const sourceStream = new PassThrough(); // ✅ válido y seguro
    (downloadFileV2 as jest.Mock).mockReturnValue([
      Promise.resolve(),
      sourceStream,
    ]);

    const stream = customSafeDownloader(env)(bucketId, fileId);

    expect(stream).toBeInstanceOf(PassThrough);
  });

  it('should throw error if encryptionKey or bridgeUrl is missing', () => {
    env.config.encryptionKey = undefined;

    expect(() => customSafeDownloader(env)(bucketId, fileId)).toThrow(
      'Missing required environment configuration'
    );
  });

  it('should pipe data from source stream to passThrough', (done) => {
    const sourceStream = new Readable({
      read() {
        process.nextTick(() => {
          this.push('test');
          this.push(null);
        });
      },
    });

    (downloadFileV2 as jest.Mock).mockReturnValue([
      Promise.resolve(),
      sourceStream,
    ]);

    const stream = customSafeDownloader(env)(bucketId, fileId);

    let data = '';
    stream.on('data', (chunk) => {
      data += chunk.toString();
    });

    stream.on('end', () => {
      expect(data).toBe('test');
      done();
    });
  });

  it('should emit error if downloadPromise rejects', (done) => {
    const sourceStream = new PassThrough();
    const error = new Error('Download failed');

    (downloadFileV2 as jest.Mock).mockReturnValue([
      Promise.reject(error),
      sourceStream,
    ]);

    const stream = customSafeDownloader(env)(bucketId, fileId);

    stream.on('error', (err) => {
      expect(err).toBe(error);
      done();
    });

    // Trigger downloadPromise.catch
    setTimeout(() => {
      /* no-op */
    }, 0);
  });

  it('should emit error if downloadFileV2 throws synchronously', (done) => {
    const syncError = new Error('Immediate failure');

    (downloadFileV2 as jest.Mock).mockImplementation(() => {
      throw syncError;
    });

    const stream = customSafeDownloader(env)(bucketId, fileId);

    stream.on('error', (err) => {
      expect(err).toBe(syncError);
      done();
    });
  });
});
