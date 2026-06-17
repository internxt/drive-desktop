import fs from 'node:fs/promises';
import {
  isPermissionError,
  OTHER_CLOUD_PROVIDER_KEYWORDS,
  REMOVABLE_PATH_PREFIXES,
  validateRootFolderChange,
} from './validate-root-folder-change';

vi.mock('node:fs/promises', () => ({
  default: {
    access: vi.fn(),
    mkdir: vi.fn(),
  },
}));

describe('validate-root-folder-change', () => {
  const fsAccessMock = vi.mocked(fs.access);
  const fsMkdirMock = vi.mocked(fs.mkdir);

  beforeEach(() => {
    fsAccessMock.mockResolvedValue(undefined);
    fsMkdirMock.mockResolvedValue(undefined);
  });

  it('should expose removable path prefixes', () => {
    expect(REMOVABLE_PATH_PREFIXES).toMatchObject(['/media/', '/run/media/', '/mnt/']);
  });

  it('should expose known cloud provider keywords', () => {
    expect(OTHER_CLOUD_PROVIDER_KEYWORDS).toContain('dropbox');
    expect(OTHER_CLOUD_PROVIDER_KEYWORDS).toContain('google drive');
    expect(OTHER_CLOUD_PROVIDER_KEYWORDS).toContain('onedrive');
  });

  it.each(['/media/user/usb', '/run/media/user/ssd', '/mnt/external'])(
    'should return REMOVABLE_DEVICE for removable path %s',
    async (pathname) => {
      const result = await validateRootFolderChange({
        pathname,
        virtualDriveFolderName: 'Internxt Drive',
      });

      expect(result).toStrictEqual({ status: 'error', code: 'REMOVABLE_DEVICE' });
      expect(fsAccessMock).not.toHaveBeenCalled();
      expect(fsMkdirMock).not.toHaveBeenCalled();
    },
  );

  it('should return OTHER_CLOUD_PROVIDER when pathname contains cloud provider keyword', async () => {
    const result = await validateRootFolderChange({
      pathname: '/home/user/Dropbox/Work',
      virtualDriveFolderName: 'Internxt Drive',
    });

    expect(result).toStrictEqual({ status: 'error', code: 'OTHER_CLOUD_PROVIDER' });
    expect(fsAccessMock).not.toHaveBeenCalled();
    expect(fsMkdirMock).not.toHaveBeenCalled();
  });

  it('should match cloud provider keyword case-insensitively', async () => {
    const result = await validateRootFolderChange({
      pathname: '/home/user/Google Drive/My Folder',
      virtualDriveFolderName: 'Internxt Drive',
    });

    expect(result).toStrictEqual({ status: 'error', code: 'OTHER_CLOUD_PROVIDER' });
  });

  it.each(['EACCES', 'EPERM'])('should return INSUFFICIENT_PERMISSION when access fails with %s', async (code) => {
    fsAccessMock.mockRejectedValueOnce(Object.assign(new Error('permission denied'), { code }));

    const result = await validateRootFolderChange({
      pathname: '/home/user/folder',
      virtualDriveFolderName: 'Internxt Drive',
    });

    expect(result).toStrictEqual({ status: 'error', code: 'INSUFFICIENT_PERMISSION' });
  });

  it('should return INSUFFICIENT_PERMISSION when mount folder creation fails with permission error', async () => {
    fsMkdirMock.mockRejectedValueOnce(Object.assign(new Error('permission denied'), { code: 'EACCES' }));

    const result = await validateRootFolderChange({
      pathname: '/home/user/folder',
      virtualDriveFolderName: 'Internxt Drive',
    });

    expect(result).toStrictEqual({ status: 'error', code: 'INSUFFICIENT_PERMISSION' });
  });

  it('should throw when fs fails with unknown error', async () => {
    const unknownError = Object.assign(new Error('disk failure'), { code: 'EIO' });
    fsAccessMock.mockRejectedValueOnce(unknownError);

    await expect(
      validateRootFolderChange({
        pathname: '/home/user/folder',
        virtualDriveFolderName: 'Internxt Drive',
      }),
    ).rejects.toThrow('disk failure');
  });

  it('should return null when pathname is valid and accessible', async () => {
    const result = await validateRootFolderChange({
      pathname: '/home/user/folder',
      virtualDriveFolderName: 'Internxt Drive',
    });

    expect(result).toBe(null);
    expect(fsAccessMock).toHaveBeenCalledTimes(2);
    expect(fsMkdirMock).toHaveBeenCalledWith('/home/user/folder/Internxt Drive', { recursive: true });
  });

  it.each(['EACCES', 'EPERM'])('isPermissionError should return true for %s', (code) => {
    const result = isPermissionError(Object.assign(new Error('permission denied'), { code }));

    expect(result).toBe(true);
  });

  it('isPermissionError should return false for unknown code', () => {
    const result = isPermissionError(Object.assign(new Error('other'), { code: 'ENOENT' }));

    expect(result).toBe(false);
  });

  it('isPermissionError should return false for non-objects', () => {
    expect(isPermissionError(null)).toBe(false);
    expect(isPermissionError(undefined)).toBe(false);
    expect(isPermissionError('error')).toBe(false);
  });
});
