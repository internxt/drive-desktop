import { partialSpyOn } from '../../../../../tests/vitest/utils.helper';
import { DriveDesktopError } from '../../../../context/shared/domain/errors/DriveDesktopError';
import { FileMother } from '../../../../context/virtual-drive/files/domain/__test-helpers__/FileMother';
import * as uploadContentModule from './upload-content-to-environment';
import * as createFileModule from './create-file-to-backend';
import * as deleteFileModule from '../../../../infra/drive-server/services/files/services/delete-file-content-from-bucket';
import { uploadFileToBackup, UploadFileParams } from './upload-file-to-backup';
import { Environment } from '@internxt/inxt-js';
import configStore from '../../../../apps/main/config';
import * as maxFileSizeRejectionModule from '../../user/file-size-limit/add-max-file-size-rejection';

describe('upload-file-to-backup', () => {
  const uploadContentMock = partialSpyOn(uploadContentModule, 'uploadContentToEnvironment');
  const createFileToBackendMock = partialSpyOn(createFileModule, 'createFileToBackend');
  const deleteFileMock = partialSpyOn(deleteFileModule, 'deleteFileFromStorageByFileId');
  const configGetMock = partialSpyOn(configStore, 'get');
  const addMaxFileSizeRejectionMock = partialSpyOn(maxFileSizeRejectionModule, 'addMaxFileSizeRejection');

  let abortController: AbortController;

  const baseParams: UploadFileParams = {
    path: '/some/path/file.txt',
    size: 1024,
    bucket: 'test-bucket',
    folderId: 1,
    folderUuid: 'folder-uuid',
    environment: {} as Environment,
    signal: new AbortController().signal,
  };

  beforeEach(() => {
    abortController = new AbortController();
    configGetMock.mockReturnValue(0);
    addMaxFileSizeRejectionMock.mockClear();
  });

  it('should upload the file content and create metadata on backend successfully', async () => {
    const contentsId = 'contents-id-123';
    const file = FileMother.any();
    uploadContentMock.mockResolvedValue({ data: contentsId });
    createFileToBackendMock.mockResolvedValue({ data: file });

    const result = await uploadFileToBackup({ ...baseParams, signal: abortController.signal });

    expect(result.data).toBe(file);
    expect(result.error).toBeUndefined();
  });

  it('should skip file upload when local upload size validation fails', async () => {
    configGetMock.mockReturnValue(100);

    const result = await uploadFileToBackup({ ...baseParams, size: 101, signal: abortController.signal });

    expect(result).toStrictEqual({ data: null });
    expect(uploadContentMock).not.toHaveBeenCalled();
    expect(createFileToBackendMock).not.toHaveBeenCalled();
    expect(addMaxFileSizeRejectionMock).toHaveBeenCalledWith({
      path: baseParams.path,
      fileSize: 101,
      validation: { allowed: false, reason: 'PLAN_LIMIT_EXCEEDED', maxFileSize: 100, showUpgradeCta: true },
      blockUploadPath: false,
    });
  });

  it('should return error when content upload fails with a non-retryable error', async () => {
    const uploadError = new DriveDesktopError('UNKNOWN', 'Upload failed');
    uploadContentMock.mockResolvedValue({ error: uploadError });

    const result = await uploadFileToBackup({ ...baseParams, signal: abortController.signal });

    expect(result.error).toBe(uploadError);
    expect(createFileToBackendMock).not.toHaveBeenCalled();
  });

  it('should return ACTION_NOT_PERMITTED when content upload cannot read the local file', async () => {
    const uploadError = new DriveDesktopError('ACTION_NOT_PERMITTED', 'permission denied');
    uploadContentMock.mockResolvedValue({ error: uploadError });

    const result = await uploadFileToBackup({ ...baseParams, signal: abortController.signal });

    expect(result.error).toBe(uploadError);
    expect(createFileToBackendMock).not.toHaveBeenCalled();
  });

  it('should return error when metadata creation fails and delete the uploaded content', async () => {
    const contentsId = 'contents-id-123';
    const metadataError = new DriveDesktopError('BAD_RESPONSE', 'Metadata failed');
    uploadContentMock.mockResolvedValue({ data: contentsId });
    createFileToBackendMock.mockResolvedValue({ error: metadataError });
    deleteFileMock.mockResolvedValue({ data: true });

    const result = await uploadFileToBackup({ ...baseParams, signal: abortController.signal });

    expect(result.error).toBe(metadataError);
    expect(deleteFileMock).toHaveBeenCalledWith({ bucketId: baseParams.bucket, fileId: contentsId });
  });

  it('should skip file when backend rejects metadata creation by upload size limit', async () => {
    const contentsId = 'contents-id-123';
    uploadContentMock.mockResolvedValue({ data: contentsId });
    createFileToBackendMock.mockResolvedValue({ error: new DriveDesktopError('FILE_TOO_BIG', 'File too big') });
    deleteFileMock.mockResolvedValue({ data: true });

    const result = await uploadFileToBackup({ ...baseParams, signal: abortController.signal });

    expect(result).toStrictEqual({ data: null });
    expect(deleteFileMock).toHaveBeenCalledWith({ bucketId: baseParams.bucket, fileId: contentsId });
    expect(addMaxFileSizeRejectionMock).toHaveBeenCalledWith({
      path: baseParams.path,
      fileSize: baseParams.size,
      blockUploadPath: false,
    });
  });

  it('should return null data and skip metadata when signal is aborted during content upload', async () => {
    const contentsId = 'contents-id-123';
    uploadContentMock.mockImplementation(async () => {
      abortController.abort();
      return { data: contentsId };
    });

    const result = await uploadFileToBackup({ ...baseParams, signal: abortController.signal });

    expect(result.data).toBeNull();
    expect(result.error).toBeUndefined();
    expect(createFileToBackendMock).not.toHaveBeenCalled();
  });

  it('should return null data when file already exists remotely', async () => {
    const alreadyExistsError = new DriveDesktopError('FILE_ALREADY_EXISTS', 'File already exists');
    uploadContentMock.mockResolvedValue({ data: 'contents-id' });
    createFileToBackendMock.mockResolvedValue({ error: alreadyExistsError });
    deleteFileMock.mockResolvedValue({ data: true });

    const result = await uploadFileToBackup({ ...baseParams, signal: abortController.signal });

    expect(result.data).toBeNull();
    expect(result.error).toBeUndefined();
  });
});
