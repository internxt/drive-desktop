import { Environment } from '@internxt/inxt-js';
import { Readable } from 'stream';
import { deepMocked } from '../../../../../tests/vitest/utils.helper';
import { uploadContentToEnvironment } from './upload-content-to-environment';
import * as fs from 'node:fs';
import * as safeAccessModule from '../../../../infra/local-file-system/safe-access';
import { DriveDesktopError } from '../../../../context/shared/domain/errors/DriveDesktopError';

vi.mock(import('node:fs'));
vi.mock('../../../../infra/local-file-system/safe-access', () => ({
  safeAccess: vi.fn(),
}));

describe('upload-content-to-environment', () => {
  type UploadOptions = {
    source: NodeJS.ReadableStream;
    fileSize: number;
    progressCallback: (progress: number) => void;
    abortSignal?: AbortSignal;
  };

  const createReadStreamMock = deepMocked(fs.createReadStream);
  const safeAccessMock = vi.mocked(safeAccessModule.safeAccess);

  const SMALL_SIZE = 1024;

  let environment: Environment;
  let abortController: AbortController;
  let fakeStream: Readable;
  let capturedOpts: UploadOptions | null;
  let uploadMock: ReturnType<typeof vi.fn<(bucket: string, opts: UploadOptions) => Promise<string>>>;

  beforeEach(() => {
    abortController = new AbortController();
    capturedOpts = null;
    fakeStream = Object.assign(new Readable({ read() {} }), { close: vi.fn(), destroy: vi.fn() });
    createReadStreamMock.mockReturnValue(fakeStream as ReturnType<typeof fs.createReadStream>);
    safeAccessMock.mockResolvedValue({ data: undefined });

    uploadMock = vi.fn(async (_bucket: string, opts: UploadOptions) => {
      capturedOpts = opts;
      return 'default-contents-id';
    });

    environment = {
      upload: uploadMock,
      uploadMultipartFile: vi.fn(),
    } as unknown as Environment;
  });

  function callUpload(size = SMALL_SIZE) {
    return uploadContentToEnvironment({
      path: '/some/file.txt',
      size,
      bucket: 'test-bucket',
      environment,
      signal: abortController.signal,
    });
  }

  async function startUpload(size = SMALL_SIZE) {
    const promise = callUpload(size);
    await Promise.resolve();
    return { promise };
  }

  it('should resolve with contentsId on successful upload', async () => {
    const contentsId = 'abc123';
    uploadMock.mockResolvedValue(contentsId);

    const result = await callUpload();

    expect(result.data).toBe(contentsId);
    expect(result.error).toBeUndefined();
  });

  it('should call upload with file size and abortSignal', async () => {
    uploadMock.mockImplementation(async (_bucket: string, opts: UploadOptions) => {
      capturedOpts = opts;
      return 'id';
    });

    await callUpload(SMALL_SIZE);

    expect(capturedOpts?.fileSize).toBe(SMALL_SIZE);
    expect(capturedOpts?.abortSignal).toBe(abortController.signal);
    expect(uploadMock).toHaveBeenCalled();
  });

  it('should return NOT_ENOUGH_SPACE error when upload fails with "Max space used"', async () => {
    uploadMock.mockRejectedValue(new Error('Max space used'));

    const result = await callUpload();

    expect(result.error?.cause).toBe('NOT_ENOUGH_SPACE');
  });

  it('should return RATE_LIMITED error on 429 with retry_after from message', async () => {
    const err = Object.assign(new Error(JSON.stringify({ retry_after: 10 })), { status: 429 });
    uploadMock.mockRejectedValue(err);

    const result = await callUpload();

    expect(result.error?.cause).toBe('RATE_LIMITED');
    expect(result.error?.message).toBe('10000');
  });

  it('should return RATE_LIMITED with default delay when retry_after is missing', async () => {
    const err = Object.assign(new Error('{}'), { status: 429 });
    uploadMock.mockRejectedValue(err);

    const result = await callUpload();

    expect(result.error?.cause).toBe('RATE_LIMITED');
    expect(result.error?.message).toBe('30000');
  });

  it('should return INTERNAL_SERVER_ERROR on 500+ errors', async () => {
    const err = Object.assign(new Error('Server error'), { status: 500 });
    uploadMock.mockRejectedValue(err);

    const result = await callUpload();

    expect(result.error?.cause).toBe('INTERNAL_SERVER_ERROR');
  });

  it('should return UNKNOWN error for generic errors', async () => {
    uploadMock.mockRejectedValue(new Error('Something went wrong'));

    const result = await callUpload();

    expect(result.error?.cause).toBe('UNKNOWN');
  });

  it('should return UNKNOWN error when contentsId is empty on success', async () => {
    uploadMock.mockResolvedValue('');

    const result = await callUpload();

    expect(result.error?.cause).toBe('UNKNOWN');
  });

  it('should return UNKNOWN error when createReadStream throws', async () => {
    createReadStreamMock.mockImplementation(() => {
      throw new Error('Cannot open file');
    });

    const result = await callUpload();

    expect(result.error?.cause).toBe('UNKNOWN');
  });

  it('should return the access error without starting an upload when the file is not readable', async () => {
    const accessError = new DriveDesktopError('ACTION_NOT_PERMITTED', 'permission denied');
    safeAccessMock.mockResolvedValue({ error: accessError });

    const result = await callUpload();

    expect(result.error).toBe(accessError);
    expect(createReadStreamMock).not.toHaveBeenCalled();
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it('should return ACTION_NOT_PERMITTED when createReadStream throws EACCES', async () => {
    createReadStreamMock.mockImplementation(() => {
      throw Object.assign(new Error('permission denied'), { code: 'EACCES' });
    });

    const result = await callUpload();

    expect(result.error?.cause).toBe('ACTION_NOT_PERMITTED');
    expect(safeAccessMock).toHaveBeenCalledWith({ absolutePath: '/some/file.txt' });
    expect(createReadStreamMock).toHaveBeenCalledWith('/some/file.txt');
    expect(uploadMock).not.toHaveBeenCalled();
    expect(result.data).toBeUndefined();
  });

  it('should return ACTION_NOT_PERMITTED when the read stream emits EACCES', async () => {
    uploadMock.mockImplementation(
      async (_bucket: string, opts: UploadOptions) =>
        await new Promise<string>((_resolve, reject) => {
          opts.source.once('error', reject);
        }),
    );

    const { promise } = await startUpload();

    fakeStream.emit('error', Object.assign(new Error('permission denied'), { code: 'EACCES' }));

    const result = await promise;

    expect(result.error?.cause).toBe('ACTION_NOT_PERMITTED');
    expect(safeAccessMock).toHaveBeenCalledWith({ absolutePath: '/some/file.txt' });
    expect(createReadStreamMock).toHaveBeenCalledWith('/some/file.txt');
    expect(uploadMock).toHaveBeenCalledTimes(1);
    expect(result.data).toBeUndefined();
  });

  it('should abort the upload and destroy the stream when signal is aborted', async () => {
    uploadMock.mockImplementation(
      async (_bucket: string, opts: UploadOptions) =>
        await new Promise<string>((_resolve, reject) => {
          opts.abortSignal?.addEventListener(
            'abort',
            () => {
              reject(new Error('aborted'));
            },
            { once: true },
          );
        }),
    );

    const { promise } = await startUpload();
    abortController.abort();
    await promise;

    expect(fakeStream.destroy).toHaveBeenCalled();
  });
});
