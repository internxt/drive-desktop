import fs from 'node:fs/promises';
import type { Stats } from 'node:fs';
import { DriveDesktopError } from '../../context/shared/domain/errors/DriveDesktopError';
import { safeStat } from './safe-stat';

vi.mock('node:fs/promises', () => ({
  default: {
    stat: vi.fn(),
  },
}));

const fsMock = vi.mocked(fs);

function createFsError(code: string, message = `${code}: stat failed`): NodeJS.ErrnoException {
  const error = new Error(message) as NodeJS.ErrnoException;
  error.code = code;
  return error;
}

describe('safeStat', () => {
  it('returns stats when fs.stat succeeds', async () => {
    const stats = { size: 1024 } as Stats;
    fsMock.stat.mockResolvedValue(stats);

    const result = await safeStat('/tmp/file.txt');

    expect(result).toStrictEqual({ data: stats });
    expect(fsMock.stat).toHaveBeenCalledWith('/tmp/file.txt');
  });

  it.each(['ENOENT', 'ENOTDIR'])('maps %s to NOT_EXISTS', async (code) => {
    fsMock.stat.mockRejectedValue(createFsError(code));

    const result = await safeStat('/tmp/missing-file.txt');

    expect(result.error).toBeInstanceOf(DriveDesktopError);
    expect(result.error?.cause).toBe('NOT_EXISTS');
    expect(result.error?.message).toBe(`${code}: stat failed`);
  });

  it('maps EACCES to INSUFFICIENT_PERMISSION', async () => {
    fsMock.stat.mockRejectedValue(createFsError('EACCES'));

    const result = await safeStat('/tmp/private-file.txt');

    expect(result.error).toBeInstanceOf(DriveDesktopError);
    expect(result.error?.cause).toBe('INSUFFICIENT_PERMISSION');
    expect(result.error?.message).toBe('EACCES: stat failed');
  });

  it('maps EPERM to ACTION_NOT_PERMITTED', async () => {
    fsMock.stat.mockRejectedValue(createFsError('EPERM'));

    const result = await safeStat('/tmp/protected-file.txt');

    expect(result.error).toBeInstanceOf(DriveDesktopError);
    expect(result.error?.cause).toBe('ACTION_NOT_PERMITTED');
    expect(result.error?.message).toBe('EPERM: stat failed');
  });

  it('maps unmapped fs error codes to UNKNOWN and preserves the message', async () => {
    fsMock.stat.mockRejectedValue(createFsError('ELOOP', 'Too many symbolic links'));

    const result = await safeStat('/tmp/loop');

    expect(result.error).toBeInstanceOf(DriveDesktopError);
    expect(result.error?.cause).toBe('UNKNOWN');
    expect(result.error?.message).toBe('Too many symbolic links');
  });

  it('maps non-error thrown values to UNKNOWN', async () => {
    fsMock.stat.mockRejectedValue('unexpected failure');

    const result = await safeStat('/tmp/file.txt');

    expect(result.error).toBeInstanceOf(DriveDesktopError);
    expect(result.error?.cause).toBe('UNKNOWN');
    expect(result.error?.message).toBe('An unknown error happened when reading stats of /tmp/file.txt');
  });
});
