import { constants } from 'node:fs';
import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { randomInt } from 'node:crypto';
import {
  copyWithoutOverwriting,
  createCopyPath,
  createLastResortCopyPath,
  createRecoveredPath,
  preserveRejectedFileSizeTooBig,
} from './preserve-rejected-file-size-too-big';

vi.mock('node:fs/promises', () => ({
  copyFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('node:crypto', () => ({
  randomInt: vi.fn(() => 123456),
}));

const copyFileMock = vi.mocked(copyFile);
const mkdirMock = vi.mocked(mkdir);
const randomIntMock = vi.mocked(randomInt as (max: number) => number);
const recoveryRoot = '/rejected-files-size-too-big';
const temporalContentPath = '/tmp/internxt-drive-tmp/temporal-content';

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  copyFileMock.mockResolvedValue(undefined);
  mkdirMock.mockResolvedValue(undefined);
  randomIntMock.mockReturnValue(123456);
});

describe('preserve-rejected-file-size-too-big', () => {
  describe('preserveRejectedFileSizeTooBig', () => {
    it('should preserve the rejected file inside its original path structure', async () => {
      const result = await preserveRejectedFileSizeTooBig({
        rootFolder: recoveryRoot,
        originalPath: '/fotos/a/b/c/photo.jpg',
        temporalContentPath,
        size: 36_000_000,
      });

      const expectedFolderPath = path.join(recoveryRoot, 'fotos', 'a', 'b', 'c');
      const expectedFilePath = path.join(expectedFolderPath, 'photo.jpg');

      expect(mkdirMock).toHaveBeenCalledWith(expectedFolderPath, { recursive: true });
      expect(copyFileMock).toHaveBeenCalledWith(temporalContentPath, expectedFilePath, constants.COPYFILE_EXCL);
      expect(result).toStrictEqual({ data: { folderPath: expectedFolderPath, filePath: expectedFilePath } });
    });

    it('should reuse existing recovered folders and only create missing path segments', async () => {
      const result = await preserveRejectedFileSizeTooBig({
        rootFolder: recoveryRoot,
        originalPath: '/fotos/a/b/c/beach/photo.jpg',
        temporalContentPath,
        size: 12_000_000,
      });

      const expectedFolderPath = path.join(recoveryRoot, 'fotos', 'a', 'b', 'c', 'beach');
      const expectedFilePath = path.join(expectedFolderPath, 'photo.jpg');

      expect(mkdirMock).toHaveBeenCalledWith(expectedFolderPath, { recursive: true });
      expect(result).toStrictEqual({ data: { folderPath: expectedFolderPath, filePath: expectedFilePath } });
    });

    it('should return an error when the recovery folder cannot be created', async () => {
      const error = new Error('mkdir failed');
      mkdirMock.mockRejectedValueOnce(error);

      const result = await preserveRejectedFileSizeTooBig({
        rootFolder: recoveryRoot,
        originalPath: '/fotos/a/b/c/photo.jpg',
        temporalContentPath,
        size: 36_000_000,
      });

      expect(result).toStrictEqual({ error });
      expect(copyFileMock).not.toHaveBeenCalled();
    });

    it('should return an error when the temporal file cannot be copied', async () => {
      const error = new Error('copy failed');
      copyFileMock.mockRejectedValueOnce(error);

      const result = await preserveRejectedFileSizeTooBig({
        rootFolder: recoveryRoot,
        originalPath: '/fotos/a/b/c/photo.jpg',
        temporalContentPath,
        size: 36_000_000,
      });

      expect(result).toStrictEqual({ error });
    });
  });

  describe('createRecoveredPath', () => {
    it('should recover a file under the rejected-files root preserving its path segments', () => {
      expect(createRecoveredPath({ rootFolder: recoveryRoot, originalPath: '/fotos/a/b/c/photo.jpg' })).toBe(
        path.join(recoveryRoot, 'fotos', 'a', 'b', 'c', 'photo.jpg'),
      );
    });

    it('should preserve the file inside the rejected-files root when the original path has no valid segments', () => {
      expect(createRecoveredPath({ rootFolder: recoveryRoot, originalPath: '/' })).toBe(
        path.join(recoveryRoot, 'rejected-file'),
      );
    });
  });

  describe('copyWithoutOverwriting', () => {
    it('should copy to the target path when it does not exist', async () => {
      const targetPath = path.join(recoveryRoot, 'photo.jpg');

      await expect(copyWithoutOverwriting({ sourcePath: temporalContentPath, targetPath })).resolves.toStrictEqual({
        data: targetPath,
      });
      expect(copyFileMock).toHaveBeenCalledWith(temporalContentPath, targetPath, constants.COPYFILE_EXCL);
    });

    it('should copy to the first available copy path when the target already exists', async () => {
      const targetPath = path.join(recoveryRoot, 'photo.jpg');
      const copyPath = path.join(recoveryRoot, 'photo (copy 1).jpg');
      copyFileMock.mockRejectedValueOnce(createFileAlreadyExistsError()).mockResolvedValueOnce(undefined);

      await expect(copyWithoutOverwriting({ sourcePath: temporalContentPath, targetPath })).resolves.toStrictEqual({
        data: copyPath,
      });
      expect(copyFileMock).toHaveBeenNthCalledWith(1, temporalContentPath, targetPath, constants.COPYFILE_EXCL);
      expect(copyFileMock).toHaveBeenNthCalledWith(2, temporalContentPath, copyPath, constants.COPYFILE_EXCL);
    });

    it('should return the copy error when copy fails for a reason different from an existing target', async () => {
      const error = new Error('copy failed');
      copyFileMock.mockRejectedValueOnce(error);

      await expect(
        copyWithoutOverwriting({ sourcePath: temporalContentPath, targetPath: path.join(recoveryRoot, 'photo.jpg') }),
      ).resolves.toStrictEqual({ error });
    });

    it('should use a timestamp and random number on the last copy attempt', async () => {
      vi.spyOn(Date, 'now').mockReturnValue(1_717_171_717_171);
      let calls = 0;
      copyFileMock.mockImplementation(async () => {
        calls += 1;
        if (calls < 102) {
          throw createFileAlreadyExistsError();
        }
      });

      const targetPath = path.join(recoveryRoot, 'photo.jpg');
      const lastResortPath = path.join(recoveryRoot, 'photo (copy 1717171717171-123456).jpg');

      await expect(copyWithoutOverwriting({ sourcePath: temporalContentPath, targetPath })).resolves.toStrictEqual({
        data: lastResortPath,
      });
      expect(copyFileMock).toHaveBeenCalledTimes(102);
      expect(copyFileMock).toHaveBeenLastCalledWith(temporalContentPath, lastResortPath, constants.COPYFILE_EXCL);
    });
  });

  describe('createCopyPath', () => {
    it('should append the copy number before the file extension', () => {
      expect(createCopyPath({ targetPath: path.join(recoveryRoot, 'fotos', 'photo.jpg'), copyNumber: 3 })).toBe(
        path.join(recoveryRoot, 'fotos', 'photo (copy 3).jpg'),
      );
    });
  });

  describe('createLastResortCopyPath', () => {
    it('should append a timestamp and random number before the file extension', () => {
      vi.spyOn(Date, 'now').mockReturnValue(1_717_171_717_171);

      expect(createLastResortCopyPath({ targetPath: path.join(recoveryRoot, 'fotos', 'photo.jpg') })).toBe(
        path.join(recoveryRoot, 'fotos', 'photo (copy 1717171717171-123456).jpg'),
      );
    });
  });
});

function createFileAlreadyExistsError(): NodeJS.ErrnoException {
  const error = new Error('File already exists') as NodeJS.ErrnoException;
  error.code = 'EEXIST';
  return error;
}
