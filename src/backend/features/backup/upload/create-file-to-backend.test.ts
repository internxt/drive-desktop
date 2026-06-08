import { partialSpyOn } from '../../../../../tests/vitest/utils.helper';
import { DriveDesktopError } from '../../../../context/shared/domain/errors/DriveDesktopError';
import { DriveServerError } from '../../../../infra/drive-server/drive-server.error';
import { createFileToBackend } from './create-file-to-backend';
import * as createFileModule from '../../../../infra/drive-server/services/files/services/create-file';
import { UuidMother } from '../../../../context/shared/domain/__test-helpers__/UuidMother';
import { BucketEntryIdMother } from '../../../../context/virtual-drive/shared/domain/__test-helpers__/BucketEntryIdMother';

describe('createFileToBackend', () => {
  const createFileMock = partialSpyOn(createFileModule, 'createFile');

  const baseParams = {
    contentsId: BucketEntryIdMother.primitive(),
    filePath: '/backup/my-file.txt',
    size: 1024,
    folderId: 123,
    folderUuid: UuidMother.primitive(),
    bucket: 'bucket',
  };

  const fileResponse = {
    id: 1,
    uuid: UuidMother.primitive(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('should return a File domain object on success', async () => {
    createFileMock.mockResolvedValue({ data: fileResponse });

    const result = await createFileToBackend(baseParams);

    expect(result.error).toBeUndefined();
    expect(result.data?.path).toBe(baseParams.filePath);
    expect(result.data?.size).toBe(baseParams.size);
  });

  it('should not set fileId when size is 0', async () => {
    createFileMock.mockResolvedValue({ data: fileResponse });

    await createFileToBackend({ ...baseParams, size: 0 });

    const calledBody = createFileMock.mock.calls[0][0];
    expect(calledBody.fileId).toBeUndefined();
  });

  it('should set fileId when size is greater than 0', async () => {
    createFileMock.mockResolvedValue({ data: fileResponse });

    await createFileToBackend(baseParams);

    const calledBody = createFileMock.mock.calls[0][0];
    expect(calledBody.fileId).toBe(baseParams.contentsId);
  });

  it('should return FILE_ALREADY_EXISTS error on CONFLICT', async () => {
    createFileMock.mockResolvedValue({ error: new DriveServerError('CONFLICT', 409) });

    const result = await createFileToBackend(baseParams);

    expect(result.error).toBeInstanceOf(DriveDesktopError);
    expect(result.error?.cause).toBe('FILE_ALREADY_EXISTS');
  });

  it('should return UNKNOWN error on BAD_REQUEST', async () => {
    createFileMock.mockResolvedValue({ error: new DriveServerError('BAD_REQUEST', 400) });

    const result = await createFileToBackend(baseParams);

    expect(result.error).toBeInstanceOf(DriveDesktopError);
    expect(result.error?.cause).toBe('UNKNOWN');
  });

  it('should return FILE_TOO_BIG on FILE_TOO_BIG', async () => {
    createFileMock.mockResolvedValue({ error: new DriveServerError('FILE_TOO_BIG', 402) });

    const result = await createFileToBackend(baseParams);

    expect(result.error).toBeInstanceOf(DriveDesktopError);
    expect(result.error?.cause).toBe('FILE_TOO_BIG');
  });

  it('should return INTERNAL_SERVER_ERROR on SERVER_ERROR', async () => {
    createFileMock.mockResolvedValue({ error: new DriveServerError('SERVER_ERROR', 500) });

    const result = await createFileToBackend(baseParams);

    expect(result.error).toBeInstanceOf(DriveDesktopError);
    expect(result.error?.cause).toBe('INTERNAL_SERVER_ERROR');
  });

  it('should return UNKNOWN error for unmapped causes', async () => {
    createFileMock.mockResolvedValue({ error: new DriveServerError('NETWORK_ERROR') });

    const result = await createFileToBackend(baseParams);

    expect(result.error).toBeInstanceOf(DriveDesktopError);
    expect(result.error?.cause).toBe('UNKNOWN');
  });
});
