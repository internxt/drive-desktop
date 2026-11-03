import * as addGeneralIssue from '@/apps/main/background-processes/issues';
import { LocalSync } from '@/backend/features';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { processError } from './process-error';

describe('process-error', () => {
  const addItemMock = partialSpyOn(LocalSync.SyncState, 'addItem');
  const addGeneralIssueMock = partialSpyOn(addGeneralIssue, 'addGeneralIssue');
  const setUploadIssueMock = partialSpyOn(addGeneralIssue, 'setUploadIssue');

  let props: Parameters<typeof processError>[0];

  beforeEach(() => {
    props = mockProps<typeof processError>({ ctx: { kind: 'sync' }, path: abs('/file.mp4') });
  });

  it('should return an aborted error and do nothing else if aborted', () => {
    // Given
    props.error = new DOMException('The operation was aborted', 'AbortError');
    // When
    const error = processError(props);
    // Then
    expect(error.code).toBe('ABORTED');
    calls(addItemMock).toHaveLength(0);
    calls(setUploadIssueMock).toHaveLength(0);
  });

  it('should add general issue if max space used', () => {
    // Given
    props.error = new Error('Max space used');
    // When
    processError(props);
    // Then
    call(addGeneralIssueMock).toMatchObject({ error: 'NOT_ENOUGH_SPACE' });
  });

  it.each([
    'read ECONNRESET',
    'Request failed with status code 409',
    'Request failed with status code 500',
    'Request failed with status code 502',
  ])('should return a retryable error in case of server unavailable', (message) => {
    // Given
    props.error = new Error(message);
    // When
    const error = processError(props);
    // Then
    expect(error.code).toBe('RETRYABLE');
    call(addGeneralIssueMock).toMatchObject({ error: 'NETWORK_CONNECTIVITY_ERROR' });
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
  ])('should return a retryable error for a connection cut by its code: $message', ({ message, code }) => {
    // Given
    props.error = Object.assign(new Error(message), { code });
    // When
    const error = processError(props);
    // Then
    expect(error.code).toBe('RETRYABLE');
    call(addGeneralIssueMock).toMatchObject({ error: 'NETWORK_CONNECTIVITY_ERROR' });
  });

  it.each([
    { message: 'Headers Timeout Error', code: 'UND_ERR_HEADERS_TIMEOUT' },
    { message: 'write EPIPE', code: 'EPIPE' },
    { message: 'other side closed', code: 'UND_ERR_SOCKET' },
  ])('should not retry $code', ({ message, code }) => {
    // Given
    props.error = Object.assign(new Error(message), { code });
    // When
    const error = processError(props);
    // Then
    expect(error.code).toBe('FAILED');
  });

  it('should add an upload issue when a file of the sync folder is not retried', () => {
    // Given
    props.error = Object.assign(new Error('Headers Timeout Error'), { code: 'UND_ERR_HEADERS_TIMEOUT' });
    // When
    processError(props);
    // Then
    call(setUploadIssueMock).toStrictEqual({ path: props.path, error: 'UPLOAD_FAILED' });
  });

  it('should add an upload issue if the error is not an Error', () => {
    // Given
    props.error = 'unknown';
    // When
    processError(props);
    // Then
    call(setUploadIssueMock).toStrictEqual({ path: props.path, error: 'UPLOAD_FAILED' });
  });

  it('should add a backups upload issue instead of a sync one for backups', () => {
    // Given
    const addIssue = vi.fn();
    props = mockProps<typeof processError>({ ctx: { kind: 'backups', addIssue }, path: abs('/file.mp4') });
    props.error = Object.assign(new Error('connect ETIMEDOUT'), { code: 'ETIMEDOUT' });
    // When
    processError(props);
    // Then
    call(addIssue).toStrictEqual({ error: 'UPLOAD_FAILED', name: props.path });
    calls(setUploadIssueMock).toHaveLength(0);
  });

  it('should not retry the S3 request timeout', () => {
    // Given
    props.error = new Error('Failed to upload part: 400 <Error><Code>RequestTimeout</Code></Error>');
    // When
    const error = processError(props);
    // Then
    expect(error.code).toBe('FAILED');
  });

  it('should not retry an error that is not retryable', () => {
    // Given
    props.error = new Error('Request failed with status code 404');
    // When
    const error = processError(props);
    // Then
    expect(error.code).toBe('FAILED');
  });

  it('should handle unknown error', () => {
    // Given
    props.error = 'unknown';
    // When
    processError(props);
    // Then
    expect(loggerMock.sentryError).toHaveBeenCalledWith(
      expect.objectContaining({ msg: 'Failed to upload file to the bucket' }),
      expect.any(Object),
    );
    call(addItemMock).toMatchObject({ action: 'UPLOAD_ERROR' });
  });
});
