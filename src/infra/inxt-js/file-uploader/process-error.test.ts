import * as addGeneralIssue from '@/apps/main/background-processes/issues';
import * as sleep from '@/apps/main/util';
import { LocalSync } from '@/backend/features';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { processError } from './process-error';

describe('process-error', () => {
  const addItemMock = partialSpyOn(LocalSync.SyncState, 'addItem');
  const addGeneralIssueMock = partialSpyOn(addGeneralIssue, 'addGeneralIssue');
  const sleepMock = partialSpyOn(sleep, 'sleep');
  const setUploadIssueMock = partialSpyOn(addGeneralIssue, 'setUploadIssue');

  const retryFn = vi.fn();
  const sleepMs = 5000;
  let props: Parameters<typeof processError>[0];

  beforeEach(() => {
    props = mockProps<typeof processError>({ ctx: { kind: 'sync' }, path: abs('/file.mp4'), retryFn, sleepMs });
  });

  it('should not do anything if aborted', async () => {
    // Given
    props.error = new DOMException('The operation was aborted', 'AbortError');
    // When
    await processError(props);
    // Then
    calls(addItemMock).toHaveLength(0);
    calls(setUploadIssueMock).toHaveLength(0);
  });

  it('should add general issue if max space used', async () => {
    // Given
    props.error = new Error('Max space used');
    // When
    await processError(props);
    // Then
    call(addGeneralIssueMock).toMatchObject({ error: 'NOT_ENOUGH_SPACE' });
  });

  it.each([
    'read ECONNRESET',
    'Request failed with status code 409',
    'Request failed with status code 500',
    'Request failed with status code 502',
  ])('should retry in case of server unavailable', async (message) => {
    // Given
    props.error = new Error(message);
    // When
    await processError(props);
    // Then
    call(addGeneralIssueMock).toMatchObject({ error: 'NETWORK_CONNECTIVITY_ERROR' });
    call(sleepMock).toStrictEqual(sleepMs);
    calls(retryFn).toHaveLength(1);
    calls(setUploadIssueMock).toHaveLength(0);
  });

  it.each([
    { message: 'write ECONNRESET', code: 'ECONNRESET' },
    { message: 'socket hang up', code: 'ECONNRESET' },
    { message: 'Client network socket disconnected before secure TLS connection was established', code: 'ECONNRESET' },
    {
      message: 'Connect Timeout Error (attempted address: s3.gra.io.cloud.ovh.net:443, timeout: 10000ms)',
      code: 'UND_ERR_CONNECT_TIMEOUT',
    },
    { message: 'getaddrinfo ENOTFOUND gateway.internxt.com', code: 'ENOTFOUND' },
  ])('should retry a connection cut by its code: $message', async ({ message, code }) => {
    // Given
    props.error = Object.assign(new Error(message), { code });
    // When
    await processError(props);
    // Then
    call(addGeneralIssueMock).toMatchObject({ error: 'NETWORK_CONNECTIVITY_ERROR' });
    calls(retryFn).toHaveLength(1);
  });

  it.each([
    { message: 'Headers Timeout Error', code: 'UND_ERR_HEADERS_TIMEOUT' },
    { message: 'write EPIPE', code: 'EPIPE' },
    { message: 'other side closed', code: 'UND_ERR_SOCKET' },
  ])('should not retry $code', async ({ message, code }) => {
    // Given
    props.error = Object.assign(new Error(message), { code });
    // When
    await processError(props);
    // Then
    calls(retryFn).toHaveLength(0);
  });

  it('should add an upload issue when a file of the sync folder is not retried', async () => {
    // Given
    props.error = Object.assign(new Error('Headers Timeout Error'), { code: 'UND_ERR_HEADERS_TIMEOUT' });
    // When
    await processError(props);
    // Then
    call(setUploadIssueMock).toStrictEqual({ path: props.path, error: 'UPLOAD_FAILED' });
  });

  it('should add an upload issue if the error is not an Error', async () => {
    // Given
    props.error = 'unknown';
    // When
    await processError(props);
    // Then
    call(setUploadIssueMock).toStrictEqual({ path: props.path, error: 'UPLOAD_FAILED' });
  });

  it('should add a backups upload issue instead of a sync one for backups', async () => {
    // Given
    const addIssue = vi.fn();
    props = mockProps<typeof processError>({ ctx: { kind: 'backups', addIssue }, path: abs('/file.mp4'), retryFn, sleepMs });
    props.error = Object.assign(new Error('connect ETIMEDOUT'), { code: 'ETIMEDOUT' });
    // When
    await processError(props);
    // Then
    call(addIssue).toStrictEqual({ error: 'UPLOAD_FAILED', name: props.path });
    calls(setUploadIssueMock).toHaveLength(0);
    calls(retryFn).toHaveLength(0);
  });

  it('should not retry the S3 request timeout', async () => {
    // Given
    props.error = new Error('Failed to upload part: 400 <Error><Code>RequestTimeout</Code></Error>');
    // When
    await processError(props);
    // Then
    calls(retryFn).toHaveLength(0);
  });

  it('should not retry an error that is not retryable', async () => {
    // Given
    props.error = new Error('Request failed with status code 404');
    // When
    await processError(props);
    // Then
    calls(retryFn).toHaveLength(0);
  });

  it('should handle unknown error', async () => {
    // Given
    props.error = 'unknown';
    // When
    await processError(props);
    // Then
    expect(loggerMock.sentryError).toHaveBeenCalledWith(
      expect.objectContaining({ msg: 'Failed to upload file to the bucket' }),
      expect.any(Object),
    );
    call(addItemMock).toMatchObject({ action: 'UPLOAD_ERROR' });
  });
});
