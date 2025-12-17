/* eslint-disable @typescript-eslint/no-explicit-any */
import { PathTypeChecker } from '../../../shared/fs/PathTypeChecker ';
import { isPermissionError } from './isPermissionError';
import { readdir } from 'fs/promises';
import { logger } from '@internxt/drive-desktop-core/build/backend';

vi.mock('fs/promises');
vi.mock('../../../shared/fs/PathTypeChecker ');
vi.mock('./isPermissionError');
vi.mock('child_process');
vi.mock('util');
vi.mock('@internxt/drive-desktop-core/build/backend', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { getFilesFromDirectory } from './getFilesFromDirectory';

describe('getFilesFromDirectory', () => {
  const mockReaddir = vi.mocked(readdir);
  const mockPathTypeChecker = vi.mocked(PathTypeChecker);
  const mockIsPermissionError = vi.mocked(isPermissionError);
  const mockLogger = vi.mocked(logger);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process a single file', async () => {
    const testFile = '/path/to/file.txt';
    const mockCallback = vi.fn().mockResolvedValue(undefined);
    mockPathTypeChecker.isFile.mockResolvedValue(true);

    await getFilesFromDirectory(testFile, mockCallback);

    expect(mockPathTypeChecker.isFile).toHaveBeenCalledWith(testFile);
    expect(mockCallback).toHaveBeenCalledWith(testFile);
    expect(mockReaddir).not.toHaveBeenCalled();
  });

  it('should process files in a directory', async () => {
    const testDir = '/path/to/dir';
    const mockCallback = vi.fn().mockResolvedValue(undefined);
    const mockItems = [
      { name: 'file1.txt', isDirectory: () => false },
      { name: 'file2.txt', isDirectory: () => false },
    ];

    mockPathTypeChecker.isFile.mockResolvedValue(false);
    mockReaddir.mockResolvedValue(mockItems as any);

    await getFilesFromDirectory(testDir, mockCallback);

    expect(mockPathTypeChecker.isFile).toHaveBeenCalledWith(testDir);
    expect(mockReaddir).toHaveBeenCalledWith(testDir, { withFileTypes: true });
    expect(mockCallback).toHaveBeenCalledTimes(2);
    expect(mockCallback).toHaveBeenCalledWith('/path/to/dir/file1.txt');
    expect(mockCallback).toHaveBeenCalledWith('/path/to/dir/file2.txt');
  });

  it('should filter out .tmp files and temp/tmp directories', async () => {
    const testDir = '/path/to/dir';
    const mockCallback = vi.fn().mockResolvedValue(undefined);
    const mockItems = [
      { name: 'file1.txt', isDirectory: () => false },
      { name: 'file2.tmp', isDirectory: () => false },
      { name: 'tmp', isDirectory: () => true },
    ];

    mockPathTypeChecker.isFile.mockResolvedValue(false);
    mockReaddir.mockResolvedValue(mockItems as any);

    await getFilesFromDirectory(testDir, mockCallback);

    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith('/path/to/dir/file1.txt');
    expect(mockCallback).not.toHaveBeenCalledWith('/path/to/dir/file2.tmp');
    expect(mockCallback).not.toHaveBeenCalledWith('/path/to/dir/tmp');
  });

  it('should recursively process subdirectories', async () => {
    const testDir = '/path/to/dir';
    const mockCallback = vi.fn().mockResolvedValue(undefined);
    const mockItems = [
      { name: 'file1.txt', isDirectory: () => false },
      { name: 'subdir', isDirectory: () => true },
    ];
    const mockSubItems = [{ name: 'file1.txt', isDirectory: () => false }];

    mockPathTypeChecker.isFile.mockResolvedValue(false);
    mockReaddir.mockResolvedValueOnce(mockItems as any);
    mockReaddir.mockResolvedValueOnce(mockSubItems as any);

    await getFilesFromDirectory(testDir, mockCallback);

    expect(mockReaddir).toHaveBeenCalledWith(testDir, { withFileTypes: true });
    expect(mockReaddir).toHaveBeenCalledWith('/path/to/dir/subdir', {
      withFileTypes: true,
    });
    expect(mockCallback).toHaveBeenCalledWith('/path/to/dir/file1.txt');
    expect(mockCallback).toHaveBeenCalledWith('/path/to/dir/subdir/file1.txt');
  });

  it('should handle permission errors when reading directory', async () => {
    const testDir = '/path/to/dir';
    const mockCallback = vi.fn().mockResolvedValue(undefined);
    const permissionError = new Error('Permission denied') as NodeJS.ErrnoException;
    permissionError.code = 'EACCES';

    mockPathTypeChecker.isFile.mockResolvedValue(false);
    mockReaddir.mockRejectedValue(permissionError);
    mockIsPermissionError.mockReturnValue(true);

    const result = await getFilesFromDirectory(testDir, mockCallback);

    expect(mockIsPermissionError).toHaveBeenCalledWith(permissionError);
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        tag: 'ANTIVIRUS',
        msg: expect.stringContaining('Skipping directory'),
      }),
    );
    expect(result).toBeNull();
    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('should handle non-permission errors and continue scanning', async () => {
    const testDir = '/path/to/dir';
    const mockCallback = vi.fn().mockResolvedValue(undefined);
    const nonPermissionError = new Error('Other error');

    mockPathTypeChecker.isFile.mockResolvedValue(false);
    mockReaddir.mockRejectedValue(nonPermissionError);
    mockIsPermissionError.mockReturnValue(false);

    const result = await getFilesFromDirectory(testDir, mockCallback);

    expect(mockIsPermissionError).toHaveBeenCalledWith(nonPermissionError);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        tag: 'ANTIVIRUS',
        msg: expect.stringContaining('Error reading directory'),
        error: nonPermissionError,
      }),
    );
    expect(result).toBeNull();
    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('should handle permission errors in subdirectories', async () => {
    const testDir = '/path/to/dir';
    const mockCallback = vi.fn().mockResolvedValue(undefined);
    const mockItems = [
      { name: 'file1.txt', isDirectory: () => false },
      { name: 'subdir', isDirectory: () => true },
    ];
    const permissionError = new Error('Permission denied') as NodeJS.ErrnoException;
    permissionError.code = 'EACCES';

    mockPathTypeChecker.isFile.mockResolvedValue(false);
    mockReaddir.mockResolvedValueOnce(mockItems as any);
    mockReaddir.mockRejectedValueOnce(permissionError);
    mockIsPermissionError.mockReturnValue(true);

    await getFilesFromDirectory(testDir, mockCallback);

    expect(mockCallback).toHaveBeenCalledWith('/path/to/dir/file1.txt');
    expect(mockLogger.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        tag: 'ANTIVIRUS',
        msg: expect.stringContaining('Skipping subdirectory'),
      }),
    );
  });
});
