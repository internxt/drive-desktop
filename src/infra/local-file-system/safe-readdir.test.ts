import type { Dirent } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { DriveDesktopError } from '../../context/shared/domain/errors/DriveDesktopError';
import { safeReadDir } from './safe-readdir';

vi.mock('node:fs/promises', () => ({
  readdir: vi.fn(),
}));

const readdirMock = vi.mocked(readdir);

function createFsError(code: string, message = `${code}: readdir failed`): NodeJS.ErrnoException {
  const error = new Error(message) as NodeJS.ErrnoException;
  error.code = code;
  return error;
}

describe('safeReadDir', () => {
  it('returns dirents when readdir succeeds', async () => {
    const dirents = [{ name: 'file.txt' }, { name: 'folder' }] as Dirent[];
    readdirMock.mockResolvedValue(dirents);

    const result = await safeReadDir('/tmp/root');

    expect(result).toStrictEqual({ data: dirents });
    expect(readdirMock).toHaveBeenCalledWith('/tmp/root', { withFileTypes: true });
  });

  it.each(['ENOENT', 'ENOTDIR'])('maps %s to NOT_EXISTS', async (code) => {
    readdirMock.mockRejectedValue(createFsError(code));

    const result = await safeReadDir('/tmp/missing-folder');

    expect(result.error).toBeInstanceOf(DriveDesktopError);
    expect(result.error?.cause).toBe('NOT_EXISTS');
    expect(result.error?.message).toBe(`${code}: readdir failed`);
  });

  it('maps EACCES to INSUFFICIENT_PERMISSION', async () => {
    readdirMock.mockRejectedValue(createFsError('EACCES'));

    const result = await safeReadDir('/tmp/private-folder');

    expect(result.error).toBeInstanceOf(DriveDesktopError);
    expect(result.error?.cause).toBe('INSUFFICIENT_PERMISSION');
    expect(result.error?.message).toBe('EACCES: readdir failed');
  });

  it('maps EPERM to ACTION_NOT_PERMITTED', async () => {
    readdirMock.mockRejectedValue(createFsError('EPERM'));

    const result = await safeReadDir('/tmp/protected-folder');

    expect(result.error).toBeInstanceOf(DriveDesktopError);
    expect(result.error?.cause).toBe('ACTION_NOT_PERMITTED');
    expect(result.error?.message).toBe('EPERM: readdir failed');
  });

  it('maps unmapped fs error codes to UNKNOWN and preserves the message', async () => {
    readdirMock.mockRejectedValue(createFsError('ELOOP', 'Too many symbolic links'));

    const result = await safeReadDir('/tmp/loop');

    expect(result.error).toBeInstanceOf(DriveDesktopError);
    expect(result.error?.cause).toBe('UNKNOWN');
    expect(result.error?.message).toBe('Too many symbolic links');
  });

  it('maps non-error thrown values to UNKNOWN', async () => {
    readdirMock.mockRejectedValue('unexpected failure');

    const result = await safeReadDir('/tmp/root');

    expect(result.error).toBeInstanceOf(DriveDesktopError);
    expect(result.error?.cause).toBe('UNKNOWN');
    expect(result.error?.message).toBe('An unknown error happened when reading stats of /tmp/root');
  });
});
