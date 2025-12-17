import { getAppCachePaths } from './get-app-cache-paths';
import os from 'node:os';
import path from 'node:path';

vi.mock('node:os');
vi.mock('node:path');

const mockedOs = vi.mocked(os);
const mockedPath = vi.mocked(path);

describe('getAppCachePaths', () => {
  const mockHomeDir = '/home/testuser';

  beforeEach(() => {
    mockedOs.homedir.mockReturnValue(mockHomeDir);
    mockedPath.join.mockImplementation((...args) => args.join('/'));
    delete process.env.XDG_CACHE_HOME;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return default paths when XDG_CACHE_HOME is not set', () => {
    const result = getAppCachePaths();

    expect(result).toStrictEqual({
      userCache: '/home/testuser/.cache',
      tmpDir: '/tmp',
      varTmpDir: '/var/tmp',
      localShareCache: '/home/testuser/.local/share',
    });

    expect(mockedOs.homedir).toHaveBeenCalledTimes(1);
    expect(mockedPath.join).toHaveBeenCalledWith(mockHomeDir, '.cache');
    expect(mockedPath.join).toHaveBeenCalledWith(mockHomeDir, '.local', 'share');
  });

  it('should use XDG_CACHE_HOME when set and different from default', () => {
    const customCacheDir = '/custom/cache/path';
    process.env.XDG_CACHE_HOME = customCacheDir;

    const result = getAppCachePaths();

    expect(result).toStrictEqual({
      userCache: customCacheDir,
      tmpDir: '/tmp',
      varTmpDir: '/var/tmp',
      localShareCache: '/home/testuser/.local/share',
    });
  });

  it('should use default cache when XDG_CACHE_HOME equals default path', () => {
    const defaultCacheDir = '/home/testuser/.cache';
    process.env.XDG_CACHE_HOME = defaultCacheDir;

    const result = getAppCachePaths();

    expect(result).toStrictEqual({
      userCache: defaultCacheDir,
      tmpDir: '/tmp',
      varTmpDir: '/var/tmp',
      localShareCache: '/home/testuser/.local/share',
    });
  });

  it('should handle empty XDG_CACHE_HOME', () => {
    process.env.XDG_CACHE_HOME = '';

    const result = getAppCachePaths();

    expect(result).toStrictEqual({
      userCache: '/home/testuser/.cache',
      tmpDir: '/tmp',
      varTmpDir: '/var/tmp',
      localShareCache: '/home/testuser/.local/share',
    });
  });

  it('should handle different home directory paths', () => {
    const differentHome = '/Users/macuser';
    mockedOs.homedir.mockReturnValue(differentHome);

    const result = getAppCachePaths();

    expect(result).toStrictEqual({
      userCache: '/Users/macuser/.cache',
      tmpDir: '/tmp',
      varTmpDir: '/var/tmp',
      localShareCache: '/Users/macuser/.local/share',
    });
  });
});
