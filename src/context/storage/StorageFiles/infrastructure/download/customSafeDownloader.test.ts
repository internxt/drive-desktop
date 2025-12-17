import { Environment } from '@internxt/inxt-js';
import { downloadFileV2 } from '@internxt/inxt-js/build/lib/core/download/downloadV2';
import { customSafeDownloader } from './customSafeDownloader';
import { PassThrough, Readable } from 'node:stream';
import { Mock } from 'vitest';

vi.mock('@internxt/inxt-js/build/lib/core/download/downloadV2', () => ({
  downloadFileV2: vi.fn(),
}));

describe('customSafeDownloader', () => {
  const fileId = 'fake-file-id';
  const bucketId = 'fake-bucket-id';

  let env: Environment;

  beforeEach(() => {
    vi.clearAllMocks();

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
    (downloadFileV2 as Mock).mockReturnValue([Promise.resolve(), sourceStream]);

    const stream = customSafeDownloader(env)(bucketId, fileId);

    expect(stream).toBeInstanceOf(PassThrough);
  });

  it('should throw error if encryptionKey or bridgeUrl is missing', () => {
    env.config.encryptionKey = undefined;

    expect(() => customSafeDownloader(env)(bucketId, fileId)).toThrow('Missing required environment configuration');
  });

  it('should pipe data from source stream to passThrough', async () => {
    const sourceStream = new Readable({
      read() {
        process.nextTick(() => {
          this.push('test');
          this.push(null);
        });
      },
    });

    (downloadFileV2 as Mock).mockReturnValue([Promise.resolve(), sourceStream]);

    const stream = customSafeDownloader(env)(bucketId, fileId);

    let data = '';

    await new Promise<void>((resolve) => {
      stream.on('data', (chunk) => {
        data += chunk.toString();
      });

      stream.on('end', () => {
        expect(data).toBe('test');
        resolve();
      });
    });
  });

  it('should emit error if downloadPromise rejects', async () => {
    const sourceStream = new PassThrough();
    const error = new Error('Download failed');

    (downloadFileV2 as Mock).mockReturnValue([Promise.reject(error), sourceStream]);

    const stream = customSafeDownloader(env)(bucketId, fileId);

    await new Promise<void>((resolve) => {
      stream.on('error', (err) => {
        expect(err).toBe(error);
        resolve();
      });
    });
  });

  it('should emit error if downloadFileV2 throws synchronously', async () => {
    const syncError = new Error('Immediate failure');

    (downloadFileV2 as Mock).mockImplementation(() => {
      throw syncError;
    });

    const stream = customSafeDownloader(env)(bucketId, fileId);

    await new Promise<void>((resolve) => {
      stream.on('error', (err) => {
        expect(err).toBe(syncError);
        resolve();
      });
    });
  });
});
