import { partialSpyOn } from '../../../../../tests/vitest/utils.helper';
import { DriveDesktopError } from '../../../../context/shared/domain/errors/DriveDesktopError';
import { DriveServerError } from '../../../../infra/drive-server/drive-server.error';
import { updateFileToBackup, UpdateFileParams } from './update-file-to-backup';
import * as uploadContentToEnvironmentModule from './upload-content-to-environment';
import * as overrideFileModule from '../../../../infra/drive-server/services/files/services/override-file';
import { BucketEntryIdMother } from '../../../../context/virtual-drive/shared/domain/__test-helpers__/BucketEntryIdMother';
import { UuidMother } from '../../../../context/shared/domain/__test-helpers__/UuidMother';
import { Environment } from '@internxt/inxt-js';
import configStore from '../../../../apps/main/config';
import * as maxFileSizeRejectionModule from '../../user/file-size-limit/add-max-file-size-rejection';

describe('update-file-to-backup', () => {
  const uploadContentMock = partialSpyOn(uploadContentToEnvironmentModule, 'uploadContentToEnvironment');
  const overrideFileMock = partialSpyOn(overrideFileModule, 'overrideFile');
  const configGetMock = partialSpyOn(configStore, 'get');
  const addMaxFileSizeRejectionMock = partialSpyOn(maxFileSizeRejectionModule, 'addMaxFileSizeRejection');

  let abortController: AbortController;

  const baseParams: UpdateFileParams = {
    path: '/backup/file.txt',
    size: 1024,
    bucket: 'bucket',
    fileUuid: UuidMother.primitive(),
    environment: {} as Environment,
    signal: new AbortController().signal,
  };

  beforeEach(() => {
    abortController = new AbortController();
    configGetMock.mockReturnValue(0);
    addMaxFileSizeRejectionMock.mockClear();
  });

  it('should update file successfully', async () => {
    uploadContentMock.mockResolvedValue({ data: BucketEntryIdMother.primitive() });
    overrideFileMock.mockResolvedValue({ data: true });

    const result = await updateFileToBackup({ ...baseParams, signal: abortController.signal });

    expect(result.data).toBeUndefined();
    expect(result.error).toBeUndefined();
  });

  it('should skip file update when local upload size validation fails', async () => {
    configGetMock.mockReturnValue(100);

    const result = await updateFileToBackup({ ...baseParams, size: 101, signal: abortController.signal });

    expect(result).toStrictEqual({ data: undefined });
    expect(uploadContentMock).not.toHaveBeenCalled();
    expect(overrideFileMock).not.toHaveBeenCalled();
    expect(addMaxFileSizeRejectionMock).toHaveBeenCalledWith({
      path: baseParams.path,
      fileSize: 101,
      validation: { allowed: false, reason: 'PLAN_LIMIT_EXCEEDED', maxFileSize: 100, showUpgradeCta: true },
      blockUploadPath: false,
    });
  });

  it('should return ABORTED error when signal is already aborted', async () => {
    abortController.abort();

    const result = await updateFileToBackup({ ...baseParams, signal: abortController.signal });

    expect(result.error?.cause).toBe('ABORTED');
    expect(uploadContentMock).not.toHaveBeenCalled();
  });

  it('should return error when content upload fails with non-retryable error', async () => {
    const uploadError = new DriveDesktopError('UNKNOWN', 'Upload failed');
    uploadContentMock.mockResolvedValue({ error: uploadError });

    const result = await updateFileToBackup({ ...baseParams, signal: abortController.signal });

    expect(result.error).toBe(uploadError);
    expect(overrideFileMock).not.toHaveBeenCalled();
  });

  it('should return ACTION_NOT_PERMITTED when content upload cannot read the local file', async () => {
    const uploadError = new DriveDesktopError('ACTION_NOT_PERMITTED', 'permission denied');
    uploadContentMock.mockResolvedValue({ error: uploadError });

    const result = await updateFileToBackup({ ...baseParams, signal: abortController.signal });

    expect(result.error).toBe(uploadError);
    expect(overrideFileMock).not.toHaveBeenCalled();
  });

  it('should return error when override fails with non-retryable error', async () => {
    uploadContentMock.mockResolvedValue({ data: BucketEntryIdMother.primitive() });
    overrideFileMock.mockResolvedValue({ error: new DriveServerError('NOT_FOUND', 404) });

    const result = await updateFileToBackup({ ...baseParams, signal: abortController.signal });

    expect(result.error).toBeInstanceOf(DriveDesktopError);
    expect(result.error?.cause).toBe('UNKNOWN');
  });

  it('should skip file when backend rejects override by upload size limit', async () => {
    uploadContentMock.mockResolvedValue({ data: BucketEntryIdMother.primitive() });
    overrideFileMock.mockResolvedValue({ error: new DriveServerError('FILE_TOO_BIG', 402) });

    const result = await updateFileToBackup({ ...baseParams, signal: abortController.signal });

    expect(result).toStrictEqual({ data: undefined });
    expect(addMaxFileSizeRejectionMock).toHaveBeenCalledWith({
      path: baseParams.path,
      fileSize: baseParams.size,
      blockUploadPath: false,
    });
  });

  it('should return null data when signal is aborted during content upload', async () => {
    uploadContentMock.mockImplementation(async () => {
      abortController.abort();
      return { data: BucketEntryIdMother.primitive() };
    });

    const result = await updateFileToBackup({ ...baseParams, signal: abortController.signal });

    expect(result.data).toBeUndefined();
    expect(result.error).toBeUndefined();
    expect(overrideFileMock).not.toHaveBeenCalled();
  });

  it('should pass the contentsId from content upload to override', async () => {
    const contentsId = BucketEntryIdMother.primitive();
    uploadContentMock.mockResolvedValue({ data: contentsId });
    overrideFileMock.mockResolvedValue({ data: true });

    await updateFileToBackup({ ...baseParams, signal: abortController.signal });

    expect(overrideFileMock).toHaveBeenCalledWith(expect.objectContaining({ fileContentsId: contentsId }));
  });
});
