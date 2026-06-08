import { partialSpyOn } from '../../../../../tests/vitest/utils.helper';
import { DriveServerError } from '../../../../infra/drive-server/drive-server.error';
import * as overrideFileModule from '../../../../infra/drive-server/services/files/services/override-file';
import { overrideFileToBackend } from './override-file-to-backend';
import { UuidMother } from '../../../../context/shared/domain/__test-helpers__/UuidMother';
import { BucketEntryIdMother } from '../../../../context/virtual-drive/shared/domain/__test-helpers__/BucketEntryIdMother';

describe('override-file-to-backend', () => {
  const overrideFileMock = partialSpyOn(overrideFileModule, 'overrideFile');

  const baseParams = {
    fileUuid: UuidMother.primitive(),
    fileContentsId: BucketEntryIdMother.primitive(),
    fileSize: 1024,
  };

  it('should return success when override succeeds', async () => {
    overrideFileMock.mockResolvedValue({ data: true });

    const result = await overrideFileToBackend(baseParams);

    expect(result.data).toBeUndefined();
    expect(result.error).toBeUndefined();
  });

  it('should return INTERNAL_SERVER_ERROR when server returns SERVER_ERROR', async () => {
    overrideFileMock.mockResolvedValue({ error: new DriveServerError('SERVER_ERROR', 500) });

    const result = await overrideFileToBackend(baseParams);

    expect(result.error?.cause).toBe('INTERNAL_SERVER_ERROR');
  });

  it('should return RATE_LIMITED when server returns TOO_MANY_REQUESTS', async () => {
    overrideFileMock.mockResolvedValue({ error: new DriveServerError('TOO_MANY_REQUESTS', 429) });

    const result = await overrideFileToBackend(baseParams);

    expect(result.error?.cause).toBe('RATE_LIMITED');
  });

  it('should return FILE_TOO_BIG when server returns FILE_TOO_BIG', async () => {
    overrideFileMock.mockResolvedValue({ error: new DriveServerError('FILE_TOO_BIG', 402) });

    const result = await overrideFileToBackend(baseParams);

    expect(result.error?.cause).toBe('FILE_TOO_BIG');
  });

  it('should return UNKNOWN for any other server error', async () => {
    overrideFileMock.mockResolvedValue({ error: new DriveServerError('NOT_FOUND', 404) });

    const result = await overrideFileToBackend(baseParams);

    expect(result.error?.cause).toBe('UNKNOWN');
  });

  it('should forward the error message from the server error', async () => {
    const message = 'something went wrong';
    overrideFileMock.mockResolvedValue({ error: new DriveServerError('SERVER_ERROR', 500, message) });

    const result = await overrideFileToBackend(baseParams);

    expect(result.error?.message).toBe(message);
  });

  it('should pass all params to overrideFile', async () => {
    overrideFileMock.mockResolvedValue({ data: true });

    await overrideFileToBackend(baseParams);

    expect(overrideFileMock).toHaveBeenCalledWith(baseParams);
  });
});
