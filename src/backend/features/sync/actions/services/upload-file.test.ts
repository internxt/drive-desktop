import { FileSizeLimitModule } from '@internxt/drive-desktop-core/build/backend';
import Bottleneck from 'bottleneck';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import * as util from '@/apps/main/util';
import * as isTemporaryFile from '@/apps/utils/isTemporalFile';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as originalFs from '@/infra/file-system/original-fs';
import * as environmentFileUpload from '@/infra/inxt-js/file-uploader/environment-file-uploader';
import { UploadFileError } from '@/infra/inxt-js/file-uploader/process-error';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as handleFileUploadSizeExceeded from '../../../user/file-size-limit/handle-file-upload-size-exceeded';
import { uploadFile } from './upload-file';
import * as waitUntilReady from './wait-until-ready';

describe('upload-file', () => {
  const statMock = partialSpyOn(originalFs, 'stat');
  const waitUntilReadyMock = partialSpyOn(waitUntilReady, 'waitUntilReady');
  const isTemporaryFileMock = partialSpyOn(isTemporaryFile, 'isTemporaryFile');
  const environmentFileUploadMock = partialSpyOn(environmentFileUpload, 'environmentFileUpload');
  const handleFileUploadSizeExceededMock = partialSpyOn(handleFileUploadSizeExceeded, 'handleFileUploadSizeExceeded');
  const checkUploadFileSizeMock = partialSpyOn(FileSizeLimitModule, 'checkUploadFileSize');
  const sleepMock = partialSpyOn(util, 'sleep');

  const path = abs('/file.txt');
  const size = 1024;
  const mtime = new Date('2000-01-01T00:00:00.000Z');
  const birthtime = new Date('1999-01-01T00:00:00.000Z');
  let props: Parameters<typeof uploadFile>[0];

  beforeEach(() => {
    statMock.mockResolvedValue({ size, mtime, birthtime });
    isTemporaryFileMock.mockReturnValue(false);
    waitUntilReadyMock.mockResolvedValue({ data: true });
    environmentFileUploadMock.mockResolvedValue({ data: 'contentsId' as ContentsId });
    checkUploadFileSizeMock.mockResolvedValue({ allowed: true });

    props = mockProps<typeof uploadFile>({
      ctx: { uploadBottleneck: new Bottleneck(), logger: loggerMock },
      path,
    });
  });

  it('should return undefined if file is locked', async () => {
    // Given
    waitUntilReadyMock.mockResolvedValue({ error: new waitUntilReady.WaitUntilReadyError('MAX_TIMEOUT') });
    // When
    const res = await uploadFile(props);
    // Then
    expect(res).toBeUndefined();
    call(loggerMock.error).toMatchObject({ msg: 'Wait until ready, timeout', path, reason: 'MAX_TIMEOUT' });
    calls(environmentFileUploadMock).toHaveLength(0);
    calls(handleFileUploadSizeExceededMock).toHaveLength(0);
  });

  it('should add a backups issue if a backup file is locked', async () => {
    // Given
    const addIssue = vi.fn();
    props = mockProps<typeof uploadFile>({ ctx: { kind: 'backups', addIssue, logger: loggerMock }, path });
    waitUntilReadyMock.mockResolvedValue({ error: new waitUntilReady.WaitUntilReadyError('IDLE_TIMEOUT') });
    // When
    await uploadFile(props);
    // Then
    call(addIssue).toStrictEqual({ error: 'FILE_NOT_READY', name: path });
  });

  it('should not add a backups issue if a backup file no longer exists', async () => {
    // Given
    const addIssue = vi.fn();
    props = mockProps<typeof uploadFile>({ ctx: { kind: 'backups', addIssue, logger: loggerMock }, path });
    waitUntilReadyMock.mockResolvedValue({ error: new waitUntilReady.WaitUntilReadyError('NON_EXISTS') });
    // When
    await uploadFile(props);
    // Then
    calls(addIssue).toHaveLength(0);
  });

  it('should return empty contents id if the file is empty', async () => {
    // Given
    statMock.mockResolvedValue({ size: 0, mtime, birthtime });
    // When
    const res = await uploadFile(props);
    // Then
    expect(res).toStrictEqual({ contentsId: undefined, size: 0, mtime, creationTime: birthtime });
    calls(environmentFileUploadMock).toHaveLength(0);
  });

  it('should return undefined if the file exceeds the plan limit', async () => {
    // Given
    statMock.mockResolvedValue({ size: 6, mtime, birthtime });
    checkUploadFileSizeMock.mockResolvedValue({ allowed: false, reason: 'PLAN_LIMIT_EXCEEDED', maxFileSize: 5, showUpgradeCta: true });
    // When
    const res = await uploadFile(props);
    // Then
    expect(res).toBeUndefined();
    calls(environmentFileUploadMock).toHaveLength(0);
    call(handleFileUploadSizeExceededMock).toStrictEqual({
      path,
      validation: {
        allowed: false,
        reason: 'PLAN_LIMIT_EXCEEDED',
        maxFileSize: 5,
        showUpgradeCta: true,
      },
      size: 6,
    });
  });

  it('should return undefined if upload fails', async () => {
    // Given
    environmentFileUploadMock.mockResolvedValue({ error: new UploadFileError('FAILED') });
    // When
    const res = await uploadFile(props);
    // Then
    expect(res).toBeUndefined();
    call(environmentFileUploadMock).toMatchObject({ path, size });
    calls(sleepMock).toHaveLength(0);
  });

  it('should return undefined if bottleneck stops', async () => {
    // Given
    await props.ctx.uploadBottleneck.stop();
    // When
    const res = await uploadFile(props);
    // Then
    expect(res).toBeUndefined();
    calls(environmentFileUploadMock).toHaveLength(0);
  });

  it('should return contents id if upload success', async () => {
    // Given
    environmentFileUploadMock.mockResolvedValue({ data: 'contentsId' as ContentsId });
    // When
    const res = await uploadFile(props);
    // Then
    expect(res).toStrictEqual({ contentsId: 'contentsId', size, mtime, creationTime: birthtime });
    call(checkUploadFileSizeMock).toMatchObject({ size });
    call(environmentFileUploadMock).toMatchObject({ path, size });
  });

  it('should upload the first attempt with the default priority', async () => {
    // Given
    const scheduleMock = vi.spyOn(props.ctx.uploadBottleneck, 'schedule');
    // When
    await uploadFile(props);
    // Then
    expect(scheduleMock.mock.calls[0][0]).toStrictEqual({ priority: 5 });
    call(environmentFileUploadMock).toMatchObject({ path, size, attempt: 1 });
  });

  it('should upload a retry with a lower priority', async () => {
    // Given
    const scheduleMock = vi.spyOn(props.ctx.uploadBottleneck, 'schedule');
    // When
    await uploadFile({ ...props, attempt: 2 });
    // Then
    expect(scheduleMock.mock.calls[0][0]).toStrictEqual({ priority: 9 });
    call(environmentFileUploadMock).toMatchObject({ attempt: 2 });
  });

  it('should hand a retryable error to retryLater without waiting', async () => {
    // Given
    const retryLater = vi.fn();
    environmentFileUploadMock.mockResolvedValue({ error: new UploadFileError('RETRYABLE') });
    // When
    const res = await uploadFile({ ...props, retryLater });
    // Then
    expect(res).toBeUndefined();
    call(retryLater).toStrictEqual({ attempt: 2, delayMs: 5000 });
    calls(environmentFileUploadMock).toHaveLength(1);
    calls(sleepMock).toHaveLength(0);
  });

  it('should double the delay of each retry up to one minute', async () => {
    // Given
    const retryLater = vi.fn();
    environmentFileUploadMock.mockResolvedValue({ error: new UploadFileError('RETRYABLE') });
    // When
    await uploadFile({ ...props, attempt: 2, retryLater });
    await uploadFile({ ...props, attempt: 5, retryLater });
    // Then
    calls(retryLater).toStrictEqual([
      { attempt: 3, delayMs: 10000 },
      { attempt: 6, delayMs: 60000 },
    ]);
  });

  it('should wait and retry with a lower priority if there is no retryLater', async () => {
    // Given
    const scheduleMock = vi.spyOn(props.ctx.uploadBottleneck, 'schedule');
    environmentFileUploadMock
      .mockResolvedValueOnce({ error: new UploadFileError('RETRYABLE') })
      .mockResolvedValueOnce({ error: new UploadFileError('RETRYABLE') })
      .mockResolvedValueOnce({ data: 'contentsId' as ContentsId });
    // When
    const res = await uploadFile(props);
    // Then
    expect(res).toStrictEqual({ contentsId: 'contentsId', size, mtime, creationTime: birthtime });
    calls(sleepMock).toStrictEqual([5000, 10000]);
    expect(scheduleMock.mock.calls.map(([options]) => options)).toStrictEqual([{ priority: 5 }, { priority: 9 }, { priority: 9 }]);
  });

  it('should not retry an error that is not retryable', async () => {
    // Given
    const retryLater = vi.fn();
    environmentFileUploadMock.mockResolvedValue({ error: new UploadFileError('FAILED') });
    // When
    await uploadFile({ ...props, retryLater });
    // Then
    calls(retryLater).toHaveLength(0);
    calls(environmentFileUploadMock).toHaveLength(1);
  });

  describe('when a few files keep failing', () => {
    const failingPaths = Array.from({ length: 4 }, (_, i) => abs(`/big-${i}.db`));
    const normalPaths = Array.from({ length: 12 }, (_, i) => abs(`/file-${i}.txt`));
    const failuresPerFile = 5;
    let finished: string[];

    beforeEach(() => {
      finished = [];
      const failures = new Map<string, number>();
      sleepMock.mockImplementation(() => new Promise((resolve) => setImmediate(resolve)));
      environmentFileUploadMock.mockImplementation(async ({ path }) => {
        await new Promise((resolve) => setImmediate(resolve));
        const count = failures.get(path) ?? 0;
        if (failingPaths.includes(path) && count < failuresPerFile) {
          failures.set(path, count + 1);
          return { error: new UploadFileError('RETRYABLE') };
        }
        return { data: 'contentsId' as ContentsId };
      });
      props.ctx = { ...props.ctx, uploadBottleneck: new Bottleneck({ maxConcurrent: 4 }) };
    });

    async function upload({ path }: { path: (typeof failingPaths)[number] }) {
      await uploadFile({ ...props, path });
      finished.push(path);
    }

    it('should upload the other files while the failing ones are still retrying', async () => {
      // When
      const failing = failingPaths.map((path) => upload({ path }));
      await new Promise((resolve) => setTimeout(resolve, 0));
      await Promise.all([...failing, ...normalPaths.map((path) => upload({ path }))]);
      // Then
      const lastNormal = Math.max(...normalPaths.map((path) => finished.indexOf(path)));
      const firstFailing = Math.min(...failingPaths.map((path) => finished.indexOf(path)));
      expect(lastNormal).toBeLessThan(firstFailing);
    });
  });
});
