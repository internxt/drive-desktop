import Bottleneck from 'bottleneck';
import { stat } from 'node:fs/promises';
import { electronStore } from '@/apps/main/config';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import * as isTemporaryFile from '@/apps/utils/isTemporalFile';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as environmentFileUpload from '@/infra/inxt-js/file-uploader/environment-file-uploader';
import { call, calls, deepMocked, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT } from '../../../user/file-size-limit';
import * as handleFileUploadSizeExceeded from '../../../user/file-size-limit/handle-file-upload-size-exceeded';
import { uploadFile } from './upload-file';
import * as waitUntilReady from './wait-until-ready';

vi.mock(import('node:fs/promises'));

describe('upload-file', () => {
  const statMock = deepMocked(stat);
  const waitUntilReadyMock = partialSpyOn(waitUntilReady, 'waitUntilReady');
  const isTemporaryFileMock = partialSpyOn(isTemporaryFile, 'isTemporaryFile');
  const environmentFileUploadMock = partialSpyOn(environmentFileUpload, 'environmentFileUpload');
  const handleFileUploadSizeExceededMock = partialSpyOn(handleFileUploadSizeExceeded, 'handleFileUploadSizeExceeded');
  const electronStoreGetMock = partialSpyOn(electronStore, 'get');

  const path = abs('/file.txt');
  const size = 1024;
  const mtime = new Date('2000-01-01T00:00:00.000Z');
  const birthtime = new Date('1999-01-01T00:00:00.000Z');
  let props: Parameters<typeof uploadFile>[0];

  beforeEach(() => {
    statMock.mockResolvedValue({ size, mtime, birthtime });
    isTemporaryFileMock.mockReturnValue(false);
    waitUntilReadyMock.mockResolvedValue(true);
    environmentFileUploadMock.mockResolvedValue('contentsId' as ContentsId);
    electronStoreGetMock.mockReturnValue(0);

    props = mockProps<typeof uploadFile>({
      ctx: { uploadBottleneck: new Bottleneck() },
      path,
    });
  });

  it('should return undefined if file is locked', async () => {
    // Given
    waitUntilReadyMock.mockResolvedValue(false);
    // When
    const res = await uploadFile(props);
    // Then
    expect(res).toBeUndefined();
    calls(environmentFileUploadMock).toHaveLength(0);
    calls(handleFileUploadSizeExceededMock).toHaveLength(0);
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

  it('should return undefined if the file exceeds stored plan limit', async () => {
    // Given
    statMock.mockResolvedValue({ size: 6, mtime, birthtime });
    electronStoreGetMock.mockReturnValue(5);
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

  it('should return undefined if the file exceeds absolute upload cap', async () => {
    // Given
    statMock.mockResolvedValue({ size: ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT + 1, mtime, birthtime });
    // When
    const res = await uploadFile(props);
    // Then
    expect(res).toBeUndefined();
    calls(environmentFileUploadMock).toHaveLength(0);
    call(handleFileUploadSizeExceededMock).toStrictEqual({
      path,
      validation: {
        allowed: false,
        reason: 'ABSOLUTE_CAP_EXCEEDED',
        maxFileSize: ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT,
        showUpgradeCta: false,
      },
      size: ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT + 1,
    });
  });

  it('should return undefined if upload fails', async () => {
    // Given
    environmentFileUploadMock.mockResolvedValue(undefined);
    // When
    const res = await uploadFile(props);
    // Then
    expect(res).toBeUndefined();
    call(environmentFileUploadMock).toMatchObject({ path, size });
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
    environmentFileUploadMock.mockResolvedValue('contentsId' as ContentsId);
    // When
    const res = await uploadFile(props);
    // Then
    expect(res).toStrictEqual({ contentsId: 'contentsId', size, mtime, creationTime: birthtime });
    call(environmentFileUploadMock).toMatchObject({ path, size });
  });
});
