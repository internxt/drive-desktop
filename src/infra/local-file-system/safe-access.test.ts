import fs from 'node:fs/promises';
import { constants } from 'node:fs';
import { DriveDesktopError } from '../../context/shared/domain/errors/DriveDesktopError';
import { safeAccess } from './safe-access';

vi.mock('node:fs/promises', () => ({
  default: {
    access: vi.fn(),
  },
}));

const fsMock = vi.mocked(fs);

function createFsError(code: string, message = `${code}: access failed`): NodeJS.ErrnoException {
  const error = new Error(message) as NodeJS.ErrnoException;
  error.code = code;
  return error;
}

describe('safeAccess', () => {
  it('should return data when fs.access succeeds', async () => {
    fsMock.access.mockResolvedValue(undefined);

    const result = await safeAccess({ absolutePath: '/tmp/file.txt' });

    expect(result).toStrictEqual({ data: undefined });
    expect(fsMock.access).toHaveBeenCalledWith('/tmp/file.txt', constants.R_OK);
  });

  it('should use the provided access mode', async () => {
    fsMock.access.mockResolvedValue(undefined);

    await safeAccess({ absolutePath: '/tmp/file.txt', mode: constants.W_OK });

    expect(fsMock.access).toHaveBeenCalledWith('/tmp/file.txt', constants.W_OK);
  });

  it.each(['ENOENT', 'ENOTDIR'])('should map %s to NOT_EXISTS', async (code) => {
    fsMock.access.mockRejectedValue(createFsError(code));

    const result = await safeAccess({ absolutePath: '/tmp/missing-file.txt' });

    expect(result.error).toBeInstanceOf(DriveDesktopError);
    expect(result.error?.cause).toBe('NOT_EXISTS');
    expect(result.error?.message).toBe(`${code}: access failed`);
  });

  it.each(['EACCES', 'EPERM'])('should map %s to ACTION_NOT_PERMITTED', async (code) => {
    fsMock.access.mockRejectedValue(createFsError(code));

    const result = await safeAccess({ absolutePath: '/tmp/private-file.txt' });

    expect(result.error).toBeInstanceOf(DriveDesktopError);
    expect(result.error?.cause).toBe('ACTION_NOT_PERMITTED');
    expect(result.error?.message).toBe(`${code}: access failed`);
  });

  it('should map unmapped fs error codes to UNKNOWN and preserves the message', async () => {
    fsMock.access.mockRejectedValue(createFsError('ELOOP', 'Too many symbolic links'));

    const result = await safeAccess({ absolutePath: '/tmp/loop' });

    expect(result.error).toBeInstanceOf(DriveDesktopError);
    expect(result.error?.cause).toBe('UNKNOWN');
    expect(result.error?.message).toBe('Too many symbolic links');
  });

  it('should map non-error thrown values to UNKNOWN', async () => {
    fsMock.access.mockRejectedValue('unexpected failure');

    const result = await safeAccess({ absolutePath: '/tmp/file.txt' });

    expect(result.error).toBeInstanceOf(DriveDesktopError);
    expect(result.error?.cause).toBe('UNKNOWN');
    expect(result.error?.message).toBe('An unknown error happened when checking access to /tmp/file.txt');
  });
});
