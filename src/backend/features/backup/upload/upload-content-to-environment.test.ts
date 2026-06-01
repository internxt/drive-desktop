import { Environment } from '@internxt/inxt-js';
import { UploadOptions } from '@internxt/inxt-js/build/lib/core';
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
  const createReadStreamMock = deepMocked(fs.createReadStream);
  const safeAccessMock = vi.mocked(safeAccessModule.safeAccess);

  const SMALL_SIZE = 1024;
  const LARGE_SIZE = 200 * 1024 * 1024; // > 100MB threshold

  let environment: Environment;
  let abortController: AbortController;
  let fakeStream: Readable;
  let capturedOpts: UploadOptions;

  function makeActionState() {
    return { stop: vi.fn() };
  }

  function makeUploadFn(actionState = makeActionState()) {
    return vi.fn((_bucket: string, opts: UploadOptions) => {
      capturedOpts = opts;
      return actionState;
    });
  }

  beforeEach(() => {
    abortController = new AbortController();
    capturedOpts = undefined as unknown as UploadOptions;
    fakeStream = Object.assign(new Readable({ read() {} }), { close: vi.fn(), destroy: vi.fn() });
    createReadStreamMock.mockReturnValue(fakeStream as ReturnType<typeof fs.createReadStream>);
    safeAccessMock.mockResolvedValue({ data: undefined });

    environment = {
      upload: makeUploadFn(),
      uploadMultipartFile: makeUploadFn(),
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
    await Promise.resolve();
    await Promise.resolve();
    return { promise };
  }

  function triggerFinished(err: Error | null, contentsId: string | null) {
    capturedOpts.finishedCallback(err, contentsId);
  }

  it('should resolve with contentsId on successful upload', async () => {
    const contentsId = 'abc123';
    const { promise } = await startUpload();
    expect(capturedOpts).toBeDefined();
    triggerFinished(null, contentsId);

    const result = await promise;

    expect(result.data).toBe(contentsId);
    expect(result.error).toBeUndefined();
  });

  it('should use upload for files below multipart threshold', async () => {
    const { promise } = await startUpload(SMALL_SIZE);
    triggerFinished(null, 'id');

    await promise;

    expect(environment.upload).toHaveBeenCalled();
    expect(environment.uploadMultipartFile).not.toHaveBeenCalled();
  });

  it('should use uploadMultipartFile for files above multipart threshold', async () => {
    const { promise } = await startUpload(LARGE_SIZE);
    triggerFinished(null, 'id');

    await promise;

    expect(environment.uploadMultipartFile).toHaveBeenCalled();
    expect(environment.upload).not.toHaveBeenCalled();
  });

  it('should return NOT_ENOUGH_SPACE error when upload fails with "Max space used"', async () => {
    const { promise } = await startUpload();
    triggerFinished(new Error('Max space used'), null);

    const result = await promise;

    expect(result.error?.cause).toBe('NOT_ENOUGH_SPACE');
  });

  it('should return RATE_LIMITED error on 429 with retry_after from message', async () => {
    const { promise } = await startUpload();
    const err = Object.assign(new Error(JSON.stringify({ retry_after: 10 })), { status: 429 });
    triggerFinished(err, null);

    const result = await promise;

    expect(result.error?.cause).toBe('RATE_LIMITED');
    expect(result.error?.message).toBe('10000');
  });

  it('should return RATE_LIMITED with default delay when retry_after is missing', async () => {
    const { promise } = await startUpload();
    const err = Object.assign(new Error('{}'), { status: 429 });
    triggerFinished(err, null);

    const result = await promise;

    expect(result.error?.cause).toBe('RATE_LIMITED');
    expect(result.error?.message).toBe('30000');
  });

  it('should return INTERNAL_SERVER_ERROR on 500+ errors', async () => {
    const { promise } = await startUpload();
    const err = Object.assign(new Error('Server error'), { status: 500 });
    triggerFinished(err, null);

    const result = await promise;

    expect(result.error?.cause).toBe('INTERNAL_SERVER_ERROR');
  });

  it('should return UNKNOWN error for generic errors', async () => {
    const { promise } = await startUpload();
    triggerFinished(new Error('Something went wrong'), null);

    const result = await promise;

    expect(result.error?.cause).toBe('UNKNOWN');
  });

  it('should return UNKNOWN error when contentsId is null on success', async () => {
    const { promise } = await startUpload();
    triggerFinished(null, null);

    const result = await promise;

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
    expect(environment.upload).not.toHaveBeenCalled();
    expect(environment.uploadMultipartFile).not.toHaveBeenCalled();
  });

  it('should return ACTION_NOT_PERMITTED when createReadStream throws EACCES', async () => {
    createReadStreamMock.mockImplementation(() => {
      throw Object.assign(new Error('permission denied'), { code: 'EACCES' });
    });

    const result = await callUpload();

    expect(result.error?.cause).toBe('ACTION_NOT_PERMITTED');
    expect(safeAccessMock).toHaveBeenCalledWith({ absolutePath: '/some/file.txt' });
    expect(createReadStreamMock).toHaveBeenCalledWith('/some/file.txt');
    expect(environment.upload).not.toHaveBeenCalled();
    expect(environment.uploadMultipartFile).not.toHaveBeenCalled();
    expect(result.data).toBeUndefined();
  });

  it('should return ACTION_NOT_PERMITTED when the read stream emits EACCES', async () => {
    const { promise } = await startUpload();

    fakeStream.emit('error', Object.assign(new Error('permission denied'), { code: 'EACCES' }));
    triggerFinished(null, 'contents-id-after-stream-error');

    const result = await promise;

    expect(result.error?.cause).toBe('ACTION_NOT_PERMITTED');
    expect(safeAccessMock).toHaveBeenCalledWith({ absolutePath: '/some/file.txt' });
    expect(createReadStreamMock).toHaveBeenCalledWith('/some/file.txt');
    expect(environment.upload).toHaveBeenCalledTimes(1);
    expect(environment.uploadMultipartFile).not.toHaveBeenCalled();
    expect(result.data).toBeUndefined();
  });

  it('should stop the upload and destroy the stream when signal is aborted', async () => {
    const actionState = makeActionState();
    (environment.upload as unknown as ReturnType<typeof makeUploadFn>) = makeUploadFn(actionState);

    await startUpload();
    abortController.abort();

    expect(actionState.stop).toHaveBeenCalled();
    expect(fakeStream.destroy).toHaveBeenCalled();
  });
});
