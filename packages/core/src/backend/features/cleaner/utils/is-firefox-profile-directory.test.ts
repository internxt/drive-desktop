import { Dirent } from 'node:fs';

import { isFirefoxProfileDirectory } from './is-firefox-profile-directory';

describe('isFirefoxProfileDirectory', () => {
  const createMockDirent = (name: string, isDirectory = true): Dirent =>
    ({
      name,
      isDirectory: () => isDirectory,
      isFile: () => !isDirectory,
    }) as Dirent;

  it.each([
    ['abc123.default', '/home/user/firefox/profiles'],
    ['xyz789.default-esr', '/home/user/.mozilla/firefox/profiles'],
    ['profile.default-release', '/Users/john/Library/Application Support/Firefox/Profiles'],
    ['test123.default', '/path/to/firefox/profiles/subfolder'],
    ['a1b2c3.default-dev', '/PROFILES/firefox'],
    ['123.default', '/home/user/firefox/profiles'],
  ])('should return true for valid Firefox profile directory: "%s" in path "%s"', (entryName, parentPath) => {
    // Given
    const entry = createMockDirent(entryName, true);
    // When
    const result = isFirefoxProfileDirectory({ entry, parentPath });
    // Then
    expect(result).toBe(true);
  });

  it.each([
    ['not-a-profile', '/home/user/firefox/profiles'],
    ['profile', '/home/user/firefox/profiles'],
    ['profile.', '/home/user/firefox/profiles'],
    ['profile.default.extra', '/home/user/firefox/profiles'],
    ['profile-default', '/home/user/firefox/profiles'],
    ['.default', '/home/user/firefox/profiles'],
    ['profile.default-', '/home/user/firefox/profiles'],
  ])('should return false for invalid Firefox profile directory name: "%s"', (entryName, parentPath) => {
    // Given
    const entry = createMockDirent(entryName, true);
    // When
    const result = isFirefoxProfileDirectory({ entry, parentPath });
    // Then
    expect(result).toBe(false);
  });

  it.each([
    ['abc123.default', '/home/user/firefox'],
    ['xyz789.default-esr', '/home/user/documents'],
    ['profile.default-release', '/Users/john/Library'],
    ['test123.default', '/random/path'],
  ])('should return false when parent path does not contain "profiles": "%s" in path "%s"', (entryName, parentPath) => {
    // Given
    const entry = createMockDirent(entryName, true);
    // When
    const result = isFirefoxProfileDirectory({ entry, parentPath });
    // Then
    expect(result).toBe(false);
  });

  it('should return false when entry is not a directory', () => {
    // Given
    const entry = createMockDirent('abc123.default', false);
    // When
    const result = isFirefoxProfileDirectory({ entry, parentPath: '/home/user/firefox/profiles' });
    // Then
    expect(result).toBe(false);
  });
});
