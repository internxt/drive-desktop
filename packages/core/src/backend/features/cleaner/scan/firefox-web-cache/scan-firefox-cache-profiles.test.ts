import { Dirent } from 'node:fs';
import { readdir } from 'node:fs/promises';

import { mockProps, partialSpyOn, deepMocked } from '@/tests/vitest/utils.helper.test';

import * as scanDirectoryModule from '../../scan/scan-directory';
import { CleanableItem } from '../../types/cleaner.types';
import * as isFirefoxProfileDirectoryModule from '../../utils/is-firefox-profile-directory';
import { scanFirefoxCacheProfiles } from './scan-firefox-cache-profiles';

vi.mock(import('node:fs/promises'));

describe('scanFirefoxCacheProfiles', () => {
  const firefoxCacheDir = '/home/user/.cache/mozilla/firefox';
  const mockedScanDirectory = partialSpyOn(scanDirectoryModule, 'scanDirectory');
  const mockedIsFirefoxProfileDirectory = partialSpyOn(isFirefoxProfileDirectoryModule, 'isFirefoxProfileDirectory');
  const readdirMock = deepMocked(readdir);

  const createMockDirent = (name: string, isDirectory = true) =>
    ({
      name,
      isDirectory: () => isDirectory,
      isFile: () => !isDirectory,
    }) as unknown as Dirent<Buffer>;

  const createMockItem = (fileName: string, size: number, basePath: string): CleanableItem => ({
    fullPath: `${basePath}/${fileName}`,
    fileName,
    sizeInBytes: size,
  });

  let props: Parameters<typeof scanFirefoxCacheProfiles>[0];

  beforeEach(() => {
    mockedScanDirectory.mockResolvedValue([]);
    mockedIsFirefoxProfileDirectory.mockReturnValue(false);
    readdirMock.mockResolvedValue([]);
    props = mockProps<typeof scanFirefoxCacheProfiles>({ firefoxCacheDir });
  });

  it('should return empty array when no entries found in cache directory', async () => {
    // Given/When
    const result = await scanFirefoxCacheProfiles(props);
    // Then
    expect(result).toEqual([]);
    expect(mockedIsFirefoxProfileDirectory).not.toBeCalled();
    expect(mockedScanDirectory).not.toBeCalled();
  });

  it('should scan valid Firefox profile cache directories', async () => {
    // Given
    const profileEntries = [createMockDirent('rwt14re6.default'), createMockDirent('abc123.test-profile')];
    const cacheItems = [
      createMockItem('cache-file1.dat', 1024, '/home/user/.cache/mozilla/firefox/rwt14re6.default/cache2'),
      createMockItem('thumbnail1.png', 512, '/home/user/.cache/mozilla/firefox/rwt14re6.default/thumbnails'),
      createMockItem('startup1.bin', 256, '/home/user/.cache/mozilla/firefox/rwt14re6.default/startupCache'),
    ];
    readdirMock.mockResolvedValue(profileEntries);
    mockedIsFirefoxProfileDirectory
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false);

    mockedScanDirectory
      .mockResolvedValueOnce([cacheItems[0]])
      .mockResolvedValueOnce([cacheItems[1]])
      .mockResolvedValueOnce([cacheItems[2]]);
    // When
    const result = await scanFirefoxCacheProfiles(props);
    // Then
    expect(result).toStrictEqual(cacheItems);
    expect(mockedIsFirefoxProfileDirectory).toBeCalledTimes(2);
    expect(mockedScanDirectory).toBeCalledTimes(3);
  });
});
