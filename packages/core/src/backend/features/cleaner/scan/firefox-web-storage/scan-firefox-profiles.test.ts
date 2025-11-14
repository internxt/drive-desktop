import { Dirent } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';

import { mockProps, partialSpyOn, deepMocked } from '@/tests/vitest/utils.helper.test';

import * as isFirefoxProfileDirectoryModule from '../../utils/is-firefox-profile-directory';
import * as wasAccessedWithinLastHourModule from '../../utils/was-accessed-within-last-hour';
import { scanFirefoxProfiles } from './scan-firefox-profiles';

vi.mock(import('node:fs/promises'));

describe('scanFirefoxProfiles', () => {
  const firefoxProfilesDir = '/home/user/.mozilla/firefox';
  const mockedIsFirefoxProfileDirectory = partialSpyOn(isFirefoxProfileDirectoryModule, 'isFirefoxProfileDirectory');
  const mockedWasAccessedWithinLastHour = partialSpyOn(wasAccessedWithinLastHourModule, 'wasAccessedWithinLastHour');
  const readdirMock = deepMocked(readdir);
  const statMock = deepMocked(stat);

  const createMockDirent = (name: string, isDirectory = true) =>
    ({
      name,
      isDirectory: () => isDirectory,
      isFile: () => !isDirectory,
    }) as unknown as Dirent<Buffer>;

  let props: Parameters<typeof scanFirefoxProfiles>[0];

  beforeEach(() => {
    mockedIsFirefoxProfileDirectory.mockReturnValue(false);
    readdirMock.mockResolvedValue([]);

    props = mockProps<typeof scanFirefoxProfiles>({
      firefoxProfilesDir,
      ctx: {
        browser: {
          criticalExtensions: [],
          criticalFilenames: [],
        },
      },
    });
  });

  it('should return empty array when no entries found in profiles directory', async () => {
    // Given
    readdirMock.mockResolvedValue([]);
    // When
    const result = await scanFirefoxProfiles(props);
    // Then
    expect(result).toEqual([]);
    expect(mockedIsFirefoxProfileDirectory).not.toBeCalled();
  });

  it('should scan valid Firefox profile directories and filter files', async () => {
    // Given
    props.ctx.browser.criticalExtensions = ['.sqlite', '.sqlite3', '.db'];
    props.ctx.browser.criticalFilenames = ['cookies', 'webappsstore', 'chromeappsstore'];
    const profileEntries = [createMockDirent('profile.default')];
    const profileFiles = [
      createMockDirent('cookies.sqlite', false),
      createMockDirent('webappsstore.sqlite3', false),
      createMockDirent('chromeappsstore.db', false),
      createMockDirent('regular-file.txt', false),
      createMockDirent('prefs.js', false),
      createMockDirent('bookmarks.html', false),
    ];
    statMock.mockResolvedValue({ isFile: () => true, size: 2048 });
    readdirMock.mockResolvedValueOnce(profileEntries).mockResolvedValueOnce(profileFiles);
    mockedIsFirefoxProfileDirectory.mockReturnValue(true);
    mockedWasAccessedWithinLastHour.mockReturnValue(false);
    // When
    const result = await scanFirefoxProfiles(props);
    // Then
    expect(result).toMatchObject([
      {
        fullPath: '/home/user/.mozilla/firefox/profile.default/regular-file.txt',
        fileName: 'regular-file.txt',
        sizeInBytes: 2048,
      },
      {
        fullPath: '/home/user/.mozilla/firefox/profile.default/prefs.js',
        fileName: 'prefs.js',
        sizeInBytes: 2048,
      },
      {
        fullPath: '/home/user/.mozilla/firefox/profile.default/bookmarks.html',
        fileName: 'bookmarks.html',
        sizeInBytes: 2048,
      },
    ]);
  });
});
